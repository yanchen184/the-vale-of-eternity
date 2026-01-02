/**
 * HuntingPhaseUI Component
 * Shared hunting phase UI for both single-player and multiplayer games
 * Supports: Card selection, Artifact selection, Seven-League Boots selection
 * @version 1.0.0
 */
console.log('[components/game/HuntingPhaseUI.tsx] v1.0.0 loaded')

import { Card } from './Card'
import { CompactArtifactSelector } from './CompactArtifactSelector'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import type { PlayerColor } from '@/types/player-color'

// ============================================
// TYPES
// ============================================

/** Seven-League Boots state from Firebase */
export interface SevenLeagueBootsState {
  activePlayerId: string
  extraCardId: string
  selectedCardId?: string
}

export interface HuntingPhaseProps {
  marketCards: CardInstance[]
  isYourTurn: boolean
  currentPlayerName: string
  currentPlayerId: string
  currentRound?: number
  onToggleCard: (cardId: string) => void
  onConfirmSelection: () => void
  cardSelectionMap: Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>
  mySelectedCardId: string | null
  hasSelectedCard: boolean
  // Artifact selection props (Expansion mode)
  isExpansionMode?: boolean
  availableArtifacts?: string[]
  usedArtifacts?: string[]
  disabledArtifacts?: string[]  // Artifacts disabled due to requirements not met
  artifactSelectionMap?: Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>
  onSelectArtifact?: (artifactId: string) => void
  playerName?: string
  artifactSelectorPlayerName?: string  // Name of player whose turn it is to select artifact
  isYourArtifactTurn?: boolean
  isArtifactSelectionActive?: boolean
  // Seven-League Boots props
  sevenLeagueBootsState?: SevenLeagueBootsState | null
  isInSevenLeagueBootsSelection?: boolean
  onSelectSevenLeagueBootsCard?: (cardId: string) => void
  onConfirmSevenLeagueBootsSelection?: () => void
}

// ============================================
// COMPONENT
// ============================================

