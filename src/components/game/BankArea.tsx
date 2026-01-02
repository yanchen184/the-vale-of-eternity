/**
 * BankArea Component
 * Displays the bank's coin pool and allows players to take coins
 * @version 3.0.0 - Simplified compact design for sidebar
 */
console.log('[components/game/BankArea.tsx] v3.0.0 loaded')

import { memo, useRef, forwardRef } from 'react'
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
  onTakeCoin?: (coinType: StoneType, coinElement: HTMLElement | null) => void
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
// SUBCOMPONENTS - Simplified Coin Icon
// ============================================

interface SimpleCoinIconProps {
  config: CoinConfig
  allowInteraction: boolean
  onTakeCoin: (coinType: StoneType, element: HTMLElement | null) => void
}

const SimpleCoinIcon = memo(function SimpleCoinIcon({
  config,
  allowInteraction,
  onTakeCoin,
}: SimpleCoinIconProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={!allowInteraction}
      onClick={() => allowInteraction && onTakeCoin(config.type, buttonRef.current)}
      className={cn(
        'aspect-square p-2 rounded-lg border flex items-center justify-center',
        'transition-all duration-200',
        allowInteraction
          ? 'border-amber-500/40 bg-slate-700/50 cursor-pointer hover:bg-amber-900/30 hover:scale-105 active:scale-95'
          : 'border-slate-600/30 bg-slate-800/20 cursor-not-allowed opacity-50'
      )}
      data-testid={`bank-coin-${config.type}`}
      title={`${config.value} 元`}
    >
      <img
        src={config.image}
        alt={`${config.value} 元`}
        className="w-full h-full object-contain drop-shadow pointer-events-none"
      />
    </button>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const BankArea = memo(
  forwardRef<HTMLDivElement, BankAreaProps>(function BankArea(
    { bankCoins: _bankCoins, allowInteraction = false, onTakeCoin, className = '' },
    ref
  ) {
    void _bankCoins // Bank has infinite coins, no need to track count

    const handleTakeCoin = (coinType: StoneType, element: HTMLElement | null) => {
      onTakeCoin?.(coinType, element)
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-slate-800/40 rounded-lg border border-slate-700/50 p-3',
          className
        )}
        data-testid="bank-area"
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-amber-400">銀行</h3>
          <span className="text-xs text-slate-400">
            {allowInteraction ? '可拿取' : '鎖定'}
          </span>
        </div>

        {/* Compact Coin Grid - 3 icons only */}
        <div className="grid grid-cols-3 gap-2">
          {COIN_CONFIGS.map((config) => (
            <SimpleCoinIcon
              key={config.type}
              config={config}
              allowInteraction={allowInteraction}
              onTakeCoin={handleTakeCoin}
            />
          ))}
        </div>
      </div>
    )
  })
)

export default BankArea
