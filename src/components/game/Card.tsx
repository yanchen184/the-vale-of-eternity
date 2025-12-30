/**
 * Card Component with Image Display
 * Renders a game card with its image and stats
 * @version 2.1.0
 */
console.log('[components/game/Card.tsx] v2.1.0 loaded')

import { useState, useCallback, memo } from 'react'
import { getCardImagePath } from '@/lib/card-images'
import type { CardInstance } from '@/types/cards'
import { Element, ELEMENT_ICONS } from '@/types/cards'

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
  /** Callback when card is clicked */
  onClick?: () => void
  /** Whether the card can be tamed */
  canTame?: boolean
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
  canTame: boolean
}

const CardActions = memo(function CardActions({
  onTake,
  onTame,
  onSell,
  canTame,
}: CardActionsProps) {
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
          Tame
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
        >
          Sell
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
  onClick,
  canTame = false,
  className = '',
}: CardProps) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    }
  }, [onClick])

  const borderClass = getElementBorderClass(card.element)
  const bgClass = getElementBgClass(card.element)
  const elementIcon = ELEMENT_ICONS[card.element]

  // Face down card
  if (isFaceDown) {
    return (
      <div
        className={`
          relative rounded-lg overflow-hidden border-2 border-slate-600
          bg-gradient-to-b from-slate-700 to-slate-800
          ${compact ? 'w-20 h-30' : 'w-36 h-52'}
          ${className}
        `}
        data-testid={`card-back-${index}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl opacity-30">?</div>
        </div>
      </div>
    )
  }

  // Compact card (for field display)
  if (compact) {
    return (
      <div
        className={`
          relative rounded-lg overflow-hidden border-2
          ${borderClass} ${bgClass}
          w-20 h-30 flex-shrink-0 cursor-pointer
          transition-all duration-200 hover:scale-105
          ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
          ${className}
        `}
        onClick={handleClick}
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

        {/* Overlay with stats */}
        <div className="absolute inset-0 flex flex-col justify-between p-1 bg-gradient-to-t from-black/80 via-transparent to-black/40">
          {/* Cost badge */}
          <div className="flex justify-between items-start">
            <span className="bg-slate-900/80 text-white text-xs font-bold px-1 rounded">
              {card.cost}
            </span>
            <span className="text-sm">{elementIcon}</span>
          </div>

          {/* Score */}
          <div className="text-center">
            <span className="text-lg font-bold text-white drop-shadow-lg">
              {card.baseScore + card.scoreModifier}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Full card
  return (
    <div
      className={`
        relative rounded-lg overflow-hidden border-2
        ${borderClass} ${bgClass}
        w-36 h-52 flex-shrink-0 cursor-pointer
        transition-all duration-200 hover:scale-105 hover:shadow-lg
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
        ${className}
      `}
      onClick={handleClick}
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
          <span className="bg-slate-900/90 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            {card.cost}
          </span>
          <span className="text-base">{elementIcon}</span>
        </div>

        {/* Center: Score */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white drop-shadow-lg">
              {card.baseScore + card.scoreModifier}
            </div>
            {card.scoreModifier !== 0 && (
              <div className={`text-xs ${card.scoreModifier > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({card.scoreModifier > 0 ? '+' : ''}{card.scoreModifier})
              </div>
            )}
          </div>
        </div>

        {/* Footer: Name and Effect */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-white truncate text-center drop-shadow">
            {card.nameTw}
          </div>
          {card.effectDescriptionTw && (
            <div className="text-[10px] text-slate-300 text-center line-clamp-2 leading-tight">
              {card.effectDescriptionTw}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (onTake || onTame || onSell) && (
        <CardActions
          onTake={onTake}
          onTame={onTame}
          onSell={onSell}
          canTame={canTame}
        />
      )}
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
