/**
 * HorizontalCardStrip Component
 * Horizontal scrolling card strip for standard hand view
 * @version 2.1.0 - Added horizontal scroll and drag-to-scroll functionality
 */
console.log('[components/game/HorizontalCardStrip.tsx] v2.1.0 loaded')

import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import { Card } from './Card'
import { Hand } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface HorizontalCardStripProps {
  cards: CardInstance[]
  onCardClick?: (card: CardInstance) => void
  selectedCardId?: string | null
  canTameCard?: (cardId: string) => boolean
  currentRound?: number
}

// ============================================
// MAIN COMPONENT
// ============================================

export const HorizontalCardStrip = memo(function HorizontalCardStrip({
  cards,
  onCardClick,
  selectedCardId,
  canTameCard,
}: HorizontalCardStripProps) {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [hasDragged, setHasDragged] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Mouse wheel horizontal scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      // Convert vertical scroll to horizontal scroll
      if (e.deltaY !== 0) {
        e.preventDefault()
        container.scrollLeft += e.deltaY
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  // Drag to scroll handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = scrollContainerRef.current
    if (!container) return

    setIsDragging(true)
    setHasDragged(false)
    setStartX(e.pageX - container.offsetLeft)
    setScrollLeft(container.scrollLeft)
    container.style.cursor = 'grabbing'
    container.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return

    const container = scrollContainerRef.current
    if (!container) return

    e.preventDefault()
    const x = e.pageX - container.offsetLeft
    const walk = (x - startX) * 2 // Multiply for faster scroll

    // If moved more than 5px, mark as dragged
    if (Math.abs(walk) > 5) {
      setHasDragged(true)
    }

    container.scrollLeft = scrollLeft - walk
  }, [isDragging, startX, scrollLeft])

  const handleMouseUp = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    setIsDragging(false)
    container.style.cursor = 'grab'
    container.style.removeProperty('user-select')

    // Reset hasDragged after a short delay
    setTimeout(() => setHasDragged(false), 100)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleMouseUp()
    }
  }, [isDragging, handleMouseUp])

  const handleCardClick = useCallback(
    (card: CardInstance) => {
      // Don't trigger click if we were dragging
      if (hasDragged) return

      if (onCardClick) {
        onCardClick(card)
      }
    },
    [onCardClick, hasDragged]
  )

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center">
        <div className="relative mb-4">
          {/* Decorative magic circle */}
          <div className="w-20 h-20 rounded-full border border-slate-600/50 animate-pulse-subtle" />
          <div className="absolute inset-2 rounded-full border border-slate-600/30 animate-pulse-subtle" style={{ animationDelay: '200ms' }} />
          <div className="absolute inset-4 rounded-full border border-slate-600/20 animate-pulse-subtle" style={{ animationDelay: '500ms' }} />
          <Hand className="absolute inset-0 m-auto w-8 h-8 text-slate-500" />
        </div>
        <p className="text-slate-500 text-sm">手牌為空</p>
        <p className="text-slate-600 text-xs mt-1">從市場選擇卡片加入手牌</p>
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        'hand-strip relative',
        isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      data-testid="horizontal-card-strip"
    >
      {cards.map((card, index) => {
        const isSelected = selectedCardId === card.instanceId
        const isHovered = hoveredCardId === card.instanceId
        const canTame = canTameCard ? canTameCard(card.instanceId) : false

        return (
          <div
            key={card.instanceId}
            className={cn(
              'hand-card animate-card-slide-in',
              isSelected && 'hand-card--selected',
              canTame && 'hand-card--can-tame',
              isHovered && 'hand-card--hovered',
              `animate-stagger-${Math.min(index + 1, 9)}`
            )}
            style={{ width: 'auto' }}
            onMouseEnter={() => setHoveredCardId(card.instanceId)}
            onMouseLeave={() => setHoveredCardId(null)}
            data-testid={`hand-card-${card.instanceId}`}
          >
            <Card
              card={card}
              compact
              isSelected={isSelected}
              onClick={onCardClick ? () => handleCardClick(card) : undefined}
            />
          </div>
        )
      })}
    </div>
  )
})

export default HorizontalCardStrip
