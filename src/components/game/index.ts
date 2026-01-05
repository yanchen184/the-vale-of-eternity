/**
 * Game components exports
 * Core UI components for The Vale of Eternity game
 * @version 6.8.0 - Added ScoreHistory component with multi-player support
 */
console.log('[components/game/index.ts] v6.8.0 loaded')

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
export type { RightSidebarProps, PlayerCoinInfo } from './RightSidebar'
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

// Artifact Selection components (v4.3.0)
export { ArtifactSelector } from './ArtifactSelector'
export { CompactArtifactSelector } from './CompactArtifactSelector'
export type { ArtifactSelectorProps } from './ArtifactSelector'
export type { CompactArtifactSelectorProps } from './CompactArtifactSelector'

// New Hand Panel System (v5.0.0)
export { FixedHandPanel } from './FixedHandPanel'
export type { FixedHandPanelProps, HandViewMode } from './FixedHandPanel'
export { HandGridView } from './HandGridView'
export type { HandGridViewProps } from './HandGridView'
export { HorizontalCardStrip } from './HorizontalCardStrip'
export type { HorizontalCardStripProps } from './HorizontalCardStrip'
export { CardActionPanel } from './CardActionPanel'
export type { CardActionPanelProps } from './CardActionPanel'

// Initial Card Selection (removed - not needed)

// Flying Coin Animation (v5.2.0)
export { FlyingCoinContainer } from './FlyingCoinContainer'
export type { FlyingCoinContainerProps } from './FlyingCoinContainer'

// Multi-player Coin System (v5.3.0)
export { PlayerCoinAreaCompact } from './PlayerCoinAreaCompact'
export type {
  PlayerCoinAreaCompactProps,
  PlayerCoinAreaCompactRef,
} from './PlayerCoinAreaCompact'
export { AllPlayersCoinArea } from './AllPlayersCoinArea'
export type {
  AllPlayersCoinAreaProps,
  AllPlayersCoinAreaRef,
  PlayerCoinData,
} from './AllPlayersCoinArea'
export { MultiplayerCoinSystem } from './MultiplayerCoinSystem'
export type { MultiplayerCoinSystemProps } from './MultiplayerCoinSystem'

// Game Phase UI Components (v6.2.0)
export { HuntingPhaseUI } from './HuntingPhaseUI'
export type { HuntingPhaseProps, SevenLeagueBootsState } from './HuntingPhaseUI'
export { ActionPhaseUI } from './ActionPhaseUI'
export type { ActionPhaseUIProps } from './ActionPhaseUI'

// Game Action Log Component (v7.0.0)
export { GameActionLog } from './GameActionLog'
export type { GameActionLogProps } from './GameActionLog'

// Player Hand Preview Component (v7.0.0)
export { PlayerHandPreview } from './PlayerHandPreview'
export type { PlayerHandPreviewProps } from './PlayerHandPreview'

// Current Turn Cards Component (v7.0.0)
export { CurrentTurnCards } from './CurrentTurnCards'
export type { CurrentTurnCardsProps } from './CurrentTurnCards'

// Artifact Action UI Components (v6.4.0)
export { ArtifactActionPanel } from './ArtifactActionPanel'
export type { ArtifactActionPanelProps } from './ArtifactActionPanel'
export { ArtifactEffectModal } from './ArtifactEffectModal'
export type { ArtifactEffectModalProps, EffectInputType } from './ArtifactEffectModal'
export { StoneUpgradeModal } from './StoneUpgradeModal'
export type { StoneUpgradeModalProps, StoneUpgrade } from './StoneUpgradeModal'
export { StonePaymentModal } from './StonePaymentModal'
export type { StonePaymentModalProps } from './StonePaymentModal'

export { FreeStoneSelectionModal } from './FreeStoneSelectionModal'
export type { FreeStoneSelectionModalProps } from './FreeStoneSelectionModal'

// Lightning Effect for Ifrit card (v6.5.0)
export { LightningEffect } from './LightningEffect'
export type { LightningEffectProps } from './LightningEffect'

// Score Gain Effect for ON_SCORE cards (v6.30.0)
export { ScoreGainEffect } from './ScoreGainEffect'
export type { ScoreGainEffectProps } from './ScoreGainEffect'

// Score History component (v6.8.0)
export { ScoreHistory } from './ScoreHistory'
export type { ScoreHistoryProps, PlayerHistoryData } from './ScoreHistory'