export function HuntingPhaseUI({
  marketCards,
  isYourTurn,
  currentPlayerName,
  currentPlayerId: _currentPlayerId,
  currentRound,
  onToggleCard,
  onConfirmSelection: _onConfirmSelection,
  cardSelectionMap,
  mySelectedCardId,
  hasSelectedCard,
  isExpansionMode,
  availableArtifacts,
  usedArtifacts,
  disabledArtifacts,
  artifactSelectionMap,
  onSelectArtifact,
  playerName,
  artifactSelectorPlayerName,
  isYourArtifactTurn,
  isArtifactSelectionActive,
  // Seven-League Boots props
  sevenLeagueBootsState,
  isInSevenLeagueBootsSelection,
  onSelectSevenLeagueBootsCard,
  onConfirmSevenLeagueBootsSelection: _onConfirmSevenLeagueBootsSelection,
}: HuntingPhaseProps) {
  void _currentPlayerId
  void _onConfirmSelection // Reserved for future use
  void _onConfirmSevenLeagueBootsSelection // Confirm button is in RightSidebar

  // Determine which phase to show
  const showSevenLeagueBootsSelection = !!sevenLeagueBootsState
  const showArtifactSelection = isExpansionMode && isArtifactSelectionActive && !showSevenLeagueBootsSelection

  // Get header info based on current state
  const getHeaderInfo = () => {
    if (showSevenLeagueBootsSelection) {
      return {
        title: '七里靴效果',
        description: isInSevenLeagueBootsSelection
          ? sevenLeagueBootsState?.selectedCardId
            ? '已選擇卡片，點擊「確認棲息地」將卡片加入棲息地'
            : '選擇一張卡片加入棲息地'
          : `等待 ${currentPlayerName} 選擇棲息地卡片...`,
        headerColor: 'text-purple-400',
      }
    }
    if (showArtifactSelection) {
      return {
        title: '神器選擇階段',
        description: isYourArtifactTurn
          ? '選擇一個神器，然後點擊「確認選擇」'
          : `等待 ${currentPlayerName} 選擇神器...`,
        headerColor: 'text-blue-400',
      }
    }
    return {
      title: '選卡階段',
      description: isYourTurn
        ? hasSelectedCard
          ? '點擊「確認選擇」鎖定卡片，或點擊卡片取消/切換選擇'
          : '點擊一張卡片進行選擇'
        : `等待 ${currentPlayerName} 選擇卡片...`,
      headerColor: 'text-blue-400',
    }
  }

  const headerInfo = getHeaderInfo()

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden" data-testid="hunting-phase">
      {/* Header */}
      <div className="text-center mb-4 flex-shrink-0">
        <h2 className={cn('text-xl font-bold mb-1', headerInfo.headerColor)}>
          {headerInfo.title}
        </h2>
        <p className="text-sm text-slate-400">
          {headerInfo.description}
        </p>
      </div>

      {/* Seven-League Boots Instruction Banner */}
      {showSevenLeagueBootsSelection && (
        <div className="mb-4 p-3 bg-purple-900/30 border border-purple-500/50 rounded-lg flex-shrink-0">
          <p className="text-sm text-purple-300 text-center">
            {isInSevenLeagueBootsSelection
              ? '點擊市場上的一張卡片，將其加入你的棲息地（不需支付費用）'
              : '等待其他玩家完成七里靴選擇...'}
          </p>
        </div>
      )}

      {/* Card Grid - Always show market cards */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center pb-4">
          {marketCards.map((card, index) => {
            const selectionInfo = cardSelectionMap.get(card.instanceId)
            const isConfirmed = selectionInfo?.isConfirmed ?? false
            const isMySelection = mySelectedCardId === card.instanceId

            // Seven-League Boots selection mode
            if (showSevenLeagueBootsSelection) {
              const isSelectedForShelter = sevenLeagueBootsState?.selectedCardId === card.instanceId
              const canClickForShelter = isInSevenLeagueBootsSelection

              return (
                <div
                  key={card.instanceId}
                  className={cn(
                    'transition-all relative',
                    canClickForShelter
                      ? 'hover:scale-105 cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  )}
                  data-testid={`seven-league-boots-card-${index}`}
                >
                  <Card
                    card={card}
                    index={index}
                    compact={false}
                    currentRound={currentRound}
                    onClick={() => canClickForShelter && onSelectSevenLeagueBootsCard?.(card.instanceId)}
                    isSelected={isSelectedForShelter}
                    className={cn(
                      isSelectedForShelter && 'ring-4 ring-purple-400 ring-opacity-75 shadow-purple-500/50',
                      canClickForShelter && !isSelectedForShelter && 'hover:border-purple-400 hover:shadow-purple-500/50'
                    )}
                  />
                  {/* Selected for shelter indicator */}
                  {isSelectedForShelter && (
                    <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                      棲息地
                    </div>
                  )}
                </div>
              )
            }

            // Normal card selection mode
            // Disable card selection during artifact selection phase
            const canClick = isYourTurn && !isConfirmed && !showArtifactSelection

            return (
              <div
                key={card.instanceId}
                className={cn(
                  'transition-all relative',
                  canClick
                    ? 'hover:scale-105 cursor-pointer'
                    : isConfirmed
                      ? 'cursor-default'
                      : 'opacity-60 cursor-not-allowed'
                )}
                data-testid={`hunting-card-${index}`}
              >
                <Card
                  card={card}
                  index={index}
                  compact={false}
                  currentRound={currentRound}
                  onClick={() => canClick && onToggleCard(card.instanceId)}
                  selectedByColor={selectionInfo?.color}
                  selectedByName={selectionInfo?.playerName}
                  isConfirmed={isConfirmed}
                  isSelected={isMySelection}
                  className={cn(
                    isMySelection && !isConfirmed && 'ring-4 ring-blue-400 ring-opacity-75',
                    canClick && 'hover:border-blue-400 hover:shadow-blue-500/50',
                    isConfirmed && 'border-slate-500'
                  )}
                />
                {isConfirmed && (
                  <div className="absolute inset-0 bg-black/30 rounded-lg pointer-events-none" />
                )}
              </div>
            )
            })}
        </div>

        {/* Artifact Selection at Bottom - Show only during artifact selection phase */}
        {showArtifactSelection && availableArtifacts && onSelectArtifact && (
          <div className="flex-shrink-0 mt-4 border-t border-purple-500/30 pt-4">
            <CompactArtifactSelector
              availableArtifacts={availableArtifacts}
              usedArtifacts={usedArtifacts || []}
              artifactSelections={artifactSelectionMap}
              round={currentRound || 1}
              playerName={artifactSelectorPlayerName || playerName || '玩家'}
              onSelectArtifact={onSelectArtifact}
              isActive={isYourArtifactTurn ?? false}
              disabledArtifacts={disabledArtifacts}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default HuntingPhaseUI
