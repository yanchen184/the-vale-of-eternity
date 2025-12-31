/**
 * PlayerHand Component
 * Displays player's hand cards with enhanced fan layout, animations, and drag-drop support
 * @version 2.3.1 - Changed "Playable" indicator to "可召喚"
 */
console.log('[components/game/PlayerHand.tsx] v2.3.1 loaded')

import { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { CardInstance } from '@/types/cards'
import { Card } from './Card'
import { cn } from '@/lib/utils'
import { ANIMATION_DURATION, ANIMATION_EASE, prefersReducedMotion } from '@/lib/animations'

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
  /** Callback when card is discarded */
  onCardDiscard?: (cardId: string) => void
  /** Callback when card is dragged to field */
  onDragToField?: (cardId: string) => void
  /** Check if a card can be tamed */
  canTameCard?: (cardId: string) => boolean
  /** Current round number (for sell restriction) */
  currentRound?: number
  /** Additional CSS classes */
  className?: string
}

// ============================================
// CONSTANTS
// ============================================

const MAX_VISIBLE_CARDS = 7
const CARD_OVERLAP_RATIO = 0.6 // Increased for tighter fan
const HOVER_LIFT = 35 // Increased for more dramatic hover
const FAN_ANGLE = 5 // Slightly increased angle
const MAX_FAN_ANGLE = 18 // Increased max angle for wider spread

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCardTransform(
  index: number,
  totalCards: number,
  hoveredIndex: number | null,
  isSelected: boolean,
  isDragging: boolean
): React.CSSProperties {
  const centerIndex = (totalCards - 1) / 2
  const offset = index - centerIndex

  // Calculate rotation with max limit and smooth curve
  const baseRotation = offset * FAN_ANGLE
  const rotation = Math.max(-MAX_FAN_ANGLE, Math.min(MAX_FAN_ANGLE, baseRotation))

  // Calculate Y position for arc effect with enhanced curve
  const arcDepth = Math.abs(offset) * Math.abs(offset) * 4
  const baseY = arcDepth

  // Hover and selection states
  let translateY = baseY
  let scale = 1
  let zIndex = 10 + index

  if (hoveredIndex === index && !isDragging) {
    translateY = -HOVER_LIFT
    scale = 1.12 // Increased hover scale
    zIndex = 100
  } else if (isSelected) {
    translateY = -HOVER_LIFT - 8
    scale = 1.08 // Increased selection scale
    zIndex = 99
  }

  return {
    transform: `rotate(${rotation}deg) translateY(${translateY}px) scale(${scale})`,
    zIndex,
    transition: prefersReducedMotion()
      ? 'none'
      : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0.1s',
  }
}

// ============================================
// DECORATIVE RUNE COMPONENT
// ============================================

const HandRunes = memo(function HandRunes() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Left rune */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20">
        <svg width="40" height="80" viewBox="0 0 40 80" className="text-purple-400">
          <path
            d="M20 0 L40 20 L40 60 L20 80 L0 60 L0 20 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle cx="20" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M20 20 L20 60" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      {/* Right rune */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
        <svg width="40" height="80" viewBox="0 0 40 80" className="text-purple-400">
          <path
            d="M20 0 L40 20 L40 60 L20 80 L0 60 L0 20 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle cx="20" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M20 20 L20 60" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      {/* Bottom decorative line */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
    </div>
  )
})

// ============================================
// HAND LIMIT WARNING
// ============================================

interface HandLimitWarningProps {
  currentCount: number
  maxCount: number
}

const HandLimitWarning = memo(function HandLimitWarning({
  currentCount,
  maxCount,
}: HandLimitWarningProps) {
  const isNearLimit = currentCount >= maxCount - 1
  const isAtLimit = currentCount >= maxCount

  if (!isNearLimit) return null

  return (
    <div
      className={cn(
        'absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium',
        'animate-pulse transition-colors',
        isAtLimit
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      )}
      data-testid="hand-limit-warning"
    >
      {isAtLimit ? 'Hand Full!' : 'Almost Full'}
    </div>
  )
})

// ============================================
// CARD ITEM COMPONENT
// ============================================

