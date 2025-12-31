/**
 * Animation Hooks for Vale of Eternity
 * React hooks for GSAP animations
 * @version 1.0.0
 */
console.log('[hooks/useAnimation.ts] v1.0.0 loaded')

import { useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import {
  animateCardHover,
  animateCardSelect,
  animateStoneGlow,
  animateButtonHover,
  prefersReducedMotion,
  ANIMATION_DURATION,
  ANIMATION_EASE,
} from '@/lib/animations'

// ============================================
// USE CARD ANIMATION
// ============================================

export interface UseCardAnimationOptions {
  enableHover?: boolean
  enableSelect?: boolean
  isSelected?: boolean
}

export function useCardAnimation(options: UseCardAnimationOptions = {}) {
  const { enableHover = true, enableSelect = true, isSelected = false } = options
  const elementRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => {
    if (enableHover && !prefersReducedMotion()) {
      animateCardHover(elementRef.current, true)
    }
  }, [enableHover])

  const handleMouseLeave = useCallback(() => {
    if (enableHover && !prefersReducedMotion()) {
      animateCardHover(elementRef.current, false)
    }
  }, [enableHover])

  useEffect(() => {
    if (enableSelect && isSelected && !prefersReducedMotion()) {
      animateCardSelect(elementRef.current)
    }
  }, [enableSelect, isSelected])

  return {
    ref: elementRef,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  }
}

// ============================================
// USE HOVER ANIMATION
// ============================================

export interface UseHoverAnimationOptions {
  scale?: number
  y?: number
  glow?: boolean
  glowColor?: string
}

export function useHoverAnimation(options: UseHoverAnimationOptions = {}) {
  const { scale = 1.05, y = -5, glow = false, glowColor = 'rgba(139, 92, 246, 0.3)' } = options
  const elementRef = useRef<HTMLElement>(null)

  const handleMouseEnter = useCallback(() => {
    if (prefersReducedMotion()) return

    gsap.to(elementRef.current, {
      scale,
      y,
      boxShadow: glow ? `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px ${glowColor}` : undefined,
      duration: ANIMATION_DURATION.FAST,
      ease: ANIMATION_EASE.POWER_OUT,
    })
  }, [scale, y, glow, glowColor])

  const handleMouseLeave = useCallback(() => {
    if (prefersReducedMotion()) return

    gsap.to(elementRef.current, {
      scale: 1,
      y: 0,
      boxShadow: glow ? '0 4px 12px rgba(0, 0, 0, 0.2)' : undefined,
      duration: ANIMATION_DURATION.FAST,
      ease: ANIMATION_EASE.POWER_OUT,
    })
  }, [glow])

  return {
    ref: elementRef,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  }
}

// ============================================
// USE ENTRANCE ANIMATION
// ============================================

export type EntranceType = 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'bounce'

export interface UseEntranceAnimationOptions {
  type?: EntranceType
  delay?: number
  duration?: number
  trigger?: boolean
}

export function useEntranceAnimation(options: UseEntranceAnimationOptions = {}) {
  const { type = 'fade', delay = 0, duration = ANIMATION_DURATION.NORMAL, trigger = true } = options
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!trigger || prefersReducedMotion()) return

    const element = elementRef.current
    if (!element) return

    const animations: Record<EntranceType, gsap.TweenVars> = {
      fade: {
        opacity: 0,
      },
      'slide-up': {
        opacity: 0,
        y: 30,
      },
      'slide-down': {
        opacity: 0,
        y: -30,
      },
      scale: {
        opacity: 0,
        scale: 0.8,
      },
      bounce: {
        opacity: 0,
        scale: 0.5,
        y: 20,
      },
    }

    const eases: Record<EntranceType, string> = {
      fade: ANIMATION_EASE.POWER_OUT,
      'slide-up': ANIMATION_EASE.POWER_OUT,
      'slide-down': ANIMATION_EASE.POWER_OUT,
      scale: ANIMATION_EASE.POWER_OUT,
      bounce: ANIMATION_EASE.BOUNCE_OUT,
    }

    gsap.fromTo(
      element,
      animations[type],
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration,
        delay,
        ease: eases[type],
      }
    )
  }, [type, delay, duration, trigger])

  return elementRef
}

// ============================================
// USE STONE GLOW
// ============================================

export function useStoneGlow(isActive: boolean) {
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    animateStoneGlow(elementRef.current, isActive)

    return () => {
      if (elementRef.current) {
        gsap.killTweensOf(elementRef.current)
      }
    }
  }, [isActive])

  return elementRef
}

