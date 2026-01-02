/**
 * Game Action Log Types
 * Tracks all player actions for display in the action log
 * @version 1.0.0
 */
console.log('[types/game-log.ts] v1.0.0 loaded')

import type { PlayerColor } from './player-color'

// ============================================
// ENUMS
// ============================================

/**
 * Game action types for logging
 */
export enum GameActionType {
  // Game flow
  GAME_START = 'GAME_START',
  ROUND_START = 'ROUND_START',
  PHASE_CHANGE = 'PHASE_CHANGE',

  // HUNTING phase
  ARTIFACT_SELECTED = 'ARTIFACT_SELECTED',
  CARD_SELECTED = 'CARD_SELECTED',
  SELECTION_CONFIRMED = 'SELECTION_CONFIRMED',
  SEVEN_LEAGUE_BOOTS_CARD = 'SEVEN_LEAGUE_BOOTS_CARD',

  // ACTION phase
  DRAW_CARD = 'DRAW_CARD',
  TAME_CARD = 'TAME_CARD',
  SELL_CARD = 'SELL_CARD',
  COINS_TRANSFERRED = 'COINS_TRANSFERRED',
  EFFECT_TRIGGERED = 'EFFECT_TRIGGERED',
  PLAYER_PASSED = 'PLAYER_PASSED',

  // Resolution
  ROUND_END = 'ROUND_END',
  GAME_END = 'GAME_END',
}

// ============================================
// INTERFACES
// ============================================

/**
 * Coin change information
 */
export interface CoinChange {
  /** 6-value coins */
  six?: number
  /** 3-value coins */
  three?: number
  /** 1-value coins */
  one?: number
}

/**
 * Game action log entry
 */
export interface GameActionLog {
  /** Unique ID */
  id: string
  /** Action type */
  type: GameActionType
  /** Player ID who performed the action */
  playerId: string
  /** Player name */
  playerName: string
  /** Player color */
  playerColor: PlayerColor
  /** Round number */
  round: number
  /** Game phase */
  phase: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  /** Timestamp (milliseconds since epoch) */
  timestamp: number
  /** Action description (Traditional Chinese) */
  description: string
  /** Related card instance IDs */
  cardIds?: string[]
  /** Related card names (for display) */
  cardNames?: string[]
  /** Related artifact ID */
  artifactId?: string
  /** Related artifact name (for display) */
  artifactName?: string
  /** Coin change information */
  coinsChange?: CoinChange
}

/**
 * Game log state
 */
export interface GameLogState {
  /** All log entries */
  logs: GameActionLog[]
  /** Maximum number of logs to display */
  maxDisplayCount: number
}

// ============================================
// FIREBASE DATA STRUCTURE
// ============================================

/**
 * Firebase-compatible game action log (excludes id)
 */
export interface GameActionLogData {
  type: GameActionType
  playerId: string
  playerName: string
  playerColor: PlayerColor
  round: number
  phase: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  timestamp: number
  description: string
  cardIds?: string[]
  cardNames?: string[]
  artifactId?: string
  artifactName?: string
  coinsChange?: CoinChange
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a game action log entry
 */
export function createGameActionLog(
  type: GameActionType,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor,
  round: number,
  phase: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED',
  description: string,
  options?: {
    cardIds?: string[]
    cardNames?: string[]
    artifactId?: string
    artifactName?: string
    coinsChange?: CoinChange
  }
): GameActionLogData {
  return {
    type,
    playerId,
    playerName,
    playerColor,
    round,
    phase,
    timestamp: Date.now(),
    description,
    ...options,
  }
}

/**
 * Format coin change for display
 * @example formatCoinChange({ six: 1, three: 2, one: 3 }) => "6元×1 + 3元×2 + 1元×3"
 */
export function formatCoinChange(coins: CoinChange): string {
  const parts: string[] = []

  if (coins.six && coins.six > 0) {
    parts.push(`6元×${coins.six}`)
  }
  if (coins.three && coins.three > 0) {
    parts.push(`3元×${coins.three}`)
  }
  if (coins.one && coins.one > 0) {
    parts.push(`1元×${coins.one}`)
  }

  return parts.join(' + ')
}

/**
 * Calculate total coin value
 */
export function calculateCoinValue(coins: CoinChange): number {
  return (coins.six || 0) * 6 + (coins.three || 0) * 3 + (coins.one || 0) * 1
}

/**
 * Get action type display name (Traditional Chinese)
 */
export function getActionTypeDisplayName(type: GameActionType): string {
  switch (type) {
    case GameActionType.GAME_START:
      return '遊戲開始'
    case GameActionType.ROUND_START:
      return '回合開始'
    case GameActionType.PHASE_CHANGE:
      return '階段變更'
    case GameActionType.ARTIFACT_SELECTED:
      return '選擇神器'
    case GameActionType.CARD_SELECTED:
      return '選擇卡片'
    case GameActionType.SELECTION_CONFIRMED:
      return '確認選擇'
    case GameActionType.SEVEN_LEAGUE_BOOTS_CARD:
      return '七里靴效果'
    case GameActionType.DRAW_CARD:
      return '抽卡'
    case GameActionType.TAME_CARD:
      return '馴服生物'
    case GameActionType.SELL_CARD:
      return '賣卡'
    case GameActionType.COINS_TRANSFERRED:
      return '金錢轉移'
    case GameActionType.EFFECT_TRIGGERED:
      return '效果觸發'
    case GameActionType.PLAYER_PASSED:
      return '跳過回合'
    case GameActionType.ROUND_END:
      return '回合結束'
    case GameActionType.GAME_END:
      return '遊戲結束'
    default:
      return '未知動作'
  }
}
