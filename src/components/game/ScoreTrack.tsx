/**
 * ScoreTrack Component
 * Displays a snake-pattern score track with player markers
 * Features animated score changes and improved visual hierarchy
 * @version 2.1.0 - Removed milestone highlighting (10, 20, 30, etc.)
 */
console.log('[components/game/ScoreTrack.tsx] v2.1.0 loaded')

import { memo, useMemo, useState, useEffect, useRef } from 'react'
import { PlayerMarker } from './PlayerMarker'
import { type PlayerColor, PLAYER_COLORS } from '@/types/player-color'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface PlayerScoreInfo {
  playerId: string
  playerName: string
  color: PlayerColor
  score: number
  isFlipped?: boolean // Whether the player has flipped their card (+60/-60)
}

export interface ScoreTrackProps {
  /** Array of player score information */
  players: PlayerScoreInfo[]
  /** Maximum score on the track */
  maxScore?: number
  /** Current player ID (highlighted) */
  currentPlayerId?: string
  /** Callback when a player's score is adjusted */
  onScoreAdjust?: (playerId: string, newScore: number) => void
  /** Whether score adjustment is allowed */
  allowAdjustment?: boolean
  /** Callback when a player's flip button is clicked */
  onFlipToggle?: (playerId: string) => void
}

// ============================================
// CONSTANTS
// ============================================

const TRACK_LENGTH = 60 // 1-60 points
const CELLS_PER_ROW = 12 // Snake pattern: 12 cells per row for bigger display

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get row direction indicator
 */
