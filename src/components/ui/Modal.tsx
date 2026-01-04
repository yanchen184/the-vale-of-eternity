/**
 * Modal component
 * @version 1.2.0 - Added minimize functionality
 */
console.log('[components/ui/Modal.tsx] v1.2.0 loaded')

import { useEffect, useCallback, useState, type ReactNode } from 'react'
import { X, Minus, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'wide'
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  showMinimizeButton?: boolean
  className?: string
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
  wide: 'w-[80vw] max-w-none',
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  showMinimizeButton = false,
  className,
}: ModalProps) {
  // Minimize state
  const [isMinimized, setIsMinimized] = useState(false)

  // Handle minimize toggle
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev)
  }, [])

  // Reset minimize state when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false)
    }
  }, [isOpen])

  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMinimized) {
          setIsMinimized(false)
        } else {
          onClose()
        }
      }
    },
    [onClose, isMinimized]
  )

  // Add/remove event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  // Minimized mode - show compact bar
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50"
        data-testid="modal-minimized"
      >
        <div
          className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl px-4 py-3 flex items-center gap-3 animate-slide-up"
          style={{ minWidth: '300px' }}
        >
          {title && (
            <h2 className="text-sm font-semibold text-slate-100 flex-1 truncate">
              {title}
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMinimize}
            aria-label="還原"
            data-testid="modal-restore-button"
            className="flex-shrink-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="關閉"
              data-testid="modal-close-button"
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
        data-testid="modal-overlay"
      />

      {/* Modal content */}
      <div
        className={cn(
          'relative w-full bg-slate-800 rounded-xl shadow-2xl',
          'border border-slate-700',
          'animate-slide-up',
          sizeStyles[size],
          className
        )}
        data-testid="modal-content"
      >
        {/* Header */}
        {(title || showCloseButton || showMinimizeButton) && (
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-semibold text-slate-100"
              >
                {title}
              </h2>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {showMinimizeButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimize}
                  aria-label="最小化"
                  data-testid="modal-minimize-button"
                >
                  <Minus className="h-5 w-5" />
                </Button>
              )}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="關閉"
                  data-testid="modal-close-button"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-4 text-slate-300" data-testid="modal-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 p-4 border-t border-slate-700"
            data-testid="modal-footer"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
