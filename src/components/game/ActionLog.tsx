/**
 * ActionLog Component
 * Displays game action history in bottom-left corner
 * Shows recent actions with player colors and details
 * @version 1.1.0 - Added minimize/expand functionality
 */
console.log('[components/game/ActionLog.tsx] v1.1.0 loaded')

import { memo, useMemo, useRef, useEffect, useState } from 'react'
import { PlayerMarker } from './PlayerMarker'
import type { ActionLogEntry } from '@/services/multiplayer-game'
import type { PlayerColor } from '@/types/player-color'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface ActionLogProps {
  /** Action log entries */
  logs: ActionLogEntry[]
  /** Player colors for markers */
  playerColors: Record<string, PlayerColor>
  /** Maximum number of logs to display */
  maxLogs?: number
  /** Additional CSS classes */
  className?: string
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get action label in Chinese
 */
function getActionLabel(action: string): string {
  const actionMap: Record<string, string> = {
    draw: '抽牌',
    sell: '賣掉',
    tame: '召喚',
    pass: '跳過',
    return: '回手',
    discard: '棄置',
    move_to_hand: '上手',
    move_to_sanctuary: '移至棲息地',
    move_from_sanctuary: '從棲息地移回',
    select_artifact: '選擇神器',
    toggle_zone: '切換區域',
  }
  return actionMap[action] || action
}

/**
 * Get action color
 */
function getActionColor(action: string): string {
  const colorMap: Record<string, string> = {
    draw: 'text-blue-400',
    sell: 'text-amber-400',
    tame: 'text-green-400',
    pass: 'text-slate-400',
    return: 'text-purple-400',
    discard: 'text-red-400',
    move_to_hand: 'text-cyan-400',
    move_to_sanctuary: 'text-emerald-400',
    move_from_sanctuary: 'text-indigo-400',
    select_artifact: 'text-yellow-400',
    toggle_zone: 'text-pink-400',
  }
  return colorMap[action] || 'text-slate-300'
}

// ============================================
// MAIN COMPONENT
// ============================================

export const ActionLog = memo(function ActionLog({
  logs,
  playerColors,
  maxLogs = 50,
  className,
}: ActionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  // Get recent logs (reverse order - newest first)
  const displayLogs = useMemo(() => {
    return [...logs]
      .reverse()
      .slice(0, maxLogs)
  }, [logs, maxLogs])

  // Auto-scroll to bottom when new log is added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [logs.length])

  // Minimized view
  if (isMinimized) {
    return (
      <div
        className={cn(
          'bg-slate-900/80 backdrop-blur-sm rounded-lg border-2 border-slate-700/50 p-2',
          'cursor-pointer hover:bg-slate-900/90 transition-colors',
          className
        )}
        onClick={() => setIsMinimized(false)}
        data-testid="action-log-minimized"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-300">📜</span>
          <span className="text-xs text-slate-400">操作紀錄 ({logs.length})</span>
          <span className="text-xs text-slate-500 ml-auto">點擊展開</span>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div
        className={cn(
          'bg-slate-900/80 backdrop-blur-sm rounded-lg border-2 border-slate-700/50 p-4',
          className
        )}
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
          <span className="text-sm font-bold text-slate-300">📜 操作紀錄</span>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            title="最小化"
          >
            ➖
          </button>
        </div>
        <div className="text-center text-slate-600 text-sm py-4">
          尚無操作記錄
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-slate-900/80 backdrop-blur-sm rounded-lg border-2 border-slate-700/50 p-4',
        className
      )}
      data-testid="action-log"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
        <span className="text-sm font-bold text-slate-300">📜 操作紀錄</span>
        <span className="text-xs text-slate-500">({logs.length})</span>
        <button
          onClick={() => setIsMinimized(true)}
          className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
          title="最小化"
        >
          ➖
        </button>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="space-y-2 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50"
      >
        {displayLogs.map((log) => {
          const playerColor = playerColors[log.playerId] || 'green'
          const actionLabel = getActionLabel(log.action)
          const actionColor = getActionColor(log.action)

          return (
            <div
              key={log.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
              data-testid={`log-entry-${log.id}`}
            >
              {/* Player Marker */}
              <div className="flex-shrink-0 mt-0.5">
                <PlayerMarker
                  color={playerColor}
                  size="sm"
                  showGlow={false}
                  playerName={log.playerName}
                />
              </div>

              {/* Log Content */}
              <div className="flex-1 min-w-0 text-xs">
                {/* Player name and action */}
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-300">
                    {log.playerName}
                  </span>
                  <span className={cn('font-medium', actionColor)}>
                    {actionLabel}
                  </span>
                  {log.cardName && (
                    <span className="text-slate-400">
                      「{log.cardName}」
                    </span>
                  )}
                </div>

                {/* Details */}
                {log.details && (
                  <div className="text-slate-500 mt-0.5">
                    {log.details}
                  </div>
                )}

                {/* Round badge */}
                <div className="mt-1">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-400">
                    R{log.round}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default ActionLog
