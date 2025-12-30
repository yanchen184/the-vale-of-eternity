/**
 * StonePool Component
 * Displays player's stone resources with element colors
 * @version 1.0.0
 */
console.log('[components/game/StonePool.tsx] v1.0.0 loaded')

import { useState, useCallback, memo, useMemo } from 'react'
import type { StonePool as StonePoolType } from '@/types/game'
import { StoneType, STONE_ICONS } from '@/types/cards'
import { calculateStonePoolValue } from '@/types/game'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface StonePoolProps {
  /** Stone pool data */
  stones: StonePoolType | null
  /** Stone limit (optional) */
  stoneLimit?: number
  /** Whether to show exchange options */
  showExchange?: boolean
  /** Callback when stones are exchanged */
  onExchange?: (fromType: StoneType, toType: StoneType, amount: number) => void
  /** Compact display mode */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================
// CONSTANTS
// ============================================

interface StoneTypeConfig {
  type: StoneType
  key: keyof StonePoolType
  value: number
  label: string
  labelTw: string
  color: string
  bgColor: string
  borderColor: string
  glowColor: string
}

const STONE_CONFIGS: StoneTypeConfig[] = [
  {
    type: StoneType.ONE,
    key: 'ONE',
    value: 1,
    label: '1-Point',
    labelTw: '1點',
    color: 'text-slate-300',
    bgColor: 'bg-slate-700',
    borderColor: 'border-slate-500',
    glowColor: 'rgba(148, 163, 184, 0.4)',
  },
  {
    type: StoneType.THREE,
    key: 'THREE',
    value: 3,
    label: '3-Point',
    labelTw: '3點',
    color: 'text-slate-200',
    bgColor: 'bg-slate-600',
    borderColor: 'border-slate-400',
    glowColor: 'rgba(203, 213, 225, 0.4)',
  },
  {
    type: StoneType.SIX,
    key: 'SIX',
    value: 6,
    label: '6-Point',
    labelTw: '6點',
    color: 'text-yellow-300',
    bgColor: 'bg-yellow-900/50',
    borderColor: 'border-yellow-500',
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  {
    type: StoneType.FIRE,
    key: 'FIRE',
    value: 1,
    label: 'Fire',
    labelTw: '火',
    color: 'text-red-400',
    bgColor: 'bg-red-900/50',
    borderColor: 'border-red-500',
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  {
    type: StoneType.WATER,
    key: 'WATER',
    value: 1,
    label: 'Water',
    labelTw: '水',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/50',
    borderColor: 'border-blue-500',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
  {
    type: StoneType.EARTH,
    key: 'EARTH',
    value: 1,
    label: 'Earth',
    labelTw: '土',
    color: 'text-green-400',
    bgColor: 'bg-green-900/50',
    borderColor: 'border-green-500',
    glowColor: 'rgba(34, 197, 94, 0.4)',
  },
  {
    type: StoneType.WIND,
    key: 'WIND',
    value: 1,
    label: 'Wind',
    labelTw: '風',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/50',
    borderColor: 'border-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.4)',
  },
]

// Element stones only (for exchange)
const ELEMENT_STONE_CONFIGS = STONE_CONFIGS.filter(
  (s) => [StoneType.FIRE, StoneType.WATER, StoneType.EARTH, StoneType.WIND].includes(s.type)
)

// Point stones only
const POINT_STONE_CONFIGS = STONE_CONFIGS.filter(
  (s) => [StoneType.ONE, StoneType.THREE, StoneType.SIX].includes(s.type)
)

// ============================================
// STONE ITEM COMPONENT
// ============================================

interface StoneItemProps {
  config: StoneTypeConfig
  count: number
  compact: boolean
  onSelect?: () => void
  isSelected?: boolean
}

const StoneItem = memo(function StoneItem({
  config,
  count,
  compact,
  onSelect,
  isSelected = false,
}: StoneItemProps) {
  const hasStones = count > 0

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all',
          config.bgColor,
          config.borderColor,
          !hasStones && 'opacity-40'
        )}
        data-testid={`stone-${config.key}-compact`}
      >
        <span className="text-sm">{STONE_ICONS[config.type]}</span>
        <span className={cn('text-sm font-bold', config.color)}>{count}</span>
      </div>
    )
  }

  return (
    <button
      onClick={onSelect}
      disabled={!hasStones}
      className={cn(
        'relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200',
        config.bgColor,
        config.borderColor,
        hasStones && 'hover:scale-105 hover:shadow-lg cursor-pointer',
        !hasStones && 'opacity-40 cursor-not-allowed',
        isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
      )}
      style={{
        boxShadow: hasStones ? `0 0 15px ${config.glowColor}` : 'none',
      }}
      data-testid={`stone-${config.key}`}
    >
      {/* Icon */}
      <span className="text-2xl">{STONE_ICONS[config.type]}</span>

      {/* Count */}
      <span className={cn('text-xl font-bold', config.color)}>
        {count}
      </span>

      {/* Label */}
      <span className="text-xs text-slate-400">
        {config.labelTw}
      </span>

      {/* Value indicator */}
      {hasStones && config.value > 1 && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-xs text-slate-300 border border-slate-600">
          x{config.value}
        </span>
      )}
    </button>
  )
})

