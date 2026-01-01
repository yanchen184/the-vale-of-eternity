/**
 * CardPreviewModal Component
 * Large card preview modal for viewing card details
 * @version 1.0.0
 */
console.log('[components/game/CardPreviewModal.tsx] v1.0.0 loaded')

import { memo } from 'react'
import type { CardInstance } from '@/types/cards'
import { Card } from './Card'

export interface CardPreviewModalProps {
  card: CardInstance | null
  isOpen: boolean
  onClose: () => void
}

export const CardPreviewModal = memo(function CardPreviewModal({
  card,
  isOpen,
  onClose,
}: CardPreviewModalProps) {
  if (!isOpen || !card) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
          aria-label="關閉"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Large card preview */}
        <div className="transform scale-150 origin-center">
          <Card
            card={card}
            variant="field"
            size="lg"
            interactive={false}
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-slate-300 text-sm">
          點擊任意處或關閉按鈕退出預覽
        </div>
      </div>
    </div>
  )
})

export default CardPreviewModal
