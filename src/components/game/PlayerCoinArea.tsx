/**
 * PlayerCoinArea Component
 * Displays the player's coin pool and allows returning coins to the bank
 * @version 1.1.0 - Using coin images, only 1/3/6 coins
 */
console.log('[components/game/PlayerCoinArea.tsx] v1.1.0 loaded')

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { StonePool } from '@/types/game'
import { StoneType } from '@/types/cards'
import { calculateStonePoolValue } from '@/types/game'

// ============================================
// TYPES
// ============================================

export interface PlayerCoinAreaProps {
  /** Player's coin pool */
  playerCoins: StonePool
  /** Player name */
  playerName?: string
  /** Whether the player can interact (return coins) */
  allowInteraction?: boolean
  /** Callback when a coin type is clicked to return to bank */
  onReturnCoin?: (coinType: StoneType) => void
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

export const PlayerCoinArea = memo(function PlayerCoinArea({
  playerCoins,
  playerName,
  allowInteraction = false,
  onReturnCoin,
  className = '',
}: PlayerCoinAreaProps) {
  const totalValue = calculateStonePoolValue(playerCoins)

  return (
    <div
      className={cn(
        'bg-slate-800/50 rounded-xl border border-slate-700 p-6',
        className
      )}
      data-testid="player-coin-area"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-vale-600/20 border-2 border-vale-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-vale-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">
              {playerName ? `${playerName} 的錢幣` : '我的錢幣'}
            </h3>
            <p className="text-xs text-slate-500">
              {allowInteraction ? '點擊錢幣來放回銀行' : '你的錢幣池'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">總價值</div>
          <div className="text-2xl font-bold text-vale-400">{totalValue}</div>
        </div>
      </div>

      {/* Coin Grid */}
      <div className="grid grid-cols-3 gap-6">
        {COIN_CONFIGS.map((config) => {
          const count = playerCoins[config.type] || 0
          const canReturn = allowInteraction && count > 0

          return (
            <button
              key={config.type}
              type="button"
              disabled={!canReturn}
              onClick={() => canReturn && onReturnCoin?.(config.type)}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-xl',
                'border-2 border-slate-600 bg-slate-700/50',
                'transition-all duration-200',
                count > 0 ? 'opacity-100' : 'opacity-30',
                canReturn
                  ? 'hover:scale-105 hover:shadow-lg hover:border-vale-500 cursor-pointer'
                  : 'cursor-default'
              )}
              data-testid={`player-coin-${config.type}`}
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

              {/* Coin Count Badge */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-600">
                <span className="text-sm text-slate-400">數量:</span>
                <span className="text-xl font-bold text-vale-400">{count}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Quick Actions (if interactive) */}
      {allowInteraction && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-200 transition-colors"
              onClick={() => {
                // Return all coins
                COIN_CONFIGS.forEach(config => {
                  const count = playerCoins[config.type] || 0
                  for (let i = 0; i < count; i++) {
                    onReturnCoin?.(config.type)
                  }
                })
              }}
              disabled={totalValue === 0}
            >
              全部放回
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export default PlayerCoinArea
