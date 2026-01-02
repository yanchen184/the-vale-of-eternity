/**
 * GameActionLog Component
 * Displays game action history in a scrollable list
 * @version 1.0.0
 */
console.log('[components/game/GameActionLog.tsx] v1.0.0 loaded')

import { memo, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { GameActionLog as GameActionLogType } from '@/types/game-log'
import { PLAYER_COLORS } from '@/types/player-color'
import { formatCoinChange } from '@/types/game-log'

// ============================================
// TYPES
// ============================================

export interface GameActionLogProps {
  /** Array of log entries (sorted newest first) */
  logs: GameActionLogType[]
  /** Maximum number of logs to display */
  maxDisplay?: number
  /** Additional CSS classes */
  className?: string
}

// ============================================
// LOG ENTRY COMPONENT
// ============================================

interface LogEntryProps {
  log: GameActionLogType
}

const LogEntry = memo(function LogEntry({ log }: LogEntryProps) {
  const playerColorConfig = PLAYER_COLORS[log.playerColor]
  const formattedTime = new Date(log.timestamp).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2 rounded-md transition-colors',
        'hover:bg-slate-700/20'
      )}
      data-testid={`log-entry-${log.id}`}
    >
      {/* Player Color Indicator */}
      <div
        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
        style={{ backgroundColor: playerColorConfig.hex }}
        title={playerColorConfig.nameTw}
      />

      {/* Log Content */}
      <div className="flex-1 min-w-0">
        {/* Description */}
        <div
          className="text-xs leading-relaxed break-words"
          style={{ color: `${playerColorConfig.hex}dd` }}
        >
          {log.description}
        </div>

        {/* Coin Change (if applicable) */}
        {log.coinsChange && (
          <div className="text-[10px] text-amber-400 mt-0.5">
            {formatCoinChange(log.coinsChange)}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-[10px] text-slate-500 mt-0.5">{formattedTime}</div>
      </div>

      {/* Round Badge */}
      <div className="text-[10px] text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded flex-shrink-0">
        R{log.round}
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const GameActionLog = memo(function GameActionLog({
  logs,
  maxDisplay = 5,
  className,
}: GameActionLogProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevLogsLengthRef = useRef(logs.length)

  // Auto-scroll to top when new log is added
  useEffect(() => {
    if (logs.length > prevLogsLengthRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
    prevLogsLengthRef.current = logs.length
  }, [logs.length])

  // Limit displayed logs
  const displayedLogs = logs.slice(0, maxDisplay * 3) // Keep more in DOM for smooth scrolling

  return (
    <div
      className={cn(
        'bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/30 p-3',
        className
      )}
      data-testid="game-action-log"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-300">操作記錄</h3>
        <span className="text-xs text-slate-500">{logs.length} 條</span>
      </div>

      {/* Log List Container */}
      <div
        ref={scrollContainerRef}
        className="space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/20"
        style={{
          maxHeight: `${maxDisplay * 56}px`, // Each log entry is ~56px
        }}
      >
        {displayedLogs.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-xs">
            尚無操作記錄
          </div>
        ) : (
          displayedLogs.map((log) => <LogEntry key={log.id} log={log} />)
        )}
      </div>

      {/* Scroll Hint (if more logs exist) */}
      {logs.length > maxDisplay && (
        <div className="text-center text-[10px] text-slate-600 mt-2 pt-2 border-t border-slate-700/30">
          向下滾動查看更多記錄
        </div>
      )}
    </div>
  )
})

export default GameActionLog
