/**
 * RightSidebar Component
 * Right sidebar for multiplayer game - displays bank coins, player coins, and deck info
 * @version 1.1.0 - Bank shows infinite coins, improved UI
 */
console.log('[components/game/RightSidebar.tsx] v1.1.0 loaded')

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import type { StonePool } from '@/types/game'
import { calculateStonePoolValue } from '@/types/game'
import { StoneType } from '@/types/cards'

// ============================================
// TYPES
// ============================================

export interface RightSidebarProps {
  /** Bank's coin pool */
  bankCoins: StonePool
  /** Current player's coin pool */
  playerCoins: StonePool
  /** Current player's name */
  playerName: string
  /** Number of cards in discard pile */
  discardCount: number
  /** Number of cards remaining in deck */
  deckCount: number
  /** Whether it's the current player's turn */
  isYourTurn: boolean
  /** Callback when taking a coin from bank */
  onTakeCoin?: (coinType: StoneType) => void
  /** Callback when returning a coin to bank */
  onReturnCoin?: (coinType: StoneType) => void
  /** Callback when clicking discard pile */
  onDiscardClick?: () => void
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
}

const CoinDisplay = memo(function CoinDisplay({
  config,
  count,
  interactive = false,
  onClick,
  size = 'md',
}: CoinDisplayProps) {
  const isEmpty = count === 0

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

      {/* Count Badge */}
      <div
        className={cn(
          'font-bold rounded-full',
          size === 'md' ? 'text-sm px-2 py-0.5' : 'text-xs px-1.5 py-0.5',
          'bg-slate-800/80 border border-slate-600'
        )}
      >
        <span className="text-amber-400">x{count}</span>
      </div>

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
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
            <span>我的錢幣</span>
          </h4>
          <span className="text-xl font-bold text-amber-400">
            {totalValue}
          </span>
        </div>

        {/* Coin Grid */}
        <div className="grid grid-cols-3 gap-1">
          {VALUE_COINS.map((config) => (
            <CoinDisplay
              key={config.type}
              config={config}
              count={coins[config.type] || 0}
              interactive={isYourTurn && (coins[config.type] || 0) > 0}
              onClick={() => onReturnCoin?.(config.type)}
              size="sm"
            />
          ))}
        </div>

        {/* Return Hint */}
        {isYourTurn && totalValue > 0 && (
          <p className="text-[10px] text-amber-400/60 text-center">
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
  coins: StonePool
  isYourTurn: boolean
  onTakeCoin?: (coinType: StoneType) => void
}

const BankSection = memo(function BankSection({
  coins,
  isYourTurn,
  onTakeCoin,
}: BankSectionProps) {
  return (
    <GlassCard variant="blue" glow="none" padding="sm">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-blue-300 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>銀行</span>
          </h4>
        </div>

        {/* Coin Grid */}
        <div className="grid grid-cols-3 gap-1">
          {VALUE_COINS.map((config) => (
            <CoinDisplay
              key={config.type}
              config={config}
              count={coins[config.type] || 0}
              interactive={isYourTurn && (coins[config.type] || 0) > 0}
              onClick={() => onTakeCoin?.(config.type)}
              size="sm"
            />
          ))}
        </div>

        {/* Take Hint */}
        {isYourTurn && (
          <p className="text-[10px] text-blue-400/60 text-center">
            點擊錢幣從銀行取得
          </p>
        )}

        {!isYourTurn && (
          <p className="text-[10px] text-slate-500 text-center">
            等待你的回合...
          </p>
        )}
      </div>
    </GlassCard>
  )
})

// ============================================
// DECK INFO SECTION
// ============================================

interface DeckInfoSectionProps {
  deckCount: number
  discardCount: number
  onDiscardClick?: () => void
}

const DeckInfoSection = memo(function DeckInfoSection({
  deckCount,
  discardCount,
  onDiscardClick,
}: DeckInfoSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Deck */}
      <GlassCard variant="default" padding="sm" className="text-center">
        <div className="space-y-1">
          <div className="w-10 h-14 mx-auto bg-gradient-to-br from-blue-900 to-blue-950 rounded border-2 border-blue-700 flex items-center justify-center shadow-lg">
            <span className="text-blue-300 text-lg font-bold">{deckCount}</span>
          </div>
          <div className="text-[10px] text-slate-400">牌庫</div>
        </div>
      </GlassCard>

      {/* Discard Pile */}
      <GlassCard
        variant="default"
        padding="sm"
        className="text-center cursor-pointer hover:bg-white/10 transition-colors"
        onClick={onDiscardClick}
        hoverable
      >
        <div className="space-y-1">
          <div className="w-10 h-14 mx-auto bg-gradient-to-br from-slate-700 to-slate-800 rounded border-2 border-slate-600 flex items-center justify-center shadow-lg relative">
            <span className="text-slate-300 text-lg font-bold">{discardCount}</span>
            {discardCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="text-[10px] text-slate-400">棄牌堆</div>
        </div>
      </GlassCard>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const RightSidebar = memo(function RightSidebar({
  bankCoins,
  playerCoins,
  playerName: _playerName,
  discardCount,
  deckCount,
  isYourTurn,
  onTakeCoin,
  onReturnCoin,
  onDiscardClick,
  className,
}: RightSidebarProps) {
  void _playerName // Reserved for future use
  return (
    <aside
      className={cn(
        // Fixed width sidebar
        'w-72 flex-shrink-0',
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

        {/* Bank */}
        <BankSection
          coins={bankCoins}
          isYourTurn={isYourTurn}
          onTakeCoin={onTakeCoin}
        />

        {/* Divider */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
        </div>

        {/* Deck Info */}
        <DeckInfoSection
          deckCount={deckCount}
          discardCount={discardCount}
          onDiscardClick={onDiscardClick}
        />
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
