/**
 * Stores barrel export v3.0.0
 * Single Player Mode
 * @version 3.0.0
 */
console.log('[stores/index.ts] v3.0.0 loaded')

// Single Player Game Store
export {
  useGameStore,
  useGamePhase,
  useRound,
  useMarket,
  useHand,
  useField,
  useStones,
  useDeckSize,
  useDiscardPile,
  useGameOver,
  usePlayerName,
  // useTotalStoneValue and useAvailableActions removed - use store methods directly
  useTameableFromHand,
  useTameableFromMarket,
  selectPhase,
  selectRound,
  selectMarket,
  selectHand,
  selectField,
  selectStones,
  selectDeckSize,
  selectDiscardPile,
  selectIsGameOver,
  selectFinalScore,
  selectScoreBreakdown,
  selectEndReason,
  selectPlayerName,
  SinglePlayerPhase,
  SinglePlayerActionType,
  SinglePlayerError,
  SinglePlayerErrorCode,
  SINGLE_PLAYER_CONSTANTS,
} from './useGameStore'

export type {
  SinglePlayerGameState,
  StonePool,
  ScoreBreakdown,
} from './useGameStore'

// Other stores
export { useLobbyStore } from './useLobbyStore'
export { useToastStore } from './useToastStore'
