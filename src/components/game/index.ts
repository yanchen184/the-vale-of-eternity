/**
 * Game components exports
 * Core UI components for The Vale of Eternity game
 * @version 4.2.0 - Added DraggableHandWindow for floating hand display
 */
console.log('[components/game/index.ts] v4.2.0 loaded')

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
export { DiscardPile } from './DiscardPile'
export type { DiscardPileProps } from './DiscardPile'

// Multiplayer ACTION phase components (v3.6.0)
export { PlayersInfoArea } from './PlayersInfoArea'
export type { PlayersInfoAreaProps, PlayerInfoData } from './PlayersInfoArea'
export { PlayersFieldArea } from './PlayersFieldArea'
export type { PlayersFieldAreaProps, PlayerFieldData } from './PlayersFieldArea'

// Symmetric Layout components (v4.0.0)
export { LeftSidebar } from './LeftSidebar'
export type { LeftSidebarProps, PlayerSidebarData } from './LeftSidebar'
export { RightSidebar } from './RightSidebar'
export type { RightSidebarProps } from './RightSidebar'
export { MainGameArea } from './MainGameArea'
export type { MainGameAreaProps } from './MainGameArea'
export { GameLayout, GameHeader } from './GameLayout'
export type { GameLayoutProps, GameHeaderProps } from './GameLayout'

// Score Bar component (v4.1.0)
export { ScoreBar } from './ScoreBar'
export type { ScoreBarProps, ScoreBarPlayerData } from './ScoreBar'

// Draggable Hand Window component (v4.2.0)
export { DraggableHandWindow } from './DraggableHandWindow'
export type { DraggableHandWindowProps } from './DraggableHandWindow'
