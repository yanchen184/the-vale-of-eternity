/**
 * DiscardPile Component
 * Displays discarded cards with 3D stack visualization and animations
 * @version 1.0.0
 */
console.log('[components/game/DiscardPile.tsx] v1.0.0 loaded')

import { useState, memo, useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import type { CardInstance } from '@/types/cards'
import { Element, ELEMENT_COLORS } from '@/types/cards'
import { cn } from '@/lib/utils'
import { ANIMATION_DURATION, ANIMATION_EASE, prefersReducedMotion } from '@/lib/animations'
import { Modal } from '@/components/ui/Modal'
import { Card } from './Card'

// ============================================
// TYPES
// ============================================

export interface DiscardPileProps {
  /** Discarded cards */
  cards: CardInstance[]
  /** Whether the pile is interactive */
  interactive?: boolean
  /** Callback when a card is viewed */
  onViewCard?: (cardId: string) => void
  /** Additional CSS classes */
  className?: string
}

// ============================================
// CONSTANTS
// ============================================

const MAX_VISIBLE_STACK = 5
const STACK_OFFSET = 2

// ============================================
// HELPER COMPONENTS
// ============================================

/**
 * Get element gradient for card back
 */
function getElementGradient(element: Element): string {
  const gradients: Record<Element, string> = {
    [Element.FIRE]: 'from-red-800 to-red-950',
    [Element.WATER]: 'from-blue-800 to-blue-950',
    [Element.EARTH]: 'from-green-800 to-green-950',
    [Element.WIND]: 'from-purple-800 to-purple-950',
    [Element.DRAGON]: 'from-amber-800 to-amber-950',
  }
  return gradients[element] || 'from-slate-700 to-slate-900'
}

// ============================================
// STACKED CARD COMPONENT
// ============================================

interface StackedCardProps {
  card: CardInstance
  index: number
  totalVisible: number
  isTopCard: boolean
}

const StackedCard = memo(function StackedCard({
  card,
  index,
  totalVisible,
  isTopCard,
}: StackedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const stackIndex = totalVisible - 1 - index

  // Entrance animation for new cards
  useEffect(() => {
    if (!isTopCard || prefersReducedMotion()) return

    const element = cardRef.current
    if (!element) return

    gsap.fromTo(
      element,
      {
        y: -100,
        x: 50,
        rotation: 15,
        opacity: 0,
        scale: 1.2,
      },
      {
        y: 0,
        x: 0,
        rotation: gsap.utils.random(-5, 5),
        opacity: 1,
        scale: 1,
        duration: ANIMATION_DURATION.SLOW,
        ease: ANIMATION_EASE.BOUNCE_OUT,
      }
    )
  }, [isTopCard])

  const elementColor = ELEMENT_COLORS[card.element]

  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute w-16 h-24 rounded-lg overflow-hidden',
        'border-2 transition-all duration-200',
        `bg-gradient-to-br ${getElementGradient(card.element)}`
      )}
      style={{
        top: `${stackIndex * STACK_OFFSET}px`,
        left: `${stackIndex * STACK_OFFSET}px`,
        transform: `rotate(${gsap.utils.random(-3, 3)}deg)`,
        zIndex: index + 1,
        borderColor: elementColor,
        boxShadow: isTopCard
          ? `0 4px 12px rgba(0, 0, 0, 0.4), 0 0 8px ${elementColor}40`
          : '0 2px 4px rgba(0, 0, 0, 0.3)',
      }}
      data-testid={`discard-stack-${index}`}
    >
      {/* Card Back Pattern */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <svg viewBox="0 0 40 60" className="w-10 h-14 text-white/50">
          <path
            d="M20 5 L35 15 L35 45 L20 55 L5 45 L5 15 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle cx="20" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      {/* Element indicator */}
      <div
        className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
        style={{ backgroundColor: elementColor }}
      >
        {card.element.charAt(0)}
      </div>
    </div>
  )
})

