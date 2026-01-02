/**
 * Card Component with Image Display
 * Renders a game card with its image and stats
 * @version 2.22.0 - Removed black background overlay, show card name only at bottom
 */
console.log('[components/game/Card.tsx] v2.22.0 loaded')

import { useState, useCallback, memo } from 'react'
import { Flame, Droplets, TreePine, Wind, Crown, Gem } from 'lucide-react'
import { getCardImagePath } from '@/lib/card-images'
import type { CardInstance } from '@/types/cards'
import { Element } from '@/types/cards'
import { PlayerMarker } from './PlayerMarker'
import type { PlayerColor } from '@/types/player-color'
import { getElementSellCoins } from '@/services/multiplayer-game'
import { Modal } from '@/components/ui/Modal'

// ============================================
// ELEMENT ICON COMPONENTS
// ============================================

interface ElementIconProps {
  element: Element
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const ELEMENT_ICON_COMPONENTS: Record<Element, React.ComponentType<{ className?: string }>> = {
  [Element.FIRE]: Flame,
  [Element.WATER]: Droplets,
  [Element.EARTH]: TreePine,
  [Element.WIND]: Wind,
  [Element.DRAGON]: Crown,
}

const ELEMENT_ICON_COLORS: Record<Element, string> = {
  [Element.FIRE]: 'text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]',
  [Element.WATER]: 'text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]',
  [Element.EARTH]: 'text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]',
  [Element.WIND]: 'text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]',
  [Element.DRAGON]: 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]',
}

const ELEMENT_ICON_SIZES: Record<string, string> = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
}

function ElementIcon({ element, size = 'md', className = '' }: ElementIconProps) {
  const IconComponent = ELEMENT_ICON_COMPONENTS[element]
  const colorClass = ELEMENT_ICON_COLORS[element]
  const sizeClass = ELEMENT_ICON_SIZES[size]

  return (
    <IconComponent
      className={`${sizeClass} ${colorClass} ${className}`}
      aria-label={element}
    />
  )
}

// ============================================
// TYPES
// ============================================

export interface CardProps {
  /** Card instance data */
  card: CardInstance
  /** Card index in list (for test ids) */
  index?: number
  /** Compact display mode for field cards */
  compact?: boolean
  /** Large display mode for hand window (1.5x size) */
  large?: boolean
  /** Show action buttons */
  showActions?: boolean
  /** Whether the card is selected */
  isSelected?: boolean
  /** Whether the card is face down */
  isFaceDown?: boolean
  /** Callback when Take button is clicked */
  onTake?: () => void
  /** Callback when Tame button is clicked */
  onTame?: () => void
  /** Callback when Sell button is clicked */
  onSell?: () => void
  /** Callback when Discard button is clicked */
  onDiscard?: () => void
  /** Callback when Move to Sanctuary button is clicked (expansion mode) */
  onMoveToSanctuary?: () => void
  /** Callback when card is clicked */
  onClick?: () => void
  /** Whether the card can be tamed */
  canTame?: boolean
  /** Player color for selection marker (shown when card is selected during hunting) */
  selectedByColor?: PlayerColor | null
  /** Player name for marker tooltip */
  selectedByName?: string
  /** Whether the selection is confirmed (locked) - shows lock icon on marker */
  isConfirmed?: boolean
  /** Whether this is a newly placed marker (triggers drop animation) */
  isNewMarker?: boolean
  /** Current round number (for showing "new this round" badge) */
  currentRound?: number
  /** Additional CSS classes */
  className?: string
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface CardImageProps {
  cardId: string
  cardName: string
  onError: () => void
  hasError: boolean
}

const CardImage = memo(function CardImage({
  cardId,
  cardName,
  onError,
  hasError,
}: CardImageProps) {
  const imagePath = getCardImagePath(cardId)

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-700/50">
        <span className="text-slate-400 text-xs">No Image</span>
      </div>
    )
  }

