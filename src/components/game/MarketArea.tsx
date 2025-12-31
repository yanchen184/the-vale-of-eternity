/**
 * MarketArea Component
 * Displays purchasable cards with pricing and purchase functionality
 * @version 1.0.0
 */
console.log('[components/game/MarketArea.tsx] v1.0.0 loaded')

import { useState, useCallback, memo } from 'react'
import type { CardInstance } from '@/types/cards'
import { ELEMENT_COLORS } from '@/types/cards'
import { Card } from './Card'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface MarketAreaProps {
  /** Cards available in market */
  cards: CardInstance[]
  /** Number of cards remaining in deck */
  deckCount?: number
  /** Maximum market size */
  maxMarketSize?: number
  /** Current stone value available */
  currentStones?: number
  /** Selected card ID */
  selectedCardId?: string | null
  /** Callback when card is taken (free) */
  onTakeCard?: (cardId: string) => void
  /** Callback when card is tamed (pay cost) */
  onTameCard?: (cardId: string) => void
  /** Callback when card is selected */
  onCardSelect?: (cardId: string) => void
  /** Check if player can tame a specific card */
  canTameCard?: (cardId: string) => boolean
  /** Get the cost of a card */
  getCardCost?: (cardId: string) => number
  /** Whether take action is available */
  allowTake?: boolean
  /** Whether tame action is available */
  allowTame?: boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================
// CONSTANTS
// ============================================

const MAX_MARKET_SIZE = 6

// ============================================
// MARKET CARD COMPONENT
// ============================================

interface MarketCardProps {
  card: CardInstance
  index: number
  isSelected: boolean
  canTame: boolean
  cost: number
  currentStones: number
  allowTake: boolean
  allowTame: boolean
  onSelect: () => void
  onTake?: () => void
  onTame?: () => void
}

const MarketCard = memo(function MarketCard({
  card,
  index,
  isSelected,
  canTame,
  cost,
  currentStones,
  allowTake,
  allowTame,
  onSelect,
  onTake,
  onTame,
}: MarketCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const canAfford = currentStones >= cost

  // Element color available for future styling enhancements
  const _elementColor = ELEMENT_COLORS[card.element]
  void _elementColor // Suppress unused variable warning

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2',
        'transition-all duration-200',
        isHovered && 'transform -translate-y-2'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`market-card-${index}`}
    >
      {/* Cost Badge */}
      <div
        className={cn(
          'absolute -top-3 left-1/2 -translate-x-1/2 z-10',
          'px-3 py-1 rounded-full text-xs font-bold',
          'shadow-lg transition-all duration-200',
          canAfford
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600/80 text-red-100'
        )}
        style={{
          boxShadow: canAfford
            ? '0 0 10px rgba(16, 185, 129, 0.4)'
            : '0 0 10px rgba(239, 68, 68, 0.3)',
        }}
      >
        {cost} Stone{cost !== 1 ? 's' : ''}
      </div>

      {/* Card */}
      <Card
        card={card}
        index={index}
        isSelected={isSelected}
        onClick={onSelect}
        className={cn(
          'transition-all duration-200',
          isSelected && 'ring-2 ring-vale-400 shadow-lg shadow-vale-500/30',
          isHovered && 'shadow-xl'
        )}
      />

      {/* Action Buttons */}
      {(allowTake || allowTame) && isHovered && (
        <div className="flex gap-2 w-full">
          {allowTake && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTake?.()
              }}
              className={cn(
                'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium',
                'bg-slate-600 hover:bg-slate-500 text-white',
                'transition-colors duration-200',
                'shadow-md hover:shadow-lg'
              )}
              data-testid={`market-card-${index}-take-btn`}
            >
              Take
            </button>
          )}
          {allowTame && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTame?.()
              }}
              disabled={!canTame}
              className={cn(
                'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium',
                'transition-all duration-200',
                canTame
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              )}
              data-testid={`market-card-${index}-tame-btn`}
            >
              召喚
            </button>
          )}
        </div>
      )}

      {/* Affordable indicator */}
      {!canAfford && allowTame && (
        <div className="text-xs text-red-400 mt-1">
          Need {cost - currentStones} more
        </div>
      )}
    </div>
  )
})

// ============================================
// EMPTY SLOT COMPONENT
// ============================================

interface EmptyMarketSlotProps {
  index: number
}

const EmptyMarketSlot = memo(function EmptyMarketSlot({ index }: EmptyMarketSlotProps) {
  return (
    <div
      className={cn(
        'w-36 h-52 rounded-lg border-2 border-dashed border-slate-600',
        'bg-slate-800/30 flex items-center justify-center'
      )}
      data-testid={`market-slot-empty-${index}`}
    >
      <span className="text-slate-600 text-sm">Sold Out</span>
    </div>
  )
})

// ============================================
// DECK INDICATOR COMPONENT
// ============================================

interface DeckIndicatorProps {
  count: number
}

