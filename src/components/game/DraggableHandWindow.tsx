/**
 * DraggableHandWindow Component
 * Floating, draggable, resizable window for displaying player's hand
 * @version 1.7.0 - Added draggable zoom slider control
 */
console.log('[components/game/DraggableHandWindow.tsx] v1.7.0 loaded')

import { memo, useState, useRef, useCallback, useEffect } from 'react'
import { GripHorizontal, Maximize, GripVertical } from 'lucide-react'
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
  onTameCard?: (cardId: string) => void
  /** Callback when a card is sold */
  onSellCard?: (cardId: string) => void
  /** Callback when a card is discarded */
  onDiscardCard?: (cardId: string) => void
  /** Callback when a card is moved to sanctuary (expansion mode) */
  onMoveToSanctuary?: (cardId: string) => void
  /** Selected card instance ID (for highlighting) */
  selectedCardId?: string | null
  /** Whether to show action buttons on cards */
  showCardActions?: boolean
  /** Check if a card can be tamed */
  canTameCard?: (cardId: string) => boolean
  /** Current round number (for sell restriction) */
  currentRound?: number
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
  onMoveToSanctuary,
  selectedCardId,
  showCardActions,
  canTameCard,
  currentRound,
}: DraggableHandWindowProps) {
  // Calculate initial position at bottom, centered between sidebars
  // Left sidebar: 320px (w-80), Right sidebar: 320px (w-80)
  // Card height: full size card ~33.6rem (537px)
  // PlayerHand needs: header ~40px + cards with fan layout ~450px + footer ~30px = ~520px minimum
  const sidebarWidth = 320
  const initialWidth = typeof window !== 'undefined'
    ? Math.min(1400, window.innerWidth - (sidebarWidth * 2) - 32)
    : 800
  const initialHeight = 380 // 減小預設視窗高度，內容區域會有更多padding提供卡片移動空間
  const initialX = sidebarWidth + 16
  const initialY = typeof window !== 'undefined'
    ? window.innerHeight - initialHeight - 100 // 100px from bottom (留出分數條空間)
    : 100

  // Window state
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, bottomY: 0 })
  const [zoom, setZoom] = useState(0.7) // Zoom level: 0.5 to 2.5, default 0.7 to match field card size
  const [isPanning, setIsPanning] = useState(false)
  const [scrollStart, setScrollStart] = useState({ scrollLeft: 0, scrollTop: 0, mouseX: 0, mouseY: 0 })
  const [isZoomDragging, setIsZoomDragging] = useState(false)
  const [zoomDragStart, setZoomDragStart] = useState({ y: 0, zoom: 0.7 })

  // Refs
  const windowRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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

  // Handle zoom drag start
  const handleZoomDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsZoomDragging(true)
    setZoomDragStart({
      y: e.clientY,
      zoom: zoom,
    })
  }, [zoom])

  // Handle zoom drag move
  useEffect(() => {
    if (!isZoomDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = zoomDragStart.y - e.clientY // Inverted: drag up = zoom in
      const zoomChange = deltaY * 0.005 // Sensitivity: 200px drag = 1.0 zoom change
      const newZoom = zoomDragStart.zoom + zoomChange
      setZoom(Math.max(0.5, Math.min(2.5, newZoom)))
    }

    const handleMouseUp = () => {
      setIsZoomDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isZoomDragging, zoomDragStart])

  // Handle resize start (from top-right corner)
  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    // Record the bottom edge position (y + height) to keep it fixed
    const bottomY = position.y + size.height
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      bottomY: bottomY,
    })
  }, [size, position])

  // Handle resize move (top-right corner behavior)
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      // Right: expand width when dragging right
      const newWidth = Math.max(400, resizeStart.width + deltaX)

      // Top: expand height when dragging up (negative deltaY means dragging up)
      const newHeight = Math.max(280, resizeStart.height - deltaY)

      setSize({
        width: newWidth,
        height: newHeight,
      })

      // Keep bottom edge fixed: bottomY = newY + newHeight
      // So: newY = bottomY - newHeight
      setPosition(prev => ({
        x: prev.x,
        y: resizeStart.bottomY - newHeight,
      }))
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

  // Handle zoom with Ctrl+Wheel (like Chrome)
  useEffect(() => {
    const element = windowRef.current
    if (!element) return

    const handleWheel = (e: WheelEvent) => {
      // Only zoom when Ctrl is pressed
      if (!e.ctrlKey && !e.metaKey) return

      e.preventDefault()

      setZoom((prevZoom) => {
        // Calculate new zoom level - smoother increment
        const delta = e.deltaY > 0 ? -0.05 : 0.05
        const newZoom = prevZoom + delta

        // Clamp zoom between 0.5 and 2.5
        return Math.max(0.5, Math.min(2.5, newZoom))
      })
    }

    element.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      element.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // Handle content panning (drag to scroll)
  const handleContentMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const content = contentRef.current
    if (!content) return

    // Don't pan if clicking on a card or interactive element
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[draggable="true"]')) {
      return
    }

    setIsPanning(true)
    setScrollStart({
      scrollLeft: content.scrollLeft,
      scrollTop: content.scrollTop,
      mouseX: e.clientX,
      mouseY: e.clientY,
    })

    // Prevent text selection while dragging
    e.preventDefault()
  }, [])

  // Handle panning move
  useEffect(() => {
    if (!isPanning) return

    const content = contentRef.current
    if (!content) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - scrollStart.mouseX
      const deltaY = e.clientY - scrollStart.mouseY

      content.scrollLeft = scrollStart.scrollLeft - deltaX
      content.scrollTop = scrollStart.scrollTop - deltaY
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning, scrollStart])


  return (
    <div
      ref={windowRef}
      className={cn(
        'fixed z-50 bg-slate-900/95 backdrop-blur-md rounded-lg border-2 border-purple-500/50 shadow-2xl',
        'transition-opacity duration-200',
        (isDragging || isResizing) && 'cursor-grabbing shadow-purple-500/50'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
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

        {/* Right: Zoom and Resize Controls */}
        <div className="flex items-center gap-3">
          {/* Zoom Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-300">
              {Math.round(zoom * 100)}%
            </span>
            <div
              className={cn(
                'p-2 rounded cursor-ns-resize hover:bg-purple-500/20 transition-colors',
                isZoomDragging && 'bg-purple-500/30'
              )}
              onMouseDown={handleZoomDragStart}
              title="上下拖曳調整縮放 (或使用 Ctrl+滾輪)"
            >
              <GripVertical className="w-4 h-4 text-purple-400" />
            </div>
          </div>

          {/* Resize Control */}
          <div
            className={cn(
              'p-2 rounded cursor-nesw-resize hover:bg-purple-500/20 transition-colors',
              isResizing && 'bg-purple-500/30'
            )}
            onMouseDown={handleResizeStart}
            title="往右上拖曳可放大視窗"
          >
            <Maximize className="w-4 h-4 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="overflow-auto select-none"
        style={{
          height: 'calc(100% - 48px)', // Full height minus header
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleContentMouseDown}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            padding: '80px 12px', // 上下增加更多padding讓卡片有空間移動和懸停
            transition: 'transform 0.1s ease-out',
          }}
        >
          <PlayerHand
            cards={cards}
            onCardSelect={(cardId) => {
              const card = cards.find(c => c.instanceId === cardId)
              if (card && onCardClick) onCardClick(card)
            }}
            onCardPlay={onTameCard}
            onCardSell={onSellCard}
            onCardDiscard={onDiscardCard}
            onMoveToSanctuary={onMoveToSanctuary}
            selectedCardId={selectedCardId}
            showActions={showCardActions}
            canTameCard={canTameCard}
            currentRound={currentRound}
            maxHandSize={999} // No limit in floating window
          />
        </div>
      </div>

    </div>
  )
})

export default DraggableHandWindow
