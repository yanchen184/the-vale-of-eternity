/**
 * Image Preview Modal Component
 * Full-screen image preview with smooth animations
 * @version 1.0.0
 */
console.log('[components/ui/ImagePreviewModal.tsx] v1.0.0 loaded')

import { useEffect, useCallback, useState } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ImagePreviewModalProps {
  /** Image source URL */
  src: string
  /** Alt text for accessibility */
  alt: string
  /** Whether modal is open */
  isOpen: boolean
  /** Close callback */
  onClose: () => void
  /** Optional title to display */
  title?: string
  /** Optional subtitle */
  subtitle?: string
  /** Additional content to render below image */
  children?: React.ReactNode
}

export function ImagePreviewModal({
  src,
  alt,
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: ImagePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [scale, setScale] = useState(1)
  const [hasError, setHasError] = useState(false)

  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setScale(1)
      setHasError(false)
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }, [])

  const handleResetZoom = useCallback(() => {
    setScale(1)
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-testid="image-preview-modal"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      {/* Backdrop with blur */}
      <div
        className={cn(
          'absolute inset-0 bg-slate-950/95 backdrop-blur-md',
          'transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
        data-testid="image-preview-backdrop"
      />

      {/* Content container */}
      <div
        className={cn(
          'relative z-10 flex flex-col items-center justify-center',
          'w-full h-full p-4 sm:p-8',
          'animate-fade-in'
        )}
        onClick={onClose}
      >
        {/* Header with title and controls */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 p-4',
            'flex items-start justify-between',
            'bg-gradient-to-b from-slate-950/80 to-transparent'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title section */}
          <div className="flex-1">
            {title && (
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-game">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm sm:text-base text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className={cn(
                'p-2 rounded-lg',
                'bg-slate-800/80 hover:bg-slate-700 text-slate-300',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-vale-400'
              )}
              aria-label="Zoom out"
              data-testid="zoom-out-btn"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetZoom}
              className={cn(
                'p-2 rounded-lg',
                'bg-slate-800/80 hover:bg-slate-700 text-slate-300',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-vale-400'
              )}
              aria-label="Reset zoom"
              data-testid="reset-zoom-btn"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomIn}
              className={cn(
                'p-2 rounded-lg',
                'bg-slate-800/80 hover:bg-slate-700 text-slate-300',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-vale-400'
              )}
              aria-label="Zoom in"
              data-testid="zoom-in-btn"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-lg ml-2',
                'bg-red-900/80 hover:bg-red-800 text-slate-100',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-red-400'
              )}
              aria-label="Close"
              data-testid="close-preview-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image container */}
        <div
          className={cn(
            'relative flex items-center justify-center',
            'max-w-full max-h-[70vh]',
            'transition-transform duration-300 ease-out'
          )}
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-vale-500/30 border-t-vale-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Error state */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-xl">
              <span className="text-6xl mb-4">🖼️</span>
              <p className="text-slate-400">Failed to load image</p>
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              className={cn(
                'max-w-full max-h-[70vh] object-contain',
                'rounded-xl shadow-2xl',
                'ring-4 ring-slate-700/50',
                'transition-opacity duration-300',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false)
                setHasError(true)
              }}
              data-testid="preview-image"
            />
          )}
        </div>

        {/* Optional children content below image */}
        {children && (
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 p-4',
              'bg-gradient-to-t from-slate-950/80 to-transparent'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        )}

        {/* Zoom indicator */}
        {scale !== 1 && (
          <div
            className={cn(
              'absolute bottom-20 left-1/2 -translate-x-1/2',
              'px-3 py-1 rounded-full',
              'bg-slate-800/80 text-slate-300 text-sm',
              'animate-fade-in'
            )}
          >
            {Math.round(scale * 100)}%
          </div>
        )}
      </div>
    </div>
  )
}

export default ImagePreviewModal
