/**
 * PlayerCoinArea Component
 * Displays the player's coin pool and allows returning coins to the bank
 * @version 1.0.0
 */
console.log('[components/game/PlayerCoinArea.tsx] v1.0.0 loaded')

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
      <div className="grid grid-cols-7 gap-3">
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
                'flex flex-col items-center justify-center p-3 rounded-lg',
                'border-2 transition-all duration-200',
                config.bgColor,
                config.borderColor,
                count > 0 ? 'opacity-100' : 'opacity-30',
                canReturn
                  ? 'hover:scale-105 hover:shadow-lg cursor-pointer'
                  : 'cursor-default'
              )}
              data-testid={`player-coin-${config.type}`}
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
