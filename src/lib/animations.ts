/**
 * Animation Utilities for Vale of Eternity
 * Provides GSAP-powered animations and utility functions
 * @version 1.0.0
 */
console.log('[lib/animations.ts] v1.0.0 loaded')

import gsap from 'gsap'

// ============================================
// ANIMATION CONSTANTS
// ============================================

export const ANIMATION_DURATION = {
  INSTANT: 0.1,
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5,
  VERY_SLOW: 0.8,
} as const

export const ANIMATION_EASE = {
  // Entrances
  BOUNCE_OUT: 'back.out(1.7)',
  ELASTIC_OUT: 'elastic.out(1, 0.5)',
  POWER_OUT: 'power3.out',

  // Exits
  POWER_IN: 'power3.in',
  BACK_IN: 'back.in(1.7)',

  // State changes
  SMOOTH: 'power2.inOut',
  SINE: 'sine.inOut',
} as const

// ============================================
// CARD ANIMATIONS
// ============================================

/**
 * Animate card drawing from deck
 */
export function animateCardDraw(
  element: HTMLElement | null,
  fromPosition: { x: number; y: number },
  options?: { delay?: number; onComplete?: () => void }
) {
  if (!element) return

  gsap.fromTo(
    element,
    {
      x: fromPosition.x,
      y: fromPosition.y,
      scale: 0.5,
      opacity: 0,
      rotateY: 180,
    },
    {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      rotateY: 0,
      duration: ANIMATION_DURATION.SLOW,
      ease: ANIMATION_EASE.BOUNCE_OUT,
      delay: options?.delay ?? 0,
      onComplete: options?.onComplete,
    }
  )
}

/**
 * Animate card being played to field
 */
export function animateCardPlay(
  element: HTMLElement | null,
  toPosition: { x: number; y: number },
  options?: { delay?: number; onComplete?: () => void }
) {
  if (!element) return

  const tl = gsap.timeline({
    onComplete: options?.onComplete,
  })

  // Lift and glow
  tl.to(element, {
    scale: 1.1,
    y: -20,
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)',
    duration: ANIMATION_DURATION.FAST,
    ease: ANIMATION_EASE.POWER_OUT,
  })

  // Move to target
  tl.to(element, {
    x: toPosition.x,
    y: toPosition.y,
    scale: 1,
    duration: ANIMATION_DURATION.NORMAL,
    ease: ANIMATION_EASE.SMOOTH,
  })

  // Landing effect
  tl.to(element, {
    boxShadow: '0 0 0px rgba(139, 92, 246, 0)',
    duration: ANIMATION_DURATION.FAST,
  })

  return tl
}

/**
 * Animate card being discarded
 */
export function animateCardDiscard(
  element: HTMLElement | null,
  toPosition: { x: number; y: number },
  options?: { delay?: number; onComplete?: () => void }
) {
  if (!element) return

  gsap.to(element, {
    x: toPosition.x,
    y: toPosition.y,
    scale: 0.8,
    opacity: 0.5,
    rotation: gsap.utils.random(-10, 10),
    duration: ANIMATION_DURATION.NORMAL,
    ease: ANIMATION_EASE.POWER_IN,
    delay: options?.delay ?? 0,
    onComplete: options?.onComplete,
  })
}

/**
 * Card hover effect
 */
export function animateCardHover(element: HTMLElement | null, isHovering: boolean) {
  if (!element) return

  gsap.to(element, {
    y: isHovering ? -15 : 0,
    scale: isHovering ? 1.05 : 1,
    boxShadow: isHovering
      ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.2)',
    duration: ANIMATION_DURATION.FAST,
    ease: ANIMATION_EASE.POWER_OUT,
  })
}

/**
 * Card selection glow pulse
 */
