/**
 * ScoreBar Component
 * Bottom score progress bar for multiplayer game
 * Shows all players' scores with progress bars
 * @version 1.2.0 - Enhanced discard pile button visibility
 */
console.log('[components/game/ScoreBar.tsx] v1.2.0 loaded')

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { type PlayerColor, PLAYER_COLORS } from '@/types/player-color'

// ============================================
// TYPES
// ============================================

export interface ScoreBarPlayerData {
  /** Player ID */
  playerId: string
  /** Player name */
  name: string
  /** Player color */
  color: PlayerColor
  /** Current score */
  score: number
}

export interface ScoreBarProps {
  /** List of players with their scores */
  players: ScoreBarPlayerData[]
  /** Current player's ID (to highlight) */
  currentPlayerId: string
  /** Max score for progress calculation (default: 60) */
  maxScore?: number
  /** Number of cards in discard pile */
  discardCount?: number
  /** Callback when discard pile button is clicked */
  onDiscardClick?: () => void
  /** Additional CSS classes */
  className?: string
}

// ============================================
// PLAYER SCORE ITEM
// ============================================

interface PlayerScoreItemProps {
  player: ScoreBarPlayerData
  rank: number
  isMe: boolean
  maxScore: number
  highestScore: number
}

const PlayerScoreItem = memo(function PlayerScoreItem({
  player,
  rank,
  isMe,
  maxScore,
  highestScore,
}: PlayerScoreItemProps) {
  const colorConfig = PLAYER_COLORS[player.color]
  const scorePercentage = Math.min((player.score / maxScore) * 100, 100)
  const isLeading = player.score === highestScore && player.score > 0

  return (
    <div
      className={cn(
        'flex-1 h-8 rounded-lg overflow-hidden relative',
        'bg-slate-800/50 border',
        isMe ? 'border-purple-500/50' : 'border-slate-700/50',
        isLeading && 'ring-1 ring-amber-400/50'
      )}
      data-testid={`score-bar-player-${player.playerId}`}
    >
      {/* Progress bar background */}
      <div
        className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
        style={{
          width: `${scorePercentage}%`,
          background: `linear-gradient(to right, ${colorConfig.hex}60, ${colorConfig.hex})`,
        }}
      />

      {/* Player info */}
      <div className="relative h-full flex items-center justify-between px-3 z-10">
        <div className="flex items-center gap-2">
          {/* Rank indicator */}
          <span
            className={cn(
              'text-xs font-bold w-5 text-center',
              isLeading ? 'text-amber-400' : 'text-slate-500'
            )}
          >
            {isLeading ? '1st' : `#${rank}`}
          </span>

          {/* Color indicator */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: colorConfig.hex }}
          />

          {/* Player name */}
          <span
            className={cn(
              'text-sm font-medium truncate max-w-[80px]',
              isMe ? 'text-purple-300' : 'text-slate-300'
            )}
          >
            {player.name}
            {isMe && ' (你)'}
          </span>
        </div>

        {/* Score */}
        <span
          className={cn(
            'text-sm font-bold',
            isLeading ? 'text-amber-300' : 'text-slate-300'
          )}
        >
          {player.score}
        </span>
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const ScoreBar = memo(function ScoreBar({
  players,
  currentPlayerId,
  maxScore = 60,
  discardCount = 0,
  onDiscardClick,
  className,
}: ScoreBarProps) {
  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const highestScore = sortedPlayers[0]?.score ?? 0

  // Get rank for each player
  const getRank = (playerId: string): number => {
    const index = sortedPlayers.findIndex((p) => p.playerId === playerId)
    return index + 1
  }

  return (
    <div
      className={cn('h-full flex items-center gap-4 px-4', className)}
      data-testid="score-bar"
    >
      {/* Title */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-slate-400 text-sm">Score</span>
      </div>

      {/* Player scores */}
      <div className="flex-1 flex items-center gap-2">
        {players.map((player) => (
          <PlayerScoreItem
            key={player.playerId}
            player={player}
            rank={getRank(player.playerId)}
            isMe={player.playerId === currentPlayerId}
            maxScore={maxScore}
            highestScore={highestScore}
          />
        ))}
      </div>

      {/* Discard Pile Button */}
      {onDiscardClick && (
        <button
          type="button"
          onClick={onDiscardClick}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-purple-600/80 border-2 border-purple-400/50',
            'hover:bg-purple-500/90 hover:border-purple-300',
            'hover:scale-105 active:scale-95',
            'transition-all duration-200',
            'flex-shrink-0 shadow-lg'
          )}
          data-testid="discard-pile-button"
        >
          <span className="text-sm font-semibold text-white">🗑️ 棄置牌堆</span>
          <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
            <span className="text-sm text-amber-300 font-bold">{discardCount}</span>
            <span className="text-xs text-white">張</span>
          </div>
        </button>
      )}
    </div>
  )
})

export default ScoreBar