// ============================================
// TOTAL VALUE COMPONENT
// ============================================

interface TotalValueProps {
  totalValue: number
  stoneLimit?: number
}

const TotalValue = memo(function TotalValue({ totalValue, stoneLimit }: TotalValueProps) {
  const isNearLimit = stoneLimit && totalValue >= stoneLimit * 0.8
  const isAtLimit = stoneLimit && totalValue >= stoneLimit

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
        isAtLimit
          ? 'bg-red-900/30 border-red-500'
          : isNearLimit
          ? 'bg-amber-900/30 border-amber-500'
          : 'bg-vale-900/30 border-vale-500'
      )}
      data-testid="stone-total"
    >
      <span className="text-xs text-slate-400 mb-1">Total Value</span>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'text-3xl font-bold',
          isAtLimit
            ? 'text-red-400'
            : isNearLimit
            ? 'text-amber-400'
            : 'text-vale-400'
        )}>
          {totalValue}
        </span>
        {stoneLimit && (
          <span className="text-sm text-slate-500">
            / {stoneLimit}
          </span>
        )}
      </div>

      {/* Warning */}
      {isAtLimit && (
        <span className="text-xs text-red-400 mt-1">At Limit!</span>
      )}
    </div>
  )
})

// ============================================
// EXCHANGE MODAL COMPONENT
// ============================================

interface ExchangeModalProps {
  isOpen: boolean
  fromType: StoneType | null
  stones: StonePoolType
  onExchange: (toType: StoneType, amount: number) => void
  onClose: () => void
}

