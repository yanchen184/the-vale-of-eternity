/**
 * DraggableHandWindow Component
 * Floating, draggable, resizable window for displaying player's hand
 * @version 1.1.0 - Added resize functionality
 */
console.log('[components/game/DraggableHandWindow.tsx] v1.1.0 loaded')

import { memo, useState, useRef, useCallback, useEffect } from 'react'
import { Minimize2, Maximize2, GripHorizontal, Maximize } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlayerHand } from './PlayerHand'
import type { CardInstance } from '@/types/cards'

// ============================================
// TYPES
// ============================================

export interface DraggableHandWindowProps {
  /** Player's hand cards */
  cards: CardInstance[]
  /** Callback when a card is clicked */
  onCardClick?: (card: CardInstance) => void
  /** Callback when a card is selected for taming */
  onTameCard?: (card: CardInstance) => void
  /** Callback when a card is sold */
  onSellCard?: (card: CardInstance) => void
  /** Callback when a card is discarded */
  onDiscardCard?: (card: CardInstance) => void
  /** Selected card instance ID (for highlighting) */
  selectedCardId?: string | null
  /** Whether to show action buttons on cards */
  showCardActions?: boolean
  /** Whether taming is allowed */
  canTame?: boolean
}

// ============================================
// MAIN COMPONENT
// ============================================

export const DraggableHandWindow = memo(function DraggableHandWindow({
  cards,
  onCardClick,
  onTameCard,
  onSellCard,
  onDiscardCard,
  selectedCardId,
  showCardActions,
  canTame,
}: DraggableHandWindowProps) {
  // Calculate initial position at bottom, centered between sidebars
  // Left sidebar: 320px (w-80), Right sidebar: 320px (w-80)
  // Card height: full size card ~33.6rem (537px), need about 380px height for hand display
  const sidebarWidth = 320
  const initialWidth = typeof window !== 'undefined'
    ? Math.min(1400, window.innerWidth - (sidebarWidth * 2) - 32)
    : 800
  const initialHeight = 420 // 足夠放下卡片的高度
  const initialX = sidebarWidth + 16
  const initialY = typeof window !== 'undefined'
    ? window.innerHeight - initialHeight - 100 // 100px from bottom (留出分數條空間)
    : 100

  // Window state
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // Refs
  const windowRef = useRef<HTMLDivElement>(null)

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the header
    if (!(e.target as HTMLElement).closest('.drag-handle')) return

    setIsDragging(true)
    const rect = windowRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }, [])

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev)
  }, [])

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    })
  }, [size])

  // Handle resize move
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      setSize({
        width: Math.max(400, resizeStart.width + deltaX),
        height: Math.max(300, resizeStart.height + deltaY),
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeStart])

  return (
    <div
      ref={windowRef}
      className={cn(
        'fixed z-50 bg-slate-900/95 backdrop-blur-md rounded-lg border-2 border-purple-500/50 shadow-2xl',
        'transition-opacity duration-200',
        (isDragging || isResizing) && 'cursor-grabbing shadow-purple-500/50',
        isMinimized && 'w-80'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? undefined : `${size.width}px`,
        height: isMinimized ? undefined : `${size.height}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        className={cn(
          'drag-handle',
          'flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-900/50 to-violet-900/50',
          'border-b border-purple-500/30 rounded-t-lg cursor-grab active:cursor-grabbing',
          'select-none'
        )}
      >
        {/* Left: Title and Grip Icon */}
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-purple-300">
            我的手牌 ({cards.length} 張)
          </h3>
        </div>

        {/* Right: Minimize Button */}
        <button
          type="button"
          onClick={toggleMinimize}
          className="p-1.5 rounded hover:bg-purple-500/20 transition-colors"
          title={isMinimized ? '展開' : '最小化'}
        >
          {isMinimized ? (
            <Maximize2 className="w-4 h-4 text-purple-400" />
          ) : (
            <Minimize2 className="w-4 h-4 text-purple-400" />
          )}
        </button>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3">
          <PlayerHand
            cards={cards}
            onCardClick={onCardClick}
            onTameCard={onTameCard}
            onSellCard={onSellCard}
            onDiscardCard={onDiscardCard}
            selectedCardId={selectedCardId}
            showActions={showCardActions}
            canTame={canTame}
            maxHandSize={999} // No limit in floating window
          />
        </div>
      )}

      {/* Minimized state - show card count */}
      {isMinimized && (
        <div className="px-4 py-3 text-center text-sm text-purple-300">
          點擊展開查看手牌
        </div>
      )}

      {/* Resize Handle - Bottom Right Corner */}
      {!isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-50 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
          title="拖動調整大小"
        >
          <Maximize className="w-4 h-4 text-purple-400" />
        </div>
      )}
    </div>
  )
})

export default DraggableHandWindow
