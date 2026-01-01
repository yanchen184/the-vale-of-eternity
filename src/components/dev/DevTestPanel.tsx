/**
 * Developer Test Panel
 * Quick testing tools for multiplayer game development
 * @version 1.0.0
 */
console.log('[components/dev/DevTestPanel.tsx] v1.0.0 loaded')

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'

interface DevTestPanelProps {
  gameId?: string
  currentPlayerId?: string
  allPlayerIds?: string[]
  onSwitchPlayer?: (playerId: string) => void
}

export function DevTestPanel({
  gameId,
  currentPlayerId,
  allPlayerIds = [],
  onSwitchPlayer,
}: DevTestPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!gameId) return null

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg text-sm font-bold"
      >
        🛠️ Dev Tools
      </button>

      {/* Dev Panel */}
      {isOpen && (
        <div className="fixed top-16 right-4 z-50 w-80">
          <GlassCard variant="default" glow="purple" padding="md">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-purple-400">開發者工具</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Current Player Info */}
              <div className="p-3 bg-slate-800/50 rounded">
                <p className="text-xs text-slate-400 mb-1">當前玩家 ID:</p>
                <p className="text-sm text-white font-mono break-all">{currentPlayerId}</p>
              </div>

              {/* Switch Player */}
              <div>
                <p className="text-sm text-slate-300 mb-2 font-bold">切換玩家視角:</p>
                <div className="space-y-2">
                  {allPlayerIds.map((playerId, index) => (
                    <button
                      key={playerId}
                      onClick={() => onSwitchPlayer?.(playerId)}
                      className={`w-full px-3 py-2 rounded text-sm font-bold transition-colors ${
                        playerId === currentPlayerId
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      玩家 {index + 1}: {playerId === currentPlayerId ? '(當前)' : '切換'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                <p className="text-xs text-blue-300">
                  💡 提示: 切換玩家視角後，你可以代替該玩家進行操作，方便測試多人遊戲流程
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  )
}

export default DevTestPanel
