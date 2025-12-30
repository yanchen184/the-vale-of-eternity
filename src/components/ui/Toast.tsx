/**
 * Toast notification component
 * @version 1.0.0
 */
console.log('[components/ui/Toast.tsx] v1.0.0 loaded')

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  onClose: (id: string) => void
}

const typeStyles: Record<ToastType, { bg: string; icon: typeof CheckCircle }> = {
  success: { bg: 'bg-green-600', icon: CheckCircle },
  error: { bg: 'bg-red-600', icon: AlertCircle },
  warning: { bg: 'bg-yellow-600', icon: AlertTriangle },
  info: { bg: 'bg-vale-600', icon: Info },
}

export function Toast({ id, type, message, duration = 3000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const { bg, icon: Icon } = typeStyles[type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onClose(id), 200)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(id), 200)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
        'text-slate-100 min-w-[280px] max-w-md',
        'transition-all duration-200',
        bg,
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      )}
      role="alert"
      data-testid="toast"
    >
      <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label="關閉通知"
        data-testid="toast-close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Toast container component
 */
export interface ToastItem {
  id: string
  type: ToastType
  message: string
}

export interface ToastContainerProps {
  toasts: ToastItem[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      data-testid="toast-container"
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

export default Toast
