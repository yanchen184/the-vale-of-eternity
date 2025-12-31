/**
 * MagicButton Component
 * Fantasy-themed button with glow effects and animations
 * @version 1.0.0
 */
console.log('[components/ui/MagicButton.tsx] v1.0.0 loaded')

import { memo, forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export type MagicButtonVariant = 'primary' | 'secondary' | 'gold' | 'emerald' | 'danger' | 'ghost' | 'outline'
export type MagicButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface MagicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: MagicButtonVariant
  /** Button size */
  size?: MagicButtonSize
  /** Loading state */
  isLoading?: boolean
  /** Left icon */
  leftIcon?: React.ReactNode
  /** Right icon */
  rightIcon?: React.ReactNode
  /** Enable glow effect */
  glow?: boolean
  /** Enable pulse animation */
  pulse?: boolean
  /** Full width button */
  fullWidth?: boolean
}

// ============================================
// STYLE CONFIGURATIONS
// ============================================

const VARIANT_STYLES: Record<MagicButtonVariant, {
  base: string
  hover: string
  glow: string
}> = {
  primary: {
    base: 'bg-gradient-to-r from-purple-600 to-violet-700 text-white border-purple-400/50',
    hover: 'hover:from-purple-500 hover:to-violet-600',
    glow: 'shadow-[0_0_25px_rgba(139,92,246,0.4)]',
  },
  secondary: {
    base: 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200 border-slate-500/50',
    hover: 'hover:from-slate-600 hover:to-slate-700',
    glow: 'shadow-[0_0_20px_rgba(100,116,139,0.3)]',
  },
  gold: {
    base: 'bg-gradient-to-r from-amber-600 to-yellow-700 text-white border-amber-400/50',
    hover: 'hover:from-amber-500 hover:to-yellow-600',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.4)]',
  },
  emerald: {
    base: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400/50',
    hover: 'hover:from-emerald-500 hover:to-teal-600',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.4)]',
  },
  danger: {
    base: 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-400/50',
    hover: 'hover:from-red-500 hover:to-rose-600',
    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.4)]',
  },
  ghost: {
    base: 'bg-transparent text-slate-300 border-transparent',
    hover: 'hover:bg-white/10 hover:text-white',
    glow: '',
  },
  outline: {
    base: 'bg-transparent text-purple-400 border-purple-500/50',
    hover: 'hover:bg-purple-500/10 hover:border-purple-400',
    glow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]',
  },
}

const SIZE_STYLES: Record<MagicButtonSize, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-2.5 text-base gap-2',
  lg: 'px-8 py-3.5 text-lg gap-2.5',
  xl: 'px-10 py-4 text-xl gap-3',
}

const ICON_SIZES: Record<MagicButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
}

// ============================================
// MAIN COMPONENT
// ============================================

export const MagicButton = memo(forwardRef<HTMLButtonElement, MagicButtonProps>(
  function MagicButton(
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      glow = true,
      pulse = false,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || isLoading
    const variantStyle = VARIANT_STYLES[variant]
    const sizeStyle = SIZE_STYLES[size]
    const iconSize = ICON_SIZES[size]

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center',
          'font-semibold rounded-xl border',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900',

          // Variant styles
          variantStyle.base,
          !isDisabled && variantStyle.hover,
          glow && !isDisabled && variantStyle.glow,

          // Size styles
          sizeStyle,

          // Full width
          fullWidth && 'w-full',

          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed',

          // Hover animation
          !isDisabled && 'hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]',

          // Pulse animation
          pulse && !isDisabled && 'animate-pulse-button',

          className
        )}
        data-testid="magic-button"
        {...props}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div
            className={cn(
              'absolute inset-0 opacity-0 transition-opacity duration-300',
              !isDisabled && 'group-hover:opacity-100',
              'bg-gradient-to-r from-transparent via-white/20 to-transparent',
              '-translate-x-full animate-shimmer-slow'
            )}
          />
        </div>

        {/* Inner glow */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* Content */}
        <span className="relative flex items-center justify-center gap-2">
          {isLoading ? (
            <Loader2 className={cn(iconSize, 'animate-spin')} />
          ) : (
            leftIcon && <span className={iconSize}>{leftIcon}</span>
          )}

          {children}

          {!isLoading && rightIcon && (
            <span className={iconSize}>{rightIcon}</span>
          )}
        </span>
      </button>
    )
  }
))

// ============================================
// PRESET BUTTONS
// ============================================

/**
 * Start Game Button - Primary action button with enhanced effects
 */
export const StartGameButton = memo(function StartGameButton({
  onClick,
  disabled = false,
  isLoading = false,
  className,
}: {
  onClick?: () => void
  disabled?: boolean
  isLoading?: boolean
  className?: string
}) {
  return (
    <MagicButton
      variant="emerald"
      size="lg"
      glow
      pulse={!disabled && !isLoading}
      onClick={onClick}
      disabled={disabled}
      isLoading={isLoading}
      className={cn('min-w-[200px]', className)}
      leftIcon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    >
      Start Game
    </MagicButton>
  )
})

/**
 * Confirm Selection Button - For card selection confirmation
 */
export const ConfirmButton = memo(function ConfirmButton({
  onClick,
  disabled = false,
  isLoading = false,
  children = 'Confirm',
  className,
}: {
  onClick?: () => void
  disabled?: boolean
  isLoading?: boolean
  children?: React.ReactNode
  className?: string
}) {
  return (
    <MagicButton
      variant={disabled ? 'secondary' : 'emerald'}
      size="lg"
      glow={!disabled}
      pulse={!disabled && !isLoading}
      onClick={onClick}
      disabled={disabled}
      isLoading={isLoading}
      className={cn('min-w-[180px]', className)}
      leftIcon={
        !disabled && (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      }
    >
      {children}
    </MagicButton>
  )
})

/**
 * Leave Button - For leaving game/room
 */
export const LeaveButton = memo(function LeaveButton({
  onClick,
  className,
}: {
  onClick?: () => void
  className?: string
}) {
  return (
    <MagicButton
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={className}
      leftIcon={
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      }
    >
      Leave
    </MagicButton>
  )
})

export default MagicButton
