/**
 * Multiplayer Game Service for The Vale of Eternity
 * Handles Firebase Realtime Database synchronization for 2-4 player games
 * @version 3.2.0 - Added player color system and card selection markers
 */
console.log('[services/multiplayer-game.ts] v3.2.0 loaded')

import { ref, set, get, update, onValue, off, remove, runTransaction } from 'firebase/database'
import { database } from '@/lib/firebase'
import { getAllBaseCards } from '@/data/cards'
import type { CardInstance, CardTemplate } from '@/types/cards'
import { CardLocation, StoneType } from '@/types/cards'
import { effectProcessor } from './effect-processor'
import { scoreCalculator, type ScoreBreakdown } from './score-calculator'
import { type PlayerColor, getColorByIndex } from '@/types/player-color'

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
}

export interface HuntingState {
  round: 1 | 2  // Snake draft has 2 rounds
  currentPlayerIndex: number
  selections: {
    [playerId: string]: string[]  // selected card IDs
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
  /** Player ID who selected this card during hunting phase (for marker display) */
  selectedBy?: string | null
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
function getSnakeDraftOrder(playerCount: number, round: 1 | 2): number[] {
  const order = Array.from({ length: playerCount }, (_, i) => i)
  return round === 1 ? order : order.reverse()
}

/**
 * Get next player in snake draft
 */
function getNextHuntingPlayer(
  currentIndex: number,
  round: 1 | 2,
  playerCount: number
): { nextIndex: number; nextRound: 1 | 2; isComplete: boolean } {
  const order = getSnakeDraftOrder(playerCount, round)
  const positionInRound = order.indexOf(currentIndex)

  if (positionInRound === order.length - 1) {
    // Last player in this round
    if (round === 2) {
      return { nextIndex: -1, nextRound: 2, isComplete: true }
    } else {
      // Move to round 2
      const round2Order = getSnakeDraftOrder(playerCount, 2)
      return { nextIndex: round2Order[0], nextRound: 2, isComplete: false }
    }
  } else {
    // Next player in current round
    return { nextIndex: order[positionInRound + 1], nextRound: round, isComplete: false }
  }
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
      score: 0,
      isReady: false,
      hasPassed: false,
      isConnected: true,
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
      score: 0,
      isReady: false,
      hasPassed: false,
      isConnected: true,
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
      const { nextIndex, nextRound, isComplete } = getNextHuntingPlayer(
        currentPlayerIndex,
        game.huntingPhase.round,
        game.playerIds.length
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

    // Process each player's selections
    for (const [playerId, cardIds] of Object.entries(selections)) {
      if (!cardIds || !Array.isArray(cardIds)) continue

      // Get current player state
      const playerSnapshot = await get(ref(database, `games/${gameId}/players/${playerId}`))
      if (!playerSnapshot.exists()) continue

      const player: PlayerState = playerSnapshot.val()
      const currentHand = Array.isArray(player.hand) ? player.hand : []
      const updatedHand = [...currentHand, ...cardIds]

      // Update player's hand
      await update(ref(database, `games/${gameId}/players/${playerId}`), {
        hand: updatedHand,
      })

      // Update each card's location and clear selectedBy marker
      for (const cardId of cardIds) {
        await update(ref(database, `games/${gameId}/cards/${cardId}`), {
          location: CardLocation.HAND,
          ownerId: playerId,
          selectedBy: null, // Clear the marker
        })
      }
    }

    // Remove selected cards from market
    const gameSnapshot = await get(ref(database, `games/${gameId}`))
    if (gameSnapshot.exists()) {
      const game: GameRoom = gameSnapshot.val()
      const allSelectedIds = Object.values(selections).flat()
      const updatedMarketIds = (game.marketIds || []).filter(
        (id: string) => !allSelectedIds.includes(id)
      )
      await update(ref(database, `games/${gameId}`), {
        marketIds: updatedMarketIds,
      })
    }

    console.log('[MultiplayerGame] Card distribution complete')
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

    const card: CardInstanceData = cardSnapshot.val()

    // Check if player has enough stones to pay cost
    const totalStones = Object.values(player.stones).reduce((sum, amount) => sum + amount, 0)
    if (totalStones < card.cost) {
      throw new Error(`Not enough stones. Need ${card.cost}, have ${totalStones}`)
    }

    // Pay stones (simple strategy: use highest value stones first)
    const updatedStones = { ...player.stones }
    let remainingCost = card.cost

    // Payment order: 6 → 3 → 1 → element stones
    const paymentOrder: StoneType[] = [
      StoneType.SIX,
      StoneType.THREE,
      StoneType.ONE,
      StoneType.FIRE,
      StoneType.WATER,
      StoneType.EARTH,
      StoneType.WIND,
    ]

    for (const stoneType of paymentOrder) {
      if (remainingCost <= 0) break

      const stoneValue = stoneType === StoneType.SIX ? 6 : stoneType === StoneType.THREE ? 3 : 1
      const available = updatedStones[stoneType]

      if (available > 0) {
        const stonesToUse = Math.min(Math.ceil(remainingCost / stoneValue), available)
        updatedStones[stoneType] -= stonesToUse
        remainingCost -= stonesToUse * stoneValue
      }
    }

    if (remainingCost > 0) {
      throw new Error('Cannot pay exact cost with available stones')
    }

    // Move card from hand to field
    // Ensure arrays exist
    const currentHand = Array.isArray(player.hand) ? player.hand : []
    const currentField = Array.isArray(player.field) ? player.field : []
    const updatedHand = currentHand.filter(id => id !== cardInstanceId)
    const updatedField = [...currentField, cardInstanceId]

    // Update player state
    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      hand: updatedHand,
      field: updatedField,
      stones: updatedStones,
    })

    // Update card location
    await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
      location: CardLocation.FIELD,
    })

    console.log(`[MultiplayerGame] Player ${playerId} tamed card ${cardInstanceId}`)

    // Process ON_TAME effects (⚡)
    const allPlayersSnapshot = await get(ref(database, `games/${gameId}/players`))
    const allPlayers = allPlayersSnapshot.exists() ? allPlayersSnapshot.val() : {}

    const allCardsSnapshot = await get(ref(database, `games/${gameId}/cards`))
    const allCards = allCardsSnapshot.exists() ? allCardsSnapshot.val() : {}

    const effectContext = {
      gameId,
      playerId,
      cardInstanceId,
      currentPlayerState: { ...player, hand: updatedHand, field: updatedField, stones: updatedStones },
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
   * Sell a card from field for stones (Action Phase)
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

    // Ensure field array exists
    if (!player.field || !Array.isArray(player.field)) {
      throw new Error('Player field is not initialized')
    }

    if (!player.field.includes(cardInstanceId)) {
      throw new Error('Card not in field')
    }

    // Get card data
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardInstanceId}`))
    if (!cardSnapshot.exists()) {
      throw new Error('Card not found')
    }

    const card: CardInstanceData = cardSnapshot.val()

    // Selling gives baseScore stones (as 1-point stones)
    const stonesGained = card.baseScore
    const updatedStones = { ...player.stones }
    updatedStones.ONE = (updatedStones.ONE || 0) + stonesGained

    // Move card from field to discard
    // Ensure field is an array
    const currentField = Array.isArray(player.field) ? player.field : []
    const updatedField = currentField.filter(id => id !== cardInstanceId)

    // Update player state
    await update(ref(database, `games/${gameId}/players/${playerId}`), {
      field: updatedField,
      stones: updatedStones,
    })

    // Update card location
    await update(ref(database, `games/${gameId}/cards/${cardInstanceId}`), {
      location: CardLocation.DISCARD,
    })

    // Add to game discard pile
    await update(ref(database, `games/${gameId}`), {
      discardIds: [...game.discardIds, cardInstanceId],
      updatedAt: Date.now(),
    })

    console.log(`[MultiplayerGame] Player ${playerId} sold card ${cardInstanceId} for ${stonesGained} stones`)
  }

  /**
   * Pass turn (Action Phase)
   */
  async passTurn(gameId: string, playerId: string): Promise<void> {
    await runTransaction(ref(database, `games/${gameId}`), (game: GameRoom | null) => {
      if (!game) return game

      if (game.status !== 'ACTION') {
        throw new Error('Not in action phase')
      }

      const currentPlayerIndex = game.currentPlayerIndex
      const expectedPlayerId = game.playerIds[currentPlayerIndex]

      if (playerId !== expectedPlayerId) {
        throw new Error('Not your turn')
      }

      // Mark player as passed
      if (!game.passedPlayerIds.includes(playerId)) {
        game.passedPlayerIds.push(playerId)
      }

      // Check if all players have passed
      if (game.passedPlayerIds.length === game.playerIds.length) {
        // All players passed → End game
        game.status = 'ENDED'
        game.endedAt = Date.now()
        console.log(`[MultiplayerGame] All players passed, game ${game.gameId} ended`)
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
