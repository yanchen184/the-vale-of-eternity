/**
 * Game Engine for MVP 1.0
 * Core game logic and state management
 * Based on GAME_ENGINE_SPEC.md
 * @version 1.0.0
 */
console.log('[lib/game-engine.ts] v1.0.0 loaded')

import type { CardInstance } from '@/types/cards'
import { CardLocation } from '@/types/cards'
import { buildShuffledDeck } from '@/data/cards'
import {
  calculateTameCost,
  calculateSellValue,
  generateId,
  determineHuntingOrder,
  refillMarket,
  MVP_CONSTANTS,
} from '@/lib/game-utils'
import {
  processOnTameEffect,
  processPermanentEffect,
  calculatePlayerScore,
  calculateEffectiveStoneLimit,
} from '@/lib/effect-system'

// ============================================
// ENUMS
// ============================================

/**
 * Game phase enum
 */
export enum GamePhase {
  SETUP = 'SETUP',
  HUNTING = 'HUNTING',
  ACTION = 'ACTION',
  RESOLUTION = 'RESOLUTION',
  GAME_END = 'GAME_END',
}

/**
 * Action type enum
 */
export enum ActionType {
  // Hunting phase actions
  SELECT_MARKET_CARD = 'SELECT_MARKET_CARD',
  TAME_FROM_MARKET = 'TAME_FROM_MARKET',

  // Action phase actions
  TAME_FROM_HAND = 'TAME_FROM_HAND',
  SELL_CARD = 'SELL_CARD',
  PASS = 'PASS',

  // System actions
  END_PHASE = 'END_PHASE',
  END_ROUND = 'END_ROUND',
}

// ============================================
// INTERFACES
// ============================================

/**
 * MVP Player state
 */
export interface MVPPlayerState {
  id: string
  name: string
  index: 0 | 1
  stones: number
  stoneLimit: number
  score: number
  roundScore: number
  hand: CardInstance[]
  field: CardInstance[]
  hasActedThisPhase: boolean
  hasPassed: boolean
}

/**
 * Game action
 */
export interface GameAction {
  type: ActionType
  playerId: string
  timestamp: number
  payload: {
    cardInstanceId?: string
    targetCardId?: string
    action?: 'TAKE' | 'TAME'
    value?: number
  }
}

/**
 * Hunting selection record
 */
export interface HuntingSelection {
  playerIndex: 0 | 1
  cardInstanceId: string
  action: 'TAKE' | 'TAME'
  stoneCost: number
}

/**
 * MVP Game state
 */
export interface MVPGameState {
  // Game identification
  gameId: string
  version: string

  // Game progress
  phase: GamePhase
  round: number
  turn: number

  // Player information
  players: [MVPPlayerState, MVPPlayerState]
  currentPlayerIndex: 0 | 1
  firstPlayerIndex: 0 | 1

  // Card areas
  deck: CardInstance[]
  market: CardInstance[]
  discardPile: CardInstance[]

  // Round state
  huntingSelections: HuntingSelection[]
  actionsThisPhase: GameAction[]

  // Game result
  isGameOver: boolean
  winner: 0 | 1 | 'draw' | null
  endReason: 'SCORE_REACHED' | 'ROUNDS_COMPLETED' | null

  // Timestamps
  createdAt: number
  updatedAt: number
}

/**
 * Victory check result
 */
