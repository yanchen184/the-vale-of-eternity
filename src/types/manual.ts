/**
 * Manual Mode Type Definitions
 * Types for manual operation mode where players control all game actions
 * @version 1.0.0
 */
console.log('[types/manual.ts] v1.0.0 loaded')

import type { StoneType, CardLocation } from './cards'
import type { SinglePlayerGameState } from './game'

// ============================================
// ENUMS
// ============================================

/**
 * Game mode enum
 * Determines whether effects are automatic or manual
 */
export enum GameMode {
  /** Automatic mode: Effects execute automatically */
  AUTOMATIC = 'AUTOMATIC',
  /** Manual mode: Player controls all actions */
  MANUAL = 'MANUAL',
}

/**
 * Manual operation type
 * Defines the type of manual operation performed
 */
export enum ManualOperationType {
  /** Add stones to player pool */
  ADD_STONES = 'ADD_STONES',
  /** Remove stones from player pool */
  REMOVE_STONES = 'REMOVE_STONES',
  /** Adjust player score */
  ADJUST_SCORE = 'ADJUST_SCORE',
  /** Manually trigger a card effect */
  TRIGGER_EFFECT = 'TRIGGER_EFFECT',
  /** Move a card between locations */
  MOVE_CARD = 'MOVE_CARD',
  /** Custom operation */
  CUSTOM = 'CUSTOM',
}

// ============================================
// INTERFACES
// ============================================

/**
 * Manual operation record
 * Records a single manual operation for history tracking
 */
export interface ManualOperation {
  /** Unique operation ID */
  id: string
  /** Operation type */
  type: ManualOperationType
  /** Timestamp when operation occurred */
  timestamp: number
  /** Human-readable description */
  description: string
  /** State snapshot before operation */
  stateBefore: Partial<SinglePlayerGameState>
  /** State snapshot after operation */
  stateAfter: Partial<SinglePlayerGameState>
  /** Operation-specific data */
  payload: ManualOperationPayload
  /** Whether this operation can be undone */
  canUndo: boolean
}

// ============================================
// OPERATION PAYLOADS
// ============================================

/**
 * Add stones payload
 */
export interface AddStonesPayload {
  type: 'ADD_STONES'
  stoneType: StoneType
  amount: number
}

/**
 * Remove stones payload
 */
export interface RemoveStonesPayload {
  type: 'REMOVE_STONES'
  stoneType: StoneType
  amount: number
}

/**
 * Adjust score payload
 */
export interface AdjustScorePayload {
  type: 'ADJUST_SCORE'
  amount: number
  reason: string
}

/**
 * Trigger effect payload
 */
export interface TriggerEffectPayload {
  type: 'TRIGGER_EFFECT'
  cardId: string
  effectIndex: number
}

/**
 * Move card payload
 */
export interface MoveCardPayload {
  type: 'MOVE_CARD'
  cardId: string
  from: CardLocation
  to: CardLocation
}

/**
 * Custom operation payload
 */
export interface CustomPayload {
  type: 'CUSTOM'
  data: Record<string, unknown>
}

/**
 * Union type for all operation payloads
 */
export type ManualOperationPayload =
  | AddStonesPayload
  | RemoveStonesPayload
  | AdjustScorePayload
  | TriggerEffectPayload
  | MoveCardPayload
  | CustomPayload

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a unique operation ID
 */
export function createOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a manual operation record
 */
export function createManualOperation(
  type: ManualOperationType,
  description: string,
  payload: ManualOperationPayload,
  stateBefore: Partial<SinglePlayerGameState>,
  stateAfter: Partial<SinglePlayerGameState>,
  canUndo: boolean = true
): ManualOperation {
  return {
    id: createOperationId(),
    type,
    timestamp: Date.now(),
    description,
    stateBefore,
    stateAfter,
    payload,
    canUndo,
  }
}
