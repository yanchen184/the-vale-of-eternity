/**
 * Score Manual Control Component
 * Allows manual score adjustment in manual mode
 * @version 1.0.0
 */
console.log('[components/game/ScoreManualControl.tsx] v1.0.0 loaded')

import { useState } from 'react'
import { useGameStore } from '@/stores'
import { Button } from '@/components/ui'
import { Plus, Minus } from 'lucide-react'

// ============================================
// COMPONENT
// ============================================

export function ScoreManualControl() {
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')

  const { adjustScore } = useGameStore()
  const currentScore = useGameStore((state) => state.gameState?.finalScore) ?? 0

  const handleAdjust = () => {
    if (amount === 0) return
    adjustScore(amount, reason)
    // Reset form
    setAmount(0)
    setReason('')
  }

  const handleQuickAdjust = (value: number) => {
    adjustScore(value, '')
  }

  return (
    <section className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <span>🎯</span>
        <span>分數調整</span>
      </h3>

      <div className="space-y-4">
        {/* Current Score Display */}
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-600">
          <div className="text-sm text-slate-400 mb-1">當前分數</div>
          <div className="text-3xl font-bold text-vale-400">
            {currentScore}
          </div>
        </div>

        {/* Score Adjustment Input */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            分數變動 <span className="text-xs">(正數加分，負數扣分)</span>
          </label>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            placeholder="例如: +5 或 -3"
            className="w-full bg-slate-700 text-slate-200 p-2 rounded border border-slate-600 focus:border-vale-500 focus:outline-none"
          />
        </div>

        {/* Reason Input */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            原因 <span className="text-xs text-slate-500">(選填)</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="例如: 特殊規則加分"
            className="w-full bg-slate-700 text-slate-200 p-2 rounded border border-slate-600 focus:border-vale-500 focus:outline-none"
          />
        </div>

        {/* Apply Button */}
        <Button
          onClick={handleAdjust}
          disabled={amount === 0}
          className="w-full"
          data-testid="adjust-score-btn"
        >
          <span className="flex items-center justify-center gap-2">
            <span>✏️</span>
            <span>調整分數 {amount > 0 ? `+${amount}` : amount < 0 ? amount : ''}</span>
          </span>
        </Button>

        {/* Quick Adjustments */}
        <div className="pt-2 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-2">快速調整</div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleQuickAdjust(1)}
              className="text-xs flex items-center justify-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>1</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleQuickAdjust(5)}
              className="text-xs flex items-center justify-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>5</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleQuickAdjust(10)}
              className="text-xs flex items-center justify-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>10</span>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleQuickAdjust(-1)}
              className="text-xs flex items-center justify-center gap-1"
            >
              <Minus className="h-3 w-3" />
              <span>1</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleQuickAdjust(-5)}
              className="text-xs flex items-center justify-center gap-1"
            >
              <Minus className="h-3 w-3" />
              <span>5</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleQuickAdjust(-10)}
              className="text-xs flex items-center justify-center gap-1"
            >
              <Minus className="h-3 w-3" />
              <span>10</span>
            </Button>
          </div>
        </div>

        {/* Preview */}
        {amount !== 0 && (
          <div className="bg-vale-900/20 border border-vale-500/30 p-2 rounded text-center">
            <div className="text-xs text-slate-400">調整後分數</div>
            <div className="text-xl font-bold text-vale-300">
              {currentScore} → {currentScore + amount}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default ScoreManualControl
