/**
 * MagicBackground Component
 * Fantasy-themed animated background with particles, orbs, and magical effects
 * @version 1.0.0
 */
console.log('[components/ui/MagicBackground.tsx] v1.0.0 loaded')

import { memo, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface MagicBackgroundProps {
  /** Background variant */
  variant?: 'waiting' | 'game' | 'mystical' | 'dark'
  /** Enable floating particles */
  enableParticles?: boolean
  /** Enable floating orbs */
  enableOrbs?: boolean
  /** Enable magic grid pattern */
  enableGrid?: boolean
  /** Particle color theme */
  particleColor?: 'purple' | 'blue' | 'gold' | 'mixed'
  /** Additional CSS classes */
  className?: string
  /** Children content */
  children?: React.ReactNode
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  delay: number
  color: string
}

interface Orb {
  id: number
  x: number
  y: number
  size: number
  color: string
  blur: number
  delay: number
}

// ============================================
// CONSTANTS
// ============================================

const PARTICLE_COLORS = {
  purple: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
  blue: ['#3b82f6', '#60a5fa', '#93c5fd'],
  gold: ['#f59e0b', '#fbbf24', '#fcd34d'],
  mixed: ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#06b6d4'],
}

const ORB_CONFIGS = {
  waiting: [
    { x: 20, y: 20, size: 400, color: 'rgba(139, 92, 246, 0.15)', blur: 100 },
    { x: 80, y: 80, size: 350, color: 'rgba(59, 130, 246, 0.12)', blur: 80 },
    { x: 50, y: 50, size: 500, color: 'rgba(245, 158, 11, 0.08)', blur: 120 },
  ],
  game: [
    { x: 10, y: 30, size: 300, color: 'rgba(139, 92, 246, 0.1)', blur: 80 },
    { x: 90, y: 70, size: 350, color: 'rgba(59, 130, 246, 0.08)', blur: 90 },
  ],
  mystical: [
    { x: 25, y: 25, size: 450, color: 'rgba(139, 92, 246, 0.2)', blur: 120 },
    { x: 75, y: 75, size: 400, color: 'rgba(79, 70, 229, 0.15)', blur: 100 },
    { x: 50, y: 10, size: 300, color: 'rgba(245, 158, 11, 0.1)', blur: 80 },
  ],
  dark: [
    { x: 30, y: 40, size: 350, color: 'rgba(100, 116, 139, 0.1)', blur: 100 },
    { x: 70, y: 60, size: 300, color: 'rgba(71, 85, 105, 0.08)', blur: 80 },
  ],
}

const GRADIENT_CONFIGS = {
  waiting: 'from-purple-950 via-indigo-950 to-slate-950',
  game: 'from-slate-950 via-purple-950/20 to-slate-950',
  mystical: 'from-violet-950 via-purple-950 to-indigo-950',
  dark: 'from-slate-950 via-slate-900 to-slate-950',
}

// ============================================
// SUB-COMPONENTS
// ============================================

const FloatingParticle = memo(function FloatingParticle({ particle }: { particle: Particle }) {
  return (
    <div
      className="absolute rounded-full animate-float-particle pointer-events-none"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        backgroundColor: particle.color,
        opacity: particle.opacity,
        animationDuration: `${particle.speed}s`,
        animationDelay: `${particle.delay}s`,
        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
      }}
    />
  )
})

const FloatingOrb = memo(function FloatingOrb({ orb }: { orb: Orb }) {
  return (
    <div
      className="absolute rounded-full animate-float-orb pointer-events-none"
      style={{
        left: `${orb.x}%`,
        top: `${orb.y}%`,
        width: `${orb.size}px`,
        height: `${orb.size}px`,
        background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
        filter: `blur(${orb.blur}px)`,
        animationDelay: `${orb.delay}s`,
        transform: 'translate(-50%, -50%)',
      }}
    />
  )
})

const MagicGrid = memo(function MagicGrid() {
  return (
    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }}
    />
  )
})

const RuneCircle = memo(function RuneCircle() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.02]">
      <svg viewBox="0 0 400 400" className="w-full h-full animate-rotate-slow">
        <circle
          cx="200"
          cy="200"
          r="180"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-purple-400"
        />
        <circle
          cx="200"
          cy="200"
          r="150"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-purple-400"
        />
        {/* Rune symbols */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <text
            key={angle}
            x="200"
            y="30"
            textAnchor="middle"
            className="text-purple-400 text-xs"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: '200px 200px',
            }}
          >
            *
          </text>
        ))}
      </svg>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const MagicBackground = memo(function MagicBackground({
  variant = 'waiting',
  enableParticles = true,
  enableOrbs = true,
  enableGrid = false,
  particleColor = 'mixed',
  className,
  children,
}: MagicBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate particles
  const particles = useMemo((): Particle[] => {
    if (!enableParticles) return []

    const colors = PARTICLE_COLORS[particleColor]
    const count = 30

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      speed: Math.random() * 10 + 15,
      delay: Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  }, [enableParticles, particleColor])

  // Generate orbs based on variant
  const orbs = useMemo((): Orb[] => {
    if (!enableOrbs) return []

    const orbConfig = ORB_CONFIGS[variant]
    return orbConfig.map((config, i) => ({
      id: i,
      ...config,
      delay: i * 2,
    }))
  }, [enableOrbs, variant])

  const gradientClass = GRADIENT_CONFIGS[variant]

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 overflow-hidden',
        `bg-gradient-to-br ${gradientClass}`,
        className
      )}
      data-testid="magic-background"
    >
      {/* Base gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />

      {/* Floating orbs */}
      {orbs.map((orb) => (
        <FloatingOrb key={orb.id} orb={orb} />
      ))}

      {/* Magic grid pattern */}
      {enableGrid && <MagicGrid />}

      {/* Rune circle decoration */}
      {variant === 'mystical' && <RuneCircle />}

      {/* Floating particles */}
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} particle={particle} />
      ))}

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

      {/* Bottom mystical glow */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-purple-950/30 to-transparent pointer-events-none" />

      {/* Content container */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
})

export default MagicBackground
