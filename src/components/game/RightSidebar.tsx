/**
 * RightSidebar Component
 * Right sidebar for multiplayer game - displays bank coins and player coins
 * @version 1.5.0 - Removed discard pile (moved to left sidebar)
 */
console.log('[components/game/RightSidebar.tsx] v1.5.0 loaded')

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import type { StonePool } from '@/types/game'
import { calculateStonePoolValue } from '@/types/game'  // Used for MyCoinsSection
import { StoneType } from '@/types/cards'

// ============================================
// TYPES
// ============================================

export interface RightSidebarProps {
  /** Bank's coin pool (optional - bank is infinite) */
  bankCoins?: StonePool
  /** Current player's coin pool */
  playerCoins: StonePool
  /** Current player's name */
  playerName: string
  /** Whether it's the current player's turn */
  isYourTurn: boolean
  /** Current game phase */
  phase?: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  /** Callback when taking a coin from bank */
  onTakeCoin?: (coinType: StoneType) => void
  /** Callback when returning a coin to bank */
  onReturnCoin?: (coinType: StoneType) => void
  /** Callback when confirming card selection (hunting phase) */
  onConfirmSelection?: () => void
  /** Callback when ending turn (action phase) */
  onEndTurn?: () => void
  /** Additional CSS classes */
  className?: string
}

// ============================================
// COIN CONFIG
// ============================================

interface CoinConfig {
  type: StoneType
  value: number
  image: string
  label: string
  color: string
}

const VALUE_COINS: CoinConfig[] = [
  {
    type: StoneType.ONE,
    value: 1,
    image: '/the-vale-of-eternity/assets/stones/stone-1.png',
    label: '1元',
    color: 'amber',
  },
  {
    type: StoneType.THREE,
    value: 3,
    image: '/the-vale-of-eternity/assets/stones/stone-3.png',
    label: '3元',
    color: 'amber',
  },
  {
    type: StoneType.SIX,
    value: 6,
    image: '/the-vale-of-eternity/assets/stones/stone-6.png',
    label: '6元',
    color: 'amber',
  },
]

// ============================================
// COIN DISPLAY COMPONENT
// ============================================

interface CoinDisplayProps {
  config: CoinConfig
  count: number
  interactive?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
  /** Whether this is a bank coin (always available, shows infinity symbol) */
  isBank?: boolean
}

const CoinDisplay = memo(function CoinDisplay({
  config,
  count,
  interactive = false,
  onClick,
  size = 'md',
  isBank = false,
}: CoinDisplayProps) {
  // Bank coins are never empty
  const isEmpty = !isBank && count === 0

  return (
    <button
      type="button"
      onClick={interactive && !isEmpty ? onClick : undefined}
      disabled={!interactive || isEmpty}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg transition-all duration-200',
        size === 'md' ? 'p-2' : 'p-1.5',
        interactive && !isEmpty
          ? 'hover:scale-105 hover:bg-slate-700/50 cursor-pointer'
          : 'cursor-default',
        isEmpty && 'opacity-30'
      )}
      title={interactive ? `取得 ${config.label}` : config.label}
    >
      {/* Coin Image */}
      <div className={cn('relative mb-1', size === 'md' ? 'w-12 h-12' : 'w-8 h-8')}>
        <img
          src={config.image}
          alt={config.label}
          className="w-full h-full object-contain drop-shadow-md"
        />
      </div>

      {/* Count Badge - don't show for bank */}
      {!isBank && (
        <div
          className={cn(
            'font-bold rounded-full',
            size === 'md' ? 'text-sm px-2 py-0.5' : 'text-xs px-1.5 py-0.5',
            'bg-slate-800/80 border border-slate-600'
          )}
        >
          <span className="text-amber-400">x{count}</span>
        </div>
      )}

      {/* Interactive Indicator */}
      {interactive && !isEmpty && (
        <div className="absolute inset-0 rounded-lg border-2 border-transparent hover:border-amber-500/50 transition-colors" />
      )}
    </button>
  )
})

// ============================================
// MY COINS SECTION
// ============================================

interface MyCoinsSectionProps {
  coins: StonePool
  isYourTurn: boolean
  onReturnCoin?: (coinType: StoneType) => void
}