export interface VictoryResult {
  isGameOver: boolean
  winner: 0 | 1 | 'draw' | null
  endReason: 'SCORE_REACHED' | 'ROUNDS_COMPLETED' | null
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Game error codes
 */
export enum GameErrorCode {
  ERR_INSUFFICIENT_STONES = 'ERR_INSUFFICIENT_STONES',
  ERR_FIELD_FULL = 'ERR_FIELD_FULL',
  ERR_HAND_FULL = 'ERR_HAND_FULL',
  ERR_INVALID_PHASE = 'ERR_INVALID_PHASE',
  ERR_NOT_YOUR_TURN = 'ERR_NOT_YOUR_TURN',
  ERR_CARD_NOT_FOUND = 'ERR_CARD_NOT_FOUND',
  ERR_CARD_NOT_IN_HAND = 'ERR_CARD_NOT_IN_HAND',
  ERR_CARD_NOT_IN_MARKET = 'ERR_CARD_NOT_IN_MARKET',
  ERR_GAME_NOT_STARTED = 'ERR_GAME_NOT_STARTED',
  ERR_GAME_ALREADY_ENDED = 'ERR_GAME_ALREADY_ENDED',
  ERR_ALREADY_SELECTED = 'ERR_ALREADY_SELECTED',
}

/**
 * Custom game error class
 */
export class GameError extends Error {
  constructor(
    public code: GameErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'GameError'
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create initial player state
 */
function createPlayer(name: string, index: 0 | 1): MVPPlayerState {
  return {
    id: generateId(),
    name,
    index,
    stones: MVP_CONSTANTS.STARTING_STONES,
    stoneLimit: MVP_CONSTANTS.BASE_STONE_LIMIT,
    score: 0,
    roundScore: 0,
    hand: [],
    field: [],
    hasActedThisPhase: false,
    hasPassed: false,
  }
}

/**
 * Update a player in the players array (immutable)
 */
function updatePlayer(
  players: [MVPPlayerState, MVPPlayerState],
  index: 0 | 1,
  updates: Partial<MVPPlayerState>
): [MVPPlayerState, MVPPlayerState] {
  const result: [MVPPlayerState, MVPPlayerState] = [...players]
  result[index] = { ...players[index], ...updates }
  return result
}

// ============================================
// GAME ENGINE CLASS
// ============================================

/**
 * Game Engine for MVP 1.0
 * Manages all game logic and state transitions
 */
export class GameEngine {
  private state: MVPGameState | null = null
  private stateListeners: Array<(state: MVPGameState) => void> = []
  private phaseListeners: Array<(phase: GamePhase) => void> = []
  private gameEndListeners: Array<(result: VictoryResult) => void> = []

  constructor() {
    console.log('[GameEngine] Initialized v1.0.0')
  }

  // ============================================
  // GAME LIFECYCLE
  // ============================================

  /**
   * Initialize a new game
   */
  initializeGame(player1Name: string, player2Name: string): MVPGameState {
    // Create players
    const players: [MVPPlayerState, MVPPlayerState] = [
      createPlayer(player1Name, 0),
      createPlayer(player2Name, 1),
    ]

    // Build and shuffle deck
    const deck = buildShuffledDeck()

    // Set up market (draw 4 cards)
    const { market, deck: remainingDeck } = refillMarket([], deck, MVP_CONSTANTS.MARKET_SIZE)

    // Randomly determine first player
    const firstPlayerIndex: 0 | 1 = Math.random() < 0.5 ? 0 : 1

    // Create initial state
    this.state = {
      gameId: generateId(),
      version: 'MVP-1.0.0',
      phase: GamePhase.HUNTING,
      round: 1,
      turn: 1,
      players,
      currentPlayerIndex: firstPlayerIndex,
      firstPlayerIndex,
      deck: remainingDeck,
      market,
      discardPile: [],
      huntingSelections: [],
      actionsThisPhase: [],
      isGameOver: false,
      winner: null,
      endReason: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    return this.state
  }

  /**
   * Reset the game
   */
  resetGame(): void {
    this.state = null
    this.notifyStateChange()
  }

  /**
   * Get current state
   */
  getState(): MVPGameState | null {
    return this.state
  }

  /**
   * Get current player
   */
  getCurrentPlayer(): MVPPlayerState | null {
    if (!this.state) return null
    return this.state.players[this.state.currentPlayerIndex]
  }

  // ============================================
  // HUNTING PHASE
  // ============================================

  /**
   * Start hunting phase
   */
  startHuntingPhase(): MVPGameState {
    if (!this.state) {
      throw new GameError(GameErrorCode.ERR_GAME_NOT_STARTED, 'Game not started')
    }

    // Refill market
    const { market, deck } = refillMarket(
      this.state.market,
      this.state.deck,
      MVP_CONSTANTS.MARKET_SIZE
    )

    // Determine hunting order based on scores
    const [firstIdx] = determineHuntingOrder(
      this.state.players[0].score,
      this.state.players[1].score,
      this.state.firstPlayerIndex
    )

    this.state = {
      ...this.state,
      phase: GamePhase.HUNTING,
      market,
      deck,
      currentPlayerIndex: firstIdx,
      huntingSelections: [],
      actionsThisPhase: [],
      players: updatePlayer(
        updatePlayer(this.state.players, 0, { hasActedThisPhase: false, hasPassed: false }),
        1,
        { hasActedThisPhase: false, hasPassed: false }
      ),
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    this.notifyPhaseChange()
    return this.state
  }

  /**
   * Select a card from market (TAKE or TAME)
   */
  selectMarketCard(
    playerIndex: 0 | 1,
    cardInstanceId: string,
    action: 'TAKE' | 'TAME'
  ): MVPGameState {
    if (!this.state) {
      throw new GameError(GameErrorCode.ERR_GAME_NOT_STARTED, 'Game not started')
    }

    if (this.state.phase !== GamePhase.HUNTING) {
      throw new GameError(GameErrorCode.ERR_INVALID_PHASE, 'Not in hunting phase')
    }

    if (this.state.currentPlayerIndex !== playerIndex) {
      throw new GameError(GameErrorCode.ERR_NOT_YOUR_TURN, 'Not your turn')
    }

    // Find card in market
    const cardIndex = this.state.market.findIndex(c => c.instanceId === cardInstanceId)
    if (cardIndex === -1) {
      throw new GameError(GameErrorCode.ERR_CARD_NOT_IN_MARKET, 'Card not in market')
    }

    const card = this.state.market[cardIndex]
    const player = this.state.players[playerIndex]

    if (action === 'TAKE') {
      // Take card to hand
      if (player.hand.length >= MVP_CONSTANTS.MAX_HAND_SIZE) {
        throw new GameError(GameErrorCode.ERR_HAND_FULL, 'Hand is full')
      }

      const newCard: CardInstance = {
        ...card,
        location: CardLocation.HAND,
        ownerId: player.id,
      }

      this.state = {
        ...this.state,
        market: this.state.market.filter(c => c.instanceId !== cardInstanceId),
        players: updatePlayer(this.state.players, playerIndex, {
          hand: [...player.hand, newCard],
          hasActedThisPhase: true,
        }),
        huntingSelections: [
          ...this.state.huntingSelections,
          { playerIndex, cardInstanceId, action: 'TAKE', stoneCost: 0 },
        ],
        updatedAt: Date.now(),
      }
    } else {
      // Tame card directly to field
      if (player.field.length >= MVP_CONSTANTS.MAX_FIELD_SIZE) {
        throw new GameError(GameErrorCode.ERR_FIELD_FULL, 'Field is full')
      }

      const tameCost = calculateTameCost(card.cost)
      if (player.stones < tameCost) {
        throw new GameError(
          GameErrorCode.ERR_INSUFFICIENT_STONES,
          `Need ${tameCost} stones, have ${player.stones}`
        )
      }

      const newCard: CardInstance = {
        ...card,
        location: CardLocation.FIELD,
        ownerId: player.id,
      }

      // Process on-tame effects
      const effectResult = processOnTameEffect(newCard, this.state, playerIndex)

      // Process permanent effects (like stone limit increase)
      const permanentResult = processPermanentEffect(newCard, player)

      const newStoneLimit = player.stoneLimit + permanentResult.stoneLimitIncrease
      const newStones = player.stones - tameCost + effectResult.stonesGained

      // Handle cards drawn from discard
      let newDiscardPile = this.state.discardPile
      let newHand = player.hand
      if (effectResult.cardsDrawn.length > 0) {
        newDiscardPile = this.state.discardPile.slice(0, -effectResult.cardsDrawn.length)
        newHand = [
          ...player.hand,
          ...effectResult.cardsDrawn.map(c => ({ ...c, ownerId: player.id })),
        ]
      }

      this.state = {
        ...this.state,
        market: this.state.market.filter(c => c.instanceId !== cardInstanceId),
        discardPile: newDiscardPile,
        players: updatePlayer(this.state.players, playerIndex, {
          field: [...player.field, newCard],
          hand: newHand,
          stones: Math.min(newStones, newStoneLimit),
          stoneLimit: newStoneLimit,
          hasActedThisPhase: true,
        }),
        huntingSelections: [
          ...this.state.huntingSelections,
          { playerIndex, cardInstanceId, action: 'TAME', stoneCost: tameCost },
        ],
        updatedAt: Date.now(),
      }
    }

    // Check if both players have selected
    if (this.state.huntingSelections.length >= 2) {
      // Move to action phase
      this.startActionPhase()
    } else {
      // Switch to other player
      this.state = {
        ...this.state,
        currentPlayerIndex: playerIndex === 0 ? 1 : 0,
      }
    }

    this.notifyStateChange()
    return this.state
  }

  // ============================================
  // ACTION PHASE
  // ============================================

  /**
   * Start action phase
   */
  startActionPhase(): MVPGameState {
    if (!this.state) {
      throw new GameError(GameErrorCode.ERR_GAME_NOT_STARTED, 'Game not started')
    }

    this.state = {
      ...this.state,
      phase: GamePhase.ACTION,
      actionsThisPhase: [],
      players: updatePlayer(
        updatePlayer(this.state.players, 0, { hasActedThisPhase: false, hasPassed: false }),
        1,
        { hasActedThisPhase: false, hasPassed: false }
      ),
      currentPlayerIndex: this.state.firstPlayerIndex,
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    this.notifyPhaseChange()
    return this.state
  }

  /**
   * Tame a card from hand
   */
  tameFromHand(playerIndex: 0 | 1, cardInstanceId: string): MVPGameState {
    if (!this.state) {
      throw new GameError(GameErrorCode.ERR_GAME_NOT_STARTED, 'Game not started')
    }

    if (this.state.phase !== GamePhase.ACTION) {
      throw new GameError(GameErrorCode.ERR_INVALID_PHASE, 'Not in action phase')
    }

    if (this.state.currentPlayerIndex !== playerIndex) {
      throw new GameError(GameErrorCode.ERR_NOT_YOUR_TURN, 'Not your turn')
    }

    const player = this.state.players[playerIndex]

    // Find card in hand
    const cardIndex = player.hand.findIndex(c => c.instanceId === cardInstanceId)
    if (cardIndex === -1) {
      throw new GameError(GameErrorCode.ERR_CARD_NOT_IN_HAND, 'Card not in hand')
    }

    const card = player.hand[cardIndex]

    // Check field capacity
    if (player.field.length >= MVP_CONSTANTS.MAX_FIELD_SIZE) {
      throw new GameError(GameErrorCode.ERR_FIELD_FULL, 'Field is full')
    }

    // Check stones
    const tameCost = calculateTameCost(card.cost)
    if (player.stones < tameCost) {
      throw new GameError(
        GameErrorCode.ERR_INSUFFICIENT_STONES,
        `Need ${tameCost} stones, have ${player.stones}`
      )
    }

    // Move card to field
    const newCard: CardInstance = {
      ...card,
      location: CardLocation.FIELD,
    }

    // Process effects
    const effectResult = processOnTameEffect(newCard, this.state, playerIndex)
    const permanentResult = processPermanentEffect(newCard, player)

    const newStoneLimit = player.stoneLimit + permanentResult.stoneLimitIncrease
    const newStones = player.stones - tameCost + effectResult.stonesGained

    // Handle cards drawn from discard
    let newDiscardPile = this.state.discardPile
    let newHand = player.hand.filter(c => c.instanceId !== cardInstanceId)
    if (effectResult.cardsDrawn.length > 0) {
      newDiscardPile = this.state.discardPile.slice(0, -effectResult.cardsDrawn.length)
      newHand = [
        ...newHand,
        ...effectResult.cardsDrawn.map(c => ({ ...c, ownerId: player.id })),
      ]
    }

    // Create action record
    const action: GameAction = {
      type: ActionType.TAME_FROM_HAND,
      playerId: player.id,
      timestamp: Date.now(),
      payload: { cardInstanceId },
    }

    this.state = {
      ...this.state,
      discardPile: newDiscardPile,
      players: updatePlayer(this.state.players, playerIndex, {
        hand: newHand,
        field: [...player.field, newCard],
        stones: Math.min(newStones, newStoneLimit),
        stoneLimit: newStoneLimit,
      }),
      actionsThisPhase: [...this.state.actionsThisPhase, action],
      currentPlayerIndex: playerIndex === 0 ? 1 : 0,
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    return this.state
  }

  /**
   * Sell a card from hand
   */
  sellCard(playerIndex: 0 | 1, cardInstanceId: string): MVPGameState {
    if (!this.state) {
      throw new GameError(GameErrorCode.ERR_GAME_NOT_STARTED, 'Game not started')
    }

    if (this.state.phase !== GamePhase.ACTION) {
      throw new GameError(GameErrorCode.ERR_INVALID_PHASE, 'Not in action phase')
    }

    if (this.state.currentPlayerIndex !== playerIndex) {
      throw new GameError(GameErrorCode.ERR_NOT_YOUR_TURN, 'Not your turn')
    }

    const player = this.state.players[playerIndex]

    // Find card in hand
    const cardIndex = player.hand.findIndex(c => c.instanceId === cardInstanceId)
    if (cardIndex === -1) {
      throw new GameError(GameErrorCode.ERR_CARD_NOT_IN_HAND, 'Card not in hand')
    }

    const card = player.hand[cardIndex]

    // Calculate stones gained
    const stonesGained = calculateSellValue(card.cost, player.stones, player.stoneLimit)

    // Move card to discard
    const discardedCard: CardInstance = {
      ...card,
      location: CardLocation.DISCARD,
      ownerId: null,
    }

    // Create action record
    const action: GameAction = {
      type: ActionType.SELL_CARD,
      playerId: player.id,
      timestamp: Date.now(),
      payload: { cardInstanceId, value: stonesGained },
    }

    this.state = {
      ...this.state,
      discardPile: [...this.state.discardPile, discardedCard],
      players: updatePlayer(this.state.players, playerIndex, {
        hand: player.hand.filter(c => c.instanceId !== cardInstanceId),
        stones: player.stones + stonesGained,
      }),
      actionsThisPhase: [...this.state.actionsThisPhase, action],
      currentPlayerIndex: playerIndex === 0 ? 1 : 0,
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    return this.state
  }

  /**
   * Pass (skip turn)
   */
  pass(playerIndex: 0 | 1): MVPGameState {
    if (!this.state) {
      throw new GameError(GameErrorCode.ERR_GAME_NOT_STARTED, 'Game not started')
    }

    if (this.state.phase !== GamePhase.ACTION) {
      throw new GameError(GameErrorCode.ERR_INVALID_PHASE, 'Not in action phase')
    }

    if (this.state.currentPlayerIndex !== playerIndex) {
      throw new GameError(GameErrorCode.ERR_NOT_YOUR_TURN, 'Not your turn')
    }

    const player = this.state.players[playerIndex]

    // Create action record
    const action: GameAction = {
      type: ActionType.PASS,
      playerId: player.id,
      timestamp: Date.now(),
      payload: {},
    }

    this.state = {
      ...this.state,
      players: updatePlayer(this.state.players, playerIndex, {
        hasPassed: true,
      }),
      actionsThisPhase: [...this.state.actionsThisPhase, action],
      currentPlayerIndex: playerIndex === 0 ? 1 : 0,
      updatedAt: Date.now(),
    }

    // Check if both players have passed
    const bothPassed = this.state.players[0].hasPassed && this.state.players[1].hasPassed
    if (bothPassed) {
      this.startResolutionPhase()
    }

    this.notifyStateChange()
    return this.state
  }

  // ============================================
  // RESOLUTION PHASE
  // ============================================

  /**
   * Start resolution phase
   */
  startResolutionPhase(): MVPGameState {
    if (!this.state) {
      throw new GameError(GameErrorCode.ERR_GAME_NOT_STARTED, 'Game not started')
    }

    // Calculate scores for both players
    const p1Score = calculatePlayerScore(this.state.players[0].field)
    const p2Score = calculatePlayerScore(this.state.players[1].field)

    // Update stone limits based on permanent effects
    const p1StoneLimit = calculateEffectiveStoneLimit(
      MVP_CONSTANTS.BASE_STONE_LIMIT,
      this.state.players[0].field
    )
    const p2StoneLimit = calculateEffectiveStoneLimit(
      MVP_CONSTANTS.BASE_STONE_LIMIT,
      this.state.players[1].field
    )

    // Gain 1 stone per round (respecting limit)
    const p1NewStones = Math.min(
      this.state.players[0].stones + MVP_CONSTANTS.STONES_PER_ROUND,
      p1StoneLimit
    )
    const p2NewStones = Math.min(
      this.state.players[1].stones + MVP_CONSTANTS.STONES_PER_ROUND,
      p2StoneLimit
    )

    this.state = {
      ...this.state,
      phase: GamePhase.RESOLUTION,
      players: updatePlayer(
        updatePlayer(this.state.players, 0, {
          score: p1Score,
          roundScore: p1Score - this.state.players[0].score,
          stones: p1NewStones,
          stoneLimit: p1StoneLimit,
        }),
        1,
        {
          score: p2Score,
          roundScore: p2Score - this.state.players[1].score,
          stones: p2NewStones,
          stoneLimit: p2StoneLimit,
        }
      ),
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    this.notifyPhaseChange()

    // Check victory condition
    const victoryResult = this.checkVictory()
    if (victoryResult.isGameOver) {
      this.endGame(victoryResult)
    }

    return this.state
  }

  /**
   * Check victory conditions
   */
  checkVictory(): VictoryResult {
    if (!this.state) {
      return { isGameOver: false, winner: null, endReason: null }
    }

    const [p1, p2] = this.state.players

    // Check score victory (60 points)
    const p1Reached = p1.score >= MVP_CONSTANTS.VICTORY_SCORE
    const p2Reached = p2.score >= MVP_CONSTANTS.VICTORY_SCORE

    if (p1Reached || p2Reached) {
      if (p1Reached && p2Reached) {
        // Both reached - highest score wins
        if (p1.score > p2.score) {
          return { isGameOver: true, winner: 0, endReason: 'SCORE_REACHED' }
        } else if (p2.score > p1.score) {
          return { isGameOver: true, winner: 1, endReason: 'SCORE_REACHED' }
        } else {
          // Tie - most cards wins
          if (p1.field.length > p2.field.length) {
            return { isGameOver: true, winner: 0, endReason: 'SCORE_REACHED' }
          } else if (p2.field.length > p1.field.length) {
            return { isGameOver: true, winner: 1, endReason: 'SCORE_REACHED' }
          } else {
            return { isGameOver: true, winner: 'draw', endReason: 'SCORE_REACHED' }
          }
        }
      } else {
        return {
          isGameOver: true,
          winner: p1Reached ? 0 : 1,
          endReason: 'SCORE_REACHED',
        }
      }
    }

    // Check round limit
    if (this.state.round >= MVP_CONSTANTS.MAX_ROUNDS) {
      if (p1.score > p2.score) {
        return { isGameOver: true, winner: 0, endReason: 'ROUNDS_COMPLETED' }
      } else if (p2.score > p1.score) {
        return { isGameOver: true, winner: 1, endReason: 'ROUNDS_COMPLETED' }
      } else {
        // Tie - most cards wins
        if (p1.field.length > p2.field.length) {
          return { isGameOver: true, winner: 0, endReason: 'ROUNDS_COMPLETED' }
        } else if (p2.field.length > p1.field.length) {
          return { isGameOver: true, winner: 1, endReason: 'ROUNDS_COMPLETED' }
        } else {
          return { isGameOver: true, winner: 'draw', endReason: 'ROUNDS_COMPLETED' }
        }
      }
    }

    return { isGameOver: false, winner: null, endReason: null }
  }

  /**
   * End the game
   */
  private endGame(result: VictoryResult): void {
    if (!this.state) return

    this.state = {
      ...this.state,
      phase: GamePhase.GAME_END,
      isGameOver: true,
      winner: result.winner,
      endReason: result.endReason,
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    this.notifyPhaseChange()
    this.notifyGameEnd(result)
  }

  /**
   * Start next round
   */
  startNextRound(): MVPGameState {
    if (!this.state) {
      throw new GameError(GameErrorCode.ERR_GAME_NOT_STARTED, 'Game not started')
    }

    if (this.state.isGameOver) {
      throw new GameError(GameErrorCode.ERR_GAME_ALREADY_ENDED, 'Game has ended')
    }

    // Determine new first player based on scores
    const [firstIdx] = determineHuntingOrder(
      this.state.players[0].score,
      this.state.players[1].score,
      this.state.firstPlayerIndex
    )

    this.state = {
      ...this.state,
      round: this.state.round + 1,
      turn: 1,
      firstPlayerIndex: firstIdx,
      huntingSelections: [],
      actionsThisPhase: [],
      updatedAt: Date.now(),
    }

    // Start hunting phase for new round
    return this.startHuntingPhase()
  }

  // ============================================
  // ACTION EXECUTION
  // ============================================

  /**
   * Execute an action (unified action handler)
   */
  executeAction(action: GameAction): MVPGameState {
    if (!this.state) {
      throw new GameError(GameErrorCode.ERR_GAME_NOT_STARTED, 'Game not started')
    }

    if (this.state.isGameOver) {
      throw new GameError(GameErrorCode.ERR_GAME_ALREADY_ENDED, 'Game has ended')
    }

    const foundIndex = this.state.players.findIndex(p => p.id === action.playerId)
    if (foundIndex === -1) {
      throw new GameError(GameErrorCode.ERR_NOT_YOUR_TURN, 'Player not found')
    }
    const playerIndex = foundIndex as 0 | 1

    switch (action.type) {
      case ActionType.SELECT_MARKET_CARD:
      case ActionType.TAME_FROM_MARKET:
        return this.selectMarketCard(
          playerIndex,
          action.payload.cardInstanceId!,
          action.payload.action || 'TAKE'
        )

      case ActionType.TAME_FROM_HAND:
        return this.tameFromHand(playerIndex, action.payload.cardInstanceId!)

      case ActionType.SELL_CARD:
        return this.sellCard(playerIndex, action.payload.cardInstanceId!)

      case ActionType.PASS:
        return this.pass(playerIndex)

      case ActionType.END_PHASE:
        if (this.state.phase === GamePhase.RESOLUTION) {
          return this.startNextRound()
        }
        throw new GameError(GameErrorCode.ERR_INVALID_PHASE, 'Cannot end phase')

      default:
        throw new GameError(GameErrorCode.ERR_INVALID_PHASE, 'Unknown action type')
    }
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * Get valid actions for current player
   */
  getValidActions(): ActionType[] {
    if (!this.state) return []

    const player = this.state.players[this.state.currentPlayerIndex]
    const actions: ActionType[] = []

    if (this.state.phase === GamePhase.HUNTING) {
      if (this.state.market.length > 0) {
        actions.push(ActionType.SELECT_MARKET_CARD)
        // Check if can tame any market card
        const canTameAny = this.state.market.some(card => {
          const cost = calculateTameCost(card.cost)
          return player.stones >= cost && player.field.length < MVP_CONSTANTS.MAX_FIELD_SIZE
        })
        if (canTameAny) {
          actions.push(ActionType.TAME_FROM_MARKET)
        }
      }
    }

    if (this.state.phase === GamePhase.ACTION) {
      // Can always pass
      actions.push(ActionType.PASS)

      // Check if can tame from hand
      const canTameFromHand = player.hand.some(card => {
        const cost = calculateTameCost(card.cost)
        return player.stones >= cost && player.field.length < MVP_CONSTANTS.MAX_FIELD_SIZE
      })
      if (canTameFromHand) {
        actions.push(ActionType.TAME_FROM_HAND)
      }

      // Can sell if have cards in hand
      if (player.hand.length > 0) {
        actions.push(ActionType.SELL_CARD)
      }
    }

    if (this.state.phase === GamePhase.RESOLUTION) {
      actions.push(ActionType.END_PHASE)
    }

    return actions
  }

  /**
   * Check if a specific card can be tamed
   */
  canTameCard(cardInstanceId: string): boolean {
    if (!this.state) return false

    const player = this.state.players[this.state.currentPlayerIndex]

    // Check field capacity
    if (player.field.length >= MVP_CONSTANTS.MAX_FIELD_SIZE) {
      return false
    }

    // Find card in hand or market
    let card = player.hand.find(c => c.instanceId === cardInstanceId)
    if (!card) {
      card = this.state.market.find(c => c.instanceId === cardInstanceId)
    }

    if (!card) return false

    // Check stone cost
    const tameCost = calculateTameCost(card.cost)
    return player.stones >= tameCost
  }

  /**
   * Check if a specific card can be sold
   */
  canSellCard(cardInstanceId: string): boolean {
    if (!this.state) return false
    if (this.state.phase !== GamePhase.ACTION) return false

    const player = this.state.players[this.state.currentPlayerIndex]
    return player.hand.some(c => c.instanceId === cardInstanceId)
  }

  // ============================================
  // EVENT SUBSCRIPTIONS
  // ============================================

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: MVPGameState) => void): () => void {
    this.stateListeners.push(callback)
    return () => {
      this.stateListeners = this.stateListeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Subscribe to phase changes
   */
  onPhaseChange(callback: (phase: GamePhase) => void): () => void {
    this.phaseListeners.push(callback)
    return () => {
      this.phaseListeners = this.phaseListeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Subscribe to game end
   */
  onGameEnd(callback: (result: VictoryResult) => void): () => void {
    this.gameEndListeners.push(callback)
    return () => {
      this.gameEndListeners = this.gameEndListeners.filter(cb => cb !== callback)
    }
  }

  private notifyStateChange(): void {
    if (this.state) {
      this.stateListeners.forEach(cb => cb(this.state!))
    }
  }

  private notifyPhaseChange(): void {
    if (this.state) {
      this.phaseListeners.forEach(cb => cb(this.state!.phase))
    }
  }

  private notifyGameEnd(result: VictoryResult): void {
    this.gameEndListeners.forEach(cb => cb(result))
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

/**
 * Default game engine instance
 */
export const gameEngine = new GameEngine()
