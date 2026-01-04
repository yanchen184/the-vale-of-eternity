/**
 * FreeStoneSelectionModal Component v1.0.0
 * Modal for freely selecting stones from bank to pay
 * Used by Incense Burner artifact for flexible payment
 * @version 1.0.0
 */
console.log('[components/game/FreeStoneSelectionModal.tsx] v1.0.0 loaded')

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

export interface FreeStoneSelectionModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** Current player stones in bank (6 slots) */
  bankStones: StonePool
  /** Required payment amount */
  requiredAmount: number
  /** Callback when payment is confirmed */
  onConfirmPayment: (selectedStones: Partial<StonePool>) => void
  /** Optional title override */
  title?: string
  /** Optional description override */
  description?: string
}

// ============================================
// STONE CONFIG
// ============================================

const STONE_CONFIGS = {
  [StoneType.ONE]: {
    label: '紅石',
    value: 1,
    color: 'text-red-400',
    bgColor: 'bg-red-900/50',
    borderColor: 'border-red-500/50',
    hoverBg: 'hover:bg-red-800/70',
    selectedBg: 'bg-red-600',
  },
  [StoneType.THREE]: {
    label: '藍石',
    value: 3,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/50',
    borderColor: 'border-blue-500/50',
    hoverBg: 'hover:bg-blue-800/70',
    selectedBg: 'bg-blue-600',
  },
  [StoneType.SIX]: {
    label: '紫石',
    value: 6,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/50',
    borderColor: 'border-purple-500/50',
    hoverBg: 'hover:bg-purple-800/70',
    selectedBg: 'bg-purple-600',
  },
}

// ============================================
// STONE SLOT COMPONENT
// ============================================

interface StoneSlotProps {
  stoneType: StoneType
  slotIndex: number
  isSelected: boolean
  onToggle: () => void
  disabled: boolean
}

