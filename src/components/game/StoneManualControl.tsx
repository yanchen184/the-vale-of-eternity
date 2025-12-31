/**
 * Stone Manual Control Component
 * Allows manual addition and removal of stones in manual mode
 * @version 1.0.0
 */
console.log('[components/game/StoneManualControl.tsx] v1.0.0 loaded')

import { useState } from 'react'
import { StoneType } from '@/types/cards'
import { useGameStore } from '@/stores'
import { Button } from '@/components/ui'
import { Plus, Minus } from 'lucide-react'

// ============================================
// COMPONENT
// ============================================

export function StoneManualControl() {
  const [selectedType, setSelectedType] = useState<StoneType>(StoneType.ONE)
  const [amount, setAmount] = useState(1)

  const { addStones, removeStones } = useGameStore()
  const stones = useGameStore((state) => state.gameState?.player.stones)

  // Current stone count for selected type
  const currentAmount = stones?.[selectedType] ?? 0

  const handleAdd = () => {
    addStones(selectedType, amount)
  }

  const handleRemove = () => {
    removeStones(selectedType, amount)
  }

  return (
    <section className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <span>💎</span>
        <span>石頭管理</span>
      </h3>

      <div className="space-y-4">
        {/* Current Stone Display */}
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-600">
          <div className="text-sm text-slate-400 mb-1">當前石頭數量</div>
          <div className="text-2xl font-bold text-amber-400">
            {currentAmount} 個 {selectedType}
          </div>
        </div>

        {/* Stone Type Selection */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">石頭類型</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as StoneType)}
            className="w-full bg-slate-700 text-slate-200 p-2 rounded border border-slate-600 focus:border-vale-500 focus:outline-none"
          >
            <option value={StoneType.ONE}>1點石頭 (ONE)</option>
            <option value={StoneType.THREE}>3點石頭 (THREE)</option>
            <option value={StoneType.SIX}>6點石頭 (SIX)</option>
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">數量</label>
          <input
            type="number"
            min="1"
            max="99"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
            className="w-full bg-slate-700 text-slate-200 p-2 rounded border border-slate-600 focus:border-vale-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2"
            data-testid="add-stones-btn"
          >
            <Plus className="h-4 w-4" />
            <span>增加</span>
          </Button>
          <Button
            onClick={handleRemove}
            variant="secondary"
            className="flex items-center justify-center gap-2"
            disabled={currentAmount < amount}
            data-testid="remove-stones-btn"
          >
            <Minus className="h-4 w-4" />
            <span>減少</span>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-2">快速操作</div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAmount(1)
                handleAdd()
              }}
              className="text-xs"
            >
              +1
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAmount(5)
                handleAdd()
              }}
              className="text-xs"
            >
              +5
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAmount(10)
                handleAdd()
              }}
              className="text-xs"
            >
              +10
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default StoneManualControl
