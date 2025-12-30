/**
 * PlayerHand Component
 * Displays player's hand cards with fan layout and drag-drop support
 * @version 1.0.0
 */
console.log('[components/game/PlayerHand.tsx] v1.0.0 loaded')

import { useState, useCallback, useMemo, memo } from 'react'
import type { CardInstance } from '@/types/cards'
import { Card } from './Card'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface PlayerHandProps {
  /** Cards in player's hand */
  cards: CardInstance[]
  /** Maximum hand size for display */
  maxHandSize?: number
  /** Selected card ID (for highlighting) */
  selectedCardId?: string | null
  /** Whether to show action buttons on cards */
  showActions?: boolean
  /** Whether drag is enabled */
  enableDrag?: boolean
  /** Callback when card is selected */
  onCardSelect?: (cardId: string) => void
  /** Callback when card is played (tamed) */
  onCardPlay?: (cardId: string) => void
  /** Callback when card is sold */
  onCardSell?: (cardId: string) => void
  /** Callback when card is dragged to field */
  onDragToField?: (cardId: string) => void
  /** Check if a card can be tamed */
  canTameCard?: (cardId: string) => boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================
// CONSTANTS
// ============================================

const MAX_VISIBLE_CARDS = 7
const CARD_OVERLAP_RATIO = 0.6 // How much cards overlap
const HOVER_LIFT = 20 // Pixels to lift on hover
const FAN_ANGLE = 3 // Degrees rotation per card from center

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate card position for fan layout
 */
function getCardTransform(
  index: number,
  totalCards: number,
  hoveredIndex: number | null,
  isSelected: boolean
): React.CSSProperties {
  const centerIndex = (totalCards - 1) / 2
  const offset = index - centerIndex
  const rotation = offset * FAN_ANGLE

  // Base translation for fan effect
  const baseY = Math.abs(offset) * 5
  const translateY = hoveredIndex === index ? -HOVER_LIFT : baseY

  // Selected card lifts up
  const selectedY = isSelected ? -HOVER_LIFT - 10 : translateY

  return {
    transform: `rotate(${rotation}deg) translateY(${selectedY}px)`,
    zIndex: hoveredIndex === index ? 100 : 10 + index,
    transition: 'transform 0.2s ease-out, z-index 0.1s',
  }
}

// ============================================
// CARD ITEM COMPONENT
// ============================================

interface HandCardItemProps {
  card: CardInstance
  index: number
  totalCards: number
  isSelected: boolean
  isHovered: boolean
  showActions: boolean
  enableDrag: boolean
  canTame: boolean
  onSelect: () => void
  onTame?: () => void
  onSell?: () => void
  onHover: () => void
  onHoverEnd: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
}

const HandCardItem = memo(function HandCardItem({
  card,
  index,
  totalCards,
  isSelected,
  isHovered,
  showActions,
  enableDrag,
  canTame,
  onSelect,
  onTame,
  onSell,
  onHover,
  onHoverEnd,
  onDragStart,
  onDragEnd,
}: HandCardItemProps) {
  const cardStyle = getCardTransform(index, totalCards, isHovered ? index : null, isSelected)

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{
        ...cardStyle,
        marginLeft: index === 0 ? 0 : `-${CARD_OVERLAP_RATIO * 40}px`,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      draggable={enableDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-testid={`hand-card-${index}`}
    >
      <Card
        card={card}
        index={index}
        isSelected={isSelected}
        showActions={showActions && isHovered}
        onTame={onTame}
        onSell={onSell}
        onClick={onSelect}
        canTame={canTame}
        className={cn(
          'transition-shadow duration-200',
          isSelected && 'ring-2 ring-vale-400 shadow-lg shadow-vale-500/30',
          isHovered && 'shadow-xl'
        )}
      />
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const PlayerHand = memo(function PlayerHand({
  cards,
  maxHandSize = MAX_VISIBLE_CARDS,
  selectedCardId = null,
  showActions = false,
  enableDrag = true,
  onCardSelect,
  onCardPlay,
  onCardSell,
  onDragToField: _onDragToField,
  canTameCard,
  className,
}: PlayerHandProps) {
  // onDragToField available for future drag-to-field functionality
  void _onDragToField
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)

  // Limit visible cards
  const visibleCards = useMemo(() => {
    return cards.slice(0, maxHandSize)
  }, [cards, maxHandSize])

  const hiddenCount = cards.length - visibleCards.length

  // Handlers
  const handleCardSelect = useCallback((cardId: string) => {
    onCardSelect?.(cardId)
  }, [onCardSelect])

  const handleCardTame = useCallback((cardId: string) => {
    onCardPlay?.(cardId)
  }, [onCardPlay])

  const handleCardSell = useCallback((cardId: string) => {
    onCardSell?.(cardId)
  }, [onCardSell])

  const handleDragStart = useCallback((e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId)
    e.dataTransfer.setData('cardId', cardId)
    e.dataTransfer.setData('source', 'hand')
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedCardId(null)
  }, [])

  const handleHover = useCallback((index: number) => {
    setHoveredIndex(index)
  }, [])

  const handleHoverEnd = useCallback(() => {
    setHoveredIndex(null)
  }, [])

  // Empty state
  if (cards.length === 0) {
    return (
      <section
        className={cn(
          'relative bg-slate-800/30 rounded-xl border border-slate-700 p-6',
          className
        )}
        data-testid="player-hand"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-200 font-game">
            Hand
          </h3>
          <span className="text-sm text-slate-500">0 / {maxHandSize}</span>
        </div>
        <div className="flex items-center justify-center h-52 text-slate-500">
          <span>No cards in hand</span>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'relative bg-slate-800/30 rounded-xl border border-slate-700 p-6',
        className
      )}
      data-testid="player-hand"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-200 font-game">
          Hand
        </h3>
        <div className="flex items-center gap-2">
          {hiddenCount > 0 && (
            <span className="text-xs text-amber-400">+{hiddenCount} more</span>
          )}
          <span className="text-sm text-slate-400">
            {cards.length} / {maxHandSize}
          </span>
        </div>
      </div>

      {/* Cards Fan Layout */}
      <div
        className="flex items-end justify-center min-h-[220px] py-4 px-8"
        data-testid="hand-cards-container"
      >
        {visibleCards.map((card, index) => (
          <HandCardItem
            key={card.instanceId}
            card={card}
            index={index}
            totalCards={visibleCards.length}
            isSelected={selectedCardId === card.instanceId}
            isHovered={hoveredIndex === index}
            showActions={showActions}
            enableDrag={enableDrag && draggedCardId !== card.instanceId}
            canTame={canTameCard?.(card.instanceId) ?? false}
            onSelect={() => handleCardSelect(card.instanceId)}
            onTame={() => handleCardTame(card.instanceId)}
            onSell={() => handleCardSell(card.instanceId)}
            onHover={() => handleHover(index)}
            onHoverEnd={handleHoverEnd}
            onDragStart={(e) => handleDragStart(e, card.instanceId)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Drag hint */}
      {enableDrag && cards.length > 0 && (
        <p className="text-center text-xs text-slate-500 mt-2">
          Drag cards to field to play them
        </p>
      )}
    </section>
  )
})

export default PlayerHand
