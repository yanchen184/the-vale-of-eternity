/**
 * Imp Effect Implementation
 * F002 - Fire element card with dual effects:
 * 1. EarnStonesEffect: Earn 3 one-point stones when tamed
 * 2. RecoverEffect: Mark card as recoverable by other cards
 * @version 1.0.0
 */
console.log('[cards/F002-Imp/Imp.effect.ts] v1.0.0 loaded')

import { BaseEffect, type EffectContext, type EffectResult } from '@/lib/effects'
import { EffectType, EffectTrigger, CardLocation, StoneType } from '@/types/cards'
import type { StonePool } from '@/types/game'
import { stoneConfigsToPool } from '@/lib/effect-system'

// ============================================
// EFFECT 1: EARN STONES ON TAME
// ============================================

/**
 * Imp's stone earning effect
 * Triggered when the card is tamed (moved to field)
 * Earns 3 one-point stones
 */
export class ImpEarnStonesEffect extends BaseEffect {
  constructor() {
    super(EffectType.EARN_STONES, EffectTrigger.ON_TAME)
  }

  /**
   * Check if the earn stones effect can be applied
   * Requirements:
   * - Trigger type must be ON_TAME
   * - Card must be transitioning to FIELD (being tamed)
   * - Stones configuration must be defined
   */
  canApply(context: EffectContext): boolean {
    const { card, triggerType } = context

    // Must be triggered during tame action
    if (triggerType !== EffectTrigger.ON_TAME) {
      return false
    }

    // Card should be in field (just tamed)
    if (card.location !== CardLocation.FIELD) {
      return false
    }

    // Check if stones configuration exists
    const stonesConfig = this.getEffectStones(card)
    if (!stonesConfig || stonesConfig.length === 0) {
      return false
    }

    return true
  }

  /**
   * Apply the earn stones effect
   * Converts stone configuration to pool additions
   * Returns the stones gained for state update
   */
  apply(context: EffectContext): EffectResult {
    const { card, state } = context

    // Get stones configuration from card effect
    const stonesConfig = this.getEffectStones(card) || [
      { type: StoneType.ONE, amount: 3 }, // Default fallback
    ]

    // Convert stone configs to pool format
    const stonesGained = stoneConfigsToPool(stonesConfig) as Partial<StonePool>

    // Validate player exists (single player mode)
    const player = state.player
    if (!player) {
      return this.createFailureResult('Player not found')
    }

    return this.createSuccessResult(
      `Gained 3 ONE stones`,
      {
        stonesGained,
        stateChanges: {
          effectApplied: 'ImpEarnStones',
          stonesAdded: stonesGained,
        },
      }
    )
  }

  /**
   * Calculate total stones that would be earned
   * Utility method for UI preview
   * @param context - Effect context
   * @returns Total stone count
   */
  static calculateStonesEarned(context: EffectContext): number {
    const card = context.card
    const effect = card.effects.find(
      (e) => e.type === EffectType.EARN_STONES && e.trigger === EffectTrigger.ON_TAME
    )

    if (!effect?.stones) {
      return 3 // Default for Imp
    }

    return effect.stones.reduce((total, config) => total + config.amount, 0)
  }
}

// ============================================
// EFFECT 2: RECOVER CARD (PERMANENT MARKER)
// ============================================

/**
 * Imp's recover card effect
 * This is a permanent effect that marks the card as recoverable
 * When another card triggers a recover effect, this card can be
 * moved from field back to hand
 */
export class ImpRecoverEffect extends BaseEffect {
  constructor() {
    super(EffectType.RECOVER_CARD, EffectTrigger.PERMANENT)
  }

  /**
   * Check if the recover effect marker is active
   * Requirements:
   * - Card must be in player's field
   * - Card must not already be marked for recovery this turn
   */
  canApply(context: EffectContext): boolean {
    const { card } = context

    // Must be in field to be recoverable
    if (card.location !== CardLocation.FIELD) {
      return false
    }

    // Check if card is owned by a player
    if (!card.ownerId) {
      return false
    }

    return true
  }

  /**
   * Apply the recover effect marker
   * This doesn't immediately move the card, but marks it as eligible
   * for recovery when another card's effect targets it
   *
   * The actual card movement happens when:
   * 1. Another card triggers RECOVER_CARD with a target
   * 2. Game engine checks this card's canRecover status
   * 3. Card is moved from FIELD to HAND
   */
  apply(context: EffectContext): EffectResult {
    const { card } = context

    // Mark card as recoverable in state changes
    return this.createSuccessResult(
      `Card marked as recoverable`,
      {
        stateChanges: {
          recoverable: true,
          recoverableCardId: card.instanceId,
          effectApplied: 'ImpRecoverMarker',
        },
      }
    )
  }

  /**
   * Check if a specific card can be recovered
   * Static utility method for game engine
   * @param card - Card instance to check
   * @returns Whether the card can be recovered
   */
  static canRecoverCard(
    card: { effects: readonly { type: EffectType; trigger: EffectTrigger }[] }
  ): boolean {
    // Check if card has RECOVER_CARD permanent effect
    return card.effects.some(
      (e) => e.type === EffectType.RECOVER_CARD && e.trigger === EffectTrigger.PERMANENT
    )
  }

  /**
   * Get all recoverable cards from a player's field
   * Static utility method for game engine
   * @param playerField - Player's field cards
   * @returns Array of recoverable card instance IDs
   */
  static getRecoverableCards(
    playerField: readonly { instanceId: string; effects: readonly { type: EffectType; trigger: EffectTrigger }[] }[]
  ): string[] {
    return playerField
      .filter((card) =>
        card.effects.some(
          (e) => e.type === EffectType.RECOVER_CARD && e.trigger === EffectTrigger.PERMANENT
        )
      )
      .map((card) => card.instanceId)
  }
}

// ============================================
// COMBINED EFFECT HANDLER
// ============================================

/**
 * Combined Imp effects handler
 * Provides utility methods for managing both effects
 */
export class ImpEffects {
  /** Earn stones effect instance */
  static readonly earnStones = new ImpEarnStonesEffect()

  /** Recover marker effect instance */
  static readonly recover = new ImpRecoverEffect()

  /**
   * Get all Imp effects
   * @returns Array of effect instances
   */
  static getAllEffects(): BaseEffect[] {
    return [ImpEffects.earnStones, ImpEffects.recover]
  }

  /**
   * Process Imp card when tamed
   * Handles the ON_TAME effect
   * @param context - Effect context
   * @returns Effect result
   */
  static processOnTame(context: EffectContext): EffectResult {
    if (ImpEffects.earnStones.canApply(context)) {
      return ImpEffects.earnStones.apply(context)
    }
    return {
      success: false,
      message: 'Imp earn stones effect cannot be applied',
    }
  }

  /**
   * Check if Imp can be recovered
   * @param card - Card instance
   * @returns Whether the card can be recovered
   */
  static canBeRecovered(card: { location?: string; effects: readonly { type: EffectType; trigger: EffectTrigger }[] }): boolean {
    return ImpRecoverEffect.canRecoverCard(card)
  }
}

export default ImpEffects
