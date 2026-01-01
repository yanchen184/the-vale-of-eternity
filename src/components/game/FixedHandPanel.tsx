/**
 * FixedHandPanel Component
 * Fixed bottom hand panel with 3 view modes: minimized, standard, expanded
 * Replaces the floating DraggableHandWindow
 * @version 2.0.0 - Right sidebar action panel
 */
console.log('[components/game/FixedHandPanel.tsx] v2.0.0 loaded')

import { memo, useState, useCallback, useEffect } from 'react'
import { Hand, Minus, LayoutGrid, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import { HandGridView } from './HandGridView'
import { HorizontalCardStrip } from './HorizontalCardStrip'
import { CardActionPanel } from './CardActionPanel'

// ============================================
// TYPES
// ============================================

export type HandViewMode = 'minimized' | 'standard' | 'expanded'

export interface FixedHandPanelProps {
  /** Player's hand cards */
  cards: CardInstance[]
  /** Callback when a card is clicked */
  onCardClick?: (card: CardInstance) => void
  /** Callback when a card is selected for taming */
  onTameCard?: (cardId: string) => void
  /** Callback when a card is sold */
  onSellCard?: (cardId: string) => void
  /** Callback when a card is discarded */
  onDiscardCard?: (cardId: string) => void
  /** Callback when a card is moved to sanctuary (expansion mode) */
  onMoveToSanctuary?: (cardId: string) => void
  /** Selected card instance ID (for highlighting) */
  selectedCardId?: string | null
  /** Whether to show action buttons on cards */
  showCardActions?: boolean
  /** Check if a card can be tamed */
  canTameCard?: (cardId: string) => boolean
  /** Current round number (for sell restriction) */
  currentRound?: number
}

// ============================================
// HOOKS
// ============================================

/** Hook to manage and persist hand view mode preference */
const useHandViewPreference = () => {
  const [viewMode, setViewMode] = useState<HandViewMode>(() => {
    const saved = localStorage.getItem('handViewMode')
    return (saved as HandViewMode) || 'standard'
  })

  const updateViewMode = useCallback((mode: HandViewMode) => {
    setViewMode(mode)
    localStorage.setItem('handViewMode', mode)
  }, [])

  return [viewMode, updateViewMode] as const
}

// ============================================
// VIEW MODE BUTTON
// ============================================

interface ViewModeButtonProps {
  mode: HandViewMode
  current: HandViewMode
  onClick: () => void
  icon: React.ReactNode
  label: string
}

const ViewModeButton = memo(function ViewModeButton({
  mode,
  current,
  onClick,
  icon,
  label,
}: ViewModeButtonProps) {
  const isActive = mode === current

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 rounded-lg transition-all duration-150',
        'hover:bg-purple-500/20',
        isActive
          ? 'bg-purple-600/40 text-purple-300'
          : 'bg-slate-700/50 text-slate-400'
      )}
      title={label}
      data-testid={`view-mode-${mode}`}
    >
      {icon}
    </button>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const FixedHandPanel = memo(function FixedHandPanel({
  cards,
  onCardClick,
  onTameCard,
  onSellCard,
  onDiscardCard,
  onMoveToSanctuary,
  selectedCardId,
  showCardActions,
  canTameCard,
  currentRound,
}: FixedHandPanelProps) {
  const [viewMode, setViewMode] = useHandViewPreference()

  // Find selected card
  const selectedCard = cards.find(c => c.instanceId === selectedCardId)
  const canTame = selectedCard && canTameCard ? canTameCard(selectedCard.instanceId) : false

  // Check if card can be sold (only cards from current round)
  const canSell = selectedCard && currentRound !== undefined
    // @ts-expect-error - acquiredInRound is added at runtime from Firebase
    ? (selectedCard.acquiredInRound === currentRound || selectedCard.acquiredInRound === undefined)
    : true

  return (
    <div
      className={cn(
        'hand-panel flex',
        viewMode === 'minimized' && 'hand-panel--minimized',
        viewMode === 'standard' && 'hand-panel--standard',
        viewMode === 'expanded' && 'hand-panel--expanded'
      )}
      data-testid="fixed-hand-panel"
    >
      {/* Left: Hand Cards Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Always Visible */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 flex-shrink-0"
          data-testid="hand-panel-header"
        >
          <div className="flex items-center gap-3">
            <Hand className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-purple-300">
              我的手牌 ({cards.length} 張)
            </span>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center gap-2">
            <ViewModeButton
              mode="minimized"
              current={viewMode}
              onClick={() => setViewMode('minimized')}
              icon={<Minus className="w-4 h-4" />}
              label="最小化"
            />
            <ViewModeButton
              mode="standard"
              current={viewMode}
              onClick={() => setViewMode('standard')}
              icon={<LayoutGrid className="w-4 h-4" />}
              label="標準視圖"
            />
            <ViewModeButton
              mode="expanded"
              current={viewMode}
              onClick={() => setViewMode('expanded')}
              icon={<Maximize2 className="w-4 h-4" />}
              label="展開視圖"
            />
          </div>
        </div>

        {/* Content Area - Hidden when minimized */}
        {viewMode !== 'minimized' && (
          <div className="overflow-hidden flex-1">
            {viewMode === 'standard' ? (
              <HorizontalCardStrip
                cards={cards}
                onCardClick={onCardClick}
                selectedCardId={selectedCardId}
                canTameCard={canTameCard}
                currentRound={currentRound}
              />
            ) : (
              <HandGridView
                cards={cards}
                onCardClick={onCardClick}
                selectedCardId={selectedCardId}
                canTameCard={canTameCard}
                currentRound={currentRound}
              />
            )}
          </div>
        )}
      </div>

      {/* Right: Action Panel Sidebar */}
      {viewMode !== 'minimized' && selectedCard && showCardActions && (
        <div className="w-64 border-l border-slate-700/50 bg-slate-800/50 flex flex-col">
          <div className="px-4 py-2 border-b border-slate-700/50">
            <h3 className="font-bold text-purple-300 text-sm">卡片操作</h3>
          </div>
          <div className="flex-1 p-4">
            <CardActionPanel
              card={selectedCard}
              onTame={onTameCard ? () => onTameCard(selectedCard.instanceId) : undefined}
              onSell={canSell && onSellCard ? () => onSellCard(selectedCard.instanceId) : undefined}
              onDiscard={onDiscardCard ? () => onDiscardCard(selectedCard.instanceId) : undefined}
              onSanctuary={onMoveToSanctuary ? () => onMoveToSanctuary(selectedCard.instanceId) : undefined}
              canTame={canTame}
              canSell={canSell}
              position="right"
            />
          </div>
        </div>
      )}
    </div>
  )
})

export default FixedHandPanel
