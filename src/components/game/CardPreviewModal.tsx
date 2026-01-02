/**
 * CardPreviewModal Component
 * Large card preview modal for viewing card details
 * @version 3.0.0 - 使用 Portal 確保在最上層
 */
console.log('[components/game/CardPreviewModal.tsx] v3.0.0 loaded')

import { memo, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  // ESC 鍵關閉
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !card) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      data-testid="card-preview-modal"
    >
      {/* Card container - 絕對居中 */}
      <div
        className="animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) scale(2)',
        }}
      >
        <Card
          card={card}
          large={true}
        />
      </div>

      {/* Instructions - 在卡片下方 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translateX(-50%)',
          marginTop: '12rem',
          whiteSpace: 'nowrap',
        }}
      >
        <div className="text-center text-slate-300 text-sm bg-slate-900/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-slate-700">
          點擊任意處或按 ESC 關閉
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )

  // 使用 Portal 將 modal 渲染到 body，確保在最上層
  return createPortal(modalContent, document.body)
})

export default CardPreviewModal
