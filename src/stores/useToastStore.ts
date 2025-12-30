/**
 * Toast notification store using Zustand
 * @version 1.0.0
 */
console.log('[stores/useToastStore.ts] v1.0.0 loaded')

import { create } from 'zustand'
import type { ToastType, ToastItem } from '@/components/ui'
import { generateId } from '@/lib/utils'

interface ToastStore {
  toasts: ToastItem[]
  addToast: (type: ToastType, message: string) => string
  removeToast: (id: string) => void
  clearAll: () => void
  
  // Convenience methods
  success: (message: string) => string
  error: (message: string) => string
  warning: (message: string) => string
  info: (message: string) => string
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = generateId()
    set(state => ({
      toasts: [...state.toasts, { id, type, message }],
    }))
    return id
  },

  removeToast: id =>
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),

  clearAll: () => set({ toasts: [] }),

  success: message => get().addToast('success', message),
  error: message => get().addToast('error', message),
  warning: message => get().addToast('warning', message),
  info: message => get().addToast('info', message),
}))

export default useToastStore
