/**
 * PlayerHandPreview Component
 * Displays a player's hand as card backs with 20% overlap
 * @version 1.1.0 - 點擊卡片縮略圖切換底部手牌區
 */
console.log('[components/game/PlayerHandPreview.tsx] v1.1.0 loaded')

import { memo } from 'react'
import { cn } from '@/lib/utils'

// ============================================
// CONSTANTS
// ============================================

const BASE_PATH = '/the-vale-of-eternity'
const CARD_BACK_IMAGE = `${BASE_PATH}/assets/card-back.png`

// Card dimensions in compact mode
const CARD_WIDTH = 80 // px
const OVERLAP_PERCENTAGE = 0.2
const OFFSET_X = CARD_WIDTH * (1 - OVERLAP_PERCENTAGE) // 64px

// ============================================
// TYPES
// ============================================

export interface PlayerHandPreviewProps {
  /** Number of cards in hand */
  handCount: number
  /** Player name for tooltip */
  playerName: string
  /** Additional CSS classes */
  className?: string
  /** Callback when clicking the hand preview to toggle hand panel */
  onToggleHandPanel?: () => void
}

// ============================================
// CARD BACK COMPONENT
// ============================================

interface CardBackProps {
  index: number
  isLast: boolean
}

const CardBack = memo(function CardBack({ index, isLast }: CardBackProps) {
  return (
    <div
      className="absolute transition-all duration-200"
      style={{
        left: `${index * OFFSET_X}px`,
        top: 0,
        zIndex: index,
      }}
    >
      <div
        className={cn(
          'rounded-lg shadow-lg transition-all duration-200',
          'border-2 border-slate-600',
          'hover:transform hover:scale-105 hover:z-50',
          isLast && 'ring-1 ring-slate-500/50'
        )}
        style={{
          width: `${CARD_WIDTH}px`,
          height: `${CARD_WIDTH * 1.4}px`, // Standard card aspect ratio
          backgroundImage: `url(${CARD_BACK_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Fallback gradient if image doesn't load */}
        <div
          className={cn(
            'w-full h-full rounded-lg',
            'bg-gradient-to-br from-slate-700 to-slate-900',
            'opacity-0 transition-opacity duration-300',
            '[&:not(:has(+img))]:opacity-100'
          )}
        />
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const PlayerHandPreview = memo(function PlayerHandPreview({
  handCount,
  playerName,
  className,
  onToggleHandPanel,
}: PlayerHandPreviewProps) {
  // Calculate container width based on card count
  const containerWidth = handCount > 0
    ? CARD_WIDTH + (handCount - 1) * OFFSET_X
    : 0

  if (handCount === 0) {
    return (
      <div
        className={cn(
          'text-center py-2 text-slate-600 text-xs italic',
          className
        )}
        data-testid="player-hand-preview-empty"
      >
        無手牌
      </div>
    )
  }

  return (
    <div className={cn('relative', className)} data-testid="player-hand-preview">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500 font-semibold">手牌</span>
        <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded">
          {handCount} 張
        </span>
      </div>

      {/* Card Stack Container - Clickable to toggle hand panel */}
      <div
        className={cn(
          'relative mb-2',
          onToggleHandPanel && 'cursor-pointer hover:opacity-80 transition-opacity'
        )}
        style={{
          width: `${containerWidth}px`,
          height: `${CARD_WIDTH * 1.4}px`,
          minHeight: `${CARD_WIDTH * 1.4}px`,
        }}
        title={onToggleHandPanel ? `點擊以${playerName === '我' ? '展開/收起' : '查看'}手牌` : `${playerName} 的手牌：${handCount} 張`}
        onClick={onToggleHandPanel}
        data-testid="hand-preview-clickable"
      >
        {Array.from({ length: handCount }).map((_, index) => (
          <CardBack
            key={index}
            index={index}
            isLast={index === handCount - 1}
          />
        ))}
      </div>

      {/* Visual separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
    </div>
  )
})

export default PlayerHandPreview
