/**
 * PlayerCoinAreaCompact Component
 * Compact version of PlayerCoinArea for displaying other players' coins
 * @version 1.0.0
 */
console.log('[components/game/PlayerCoinAreaCompact.tsx] v1.0.0 loaded')

import { memo, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'
import type { StonePool } from '@/types/game'
import { StoneType } from '@/types/cards'
import { calculateStonePoolValue } from '@/types/game'
import { PlayerMarker } from './PlayerMarker'
import type { PlayerColor } from '@/types/player-color'

// ============================================
// TYPES
// ============================================

export interface PlayerCoinAreaCompactProps {
  /** Player ID */
  playerId: string
  /** Player name */
  playerName: string
  /** Player color */
  playerColor: PlayerColor
  /** Player's coin pool */
  playerCoins: StonePool
  /** Whether this is the current player's area (highlight) */
  isCurrentPlayer?: boolean
  /** Whether it's this player's turn */
  isPlayerTurn?: boolean
  /** Callback when returning a coin to bank */
  onReturnCoin?: (coinType: StoneType, slotElement: HTMLElement) => void
  /** Additional CSS classes */
  className?: string
}

export interface PlayerCoinAreaCompactRef {
  /** Get coin slot element by type for animation targeting */
  getCoinSlotElement: (coinType: StoneType) => HTMLElement | null
  /** Get the container element */
  getContainerElement: () => HTMLElement | null
}

// ============================================
// CONSTANTS
// ============================================

const MAX_SLOTS = 6

interface CoinConfig {
  type: StoneType
  value: number
  image: string
}

const COIN_CONFIGS: CoinConfig[] = [
  {
    type: StoneType.ONE,
    value: 1,
    image: '/the-vale-of-eternity/assets/stones/stone-1.png',
  },
  {
    type: StoneType.THREE,
    value: 3,
    image: '/the-vale-of-eternity/assets/stones/stone-3.png',
  },
  {
    type: StoneType.SIX,
    value: 6,
    image: '/the-vale-of-eternity/assets/stones/stone-6.png',
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

interface CoinSlot {
  index: number
  stoneType: StoneType | null
  config: CoinConfig | null
}

function createCoinSlots(playerCoins: StonePool): CoinSlot[] {
  const slots: CoinSlot[] = []
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
// MAIN COMPONENT
// ============================================

export const PlayerCoinAreaCompact = memo(
  forwardRef<PlayerCoinAreaCompactRef, PlayerCoinAreaCompactProps>(
    function PlayerCoinAreaCompact(
      {
        playerId,
        playerName,
        playerColor,
        playerCoins,
        isCurrentPlayer = false,
        isPlayerTurn = false,
        onReturnCoin,
        className = '',
      },
      ref
    ) {
      const containerRef = useRef<HTMLDivElement>(null)
      const slotRefs = useRef<Map<number, HTMLDivElement>>(new Map())

      const totalValue = calculateStonePoolValue(playerCoins)
      const coinSlots = useMemo(() => createCoinSlots(playerCoins), [playerCoins])
      const filledSlots = coinSlots.filter((s) => s.stoneType !== null).length

      // Expose methods via ref for animation targeting
      useImperativeHandle(ref, () => ({
        getCoinSlotElement: (coinType: StoneType) => {
          // Find first empty slot or last filled slot of matching type
          const matchingSlot = coinSlots.find(
            (slot) => slot.stoneType === coinType
          )
          if (matchingSlot) {
            return slotRefs.current.get(matchingSlot.index) || null
          }
          // Return first empty slot
          const emptySlot = coinSlots.find((slot) => slot.stoneType === null)
          if (emptySlot) {
            return slotRefs.current.get(emptySlot.index) || null
          }
          return containerRef.current
        },
        getContainerElement: () => containerRef.current,
      }))

      return (
        <div
          ref={containerRef}
          className={cn(
            'rounded-lg border p-2 transition-all',
            isCurrentPlayer
              ? 'bg-vale-900/30 border-vale-500/50'
              : 'bg-slate-800/40 border-slate-700/50',
            isPlayerTurn && 'ring-2 ring-amber-400/50 animate-pulse',
            className
          )}
          data-testid={`player-coin-area-${playerId}`}
          data-player-id={playerId}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <PlayerMarker
                color={playerColor}
                size="sm"
                showGlow={isPlayerTurn}
                playerName={playerName}
              />
              <span
                className={cn(
                  'text-xs font-medium truncate max-w-[60px]',
                  isCurrentPlayer ? 'text-vale-300' : 'text-slate-300'
                )}
                title={playerName}
              >
                {isCurrentPlayer ? '你' : playerName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-400 font-bold text-sm">
                {totalValue}
              </span>
              <span className="text-slate-500 text-xs">元</span>
            </div>
          </div>

          {/* 6-Slot Grid (2 rows x 3 cols) */}
          <div className="grid grid-cols-3 gap-1">
            {coinSlots.map((slot) => (
              <div
                key={slot.index}
                ref={(el) => {
                  if (el) slotRefs.current.set(slot.index, el)
                }}
                className={cn(
                  'aspect-square rounded border flex items-center justify-center',
                  slot.stoneType
                    ? 'border-amber-500/30 bg-slate-700/50 cursor-pointer hover:bg-slate-700/70 transition-colors'
                    : 'border-dashed border-slate-600/30 bg-slate-800/20'
                )}
                data-testid={`coin-slot-${playerId}-${slot.index}`}
                data-coin-type={slot.stoneType}
                onClick={() => {
                  if (slot.stoneType && slot.config && onReturnCoin) {
                    const element = slotRefs.current.get(slot.index)
                    if (element) {
                      onReturnCoin(slot.stoneType, element)
                    }
                  }
                }}
              >
                {slot.stoneType && slot.config ? (
                  <img
                    src={slot.config.image}
                    alt={`${slot.config.value} coin`}
                    className="w-6 h-6 object-contain drop-shadow pointer-events-none"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-dashed border-slate-600/40" />
                )}
              </div>
            ))}
          </div>

          {/* Slot Count */}
          <div className="mt-1 text-center">
            <span className="text-[10px] text-slate-500">
              {filledSlots}/{MAX_SLOTS}
            </span>
          </div>
        </div>
      )
    }
  )
)

export default PlayerCoinAreaCompact
