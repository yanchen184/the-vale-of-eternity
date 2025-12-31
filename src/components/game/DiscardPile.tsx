/**
 * DiscardPile Component
 * Displays discarded cards face-up with full card details visible
 * @version 1.2.0 - Added return button for reversible sells
 */
console.log('[components/game/DiscardPile.tsx] v1.2.0 loaded')

import { useState, memo, useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import type { CardInstance } from '@/types/cards'
import { cn } from '@/lib/utils'
import { ANIMATION_DURATION, ANIMATION_EASE, prefersReducedMotion } from '@/lib/animations'
import { Modal } from '@/components/ui/Modal'
import { Card } from './Card'
import { getElementSellCoins } from '@/services/multiplayer-game'

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
  /** Callback when a card should be returned from discard (undo sell) */
  onReturnCard?: (cardInstanceId: string) => void
  /** Whether return button is enabled */
  allowReturn?: boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================
// CONSTANTS
// ============================================

const MAX_VISIBLE_STACK = 5
const STACK_OFFSET = 2

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
        rotation: gsap.utils.random(-2, 2),
        opacity: 1,
        scale: 1,
        duration: ANIMATION_DURATION.SLOW,
        ease: ANIMATION_EASE.BOUNCE_OUT,
      }
    )
  }, [isTopCard])

  return (
    <div
      ref={cardRef}
      className="absolute"
      style={{
        top: `${stackIndex * STACK_OFFSET}px`,
        left: `${stackIndex * STACK_OFFSET}px`,
        transform: `rotate(${gsap.utils.random(-2, 2)}deg)`,
        zIndex: index + 1,
      }}
      data-testid={`discard-stack-${index}`}
    >
      {/* Show actual card face-up */}
      <Card card={card} compact />
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
  onReturnCard?: (cardInstanceId: string) => void
  allowReturn?: boolean
}

const DiscardModal = memo(function DiscardModal({
  isOpen,
  cards,
  onClose,
  onReturnCard,
  allowReturn = false,
}: DiscardModalProps) {
  console.log('[DiscardModal] Rendering with cards:', cards.length, cards)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="棄置牌堆"
      size="xl"
    >
      <div className="p-6">
        {cards.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            尚無棄置的卡片
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 mb-6">
              共 {cards.length} 張卡片已棄置{allowReturn ? '（點擊取回按鈕反悔賣出）' : ''}
            </p>
            <div className="flex flex-wrap gap-4 max-h-[70vh] overflow-y-auto justify-center">
              {cards.map((card, index) => {
                console.log(`[DiscardModal] Rendering card ${index}:`, card.name, card.instanceId)

                // Calculate coins for this card
                const coins = getElementSellCoins(card.element)
                const coinText = [
                  coins.six > 0 ? `${coins.six}×6` : null,
                  coins.three > 0 ? `${coins.three}×3` : null,
                  coins.one > 0 ? `${coins.one}×1` : null,
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div
                    key={card.instanceId}
                    className="animate-fade-in relative transform transition-transform hover:scale-105"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <Card
                      card={card}
                      index={index}
                      compact={false}
                    />
                    {/* Return button */}
                    {allowReturn && onReturnCard && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('[DiscardModal] Return button clicked for card:', card.instanceId)
                          onReturnCard(card.instanceId)
                        }}
                        className="absolute bottom-2 left-2 right-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-green-500/50"
                        type="button"
                        title={`取回此卡（歸還 ${coinText}）`}
                      >
                        取回卡片
                      </button>
                    )}
                  </div>
                )
              })}
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
  onReturnCard,
  allowReturn = false,
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
        <span className="text-[10px] text-slate-600">棄置牌堆</span>
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
          棄置牌堆
        </div>

        {/* Hover overlay */}
        {isHovered && interactive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
            <span className="text-xs text-white font-medium">查看全部</span>
          </div>
        )}
      </div>

      {/* Modal */}
      <DiscardModal
        isOpen={isModalOpen}
        cards={cards}
        onClose={handleCloseModal}
        onReturnCard={onReturnCard}
        allowReturn={allowReturn}
      />
    </>
  )
})

export default DiscardPile
