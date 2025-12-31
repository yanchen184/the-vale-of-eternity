/**
 * BankArea Component
 * Displays the bank's coin pool and allows players to take/return coins
 * @version 1.1.0 - Using coin images, only 1/3/6 coins
 */
console.log('[components/game/BankArea.tsx] v1.1.0 loaded')

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
  value: number
  image: string
  displayName: string
}

const COIN_CONFIGS: CoinConfig[] = [
  {
    type: StoneType.ONE,
    value: 1,
    image: '/the-vale-of-eternity/assets/stones/stone-1.png',
    displayName: '1 元錢幣',
  },
  {
    type: StoneType.THREE,
    value: 3,
    image: '/the-vale-of-eternity/assets/stones/stone-3.png',
    displayName: '3 元錢幣',
  },
  {
    type: StoneType.SIX,
    value: 6,
    image: '/the-vale-of-eternity/assets/stones/stone-6.png',
    displayName: '6 元錢幣',
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
      <div className="grid grid-cols-3 gap-6">
        {COIN_CONFIGS.map((config) => {
          return (
            <button
              key={config.type}
              type="button"
              disabled={!allowInteraction}
              onClick={() => allowInteraction && onTakeCoin?.(config.type)}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-xl',
                'border-2 border-slate-600 bg-slate-700/50',
                'transition-all duration-200',
                allowInteraction
                  ? 'hover:scale-105 hover:shadow-lg hover:border-amber-500 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              )}
              data-testid={`bank-coin-${config.type}`}
              title={config.displayName}
            >
              {/* Coin Image */}
              <div className="relative w-24 h-24 mb-3">
                <img
                  src={config.image}
                  alt={config.displayName}
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>

              {/* Coin Value Label */}
              <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-600">
                <span className="text-lg font-bold text-amber-400">{config.value} 元</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
})

export default BankArea
