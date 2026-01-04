/**
 * Artifact Type Definitions for Artifacts Expansion
 * @version 1.0.0
 */
console.log('[types/artifacts.ts] v1.0.0 loaded')

// ============================================
// ARTIFACT TYPES
// ============================================

/**
 * Artifact effect activation types
 */
export enum ArtifactType {
  /** ⚡ Instant - Immediate effect when chosen or triggered */
  INSTANT = 'INSTANT',
  /** ✕ Action - Requires an action to activate */
  ACTION = 'ACTION',
  /** ∞ Permanent - Ongoing passive effect */
  PERMANENT = 'PERMANENT',
}

/**
 * Artifact categories determine when they appear in the game
 */
export enum ArtifactCategory {
  /** Core artifacts - always available (2+ players) */
  CORE = 'CORE',
  /** Available only in 3+ player games */
  THREE_PLAYER = 'THREE_PLAYER',
  /** Available only in 4 player games */
  FOUR_PLAYER = 'FOUR_PLAYER',
  /** Random pool - 3 selected from 6 */
  RANDOM = 'RANDOM',
}

/**
 * Stone types referenced in artifact effects
 */
export enum StoneColor {
  RED = 'RED',       // 紅石 (1元)
  BLUE = 'BLUE',     // 藍石 (3元)
  GREEN = 'GREEN',   // 綠石 (6元)
  PURPLE = 'PURPLE', // 紫石 (特殊)
}

// ============================================
// ARTIFACT INTERFACE
// ============================================

/**
 * Artifact card definition
 */
export interface Artifact {
  /** Unique identifier */
  id: string
  /** English name */
  name: string
  /** Traditional Chinese name */
  nameTw: string
  /** Artifact type (Instant/Action/Permanent) */
  type: ArtifactType
  /** Which games this artifact appears in (based on player count) */
  category: ArtifactCategory
  /** English description */
  description: string
  /** Traditional Chinese description */
  descriptionTw: string
  /** Image path (relative to public folder) */
  image: string
  /** Whether this artifact is implemented (skip Seven-League Boots) */
  implemented: boolean
  /** Detailed effect mechanics for implementation */
  effectDetails?: ArtifactEffectDetails
}

/**
 * Detailed effect mechanics for artifact implementation
 */
export interface ArtifactEffectDetails {
  /** Whether this artifact affects card selection */
  affectsCardSelection?: boolean
  /** Whether this artifact affects stones/resources */
  affectsStones?: boolean
  /** Whether this artifact affects sheltering */
  affectsSheltering?: boolean
  /** Whether this artifact affects recall/hand */
  affectsRecall?: boolean
  /** Whether this artifact affects play area capacity */
  affectsPlayArea?: boolean
  /** Custom implementation notes */
  implementationNotes?: string
}

// ============================================
// ARTIFACT SELECTION STATE
// ============================================

/**
 * Player's artifact selection for a round
 */
export interface ArtifactSelection {
  /** Player ID */
  playerId: string
  /** Selected artifact ID */
  artifactId: string
  /** Round number when selected */
  round: number
  /** Whether this artifact has been used this round (for Action types) */
  used: boolean
}

/**
 * Artifact draft state for the current round
 */
export interface ArtifactDraftState {
  /** Current round number */
  round: number
  /** Available artifacts for this game (based on player count) */
  availableArtifacts: string[]
  /** Player selections for this round */
  selections: ArtifactSelection[]
  /** Artifacts used in previous rounds (can't be reused) */
  usedPreviousRounds: Record<string, string[]> // playerId -> artifactIds[]
  /** Whether artifact draft phase is complete */
  draftComplete: boolean
}

export default {
  ArtifactType,
  ArtifactCategory,
  StoneColor,
}
