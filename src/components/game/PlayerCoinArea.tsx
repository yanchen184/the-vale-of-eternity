/**
 * PlayerCoinArea Component
 * Displays the player's coin pool as a 6-slot grid system
 * @version 2.0.0 - Refactored to 6-slot grid with flying animation support
 */
console.log('[components/game/PlayerCoinArea.tsx] v2.0.0 loaded')

import { memo, useMemo, useCallback, useRef } from 'react'
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
  /** Callback when a coin slot is clicked to return to bank */
  onReturnCoin?: (coinType: StoneType, slotElement: HTMLElement | null) => void
  /** Additional CSS classes */
  className?: string
  /** Ref for the bank area (for animation target) */
  bankAreaRef?: React.RefObject<HTMLElement>
}

// ============================================
// CONSTANTS
// ============================================

const MAX_SLOTS = 6

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

/**
 * Represents a single slot in the coin area
 */
interface CoinSlot {
  index: number
  stoneType: StoneType | null
  config: CoinConfig | null
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert player coins to slot representation
 * Priority: SIX > THREE > ONE (higher value first)
 */
function createCoinSlots(playerCoins: StonePool): CoinSlot[] {
  const slots: CoinSlot[] = []

  // Add coins in order: SIX, THREE, ONE (higher value first for visual clarity)
  const coinOrder: StoneType[] = [StoneType.SIX, StoneType.THREE, StoneType.ONE]

  for (const stoneType of coinOrder) {
    const config = COIN_CONFIGS.find((c) => c.type === stoneType)
    const count = playerCoins[stoneType] || 0

    for (let i = 0; i < count; i++) {
      if (slots.length < MAX_SLOTS) {
        slots.push({
          index: slots.length,
          stoneType,
          config: config || null,
        })
      }
    }
  }

  // Fill remaining slots with empty
  while (slots.length < MAX_SLOTS) {
    slots.push({
      index: slots.length,
      stoneType: null,
      config: null,
    })
  }

  return slots
}

// ============================================
// SUBCOMPONENTS
// ============================================

interface CoinSlotItemProps {
  slot: CoinSlot
  allowInteraction: boolean
  onSlotClick: (slot: CoinSlot, element: HTMLElement | null) => void
}

const CoinSlotItem = memo(function CoinSlotItem({
  slot,
  allowInteraction,
  onSlotClick,
}: CoinSlotItemProps) {
  const slotRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback(() => {
    if (slot.stoneType && allowInteraction) {
      onSlotClick(slot, slotRef.current)
    }
  }, [slot, allowInteraction, onSlotClick])

  const isEmpty = slot.stoneType === null
  const canInteract = !isEmpty && allowInteraction

  return (
    <button
      ref={slotRef}
      type="button"
      onClick={handleClick}
      disabled={!canInteract}
      className={cn(
        'relative w-full aspect-square rounded-xl border-2 transition-all duration-200',
        'flex items-center justify-center',
        isEmpty
          ? 'border-dashed border-slate-600/50 bg-slate-800/20'
          : 'border-solid border-amber-500/40 bg-slate-700/60',
        canInteract && [
          'cursor-pointer',
          'hover:border-red-500/70 hover:bg-red-900/30',
          'hover:scale-105 hover:shadow-lg hover:shadow-red-500/20',
          'active:scale-95',
        ],
        !canInteract && !isEmpty && 'cursor-default',
        isEmpty && 'cursor-default'
      )}
      data-testid={`coin-slot-${slot.index}`}
      title={
        canInteract
          ? `點擊歸還 ${slot.config?.displayName}`
          : isEmpty
          ? '空格子'
          : slot.config?.displayName
      }
    >
      {/* Empty slot indicator */}
      {isEmpty && (
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-600/30 flex items-center justify-center">
          <span className="text-slate-600/40 text-lg">+</span>
        </div>
      )}

      {/* Coin display */}
      {!isEmpty && slot.config && (
        <>
          <img
            src={slot.config.image}
            alt={slot.config.displayName}
            className="w-14 h-14 object-contain drop-shadow-md transition-transform"
          />

          {/* Value badge */}
          <div
            className={cn(
              'absolute -bottom-1 -right-1 w-6 h-6 rounded-full',
              'flex items-center justify-center text-xs font-bold',
              'bg-amber-500 text-slate-900 shadow-md'
            )}
          >
            {slot.config.value}
          </div>

          {/* Return hint (when interactive) */}
          {canInteract && (
            <div
              className={cn(
                'absolute inset-0 rounded-xl flex items-center justify-center',
                'bg-red-900/0 hover:bg-red-900/40 transition-colors',
                'opacity-0 hover:opacity-100'
              )}
            >
              <span className="text-red-300 text-xs font-semibold">歸還</span>
            </div>
          )}
        </>
      )}
    </button>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const PlayerCoinArea = memo(function PlayerCoinArea({
  playerCoins,
  playerName,
  allowInteraction = false,
  onReturnCoin,
  className = '',
}: PlayerCoinAreaProps) {
  const totalValue = calculateStonePoolValue(playerCoins)
  const coinSlots = useMemo(() => createCoinSlots(playerCoins), [playerCoins])

  // Count filled slots
  const filledSlots = coinSlots.filter((s) => s.stoneType !== null).length

  const handleSlotClick = useCallback(
    (slot: CoinSlot, element: HTMLElement | null) => {
      if (slot.stoneType && onReturnCoin) {
        onReturnCoin(slot.stoneType, element)
      }
    },
    [onReturnCoin]
  )

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
          <div className="text-xs text-slate-500 mt-1">
            {filledSlots}/{MAX_SLOTS} 格
          </div>
        </div>
      </div>

      {/* 6-Slot Grid */}
      <div className="grid grid-cols-6 gap-3">
        {coinSlots.map((slot) => (
          <CoinSlotItem
            key={slot.index}
            slot={slot}
            allowInteraction={allowInteraction}
            onSlotClick={handleSlotClick}
          />
        ))}
      </div>

      {/* Slot limit warning */}
      {filledSlots >= MAX_SLOTS && (
        <div className="mt-3 px-3 py-2 bg-amber-900/30 border border-amber-500/30 rounded-lg">
          <p className="text-xs text-amber-400 text-center">
            錢幣已達上限！請先歸還錢幣再拿取新的
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="flex items-center justify-center gap-4">
          {COIN_CONFIGS.map((config) => {
            const count = playerCoins[config.type] || 0
            return (
              <div
                key={config.type}
                className={cn(
                  'flex items-center gap-1.5',
                  count > 0 ? 'opacity-100' : 'opacity-40'
                )}
              >
                <img
                  src={config.image}
                  alt={config.displayName}
                  className="w-6 h-6 object-contain"
                />
                <span className="text-xs text-slate-400">
                  x{count}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default PlayerCoinArea