export function animateCardSelect(element: HTMLElement | null) {
  if (!element) return

  gsap.fromTo(
    element,
    {
      boxShadow: '0 0 0px rgba(56, 189, 248, 0)',
    },
    {
      boxShadow: '0 0 30px rgba(56, 189, 248, 0.6)',
      duration: ANIMATION_DURATION.NORMAL,
      ease: ANIMATION_EASE.SINE,
      yoyo: true,
      repeat: 1,
    }
  )
}

// ============================================
// STONE ANIMATIONS
// ============================================

/**
 * Animate stone count change
 */
export function animateStoneCount(
  element: HTMLElement | null,
  direction: 'increase' | 'decrease'
) {
  if (!element) return

  const color = direction === 'increase' ? '#10b981' : '#ef4444'

  gsap.fromTo(
    element,
    {
      scale: 1,
      textShadow: `0 0 0px ${color}`,
    },
    {
      scale: 1.3,
      textShadow: `0 0 20px ${color}`,
      duration: ANIMATION_DURATION.FAST,
      ease: ANIMATION_EASE.BOUNCE_OUT,
      yoyo: true,
      repeat: 1,
    }
  )
}

/**
 * Animate stone flying to/from pool
 */
export function animateStoneTransfer(
  element: HTMLElement | null,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options?: {
    delay?: number
    onComplete?: () => void
    color?: string
  }
) {
  if (!element) return

  const color = options?.color ?? '#f59e0b'

  gsap.fromTo(
    element,
    {
      x: from.x,
      y: from.y,
      scale: 0.5,
      opacity: 1,
      boxShadow: `0 0 10px ${color}`,
    },
    {
      x: to.x,
      y: to.y,
      scale: 1,
      opacity: 0,
      boxShadow: `0 0 30px ${color}`,
      duration: ANIMATION_DURATION.SLOW,
      ease: ANIMATION_EASE.POWER_OUT,
      delay: options?.delay ?? 0,
      onComplete: options?.onComplete,
    }
  )
}

/**
 * Animate stone glow pulse (available state)
 */
export function animateStoneGlow(element: HTMLElement | null, isActive: boolean) {
  if (!element) return

  if (isActive) {
    gsap.to(element, {
      boxShadow: '0 0 20px rgba(245, 158, 11, 0.6)',
      duration: ANIMATION_DURATION.SLOW,
      ease: ANIMATION_EASE.SINE,
      yoyo: true,
      repeat: -1,
    })
  } else {
    gsap.killTweensOf(element)
    gsap.to(element, {
      boxShadow: '0 0 0px rgba(245, 158, 11, 0)',
      duration: ANIMATION_DURATION.FAST,
    })
  }
}

// ============================================
// EFFECT ANIMATIONS
// ============================================

/**
 * Animate effect activation (magic circle)
 */
export function animateEffectActivation(
  element: HTMLElement | null,
  options?: { onComplete?: () => void }
) {
  if (!element) return

  const tl = gsap.timeline({
    onComplete: options?.onComplete,
  })

  // Glow burst
  tl.fromTo(
    element,
    {
      boxShadow: '0 0 0px rgba(168, 85, 247, 0)',
      scale: 1,
    },
    {
      boxShadow: '0 0 40px rgba(168, 85, 247, 0.8), 0 0 80px rgba(168, 85, 247, 0.4)',
      scale: 1.05,
      duration: ANIMATION_DURATION.FAST,
      ease: ANIMATION_EASE.POWER_OUT,
    }
  )

  // Pulse
  tl.to(element, {
    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
    scale: 1,
    duration: ANIMATION_DURATION.SLOW,
    ease: ANIMATION_EASE.SINE,
  })

  return tl
}

/**
 * Animate rune circle spinning
 */
export function animateRuneCircle(element: HTMLElement | null) {
  if (!element) return

  gsap.to(element, {
    rotation: 360,
    duration: 20,
    ease: 'none',
    repeat: -1,
  })
}

// ============================================
// UI ANIMATIONS
// ============================================

/**
 * Animate phase transition
 */
