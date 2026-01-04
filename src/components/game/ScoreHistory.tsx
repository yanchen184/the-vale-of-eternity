/**
 * Score History Component v2.0.0
 * Displays a chronological list of score changes for ALL players
 * Features player color coding, collapsible sections, and improved visual design
 * @version 2.0.0 - Multi-player support with enhanced UI
 */
console.log('[components/game/ScoreHistory.tsx] v2.0.0 loaded')

import { memo, useMemo, useState } from 'react'
import type { ScoreHistoryEntry } from '@/types/game'
import type { PlayerColor } from '@/types/player-color'
import { PLAYER_COLORS } from '@/types/player-color'
import { PlayerMarker } from './PlayerMarker'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface PlayerHistoryData {
  playerId: string
  playerName: string
  color: PlayerColor
  history: ScoreHistoryEntry[]
  currentScore: number
}

export interface ScoreHistoryProps {
  /** Array of all players' history data */
  players: PlayerHistoryData[]
  /** Currently active player ID (for highlighting) */
  currentPlayerId?: string
}

// Legacy single-player interface for backward compatibility
export interface LegacyScoreHistoryProps {
  history: ScoreHistoryEntry[]
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)

  if (minutes < 1) return '剛剛'
  if (minutes < 60) return `${minutes} 分鐘前`
  return formatTime(timestamp)
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ScoreEntryCardProps {
  entry: ScoreHistoryEntry
  color: PlayerColor
  isLatest?: boolean
}

