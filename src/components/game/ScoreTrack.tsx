/**
 * ScoreTrack Component
 * Displays a snake-pattern score track with player markers
 * @version 1.4.0 - Flip bonus: marker stays at base position with +60 badge
 */
console.log('[components/game/ScoreTrack.tsx] v1.4.0 loaded')

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

const TRACK_LENGTH = 60 // 0-60 points
const CELLS_PER_ROW = 20 // Snake pattern: 20 cells per row

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate grid position for a score value
 * Snake pattern (20 cells per row):
 * Row 0: [0, 1, 2, 3, ..., 18, 19] (left to right)
 * Row 1: [20, 21, 22, 23, ..., 38, 39] (right to left display)
 * Row 2: [40, 41, 42, 43, ..., 58, 59] (left to right)
 * Row 3: [60] (right to left display if needed)
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
  onFlipToggle,
}: ScoreTrackProps) {
  const rows = Math.ceil((maxScore + 1) / CELLS_PER_ROW)

  // Group players by score for positioning
  // If player has flipped (+60), show marker at (score - 60) position
  const playersByPosition = useMemo(() => {
    const map = new Map<number, PlayerScoreInfo[]>()
    players.forEach(player => {
      // Calculate display position: if flipped, subtract 60 from actual score
      const displayScore = player.isFlipped ? player.score - 60 : player.score
      const clampedScore = Math.max(0, Math.min(maxScore, displayScore))
      const existing = map.get(clampedScore) || []
      map.set(clampedScore, [...existing, player])
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

          // Build cells for this row with sequential scores
          const cells = Array.from({ length: CELLS_PER_ROW }, (_, colIndex) => {
            const score = startScore + colIndex
            if (score > maxScore) return null

            const playersAtScore = playersByPosition.get(score) || []
            const isOccupied = playersAtScore.length > 0

            return (
              <div
                key={score}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'border rounded transition-all duration-200',
                  'min-h-[48px] p-1',
                  isOccupied
                    ? 'bg-slate-700/50 border-slate-600'
                    : 'bg-slate-900/30 border-slate-700/50',
                  allowAdjustment && 'hover:bg-slate-700/70 cursor-pointer'
                )}
                onClick={(e) => {
                  if (!allowAdjustment || !currentPlayerId) return

                  // Check if clicked on a specific player marker
                  const marker = e.target as HTMLElement
                  const playerMarker = marker.closest('[data-player-id]')

                  if (playerMarker) {
                    // Clicked on a specific player marker - adjust that player's score
                    const playerId = playerMarker.getAttribute('data-player-id')
                    if (playerId) {
                      onScoreAdjust?.(playerId, score)
                    }
                  } else {
                    // Clicked on empty space or score number - adjust current player's score
                    onScoreAdjust?.(currentPlayerId, score)
                  }
                }}
                data-testid={`score-cell-${score}`}
              >
                {/* Score Number */}
                <div className="text-[10px] font-mono text-slate-500 mb-0.5">{score}</div>

                {/* Player Markers */}
                {playersAtScore.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {playersAtScore.map(player => (
                      <div
                        key={player.playerId}
                        className="relative"
                        data-player-id={player.playerId}
                        title={`${player.playerName}: ${player.score}分${player.isFlipped ? ' (已翻牌 +60)' : ''}${allowAdjustment ? ' (點擊調整)' : ''}`}
                      >
                        <PlayerMarker
                          color={player.color}
                          size="sm"
                          showGlow={player.playerId === currentPlayerId}
                          playerName={player.playerName}
                        />
                        {/* Show +60 badge if player has flipped */}
                        {player.isFlipped && (
                          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-bold px-1 rounded-full border border-white shadow-lg">
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

          // For odd rows (snake pattern), reverse the visual order
          // Use [...cells] to create a copy before reversing
          const displayCells = isReversedRow ? [...cells].reverse() : cells

          return (
            <div
              key={rowIndex}
              className="grid gap-0.5"
              style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}
              data-testid={`score-row-${rowIndex}`}
            >
              {displayCells}
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

              {/* Flip Button */}
              {onFlipToggle && (
                <button
                  type="button"
                  onClick={() => onFlipToggle(player.playerId)}
                  className={cn(
                    'ml-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200',
                    'border-2',
                    player.isFlipped
                      ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30'
                  )}
                  title={player.isFlipped ? '已翻牌：點擊移除 -60 分加成' : '未翻牌：點擊增加 +60 分加成'}
                  data-testid={`flip-button-${player.playerId}`}
                >
                  {player.isFlipped ? '-60' : '+60'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default ScoreTrack
