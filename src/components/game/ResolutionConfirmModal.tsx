/**
 * Resolution Confirm Modal Component
 * Modal for confirming resolution phase card effects
 * @version 3.0.0 - Show different UI based on effect type (RECOVER_CARD vs EARN_STONES)
 */
console.log('[components/game/ResolutionConfirmModal.tsx] v3.0.0 loaded')

import { memo, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { RotateCcw, X, Sparkles, Coins } from 'lucide-react'
import type { CardInstance } from '@/types/cards'
import { EffectType, EffectTrigger } from '@/types/cards'
import { getCardImagePath } from '@/lib/card-images'

export interface ResolutionConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal is closed (without making a choice) */
  onClose: () => void
  /** The card to process */
  card: CardInstance | null
  /** Callback when player chooses to activate the effect (return to hand) */
  onConfirm: () => void
  /** Callback when player chooses to skip the effect (stay on field) */
  onSkip: () => void
}

export const ResolutionConfirmModal = memo(function ResolutionConfirmModal({
  isOpen,
  onClose,
  card,
  onConfirm,
  onSkip,
}: ResolutionConfirmModalProps) {
  if (!card) return null

  const cardImagePath = getCardImagePath(card.cardId)

  // Determine effect type to show different UI
  const effectInfo = useMemo(() => {
    if (!card.effects || card.effects.length === 0) {
      return {
        type: 'unknown',
        message: '未知效果',
        description: '',
        showSkip: false,
        confirmText: '確認',
        skipText: '',
      }
    }

    // Find the ON_SCORE effect
    const onScoreEffect = card.effects.find(
      (e) => e.trigger === EffectTrigger.ON_SCORE
    )
    if (!onScoreEffect) {
      return {
        type: 'unknown',
        message: '未知效果',
        description: '',
        showSkip: false,
        confirmText: '確認',
        skipText: '',
      }
    }

    switch (onScoreEffect.type) {
      case EffectType.RECOVER_CARD:
        return {
          type: 'recover',
          message: `是否要讓 ${card.nameTw} 回到手上？`,
          description: onScoreEffect.descriptionTw || '可被回收。',
          showSkip: true,
          confirmText: '是，回到手上',
          skipText: '否，留在場上',
        }
      case EffectType.EARN_STONES:
        return {
          type: 'earn_stones',
          message: `是否要執行 ${card.nameTw} 的回合結束效果？`,
          description: onScoreEffect.descriptionTw || '獲得石頭',
          showSkip: true,
          confirmText: '是，執行效果',
          skipText: '否，暫時跳過',
        }
      default:
        return {
          type: 'other',
          message: `${card.nameTw} 的回合結束效果`,
          description: onScoreEffect.descriptionTw || '執行效果',
          showSkip: false,
          confirmText: '確認執行',
          skipText: '',
        }
    }
  }, [card])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
      closeOnOverlayClick={false}
      showCloseButton={false}
      className="bg-slate-900/95 border-amber-500/50"
    >
      <div className="flex flex-col items-center gap-6 py-4">
        {/* Title with sparkle effect */}
        <div className="flex items-center gap-2 text-amber-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <h2 className="text-xl font-bold">結算效果</h2>
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>

        {/* Card preview */}
        <div
          className="relative rounded-lg overflow-hidden border-2 border-amber-500/60 shadow-lg"
          style={{ width: '140px', height: '210px' }}
        >
          <img
            src={cardImagePath}
            alt={card.nameTw}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          {/* Glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent pointer-events-none" />
        </div>

        {/* Card name */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-100">{card.nameTw}</h3>
          <p className="text-sm text-slate-400">{card.name}</p>
        </div>

        {/* Question / Effect Description */}
        <div className="text-center px-4">
          <p className="text-lg text-slate-200">{effectInfo.message}</p>
          <p className="text-sm text-emerald-400 mt-2 font-medium">
            {effectInfo.description}
          </p>
          {effectInfo.showSkip && (
            <>
              <p className="text-sm text-amber-400 mt-3 font-semibold">
                ⚠️ 此效果最終必須發動才能結束回合
              </p>
              <p className="text-xs text-slate-500 mt-1">
                選「否」可以暫時跳過，決定回收順序（但最終都要回收）
              </p>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 w-full px-4">
          {effectInfo.showSkip && (
            <Button
              variant="outline"
              size="lg"
              onClick={onSkip}
              className="flex-1 border-slate-600 hover:border-slate-500 hover:bg-slate-800"
              data-testid="resolution-skip-button"
            >
              <X className="w-5 h-5 mr-2" />
              <span>{effectInfo.skipText}</span>
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={onConfirm}
            className={`${
              effectInfo.showSkip ? 'flex-1' : 'w-full'
            } bg-amber-600 hover:bg-amber-500 border-amber-500`}
            data-testid="resolution-confirm-button"
          >
            {effectInfo.type === 'recover' ? (
              <RotateCcw className="w-5 h-5 mr-2" />
            ) : (
              <Coins className="w-5 h-5 mr-2" />
            )}
            <span>{effectInfo.confirmText}</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
})

export default ResolutionConfirmModal