  return (
    <img
      src={imagePath}
      alt={cardName}
      className="absolute inset-0 w-full h-full object-cover"
      onError={onError}
      loading="lazy"
    />
  )
})

interface CardActionsProps {
  onTake?: () => void
  onTame?: () => void
  onSell?: () => void
  onDiscard?: () => void
  onMoveToSanctuary?: () => void
  canTame: boolean
  cardElement: Element  // Card's element for calculating sell coins
}

const CardActions = memo(function CardActions({
  onTake,
  onTame,
  onSell,
  onDiscard,
  onMoveToSanctuary,
  canTame,
  cardElement,
}: CardActionsProps) {
  // Calculate coins for sell button based on element
  const coins = getElementSellCoins(cardElement)

  // Build coin descriptions (short for button, long for tooltip)
  const coinParts: string[] = []
  const shortCoinParts: string[] = []

  if (coins.six > 0) {
    coinParts.push(`${coins.six}個6分`)
    shortCoinParts.push(`${coins.six}×6`)
  }
  if (coins.three > 0) {
    coinParts.push(`${coins.three}個3分`)
    shortCoinParts.push(`${coins.three}×3`)
  }
  if (coins.one > 0) {
    coinParts.push(`${coins.one}個1分`)
    shortCoinParts.push(`${coins.one}×1`)
  }

  const coinText = shortCoinParts.join('+')
  const coinTooltip = coinParts.length > 0 ? `獲得${coinParts.join('和')}石頭` : ''

  return (
    <div className="absolute bottom-0 left-0 right-0 p-1 bg-slate-900/80 flex gap-1">
      {onTake && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onTake()
          }}
          className="flex-1 text-xs bg-slate-600 hover:bg-slate-500 text-white py-1 px-2 rounded transition-colors"
          type="button"
        >
          Take
        </button>
      )}
      {onTame && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onTame()
          }}
          disabled={!canTame}
          className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
            canTame
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
          type="button"
        >
          召喚
        </button>
      )}
      {onSell && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSell()
          }}
          className="flex-1 text-xs bg-amber-600 hover:bg-amber-500 text-white py-1 px-2 rounded transition-colors"
          type="button"
          title={coinTooltip}
        >
          <div className="flex flex-col items-center">
            <span>賣出</span>
            {coinText && <span className="text-[10px] opacity-90">{coinText}</span>}
          </div>
        </button>
      )}
      {onDiscard && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDiscard()
          }}
          className="flex-1 text-xs bg-red-600 hover:bg-red-500 text-white py-1 px-2 rounded transition-colors"
          type="button"
          title="棄置此卡片"
        >
          棄置
        </button>
      )}
      {onMoveToSanctuary && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMoveToSanctuary()
          }}
          className="flex-1 text-xs bg-amber-700 hover:bg-amber-600 text-amber-100 py-1 px-2 rounded transition-colors"
          type="button"
          title="移至棲息地（擴充模式）"
        >
          棲息地
        </button>
      )}
    </div>
  )
})

// ============================================
// ELEMENT STYLES
// ============================================

const getElementBorderClass = (element: Element): string => {
  const borderClasses: Record<Element, string> = {
    [Element.FIRE]: 'border-red-500',
    [Element.WATER]: 'border-blue-500',
    [Element.EARTH]: 'border-green-500',
    [Element.WIND]: 'border-purple-500',
    [Element.DRAGON]: 'border-amber-500',
  }
  return borderClasses[element] || 'border-slate-500'
}

const getElementBgClass = (element: Element): string => {
  const bgClasses: Record<Element, string> = {
    [Element.FIRE]: 'bg-gradient-to-b from-red-900/80 to-red-950/90',
    [Element.WATER]: 'bg-gradient-to-b from-blue-900/80 to-blue-950/90',
    [Element.EARTH]: 'bg-gradient-to-b from-green-900/80 to-green-950/90',
    [Element.WIND]: 'bg-gradient-to-b from-purple-900/80 to-purple-950/90',
    [Element.DRAGON]: 'bg-gradient-to-b from-amber-900/80 to-amber-950/90',
  }
  return bgClasses[element] || 'bg-slate-800'
}

