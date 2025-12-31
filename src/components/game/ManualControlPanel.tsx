/**
 * Manual Control Panel Component
 * Container for all manual mode controls
 * @version 1.0.0
 */
console.log('[components/game/ManualControlPanel.tsx] v1.0.0 loaded')

import { StoneManualControl } from './StoneManualControl'
import { ScoreManualControl } from './ScoreManualControl'
import { OperationHistory } from './OperationHistory'

// ============================================
// COMPONENT
// ============================================

export function ManualControlPanel() {
  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border-2 border-amber-500/30 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🎮</span>
        <div>
          <h2 className="text-2xl font-bold text-amber-400">手動控制面板</h2>
          <p className="text-xs text-slate-400 mt-1">
            在手動模式下,您可以自由調整遊戲狀態
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Stone & Score Controls */}
        <div className="space-y-6">
          <StoneManualControl />
          <ScoreManualControl />
        </div>

        {/* Right Column: Operation History */}
        <div>
          <OperationHistory />
        </div>
      </div>
    </div>
  )
}

export default ManualControlPanel