const ScoreEntryCard = memo(function ScoreEntryCard({
  entry,
  color,
  isLatest = false,
}: ScoreEntryCardProps) {
  const colorConfig = PLAYER_COLORS[color]

  return (
    <div
      className={cn(
        'relative p-3 rounded-lg border transition-all duration-200',
        'bg-slate-800/60 hover:bg-slate-800/80',
        isLatest
          ? `border-l-4 ${colorConfig.border} border-t border-r border-b border-t-slate-600/50 border-r-slate-600/50 border-b-slate-600/50`
          : 'border-slate-700/50 hover:border-slate-600/50'
      )}
    >
      {/* Top Row: Card Name & Time */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {entry.cardNameTw && (
            <span
              className={cn(
                'text-sm font-medium truncate',
                colorConfig.text
              )}
            >
              {entry.cardNameTw}
            </span>
          )}
          {entry.cardName && entry.cardNameTw && (
            <span className="text-xs text-slate-500 truncate hidden sm:inline">
              ({entry.cardName})
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {formatRelativeTime(entry.timestamp)}
        </span>
      </div>

      {/* Reason */}
      {entry.reason && (
        <p className="text-xs text-slate-400 mb-2 line-clamp-2">
          {entry.reason}
        </p>
      )}

      {/* Score Change Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Round Badge */}
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700/80 text-slate-300">
          R{entry.round}
        </span>

        {/* Score Flow */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 font-mono">
            {entry.previousScore}
          </span>
          <svg
            className="w-4 h-4 text-slate-500"
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
          <span className="text-sm font-bold text-amber-400 font-mono">
            {entry.newScore}
          </span>
        </div>

        {/* Delta Badge */}
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold',
            entry.delta > 0
              ? 'bg-emerald-500/20 text-emerald-400'
              : entry.delta < 0
              ? 'bg-red-500/20 text-red-400'
              : 'bg-slate-500/20 text-slate-400'
          )}
        >
          {entry.delta > 0 ? '+' : ''}
          {entry.delta}
        </span>
      </div>

      {/* Latest indicator */}
      {isLatest && (
        <div
          className={cn(
            'absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse',
            colorConfig.bg
          )}
        />
      )}
    </div>
  )
})

interface PlayerHistorySectionProps {
  player: PlayerHistoryData
  isCurrentPlayer: boolean
  defaultExpanded?: boolean
}

const PlayerHistorySection = memo(function PlayerHistorySection({
  player,
  isCurrentPlayer,
  defaultExpanded = false,
}: PlayerHistorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isCurrentPlayer)
  const colorConfig = PLAYER_COLORS[player.color]

  // Sort by timestamp (newest first)
  const sortedHistory = useMemo(() => {
    return [...player.history].sort((a, b) => b.timestamp - a.timestamp)
  }, [player.history])

  const hasHistory = sortedHistory.length > 0

  // Calculate total score change
  const totalDelta = useMemo(() => {
    return player.history.reduce((sum, entry) => sum + entry.delta, 0)
  }, [player.history])

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden transition-all duration-300',
        isCurrentPlayer
          ? `border-2 ${colorConfig.border} bg-slate-800/40`
          : 'border-slate-700/50 bg-slate-800/30'
      )}
    >
      {/* Section Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-3 transition-colors duration-200',
          'hover:bg-slate-700/30 focus:outline-none focus:ring-2 focus:ring-inset',
          colorConfig.ring
        )}
      >
        <div className="flex items-center gap-3">
          <PlayerMarker
            color={player.color}
            size="sm"
            showGlow={isCurrentPlayer}
            playerName={player.playerName}
          />
          <div className="flex flex-col items-start">
            <span
              className={cn(
                'font-semibold text-sm',
                isCurrentPlayer ? colorConfig.text : 'text-slate-200'
              )}
            >
              {player.playerName}
            </span>
            <span className="text-xs text-slate-500">
              {hasHistory ? `${player.history.length} 筆記錄` : '尚無記錄'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Current Score */}
          <div className="text-right">
            <div className="text-lg font-bold text-amber-400 font-mono">
              {player.currentScore}
            </div>
            {hasHistory && totalDelta !== 0 && (
              <div
                className={cn(
                  'text-xs font-medium',
                  totalDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {totalDelta > 0 ? '+' : ''}
                {totalDelta} 分
              </div>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <svg
            className={cn(
              'w-5 h-5 text-slate-400 transition-transform duration-200',
              isExpanded ? 'rotate-180' : ''
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* History Entries */}
      {isExpanded && (
        <div className="border-t border-slate-700/50">
          {!hasHistory ? (
            <div className="p-4 text-center">
              <div className="text-slate-500 text-sm">
                尚無分數變化記錄
              </div>
              <div className="text-xs text-slate-600 mt-1">
                打出有直接加分效果的卡片後會顯示在這裡
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {sortedHistory.map((entry, index) => (
                <ScoreEntryCard
                  key={`${entry.timestamp}-${index}`}
                  entry={entry}
                  color={player.color}
                  isLatest={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const ScoreHistory = memo(function ScoreHistory(
  props: ScoreHistoryProps | LegacyScoreHistoryProps
) {
  // Check if using legacy single-player interface
  const isLegacyProps = 'history' in props && !('players' in props)

  // Convert legacy props to new format if needed
  const players: PlayerHistoryData[] = isLegacyProps
    ? [
        {
          playerId: 'legacy',
          playerName: '玩家',
          color: 'green' as PlayerColor,
          history: (props as LegacyScoreHistoryProps).history,
          currentScore:
            (props as LegacyScoreHistoryProps).history.length > 0
              ? (props as LegacyScoreHistoryProps).history.reduce(
                  (_, e) => e.newScore,
                  0
                )
              : 0,
        },
      ]
    : (props as ScoreHistoryProps).players

  const currentPlayerId = isLegacyProps
    ? 'legacy'
    : (props as ScoreHistoryProps).currentPlayerId

  // Calculate total entries across all players
  const totalEntries = useMemo(() => {
    return players.reduce((sum, p) => sum + p.history.length, 0)
  }, [players])

  // Sort players: current player first, then by score
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      // Current player first
      if (a.playerId === currentPlayerId) return -1
      if (b.playerId === currentPlayerId) return 1
      // Then by current score (descending)
      return b.currentScore - a.currentScore
    })
  }, [players, currentPlayerId])

  return (
    <section className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-3">
          {/* Chart Icon */}
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">
              分數變化記錄
            </h3>
            <p className="text-xs text-slate-500">
              {totalEntries > 0
                ? `共 ${totalEntries} 筆記錄`
                : '尚無記錄'}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        {players.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {players.length} 位玩家
            </span>
          </div>
        )}
      </div>

      {/* Player Sections */}
      <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {sortedPlayers.map((player, index) => (
          <PlayerHistorySection
            key={player.playerId}
            player={player}
            isCurrentPlayer={player.playerId === currentPlayerId}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
    </section>
  )
})

export default ScoreHistory