const ExchangeModal = memo(function ExchangeModal({
  isOpen,
  fromType,
  stones,
  onExchange,
  onClose,
}: ExchangeModalProps) {
  const [amount, setAmount] = useState(1)

  if (!isOpen || !fromType) return null

  const fromConfig = STONE_CONFIGS.find((s) => s.type === fromType)
  if (!fromConfig) return null

  const availableAmount = stones[fromConfig.key]
  const exchangeOptions = ELEMENT_STONE_CONFIGS.filter((s) => s.type !== fromType)

  const handleExchange = (toType: StoneType) => {
    onExchange(toType, amount)
    setAmount(1)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4 animate-scale-up">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">
          Exchange Stones
        </h3>

        {/* From Stone */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-slate-700/50">
          <span className="text-2xl">{STONE_ICONS[fromType]}</span>
          <div>
            <div className={cn('font-medium', fromConfig.color)}>
              {fromConfig.labelTw}
            </div>
            <div className="text-sm text-slate-400">
              Available: {availableAmount}
            </div>
          </div>
        </div>

        {/* Amount Selector */}
        <div className="mb-4">
          <label className="text-sm text-slate-400 mb-2 block">Amount</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAmount(Math.max(1, amount - 1))}
              disabled={amount <= 1}
              className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
            >
              -
            </button>
            <span className="flex-1 text-center text-xl font-bold">{amount}</span>
            <button
              onClick={() => setAmount(Math.min(availableAmount, amount + 1))}
              disabled={amount >= availableAmount}
              className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        {/* Exchange Options */}
        <div className="mb-4">
          <label className="text-sm text-slate-400 mb-2 block">Exchange To</label>
          <div className="grid grid-cols-3 gap-2">
            {exchangeOptions.map((config) => (
              <button
                key={config.type}
                onClick={() => handleExchange(config.type)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                  config.bgColor,
                  config.borderColor,
                  'hover:scale-105 hover:shadow-lg'
                )}
              >
                <span className="text-xl">{STONE_ICONS[config.type]}</span>
                <span className={cn('text-xs', config.color)}>{config.labelTw}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const StonePool = memo(function StonePool({
  stones,
  stoneLimit,
  showExchange = false,
  onExchange,
  compact = false,
  className,
}: StonePoolProps) {
  const [selectedStone, setSelectedStone] = useState<StoneType | null>(null)
  const [showExchangeModal, setShowExchangeModal] = useState(false)

  // Calculate total value
  const totalValue = useMemo(() => {
    if (!stones) return 0
    return calculateStonePoolValue(stones)
  }, [stones])

  // Handle stone selection for exchange
  const handleStoneSelect = useCallback((type: StoneType) => {
    if (showExchange && ELEMENT_STONE_CONFIGS.some((s) => s.type === type)) {
      setSelectedStone(type)
      setShowExchangeModal(true)
    }
  }, [showExchange])

  // Handle exchange
  const handleExchange = useCallback((toType: StoneType, amount: number) => {
    if (selectedStone && onExchange) {
      onExchange(selectedStone, toType, amount)
    }
  }, [selectedStone, onExchange])

  // Close exchange modal
  const closeExchangeModal = useCallback(() => {
    setShowExchangeModal(false)
    setSelectedStone(null)
  }, [])

  // Empty state
  if (!stones) {
    return (
      <section
        className={cn(
          'relative bg-slate-800/30 rounded-xl border border-slate-700 p-4',
          className
        )}
        data-testid="stone-pool"
      >
        <div className="flex items-center justify-center h-24 text-slate-500">
          <span>No stones available</span>
        </div>
      </section>
    )
  }

  // Compact mode
  if (compact) {
    return (
      <section
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700',
          className
        )}
        data-testid="stone-pool-compact"
      >
        {STONE_CONFIGS.map((config) => (
          <StoneItem
            key={config.type}
            config={config}
            count={stones[config.key]}
            compact={true}
          />
        ))}
        <div className="ml-2 px-2 py-1 rounded-lg bg-vale-900/50 border border-vale-500">
          <span className="text-vale-400 font-bold">{totalValue}</span>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'relative bg-gradient-to-b from-slate-800/50 to-slate-900/50',
        'rounded-2xl border border-slate-700 p-6',
        className
      )}
      data-testid="stone-pool"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200 font-game">
          Stone Pool
        </h3>
        {showExchange && (
          <span className="text-xs text-slate-500">
            Click element stones to exchange
          </span>
        )}
      </div>

      {/* Stone Grid */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Point Stones */}
        <div className="flex gap-3">
          {POINT_STONE_CONFIGS.map((config) => (
            <StoneItem
              key={config.type}
              config={config}
              count={stones[config.key]}
              compact={false}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-16 bg-slate-600" />

        {/* Element Stones */}
        <div className="flex gap-3">
          {ELEMENT_STONE_CONFIGS.map((config) => (
            <StoneItem
              key={config.type}
              config={config}
              count={stones[config.key]}
              compact={false}
              onSelect={() => handleStoneSelect(config.type)}
              isSelected={selectedStone === config.type}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-16 bg-slate-600" />

        {/* Total Value */}
        <TotalValue totalValue={totalValue} stoneLimit={stoneLimit} />
      </div>

      {/* Exchange Modal */}
      <ExchangeModal
        isOpen={showExchangeModal}
        fromType={selectedStone}
        stones={stones}
        onExchange={handleExchange}
        onClose={closeExchangeModal}
      />
    </section>
  )
})

export default StonePool
