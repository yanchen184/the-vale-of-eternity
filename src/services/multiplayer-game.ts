/**
 * Multiplayer Game Service for The Vale of Eternity
 * Handles Firebase Realtime Database synchronization for 2-4 player games
 * @version 3.13.0 - Tengu PUT_ON_DECK_TOP works with returnCardToHand
 */
console.log('[services/multiplayer-game.ts] v3.13.0 loaded')

import { ref, set, get, update, onValue, off, runTransaction } from 'firebase/database'
import { database } from '@/lib/firebase'
import { getAllBaseCards } from '@/data/cards'
import type { CardInstance, CardTemplate } from '@/types/cards'
import { CardLocation, StoneType, Element, EffectType, EffectTrigger } from '@/types/cards'
import { effectProcessor } from './effect-processor'
import { scoreCalculator, type ScoreBreakdown } from './score-calculator'
import { type PlayerColor, getColorByIndex } from '@/types/player-color'

// ============================================
// CONSTANTS
// ============================================

/**
 * Element to coins mapping for selling cards
 * 火元素: 3個1元 (3×1)
 * 水元素: 1個3元 (1×3)
 * 龍元素: 1個6元 (1×6)
 * 風元素: 1個3元 + 1個1元 (1×3 + 1×1 = 4)
 * 土元素: 4個1元 (4×1)
 */
const ELEMENT_SELL_COINS: Record<Element, { type: StoneType; amount: number }[]> = {
  [Element.FIRE]: [{ type: StoneType.ONE, amount: 3 }],
  [Element.WATER]: [{ type: StoneType.THREE, amount: 1 }],
  [Element.DRAGON]: [{ type: StoneType.SIX, amount: 1 }],
  [Element.WIND]: [
    { type: StoneType.THREE, amount: 1 },
    { type: StoneType.ONE, amount: 1 },
  ],
  [Element.EARTH]: [{ type: StoneType.ONE, amount: 4 }],
}

/**
 * Get coin breakdown for selling a card based on its element
 * Returns array of { denomination, count } for display
 */
export function getElementSellCoins(element: Element): { six: number; three: number; one: number } {
  const coins = ELEMENT_SELL_COINS[element] || []
  const result = { six: 0, three: 0, one: 0 }

  coins.forEach(({ type, amount }) => {
    if (type === StoneType.SIX) result.six = amount
    else if (type === StoneType.THREE) result.three = amount
    else if (type === StoneType.ONE) result.one = amount
  })

  return result
}

// ============================================
// TYPES
// ============================================

export interface StonePool {
  ONE: number
  THREE: number
  SIX: number
  WATER: number
  FIRE: number
  EARTH: number
  WIND: number
}

export interface PlayerState {
  playerId: string
  name: string
  index: number  // 0-3 (determines turn order)
  color: PlayerColor  // Player marker color (green, red, purple, black)
  hand: string[]  // card instance IDs
  field: string[]  // card instance IDs
  stones: StonePool
  score: number
  isReady: boolean
  hasPassed: boolean
  isConnected: boolean
  isFlipped: boolean  // Whether player has flipped their card for +60/-60
}

export interface HuntingState {
  round: 1 | 2  // Snake draft has 2 rounds
  currentPlayerIndex: number
  startingPlayerIndex: number  // Which player starts this hunting phase (rotates each game round)
  selections: {
    [playerId: string]: string[]  // selected card IDs (legacy, kept for compatibility)
  }
  /** Confirmed selections - cards locked in after player clicks confirm button */
  /** Can be single cardId (string) or array of cardIds (string[]) for last player */
  confirmedSelections: {
    [playerId: string]: string | string[]  // playerId -> confirmed card ID(s)
  }
  isComplete: boolean
}

export type GamePhase = 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'

export interface GameRoom {
  gameId: string
  roomCode: string  // 6-digit room code
  hostId: string
  status: GamePhase
  currentRound: number
  maxPlayers: 2 | 3 | 4
  playerIds: string[]  // player IDs in turn order

  // Hunting phase
  huntingPhase: HuntingState | null

  // Shared resources
  deckIds: string[]  // remaining deck card IDs
  marketIds: string[]  // market card IDs (6 cards)
  discardIds: string[]  // discard pile
  bankCoins: StonePool  // Bank's coin pool

  // Action phase
  currentPlayerIndex: number
  passedPlayerIds: string[]

  createdAt: number
  updatedAt: number
  startedAt: number | null
  endedAt: number | null
}

