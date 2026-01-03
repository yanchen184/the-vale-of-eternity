/**
 * StoneUpgradeModal Component v1.0.0
 * Modal for Book of Thoth stone upgrade selection
 * Allows upgrading up to 2 stones: Red -> Blue -> Green -> Purple
 * @version 1.0.0
 */
console.log('[components/game/StoneUpgradeModal.tsx] v1.0.0 loaded')

import { memo, useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { StoneType } from '@/types/cards'
import type { StonePool } from '@/types/game'

// ============================================
// TYPES
// ============================================

export interface StoneUpgradeModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** Current player stones */
  playerStones: StonePool
  /** Maximum upgrades allowed (default 2) */
  maxUpgrades?: number
  /** Callback when upgrades are confirmed */
  onConfirmUpgrades: (upgrades: StoneUpgrade[]) => void
}

export interface StoneUpgrade {
  from: StoneType
  to: StoneType
}

// ============================================
// STONE UPGRADE CONFIG
// ============================================

interface StoneConfig {
  type: StoneType
  label: string
  color: string
  bgColor: string
  borderColor: string
  value: number
  canUpgradeTo: StoneType | null
}

const STONE_CONFIGS: StoneConfig[] = [
  {
    type: StoneType.ONE,
    label: '紅石',
    color: 'text-red-400',
    bgColor: 'bg-red-900/50',
    borderColor: 'border-red-500/50',
    value: 1,
    canUpgradeTo: StoneType.THREE,
  },
  {
    type: StoneType.THREE,
    label: '藍石',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/50',
    borderColor: 'border-blue-500/50',
    value: 3,
    canUpgradeTo: StoneType.SIX,
  },
  {
    type: StoneType.SIX,
    label: '紫石',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/50',
    borderColor: 'border-purple-500/50',
    value: 6,
    canUpgradeTo: null, // Purple (6-point) is the highest level
  },
]

const STONE_TYPE_TO_CONFIG = new Map(STONE_CONFIGS.map(c => [c.type, c]))

// ============================================
// STONE DISPLAY COMPONENT
// ============================================

interface StoneDisplayProps {
  type: StoneType
  count: number
  pendingChange: number // positive = gaining, negative = losing
  canUpgrade: boolean
  onUpgrade: () => void
  onUndoUpgrade: () => void
  upgradesFromThis: number
}

const StoneDisplay = memo(function StoneDisplay({
  type,
  count,
  pendingChange,
  canUpgrade,
  onUpgrade,
  onUndoUpgrade,
  upgradesFromThis,
}: StoneDisplayProps) {
  const config = STONE_TYPE_TO_CONFIG.get(type)
  if (!config) return null

  const effectiveCount = count + pendingChange
  const isGaining = pendingChange > 0
  const isLosing = pendingChange < 0

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 transition-all',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
              config.bgColor,
              config.color
            )}
          >
            {config.value}
          </div>
          <span className={cn('font-bold', config.color)}>{config.label}</span>
        </div>

        {/* Count display */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-2xl font-bold',
              isGaining && 'text-green-400',
              isLosing && 'text-red-400',
              !isGaining && !isLosing && 'text-slate-200'
            )}
          >
            {effectiveCount}
          </span>
          {pendingChange !== 0 && (
            <span
              className={cn(
                'text-sm',
                isGaining ? 'text-green-400' : 'text-red-400'
              )}
            >
              ({isGaining ? '+' : ''}{pendingChange})
            </span>
          )}
        </div>
      </div>

      {/* Upgrade controls */}
      <div className="flex gap-2">
        {config.canUpgradeTo && (
          <Button
            size="sm"
            onClick={onUpgrade}
            disabled={!canUpgrade || count + pendingChange <= 0}
            className={cn(
              'flex-1 text-xs',
              canUpgrade && count + pendingChange > 0
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                : 'bg-slate-700 cursor-not-allowed'
            )}
          >
            升级 +
          </Button>
        )}

        {upgradesFromThis > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onUndoUpgrade}
            className="flex-1 text-xs border-red-500/50 text-red-400 hover:bg-red-900/30"
          >
            撤销 ({upgradesFromThis})
          </Button>
        )}
      </div>
    </div>
  )
})

// ============================================
// UPGRADE PREVIEW COMPONENT
// ============================================

interface UpgradePreviewProps {
  upgrades: StoneUpgrade[]
  onRemoveUpgrade: (index: number) => void
}

