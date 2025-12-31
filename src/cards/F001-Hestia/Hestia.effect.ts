/**
 * Hestia Effect Implementation
 * Permanently increases player's stone limit by 2
 * @version 1.0.0
 */
console.log('[cards/F001-Hestia/Hestia.effect.ts] v1.0.0 loaded')

import { BaseEffect, type EffectContext, type EffectResult } from '@/lib/effects'
import { EffectType, EffectTrigger, CardLocation } from '@/types/cards'

/**
 * Hestia's stone limit increase effect
 * This is a permanent effect that increases the player's stone capacity
 */
export class HestiaEffect extends BaseEffect {
  constructor() {
    super(EffectType.INCREASE_STONE_LIMIT, EffectTrigger.PERMANENT)
  }

  /**
   * Check if Hestia's effect can be applied
   * Requirements:
   * - Card must be in player's field (not hand, not market)
   * - Effect value must be defined
   */
  canApply(context: EffectContext): boolean {
    const { card } = context

    // Must be in field to have permanent effect
    if (card.location !== CardLocation.FIELD) {
      return false
    }

    // Effect value must be defined
    const effectValue = this.getEffectValue(card)
    if (effectValue === undefined || effectValue <= 0) {
      return false
    }

    return true
  }

  /**
   * Apply Hestia's effect
   * Increases player's stone limit by the effect value (default: 2)
   */
  apply(context: EffectContext): EffectResult {
    const { card, state } = context
    const effectValue = this.getEffectValue(card) || 2

    // Get the single player from state (single player mode)
    const player = state.player

    if (!player) {
      return this.createFailureResult('Player not found')
    }

    // Current stone limit before effect (default 3 for single player)
    const oldLimit = 3

    // Calculate new stone limit
    const newLimit = oldLimit + effectValue

    // Return effect result with state changes
    return this.createSuccessResult(
      `Stone limit increased from ${oldLimit} to ${newLimit}`,
      {
        stateChanges: {
          stoneLimitChange: effectValue,
          stoneLimit: newLimit,
        },
      }
    )
  }

  /**
   * Calculate total stone limit for a player
   * considering all Hestia cards in their field
   * @param state - Single player game state
   * @returns Total stone limit
   */
  static calculatePlayerStoneLimit(state: { player?: { field?: { instanceId: string; effects: Array<{ type: string; value?: number }> }[] } }): number {
    const player = state.player
    if (!player) return 3 // Default limit

    const BASE_LIMIT = 3
    let totalIncrease = 0

    // Find all cards in field with INCREASE_STONE_LIMIT effects
    const fieldCards = player.field || []

    // Sum up all INCREASE_STONE_LIMIT effects
    for (const card of fieldCards) {
      if (!card) continue
      for (const effect of card.effects) {
        if (effect.type === EffectType.INCREASE_STONE_LIMIT && effect.value) {
          totalIncrease += effect.value
        }
      }
    }

    return BASE_LIMIT + totalIncrease
  }
}

export default HestiaEffect
