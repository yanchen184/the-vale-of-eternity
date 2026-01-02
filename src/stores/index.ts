/**
 * Stores barrel export v3.2.0
 * Single Player Mode with Manual Mode support
 * @version 3.2.0 - Added currentTurnCards and selectedArtifactCard selectors
 */
console.log('[stores/index.ts] v3.2.0 loaded')

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
  useCurrentTurnCards,
  useSelectedArtifactCard,
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
  selectCurrentTurnCards,
  selectSelectedArtifactCard,
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