const StoneSlot = memo(function StoneSlot({
  stoneType,
  slotIndex,
  isSelected,
  onToggle,
  disabled,
}: StoneSlotProps) {
  const config = STONE_CONFIGS[stoneType as keyof typeof STONE_CONFIGS]

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'relative w-20 h-20 rounded-xl border-2 transition-all duration-200',
        'flex flex-col items-center justify-center gap-1',
        'cursor-pointer',
        disabled && 'opacity-30 cursor-not-allowed',
        !disabled && 'hover:scale-110 hover:shadow-lg',
        isSelected
          ? `${config.selectedBg} border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-400/30`
          : `${config.bgColor} ${config.borderColor} ${!disabled && config.hoverBg}`
      )}
      data-testid={`stone-slot-${stoneType}-${slotIndex}`}
    >
      {/* Stone value */}
      <div className={cn('text-2xl font-bold', config.color)}>
        {config.value}
      </div>

      {/* Stone label */}
      <div className="text-xs text-slate-300">
        {config.label}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 border-2 border-amber-300 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const FreeStoneSelectionModal = memo(function FreeStoneSelectionModal({
  isOpen,
  onClose,
  bankStones,
  requiredAmount,
  onConfirmPayment,
  title = '選擇支付石頭',
  description = '從銀行的石頭中選擇要支付的組合',
}: FreeStoneSelectionModalProps) {
  // Track selected stones count for each type
  const [selectedStones, setSelectedStones] = useState<Partial<StonePool>>({
    [StoneType.ONE]: 0,
    [StoneType.THREE]: 0,
    [StoneType.SIX]: 0,
  })

  // Calculate total value of selected stones
  const totalValue = useMemo(() => {
    return (
      (selectedStones[StoneType.ONE] ?? 0) * 1 +
      (selectedStones[StoneType.THREE] ?? 0) * 3 +
      (selectedStones[StoneType.SIX] ?? 0) * 6
    )
  }, [selectedStones])

  // Check if payment is valid (>= required amount)
  const isValidPayment = totalValue >= requiredAmount

  // Handle stone toggle
  const handleToggleStone = useCallback((stoneType: StoneType) => {
    setSelectedStones(prev => {
      const currentCount = prev[stoneType] ?? 0
      const maxCount = bankStones[stoneType] ?? 0

      // Toggle: if already at max, reset to 0; otherwise increment
      const newCount = currentCount >= maxCount ? 0 : currentCount + 1

      return {
        ...prev,
        [stoneType]: newCount,
      }
    })
  }, [bankStones])

  // Handle close and reset
  const handleClose = useCallback(() => {
    setSelectedStones({
      [StoneType.ONE]: 0,
      [StoneType.THREE]: 0,
      [StoneType.SIX]: 0,
    })
    onClose()
  }, [onClose])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (!isValidPayment) return
    onConfirmPayment(selectedStones)
    setSelectedStones({
      [StoneType.ONE]: 0,
      [StoneType.THREE]: 0,
      [StoneType.SIX]: 0,
    })
  }, [isValidPayment, selectedStones, onConfirmPayment])

  // Generate stone slots (6 total from bank)
  const stoneSlots = useMemo(() => {
    const slots: Array<{ type: StoneType; index: number }> = []

    // Add slots for each stone type based on bank count
    for (let i = 0; i < (bankStones[StoneType.SIX] ?? 0); i++) {
      slots.push({ type: StoneType.SIX, index: i })
    }
    for (let i = 0; i < (bankStones[StoneType.THREE] ?? 0); i++) {
      slots.push({ type: StoneType.THREE, index: i })
    }
    for (let i = 0; i < (bankStones[StoneType.ONE] ?? 0); i++) {
      slots.push({ type: StoneType.ONE, index: i })
    }

    return slots
  }, [bankStones])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      <div className="p-4 space-y-4" data-testid="free-stone-selection-modal">
        {/* Description */}
        <GlassCard variant="default" padding="sm" className="bg-amber-900/20">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-amber-300">
              需要支付 {requiredAmount} 分價值的石頭
            </h3>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </GlassCard>

        {/* Current selection summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <span className="text-sm text-slate-400">已選擇：</span>
          <div className="flex items-center gap-2">
            {selectedStones[StoneType.SIX]! > 0 && (
              <span className="text-sm text-purple-300">
                {selectedStones[StoneType.SIX]} × 6分
              </span>
            )}
            {selectedStones[StoneType.THREE]! > 0 && (
              <span className="text-sm text-blue-300">
                {selectedStones[StoneType.THREE]} × 3分
              </span>
            )}
            {selectedStones[StoneType.ONE]! > 0 && (
              <span className="text-sm text-red-300">
                {selectedStones[StoneType.ONE]} × 1分
              </span>
            )}
          </div>
          <div
            className={cn(
              'px-3 py-1 rounded-full text-sm font-bold',
              isValidPayment
                ? 'bg-green-900/50 text-green-300 border border-green-500/50'
                : 'bg-slate-800 text-slate-400 border border-slate-600'
            )}
          >
            總計: {totalValue} 分
          </div>
        </div>

        {/* Stone Bank (6 slots) */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-300">銀行石頭（點擊選擇）：</h4>
          <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
            {stoneSlots.map(({ type, index }) => {
              const isSelected = (selectedStones[type] ?? 0) > index
              return (
                <StoneSlot
                  key={`${type}-${index}`}
                  stoneType={type}
                  slotIndex={index}
                  isSelected={isSelected}
                  onToggle={() => handleToggleStone(type)}
                  disabled={false}
                />
              )
            })}

            {stoneSlots.length === 0 && (
              <div className="col-span-3 text-center py-8 text-slate-500">
                銀行沒有石頭可用
              </div>
            )}
          </div>
        </div>

        {/* Hint */}
        {!isValidPayment && totalValue > 0 && (
          <div className="text-center text-sm text-orange-400">
            還需要 {requiredAmount - totalValue} 分
          </div>
        )}
        {isValidPayment && totalValue > requiredAmount && (
          <div className="text-center text-sm text-yellow-400">
            ⚠️ 超額支付 {totalValue - requiredAmount} 分（找零將不會退還）
          </div>
        )}

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
            disabled={!isValidPayment}
            className={cn(
              'flex-1',
              isValidPayment
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                : 'bg-slate-700 cursor-not-allowed'
            )}
            data-testid="confirm-free-payment-btn"
          >
            {isValidPayment ? '確認支付' : `還需要 ${requiredAmount - totalValue} 分`}
          </Button>
        </div>
      </div>
    </Modal>
  )
})

export default FreeStoneSelectionModal