// ============================================
// DISCARD MODAL COMPONENT
// ============================================

interface DiscardModalProps {
  isOpen: boolean
  cards: CardInstance[]
  onClose: () => void
}

const DiscardModal = memo(function DiscardModal({
  isOpen,
  cards,
  onClose,
}: DiscardModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Discard Pile"
      size="lg"
    >
      <div className="p-4">
        {cards.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No cards in discard pile
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 mb-4">
              {cards.length} card{cards.length !== 1 ? 's' : ''} discarded
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto">
              {cards.map((card, index) => (
                <div
                  key={card.instanceId}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card
                    card={card}
                    index={index}
                    compact
                    className="opacity-70 grayscale-[30%]"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const DiscardPile = memo(function DiscardPile({
  cards,
  interactive = true,
  onViewCard: _onViewCard,
  className,
}: DiscardPileProps) {
  void _onViewCard
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get visible cards for stack
  const visibleCards = cards.slice(-MAX_VISIBLE_STACK)

  // Hover animation
  useEffect(() => {
    if (prefersReducedMotion()) return

    const element = containerRef.current
    if (!element) return

    gsap.to(element, {
      scale: isHovered ? 1.05 : 1,
      y: isHovered ? -5 : 0,
      duration: ANIMATION_DURATION.FAST,
      ease: ANIMATION_EASE.POWER_OUT,
    })
  }, [isHovered])

  const handleClick = useCallback(() => {
    if (interactive && cards.length > 0) {
      setIsModalOpen(true)
    }
  }, [interactive, cards.length])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  // Empty state
  if (cards.length === 0) {
    return (
      <div
        className={cn(
          'relative w-20 h-28',
          'rounded-xl border-2 border-dashed border-slate-600/50',
          'bg-slate-800/30',
          'flex flex-col items-center justify-center',
          'transition-all duration-200',
          className
        )}
        data-testid="discard-pile-empty"
      >
        <div className="text-slate-600 text-2xl mb-1">-</div>
        <span className="text-[10px] text-slate-600">Discard</span>
      </div>
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          'relative',
          'cursor-pointer',
          className
        )}
        style={{
          width: `${64 + (Math.min(visibleCards.length, MAX_VISIBLE_STACK) - 1) * STACK_OFFSET + 8}px`,
          height: `${96 + (Math.min(visibleCards.length, MAX_VISIBLE_STACK) - 1) * STACK_OFFSET + 8}px`,
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid="discard-pile"
      >
        {/* Stack of cards */}
        {visibleCards.map((card, index) => (
          <StackedCard
            key={card.instanceId}
            card={card}
            index={index}
            totalVisible={visibleCards.length}
            isTopCard={index === visibleCards.length - 1}
          />
        ))}

        {/* Count badge */}
        <div
          className={cn(
            'absolute -top-2 -right-2 z-20',
            'min-w-[24px] h-6 px-1.5',
            'rounded-full',
            'bg-slate-700 border-2 border-slate-600',
            'flex items-center justify-center',
            'text-xs font-bold text-slate-300',
            'shadow-lg',
            'transition-all duration-200',
            isHovered && 'bg-purple-600 border-purple-500 text-white'
          )}
        >
          {cards.length}
        </div>

        {/* Label */}
        <div
          className={cn(
            'absolute -bottom-6 left-1/2 -translate-x-1/2',
            'text-[10px] text-slate-500 whitespace-nowrap',
            'transition-colors duration-200',
            isHovered && 'text-purple-400'
          )}
        >
          Discard Pile
        </div>

        {/* Hover overlay */}
        {isHovered && interactive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
            <span className="text-xs text-white font-medium">View All</span>
          </div>
        )}
      </div>

      {/* Modal */}
      <DiscardModal
        isOpen={isModalOpen}
        cards={cards}
        onClose={handleCloseModal}
      />
    </>
  )
})

export default DiscardPile
