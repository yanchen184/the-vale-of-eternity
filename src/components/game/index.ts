/**
 * Game components exports
 * Core UI components for The Vale of Eternity game
 * @version 3.6.0 - Added PlayersInfoArea and PlayersFieldArea for ACTION phase
 */
console.log('[components/game/index.ts] v3.6.0 loaded')

// Card components
export { Card, CardBack } from './Card'
export type { CardProps, CardBackProps } from './Card'

// Player marker components (for multiplayer card selection)
export { PlayerMarker, ColorPicker } from './PlayerMarker'
export type { PlayerMarkerProps, ColorPickerProps } from './PlayerMarker'

// Player hand component
export { PlayerHand } from './PlayerHand'
export type { PlayerHandProps } from './PlayerHand'

// Play field component
export { PlayField } from './PlayField'
export type { PlayFieldProps } from './PlayField'

// Market area component
export { MarketArea } from './MarketArea'
export type { MarketAreaProps } from './MarketArea'

// Stone pool component
export { StonePool } from './StonePool'
export type { StonePoolProps } from './StonePool'

// Game mode toggle component (v3.1.0)
export { GameModeToggle } from './GameModeToggle'
export type { GameModeToggleProps } from './GameModeToggle'

// Manual control components (v3.2.0)
export { ManualControlPanel } from './ManualControlPanel'
export { StoneManualControl } from './StoneManualControl'
export { ScoreManualControl } from './ScoreManualControl'
export { OperationHistory } from './OperationHistory'

// Mahjong-style layout components (v3.3.0)
export { MahjongLayout, MahjongGameBoard } from './MahjongLayout'
export type {
  MahjongLayoutProps,
  MahjongGameBoardProps,
  PlayerSeatData,
  PlayerData,
  SeatPosition,
  StoneBankData,
} from './MahjongLayout'

// Score and Coin Management components (v3.5.0)
export { ScoreTrack } from './ScoreTrack'
export type { ScoreTrackProps, PlayerScoreInfo } from './ScoreTrack'
export { BankArea } from './BankArea'
export type { BankAreaProps } from './BankArea'
export { PlayerCoinArea } from './PlayerCoinArea'
export type { PlayerCoinAreaProps } from './PlayerCoinArea'

// Multiplayer ACTION phase components (v3.6.0)
export { PlayersInfoArea } from './PlayersInfoArea'
export type { PlayersInfoAreaProps, PlayerInfoData } from './PlayersInfoArea'
export { PlayersFieldArea } from './PlayersFieldArea'
export type { PlayersFieldAreaProps, PlayerFieldData } from './PlayersFieldArea'