interface HandCardItemProps {
  card: CardInstance
  index: number
  totalCards: number
  isSelected: boolean
  isHovered: boolean
  isDragging: boolean
  showActions: boolean
  enableDrag: boolean
  canTame: boolean
  canSell: boolean
  onSelect: () => void
  onTame?: () => void
  onSell?: () => void
  onDiscard?: () => void
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
  isDragging,
  showActions,
  enableDrag,
  canTame,
  canSell,
  onSelect,
  onTame,
  onSell,
  onDiscard,
  onHover,
  onHoverEnd,
  onDragStart,
  onDragEnd,
}: HandCardItemProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const cardStyle = getCardTransform(index, totalCards, isHovered ? index : null, isSelected, isDragging)

  // Card entrance animation
  useEffect(() => {
    if (prefersReducedMotion()) return

    const element = cardRef.current
    if (!element) return

    // Enhanced entrance animation with multiple stages
    const tl = gsap.timeline()

    tl.fromTo(
      element,
      {
        y: -120,
        opacity: 0,
        rotateY: 180,
        rotateZ: -15,
        scale: 0.3,
      },
      {
        y: 0,
        opacity: 1,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        duration: ANIMATION_DURATION.SLOW * 1.2,
        delay: index * 0.1,
        ease: ANIMATION_EASE.BOUNCE_OUT,
      }
    )

    // Add a subtle bounce at the end
    tl.to(element, {
      y: -5,
      duration: 0.15,
      ease: 'power1.out',
    }).to(element, {
      y: 0,
      duration: 0.15,
      ease: 'power1.in',
    })
  }, [index])

  // Hover glow effect
  useEffect(() => {
    if (prefersReducedMotion()) return

    const element = cardRef.current
    if (!element) return

    if (isHovered && !isDragging) {
      gsap.to(element, {
        boxShadow: '0 25px 50px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.15)',
        filter: 'brightness(1.15) saturate(1.2)',
        duration: ANIMATION_DURATION.FAST,
        ease: ANIMATION_EASE.POWER_OUT,
      })
    } else {
      gsap.to(element, {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        filter: 'brightness(1) saturate(1)',
        duration: ANIMATION_DURATION.FAST,
        ease: ANIMATION_EASE.POWER_OUT,
      })
    }
  }, [isHovered, isDragging])

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative flex-shrink-0 cursor-pointer',
        isDragging && 'opacity-50'
      )}
      style={{
        ...cardStyle,
        marginLeft: index === 0 ? 0 : `-${CARD_OVERLAP_RATIO * 50}px`,
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
        onSell={canSell ? onSell : undefined}
        onDiscard={onDiscard}
        onClick={onSelect}
        canTame={canTame}
        className={cn(
          'transition-all duration-200',
          isSelected && 'ring-2 ring-vale-400 shadow-lg shadow-vale-500/30',
          canTame && 'ring-2 ring-emerald-400/50'
        )}
      />

      {/* Tameable indicator */}
      {canTame && !isHovered && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-lg animate-bounce-in">
          可召喚
        </div>
      )}
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
  onCardDiscard,
  onDragToField: _onDragToField,
  canTameCard,
  currentRound,
  className,
}: PlayerHandProps) {
  void _onDragToField
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Helper function to check if a card can be sold (only cards from current round)
  const canSellCard = useCallback((card: CardInstance) => {
    // If no currentRound is provided, allow selling all cards (backward compatibility)
    if (currentRound === undefined) return true
    // @ts-expect-error - acquiredInRound is added at runtime from Firebase
    const acquiredInRound = card.acquiredInRound
    // If card doesn't have acquiredInRound (old cards), allow selling (backward compatibility)
    if (acquiredInRound === undefined) return true
    // Only allow selling if card was acquired in current round
    return acquiredInRound === currentRound
  }, [currentRound])

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

  const handleCardDiscard = useCallback((cardId: string) => {
    onCardDiscard?.(cardId)
  }, [onCardDiscard])

  const handleDragStart = useCallback((e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId)
    e.dataTransfer.setData('cardId', cardId)
    e.dataTransfer.setData('source', 'hand')
    e.dataTransfer.effectAllowed = 'move'

    // Create custom drag image
    if (e.currentTarget instanceof HTMLElement) {
      const ghost = e.currentTarget.cloneNode(true) as HTMLElement
      ghost.style.transform = 'rotate(5deg) scale(1.1)'
      ghost.style.opacity = '0.9'
      document.body.appendChild(ghost)
      e.dataTransfer.setDragImage(ghost, 70, 100)
      requestAnimationFrame(() => ghost.remove())
    }
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
          'relative overflow-hidden',
          'bg-gradient-to-b from-slate-800/40 to-slate-900/60',
          'rounded-2xl border-2 border-slate-700/50 p-6',
          'shadow-inner shadow-slate-950/50',
          className
        )}
        data-testid="player-hand"
      >
        <HandRunes />
        {/* Header removed to save space */}
        <div className="flex items-center justify-center h-52 text-slate-500">
          <div className="text-center">
            <div className="text-4xl mb-2 opacity-30">-</div>
            <span>No cards in hand</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        'bg-gradient-to-b from-slate-800/40 to-slate-900/60',
        'rounded-2xl border-2 border-purple-900/30 p-6',
        'shadow-xl shadow-purple-950/20',
        className
      )}
      data-testid="player-hand"
    >
      <HandRunes />
      <HandLimitWarning currentCount={cards.length} maxCount={maxHandSize} />

      {/* Header - Removed title to save space, keep card count */}
      <div className="flex items-center justify-end mb-3 relative z-10">
        <div className="flex items-center gap-2">
          {hiddenCount > 0 && (
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
              +{hiddenCount} more
            </span>
          )}
          <span className={cn(
            'text-sm px-2 py-1 rounded-lg',
            cards.length >= maxHandSize
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
          )}>
            {cards.length} / {maxHandSize}
          </span>
        </div>
      </div>

      {/* Cards Fan Layout */}
      <div
        className="flex items-end justify-center min-h-[240px] py-6 px-12"
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
            isDragging={draggedCardId === card.instanceId}
            showActions={showActions}
            enableDrag={enableDrag && draggedCardId !== card.instanceId}
            canTame={canTameCard?.(card.instanceId) ?? false}
            canSell={canSellCard(card)}
            onSelect={() => handleCardSelect(card.instanceId)}
            onTame={() => handleCardTame(card.instanceId)}
            onSell={() => handleCardSell(card.instanceId)}
            onDiscard={() => handleCardDiscard(card.instanceId)}
            onHover={() => handleHover(index)}
            onHoverEnd={handleHoverEnd}
            onDragStart={(e) => handleDragStart(e, card.instanceId)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Drag hint */}
      {enableDrag && cards.length > 0 && (
        <p className="text-center text-xs text-slate-500 mt-2 relative z-10">
          <span className="text-purple-400">Drag</span> cards to field to play them, or{' '}
          <span className="text-purple-400">click</span> for actions
        </p>
      )}
    </section>
  )
})

export default PlayerHand