export function animatePhaseTransition(
  element: HTMLElement | null,
  options?: { onComplete?: () => void }
) {
  if (!element) return

  const tl = gsap.timeline({
    onComplete: options?.onComplete,
  })

  tl.fromTo(
    element,
    {
      opacity: 0,
      y: -20,
      scale: 0.9,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: ANIMATION_DURATION.NORMAL,
      ease: ANIMATION_EASE.BOUNCE_OUT,
    }
  )

  return tl
}

/**
 * Animate button hover
 */
export function animateButtonHover(element: HTMLElement | null, isHovering: boolean) {
  if (!element) return

  gsap.to(element, {
    scale: isHovering ? 1.05 : 1,
    y: isHovering ? -2 : 0,
    duration: ANIMATION_DURATION.FAST,
    ease: ANIMATION_EASE.POWER_OUT,
  })
}

/**
 * Animate shake (error state)
 */
export function animateShake(element: HTMLElement | null) {
  if (!element) return

  gsap.fromTo(
    element,
    { x: -5 },
    {
      x: 0,
      keyframes: {
        x: [-5, 5, -5, 5, 0],
      },
      duration: ANIMATION_DURATION.NORMAL,
      ease: 'power2.inOut',
    }
  )
}

/**
 * Animate number change (score, count, etc)
 */
export function animateNumberChange(
  element: HTMLElement | null,
  from: number,
  to: number,
  options?: {
    duration?: number
    onUpdate?: (value: number) => void
  }
) {
  if (!element) return

  const obj = { value: from }

  gsap.to(obj, {
    value: to,
    duration: options?.duration ?? ANIMATION_DURATION.SLOW,
    ease: ANIMATION_EASE.POWER_OUT,
    onUpdate: () => {
      if (options?.onUpdate) {
        options.onUpdate(Math.round(obj.value))
      } else {
        element.textContent = Math.round(obj.value).toString()
      }
    },
  })
}

// ============================================
// PARTICLE EFFECTS (CSS-based)
// ============================================

/**
 * Create particle explosion CSS classes
 */
export function createParticleExplosion(
  container: HTMLElement | null,
  count: number = 8,
  color: string = '#f59e0b'
) {
  if (!container) return

  const particles: HTMLElement[] = []

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div')
    particle.className = 'absolute w-2 h-2 rounded-full pointer-events-none'
    particle.style.background = color
    particle.style.boxShadow = `0 0 6px ${color}`
    container.appendChild(particle)
    particles.push(particle)
  }

  particles.forEach((particle, i) => {
    const angle = (i / count) * Math.PI * 2
    const distance = gsap.utils.random(50, 100)

    gsap.fromTo(
      particle,
      {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
      },
      {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: 0,
        opacity: 0,
        duration: ANIMATION_DURATION.SLOW,
        ease: ANIMATION_EASE.POWER_OUT,
        onComplete: () => particle.remove(),
      }
    )
  })
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation duration based on reduced motion preference
 */
export function getAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0.01 : duration
}

/**
 * Kill all animations on an element
 */
export function killAnimations(element: HTMLElement | null) {
  if (!element) return
  gsap.killTweensOf(element)
}

/**
 * Stagger animation for multiple elements
 */
export function animateStagger(
  elements: HTMLElement[],
  animation: gsap.TweenVars,
  staggerDelay: number = 0.1
) {
  gsap.to(elements, {
    ...animation,
    stagger: staggerDelay,
  })
}

export default {
  animateCardDraw,
  animateCardPlay,
  animateCardDiscard,
  animateCardHover,
  animateCardSelect,
  animateStoneCount,
  animateStoneTransfer,
  animateStoneGlow,
  animateEffectActivation,
  animateRuneCircle,
  animatePhaseTransition,
  animateButtonHover,
  animateShake,
  animateNumberChange,
  createParticleExplosion,
  prefersReducedMotion,
  getAnimationDuration,
  killAnimations,
  animateStagger,
}
