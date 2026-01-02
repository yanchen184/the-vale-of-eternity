/**
 * CurrentTurnCards Component
 * Displays cards drawn/selected in the current turn
 * Shows above the player's field area during their turn
 * @version 1.0.0
 */
console.log('[components/game/CurrentTurnCards.tsx] v1.0.0 loaded')

import { memo, useState } from 'react'
import { Card } from './Card'
import { CardPreviewModal } from './CardPreviewModal'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'

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
  className,
}: CurrentTurnCardsProps) {
  const [previewCard, setPreviewCard] = useState<CardInstance | null>(null)

  if (cards.length === 0) {
    return null
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
                'relative group transform transition-all duration-200',
                'hover:scale-105 hover:z-10',
                isCurrentTurn && 'cursor-pointer'
              )}
              onClick={() => isCurrentTurn && setPreviewCard(card)}
              style={{ zIndex: index }}
            >
              <Card
                card={card}
                index={index}
                compact={true}
                currentRound={currentRound}
                className={cn(
                  'shadow-md',
                  isCurrentTurn && [
                    'ring-2 ring-blue-400/50',
                    'hover:ring-blue-400',
                  ]
                )}
              />

              {/* Glow effect for current turn */}
              {isCurrentTurn && (
                <div
                  className="absolute inset-0 rounded-lg bg-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                />
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

      {/* Card Preview Modal */}
      <CardPreviewModal
        card={previewCard}
        isOpen={!!previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </>
  )
})

export default CurrentTurnCards
