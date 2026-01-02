/**
 * AllPlayersCoinArea Component
 * Displays coin areas for all players in a multi-player game
 * Supports flying animations when any player takes/returns coins
 * @version 1.0.0
 */
console.log('[components/game/AllPlayersCoinArea.tsx] v1.0.0 loaded')

import { memo, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'
import type { StonePool } from '@/types/game'
import { StoneType } from '@/types/cards'
import type { PlayerColor } from '@/types/player-color'
import {
  PlayerCoinAreaCompact,
  type PlayerCoinAreaCompactRef,
} from './PlayerCoinAreaCompact'

// ============================================
// TYPES
// ============================================

export interface PlayerCoinData {
  playerId: string
  playerName: string
  playerColor: PlayerColor
  playerCoins: StonePool
  index: number
}

export interface AllPlayersCoinAreaProps {
  /** All players' coin data */
  players: PlayerCoinData[]
  /** Current logged-in player's ID */
  currentPlayerId: string
  /** ID of player whose turn it is */
  currentTurnPlayerId: string
  /** Additional CSS classes */
  className?: string
}

export interface AllPlayersCoinAreaRef {
  /** Get a specific player's coin area element for animation targeting */
  getPlayerCoinElement: (
    playerId: string,
    coinType: StoneType
  ) => HTMLElement | null
  /** Get the bank area element */
  getBankElement: () => HTMLElement | null
  /** Get container element */
  getContainerElement: () => HTMLElement | null
}

// ============================================
// BANK DISPLAY COMPONENT
// ============================================

interface BankDisplayProps {
  className?: string
}

const BankDisplay = memo(
  forwardRef<HTMLDivElement, BankDisplayProps>(function BankDisplay(
    { className },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border-2 border-dashed border-amber-500/40 bg-amber-900/20 p-3',
          'flex flex-col items-center justify-center min-h-[100px]',
          className
        )}
        data-testid="all-players-bank"
      >
        <svg
          className="w-8 h-8 text-amber-500 mb-1"
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
        <span className="text-xs font-medium text-amber-400">銀行</span>
        <span className="text-[10px] text-amber-500/60">無限供應</span>
      </div>
    )
  })
)

// ============================================
// MAIN COMPONENT
// ============================================

export const AllPlayersCoinArea = memo(
  forwardRef<AllPlayersCoinAreaRef, AllPlayersCoinAreaProps>(
    function AllPlayersCoinArea(
      { players, currentPlayerId, currentTurnPlayerId, className = '' },
      ref
    ) {
      const containerRef = useRef<HTMLDivElement>(null)
      const bankRef = useRef<HTMLDivElement>(null)
      const playerRefs = useRef<Map<string, PlayerCoinAreaCompactRef>>(new Map())

      // Store ref for each player's coin area
      const setPlayerRef = useCallback(
        (playerId: string, element: PlayerCoinAreaCompactRef | null) => {
          if (element) {
            playerRefs.current.set(playerId, element)
          } else {
            playerRefs.current.delete(playerId)
          }
        },
        []
      )

      // Expose methods via ref for external animation triggering
      useImperativeHandle(ref, () => ({
        getPlayerCoinElement: (playerId: string, coinType: StoneType) => {
          const playerRef = playerRefs.current.get(playerId)
          if (playerRef) {
            return playerRef.getCoinSlotElement(coinType)
          }
          return null
        },
        getBankElement: () => bankRef.current,
        getContainerElement: () => containerRef.current,
      }))

      // Sort players: current player first, then by index
      const sortedPlayers = [...players].sort((a, b) => {
        if (a.playerId === currentPlayerId) return -1
        if (b.playerId === currentPlayerId) return 1
        return a.index - b.index
      })

      // Layout based on player count
      const playerCount = players.length
      const getLayoutClass = () => {
        switch (playerCount) {
          case 2:
            return 'grid-cols-2 gap-3'
          case 3:
            return 'grid-cols-3 gap-2'
          case 4:
            return 'grid-cols-2 gap-2 lg:grid-cols-4'
          default:
            return 'grid-cols-2 gap-3'
        }
      }

      return (
        <div
          ref={containerRef}
          className={cn(
            'rounded-xl border border-slate-700/50 bg-slate-800/30 p-3',
            className
          )}
          data-testid="all-players-coin-area"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              玩家錢幣
            </h4>
            <span className="text-xs text-slate-500">
              {playerCount} 位玩家
            </span>
          </div>

          {/* Bank + Players Layout */}
          <div className="space-y-3">
            {/* Bank Area (Center) */}
            <BankDisplay ref={bankRef} />

            {/* Players Grid */}
            <div className={cn('grid', getLayoutClass())}>
              {sortedPlayers.map((player) => (
                <PlayerCoinAreaCompact
                  key={player.playerId}
                  ref={(el) => setPlayerRef(player.playerId, el)}
                  playerId={player.playerId}
                  playerName={player.playerName}
                  playerColor={player.playerColor}
                  playerCoins={player.playerCoins}
                  isCurrentPlayer={player.playerId === currentPlayerId}
                  isPlayerTurn={player.playerId === currentTurnPlayerId}
                />
              ))}
            </div>
          </div>
        </div>
      )
    }
  )
)

export default AllPlayersCoinArea
