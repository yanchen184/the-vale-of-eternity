/**
 * Stores barrel export
 * @version 1.0.0
 */
console.log('[stores/index.ts] v1.0.0 loaded')

export {
  useGameStore,
  useGamePhase,
  useRound,
  useMarket,
  useLocalPlayer,
  useOpponent,
  useIsMyTurn,
  useGameOver,
  selectPhase,
  selectRound,
  selectMarket,
  selectPlayer,
  selectLocalPlayer,
  selectOpponentPlayer,
  selectIsGameOver,
  selectWinner,
  selectEndReason,
  selectIsLocalPlayerTurn,
  selectDiscardPile,
  selectDeckSize,
  GamePhase,
  ActionType,
  GameError,
  GameErrorCode,
} from './useGameStore'
export type { MVPGameState, MVPPlayerState, GameAction, VictoryResult } from './useGameStore'
export { useLobbyStore } from './useLobbyStore'
export { useToastStore } from './useToastStore'
