/**
 * CurrentTurnCards Component
 * Displays cards drawn/selected in the current turn
 * Shows above the player's field area during their turn
 * @version 2.3.0 - Pass onClick to Card component to prevent Card's internal modal
 */
console.log('[components/game/CurrentTurnCards.tsx] v2.3.0 loaded')

import { memo } from 'react'
import { Card } from './Card'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import { getElementSellValue } from '@/services/multiplayer-game'

// ============================================
// TYPES
// ============================================

export interface CurrentTurnCardsProps {
  /** Cards currently drawn/selected this turn */
  cards: CardInstance[]
  /** Player name */
  playerName: string
  /** Whether this is the current turn player */
  isCurrentTurn: boolean
  /** Current round number */
  currentRound?: number
  /** Phase label (e.g., "選卡階段", "行動階段") */
  phaseLabel?: string
  /** Callback when "上手" (move to hand) button is clicked */
  onMoveToHand?: (cardId: string) => void
  /** Callback when "賣掉" (sell) button is clicked */
  onSell?: (cardId: string) => void
  /** Callback when a card is clicked for preview */
  onCardClick?: (cardId: string) => void
  /** Additional CSS classes */
  className?: string
}

// ============================================
// MAIN COMPONENT
// ============================================

export const CurrentTurnCards = memo(function CurrentTurnCards({
  cards,
  playerName,
  isCurrentTurn,
  currentRound,
  phaseLabel = '本回合卡片',
  onMoveToHand,
  onSell,
  onCardClick,
  className,
}: CurrentTurnCardsProps) {
  if (cards.length === 0) {
    return null
  }

  const handleMoveToHand = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('[CurrentTurnCards] handleMoveToHand clicked:', cardId, 'callback exists:', !!onMoveToHand)
    onMoveToHand?.(cardId)
  }

  const handleSell = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('[CurrentTurnCards] handleSell clicked:', cardId, 'callback exists:', !!onSell)
    onSell?.(cardId)
  }

  return (
    <>
      <div
        className={cn(
          'mb-2 p-3 rounded-lg transition-all duration-300',
          'bg-blue-900/20 border-2 border-blue-500/30',
          isCurrentTurn && [
            'border-blue-500/70',
            'shadow-lg shadow-blue-500/20',
            'ring-2 ring-blue-500/30 ring-offset-2 ring-offset-slate-900',
          ],
          className
        )}
        data-testid="current-turn-cards"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-400">
              {phaseLabel}
            </span>
            {isCurrentTurn && (
              <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full animate-pulse-subtle">
                進行中
              </span>
            )}
          </div>
          <span className="text-xs text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded">
            {cards.length} 張
          </span>
        </div>

        {/* Cards Display */}
        <div className="flex flex-wrap gap-2">
          {cards.map((card, index) => (
            <div
              key={card.instanceId}
              className={cn(
                'relative group transition-all duration-200'
              )}
              style={{ zIndex: index }}
            >
              <Card
                card={card}
                index={index}
                compact={true}
                currentRound={currentRound}
                onClick={isCurrentTurn ? () => {
                  onCardClick?.(card.instanceId)
                } : undefined}
                className={cn(
                  'shadow-md',
                  isCurrentTurn && [
                    'ring-2 ring-blue-400/50',
                    'hover:ring-blue-400',
                    'cursor-pointer',
                  ]
                )}
              />

              {/* Glow effect for current turn */}
              {isCurrentTurn && (
                <div
                  className="absolute inset-0 rounded-lg bg-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                />
              )}

              {/* Action buttons - only show for current player's turn */}
              {isCurrentTurn && (onMoveToHand || onSell) && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  {/* Move to Hand button */}
                  {onMoveToHand && (
                    <button
                      onClick={(e) => handleMoveToHand(card.instanceId, e)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-md',
                        'bg-green-600 hover:bg-green-500 text-white',
                        'shadow-lg border border-green-400/50',
                        'whitespace-nowrap'
                      )}
                      type="button"
                      title="加入手牌"
                    >
                      上手
                    </button>
                  )}

                  {/* Sell button */}
                  {onSell && (() => {
                    const sellValue = getElementSellValue(card.element)
                    return (
                      <button
                        onClick={(e) => handleSell(card.instanceId, e)}
                        className={cn(
                          'px-2 py-1 text-xs rounded-md',
                          'bg-amber-600 hover:bg-amber-500 text-white',
                          'shadow-lg border border-amber-400/50',
                          'whitespace-nowrap'
                        )}
                        type="button"
                        title={`賣掉換 ${sellValue} 元`}
                      >
                        賣 {sellValue}元
                      </button>
                    )
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Player info */}
        <div className="mt-2 pt-2 border-t border-blue-500/20">
          <span className="text-xs text-slate-400">
            {isCurrentTurn ? '你的回合' : `${playerName} 的回合`}
          </span>
        </div>
      </div>
    </>
  )
})

export default CurrentTurnCards
