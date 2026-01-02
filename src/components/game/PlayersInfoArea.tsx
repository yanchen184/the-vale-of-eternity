/**
 * PlayersInfoArea Component
 * Displays all players' coin counts and hand card counts
 * Integrated with GameActionLog for complete game state visibility
 * @version 2.0.0 - Integrated GameActionLog component
 */
console.log('[components/game/PlayersInfoArea.tsx] v2.0.0 loaded')

import { memo, useMemo } from 'react'
import { PlayerMarker } from './PlayerMarker'
import { GameActionLog } from './GameActionLog'
import { type PlayerColor } from '@/types/player-color'
import type { StonePool } from '@/types/game'
import type { GameActionLog as GameActionLogType } from '@/types/game-log'
import { cn } from '@/lib/utils'

// ============================================
// CONSTANTS
// ============================================

const BASE_PATH = '/the-vale-of-eternity'

// Coin image paths
const COIN_IMAGES = {
  ONE: `${BASE_PATH}/assets/stones/stone-1.png`,
  THREE: `${BASE_PATH}/assets/stones/stone-3.png`,
  SIX: `${BASE_PATH}/assets/stones/stone-6.png`,
} as const

// ============================================
// TYPES
// ============================================

export interface PlayerInfoData {
  playerId: string
  name: string
  color: PlayerColor
  stones: StonePool
  handCount: number
  fieldCount: number
  hasPassed: boolean
}

export interface PlayersInfoAreaProps {
  /** Array of player information */
  players: PlayerInfoData[]
  /** Current player's ID (self) */
  currentPlayerId: string
  /** Player ID whose turn it is */
  currentTurnPlayerId: string
  /** Game action logs (optional) */
  actionLogs?: GameActionLogType[]
  /** Additional CSS classes */
  className?: string
}

// ============================================
// COIN DISPLAY COMPONENT
// ============================================

interface CoinDisplayProps {
  value: 1 | 3 | 6
  count: number
  size?: 'sm' | 'md'
}

const CoinDisplay = memo(function CoinDisplay({
  value,
  count,
  size = 'sm',
}: CoinDisplayProps) {
  const imagePath = value === 1 ? COIN_IMAGES.ONE : value === 3 ? COIN_IMAGES.THREE : COIN_IMAGES.SIX
  const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className="flex items-center gap-1" data-testid={`coin-display-${value}`}>
      <img
        src={imagePath}
        alt={`${value}元硬幣`}
        className={cn(sizeClasses, 'object-contain')}
        onError={(e) => {
          // Fallback to colored circle if image fails
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const fallback = target.nextElementSibling as HTMLElement
          if (fallback) fallback.style.display = 'flex'
        }}
      />
      <div
        className={cn(
          sizeClasses,
          'hidden items-center justify-center rounded-full font-bold',
          value === 1 && 'bg-amber-600 text-amber-100',
          value === 3 && 'bg-slate-400 text-slate-900',
          value === 6 && 'bg-yellow-500 text-yellow-900'
        )}
      >
        {value}
      </div>
      <span className={cn(textSize, 'font-mono font-semibold text-slate-300')}>
        x{count}
      </span>
    </div>
  )
})

// ============================================
// PLAYER INFO CARD COMPONENT
// ============================================

interface PlayerInfoCardProps {
  player: PlayerInfoData
  isCurrentPlayer: boolean
  isCurrentTurn: boolean
}

