/**
 * StonePaymentModal Component v1.0.0
 * Modal for selecting stone payment combination
 * Used by Incense Burner artifact for purchasing cards
 * @version 1.0.0
 */
console.log('[components/game/StonePaymentModal.tsx] v1.0.0 loaded')

import { memo, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import type { StonePaymentOption } from '@/lib/single-player-engine'
import type { StonePool } from '@/types/game'

// ============================================
// TYPES
// ============================================

export interface StonePaymentModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** Current player stones */
  playerStones: StonePool
  /** Available payment options */
  paymentOptions: StonePaymentOption[]
  /** Required payment amount */
  paymentAmount: number
  /** Callback when payment is confirmed */
  onConfirmPayment: (payment: Partial<StonePool>) => void
  /** Optional title override */
  title?: string
}

// ============================================
// STONE CONFIG
// ============================================

const STONE_CONFIGS = {
  ONE: {
    label: '紅石',
    value: 1,
    color: 'text-red-400',
    bgColor: 'bg-red-900/50',
    borderColor: 'border-red-500/50',
  },
  THREE: {
    label: '藍石',
    value: 3,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/50',
    borderColor: 'border-blue-500/50',
  },
  SIX: {
    label: '紫石',
    value: 6,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/50',
    borderColor: 'border-purple-500/50',
  },
}

// ============================================
// PAYMENT OPTION CARD COMPONENT
// ============================================

interface PaymentOptionCardProps {
  option: StonePaymentOption
  isSelected: boolean
  onSelect: () => void
}

const PaymentOptionCard = memo(function PaymentOptionCard({
  option,
  isSelected,
  onSelect,
}: PaymentOptionCardProps) {
  // Calculate total value
  const totalValue =
    (option.stones.ONE ?? 0) * 1 +
    (option.stones.THREE ?? 0) * 3 +
    (option.stones.SIX ?? 0) * 6

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
        'cursor-pointer hover:scale-[1.02]',
        isSelected
          ? 'border-amber-500 bg-amber-900/30 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20'
          : 'border-slate-600 bg-slate-800/50 hover:border-purple-500/50 hover:bg-purple-900/20'
      )}
      data-testid={`payment-option-${option.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Selection indicator */}
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              isSelected
                ? 'border-amber-500 bg-amber-500'
                : 'border-slate-500'
            )}
          >
            {isSelected && (
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {/* Stone icons */}
          <div className="flex items-center gap-2">
            {option.stones.SIX && option.stones.SIX > 0 && (
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs',
                    STONE_CONFIGS.SIX.bgColor,
                    STONE_CONFIGS.SIX.color
                  )}
                >
                  6
                </div>
                <span className="text-sm text-slate-300">x{option.stones.SIX}</span>
              </div>
            )}
            {option.stones.THREE && option.stones.THREE > 0 && (
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs',
                    STONE_CONFIGS.THREE.bgColor,
                    STONE_CONFIGS.THREE.color
                  )}
                >
                  3
                </div>
                <span className="text-sm text-slate-300">x{option.stones.THREE}</span>
              </div>
            )}
            {option.stones.ONE && option.stones.ONE > 0 && (
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs',
                    STONE_CONFIGS.ONE.bgColor,
                    STONE_CONFIGS.ONE.color
                  )}
                >
                  1
                </div>
                <span className="text-sm text-slate-300">x{option.stones.ONE}</span>
              </div>
            )}
          </div>
        </div>

        {/* Total value badge */}
        <div
          className={cn(
            'px-3 py-1 rounded-full text-sm font-bold',
            'bg-amber-900/50 text-amber-300 border border-amber-500/50'
          )}
        >
          = {totalValue} 分
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 mt-2 pl-8">
        {option.description}
      </p>
    </button>
  )
})

// ============================================
// CURRENT STONES DISPLAY
// ============================================

interface CurrentStonesDisplayProps {
  stones: StonePool
}

const CurrentStonesDisplay = memo(function CurrentStonesDisplay({
  stones,
}: CurrentStonesDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
      <span className="text-sm text-slate-400">目前持有：</span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs',
              STONE_CONFIGS.ONE.bgColor,
              STONE_CONFIGS.ONE.color
            )}
          >
            1
          </div>
          <span className="text-sm text-slate-300">{stones.ONE}</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs',
              STONE_CONFIGS.THREE.bgColor,
              STONE_CONFIGS.THREE.color
            )}
          >
            3
          </div>
          <span className="text-sm text-slate-300">{stones.THREE}</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs',
              STONE_CONFIGS.SIX.bgColor,
              STONE_CONFIGS.SIX.color
            )}
          >
            6
          </div>
          <span className="text-sm text-slate-300">{stones.SIX}</span>
        </div>
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const StonePaymentModal = memo(function StonePaymentModal({
  isOpen,
  onClose,
  playerStones,
  paymentOptions,
  paymentAmount,
  onConfirmPayment,
  title = '選擇支付方式',
}: StonePaymentModalProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  // Find selected option
  const selectedOption = paymentOptions.find(o => o.id === selectedOptionId)

  // Handle close and reset
  const handleClose = useCallback(() => {
    setSelectedOptionId(null)
    onClose()
  }, [onClose])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (!selectedOption) return
    onConfirmPayment(selectedOption.stones)
    setSelectedOptionId(null)
  }, [selectedOption, onConfirmPayment])

  // Handle option select
  const handleSelectOption = useCallback((optionId: string) => {
    setSelectedOptionId(optionId)
  }, [])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      <div className="p-4 space-y-4" data-testid="stone-payment-modal">
        {/* Description */}
        <GlassCard variant="default" padding="sm" className="bg-amber-900/20">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-amber-300">需要支付 {paymentAmount} 分</h3>
            <p className="text-sm text-slate-400">
              請選擇一種支付組合
            </p>
          </div>
        </GlassCard>

        {/* Current Stones */}
        <CurrentStonesDisplay stones={playerStones} />

        {/* Payment Options */}
        <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
          {paymentOptions.map(option => (
            <PaymentOptionCard
              key={option.id}
              option={option}
              isSelected={selectedOptionId === option.id}
              onSelect={() => handleSelectOption(option.id)}
            />
          ))}

          {paymentOptions.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              沒有可用的支付組合
            </div>
          )}
        </div>

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
            disabled={!selectedOption}
            className={cn(
              'flex-1',
              selectedOption
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                : 'bg-slate-700 cursor-not-allowed'
            )}
            data-testid="confirm-payment-btn"
          >
            確認支付
          </Button>
        </div>
      </div>
    </Modal>
  )
})

export default StonePaymentModal
