/**
 * StoneParticles Component
 * Particle effects for stone gain/spend animations
 * @version 1.1.1 - Fixed stone image paths for production build
 */
console.log('[components/game/StoneParticles.tsx] v1.1.1 loaded')

import { useEffect, useState, memo } from 'react'
import { cn } from '@/lib/utils'
import { StoneType, STONE_ICONS } from '@/types/cards'

// Base path for assets (matches vite.config.ts base)
const BASE_PATH = import.meta.env.BASE_URL || '/'

// Helper function to get stone image path
function getStoneImage(stoneType: StoneType): string | null {
  const imageMap: Record<string, string> = {
    [StoneType.ONE]: `${BASE_PATH}assets/stones/stone-1.png`,
    [StoneType.THREE]: `${BASE_PATH}assets/stones/stone-3.png`,
    [StoneType.SIX]: `${BASE_PATH}assets/stones/stone-6.png`,
  }
  return imageMap[stoneType] || null
}

// ============================================
// TYPES
// ============================================

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  lifetime: number
  icon: string
  imagePath: string | null
  color: string
  scale: number
}

export interface StoneParticlesProps {
  /** Stone type for particle appearance */
  stoneType: StoneType
  /** Number of particles to spawn */
  count: number
  /** Animation type: 'gain' (upward) or 'spend' (downward/scatter) */
  type: 'gain' | 'spend'
  /** Callback when animation completes */
  onComplete?: () => void
  /** Origin position (optional, defaults to center) */
  origin?: { x: number; y: number }
}

// ============================================
// STONE COLORS
// ============================================

const STONE_COLORS: Record<StoneType, string> = {
  [StoneType.ONE]: 'text-slate-300',
  [StoneType.THREE]: 'text-slate-200',
  [StoneType.SIX]: 'text-yellow-300',
  [StoneType.FIRE]: 'text-red-400',
  [StoneType.WATER]: 'text-blue-400',
  [StoneType.EARTH]: 'text-green-400',
  [StoneType.WIND]: 'text-purple-400',
}

// ============================================
// PARTICLE GENERATOR
// ============================================

function createParticle(
  index: number,
  type: 'gain' | 'spend',
  icon: string,
  imagePath: string | null,
  color: string,
  origin: { x: number; y: number }
): Particle {
  const angle = type === 'gain'
    ? -Math.PI / 2 + (Math.random() - 0.5) * 0.5 // Upward with slight spread
    : Math.random() * Math.PI * 2 // All directions for spend

  const speed = type === 'gain'
    ? 50 + Math.random() * 30 // 50-80 for gain
    : 80 + Math.random() * 40 // 80-120 for spend

  const vx = Math.cos(angle) * speed
  const vy = Math.sin(angle) * speed

  return {
    id: `particle-${Date.now()}-${index}`,
    x: origin.x,
    y: origin.y,
    vx,
    vy,
    lifetime: 0,
    icon,
    imagePath,
    color,
    scale: 0.8 + Math.random() * 0.4, // 0.8-1.2
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export const StoneParticles = memo(function StoneParticles({
  stoneType,
  count,
  type,
  onComplete,
  origin = { x: 50, y: 50 },
}: StoneParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  // Initialize particles
  useEffect(() => {
    const icon = STONE_ICONS[stoneType]
    const imagePath = getStoneImage(stoneType)
    const color = STONE_COLORS[stoneType]

    const newParticles = Array.from({ length: count }, (_, i) =>
      createParticle(i, type, icon, imagePath, color, origin)
    )

    setParticles(newParticles)

    // Animation loop
    const animationDuration = 1500 // 1.5 seconds
    const startTime = Date.now()
    const frameRate = 1000 / 60 // 60fps

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / animationDuration

      if (progress >= 1) {
        clearInterval(interval)
        setParticles([])
        onComplete?.()
        return
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx * (frameRate / 1000),
          y: p.y + p.vy * (frameRate / 1000) + (type === 'spend' ? 0 : 0), // Gravity effect for spend
          vy: p.vy + (type === 'spend' ? 200 : 100) * (frameRate / 1000), // Gravity
          lifetime: progress,
        }))
      )
    }, frameRate)

    return () => clearInterval(interval)
  }, [stoneType, count, type, origin, onComplete])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50" data-testid="stone-particles">
      {particles.map((particle) => {
        const opacity = 1 - particle.lifetime
        const scale = particle.scale * (1 - particle.lifetime * 0.3)

        return (
          <div
            key={particle.id}
            className="absolute transition-opacity duration-100"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              filter: `drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor)`,
            }}
          >
            {particle.imagePath ? (
              <img
                src={particle.imagePath}
                alt="stone"
                className="w-8 h-8 object-contain"
              />
            ) : (
              <span className={cn('text-2xl', particle.color)}>
                {particle.icon}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
})

export default StoneParticles
