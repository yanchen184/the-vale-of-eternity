/**
 * GameBackground Component
 * Animated fantasy background with stars, particles, and Vale of Eternity theme
 * @version 1.0.0
 */
console.log('[components/ui/GameBackground.tsx] v1.0.0 loaded')

import { memo, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface GameBackgroundProps {
  /** Background variant */
  variant?: 'default' | 'dark' | 'mystical'
  /** Enable animated particles */
  enableParticles?: boolean
  /** Additional CSS classes */
  className?: string
  /** Children content */
  children?: React.ReactNode
}

// ============================================
// PARTICLE SYSTEM
// ============================================

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
}

// ============================================
// MAIN COMPONENT
// ============================================

export const GameBackground = memo(function GameBackground({
  variant = 'default',
  enableParticles = true,
  className,
  children,
}: GameBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Animated star particles
  useEffect(() => {
    if (!enableParticles) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)

    // Create particles
    const particleCount = 100
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: Math.random() * 0.2 + 0.1,
        opacity: Math.random() * 0.5 + 0.3,
      })
    }

    // Animation loop
    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Wrap around
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y > canvas.height) particle.y = 0

        // Twinkle effect
        particle.opacity += (Math.random() - 0.5) * 0.02
        particle.opacity = Math.max(0.2, Math.min(0.8, particle.opacity))

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139, 92, 246, ${particle.opacity})`
        ctx.fill()

        // Add glow
        ctx.shadowBlur = 8
        ctx.shadowColor = 'rgba(139, 92, 246, 0.5)'
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', setCanvasSize)
    }
  }, [enableParticles])

  // Background gradient based on variant
  const gradientClass = {
    default: 'from-slate-950 via-slate-900 to-slate-950',
    dark: 'from-slate-950 via-purple-950/20 to-slate-950',
    mystical: 'from-purple-950/30 via-slate-900 to-slate-950',
  }[variant]

  return (
    <div
      className={cn(
        'fixed inset-0 overflow-hidden',
        `bg-gradient-to-b ${gradientClass}`,
        className
      )}
      data-testid="game-background"
    >
      {/* Animated canvas for particles */}
      {enableParticles && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ mixBlendMode: 'screen' }}
        />
      )}

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float animation-delay-1000" />

      {/* Mystical fog effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%)',
        }}
      />

      {/* Content container */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>

      {/* Bottom decorative glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-950/20 to-transparent pointer-events-none" />
    </div>
  )
})

export default GameBackground
