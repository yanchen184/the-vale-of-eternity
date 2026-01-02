/**
 * FixedHandPanel Component
 * Fixed bottom hand panel with 3 view modes: minimized, standard, expanded
 * Replaces the floating DraggableHandWindow
 * @version 2.1.0 - 點擊最小化手牌自動展開為標準視圖
 */
console.log('[components/game/FixedHandPanel.tsx] v2.1.0 loaded')

import { memo, useState, useCallback } from 'react'
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
  onSellCard: _onSellCard, // Reserved for future use (currently disabled)
  onDiscardCard,
  onMoveToSanctuary,
  selectedCardId,
  showCardActions,
  canTameCard,
  currentRound, // Still needed for HandGridView and HorizontalCardStrip
}: FixedHandPanelProps) {
  const [viewMode, setViewMode] = useHandViewPreference()

  // Find selected card
  const selectedCard = cards.find(c => c.instanceId === selectedCardId)
  const canTame = selectedCard && canTameCard ? canTameCard(selectedCard.instanceId) : false

  // Removed: canSell - hand cards can no longer be sold (v3.1.0)

  // Wrap onCardClick to auto-expand from minimized mode
  const handleCardClick = useCallback((card: CardInstance) => {
    // If in minimized mode, expand to standard view first
    if (viewMode === 'minimized') {
      setViewMode('standard')
    }
    // Then call the original onCardClick
    onCardClick?.(card)
  }, [viewMode, setViewMode, onCardClick])

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

        {/* Content Area */}
        {viewMode === 'minimized' ? (
          /* Minimized View: Small clickable thumbnail strip */
          <div
            className="px-4 py-2 overflow-x-auto"
            data-testid="minimized-hand-view"
          >
            <div className="flex gap-1">
              {cards.slice(0, 5).map((card) => (
                <button
                  key={card.instanceId}
                  onClick={() => handleCardClick(card)}
                  className="w-8 h-12 bg-purple-900/40 border border-purple-700/50 rounded hover:bg-purple-700/40 transition-colors flex-shrink-0"
                  title={`點擊展開手牌並選擇: ${card.nameTw}`}
                  data-testid={`minimized-card-${card.instanceId}`}
                />
              ))}
              {cards.length > 5 && (
                <div className="w-8 h-12 bg-slate-900/40 border border-slate-700/50 rounded flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                  +{cards.length - 5}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Standard/Expanded View: Full card display */
          <div className="overflow-hidden flex-1">
            {viewMode === 'standard' ? (
              <HorizontalCardStrip
                cards={cards}
                onCardClick={handleCardClick}
                selectedCardId={selectedCardId}
                canTameCard={canTameCard}
                currentRound={currentRound}
              />
            ) : (
              <HandGridView
                cards={cards}
                onCardClick={handleCardClick}
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
              onSell={undefined}
              onDiscard={onDiscardCard ? () => onDiscardCard(selectedCard.instanceId) : undefined}
              onSanctuary={onMoveToSanctuary ? () => onMoveToSanctuary(selectedCard.instanceId) : undefined}
              canTame={canTame}
              canSell={false}
              position="right"
            />
          </div>
        </div>
      )}
    </div>
  )
})

export default FixedHandPanel
