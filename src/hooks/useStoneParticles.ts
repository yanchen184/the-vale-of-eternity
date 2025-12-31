/**
 * useStoneParticles Hook
 * Manages stone particle effects for gain/spend animations
 * @version 1.0.0
 */
console.log('[hooks/useStoneParticles.ts] v1.0.0 loaded')

import { useState, useCallback } from 'react'
import type { StoneType } from '@/types/cards'

export interface ParticleEffect {
  id: string
  stoneType: StoneType
  count: number
  type: 'gain' | 'spend'
  origin?: { x: number; y: number }
}

export function useStoneParticles() {
  const [activeEffects, setActiveEffects] = useState<ParticleEffect[]>([])

  /**
   * Trigger a stone gain particle effect
   */
  const triggerGain = useCallback((stoneType: StoneType, count: number = 1, origin?: { x: number; y: number }) => {
    const effect: ParticleEffect = {
      id: `gain-${Date.now()}-${Math.random()}`,
      stoneType,
      count,
      type: 'gain',
      origin,
    }
    setActiveEffects((prev) => [...prev, effect])
  }, [])

  /**
   * Trigger a stone spend particle effect
   */
  const triggerSpend = useCallback((stoneType: StoneType, count: number = 1, origin?: { x: number; y: number }) => {
    const effect: ParticleEffect = {
      id: `spend-${Date.now()}-${Math.random()}`,
      stoneType,
      count,
      type: 'spend',
      origin,
    }
    setActiveEffects((prev) => [...prev, effect])
  }, [])

  /**
   * Remove a completed effect
   */
  const removeEffect = useCallback((id: string) => {
    setActiveEffects((prev) => prev.filter((e) => e.id !== id))
  }, [])

  /**
   * Clear all active effects
   */
  const clearAll = useCallback(() => {
    setActiveEffects([])
  }, [])

  return {
    activeEffects,
    triggerGain,
    triggerSpend,
    removeEffect,
    clearAll,
  }
}

export default useStoneParticles