const DeckIndicator = memo(function DeckIndicator({ count }: DeckIndicatorProps) {
  const isLow = count <= 10
  const isEmpty = count === 0

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl border',
        isEmpty
          ? 'bg-red-900/20 border-red-700/50'
          : isLow
          ? 'bg-amber-900/20 border-amber-700/50'
          : 'bg-slate-800/50 border-slate-700'
      )}
      data-testid="deck-indicator"
    >
      {/* Deck visual */}
      <div className="relative">
        {/* Stack effect */}
        {count > 2 && (
          <div className="absolute -bottom-1 -right-1 w-16 h-24 rounded-lg bg-slate-700 border border-slate-600" />
        )}
        {count > 1 && (
          <div className="absolute -bottom-0.5 -right-0.5 w-16 h-24 rounded-lg bg-slate-600 border border-slate-500" />
        )}
        <div className={cn(
          'relative w-16 h-24 rounded-lg flex items-center justify-center',
          'border-2 transition-all',
          isEmpty
            ? 'bg-slate-800 border-red-600/50'
            : 'bg-gradient-to-br from-slate-600 to-slate-700 border-slate-500'
        )}>
          {isEmpty ? (
            <span className="text-red-400 text-lg">X</span>
          ) : (
            <span className="text-xl font-bold text-slate-300">{count}</span>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="text-xs text-slate-400">Deck</div>
        <div className={cn(
          'text-sm font-medium',
          isEmpty
            ? 'text-red-400'
            : isLow
            ? 'text-amber-400'
            : 'text-slate-300'
        )}>
          {isEmpty ? 'Empty!' : isLow ? 'Low!' : `${count} left`}
        </div>
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const MarketArea = memo(function MarketArea({
  cards,
  deckCount = 0,
  maxMarketSize = MAX_MARKET_SIZE,
  currentStones = 0,
  selectedCardId = null,
  onTakeCard,
  onTameCard,
  onCardSelect,
  canTameCard,
  getCardCost,
  allowTake = true,
  allowTame = true,
  className,
}: MarketAreaProps) {
  // Calculate empty slots
  const emptySlots = maxMarketSize - cards.length

  // Handlers
  const handleCardSelect = useCallback((cardId: string) => {
    onCardSelect?.(cardId)
  }, [onCardSelect])

  const handleTakeCard = useCallback((cardId: string) => {
    onTakeCard?.(cardId)
  }, [onTakeCard])

  const handleTameCard = useCallback((cardId: string) => {
    onTameCard?.(cardId)
  }, [onTameCard])

  // Get card cost with fallback
  const getCardCostValue = useCallback((cardId: string, card: CardInstance): number => {
    if (getCardCost) {
      return getCardCost(cardId)
    }
    return card.cost
  }, [getCardCost])

  // Check if card can be tamed with fallback
  const checkCanTame = useCallback((cardId: string, card: CardInstance): boolean => {
    if (canTameCard) {
      return canTameCard(cardId)
    }
    return currentStones >= card.cost
  }, [canTameCard, currentStones])

  return (
    <section
      className={cn(
        'relative bg-gradient-to-b from-amber-900/10 to-slate-900/50',
        'rounded-2xl border border-amber-900/30 p-6',
        className
      )}
      data-testid="market-area"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-amber-400 font-game">
            Market
          </h3>
          <span className="text-sm text-slate-500">
            {cards.length} available
          </span>
        </div>

        {/* Stone indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700">
          <span className="text-yellow-400">Stone Value:</span>
          <span className="text-lg font-bold text-yellow-300">{currentStones}</span>
        </div>
      </div>

      {/* Market Grid */}
      <div className="flex items-start gap-6">
        {/* Deck Indicator */}
        <DeckIndicator count={deckCount} />

        {/* Market Cards */}
        <div className="flex-1">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 justify-items-center">
            {cards.map((card, index) => (
              <MarketCard
                key={card.instanceId}
                card={card}
                index={index}
                isSelected={selectedCardId === card.instanceId}
                canTame={checkCanTame(card.instanceId, card)}
                cost={getCardCostValue(card.instanceId, card)}
                currentStones={currentStones}
                allowTake={allowTake}
                allowTame={allowTame}
                onSelect={() => handleCardSelect(card.instanceId)}
                onTake={() => handleTakeCard(card.instanceId)}
                onTame={() => handleTameCard(card.instanceId)}
              />
            ))}

            {/* Empty Slots */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <EmptyMarketSlot key={`empty-${i}`} index={cards.length + i} />
            ))}
          </div>
        </div>
      </div>

      {/* Market Instructions */}
      <div className="mt-4 text-center text-xs text-slate-500">
        <span className="text-slate-400">Take</span> a card for free to add to hand, or{' '}
        <span className="text-emerald-400">Tame</span> to play directly to your field
      </div>

      {/* Empty market warning */}
      {cards.length === 0 && (
        <div className="flex items-center justify-center h-32 text-slate-500">
          <div className="text-center">
            <span className="text-2xl mb-2 block">No cards available</span>
            <span className="text-sm">Market will refresh next round</span>
          </div>
        </div>
      )}
    </section>
  )
})

export default MarketArea