export interface CardInstanceData extends Omit<CardInstance, 'effects'> {
  // Simplified for Firebase storage
  cardId: string
  instanceId: string
  location: CardLocation
  ownerId: string | null
  /** Player ID who temporarily selected this card during hunting phase (can be cancelled) */
  selectedBy?: string | null
  /** Player ID who confirmed selection of this card (locked, cannot be cancelled) */
  confirmedBy?: string | null
  /** Round number when this card was acquired by current owner (for sell restriction) */
  acquiredInRound?: number
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a 6-digit room code
 */
function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Create card instances from templates
 */
function createCardInstances(templates: readonly CardTemplate[]): CardInstanceData[] {
  return templates.map((template, index) => ({
    instanceId: `${template.id}-${index}`,
    cardId: template.id,
    name: template.name,
    nameTw: template.nameTw,
    element: template.element,
    cost: template.cost,
    baseScore: template.baseScore,
    ownerId: null,
    location: CardLocation.DECK,
    isRevealed: false,
    scoreModifier: 0,
    hasUsedAbility: false,
  }))
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Calculate Snake Draft order
 * Round 1: [0, 1, 2, 3]
 * Round 2: [3, 2, 1, 0]
 */
function getSnakeDraftOrder(
  playerCount: number,
  round: 1 | 2,
  startingPlayerIndex: number = 0
): number[] {
  // Generate order starting from startingPlayerIndex
  const order: number[] = []
  for (let i = 0; i < playerCount; i++) {
    order.push((startingPlayerIndex + i) % playerCount)
  }
  // Round 2 reverses the order (snake draft)
  return round === 1 ? order : order.reverse()
}

/**
 * Get next player in snake draft
 */
function getNextHuntingPlayer(
  currentIndex: number,
  round: 1 | 2,
  playerCount: number,
  startingPlayerIndex: number = 0
): { nextIndex: number; nextRound: 1 | 2; isComplete: boolean } {
  const order = getSnakeDraftOrder(playerCount, round, startingPlayerIndex)
  const positionInRound = order.indexOf(currentIndex)

  if (positionInRound === order.length - 1) {
    // Last player in this round
    if (round === 2) {
      return { nextIndex: -1, nextRound: 2, isComplete: true }
    } else {
      // Move to round 2
      const round2Order = getSnakeDraftOrder(playerCount, 2, startingPlayerIndex)
      return { nextIndex: round2Order[0], nextRound: 2, isComplete: false }
    }
  } else {
    // Next player in current round
    return { nextIndex: order[positionInRound + 1], nextRound: round, isComplete: false }
  }
}

/**
 * Calculate how many cards a player can select in the current position
 * Snake Draft: Last player in Round 1 can pick 2 cards (consecutive turns)
 * @param playerIndex - Current player's index
 * @param round - Current round (1 or 2)
 * @param playerCount - Total number of players
 * @returns Number of cards the player can select (1 or 2)
 */
export function getPlayerSelectionLimit(
  playerIndex: number,
  round: 1 | 2,
  playerCount: number,
  startingPlayerIndex: number = 0
): number {
  const order = getSnakeDraftOrder(playerCount, round, startingPlayerIndex)
  const positionInRound = order.indexOf(playerIndex)

  // Last player in Round 1 gets to pick 2 cards
  // (They pick at end of Round 1, then immediately pick again at start of Round 2)
  if (round === 1 && positionInRound === order.length - 1) {
    return 2
  }

  return 1
}

// ============================================
// FIREBASE OPERATIONS
// ============================================

export class MultiplayerGameService {
  /**
   * Create a new game room
   */
  async createRoom(
    hostId: string,
    hostName: string,
    maxPlayers: 2 | 3 | 4
  ): Promise<{ gameId: string; roomCode: string }> {
    const roomCode = generateRoomCode()
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const initialPlayerState: PlayerState = {
      playerId: hostId,
      name: hostName,
      index: 0,
      color: getColorByIndex(0), // First player gets green
      hand: [],
      field: [],
      stones: { ONE: 0, THREE: 0, SIX: 0, WATER: 0, FIRE: 0, EARTH: 0, WIND: 0 },
      score: 1, // First player starts with 1 point
      isReady: false,
      hasPassed: false,
      isConnected: true,
      isFlipped: false,
    }

    const gameRoom: GameRoom = {
      gameId,
      roomCode,
      hostId,
      status: 'WAITING',
      currentRound: 0,
      maxPlayers,
      playerIds: [hostId],
      huntingPhase: null,
      deckIds: [],
      marketIds: [],
      discardIds: [],
      bankCoins: { ONE: 999, THREE: 999, SIX: 999, WATER: 0, FIRE: 0, EARTH: 0, WIND: 0 }, // Bank has unlimited 1/3/6 coins
      currentPlayerIndex: 0,
      passedPlayerIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startedAt: null,
      endedAt: null,
    }

    // Write to Firebase
    await set(ref(database, `games/${gameId}`), gameRoom)
    await set(ref(database, `games/${gameId}/players/${hostId}`), initialPlayerState)

    console.log(`[MultiplayerGame] Created room ${roomCode} (${gameId})`)
    return { gameId, roomCode }
  }

  /**
   * Join an existing game room
   */
  async joinRoom(
    roomCode: string,
    playerId: string,
    playerName: string
  ): Promise<string> {
    // Find game by room code
    const gamesRef = ref(database, 'games')
    const snapshot = await get(gamesRef)

    if (!snapshot.exists()) {
      throw new Error('No games found')
    }

    const games = snapshot.val()
    const gameEntry = Object.entries(games).find(
      ([_, game]: [string, any]) => game.roomCode === roomCode
    )

    if (!gameEntry) {
      throw new Error(`Room ${roomCode} not found`)
    }

    const [gameId, gameData] = gameEntry as [string, GameRoom]

    if (gameData.status !== 'WAITING') {
      throw new Error('Game already started')
    }

    if (gameData.playerIds.length >= gameData.maxPlayers) {
      throw new Error('Room is full')
    }

    if (gameData.playerIds.includes(playerId)) {
      throw new Error('Already in this room')
    }

    // Add player
    const playerIndex = gameData.playerIds.length
    const newPlayer: PlayerState = {
      playerId,
      name: playerName,
      index: playerIndex,
      color: getColorByIndex(playerIndex), // Assign color based on player index
      hand: [],
      field: [],
      stones: { ONE: 0, THREE: 0, SIX: 0, WATER: 0, FIRE: 0, EARTH: 0, WIND: 0 },
      score: playerIndex + 1, // Players start with score equal to their position (1, 2, 3, 4)
      isReady: false,
      hasPassed: false,
      isConnected: true,
      isFlipped: false,
    }

    await update(ref(database, `games/${gameId}`), {
      playerIds: [...gameData.playerIds, playerId],
      updatedAt: Date.now(),
    })

    await set(ref(database, `games/${gameId}/players/${playerId}`), newPlayer)

    console.log(`[MultiplayerGame] Player ${playerName} joined room ${roomCode}`)
    return gameId
  }

  /**
   * Start the game (host only)
   */
  async startGame(gameId: string, hostId: string): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    if (game.hostId !== hostId) {
      throw new Error('Only host can start the game')
    }

    if (game.playerIds.length < 2) {
      throw new Error('Need at least 2 players')
    }

    // Initialize deck with all 70 cards
    const allCards = getAllBaseCards()
    const cardInstances = createCardInstances(allCards)
    const shuffledDeck = shuffleArray(cardInstances)

    // Store cards
    const cardUpdates: { [key: string]: CardInstanceData } = {}
    shuffledDeck.forEach(card => {
      cardUpdates[card.instanceId] = card
    })
    await set(ref(database, `games/${gameId}/cards`), cardUpdates)

    // Take cards for market (2 cards × player count)
    // 2 players: 4 cards, 3 players: 6 cards, 4 players: 8 cards
    const marketSize = game.playerIds.length * 2
    const marketCards = shuffledDeck.slice(0, marketSize)
    const remainingDeck = shuffledDeck.slice(marketSize)

    // Update market cards location
    for (const card of marketCards) {
      await update(ref(database, `games/${gameId}/cards/${card.instanceId}`), {
        location: CardLocation.MARKET,
      })
    }

    // Initialize all players' hand and field arrays
    for (const playerId of game.playerIds) {
      await update(ref(database, `games/${gameId}/players/${playerId}`), {
        hand: [],
        field: [],
      })
    }

    // Initialize hunting phase
    const huntingPhase: HuntingState = {
      round: 1,
      currentPlayerIndex: 0,
      selections: {},
      confirmedSelections: {},
      isComplete: false,
    }

    await update(ref(database, `games/${gameId}`), {
      status: 'HUNTING',
      currentRound: 1,
      deckIds: remainingDeck.map(c => c.instanceId),
      marketIds: marketCards.map(c => c.instanceId),
      huntingPhase,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    })

    console.log(`[MultiplayerGame] Game ${gameId} started with ${game.playerIds.length} players`)
  }

  /**
   * Select a card during hunting phase (Snake Draft)
   * Cards are marked with selectedBy but remain in market until hunting phase ends
   */
  async selectCardInHunting(
    gameId: string,
    playerId: string,
    cardInstanceId: string
  ): Promise<void> {
    // First, mark the card as selected by this player
    await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
      selectedBy: playerId,
    })

    await runTransaction(ref(database, `games/${gameId}`), (game: GameRoom | null) => {
      if (!game) return game

      if (game.status !== 'HUNTING' || !game.huntingPhase) {
        throw new Error('Not in hunting phase')
      }

      const currentPlayerIndex = game.huntingPhase.currentPlayerIndex
      const expectedPlayerId = game.playerIds[currentPlayerIndex]

      if (playerId !== expectedPlayerId) {
        throw new Error('Not your turn')
      }

      // Ensure marketIds is initialized
      if (!game.marketIds || !Array.isArray(game.marketIds)) {
        throw new Error('Market is not initialized')
      }

      if (!game.marketIds.includes(cardInstanceId)) {
        throw new Error('Card not in market')
      }

      // Ensure huntingPhase and selections are initialized
      if (!game.huntingPhase.selections) {
        game.huntingPhase.selections = {}
      }

      // Record selection
      if (!game.huntingPhase.selections[playerId]) {
        game.huntingPhase.selections[playerId] = []
      }
      game.huntingPhase.selections[playerId].push(cardInstanceId)

      // DO NOT remove from market - keep card visible with marker
      // game.marketIds = game.marketIds.filter(id => id !== cardInstanceId)

      // Get next player
      const startingPlayerIndex = game.huntingPhase.startingPlayerIndex
      const { nextIndex, nextRound, isComplete } = getNextHuntingPlayer(
        currentPlayerIndex,
        game.huntingPhase.round,
        game.playerIds.length,
        startingPlayerIndex
      )

      if (isComplete) {
        // Hunting phase complete, move to action phase
        game.huntingPhase.isComplete = true
        game.status = 'ACTION'
        game.currentPlayerIndex = 0
        game.passedPlayerIds = []
      } else {
        game.huntingPhase.currentPlayerIndex = nextIndex
        game.huntingPhase.round = nextRound
      }

      game.updatedAt = Date.now()
      return game
    })

