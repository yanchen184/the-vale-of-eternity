/**
 * GlassCard Component
 * Glassmorphism card with fantasy theme and glow effects
 * @version 1.0.0
 */
console.log('[components/ui/GlassCard.tsx] v1.0.0 loaded')

import { memo, forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export type GlassVariant = 'default' | 'light' | 'dark' | 'gold' | 'purple' | 'blue' | 'success' | 'danger'
export type GlowColor = 'none' | 'purple' | 'blue' | 'gold' | 'emerald' | 'rose' | 'cyan'

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Glass effect variant */
  variant?: GlassVariant
  /** Glow effect color */
  glow?: GlowColor
  /** Enable hover animation */
  hoverable?: boolean
  /** Enable pulse animation for active state */
  pulse?: boolean
  /** Border style */
  borderStyle?: 'solid' | 'gradient' | 'glow' | 'none'
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /** Corner rounding */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

// ============================================
// STYLE CONFIGURATIONS
// ============================================

const VARIANT_STYLES: Record<GlassVariant, string> = {
  default: 'bg-white/5 border-white/10',
  light: 'bg-white/10 border-white/20',
  dark: 'bg-black/30 border-white/5',
  gold: 'bg-amber-900/20 border-amber-500/30',
  purple: 'bg-purple-900/20 border-purple-500/30',
  blue: 'bg-blue-900/20 border-blue-500/30',
  success: 'bg-emerald-900/20 border-emerald-500/30',
  danger: 'bg-red-900/20 border-red-500/30',
}

const GLOW_STYLES: Record<GlowColor, string> = {
  none: '',
  purple: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
  blue: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
  gold: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
  emerald: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
  rose: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
  cyan: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
}

const PADDING_STYLES: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
  xl: 'p-10',
}

const ROUNDED_STYLES: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
  full: 'rounded-full',
}

// ============================================
// MAIN COMPONENT
// ============================================

export const GlassCard = memo(forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    {
      variant = 'default',
      glow = 'none',
      hoverable = false,
      pulse = false,
      borderStyle = 'solid',
      padding = 'md',
      rounded = 'xl',
      className,
      children,
      ...props
    },
    ref
  ) {
    const variantClass = VARIANT_STYLES[variant]
    const glowClass = GLOW_STYLES[glow]
    const paddingClass = PADDING_STYLES[padding]
    const roundedClass = ROUNDED_STYLES[rounded]

    const borderClass = borderStyle === 'none' ? '' : 'border'

    return (
      <div
        ref={ref}
        className={cn(
          // Base glass styles
          'relative backdrop-blur-md',
          variantClass,
          glowClass,
          paddingClass,
          roundedClass,
          borderClass,
          // Hover effects
          hoverable && [
            'transition-all duration-300 ease-out',
            'hover:bg-white/10 hover:border-white/20',
            'hover:shadow-xl hover:-translate-y-1',
            'hover:scale-[1.02]',
            'cursor-pointer',
          ],
          // Pulse animation
          pulse && 'animate-pulse-glow',
          className
        )}
        data-testid="glass-card"
        {...props}
      >
        {/* Inner glow overlay */}
        <div
          className={cn(
            'absolute inset-0 pointer-events-none opacity-50',
            roundedClass,
            'bg-gradient-to-b from-white/5 via-transparent to-transparent'
          )}
        />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
))

// ============================================
// PRESET VARIANTS
// ============================================

/**
 * Room Code Card - Gold themed for displaying room codes
 */
export const RoomCodeCard = memo(function RoomCodeCard({
  roomCode,
  className,
}: {
  roomCode: string
  className?: string
}) {
  return (
    <GlassCard
      variant="gold"
      glow="gold"
      padding="lg"
      rounded="xl"
      className={cn('text-center', className)}
    >
      <div className="space-y-3">
        <span className="text-sm text-amber-300/70 uppercase tracking-widest font-medium">
          Room Code
        </span>
        <div className="relative">
          <div className="text-5xl font-mono font-bold text-amber-400 tracking-[0.3em] text-shadow-lg">
            {roomCode}
          </div>
          <div className="absolute inset-0 blur-lg bg-amber-400/20 -z-10" />
        </div>
        <span className="text-xs text-slate-400">
          Share this code with friends to join
        </span>
      </div>
    </GlassCard>
  )
})

/**
 * Player Card - For displaying player info in waiting room
 */
export const PlayerCard = memo(function PlayerCard({
  playerName,
  playerColor,
  isHost = false,
  isReady = false,
  isEmpty = false,
  slotNumber,
  className,
}: {
  playerName?: string
  playerColor?: string
  isHost?: boolean
  isReady?: boolean
  isEmpty?: boolean
  slotNumber?: number
  className?: string
}) {
  if (isEmpty) {
    return (
      <GlassCard
        variant="dark"
        padding="md"
        rounded="lg"
        borderStyle="solid"
        className={cn(
          'border-dashed border-slate-600/50 animate-pulse-subtle',
          className
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-500 text-lg font-medium">
            {slotNumber}
          </div>
          <span className="text-slate-500 italic">Waiting for player...</span>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard
      variant="default"
      glow={isHost ? 'gold' : 'none'}
      padding="md"
      rounded="lg"
      className={cn(
        'transition-all duration-300',
        isReady && 'ring-2 ring-emerald-500/50',
        className
      )}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: playerColor || '#8b5cf6',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Player avatar/color */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: playerColor || '#8b5cf6',
              boxShadow: `0 0 20px ${playerColor || '#8b5cf6'}40`,
            }}
          >
            <span className="text-white font-bold text-lg">
              {playerName?.charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <span className="text-slate-100 font-semibold">{playerName}</span>
            {isHost && (
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <span>Crown</span>
                <span>Host</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isReady && (
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Ready
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  )
})

/**
 * Phase Badge - For displaying current game phase
 */
export const PhaseBadge = memo(function PhaseBadge({
  phase,
  className,
}: {
  phase: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  className?: string
}) {
  const phaseConfigs: Record<string, { label: string; gradient: string; glow: string }> = {
    WAITING: {
      label: 'Waiting',
      gradient: 'from-slate-600 to-slate-700',
      glow: 'shadow-slate-500/30',
    },
    HUNTING: {
      label: 'Card Selection',
      gradient: 'from-blue-600 to-indigo-700',
      glow: 'shadow-blue-500/30',
    },
    ACTION: {
      label: 'Action Phase',
      gradient: 'from-emerald-600 to-teal-700',
      glow: 'shadow-emerald-500/30',
    },
    RESOLUTION: {
      label: 'Resolution',
      gradient: 'from-amber-600 to-orange-700',
      glow: 'shadow-amber-500/30',
    },
    ENDED: {
      label: 'Game Over',
      gradient: 'from-purple-600 to-violet-700',
      glow: 'shadow-purple-500/30',
    },
  }

  const config = phaseConfigs[phase]

  return (
    <div
      className={cn(
        'relative inline-flex items-center px-6 py-2.5 rounded-full',
        `bg-gradient-to-r ${config.gradient}`,
        `shadow-lg ${config.glow}`,
        'border border-white/20',
        className
      )}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>

      <span className="relative text-white font-semibold tracking-wide">
        {config.label}
      </span>
    </div>
  )
})

export default GlassCard
