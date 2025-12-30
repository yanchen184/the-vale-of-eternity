/**
 * Base Effect Class for Card Effects
 * Provides common functionality for all card effects
 * @version 1.0.0
 */
console.log('[lib/effects/BaseEffect.ts] v1.0.0 loaded')

import type { CardInstance } from '@/types/cards'
import type { SinglePlayerGameState, StonePool } from '@/types/game'
import { EffectType, EffectTrigger } from '@/types/cards'

// ============================================
// EFFECT RESULT INTERFACE
// ============================================

export interface EffectResult {
  success: boolean
  message: string
  stonesGained?: Partial<StonePool>
  stonesLost?: Partial<StonePool>
  cardsDrawn?: CardInstance[]
  cardsReturned?: CardInstance[]
  stateChanges?: {
    stoneLimit?: number
    stoneLimitChange?: number
    scoreBonus?: number
    [key: string]: unknown
  }
}

// ============================================
// EFFECT CONTEXT INTERFACE
// ============================================

export interface EffectContext {
  card: CardInstance
  state: SinglePlayerGameState
  playerIndex?: number
  triggerType: EffectTrigger
  additionalData?: Record<string, unknown>
}

// ============================================
// BASE EFFECT CLASS
// ============================================

/**
 * Abstract base class for all card effects
 */
export abstract class BaseEffect {
  constructor(
    public readonly effectType: EffectType,
    public readonly triggerType: EffectTrigger
  ) {}

  /**
   * Check if this effect can be applied
   * @param context - The effect context
   * @returns true if the effect can be applied
   */
  abstract canApply(context: EffectContext): boolean

  /**
   * Apply the effect
   * @param context - The effect context
   * @returns The effect result
   */
  abstract apply(context: EffectContext): EffectResult

  /**
   * Get effect description
   * @param card - The card instance
   * @param language - 'en' or 'tw'
   * @returns Effect description
   */
  getDescription(card: CardInstance, language: 'en' | 'tw' = 'en'): string {
    const effect = card.effects.find(
      (e) => e.type === this.effectType && e.trigger === this.triggerType
    )
    if (!effect) return ''
    return language === 'en' ? effect.description || '' : effect.descriptionTw || ''
  }

  /**
   * Get effect value from card
   * @param card - The card instance
   * @returns Effect value or undefined
   */
  protected getEffectValue(card: CardInstance): number | undefined {
    const effect = card.effects.find(
      (e) => e.type === this.effectType && e.trigger === this.triggerType
    )
    return effect?.value
  }

  /**
   * Get effect stones configuration from card
   * @param card - The card instance
   * @returns Stones configuration or undefined
   */
  protected getEffectStones(card: CardInstance) {
    const effect = card.effects.find(
      (e) => e.type === this.effectType && e.trigger === this.triggerType
    )
    return effect?.stones
  }

  /**
   * Create a success result
   */
  protected createSuccessResult(message: string, changes?: Partial<EffectResult>): EffectResult {
    return {
      success: true,
      message,
      ...changes,
    }
  }

  /**
   * Create a failure result
   */
  protected createFailureResult(message: string): EffectResult {
    return {
      success: false,
      message,
    }
  }
}

// ============================================
// EFFECT FACTORY INTERFACE
// ============================================

export interface EffectFactory {
  createEffect(effectType: EffectType, triggerType: EffectTrigger): BaseEffect | null
}