// ============================================
// MAIN COMPONENT
// ============================================

export const Card = memo(function Card({
  card,
  index = 0,
  compact = false,
  showActions = false,
  isSelected = false,
  isFaceDown = false,
  onTake,
  onTame,
  onSell,
  onDiscard,
  onMoveToSanctuary,
  onClick,
  canTame = false,
  selectedByColor,
  selectedByName,
  isConfirmed = false,
  isNewMarker = false,
  currentRound,
  className = '',
}: CardProps) {
  const [imageError, setImageError] = useState(false)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [showFullCard, setShowFullCard] = useState(false)

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleClick = useCallback(() => {
    // 如果有外部 onClick,優先執行
    if (onClick) {
      onClick()
    } else {
      // 否則打開完整卡片 Modal
      setShowFullCard(true)
    }
  }, [onClick])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isHovered) {
      e.stopPropagation()
      e.preventDefault()
      setScrollOffset(prev => {
        const newOffset = prev - e.deltaY * 0.5
        // 限制滾動範圍: 最多向上移動 200px, 不能向下移動
        return Math.max(-200, Math.min(0, newOffset))
      })
    }
  }, [isHovered])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setScrollOffset(0)  // 離開時重置位置
  }, [])

  const borderClass = getElementBorderClass(card.element)
  const bgClass = getElementBgClass(card.element)

  // Face down card
  if (isFaceDown) {
    return (
      <div
        className={`
          relative rounded-lg overflow-hidden border-2 border-slate-600
          bg-gradient-to-b from-slate-700 to-slate-800
          ${className}
        `}
        style={{ width: '21rem', height: '31.5rem' }}
        data-testid={`card-back-${index}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl opacity-30">?</div>
        </div>
      </div>
    )
  }

  // Compact card (for field display) - reduced height for better layout
  if (compact) {
    return (
      <>
        <div
          className={`
            relative rounded-lg overflow-hidden border-2
            ${borderClass} ${bgClass}
            flex-shrink-0 cursor-pointer
            transition-all duration-200
            ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
            ${className}
          `}
          style={{
            width: '10.5rem',
            height: '15.75rem',
            transform: `translateY(${scrollOffset}px)`,
            transition: scrollOffset === 0 ? 'transform 0.3s ease-out' : 'none'
          }}
          onClick={handleClick}
          onWheel={handleWheel}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-testid={`card-compact-${card.instanceId}`}
        >
          {/* Image */}
          <div className="absolute inset-0">
            <CardImage
              cardId={card.cardId}
              cardName={card.name}
              onError={handleImageError}
              hasError={imageError}
            />
          </div>

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-2 bg-gradient-to-t from-black/90 via-black/20 to-black/60">
            {/* Header: Cost and Element */}
            <div className="flex justify-between items-start">
              {/* Cost badge */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-amber-900/90 to-amber-950/90 px-2 py-1 rounded-lg border-2 border-amber-500/60 shadow-lg">
                <Gem className="w-5 h-5 text-amber-300 drop-shadow-lg" />
                <span className="text-lg font-bold text-amber-100 leading-none drop-shadow-lg">{card.cost}</span>
              </div>
              {/* Element icon */}
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-600/50 shadow-lg">
                <ElementIcon element={card.element} size="lg" />
              </div>
            </div>

            {/* Footer: Name only */}
            <div className="text-[10px] font-semibold text-white text-center drop-shadow-lg">
              {card.nameTw}
            </div>
          </div>
        </div>

        {/* Full Card Modal for compact cards */}
        <Modal
          isOpen={showFullCard}
          onClose={() => setShowFullCard(false)}
          title=""
          size="lg"
          className="bg-slate-900/95"
          showCloseButton={true}
        >
          <div className="flex flex-col items-center gap-6 py-4">
            {/* 完整卡片圖片 - 使用超大尺寸確保完全顯示 */}
            <div
              className={`
                relative rounded-lg overflow-visible border-2
                ${borderClass} ${bgClass}
                flex-shrink-0
              `}
              style={{ width: '35rem', height: '52.5rem' }}
            >
              {/* Image */}
              <div className="absolute inset-0">
                <CardImage
                  cardId={card.cardId}
                  cardName={card.name}
                  onError={handleImageError}
                  hasError={imageError}
                />
              </div>

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-3 bg-gradient-to-t from-black/90 via-black/20 to-black/60">
                {/* Header: Cost and Element */}
                <div className="flex justify-between items-start">
                  {/* Cost badge */}
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-900/90 to-amber-950/90 px-3 py-1.5 rounded-lg border-2 border-amber-500/60 shadow-lg">
                    <Gem className="w-6 h-6 text-amber-300 drop-shadow-lg" />
                    <span className="text-2xl font-bold text-amber-100 leading-none drop-shadow-lg">{card.cost}</span>
                  </div>
                  {/* Element icon */}
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-600/50 shadow-lg">
                    <ElementIcon element={card.element} size="xl" />
                  </div>
                </div>

                {/* Footer: Name, Effect, Score */}
                <div className="space-y-2">
                  <div className="text-xl font-bold text-white text-center drop-shadow-lg bg-slate-900/50 rounded py-2">
                    {card.nameTw}
                  </div>
                  {card.effectDescriptionTw && (
                    <div className="text-sm text-slate-200 leading-relaxed bg-slate-900/70 rounded p-3">
                      {card.effectDescriptionTw}
                    </div>
                  )}
                  <div className="text-center">
                    <span className="text-3xl font-bold text-white drop-shadow-lg bg-slate-900/50 rounded px-4 py-2 inline-block">
                      分數: {card.baseScore + card.scoreModifier}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </>
    )
  }

  // Full card (same size as compact for consistency)
  return (
    <div
      className={`
        relative rounded-lg overflow-hidden border-2
        ${borderClass} ${bgClass}
        flex-shrink-0 cursor-pointer
        transition-all duration-200
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
        ${selectedByColor ? 'opacity-80' : ''}
        ${className}
      `}
      style={{
        width: '22.4rem',
        height: '33.6rem',
        transform: `translateY(${scrollOffset}px)`,
        transition: scrollOffset === 0 ? 'transform 0.3s ease-out' : 'none'
      }}
      onClick={handleClick}
      onWheel={handleWheel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={`card-${index}`}
    >
      {/* Image */}
      <div className="absolute inset-0">
        <CardImage
          cardId={card.cardId}
          cardName={card.name}
          onError={handleImageError}
          hasError={imageError}
        />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-2 bg-gradient-to-t from-black/90 via-black/20 to-black/60">
        {/* Header: Cost and Element */}
        <div className="flex justify-between items-start">
          {/* Cost badge - icon and number only */}
          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-900/90 to-amber-950/90 px-2 py-1 rounded-lg border-2 border-amber-500/60 shadow-lg">
            <Gem className="w-5 h-5 text-amber-300 drop-shadow-lg" />
            <span className="text-lg font-bold text-amber-100 leading-none drop-shadow-lg">{card.cost}</span>
          </div>
          {/* Larger element icon with background */}
          <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-600/50 shadow-lg">
            <ElementIcon element={card.element} size="lg" />
          </div>
        </div>

        {/* Center: Card Name */}
        <div className="flex-1 flex items-center justify-center pointer-events-none">
          {/* Empty - let the image shine through */}
        </div>

        {/* Footer: Name only */}
        <div className="text-[9px] font-semibold text-white truncate text-center drop-shadow-lg">
          {card.nameTw}
        </div>
      </div>

      {/* "New This Round" Badge - shown when card was acquired in current round */}
      {currentRound !== undefined &&
       // @ts-expect-error - acquiredInRound is added at runtime from Firebase
       card.acquiredInRound === currentRound && (
        <div className="absolute top-2 left-2 z-20">
          <div className="px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] font-bold shadow-lg border-2 border-white/30 animate-pulse">
            本回合
          </div>
        </div>
      )}

      {/* Player Selection Marker - shown when card is selected during hunting phase */}
      {selectedByColor && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          data-testid={`card-marker-${index}`}
        >
          <PlayerMarker
            color={selectedByColor}
            size="lg"
            showGlow={!isConfirmed}
            playerName={selectedByName}
            isConfirmed={isConfirmed}
            isNew={isNewMarker}
          />
        </div>
      )}

      {/* Action buttons */}
      {showActions && (onTake || onTame || onSell || onDiscard || onMoveToSanctuary) && (
        <CardActions
          onTake={onTake}
          onTame={onTame}
          onSell={onSell}
          onDiscard={onDiscard}
          onMoveToSanctuary={onMoveToSanctuary}
          canTame={canTame}
          cardElement={card.element}
        />
      )}

      {/* Full Card Modal */}
      <Modal
        isOpen={showFullCard}
        onClose={() => setShowFullCard(false)}
        title={card.nameTw}
        size="sm"
        className="bg-slate-900/95"
      >
        <div className="flex flex-col items-center gap-4">
          {/* 完整卡片圖片 - 使用大尺寸 */}
          <div
            className={`
              relative rounded-lg overflow-hidden border-2
              ${borderClass} ${bgClass}
              flex-shrink-0
            `}
            style={{ width: '28rem', height: '42rem' }}
          >
            {/* Image */}
            <div className="absolute inset-0">
              <CardImage
                cardId={card.cardId}
                cardName={card.name}
                onError={handleImageError}
                hasError={imageError}
              />
            </div>

            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 bg-gradient-to-t from-black/90 via-black/20 to-black/60">
              {/* Header: Cost and Element */}
              <div className="flex justify-between items-start">
                {/* Cost badge */}
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-900/90 to-amber-950/90 px-3 py-1.5 rounded-lg border-2 border-amber-500/60 shadow-lg">
                  <Gem className="w-6 h-6 text-amber-300 drop-shadow-lg" />
                  <span className="text-2xl font-bold text-amber-100 leading-none drop-shadow-lg">{card.cost}</span>
                </div>
                {/* Element icon */}
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-600/50 shadow-lg">
                  <ElementIcon element={card.element} size="xl" />
                </div>
              </div>

              {/* Footer: Name, Effect, Score */}
              <div className="space-y-2">
                <div className="text-xl font-bold text-white text-center drop-shadow-lg bg-slate-900/50 rounded py-2">
                  {card.nameTw}
                </div>
                {card.effectDescriptionTw && (
                  <div className="text-sm text-slate-200 leading-relaxed bg-slate-900/70 rounded p-3">
                    {card.effectDescriptionTw}
                  </div>
                )}
                <div className="text-center">
                  <span className="text-3xl font-bold text-white drop-shadow-lg bg-slate-900/50 rounded px-4 py-2 inline-block">
                    分數: {card.baseScore + card.scoreModifier}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
})

// ============================================
// CARD BACK COMPONENT
// ============================================

export interface CardBackProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

export const CardBack = memo(function CardBack({
  size = 'md',
  className = '',
}: CardBackProps) {
  const sizeClasses = {
    sm: 'w-12 h-18',
    md: 'w-20 h-28',
    lg: 'w-28 h-40',
  }

  return (
    <div
      className={`
        relative rounded-lg overflow-hidden border-2 border-slate-600
        bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-3xl opacity-30">
          Vale
        </div>
      </div>
      {/* Decorative pattern */}
      <div className="absolute inset-2 border border-slate-600/50 rounded opacity-50" />
    </div>
  )
})

export default Card