const PlayerInfoCard = memo(function PlayerInfoCard({
  player,
  isCurrentPlayer,
  isCurrentTurn,
}: PlayerInfoCardProps) {
  // Calculate total coin value
  const totalCoinValue = useMemo(() => {
    return (
      (player.stones.ONE || 0) * 1 +
      (player.stones.THREE || 0) * 3 +
      (player.stones.SIX || 0) * 6
    )
  }, [player.stones])

  return (
    <div
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all duration-300',
        // Base styles
        'bg-slate-800/60 backdrop-blur-sm',
        // Current turn highlight
        isCurrentTurn && !player.hasPassed && [
          'border-vale-500 shadow-lg',
          'ring-2 ring-vale-500/50 ring-offset-2 ring-offset-slate-900',
          'animate-pulse-slow',
        ],
        // Self highlight
        isCurrentPlayer && !isCurrentTurn && 'border-slate-500',
        // Default border
        !isCurrentTurn && !isCurrentPlayer && 'border-slate-700/50',
        // Passed state
        player.hasPassed && 'opacity-50'
      )}
      data-testid={`player-info-${player.playerId}`}
    >
      {/* Current Turn Indicator */}
      {isCurrentTurn && !player.hasPassed && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-vale-500 text-white text-xs font-bold animate-bounce-subtle">
          回合中
        </div>
      )}

      {/* Header: Player Name + Color */}
      <div className="flex items-center gap-3 mb-3">
        <PlayerMarker
          color={player.color}
          size="md"
          showGlow={isCurrentTurn && !player.hasPassed}
          playerName={player.name}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-semibold truncate',
                isCurrentPlayer ? 'text-vale-400' : 'text-slate-200'
              )}
            >
              {player.name}
            </span>
            {isCurrentPlayer && (
              <span className="text-xs text-vale-400 px-1.5 py-0.5 rounded bg-vale-500/20 border border-vale-500/30">
                你
              </span>
            )}
          </div>
          {player.hasPassed && (
            <span className="text-xs text-slate-500">已跳過回合</span>
          )}
        </div>
      </div>

      {/* Coins Section - Only show for other players (not self) */}
      {!isCurrentPlayer && (
        <div className="mb-3 p-2 rounded-lg bg-slate-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">錢幣</span>
            <span className="text-sm font-bold text-amber-400">
              總值: {totalCoinValue}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <CoinDisplay value={1} count={player.stones.ONE || 0} />
            <CoinDisplay value={3} count={player.stones.THREE || 0} />
            <CoinDisplay value={6} count={player.stones.SIX || 0} />
          </div>
        </div>
      )}

      {/* Cards Count */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-slate-300">
            {player.handCount} 張
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-slate-300">
            {player.fieldCount} 張
          </span>
        </div>
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const PlayersInfoArea = memo(function PlayersInfoArea({
  players,
  currentPlayerId,
  currentTurnPlayerId,
  actionLogs = [],
  className,
}: PlayersInfoAreaProps) {
  // Sort players: current turn player first, then by index
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      // Current player (self) always first
      if (a.playerId === currentPlayerId) return -1
      if (b.playerId === currentPlayerId) return 1
      return 0
    })
  }, [players, currentPlayerId])

  return (
    <div className={cn('space-y-3', className)} data-testid="players-info-area-container">
      {/* Players Info Section */}
      <section
        className={cn(
          'bg-slate-800/30 rounded-xl border border-slate-700/50 p-4',
        )}
        data-testid="players-info-area"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">玩家資訊</h3>
          <span className="text-sm text-slate-500">{players.length} 位玩家</span>
        </div>

        {/* Players Grid */}
        <div
          className={cn(
            'grid gap-4',
            players.length === 2 && 'grid-cols-2',
            players.length === 3 && 'grid-cols-3',
            players.length === 4 && 'grid-cols-2 lg:grid-cols-4'
          )}
        >
          {sortedPlayers.map((player) => (
            <PlayerInfoCard
              key={player.playerId}
              player={player}
              isCurrentPlayer={player.playerId === currentPlayerId}
              isCurrentTurn={player.playerId === currentTurnPlayerId}
            />
          ))}
        </div>
      </section>

      {/* Game Action Log Section */}
      {actionLogs.length > 0 && (
        <GameActionLog
          logs={actionLogs}
          maxDisplay={5}
        />
      )}
    </div>
  )
})

export default PlayersInfoArea