const MyCoinsSection = memo(function MyCoinsSection({
  coins,
  isYourTurn,
  onReturnCoin,
}: MyCoinsSectionProps) {
  const totalValue = calculateStonePoolValue(coins)

  return (
    <GlassCard variant="gold" glow={isYourTurn ? 'gold' : 'none'} padding="sm">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-amber-300">
            我的錢幣
          </h4>
          <span className="text-2xl font-bold text-amber-400">
            {totalValue}
          </span>
        </div>

        {/* Coin List - Vertical */}
        <div className="space-y-2">
          {VALUE_COINS.map((config) => {
            const count = coins[config.type] || 0
            const isInteractive = isYourTurn && count > 0

            return (
              <button
                key={config.type}
                type="button"
                onClick={isInteractive ? () => onReturnCoin?.(config.type) : undefined}
                disabled={!isInteractive}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200',
                  'border-2 bg-slate-800/60',
                  isInteractive
                    ? 'border-amber-500/50 hover:border-amber-500 hover:bg-amber-900/20 cursor-pointer hover:scale-[1.02]'
                    : 'border-slate-600/30 opacity-60 cursor-default'
                )}
                title={isInteractive ? `點擊歸還 ${config.label}` : config.label}
              >
                {/* Left: Coin Image */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <img
                      src={config.image}
                      alt={config.label}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                  <span className="text-lg font-bold text-amber-300">
                    {config.value} 元
                  </span>
                </div>

                {/* Right: Count */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">×</span>
                  <span className="text-2xl font-bold text-amber-400 min-w-[3rem] text-right">
                    {count}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Return Hint */}
        {isYourTurn && totalValue > 0 && (
          <p className="text-xs text-amber-400/60 text-center pt-1">
            點擊錢幣歸還銀行
          </p>
        )}
      </div>
    </GlassCard>
  )
})

// ============================================
// BANK SECTION
// ============================================

interface BankSectionProps {
  isYourTurn: boolean
  onTakeCoin?: (coinType: StoneType) => void
}

const BankSection = memo(function BankSection({
  isYourTurn,
  onTakeCoin,
}: BankSectionProps) {
  return (
    <GlassCard variant="blue" glow="none" padding="sm">
      <div className="space-y-3">
        {/* Header */}
        <h4 className="text-base font-bold text-blue-300 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>銀行</span>
        </h4>

        {/* Coin List - Vertical */}
        <div className="space-y-2">
          {VALUE_COINS.map((config) => (
            <button
              key={config.type}
              type="button"
              onClick={isYourTurn ? () => onTakeCoin?.(config.type) : undefined}
              disabled={!isYourTurn}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
                'border-2 bg-slate-800/60',
                isYourTurn
                  ? 'border-blue-500/50 hover:border-blue-500 hover:bg-blue-900/20 cursor-pointer hover:scale-[1.02]'
                  : 'border-slate-600/30 opacity-60 cursor-default'
              )}
              title={isYourTurn ? `從銀行取得 ${config.label}` : config.label}
            >
              {/* Coin Image */}
              <div className="relative w-14 h-14 flex-shrink-0">
                <img
                  src={config.image}
                  alt={config.label}
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
              <span className="text-lg font-bold text-blue-300">
                {config.value} 元
              </span>
            </button>
          ))}
        </div>

        {/* Take Hint */}
        {isYourTurn ? (
          <p className="text-xs text-blue-400/60 text-center pt-1">
            點擊錢幣從銀行取得
          </p>
        ) : (
          <p className="text-xs text-slate-500 text-center pt-1">
            等待你的回合...
          </p>
        )}
      </div>
    </GlassCard>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const RightSidebar = memo(function RightSidebar({
  bankCoins: _bankCoins,
  playerCoins,
  playerName: _playerName,
  isYourTurn,
  phase,
  onTakeCoin,
  onReturnCoin,
  onConfirmSelection,
  onEndTurn,
  className,
}: RightSidebarProps) {
  void _playerName // Reserved for future use
  void _bankCoins // Bank is infinite, no need to track

  // Show confirm selection button only during HUNTING phase and player's turn
  const showConfirmSelection = isYourTurn && phase === 'HUNTING' && onConfirmSelection

  // Show end turn button during ACTION or RESOLUTION phase and player's turn
  const showEndTurn = isYourTurn && (phase === 'ACTION' || phase === 'RESOLUTION') && onEndTurn
  return (
    <aside
      className={cn(
        // Fixed width sidebar - increased from w-72 to w-80
        'w-80 flex-shrink-0',
        // Background with gradient
        'bg-gradient-to-b from-amber-900/10 via-slate-900/40 to-slate-900/20',
        // Glass effect
        'backdrop-blur-sm',
        // Border
        'border-l border-amber-500/20',
        // Layout
        'flex flex-col overflow-hidden',
        className
      )}
      data-testid="right-sidebar"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-amber-500/20 flex-shrink-0">
        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center gap-2">
          <span>銀行 & 資源</span>
        </h3>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* My Coins */}
        <MyCoinsSection
          coins={playerCoins}
          isYourTurn={isYourTurn}
          onReturnCoin={onReturnCoin}
        />

        {/* Divider */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
        </div>

        {/* Bank - Infinite supply */}
        <BankSection
          isYourTurn={isYourTurn}
          onTakeCoin={onTakeCoin}
        />

        {/* Confirm Selection Button - Only show during HUNTING phase */}
        {showConfirmSelection && (
          <button
            type="button"
            onClick={onConfirmSelection}
            className={cn(
              'w-full aspect-square',
              'bg-gradient-to-br from-emerald-600 to-emerald-700',
              'hover:from-emerald-500 hover:to-emerald-600',
              'active:from-emerald-700 active:to-emerald-800',
              'text-white font-bold text-2xl',
              'rounded-xl border-2 border-emerald-400/50',
              'shadow-lg shadow-emerald-900/50',
              'transition-all duration-200',
              'flex items-center justify-center',
              'hover:scale-105 active:scale-95',
              'animate-pulse'
            )}
          >
            確認選擇
          </button>
        )}

        {/* End Turn Button - Only show during ACTION or RESOLUTION phase */}
        {showEndTurn && (
          <button
            type="button"
            onClick={onEndTurn}
            className={cn(
              'w-full aspect-square',
              'bg-gradient-to-br from-red-600 to-red-700',
              'hover:from-red-500 hover:to-red-600',
              'active:from-red-700 active:to-red-800',
              'text-white font-bold text-2xl',
              'rounded-xl border-2 border-red-400/50',
              'shadow-lg shadow-red-900/50',
              'transition-all duration-200',
              'flex items-center justify-center',
              'hover:scale-105 active:scale-95'
            )}
          >
            回合結束
          </button>
        )}
      </div>

      {/* Footer - Turn Status */}
      <div className="px-4 py-2 border-t border-amber-500/20 flex-shrink-0 bg-slate-900/50">
        <div className="text-center">
          {isYourTurn ? (
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 animate-pulse">
              輪到你了！
            </span>
          ) : (
            <span className="text-xs px-3 py-1 rounded-full bg-slate-500/20 text-slate-400">
              等待其他玩家...
            </span>
          )}
        </div>
      </div>
    </aside>
  )
})

export default RightSidebar