// ============================================
// USE BUTTON ANIMATION
// ============================================

export function useButtonAnimation() {
  const elementRef = useRef<HTMLButtonElement>(null)

  const handleMouseEnter = useCallback(() => {
    if (!prefersReducedMotion()) {
      animateButtonHover(elementRef.current, true)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!prefersReducedMotion()) {
      animateButtonHover(elementRef.current, false)
    }
  }, [])

  return {
    ref: elementRef,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  }
}

// ============================================
// USE PULSE ANIMATION
// ============================================

export function usePulseAnimation(isActive: boolean, color: string = 'rgba(56, 189, 248, 0.6)') {
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || prefersReducedMotion()) {
      if (elementRef.current) {
        gsap.killTweensOf(elementRef.current)
      }
      return
    }

    const element = elementRef.current
    if (!element) return

    gsap.to(element, {
      boxShadow: `0 0 20px ${color}`,
      duration: ANIMATION_DURATION.SLOW,
      ease: ANIMATION_EASE.SINE,
      yoyo: true,
      repeat: -1,
    })

    return () => {
      gsap.killTweensOf(element)
    }
  }, [isActive, color])

  return elementRef
}

// ============================================
// USE STAGGER ANIMATION
// ============================================

export function useStaggerAnimation(
  items: unknown[],
  options: {
    from?: gsap.TweenVars
    to?: gsap.TweenVars
    stagger?: number
    trigger?: boolean
  } = {}
) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (options.trigger === false || prefersReducedMotion()) return

    const container = containerRef.current
    if (!container) return

    const children = container.children
    if (children.length === 0) return

    gsap.fromTo(
      children,
      {
        opacity: 0,
        y: 20,
        ...options.from,
      },
      {
        opacity: 1,
        y: 0,
        duration: ANIMATION_DURATION.NORMAL,
        ease: ANIMATION_EASE.POWER_OUT,
        stagger: options.stagger ?? 0.05,
        ...options.to,
      }
    )
  }, [items.length, options.trigger])

  return containerRef
}

// ============================================
// USE DRAG ANIMATION
// ============================================

export function useDragAnimation() {
  const elementRef = useRef<HTMLElement>(null)
  const ghostRef = useRef<HTMLElement | null>(null)

  const handleDragStart = useCallback(() => {
    if (prefersReducedMotion()) return

    const element = elementRef.current
    if (!element) return

    gsap.to(element, {
      scale: 1.1,
      opacity: 0.8,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      duration: ANIMATION_DURATION.FAST,
      ease: ANIMATION_EASE.POWER_OUT,
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    if (prefersReducedMotion()) return

    const element = elementRef.current
    if (!element) return

    gsap.to(element, {
      scale: 1,
      opacity: 1,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      duration: ANIMATION_DURATION.FAST,
      ease: ANIMATION_EASE.BOUNCE_OUT,
    })
  }, [])

  return {
    ref: elementRef,
    ghostRef,
    handlers: {
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    },
  }
}

// ============================================
// USE NUMBER TRANSITION
// ============================================

export function useNumberTransition(
  value: number,
  options: { duration?: number } = {}
) {
  const displayRef = useRef<HTMLElement>(null)
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (prefersReducedMotion() || prevValueRef.current === value) {
      prevValueRef.current = value
      return
    }

    const element = displayRef.current
    if (!element) return

    const obj = { value: prevValueRef.current }

    gsap.to(obj, {
      value,
      duration: options.duration ?? ANIMATION_DURATION.SLOW,
      ease: ANIMATION_EASE.POWER_OUT,
      onUpdate: () => {
        element.textContent = Math.round(obj.value).toString()
      },
    })

    // Bounce effect
    gsap.fromTo(
      element,
      { scale: 1 },
      {
        scale: value > prevValueRef.current ? 1.2 : 0.9,
        duration: ANIMATION_DURATION.FAST,
        ease: ANIMATION_EASE.POWER_OUT,
        yoyo: true,
        repeat: 1,
      }
    )

    prevValueRef.current = value
  }, [value, options.duration])

  return displayRef
}

export default {
  useCardAnimation,
  useHoverAnimation,
  useEntranceAnimation,
  useStoneGlow,
  useButtonAnimation,
  usePulseAnimation,
  useStaggerAnimation,
  useDragAnimation,
  useNumberTransition,
}
