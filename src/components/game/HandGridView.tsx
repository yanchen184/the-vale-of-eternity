/**
 * HandGridView Component
 * Grid layout for expanded hand view with pagination
 * @version 2.0.0 - Removed action panel, simplified interface
 */
console.log('[components/game/HandGridView.tsx] v2.0.0 loaded')

import { memo, useState, useCallback, useMemo } from 'react'
import { Hand } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import { Card } from './Card'

// ============================================
// TYPES
// ============================================

export interface HandGridViewProps {
  cards: CardInstance[]
  onCardClick?: (card: CardInstance) => void
  selectedCardId?: string | null
  canTameCard?: (cardId: string) => boolean
  currentRound?: number
}

// ============================================
// PAGINATION DOTS
// ============================================

interface PaginationDotsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const PaginationDots = memo(function PaginationDots({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationDotsProps) {
  if (totalPages <= 1) return null

  return (
    <div className="pagination-dots" data-testid="pagination-dots">
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={cn(
            'pagination-dot',
            i === currentPage ? 'pagination-dot--active' : 'pagination-dot--inactive'
          )}
          aria-label={`第 ${i + 1} 頁`}
          data-testid={`pagination-dot-${i}`}
        />
      ))}
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

const CARDS_PER_PAGE = 12 // 4 cols x 3 rows

export const HandGridView = memo(function HandGridView({
  cards,
  onCardClick,
  selectedCardId,
  canTameCard,
}: HandGridViewProps) {
  const [currentPage, setCurrentPage] = useState(0)

  // Calculate pagination
  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE)
  const startIndex = currentPage * CARDS_PER_PAGE
  const endIndex = startIndex + CARDS_PER_PAGE
  const visibleCards = cards.slice(startIndex, endIndex)

  // Reset to first page if current page is out of bounds
  useMemo(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(0)
    }
  }, [currentPage, totalPages])

  const handleCardClick = useCallback(
    (card: CardInstance) => {
      if (onCardClick) {
        onCardClick(card)
      }
    },
    [onCardClick]
  )

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

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
    <div className="h-full flex flex-col" data-testid="hand-grid-view">
      {/* Grid */}
      <div
        className={cn(
          'hand-grid flex-1',
          selectedCardId && 'hand-grid--has-selection'
        )}
      >
        {visibleCards.map((card, index) => {
          const isSelected = selectedCardId === card.instanceId
          const canTame = canTameCard ? canTameCard(card.instanceId) : false

          return (
            <div
              key={card.instanceId}
              className={cn(
                'hand-card animate-card-slide-in cursor-pointer',
                isSelected && 'hand-card--selected',
                canTame && 'hand-card--can-tame',
                `animate-stagger-${Math.min(index + 1, 9)}`
              )}
              onClick={() => handleCardClick(card)}
              onMouseEnter={() => setHoveredCardId(card.instanceId)}
              onMouseLeave={() => setHoveredCardId(null)}
              data-testid={`grid-card-${card.instanceId}`}
            >
              <Card card={card} compact isSelected={isSelected} />
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      <PaginationDots
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
})

export default HandGridView
