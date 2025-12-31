/**
 * Game core type definitions
 * Supports both multiplayer and single-player modes
 * @version 3.1.0 - Added manual mode support
 */
console.log('[types/game.ts] v3.1.0 loaded')

import type { CardInstance, StoneType } from './cards'
import type { Player } from './player'
import type { GameMode, ManualOperation } from './manual'

// ============================================
// ENUMS
// ============================================

/**
 * Game phase enum (Multiplayer)
 */
export enum GamePhase {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  DRAFTING = 'DRAFTING',
  PLAYING = 'PLAYING',
  ROUND_END = 'ROUND_END',
  GAME_END = 'GAME_END',
}

/**
 * Single player game phase
 */
export enum SinglePlayerPhase {
  /** Drawing phase - draw 1 card from deck */
  DRAW = 'DRAW',
  /** Action phase - tame creatures or pass */
  ACTION = 'ACTION',
  /** Scoring phase - calculate final score */
  SCORE = 'SCORE',
}

/**
 * Turn phase enum
 */
export enum TurnPhase {
  DRAW = 'DRAW',
  ACTION = 'ACTION',
  DISCARD = 'DISCARD',
  END = 'END',
}

/**
 * Single player action types
 */
export enum SinglePlayerActionType {
  /** Draw a card from deck */
  DRAW_CARD = 'DRAW_CARD',
  /** Tame a creature from hand */
  TAME_FROM_HAND = 'TAME_FROM_HAND',
  /** Tame a creature from market */
  TAME_FROM_MARKET = 'TAME_FROM_MARKET',
  /** Pass (continue to next draw phase) */
  PASS = 'PASS',
  /** Manually end the game */
  END_GAME = 'END_GAME',
  /** Exchange stones */
  EXCHANGE_STONES = 'EXCHANGE_STONES',
}

// ============================================
// SINGLE PLAYER INTERFACES
// ============================================

/**
 * Stone pool for single player mode
 * Tracks all 7 types of stones
 */
export interface StonePool {
  /** 1-point stones */
  ONE: number
  /** 3-point stones */
  THREE: number
  /** 6-point stones */
  SIX: number
  /** Water element stones */
  WATER: number
  /** Fire element stones */
  FIRE: number
  /** Earth element stones */
  EARTH: number
  /** Wind element stones */
  WIND: number
}

/**
 * Single player state
 */
export interface SinglePlayerState {
  /** Player display name */
  name: string
  /** Cards in hand */
  hand: CardInstance[]
  /** Cards on field (tamed creatures) */
  field: CardInstance[]
  /** Stone pool (7 types) */
  stones: StonePool
}

/**
 * Single player game state
 * Complete state for a single-player game session
 */
export interface SinglePlayerGameState {
  // === Game Identification ===
  /** Unique game ID */
  gameId: string
  /** Game version */
  version: string

  // === Player Information ===
  /** Single player state */
  player: SinglePlayerState

  // === Card Areas ===
  /** Deck (70 cards initially) */
  deck: CardInstance[]
  /** Market (4 visible cards) */
  market: CardInstance[]
  /** Discard pile */
  discardPile: CardInstance[]

  // === Game Progress ===
  /** Current game phase */
  phase: SinglePlayerPhase
  /** Round counter (for tracking) */
  round: number
  /** Action history for current round */
  actionsThisRound: SinglePlayerAction[]

  // === Game End State ===
  /** Whether game has ended */
  isGameOver: boolean
  /** Final calculated score (null if game not ended) */
  finalScore: number | null
  /** End reason */
  endReason: 'DECK_EMPTY' | 'MANUAL_END' | null

  // === Score Breakdown ===
  /** Detailed score breakdown (populated on game end) */
  scoreBreakdown: ScoreBreakdown | null

  // === Timestamps ===
  /** Game creation timestamp */
  createdAt: number
  /** Last update timestamp */
  updatedAt: number

  // === Manual Mode (v3.1.0) ===
  /** Current game mode (automatic or manual) */
  gameMode: GameMode
  /** Manual operation history */
  manualOperations: ManualOperation[]
}

/**
 * Single player action record
 */
export interface SinglePlayerAction {
  /** Action type */
  type: SinglePlayerActionType
  /** Timestamp when action occurred */
  timestamp: number
  /** Action payload */
  payload: {
    /** Card instance ID involved */
    cardInstanceId?: string
    /** Source location (HAND or MARKET) */
    from?: 'HAND' | 'MARKET'
    /** Stones spent */
    stonesSpent?: number
    /** Stones gained */
    stonesGained?: StonePool
    /** Stone exchange details */
    exchange?: {
      from: StoneType
      to: StoneType
      amount: number
    }
  }
}

/**
 * Score breakdown for game end display
 */
