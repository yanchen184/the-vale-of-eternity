/**
 * Score History Component v1.0.0
 * Displays a chronological list of score changes throughout the game
 * Similar to OperationHistory component style
 * @version 1.0.0
 */
console.log('[components/game/ScoreHistory.tsx] v1.0.0 loaded')

import type { ScoreHistoryEntry } from '@/types/game'

// ============================================
// TYPES
// ============================================

export interface ScoreHistoryProps {
  /** Array of score history entries */
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

// ============================================
// COMPONENT
// ============================================

export function ScoreHistory({ history }: ScoreHistoryProps) {
  const hasHistory = history.length > 0

  // Sort by timestamp (newest first)
  const sortedHistory = hasHistory
    ? [...history].sort((a, b) => b.timestamp - a.timestamp)
    : []

  return (
    <section className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <span>📊</span>
          <span>分數變化記錄</span>
          {hasHistory && (
            <span className="text-xs text-slate-500">
              ({history.length})
            </span>
          )}
        </h3>
      </div>

      {/* History List */}
      <div className="max-h-72 overflow-y-auto space-y-2">
        {!hasHistory ? (
          <div className="text-center py-8">
            <div className="text-slate-500 text-sm">尚無分數變化記錄</div>
            <div className="text-xs text-slate-600 mt-1">
              打出有直接加分效果的卡片後會顯示在這裡
            </div>
          </div>
        ) : (
          sortedHistory.map((entry, index) => (
            <div
              key={`${entry.timestamp}-${index}`}
              className="bg-slate-700/50 p-3 rounded border border-slate-600 hover:border-slate-500 transition-colors"
            >
              {/* Header: Card Name & Time */}
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  {entry.cardNameTw && entry.cardName && (
                    <>
                      <span className="text-sm">⚡</span>
                      <span className="text-sm text-slate-300 font-medium">
                        {entry.cardNameTw}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({entry.cardName})
                      </span>
                    </>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {formatTime(entry.timestamp)}
                </span>
              </div>

              {/* Reason */}
              {entry.reason && (
                <div className="text-xs text-slate-400 mb-2">
                  {entry.reason}
                </div>
              )}

              {/* Score Change */}
              <div className="flex items-center gap-2">
                {/* Round Badge */}
                <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-slate-300">
                  第 {entry.round} 回合
                </span>

                {/* Previous Score */}
                <span className="text-xs text-slate-400">
                  {entry.previousScore} 分
                </span>

                {/* Arrow */}
                <span className="text-xs text-slate-500">→</span>

                {/* New Score */}
                <span className="text-sm font-bold text-amber-400">
                  {entry.newScore} 分
                </span>

                {/* Delta Badge */}
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    entry.delta > 0
                      ? 'bg-green-500/20 text-green-400'
                      : entry.delta < 0
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {entry.delta > 0 ? '+' : ''}
                  {entry.delta}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default ScoreHistory
