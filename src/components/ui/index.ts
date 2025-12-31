/**
 * UI components barrel export
 * @version 2.0.0 - Added fantasy-themed components
 */
console.log('[components/ui/index.ts] v2.0.0 loaded')

// Base components
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button'
export { Modal, type ModalProps } from './Modal'
export { ImagePreviewModal, type ImagePreviewModalProps } from './ImagePreviewModal'
export { Input, type InputProps } from './Input'
export { Toast, ToastContainer, type ToastProps, type ToastType, type ToastItem } from './Toast'

// Fantasy-themed components
export { MagicBackground, type MagicBackgroundProps } from './MagicBackground'
export { GlassCard, RoomCodeCard, PlayerCard, PhaseBadge, type GlassCardProps, type GlassVariant, type GlowColor } from './GlassCard'
export { MagicButton, StartGameButton, ConfirmButton, LeaveButton, type MagicButtonProps, type MagicButtonVariant, type MagicButtonSize } from './MagicButton'
export { GameBackground, type GameBackgroundProps } from './GameBackground'