function getRowDirection(rowIndex: number): 'left' | 'right' {
  return rowIndex % 2 === 0 ? 'right' : 'left'
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ScoreCellProps {
  score: number
  players: PlayerScoreInfo[]
  currentPlayerId?: string
  allowAdjustment: boolean
  onScoreAdjust?: (playerId: string, newScore: number) => void
  isAnimating?: boolean
}

const ScoreCell = memo(function ScoreCell({
  score,
  players,
  currentPlayerId,
  allowAdjustment,
  onScoreAdjust,
  isAnimating = false,
}: ScoreCellProps) {
  const isOccupied = players.length > 0

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowAdjustment || !currentPlayerId) return

    const marker = e.target as HTMLElement
    const playerMarker = marker.closest('[data-player-id]')

    if (playerMarker) {
      const playerId = playerMarker.getAttribute('data-player-id')
      if (playerId) {
        onScoreAdjust?.(playerId, score)
      }
    } else {
      onScoreAdjust?.(currentPlayerId, score)
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center',
        'rounded-lg transition-all duration-200',
        'min-h-[72px] p-1.5',
        // Background based on state
        isOccupied ? 'bg-slate-700/40' : 'bg-slate-900/40',
        // Border
        'border border-slate-700/30',
        // Interaction states
        allowAdjustment && 'hover:bg-slate-700/60 hover:border-slate-600/60 cursor-pointer',
        // Animation
        isAnimating && 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900'
      )}
      onClick={handleClick}
      data-testid={`score-cell-${score}`}
    >
      {/* Score Number */}
      <div className="text-xs font-bold font-mono mb-0.5 text-slate-500">
        {score}
      </div>

      {/* Player Markers */}
      {isOccupied && (
        <div className="flex flex-wrap gap-0.5 justify-center max-w-full">
          {players.map((player) => (
            <div
              key={player.playerId}
              className="relative"
              data-player-id={player.playerId}
              title={`${player.playerName}: ${player.score}分${
                player.isFlipped ? ' (已翻牌 +60)' : ''
              }${allowAdjustment ? ' (點擊調整)' : ''}`}
            >
              <PlayerMarker
                color={player.color}
                size="sm"
                showGlow={player.playerId === currentPlayerId}
                playerName={player.playerName}
              />
              {/* +60 Badge for flipped players */}
              {player.isFlipped && (
                <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[7px] font-bold px-1 rounded-full border border-white shadow-lg">
                  +60
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

interface PlayerLegendItemProps {
  player: PlayerScoreInfo
  isCurrentPlayer: boolean
  onFlipToggle?: (playerId: string) => void
}

const PlayerLegendItem = memo(function PlayerLegendItem({
  player,
  isCurrentPlayer,
  onFlipToggle,
}: PlayerLegendItemProps) {
  const colorConfig = PLAYER_COLORS[player.color]

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
        isCurrentPlayer
          ? `bg-slate-700/50 border ${colorConfig.border}`
          : 'bg-slate-800/30 border border-transparent hover:bg-slate-700/30'
      )}
    >
      {/* Player Marker */}
      <PlayerMarker
        color={player.color}
        size="sm"
        showGlow={isCurrentPlayer}
        playerName={player.playerName}
      />

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'font-medium text-sm truncate',
            isCurrentPlayer ? colorConfig.text : 'text-slate-300'
          )}
        >
          {player.playerName}
        </div>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold font-mono text-amber-400">
          {player.score}
        </span>
        <span className="text-xs text-slate-500">分</span>
      </div>

      {/* Flip Toggle Button */}
      {onFlipToggle && (
        <button
          type="button"
          onClick={() => onFlipToggle(player.playerId)}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-200',
            'border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-800',
            player.isFlipped
              ? 'bg-red-500/20 border-red-500/60 text-red-400 hover:bg-red-500/30 focus:ring-red-500/50'
              : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/30 focus:ring-emerald-500/50'
          )}
          title={
            player.isFlipped
              ? '已翻牌：點擊移除 +60 分加成'
              : '未翻牌：點擊增加 +60 分加成'
          }
          data-testid={`flip-button-${player.playerId}`}
        >
          {player.isFlipped ? '-60' : '+60'}
        </button>
      )}
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const ScoreTrack = memo(function ScoreTrack({
  players,
  maxScore = TRACK_LENGTH,
  currentPlayerId,
  onScoreAdjust,
  allowAdjustment = false,
  onFlipToggle,
}: ScoreTrackProps) {
  const rows = Math.ceil((maxScore + 1) / CELLS_PER_ROW)

  // Track previous scores for animation
  const prevScoresRef = useRef<Map<string, number>>(new Map())
  const [animatingPlayers, setAnimatingPlayers] = useState<
    Map<string, { from: number; to: number; current: number }>
  >(new Map())

  // Detect score changes and trigger animations (only for score increases)
  useEffect(() => {
    const newAnimations = new Map<
      string,
      { from: number; to: number; current: number }
    >()

    players.forEach((player) => {
      const displayScore = player.isFlipped ? player.score - 60 : player.score
      const clampedScore = Math.max(1, Math.min(maxScore, displayScore))
      const prevScore = prevScoresRef.current.get(player.playerId)

      if (prevScore !== undefined && clampedScore > prevScore) {
        newAnimations.set(player.playerId, {
          from: prevScore,
          to: clampedScore,
          current: prevScore,
        })
      }

      prevScoresRef.current.set(player.playerId, clampedScore)
    })

    if (newAnimations.size > 0) {
      setAnimatingPlayers(newAnimations)
    }
  }, [players, maxScore])

  // Animate the jumping effect
  useEffect(() => {
    if (animatingPlayers.size === 0) return

    const interval = setInterval(() => {
      setAnimatingPlayers((prev) => {
        const updated = new Map(prev)
        let hasChanges = false

        updated.forEach((anim) => {
          if (anim.current < anim.to) {
            anim.current += 1
            hasChanges = true
          }
        })

        // Remove completed animations
        updated.forEach((anim, pid) => {
          if (anim.current >= anim.to) {
            updated.delete(pid)
          }
        })

        return hasChanges ? updated : new Map()
      })
    }, 300)

    return () => clearInterval(interval)
  }, [animatingPlayers])

  // Group players by score for positioning
  const playersByPosition = useMemo(() => {
    const map = new Map<number, PlayerScoreInfo[]>()
    players.forEach((player) => {
      const displayScore = player.isFlipped ? player.score - 60 : player.score
      let clampedScore = Math.max(1, Math.min(maxScore, displayScore))

      // If animating, use animation position
      const anim = animatingPlayers.get(player.playerId)
      if (anim) {
        clampedScore = anim.current
      }

      const existing = map.get(clampedScore) || []
      map.set(clampedScore, [...existing, player])
    })
    return map
  }, [players, maxScore, animatingPlayers])

  // Get set of cells that are animating
  const animatingCells = useMemo(() => {
    const cells = new Set<number>()
    animatingPlayers.forEach((anim) => {
      cells.add(anim.current)
    })
    return cells
  }, [animatingPlayers])

  // Sort players by score for legend (descending)
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score)
  }, [players])

  return (
    <div className="w-full bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-3">
          {/* Trophy Icon */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">
              分數進度條
            </h3>
            <p className="text-xs text-slate-500">目標 {maxScore} 分</p>
          </div>
        </div>

        {allowAdjustment && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <svg
              className="w-4 h-4 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span className="text-xs text-slate-400">點擊格子調整分數</span>
          </div>
        )}
      </div>

      {/* Score Track Grid */}
      <div className="p-4">
        <div className="space-y-1.5">
          {Array.from({ length: rows }, (_, rowIndex) => {
            const isReversedRow = rowIndex % 2 === 1
            const startScore = rowIndex * CELLS_PER_ROW + 1
            const direction = getRowDirection(rowIndex)

            // Build cells for this row with sequential scores
            const cells = Array.from({ length: CELLS_PER_ROW }, (_, colIndex) => {
              const score = startScore + colIndex
              if (score > maxScore) return null

              const playersAtScore = playersByPosition.get(score) || []
              const isAnimating = animatingCells.has(score)

              return (
                <ScoreCell
                  key={score}
                  score={score}
                  players={playersAtScore}
                  currentPlayerId={currentPlayerId}
                  allowAdjustment={allowAdjustment}
                  onScoreAdjust={onScoreAdjust}
                  isAnimating={isAnimating}
                />
              )
            })

            // For odd rows (snake pattern), reverse the visual order
            const displayCells = isReversedRow ? [...cells].reverse() : cells

            return (
              <div key={rowIndex} className="relative">
                {/* Row Direction Indicator */}
                <div
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 text-slate-600',
                    direction === 'right' ? '-left-5' : '-right-5'
                  )}
                >
                  <svg
                    className={cn(
                      'w-3 h-3',
                      direction === 'left' && 'rotate-180'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>

                {/* Cells Grid */}
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
                  data-testid={`score-row-${rowIndex}`}
                >
                  {displayCells}
                </div>
              </div>
            )
          })}
        </div>

        {/* Milestone Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-900/30 to-amber-800/20 border-2 border-amber-600/50" />
            <span className="text-xs text-slate-500">里程碑 (10, 20, 30...)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-900/40 border border-slate-700/30" />
            <span className="text-xs text-slate-500">一般格子</span>
          </div>
        </div>
      </div>

      {/* Player Legend */}
      <div className="border-t border-slate-700/50 bg-slate-800/30">
        <div className="px-4 py-3">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">
            玩家分數
          </div>
          <div className="grid gap-2">
            {sortedPlayers.map((player) => (
              <PlayerLegendItem
                key={player.playerId}
                player={player}
                isCurrentPlayer={player.playerId === currentPlayerId}
                onFlipToggle={onFlipToggle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

export default ScoreTrack