const UpgradePreview = memo(function UpgradePreview({
  upgrades,
  onRemoveUpgrade,
}: UpgradePreviewProps) {
  if (upgrades.length === 0) {
    return (
      <div className="text-center py-4 text-slate-500 text-sm">
        點擊「升級」按鈕選擇要升級的石頭
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-slate-300">升级预览：</h4>
      <div className="flex flex-wrap gap-2">
        {upgrades.map((upgrade, index) => {
          const fromConfig = STONE_TYPE_TO_CONFIG.get(upgrade.from)
          const toConfig = STONE_TYPE_TO_CONFIG.get(upgrade.to)

          return (
            <button
              key={index}
              type="button"
              onClick={() => onRemoveUpgrade(index)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                'bg-slate-800/50 border border-slate-600',
                'hover:bg-red-900/30 hover:border-red-500/50',
                'transition-all group'
              )}
            >
              <span className={fromConfig?.color}>{fromConfig?.label}</span>
              <span className="text-slate-500">→</span>
              <span className={toConfig?.color}>{toConfig?.label}</span>
              <span className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                ✕
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const StoneUpgradeModal = memo(function StoneUpgradeModal({
  isOpen,
  onClose,
  playerStones,
  maxUpgrades = 2,
  onConfirmUpgrades,
}: StoneUpgradeModalProps) {
  const [upgrades, setUpgrades] = useState<StoneUpgrade[]>([])

  // Calculate pending changes for each stone type
  const pendingChanges = useMemo(() => {
    const changes: Partial<Record<StoneType, number>> = {}

    upgrades.forEach(upgrade => {
      changes[upgrade.from] = (changes[upgrade.from] || 0) - 1
      changes[upgrade.to] = (changes[upgrade.to] || 0) + 1
    })

    return changes
  }, [upgrades])

  // Count upgrades from each stone type
  const upgradesFromType = useMemo(() => {
    const counts: Partial<Record<StoneType, number>> = {}
    upgrades.forEach(upgrade => {
      counts[upgrade.from] = (counts[upgrade.from] || 0) + 1
    })
    return counts
  }, [upgrades])

  // Check if more upgrades can be added
  const canAddUpgrade = upgrades.length < maxUpgrades

  // Handle adding an upgrade
  const handleAddUpgrade = useCallback((fromType: StoneType) => {
    if (!canAddUpgrade) return

    const config = STONE_TYPE_TO_CONFIG.get(fromType)
    if (!config?.canUpgradeTo) return

    // Check if player has enough stones (considering pending changes)
    const currentCount = playerStones[fromType] || 0
    const pendingChange = pendingChanges[fromType] || 0
    if (currentCount + pendingChange <= 0) return

    // RULE: Cannot chain-upgrade the same stone instance
    // ALLOWED: Red->Blue, Red->Blue (2 different red stones each become blue)
    // FORBIDDEN: Red->Blue, Blue->Purple (upgrading the blue stone that was just created from red)
    //
    // Check if we're trying to upgrade a stone that was created by a previous upgrade
    const wouldCreateChain = upgrades.some(u => u.to === fromType)
    if (wouldCreateChain) {
      console.log('[StoneUpgradeModal] Cannot chain-upgrade: a stone just created from upgrade cannot be upgraded again')
      return
    }

    setUpgrades(prev => [
      ...prev,
      { from: fromType, to: config.canUpgradeTo! }
    ])
  }, [canAddUpgrade, playerStones, pendingChanges, upgrades])

  // Handle removing an upgrade by index
  const handleRemoveUpgrade = useCallback((index: number) => {
    setUpgrades(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Handle undoing upgrades from a specific type
  const handleUndoUpgrade = useCallback((fromType: StoneType) => {
    setUpgrades(prev => {
      const index = prev.findIndex(u => u.from === fromType)
      if (index === -1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // Handle close
  const handleClose = useCallback(() => {
    setUpgrades([])
    onClose()
  }, [onClose])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    onConfirmUpgrades(upgrades)
    setUpgrades([])
    onClose()
  }, [upgrades, onConfirmUpgrades, onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="透特之書 - 石頭升級"
      size="lg"
    >
      <div className="p-4 space-y-4" data-testid="stone-upgrade-modal">
        {/* Description */}
        <GlassCard variant="default" padding="sm" className="bg-purple-900/20">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-amber-300">透特之書</h3>
            <p className="text-sm text-slate-400">
              將你的石頭提升一級，最多2次（紅→藍→紫）
            </p>
            <p className="text-xs text-slate-500">
              剩餘升級次數: {maxUpgrades - upgrades.length} · 不能連鎖升級同一個石頭
            </p>
          </div>
        </GlassCard>

        {/* Stone Grid */}
        <div className="grid grid-cols-3 gap-3">
          {STONE_CONFIGS.map(config => (
            <StoneDisplay
              key={config.type}
              type={config.type}
              count={playerStones[config.type] || 0}
              pendingChange={pendingChanges[config.type] || 0}
              canUpgrade={canAddUpgrade && !!config.canUpgradeTo}
              onUpgrade={() => handleAddUpgrade(config.type)}
              onUndoUpgrade={() => handleUndoUpgrade(config.type)}
              upgradesFromThis={upgradesFromType[config.type] || 0}
            />
          ))}
        </div>

        {/* Upgrade Preview */}
        <UpgradePreview
          upgrades={upgrades}
          onRemoveUpgrade={handleRemoveUpgrade}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={upgrades.length === 0}
            className={cn(
              'flex-1',
              upgrades.length > 0
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                : 'bg-slate-700 cursor-not-allowed'
            )}
            data-testid="confirm-upgrade-btn"
          >
            確認升級 ({upgrades.length})
          </Button>
        </div>
      </div>
    </Modal>
  )
})

export default StoneUpgradeModal
