/**
 * Effect Registry System
 * Manages registration and execution of all card effects
 * @version 1.0.0
 */
console.log('[lib/effects/EffectRegistry.ts] v1.0.0 loaded')

import { EffectType, EffectTrigger } from '@/types/cards'
import { BaseEffect, type EffectContext, type EffectResult } from './BaseEffect'

// ============================================
// EFFECT REGISTRY
// ============================================

/**
 * Registry for all card effects
 * Singleton pattern to ensure single source of truth
 */
class EffectRegistry {
  private static instance: EffectRegistry
  private effects: Map<string, BaseEffect> = new Map()

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): EffectRegistry {
    if (!EffectRegistry.instance) {
      EffectRegistry.instance = new EffectRegistry()
    }
    return EffectRegistry.instance
  }

  /**
   * Generate a unique key for an effect
   */
  private getEffectKey(effectType: EffectType, triggerType: EffectTrigger): string {
    return `${effectType}:${triggerType}`
  }

  /**
   * Register an effect
   * @param effect - The effect to register
   */
  register(effect: BaseEffect): void {
    const key = this.getEffectKey(effect.effectType, effect.triggerType)

    if (this.effects.has(key)) {
      console.warn(`[EffectRegistry] Effect ${key} already registered, overwriting...`)
    }

    this.effects.set(key, effect)
    console.log(`[EffectRegistry] Registered effect: ${key}`)
  }

  /**
   * Get an effect by type and trigger
   * @param effectType - The effect type
   * @param triggerType - The trigger type
   * @returns The effect or undefined if not found
   */
  get(effectType: EffectType, triggerType: EffectTrigger): BaseEffect | undefined {
    const key = this.getEffectKey(effectType, triggerType)
    return this.effects.get(key)
  }

  /**
   * Check if an effect is registered
   * @param effectType - The effect type
   * @param triggerType - The trigger type
   * @returns true if the effect is registered
   */
  has(effectType: EffectType, triggerType: EffectTrigger): boolean {
    const key = this.getEffectKey(effectType, triggerType)
    return this.effects.has(key)
  }

  /**
   * Execute an effect
   * @param effectType - The effect type
   * @param triggerType - The trigger type
   * @param context - The effect context
   * @returns The effect result
   */
  execute(
    effectType: EffectType,
    triggerType: EffectTrigger,
    context: EffectContext
  ): EffectResult {
    const effect = this.get(effectType, triggerType)

    if (!effect) {
      console.error(`[EffectRegistry] Effect not found: ${effectType}:${triggerType}`)
      return {
        success: false,
        message: `Effect not implemented: ${effectType}`,
      }
    }

    // Check if effect can be applied
    if (!effect.canApply(context)) {
      console.log(`[EffectRegistry] Effect cannot be applied: ${effectType}:${triggerType}`)
      return {
        success: false,
        message: `Effect cannot be applied: ${effectType}`,
      }
    }

    // Apply the effect
    try {
      const result = effect.apply(context)
      console.log(`[EffectRegistry] Effect applied: ${effectType}:${triggerType}`, result)
      return result
    } catch (error) {
      console.error(`[EffectRegistry] Effect execution failed:`, error)
      return {
        success: false,
        message: `Effect execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Get all registered effects
   * @returns Array of registered effect keys
   */
  getAllEffects(): string[] {
    return Array.from(this.effects.keys())
  }

  /**
   * Clear all registered effects (for testing)
   */
  clear(): void {
    this.effects.clear()
    console.log('[EffectRegistry] All effects cleared')
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalEffects: number
    effectsByType: Record<EffectType, number>
    effectsByTrigger: Record<EffectTrigger, number>
  } {
    const stats = {
      totalEffects: this.effects.size,
      effectsByType: {} as Record<EffectType, number>,
      effectsByTrigger: {} as Record<EffectTrigger, number>,
    }

    this.effects.forEach((effect) => {
      stats.effectsByType[effect.effectType] =
        (stats.effectsByType[effect.effectType] || 0) + 1
      stats.effectsByTrigger[effect.triggerType] =
        (stats.effectsByTrigger[effect.triggerType] || 0) + 1
    })

    return stats
  }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export const effectRegistry = EffectRegistry.getInstance()

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Register an effect to the global registry
 * @param effect - The effect to register
 */
export function registerEffect(effect: BaseEffect): void {
  effectRegistry.register(effect)
}

/**
 * Execute an effect from the global registry
 * @param effectType - The effect type
 * @param triggerType - The trigger type
 * @param context - The effect context
 * @returns The effect result
 */
export function executeEffect(
  effectType: EffectType,
  triggerType: EffectTrigger,
  context: EffectContext
): EffectResult {
  return effectRegistry.execute(effectType, triggerType, context)
}

/**
 * Check if an effect is registered
 * @param effectType - The effect type
 * @param triggerType - The trigger type
 * @returns true if the effect is registered
 */
export function hasEffect(effectType: EffectType, triggerType: EffectTrigger): boolean {
  return effectRegistry.has(effectType, triggerType)
}

// ============================================
// EXPORT TYPES
// ============================================

export type { EffectContext, EffectResult } from './BaseEffect'
