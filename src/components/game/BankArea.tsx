/**
 * BankArea Component
 * Displays the bank's coin pool and allows players to take/return coins
 * @version 1.0.0
 */
console.log('[components/game/BankArea.tsx] v1.0.0 loaded')

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { StonePool } from '@/types/game'
import { StoneType } from '@/types/cards'

// ============================================
// TYPES
// ============================================

export interface BankAreaProps {
  /** Bank's coin pool */
  bankCoins: StonePool
  /** Whether the current player can interact with the bank */
  allowInteraction?: boolean
  /** Callback when a coin type is clicked to take from bank */
  onTakeCoin?: (coinType: StoneType) => void
  /** Additional CSS classes */
  className?: string
}

// ============================================
// STONE/COIN CONFIGURATION
// ============================================

interface CoinConfig {
  type: StoneType
  label: string
  value: number
  bgColor: string
  borderColor: string
  textColor: string
}

const COIN_CONFIGS: CoinConfig[] = [
  {
    type: StoneType.ONE,
    label: '1',
    value: 1,
    bgColor: 'bg-amber-600',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-100',
  },
  {
    type: StoneType.THREE,
    label: '3',
    value: 3,
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-50',
  },
  {
    type: StoneType.SIX,
    label: '6',
    value: 6,
    bgColor: 'bg-amber-400',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-900',
  },
  {
    type: StoneType.FIRE,
    label: '火',
    value: 1,
    bgColor: 'bg-red-600',
    borderColor: 'border-red-500',
    textColor: 'text-red-100',
  },
  {
    type: StoneType.WATER,
    label: '水',
    value: 1,
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-100',
  },
  {
    type: StoneType.EARTH,
    label: '土',
    value: 1,
    bgColor: 'bg-yellow-700',
    borderColor: 'border-yellow-600',
    textColor: 'text-yellow-100',
  },
  {
    type: StoneType.WIND,
    label: '風',
    value: 1,
    bgColor: 'bg-teal-600',
    borderColor: 'border-teal-500',
    textColor: 'text-teal-100',
  },
]

// ============================================
// COMPONENT
// ============================================

export const BankArea = memo(function BankArea({
  bankCoins,
  allowInteraction = false,
  onTakeCoin,
  className = '',
}: BankAreaProps) {
  return (
    <div
      className={cn(
        'bg-slate-800/50 rounded-xl border border-slate-700 p-6',
        className
      )}
      data-testid="bank-area"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-600/20 border-2 border-amber-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">銀行</h3>
            <p className="text-xs text-slate-500">
              {allowInteraction ? '點擊錢幣來拿取' : '銀行錢幣池'}
            </p>
          </div>
        </div>
      </div>

      {/* Coin Grid */}
      <div className="grid grid-cols-7 gap-3">
        {COIN_CONFIGS.map((config) => {
          const count = bankCoins[config.type] || 0
          const canTake = allowInteraction && count > 0

          return (
            <button
              key={config.type}
              type="button"
              disabled={!canTake}
              onClick={() => canTake && onTakeCoin?.(config.type)}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-lg',
                'border-2 transition-all duration-200',
                config.bgColor,
                config.borderColor,
                canTake
                  ? 'hover:scale-105 hover:shadow-lg cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              )}
              data-testid={`bank-coin-${config.type}`}
              title={`${config.label} (價值 ${config.value})`}
            >
              {/* Coin Label */}
              <div className={cn(
                'text-xl font-bold mb-1',
                config.textColor
              )}>
                {config.label}
              </div>

              {/* Coin Count */}
              <div className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                'bg-black/20',
                config.textColor
              )}>
                ×{count}
              </div>

              {/* Value indicator for numbered coins */}
              {config.value > 1 && (
                <div className="text-[10px] text-white/70 mt-1">
                  值 {config.value}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Total Value Display */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">銀行總價值</span>
          <span className="text-amber-400 font-bold text-lg">
            {Object.entries(bankCoins).reduce((total, [type, count]) => {
              const config = COIN_CONFIGS.find(c => c.type === type)
              return total + (config?.value || 0) * count
            }, 0)}
          </span>
        </div>
      </div>
    </div>
  )
})

export default BankArea
