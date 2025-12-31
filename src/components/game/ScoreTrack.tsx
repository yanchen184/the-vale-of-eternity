/**
 * ScoreTrack Component
 * Displays a snake-pattern score track with player markers
 * @version 1.0.0
 */
console.log('[components/game/ScoreTrack.tsx] v1.0.0 loaded')

import { memo, useMemo } from 'react'
import { PlayerMarker } from './PlayerMarker'
import { type PlayerColor } from '@/types/player-color'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface PlayerScoreInfo {
  playerId: string
  playerName: string
  color: PlayerColor
  score: number
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
}

// ============================================
// CONSTANTS
// ============================================

const TRACK_LENGTH = 50 // 0-50 points
const CELLS_PER_ROW = 10 // Snake pattern: 10 cells per row

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate grid position for a score value
 * Snake pattern:
 * Row 0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
 * Row 1: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10]
 * Row 2: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
 * etc.
 * (Currently unused but kept for future drag-and-drop positioning feature)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getPositionFromScore(score: number): { row: number; col: number } {
  const clampedScore = Math.max(0, Math.min(TRACK_LENGTH, score))
  const row = Math.floor(clampedScore / CELLS_PER_ROW)
  const isReversedRow = row % 2 === 1 // Odd rows go right-to-left

  const positionInRow = clampedScore % CELLS_PER_ROW
  const col = isReversedRow ? CELLS_PER_ROW - 1 - positionInRow : positionInRow

  return { row, col }
}

// ============================================
// COMPONENT
// ============================================

export const ScoreTrack = memo(function ScoreTrack({
  players,
  maxScore = TRACK_LENGTH,
  currentPlayerId,
  onScoreAdjust,
  allowAdjustment = false,
}: ScoreTrackProps) {
  const rows = Math.ceil((maxScore + 1) / CELLS_PER_ROW)

  // Group players by score for positioning
  const playersByPosition = useMemo(() => {
    const map = new Map<number, PlayerScoreInfo[]>()
    players.forEach(player => {
      const score = Math.max(0, Math.min(maxScore, player.score))
      const existing = map.get(score) || []
      map.set(score, [...existing, player])
    })
    return map
  }, [players, maxScore])

  return (
    <div className="w-full bg-slate-800/50 rounded-xl border border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200">分數進度條</h3>
        {allowAdjustment && (
          <span className="text-xs text-slate-500">點擊分數格子調整分數</span>
        )}
      </div>

      {/* Score Track Grid */}
      <div className="space-y-1">
        {Array.from({ length: rows }, (_, rowIndex) => {
          const isReversedRow = rowIndex % 2 === 1
          const startScore = rowIndex * CELLS_PER_ROW
          const cells = Array.from({ length: CELLS_PER_ROW }, (_, colIndex) => {
            const actualCol = isReversedRow ? CELLS_PER_ROW - 1 - colIndex : colIndex
            const score = startScore + actualCol
            if (score > maxScore) return null

            const playersAtScore = playersByPosition.get(score) || []
            const isOccupied = playersAtScore.length > 0

            return (
              <div
                key={score}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'border-2 rounded-lg transition-all duration-200',
                  'min-h-[60px] p-2',
                  isOccupied
                    ? 'bg-slate-700/50 border-slate-600'
                    : 'bg-slate-900/30 border-slate-700/50',
                  allowAdjustment && 'hover:bg-slate-700/70 cursor-pointer'
                )}
                onClick={() => {
                  if (allowAdjustment && playersAtScore.length === 1) {
                    onScoreAdjust?.(playersAtScore[0].playerId, score)
                  }
                }}
                data-testid={`score-cell-${score}`}
              >
                {/* Score Number */}
                <div className="text-xs font-mono text-slate-500 mb-1">{score}</div>

                {/* Player Markers */}
                {playersAtScore.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {playersAtScore.map(player => (
                      <div
                        key={player.playerId}
                        className="relative"
                        title={`${player.playerName}: ${player.score}分`}
                      >
                        <PlayerMarker
                          color={player.color}
                          size="sm"
                          showGlow={player.playerId === currentPlayerId}
                          playerName={player.playerName}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })

          return (
            <div
              key={rowIndex}
              className="grid grid-cols-10 gap-1"
              data-testid={`score-row-${rowIndex}`}
            >
              {cells}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex flex-wrap gap-4 text-sm">
          {players.map(player => (
            <div key={player.playerId} className="flex items-center gap-2">
              <PlayerMarker
                color={player.color}
                size="sm"
                showGlow={false}
                playerName={player.playerName}
              />
              <span className={cn(
                'font-medium',
                player.playerId === currentPlayerId ? 'text-vale-400' : 'text-slate-300'
              )}>
                {player.playerName}
              </span>
              <span className="text-slate-500">:</span>
              <span className="font-mono text-slate-200 font-semibold">{player.score}</span>
              <span className="text-slate-500">分</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default ScoreTrack
