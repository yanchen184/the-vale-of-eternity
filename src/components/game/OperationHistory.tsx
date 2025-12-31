/**
 * Operation History Component
 * Displays manual operation history with undo/clear functionality
 * @version 1.0.0
 */
console.log('[components/game/OperationHistory.tsx] v1.0.0 loaded')

import { useGameStore } from '@/stores'
import { Button } from '@/components/ui'
import { Undo, Trash2 } from 'lucide-react'

// ============================================
// COMPONENT
// ============================================

export function OperationHistory() {
  const manualOperations = useGameStore((state) => state.gameState?.manualOperations) ?? []
  const { undoOperation, clearHistory } = useGameStore()

  const hasOperations = manualOperations.length > 0

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <section className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <span>📜</span>
          <span>操作記錄</span>
          {hasOperations && (
            <span className="text-xs text-slate-500">
              ({manualOperations.length})
            </span>
          )}
        </h3>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={undoOperation}
            disabled={!hasOperations}
            className="flex items-center gap-1"
            data-testid="undo-btn"
          >
            <Undo className="h-3 w-3" />
            <span>撤銷</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearHistory}
            disabled={!hasOperations}
            className="flex items-center gap-1 text-red-400 hover:text-red-300"
            data-testid="clear-history-btn"
          >
            <Trash2 className="h-3 w-3" />
            <span>清空</span>
          </Button>
        </div>
      </div>

      {/* Operations List */}
      <div className="max-h-72 overflow-y-auto space-y-2">
        {!hasOperations ? (
          <div className="text-center py-8">
            <div className="text-slate-500 text-sm">尚無操作記錄</div>
            <div className="text-xs text-slate-600 mt-1">
              使用上方功能進行操作後會顯示在這裡
            </div>
          </div>
        ) : (
          [...manualOperations].reverse().map((op, index) => (
            <div
              key={op.id}
              className="bg-slate-700/50 p-3 rounded border border-slate-600 hover:border-slate-500 transition-colors"
              data-testid={`operation-${manualOperations.length - index - 1}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm text-slate-300 font-medium">
                  {op.description}
                </span>
                <span className="text-xs text-slate-500">
                  {formatTime(op.timestamp)}
                </span>
              </div>

              {/* Operation Type Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-slate-300">
                  {getOperationTypeLabel(op.type)}
                </span>
                {!op.canUndo && (
                  <span className="text-xs text-amber-400">
                    ⚠️ 不可撤銷
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

// ============================================
// UTILITIES
// ============================================

function getOperationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ADD_STONES: '增加石頭',
    REMOVE_STONES: '減少石頭',
    ADJUST_SCORE: '調整分數',
    TRIGGER_EFFECT: '觸發效果',
    MOVE_CARD: '移動卡片',
    CUSTOM: '自訂操作',
  }
  return labels[type] || type
}

export default OperationHistory