    // Check if hunting phase is complete
    const gameSnapshot = await get(ref(database, `games/${gameId}`))
    if (gameSnapshot.exists()) {
      const game: GameRoom = gameSnapshot.val()

      if (game.status === 'ACTION' && game.huntingPhase?.isComplete) {
        // Hunting phase just completed - move all selected cards to players' hands
        await this.distributeSelectedCards(gameId, game.huntingPhase.selections)
      }
    }
  }

  /**
   * Distribute selected cards to players after hunting phase ends
   * @private
   */
  private async distributeSelectedCards(
    gameId: string,
    selections: { [playerId: string]: string[] }
  ): Promise<void> {
    console.log('[MultiplayerGame] Distributing selected cards to players:', selections)

    // Get current round number
    const gameSnapshot = await get(ref(database, `games/${gameId}`))
    if (!gameSnapshot.exists()) return
    const game: GameRoom = gameSnapshot.val()

    // Process each player's selections
    for (const [playerId, cardIds] of Object.entries(selections)) {
      if (!cardIds || !Array.isArray(cardIds)) continue

      // Get current player state
      const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
      if (!playerSnapshot.exists()) continue

      const player: PlayerState = playerSnapshot.val()
      const currentHand = Array.isArray(player.hand) ? player.hand : []
      const currentField = Array.isArray(player.field) ? player.field : []
      const updatedHand = [...currentHand, ...cardIds]

      // Update player's hand and ensure field is initialized
      await update(ref(database, `games/${gameId}/players/${playerId}`), {
        hand: updatedHand,
        field: currentField, // Ensure field array exists
      })

      // Update each card's location and clear selectedBy marker
      for (const cardId of cardIds) {
        await update(ref(database, `games/${gameId}/cards/${cardId}`), {
          location: CardLocation.HAND,
          ownerId: playerId,
          selectedBy: null, // Clear the marker
          acquiredInRound: game.currentRound, // Mark which round this card was acquired
        })
      }
    }

    // Remove selected cards from market
    const allSelectedIds = Object.values(selections).flat()
    const updatedMarketIds = (game.marketIds || []).filter(
      (id: string) => !allSelectedIds.includes(id)
    )
    await update(ref(database, `games/${gameId}`), {
      marketIds: updatedMarketIds,
    })

    console.log('[MultiplayerGame] Card distribution complete')
  }

  /**
   * Toggle card selection during hunting phase (can be cancelled)
   * Click selected card to deselect, click another card to add/switch selection
   * Supports multi-card selection for last player in Round 1 (snake draft rule)
   * @param gameId - Game room ID
   * @param playerId - Player making the selection
   * @param cardInstanceId - Card to toggle selection
   */
  async toggleCardSelection(
    gameId: string,
    playerId: string,
    cardInstanceId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    if (game.status !== 'HUNTING' || !game.huntingPhase) {
      throw new Error('Not in hunting phase')
    }

    const currentPlayerIndex = game.huntingPhase.currentPlayerIndex
    const expectedPlayerId = game.playerIds[currentPlayerIndex]

    if (playerId !== expectedPlayerId) {
      throw new Error('Not your turn')
    }

    // Ensure marketIds is initialized
    if (!game.marketIds || !Array.isArray(game.marketIds)) {
      throw new Error('Market is not initialized')
    }

    if (!game.marketIds.includes(cardInstanceId)) {
      throw new Error('Card not in market')
    }

    // Check if card is already confirmed by another player
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardInstanceId}`))
    if (!cardSnapshot.exists()) {
      throw new Error('Card not found')
    }

    const cardData: CardInstanceData = cardSnapshot.val()
    if (cardData.confirmedBy) {
      throw new Error('Card already confirmed by another player')
    }

    // Get all cards to check current player's selection
    const allCardsSnapshot = await get(ref(database, `games/${gameId}/cards`))
    const allCards = allCardsSnapshot.exists() ? allCardsSnapshot.val() : {}

    // Calculate selection limit for this player
    const selectionLimit = getPlayerSelectionLimit(
      currentPlayerIndex,
      game.huntingPhase.round,
      game.playerIds.length,
      game.huntingPhase.startingPlayerIndex
    )

    // Count current selections by this player
    const currentSelections = Object.values(allCards).filter(
      (card) => (card as CardInstanceData).selectedBy === playerId && !(card as CardInstanceData).confirmedBy
    )
    const currentSelectionCount = currentSelections.length

    // Check if clicking the same card (toggle off)
    if (cardData.selectedBy === playerId) {
      // Deselect this card
      await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
        selectedBy: null,
      })
      console.log(`[MultiplayerGame] Player ${playerId} deselected card ${cardInstanceId}`)
    } else {
      // Check if at selection limit
      if (currentSelectionCount >= selectionLimit) {
        if (selectionLimit === 1) {
          // Single selection mode: clear previous and select new
          for (const [instanceId, card] of Object.entries(allCards)) {
            const c = card as CardInstanceData
            if (c.selectedBy === playerId && !c.confirmedBy) {
              await update(ref(database, `games/${gameId}/cards/${instanceId}`), {
                selectedBy: null,
              })
            }
          }
        } else {
          // Multi-selection mode: already at limit, cannot add more
          throw new Error(`最多只能選擇 ${selectionLimit} 張卡片`)
        }
      }

      // Select the new card
      await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
        selectedBy: playerId,
      })
      console.log(`[MultiplayerGame] Player ${playerId} selected card ${cardInstanceId} (${currentSelectionCount + 1}/${selectionLimit})`)
    }

    // Update game timestamp
    await update(gameRef, {
      updatedAt: Date.now(),
    })
  }

  /**
   * Confirm card selection and advance to next player
   * Once confirmed, the selection cannot be cancelled
   * Supports multi-card selection for last player in Round 1 (snake draft rule)
   * @param gameId - Game room ID
   * @param playerId - Player confirming selection
   */
  async confirmCardSelection(
    gameId: string,
    playerId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    if (game.status !== 'HUNTING' || !game.huntingPhase) {
      throw new Error('Not in hunting phase')
    }

    const currentPlayerIndex = game.huntingPhase.currentPlayerIndex
    const expectedPlayerId = game.playerIds[currentPlayerIndex]

    if (playerId !== expectedPlayerId) {
      throw new Error('Not your turn')
    }

    // Calculate how many cards this player should select
    const selectionLimit = getPlayerSelectionLimit(
      currentPlayerIndex,
      game.huntingPhase.round,
      game.playerIds.length,
      game.huntingPhase.startingPlayerIndex
    )

    // Find ALL cards selected by this player (not yet confirmed)
    const allCardsSnapshot = await get(ref(database, `games/${gameId}/cards`))
    if (!allCardsSnapshot.exists()) {
      throw new Error('No cards found')
    }

    const allCards = allCardsSnapshot.val() as Record<string, CardInstanceData>
    const selectedCards = Object.values(allCards).filter(
      card => card.selectedBy === playerId && !card.confirmedBy
    )

    // Validate selection count
    if (selectedCards.length === 0) {
      throw new Error('No card selected')
    }

    if (selectedCards.length !== selectionLimit) {
      throw new Error(`請選擇 ${selectionLimit} 張卡片 (目前已選 ${selectedCards.length} 張)`)
    }

    // Mark all selected cards as confirmed (locked)
    const selectedCardIds = selectedCards.map(c => c.instanceId)
    for (const card of selectedCards) {
      await update(ref(database, `games/${gameId}/cards/${card.instanceId}`), {
        confirmedBy: playerId,
        selectedBy: null, // Clear selectedBy, now using confirmedBy
      })
    }

    // Initialize confirmedSelections if it doesn't exist
    const confirmedSelections = game.huntingPhase.confirmedSelections || {}

    // Initialize player's selection array if needed
    if (!confirmedSelections[playerId]) {
      confirmedSelections[playerId] = []
    }

    // Always store as array and accumulate selections across multiple confirmations
    // This handles the case where a player confirms multiple times (e.g., Round 1 + Round 2)
    const existingSelections = Array.isArray(confirmedSelections[playerId])
      ? confirmedSelections[playerId]
      : [confirmedSelections[playerId]]

    confirmedSelections[playerId] = [...existingSelections, ...selectedCardIds]

    // Also update legacy selections for backward compatibility
    const selections = game.huntingPhase.selections || {}
    if (!selections[playerId]) {
      selections[playerId] = []
    }
    selections[playerId].push(...selectedCardIds)

    // Get next player in snake draft
    // For last player in Round 1 who picks 2 cards, skip Round 2's first turn
    const startingPlayerIndex = game.huntingPhase.startingPlayerIndex
    const { nextIndex, nextRound, isComplete } = getNextHuntingPlayer(
      currentPlayerIndex,
      game.huntingPhase.round,
      game.playerIds.length,
      startingPlayerIndex
    )

    // Special handling: if player selected 2 cards, they consumed both R1 last + R2 first turn
    // So we need to advance to the next player in Round 2
    let finalNextIndex = nextIndex
    let finalNextRound = nextRound
    let finalIsComplete = isComplete

    if (selectionLimit === 2 && !isComplete) {
      // Player picked 2 cards, skip their Round 2 first turn
      const nextResult = getNextHuntingPlayer(
        nextIndex,
        nextRound,
        game.playerIds.length,
        startingPlayerIndex
      )
      finalNextIndex = nextResult.nextIndex
      finalNextRound = nextResult.nextRound
      finalIsComplete = nextResult.isComplete
    }

    // Check if hunting phase is complete (all rounds finished)
    // finalIsComplete is true when getNextHuntingPlayer returns isComplete=true
    const huntingComplete = finalIsComplete

    // Count remaining unconfirmed cards in market
    const unconfirmedMarketCards = Object.values(allCards).filter(
      card => card.location === CardLocation.MARKET && !card.confirmedBy
    )

    // Special case: If only 1 card remains, auto-assign to first player and skip to ACTION
    if (unconfirmedMarketCards.length === 1 && !huntingComplete) {
      const lastCard = unconfirmedMarketCards[0]
      const firstPlayerId = game.playerIds[0]

      // Mark last card as confirmed by first player
      await update(ref(database, `games/${gameId}/cards/${lastCard.instanceId}`), {
        confirmedBy: firstPlayerId,
        selectedBy: null,
      })

      // Add to first player's confirmed selections
      if (!confirmedSelections[firstPlayerId]) {
        confirmedSelections[firstPlayerId] = []
      }
      const firstPlayerSelections = Array.isArray(confirmedSelections[firstPlayerId])
        ? confirmedSelections[firstPlayerId]
        : [confirmedSelections[firstPlayerId]]
      confirmedSelections[firstPlayerId] = [...firstPlayerSelections, lastCard.instanceId]

      // Also update selections
      if (!selections[firstPlayerId]) {
        selections[firstPlayerId] = []
      }
      selections[firstPlayerId].push(lastCard.instanceId)

      // Move to ACTION phase immediately
      await update(gameRef, {
        'huntingPhase/confirmedSelections': confirmedSelections,
        'huntingPhase/selections': selections,
        'huntingPhase/isComplete': true,
        status: 'ACTION',
        currentPlayerIndex: 0,
        passedPlayerIds: [],
        updatedAt: Date.now(),
      })

      await this.distributeConfirmedCards(gameId)
      console.log(`[MultiplayerGame] Last card auto-assigned to first player, moving to ACTION phase`)
      return
    }

    // Update game state
    if (huntingComplete) {
      // Hunting phase complete (all rounds finished)
      await update(gameRef, {
        'huntingPhase/confirmedSelections': confirmedSelections,
        'huntingPhase/selections': selections,
        'huntingPhase/isComplete': true,
        status: 'ACTION',
        currentPlayerIndex: 0,
        passedPlayerIds: [],
        updatedAt: Date.now(),
      })

      // Distribute confirmed cards to players
      await this.distributeConfirmedCards(gameId)
      console.log(`[MultiplayerGame] All players confirmed selections, moving to ACTION phase`)
    } else {
      // Not all players confirmed yet, move to next player
      await update(gameRef, {
        'huntingPhase/confirmedSelections': confirmedSelections,
        'huntingPhase/selections': selections,
        'huntingPhase/currentPlayerIndex': finalNextIndex,
        'huntingPhase/round': finalNextRound,
        updatedAt: Date.now(),
      })
    }

    console.log(`[MultiplayerGame] Player ${playerId} confirmed selection of ${selectedCardIds.length} card(s): ${selectedCardIds.join(', ')}`)
  }

  /**
   * Distribute confirmed cards to players' hands after hunting phase ends
   * Supports both single card (string) and multiple cards (string[]) per player
   * @private
   */
  private async distributeConfirmedCards(gameId: string): Promise<void> {
    const gameSnapshot = await get(ref(database, `games/${gameId}`))
    if (!gameSnapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = gameSnapshot.val()
    const confirmedSelections = game.huntingPhase?.confirmedSelections || {}

    console.log('[MultiplayerGame] Distributing confirmed cards:', confirmedSelections)

    const allConfirmedCardIds: string[] = []

    for (const [playerId, cardData] of Object.entries(confirmedSelections)) {
      if (!cardData) continue

      // CardData should always be an array now (after fix in confirmCardSelection)
      // But keep backward compatibility check just in case
      const cardIds = Array.isArray(cardData) ? cardData : [cardData]
      allConfirmedCardIds.push(...cardIds)

      // Get current player state
      const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
      if (!playerSnapshot.exists()) continue

      const player: PlayerState = playerSnapshot.val()
      const currentHand = Array.isArray(player.hand) ? player.hand : []
      const currentField = Array.isArray(player.field) ? player.field : []
      const updatedHand = [...currentHand, ...cardIds]

      // Update player's hand
      await update(ref(database, `games/${gameId}/players/${playerId}`), {
        hand: updatedHand,
        field: currentField,
      })

      // Update each card's location and clear markers
      for (const cardId of cardIds) {
        await update(ref(database, `games/${gameId}/cards/${cardId}`), {
          location: CardLocation.HAND,
          ownerId: playerId,
          selectedBy: null,
          confirmedBy: null,
          acquiredInRound: game.currentRound, // Mark which round this card was acquired
        })
      }
    }

    // Remove confirmed cards from market
    const updatedMarketIds = (game.marketIds || []).filter(
      (id: string) => !allConfirmedCardIds.includes(id)
    )
    await update(ref(database, `games/${gameId}`), {
      marketIds: updatedMarketIds,
    })

    console.log('[MultiplayerGame] Confirmed card distribution complete')
  }

  /**
   * Tame a card from hand to field (Action Phase)
   */
  async tameCard(
    gameId: string,
    playerId: string,
    cardInstanceId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    if (game.status !== 'ACTION') {
      throw new Error('Not in action phase')
    }

    const currentPlayerIndex = game.currentPlayerIndex
    const expectedPlayerId = game.playerIds[currentPlayerIndex]

    if (playerId !== expectedPlayerId) {
      throw new Error('Not your turn')
    }

    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()

    // Ensure hand array exists
    if (!player.hand || !Array.isArray(player.hand)) {
      throw new Error('Player hand is not initialized')
    }

    if (!player.hand.includes(cardInstanceId)) {
      throw new Error('Card not in hand')
    }

    // Get card data
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardInstanceId}`))
    if (!cardSnapshot.exists()) {
      throw new Error('Card not found')
    }

    // Move card from hand to field (NO automatic payment - player pays manually)
    // Ensure arrays exist
    const currentHand = Array.isArray(player.hand) ? player.hand : []
    const currentField = Array.isArray(player.field) ? player.field : []
    const updatedHand = currentHand.filter(id => id !== cardInstanceId)
    const updatedField = [...currentField, cardInstanceId]

    // Update player state (only move card, don't touch stones)
    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      hand: updatedHand,
      field: updatedField,
    })

    // Update card location
    await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
      location: CardLocation.FIELD,
    })

    console.log(`[MultiplayerGame] Player ${playerId} tamed card ${cardInstanceId} (manual payment)`)

    // Process ON_TAME effects (⚡)
    const allPlayersSnapshot = await get(ref(database, `games/${gameId}/players`))
    const allPlayers = allPlayersSnapshot.exists() ? allPlayersSnapshot.val() : {}

    const allCardsSnapshot = await get(ref(database, `games/${gameId}/cards`))
    const allCards = allCardsSnapshot.exists() ? allCardsSnapshot.val() : {}

    const effectContext = {
      gameId,
      playerId,
      cardInstanceId,
      currentPlayerState: { ...player, hand: updatedHand, field: updatedField },
      allPlayers,
      gameCards: allCards,
    }

    try {
      const effectResults = await effectProcessor.processOnTameEffects(effectContext)
      console.log(`[MultiplayerGame] ON_TAME effects processed:`, effectResults)
    } catch (error) {
      console.error(`[MultiplayerGame] Error processing ON_TAME effects:`, error)
      // Don't throw - card is already tamed, just log the error
    }
  }

  /**
   * Return a card from field back to hand (undo taming)
   * Special case: Cards with PUT_ON_DECK_TOP effect (like Tengu) go to deck top instead
   */
  async returnCardToHand(
    gameId: string,
    playerId: string,
    cardInstanceId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    if (game.status !== 'ACTION') {
      throw new Error('Not in action phase')
    }

    const currentPlayerIndex = game.currentPlayerIndex
    const expectedPlayerId = game.playerIds[currentPlayerIndex]

    if (playerId !== expectedPlayerId) {
      throw new Error('Not your turn')
    }

    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()

    // Ensure field array exists
    if (!player.field || !Array.isArray(player.field)) {
      throw new Error('Player field is not initialized')
    }

    if (!player.field.includes(cardInstanceId)) {
      throw new Error('Card not in field')
    }

    // Get card data to check if it has special return behavior
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardInstanceId}`))
    if (!cardSnapshot.exists()) {
      throw new Error('Card not found')
    }

    const card: CardInstanceData = cardSnapshot.val()

    // Get card template to check for PUT_ON_DECK_TOP effect
    const allCards = getAllBaseCards()
    const cardTemplate = allCards.find(c => c.id === card.cardId)

    console.log(`[MultiplayerGame] 🔍 Returning field card ${cardInstanceId}`)
    console.log(`[MultiplayerGame] 🔍 Card.cardId:`, card.cardId)
    console.log(`[MultiplayerGame] 🔍 Card.name:`, card.name, card.nameTw)
    console.log(`[MultiplayerGame] 🔍 Card template found:`, cardTemplate?.id, cardTemplate?.name, cardTemplate?.nameTw)
    console.log(`[MultiplayerGame] 🔍 Card template effects:`, cardTemplate?.effects)

    const hasDeckTopEffect = cardTemplate?.effects?.some(
      e => e.type === EffectType.PUT_ON_DECK_TOP
    )

    console.log(`[MultiplayerGame] 🔍 Has PUT_ON_DECK_TOP effect:`, hasDeckTopEffect)
    console.log(`[MultiplayerGame] 🔍 EffectType.PUT_ON_DECK_TOP value:`, EffectType.PUT_ON_DECK_TOP)

    // Remove from field
    const currentField = Array.isArray(player.field) ? player.field : []
    const updatedField = currentField.filter(id => id !== cardInstanceId)

    if (hasDeckTopEffect) {
      // Special case: Card goes to top of deck (like Tengu 天狗)
      console.log(`[MultiplayerGame] ⭐ TENGU SPECIAL: Card ${card.nameTw || card.name} returning to TOP of deck!`)

      await update(ref(database, `games/${gameId}/players/${playerId}`), {
        field: updatedField,
      })

      await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
        location: CardLocation.DECK,
        ownerId: null,
      })

      // Add to top of deck (unshift to beginning of array)
      const currentDeckIds = Array.isArray(game.deckIds) ? game.deckIds : []
      const newDeckIds = [cardInstanceId, ...currentDeckIds]
      await update(ref(database, `games/${gameId}`), {
        deckIds: newDeckIds,
        updatedAt: Date.now(),
      })

      console.log(`[MultiplayerGame] ✅ ${card.nameTw || card.name} is now at top of deck (position 0 in deckIds array)`)
      console.log(`[MultiplayerGame] Deck now has ${newDeckIds.length} cards, first card is: ${newDeckIds[0]}`)
    } else {
      // Normal case: Card returns to hand
      const currentHand = Array.isArray(player.hand) ? player.hand : []
      const updatedHand = [...currentHand, cardInstanceId]

      await update(ref(database, `games/${gameId}/players/${playerId}`), {
        hand: updatedHand,
        field: updatedField,
      })

      await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
        location: CardLocation.HAND,
      })

      console.log(`[MultiplayerGame] Player ${playerId} returned card ${cardInstanceId} to hand`)
    }
  }

  /**
   * Sell a card from hand for coins based on element (Action Phase)
   * Auto-gives coins to player based on card element
   */
  async sellCard(
    gameId: string,
    playerId: string,
    cardInstanceId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    if (game.status !== 'ACTION') {
      throw new Error('Not in action phase')
    }

    const currentPlayerIndex = game.currentPlayerIndex
    const expectedPlayerId = game.playerIds[currentPlayerIndex]

    if (playerId !== expectedPlayerId) {
      throw new Error('Not your turn')
    }

    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()

    // Ensure hand array exists
    if (!player.hand || !Array.isArray(player.hand)) {
      throw new Error('Player hand is not initialized')
    }

    if (!player.hand.includes(cardInstanceId)) {
      throw new Error('Card not in hand')
    }

    // Get card data
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardInstanceId}`))
    if (!cardSnapshot.exists()) {
      throw new Error('Card not found')
    }

    const card: CardInstanceData = cardSnapshot.val()

    // Check if card can be sold (only cards acquired in current round)
    if (card.acquiredInRound !== game.currentRound) {
      throw new Error('只能賣出本回合獲得的卡片')
    }

    // Get card template to find element
    const allCards = getAllBaseCards()
    const cardTemplate = allCards.find(c => c.id === card.cardId)
    if (!cardTemplate) {
      throw new Error(`Card template not found for ${card.cardId}`)
    }

    // Get coins based on element
    const coinsToGive = ELEMENT_SELL_COINS[cardTemplate.element]
    if (!coinsToGive) {
      throw new Error(`No sell coins defined for element ${cardTemplate.element}`)
    }

    // Calculate new stone amounts
    const updatedStones = { ...player.stones }
    coinsToGive.forEach(({ type, amount }) => {
      updatedStones[type] = (updatedStones[type] || 0) + amount
    })

    // Move card from hand to discard
    const currentHand = Array.isArray(player.hand) ? player.hand : []
    const updatedHand = currentHand.filter(id => id !== cardInstanceId)

    // Update player state (remove card from hand AND give coins)
    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      hand: updatedHand,
      stones: updatedStones,
    })

    // Update card location
    await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
      location: CardLocation.DISCARD,
    })

    // Add to game discard pile
    const currentDiscardIds = Array.isArray(game.discardIds) ? game.discardIds : []
    await update(ref(database, `games/${gameId}`), {
      discardIds: [...currentDiscardIds, cardInstanceId],
      updatedAt: Date.now(),
    })

    // Format coins for logging
    const coinsDescription = coinsToGive
      .map(({ type, amount }) => `${amount}×${type}`)
      .join(' + ')

    console.log(
      `[MultiplayerGame] Player ${playerId} sold ${cardTemplate.element} card ${cardInstanceId} (${card.name}) and received ${coinsDescription}`
    )
  }

  /**
   * Return a sold card from discard pile back to hand (undo sell, Action Phase)
   * Returns the coins that were received from selling
   */
  async returnCardFromDiscard(
    gameId: string,
    playerId: string,
    cardInstanceId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    if (game.status !== 'ACTION') {
      throw new Error('Not in action phase')
    }

    const currentPlayerIndex = game.currentPlayerIndex
    const expectedPlayerId = game.playerIds[currentPlayerIndex]

    if (playerId !== expectedPlayerId) {
      throw new Error('Not your turn')
    }

    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()

    // Check if card is in discard pile
    const currentDiscardIds = Array.isArray(game.discardIds) ? game.discardIds : []
    if (!currentDiscardIds.includes(cardInstanceId)) {
      throw new Error('Card not in discard pile')
    }

    // Get card data
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardInstanceId}`))
    if (!cardSnapshot.exists()) {
      throw new Error('Card not found')
    }

    const card: CardInstanceData = cardSnapshot.val()

    // Verify card was owned by this player (or allow any player to take from discard?)
    // For now, only allow the original owner to return
    if (card.ownerId !== playerId) {
      throw new Error('You can only return cards you sold')
    }

    // Get card template to find element and calculate coins to return
    const allCards = getAllBaseCards()
    const cardTemplate = allCards.find(c => c.id === card.cardId)
    if (!cardTemplate) {
      throw new Error(`Card template not found for ${card.cardId}`)
    }

    // Get coins that were given when selling
    const coinsToReturn = ELEMENT_SELL_COINS[cardTemplate.element]
    if (!coinsToReturn) {
      throw new Error(`No sell coins defined for element ${cardTemplate.element}`)
    }

    // Calculate new stone amounts (subtract the coins)
    const updatedStones = { ...player.stones }
    let canReturn = true
    coinsToReturn.forEach(({ type, amount }) => {
      const currentAmount = updatedStones[type] || 0
      if (currentAmount < amount) {
        canReturn = false
      }
    })

    if (!canReturn) {
      throw new Error('Not enough coins to return (you must have used some of the coins already)')
    }

    // Deduct coins
    coinsToReturn.forEach(({ type, amount }) => {
      updatedStones[type] = (updatedStones[type] || 0) - amount
    })

    // Move card from discard to hand
    const currentHand = Array.isArray(player.hand) ? player.hand : []
    const updatedHand = [...currentHand, cardInstanceId]
    const updatedDiscardIds = currentDiscardIds.filter(id => id !== cardInstanceId)

    // Update player state (add card to hand AND remove coins)
    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      hand: updatedHand,
      stones: updatedStones,
    })

    // Update card location
    await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
      location: CardLocation.HAND,
    })

    // Update game discard pile
    await update(ref(database, `games/${gameId}`), {
      discardIds: updatedDiscardIds,
      updatedAt: Date.now(),
    })

    // Format coins for logging
    const coinsDescription = coinsToReturn
      .map(({ type, amount }) => `${amount}×${type}`)
      .join(' + ')

    console.log(
      `[MultiplayerGame] Player ${playerId} returned ${cardTemplate.element} card ${cardInstanceId} (${card.name}) from discard and returned ${coinsDescription}`
    )
  }

  /**
   * Take a card from market discard pile
   * - If your turn: take to hand (ACTION phase only)
   * - If not your turn: take to field (any phase except WAITING/ENDED)
   * No cost - just moves card from market discard to player's hand/field
   */
  async takeCardFromMarketDiscard(
    gameId: string,
    playerId: string,
    cardInstanceId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    if (game.status === 'WAITING' || game.status === 'ENDED') {
      throw new Error('Cannot take cards during WAITING or ENDED phase')
    }

    const currentPlayerIndex = game.currentPlayerIndex
    const expectedPlayerId = game.playerIds[currentPlayerIndex]
    const isYourTurn = playerId === expectedPlayerId

    // If it's your turn, must be in ACTION phase
    if (isYourTurn && game.status !== 'ACTION') {
      throw new Error('Can only take cards to hand during ACTION phase')
    }

    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()

    // Check if card is in market discard pile
    const currentDiscardIds = Array.isArray(game.discardIds) ? game.discardIds : []
    if (!currentDiscardIds.includes(cardInstanceId)) {
      throw new Error('Card not in market discard pile')
    }

    // Get card data
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardInstanceId}`))
    if (!cardSnapshot.exists()) {
      throw new Error('Card not found')
    }

    const card: CardInstanceData = cardSnapshot.val()
    const updatedDiscardIds = currentDiscardIds.filter(id => id !== cardInstanceId)

    if (isYourTurn) {
      // Your turn: Take to hand
      const currentHand = Array.isArray(player.hand) ? player.hand : []
      const updatedHand = [...currentHand, cardInstanceId]

      await update(ref(database, `games/${gameId}/players/${playerId}`), {
        hand: updatedHand,
      })

      // Update card location and owner
      await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
        location: CardLocation.HAND,
        ownerId: playerId,
        acquiredInRound: game.currentRound, // Mark which round this card was acquired
      })

      console.log(
        `[MultiplayerGame] Player ${playerId} took card ${cardInstanceId} (${card.name}) from market discard pile to HAND`
      )
    } else {
      // Not your turn: Take to field
      const currentField = Array.isArray(player.field) ? player.field : []
      const updatedField = [...currentField, cardInstanceId]

      await update(ref(database, `games/${gameId}/players/${playerId}`), {
        field: updatedField,
      })

      // Update card location and owner
      await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
        location: CardLocation.FIELD,
        ownerId: playerId,
        acquiredInRound: game.currentRound, // Mark which round this card was acquired
      })

      console.log(
        `[MultiplayerGame] Player ${playerId} took card ${cardInstanceId} (${card.name}) from market discard pile to FIELD (not their turn)`
      )
    }

    // Update game market discard pile
    await update(ref(database, `games/${gameId}`), {
      discardIds: updatedDiscardIds,
      updatedAt: Date.now(),
    })

    console.log(
      `[MultiplayerGame] Player ${playerId} took card ${cardInstanceId} (${card.name}) from market discard pile to hand`
    )
  }

  /**
   * Return a field card back to hand (Resolution Phase or when card effect requires it)
   */
  async returnFieldCardToHand(
    gameId: string,
    playerId: string,
    cardInstanceId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()

    // Check if card is in player's field
    const currentField = Array.isArray(player.field) ? player.field : []
    if (!currentField.includes(cardInstanceId)) {
      throw new Error('Card not in field')
    }

    // Get card data to check if it has special return behavior
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardInstanceId}`))
    if (!cardSnapshot.exists()) {
      throw new Error('Card not found')
    }

    const card: CardInstanceData = cardSnapshot.val()

    // Get card template to check for PUT_ON_DECK_TOP effect
    const allCards = getAllBaseCards()
    const cardTemplate = allCards.find(c => c.id === card.cardId)

    console.log(`[MultiplayerGame] 🔍 Returning field card ${cardInstanceId}`)
    console.log(`[MultiplayerGame] 🔍 Card.cardId:`, card.cardId)
    console.log(`[MultiplayerGame] 🔍 Card.name:`, card.name, card.nameTw)
    console.log(`[MultiplayerGame] 🔍 Card template found:`, cardTemplate?.id, cardTemplate?.name, cardTemplate?.nameTw)
    console.log(`[MultiplayerGame] 🔍 Card template effects:`, cardTemplate?.effects)

    const hasDeckTopEffect = cardTemplate?.effects?.some(
      e => e.type === EffectType.PUT_ON_DECK_TOP
    )

    console.log(`[MultiplayerGame] 🔍 Has PUT_ON_DECK_TOP effect:`, hasDeckTopEffect)
    console.log(`[MultiplayerGame] 🔍 EffectType.PUT_ON_DECK_TOP value:`, EffectType.PUT_ON_DECK_TOP)

    // Remove from field
    const updatedField = currentField.filter(id => id !== cardInstanceId)

    if (hasDeckTopEffect) {
      // Special case: Card goes to top of deck (like Tengu 天狗)
      console.log(`[MultiplayerGame] ⭐ TENGU SPECIAL: Card ${card.nameTw || card.name} returning to TOP of deck!`)

      await update(ref(database, `games/${gameId}/players/${playerId}`), {
        field: updatedField,
      })

      await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
        location: CardLocation.DECK,
        ownerId: null,
      })

      // Add to top of deck (unshift to beginning of array)
      const currentDeckIds = Array.isArray(game.deckIds) ? game.deckIds : []
      const newDeckIds = [cardInstanceId, ...currentDeckIds]
      await update(ref(database, `games/${gameId}`), {
        deckIds: newDeckIds,
        updatedAt: Date.now(),
      })

      console.log(`[MultiplayerGame] ✅ ${card.nameTw || card.name} is now at top of deck (position 0 in deckIds array)`)
      console.log(`[MultiplayerGame] Deck now has ${newDeckIds.length} cards, first card is: ${newDeckIds[0]}`)
    } else {
      // Normal case: Card returns to hand
      const currentHand = Array.isArray(player.hand) ? player.hand : []
      const updatedHand = [...currentHand, cardInstanceId]

      await update(ref(database, `games/${gameId}/players/${playerId}`), {
        hand: updatedHand,
        field: updatedField,
      })

      await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
        location: CardLocation.HAND,
      })

      console.log(`[MultiplayerGame] Player ${playerId} returned ${cardInstanceId} from field to hand`)
    }
  }

  /**
   * Discard a field card (Action/Resolution Phase)
   */
  async discardFieldCard(
    gameId: string,
    playerId: string,
    cardInstanceId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()

    // Check if card is in player's field
    const currentField = Array.isArray(player.field) ? player.field : []
    if (!currentField.includes(cardInstanceId)) {
      throw new Error('Card not in field')
    }

    // Remove from field
    const updatedField = currentField.filter(id => id !== cardInstanceId)

    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      field: updatedField,
    })

    await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
      location: CardLocation.DISCARD,
    })

    // Add to game discard pile
    const currentDiscardIds = Array.isArray(game.discardIds) ? game.discardIds : []
    await update(ref(database, `games/${gameId}`), {
      discardIds: [...currentDiscardIds, cardInstanceId],
      updatedAt: Date.now(),
    })

    console.log(`[MultiplayerGame] Player ${playerId} discarded ${cardInstanceId} from field`)
  }

  /**
   * Discard a hand card (can be done anytime during your turn, including Resolution phase)
   * Removes card from hand and adds to discard pile
   */
  async discardHandCard(
    gameId: string,
    playerId: string,
    cardInstanceId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    if (game.status !== 'ACTION' && game.status !== 'RESOLUTION') {
      throw new Error('Can only discard cards during Action or Resolution phase')
    }

    const currentPlayerIndex = game.currentPlayerIndex
    const expectedPlayerId = game.playerIds[currentPlayerIndex]

    if (playerId !== expectedPlayerId) {
      throw new Error('Not your turn')
    }

    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()

    // Check if card is in player's hand
    const currentHand = Array.isArray(player.hand) ? player.hand : []
    if (!currentHand.includes(cardInstanceId)) {
      throw new Error('Card not in hand')
    }

    // Get card data
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardInstanceId}`))
    if (!cardSnapshot.exists()) {
      throw new Error('Card not found')
    }

    const card: CardInstanceData = cardSnapshot.val()

    // Remove from hand
    const updatedHand = currentHand.filter(id => id !== cardInstanceId)

    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      hand: updatedHand,
    })

    await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
      location: CardLocation.DISCARD,
    })

    // Add to game discard pile
    const currentDiscardIds = Array.isArray(game.discardIds) ? game.discardIds : []
    await update(ref(database, `games/${gameId}`), {
      discardIds: [...currentDiscardIds, cardInstanceId],
      updatedAt: Date.now(),
    })

    console.log(`[MultiplayerGame] Player ${playerId} discarded ${cardInstanceId} (${card.name}) from hand`)
  }

  /**
   * Draw a card from the top of the deck to hand
   * Can be done during Action or Resolution phase on your turn
   */
  async drawCardFromDeck(
    gameId: string,
    playerId: string
  ): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)

    if (!snapshot.exists()) {
      throw new Error('Game not found')
    }

    const game: GameRoom = snapshot.val()

    if (game.status !== 'ACTION' && game.status !== 'RESOLUTION') {
      throw new Error('Can only draw cards during Action or Resolution phase')
    }

    const currentPlayerIndex = game.currentPlayerIndex
    const expectedPlayerId = game.playerIds[currentPlayerIndex]

    if (playerId !== expectedPlayerId) {
      throw new Error('Not your turn')
    }

    // Check if deck has cards
    const currentDeckIds = Array.isArray(game.deckIds) ? game.deckIds : []
    if (currentDeckIds.length === 0) {
      throw new Error('Deck is empty')
    }

    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()

    // Draw top card (first card in deckIds array)
    const drawnCardId = currentDeckIds[0]
    const remainingDeckIds = currentDeckIds.slice(1)

    console.log(`[MultiplayerGame] 🎴 DRAWING CARD FROM DECK TOP`)
    console.log(`[MultiplayerGame] Deck before draw:`, currentDeckIds.slice(0, 3), `... (${currentDeckIds.length} total)`)
    console.log(`[MultiplayerGame] Drawing card:`, drawnCardId)

    // Get card info for better logging
    const drawnCardSnapshot = await get(ref(database, `games/${gameId}/cards/${drawnCardId}`))
    if (drawnCardSnapshot.exists()) {
      const drawnCard = drawnCardSnapshot.val()
      console.log(`[MultiplayerGame] ✅ Drew: ${drawnCard.nameTw || drawnCard.name} (${drawnCardId})`)
    }

    // Add to player's hand
    const currentHand = Array.isArray(player.hand) ? player.hand : []
    const updatedHand = [...currentHand, drawnCardId]

    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      hand: updatedHand,
    })

    // Update card location (DO NOT set acquiredInRound - drawn cards cannot be sold)
    await update(ref(database, `games/${gameId}/cards/${drawnCardId}`), {
      location: CardLocation.HAND,
      ownerId: playerId,
      // Explicitly DO NOT set acquiredInRound here
      // This ensures drawn cards from deck cannot be sold (only hunting phase cards can)
    })

    // Update deck
    await update(ref(database, `games/${gameId}`), {
      deckIds: remainingDeckIds,
      updatedAt: Date.now(),
    })

    console.log(`[MultiplayerGame] Deck after draw: ${remainingDeckIds.length} cards remaining`)
    console.log(`[MultiplayerGame] Player ${playerId} now has ${updatedHand.length} cards in hand`)
  }

  /**
   * Pass turn (Action Phase)
   */
  async passTurn(gameId: string, playerId: string): Promise<void> {
    await runTransaction(ref(database, `games/${gameId}`), (game: GameRoom | null) => {
      if (!game) return game

      if (game.status !== 'ACTION' && game.status !== 'RESOLUTION') {
        throw new Error('Not in action or resolution phase')
      }

      const currentPlayerIndex = game.currentPlayerIndex
      const expectedPlayerId = game.playerIds[currentPlayerIndex]

      if (playerId !== expectedPlayerId) {
        throw new Error('Not your turn')
      }

      // Ensure passedPlayerIds is initialized
      if (!Array.isArray(game.passedPlayerIds)) {
        game.passedPlayerIds = []
      }

      // Mark player as passed
      if (!game.passedPlayerIds.includes(playerId)) {
        game.passedPlayerIds.push(playerId)
      }

      // Check if all players have passed
      if (game.passedPlayerIds.length === game.playerIds.length) {
        if (game.status === 'ACTION') {
          // All players passed in ACTION → Move to RESOLUTION phase
          game.status = 'RESOLUTION'
          game.currentPlayerIndex = 0  // Start resolution from first player
          game.passedPlayerIds = []  // Reset for tracking who finished resolution
          console.log(`[MultiplayerGame] All players passed, moving to RESOLUTION phase for game ${game.gameId}`)
        } else if (game.status === 'RESOLUTION') {
          // All players finished RESOLUTION → Start next round
          game.currentRound += 1
          game.status = 'HUNTING'

          // Rotate starting player: Round 1 → Player 0, Round 2 → Player 1, etc.
          const startingPlayerIndex = (game.currentRound - 1) % game.playerIds.length
          console.log(
            `[MultiplayerGame] v1.1.19 Starting Round ${game.currentRound} - Starting player index: ${startingPlayerIndex}`
          )
          game.currentPlayerIndex = startingPlayerIndex
          game.passedPlayerIds = []

          // Reset market cards (draw new cards)
          const marketSize = game.playerIds.length + 2
          const newMarketCards: string[] = []
          for (let i = 0; i < marketSize && game.deckIds.length > 0; i++) {
            const cardId = game.deckIds.shift()
            if (cardId) newMarketCards.push(cardId)
          }
          game.marketIds = newMarketCards

          // Initialize hunting phase with rotated starting player
          game.huntingPhase = {
            currentPlayerIndex: startingPlayerIndex,
            startingPlayerIndex: startingPlayerIndex,
            round: 1,
            selections: {},
            confirmedSelections: {},
            isComplete: false,
          }

          console.log(`[MultiplayerGame] All players finished resolution, starting round ${game.currentRound} with player ${startingPlayerIndex}`)
        }
      } else {
        // Move to next player
        const nextPlayerIndex = (currentPlayerIndex + 1) % game.playerIds.length
        game.currentPlayerIndex = nextPlayerIndex

        // Skip players who already passed
        let skipCount = 0
        while (
          game.passedPlayerIds.includes(game.playerIds[game.currentPlayerIndex]) &&
          skipCount < game.playerIds.length
        ) {
          game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerIds.length
          skipCount++
        }
      }

      game.updatedAt = Date.now()
      return game
    })
  }

  /**
   * Finish resolution for current player
   * Moves to next player's resolution, or starts next round if all done
   */
  async finishResolution(gameId: string, playerId: string): Promise<void> {
    await runTransaction(ref(database, `games/${gameId}`), (game: GameRoom | null) => {
      if (!game) return game

      if (game.status !== 'RESOLUTION') {
        throw new Error('Not in resolution phase')
      }

      const currentPlayerIndex = game.currentPlayerIndex
      const expectedPlayerId = game.playerIds[currentPlayerIndex]

      if (playerId !== expectedPlayerId) {
        throw new Error('Not your turn for resolution')
      }

      // Mark player as finished resolution
      if (!Array.isArray(game.passedPlayerIds)) {
        game.passedPlayerIds = []
      }
      if (!game.passedPlayerIds.includes(playerId)) {
        game.passedPlayerIds.push(playerId)
      }

      // Check if all players finished resolution
      if (game.passedPlayerIds.length === game.playerIds.length) {
        // All players finished resolution → Start next round with HUNTING phase
        game.currentRound = (game.currentRound || 1) + 1
        game.status = 'HUNTING'

        // Rotate starting player: Round 1 → Player 0, Round 2 → Player 1, etc.
        const startingPlayerIndex = (game.currentRound - 1) % game.playerIds.length
        game.currentPlayerIndex = startingPlayerIndex
        game.passedPlayerIds = []

        // Deal new cards to market (playerCount + 2)
        if (!Array.isArray(game.deckIds)) {
          game.deckIds = []
        }
        if (!Array.isArray(game.marketIds)) {
          game.marketIds = []
        }

        const marketSize = game.playerIds.length + 2
        const newMarketCards: string[] = []
        for (let i = 0; i < marketSize && game.deckIds.length > 0; i++) {
          const cardId = game.deckIds.shift()
          if (cardId) newMarketCards.push(cardId)
        }
        game.marketIds = newMarketCards

        // Initialize hunting phase with rotated starting player
        game.huntingPhase = {
          currentPlayerIndex: startingPlayerIndex,
          startingPlayerIndex: startingPlayerIndex,
          round: 1,
          selections: {},
          confirmedSelections: {},
          isComplete: false,
        }

        console.log(
          `[MultiplayerGame] All players finished resolution, starting round ${game.currentRound} with HUNTING phase (starting player: ${startingPlayerIndex}), dealt ${newMarketCards.length} cards to market`
        )
      } else {
        // Move to next player for resolution
        game.currentPlayerIndex = (currentPlayerIndex + 1) % game.playerIds.length
        console.log(`[MultiplayerGame] Player ${playerId} finished resolution, moving to next player`)
      }

      game.updatedAt = Date.now()
      return game
    })
  }

  /**
   * End the game (from RESOLUTION phase to ENDED)
   * Only callable by host during RESOLUTION phase
   */
  async endGame(gameId: string): Promise<void> {
    await runTransaction(ref(database, `games/${gameId}`), (game: GameRoom | null) => {
      if (!game) {
        throw new Error('Game not found')
      }

      if (game.status !== 'RESOLUTION') {
        throw new Error('Game must be in RESOLUTION phase to end')
      }

      // Move to ENDED status
      game.status = 'ENDED'
      game.endedAt = Date.now()
      game.updatedAt = Date.now()

      console.log(`[MultiplayerGame] Game ${gameId} ended`)
      return game
    })
  }

  /**
   * Subscribe to game updates
   */
  subscribeToGame(gameId: string, callback: (game: GameRoom) => void): () => void {
    const gameRef = ref(database, `games/${gameId}`)
    onValue(gameRef, snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.val())
      }
    })

    return () => off(gameRef)
  }

  /**
   * Subscribe to player updates
   */
  subscribeToPlayer(
    gameId: string,
    playerId: string,
    callback: (player: PlayerState) => void
  ): () => void {
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
    onValue(playerRef, snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.val())
      }
    })

    return () => off(playerRef)
  }

  /**
   * Subscribe to all players
   */
  subscribeToAllPlayers(
    gameId: string,
    callback: (players: { [playerId: string]: PlayerState }) => void
  ): () => void {
    const playersRef = ref(database, `games/${gameId}/players`)
    onValue(playersRef, snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.val())
      }
    })

    return () => off(playersRef)
  }

  /**
   * Get card instance by ID
   */
  async getCard(gameId: string, cardInstanceId: string): Promise<CardInstanceData | null> {
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardInstanceId}`))
    if (!cardSnapshot.exists()) {
      return null
    }
    return cardSnapshot.val()
  }

  /**
   * Get all cards in game
   */
  async getAllCards(gameId: string): Promise<{ [instanceId: string]: CardInstanceData }> {
    const cardsSnapshot = await get(ref(database, `games/${gameId}/cards`))
    if (!cardsSnapshot.exists()) {
      return {}
    }
    return cardsSnapshot.val()
  }

  /**
   * Calculate final scores (when game ends)
   */
  async calculateFinalScores(gameId: string): Promise<ScoreBreakdown[]> {
    // Get all players
    const playersSnapshot = await get(ref(database, `games/${gameId}/players`))
    if (!playersSnapshot.exists()) {
      throw new Error('No players found')
    }

    const allPlayers = playersSnapshot.val()

    // Get all cards
    const cardsSnapshot = await get(ref(database, `games/${gameId}/cards`))
    if (!cardsSnapshot.exists()) {
      throw new Error('No cards found')
    }

    const allCards = cardsSnapshot.val()

    // Calculate scores
    const scores = scoreCalculator.calculateAllScores(allPlayers, allCards)

    // Update player scores in database
    for (const scoreBreakdown of scores) {
      await update(ref(database, `games/${gameId}/players/${scoreBreakdown.playerId}`), {
        score: scoreBreakdown.totalScore,
      })
    }

    console.log(`[MultiplayerGame] Final scores calculated for game ${gameId}:`, scores)

    return scores
  }

  /**
   * Adjust player's score (manual adjustment)
   */
  async adjustPlayerScore(
    gameId: string,
    playerId: string,
    newScore: number
  ): Promise<void> {
    if (newScore < 0) {
      throw new Error('Score cannot be negative')
    }

    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      score: newScore,
      updatedAt: Date.now(),
    })

    console.log(`[MultiplayerGame] Player ${playerId} score adjusted to ${newScore}`)
  }

  /**
   * Take a coin from the bank
   */
  async takeCoinFromBank(
    gameId: string,
    playerId: string,
    coinType: StoneType
  ): Promise<void> {
    await runTransaction(ref(database, `games/${gameId}`), (game: GameRoom | null) => {
      if (!game) return game

      // Check if bank has the coin
      if (!game.bankCoins || game.bankCoins[coinType] <= 0) {
        throw new Error(`Bank does not have ${coinType} coins`)
      }

      // Decrease bank coins
      game.bankCoins[coinType] -= 1
      game.updatedAt = Date.now()

      return game
    })

    // Increase player coins
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()
    const updatedStones = { ...player.stones }
    updatedStones[coinType] = (updatedStones[coinType] || 0) + 1

    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      stones: updatedStones,
    })

    console.log(`[MultiplayerGame] Player ${playerId} took ${coinType} coin from bank`)
  }

  /**
   * Return a coin to the bank
   * Bank has unlimited capacity, so we always accept coins back
   */
  async returnCoinToBank(
    gameId: string,
    playerId: string,
    coinType: StoneType
  ): Promise<void> {
    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()

    // Check if player has the coin
    if (!player.stones || player.stones[coinType] <= 0) {
      throw new Error(`Player does not have ${coinType} coins`)
    }

    // Decrease player coins
    const updatedStones = { ...player.stones }
    updatedStones[coinType] -= 1

    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      stones: updatedStones,
    })

    // Increase bank coins (bank has unlimited capacity)
    await runTransaction(ref(database, `games/${gameId}`), (game: GameRoom | null) => {
      if (!game) return game

      if (!game.bankCoins) {
        game.bankCoins = { ONE: 999, THREE: 999, SIX: 999, WATER: 0, FIRE: 0, EARTH: 0, WIND: 0 }
      }

      // Bank has unlimited coins - just add it back
      game.bankCoins[coinType] = (game.bankCoins[coinType] || 0) + 1
      game.updatedAt = Date.now()

      return game
    })

    console.log(`[MultiplayerGame] Player ${playerId} returned ${coinType} coin to bank`)
  }

  /**
   * Toggle player's flip state
   * When flipped: adds +60 to score
   * When unflipped: removes -60 from score
   */
  async togglePlayerFlip(gameId: string, playerId: string): Promise<void> {
    // Get player state
    const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
    if (!playerSnapshot.exists()) {
      throw new Error('Player not found')
    }

    const player: PlayerState = playerSnapshot.val()
    const newFlipState = !player.isFlipped
    const scoreAdjustment = newFlipState ? 60 : -60

    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      isFlipped: newFlipState,
      score: player.score + scoreAdjustment,
    })

    console.log(
      `[MultiplayerGame] Player ${playerId} ${newFlipState ? 'flipped' : 'unflipped'} - score adjusted by ${scoreAdjustment}`
    )
  }

  /**
   * Change player's color
   * Players can only change to colors not already used by other players
   */
  async changePlayerColor(
    gameId: string,
    playerId: string,
    newColor: PlayerColor
  ): Promise<void> {
    // Get all players to check if color is available
    const playersSnapshot = await get(ref(database, `games/${gameId}/players`))
    if (!playersSnapshot.exists()) {
      throw new Error('No players found')
    }

    const players = playersSnapshot.val() as Record<string, PlayerState>

    // Check if the color is already taken by another player
    const colorTaken = Object.values(players).some(
      (p) => p.playerId !== playerId && p.color === newColor
    )

    if (colorTaken) {
      throw new Error(`Color ${newColor} is already taken by another player`)
    }

    // Update player's color
    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      color: newColor,
    })

    console.log(`[MultiplayerGame] Player ${playerId} changed color to ${newColor}`)
  }

  /**
   * Get available colors (colors not used by other players in the game)
   */
  async getAvailableColors(gameId: string, currentPlayerId: string): Promise<PlayerColor[]> {
    const playersSnapshot = await get(ref(database, `games/${gameId}/players`))
    if (!playersSnapshot.exists()) {
      return ['green', 'red', 'purple', 'black'] // All colors available
    }

    const players = playersSnapshot.val() as Record<string, PlayerState>
    const takenColors = Object.values(players)
      .filter((p) => p.playerId !== currentPlayerId)
      .map((p) => p.color)

    const allColors: PlayerColor[] = ['green', 'red', 'purple', 'black']
    return allColors.filter((c) => !takenColors.includes(c))
  }
}

export const multiplayerGameService = new MultiplayerGameService()