export interface ScoreBreakdown {
  /** Base scores from all cards */
  baseScores: {
    cardId: string
    cardName: string
    cardNameTw: string
    baseScore: number
  }[]
  /** Total base score */
  totalBaseScore: number
  /** ON_SCORE effect bonuses */
  effectBonuses: {
    cardId: string
    cardName: string
    effectDescription: string
    bonus: number
  }[]
  /** Total effect bonus */
  totalEffectBonus: number
  /** PERMANENT effect bonuses */
  permanentBonuses: {
    cardId: string
    cardName: string
    effectDescription: string
    bonus: number
  }[]
  /** Total permanent bonus */
  totalPermanentBonus: number
  /** Remaining stones value */
  stoneValue: number
  /** Grand total */
  grandTotal: number
}

/**
 * Effect processing result
 */
export interface EffectProcessingResult {
  /** Whether effect was successfully processed */
  success: boolean
  /** Message describing what happened */
  message: string
  /** Stones gained from effect */
  stonesGained?: Partial<StonePool>
  /** Cards drawn from effect */
  cardsDrawn?: CardInstance[]
  /** Cards to discard */
  cardsToDiscard?: string[]
  /** Free summon triggered */
  freeSummonTriggered?: boolean
  /** Target card for copy effect */
  copyTargetCardId?: string
  /** Additional score modifier */
  scoreModifier?: number
}

// ============================================
// MULTIPLAYER INTERFACES (Existing)
// ============================================

/**
 * Game settings
 */
export interface GameSettings {
  maxPlayers: 2 | 3 | 4
  useExpansion: boolean
  turnTimeLimit: number // in seconds, 0 = no limit
  autoEnd: boolean
}

/**
 * Game state (Multiplayer)
 */
export interface GameState {
  id: string
  roomCode: string
  hostId: string
  settings: GameSettings
  phase: GamePhase
  currentRound: number
  maxRounds: number
  currentPlayerIndex: number
  turnPhase: TurnPhase
  players: Player[]
  marketCards: CardInstance[]
  deck: CardInstance[]
  discardPile: CardInstance[]
  lastAction: GameAction | null
  createdAt: number
  updatedAt: number
  startedAt: number | null
  endedAt: number | null
}

/**
 * Game action types
 */
export enum ActionType {
  JOIN_GAME = 'JOIN_GAME',
  LEAVE_GAME = 'LEAVE_GAME',
  START_GAME = 'START_GAME',
  DRAW_CARD = 'DRAW_CARD',
  TAKE_MARKET_CARD = 'TAKE_MARKET_CARD',
  PLAY_CARD = 'PLAY_CARD',
  ACTIVATE_ABILITY = 'ACTIVATE_ABILITY',
  DISCARD_CARD = 'DISCARD_CARD',
  END_TURN = 'END_TURN',
  PASS = 'PASS',
}

/**
 * Game action
 */
export interface GameAction {
  type: ActionType
  playerId: string
  payload?: Record<string, unknown>
  timestamp: number
}

/**
 * Game result
 */
export interface GameResult {
  gameId: string
  winner: string
  rankings: PlayerRanking[]
  endReason: 'NORMAL' | 'TIMEOUT' | 'FORFEIT'
  duration: number
}

/**
 * Player ranking
 */
export interface PlayerRanking {
  playerId: string
  playerName: string
  rank: number
  score: number
  bonusPoints: number
  cardCount: number
}

/**
 * Room info for lobby display
 */
export interface RoomInfo {
  id: string
  roomCode: string
  hostName: string
  playerCount: number
  maxPlayers: number
  phase: GamePhase
  useExpansion: boolean
  createdAt: number
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Create an empty stone pool
 */
export function createEmptyStonePool(): StonePool {
  return {
    ONE: 0,
    THREE: 0,
    SIX: 0,
    WATER: 0,
    FIRE: 0,
    EARTH: 0,
    WIND: 0,
  }
}

/**
 * Calculate total stone value
 */
export function calculateStonePoolValue(pool: StonePool): number {
  return (
    pool.ONE * 1 +
    pool.THREE * 3 +
    pool.SIX * 6 +
    pool.WATER * 1 +
    pool.FIRE * 1 +
    pool.EARTH * 1 +
    pool.WIND * 1
  )
}

/**
 * Add stones to pool
 */
export function addStonesToPool(pool: StonePool, add: Partial<StonePool>): StonePool {
  return {
    ONE: pool.ONE + (add.ONE ?? 0),
    THREE: pool.THREE + (add.THREE ?? 0),
    SIX: pool.SIX + (add.SIX ?? 0),
    WATER: pool.WATER + (add.WATER ?? 0),
    FIRE: pool.FIRE + (add.FIRE ?? 0),
    EARTH: pool.EARTH + (add.EARTH ?? 0),
    WIND: pool.WIND + (add.WIND ?? 0),
  }
}

/**
 * Check if pool has enough stones
 */
export function hasEnoughStones(pool: StonePool, required: number): boolean {
  return calculateStonePoolValue(pool) >= required
}
