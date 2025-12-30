/**
 * F002 Imp Integration Tests
 * Tests card behavior within game system
 * Based on CARD_DEVELOPMENT_GUIDE.md integration test requirements
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { IMP_CARD } from './Imp.card'
import { ImpEarnStonesEffect, ImpRecoverEffect, ImpEffects } from './Imp.effect'
import { CardLocation, EffectTrigger } from '@/types/cards'
import type { CardInstance } from '@/types/cards'
import type { EffectContext } from '@/lib/effects'

describe('F002 - Imp Integration Tests', () => {
  let impInstance: CardInstance

  beforeEach(() => {
    // Create a card instance from template
    impInstance = {
      ...IMP_CARD,
      instanceId: 'imp-001',
      location: CardLocation.FIELD,
      ownerId: '0',
      isRevealed: true,
    }
  })

  // ============================================
  // EFFECT INSTANTIATION TESTS
  // ============================================

  describe('Effect Instantiation', () => {
    it('should create ImpEarnStonesEffect instance', () => {
      const effect = new ImpEarnStonesEffect()
      expect(effect).toBeInstanceOf(ImpEarnStonesEffect)
    })

    it('should have correct effect type for EarnStones', () => {
      const effect = new ImpEarnStonesEffect()
      expect(effect.effectType).toBe('EARN_STONES')
    })

    it('should have correct trigger type for EarnStones', () => {
      const effect = new ImpEarnStonesEffect()
      expect(effect.triggerType).toBe(EffectTrigger.ON_TAME)
    })

    it('should create ImpRecoverEffect instance', () => {
      const effect = new ImpRecoverEffect()
      expect(effect).toBeInstanceOf(ImpRecoverEffect)
    })

    it('should have correct effect type for Recover', () => {
      const effect = new ImpRecoverEffect()
      expect(effect.effectType).toBe('RECOVER_CARD')
    })

    it('should have correct trigger type for Recover', () => {
      const effect = new ImpRecoverEffect()
      expect(effect.triggerType).toBe(EffectTrigger.PERMANENT)
    })
  })

  // ============================================
  // EARN_STONES EFFECT TESTS
  // ============================================

  describe('EarnStones Effect - Can Apply', () => {
    let effect: ImpEarnStonesEffect
    let context: EffectContext

    beforeEach(() => {
      effect = new ImpEarnStonesEffect()
      context = {
        card: impInstance,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              stones: { ONE: 0, THREE: 0, SIX: 0, WATER: 0, FIRE: 0, EARTH: 0, WIND: 0 },
              field: ['imp-001'],
            },
          ],
        },
        triggerType: EffectTrigger.ON_TAME,
      }
    })

    it('should return true when trigger is ON_TAME', () => {
      const result = effect.canApply(context)
      expect(result).toBe(true)
    })

    it('should return false when trigger is not ON_TAME', () => {
      context.triggerType = EffectTrigger.PERMANENT
      const result = effect.canApply(context)
      expect(result).toBe(false)
    })

    it('should return true when card is in field', () => {
      impInstance.location = CardLocation.FIELD
      const result = effect.canApply(context)
      expect(result).toBe(true)
    })

    it('should return false when stones config is missing', () => {
      const invalidCard = { ...impInstance, effects: [{ ...impInstance.effects[0], stones: undefined }] }
      context.card = invalidCard
      const result = effect.canApply(context)
      expect(result).toBe(false)
    })
  })

  describe('EarnStones Effect - Apply', () => {
    let effect: ImpEarnStonesEffect
    let context: EffectContext

    beforeEach(() => {
      effect = new ImpEarnStonesEffect()
      context = {
        card: impInstance,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              stones: { ONE: 0, THREE: 0, SIX: 0, WATER: 0, FIRE: 0, EARTH: 0, WIND: 0 },
              field: ['imp-001'],
            },
          ],
        },
        triggerType: EffectTrigger.ON_TAME,
      }
    })

    it('should gain 3 ONE stones', () => {
      const result = effect.apply(context)
      expect(result.success).toBe(true)
      expect(result.stonesGained).toBeDefined()
      expect(result.stonesGained?.ONE).toBe(3)
    })

    it('should return success message', () => {
      const result = effect.apply(context)
      expect(result.success).toBe(true)
      expect(result.message).toContain('Gained 3 ONE stones')
    })

    it('should fail when player not found', () => {
      context.state.players = []
      const result = effect.apply(context)
      expect(result.success).toBe(false)
      expect(result.message).toContain('Player not found')
    })
  })

  // ============================================
  // RECOVER_CARD EFFECT TESTS
  // ============================================

  describe('Recover Effect - Can Apply', () => {
    let effect: ImpRecoverEffect
    let context: EffectContext

    beforeEach(() => {
      effect = new ImpRecoverEffect()
      context = {
        card: impInstance,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              field: ['imp-001'],
            },
          ],
        },
        triggerType: EffectTrigger.PERMANENT,
      }
    })

    it('should return true when card is in field', () => {
      impInstance.location = CardLocation.FIELD
      const result = effect.canApply(context)
      expect(result).toBe(true)
    })

    it('should return false when card is in hand', () => {
      impInstance.location = CardLocation.HAND
      const result = effect.canApply(context)
      expect(result).toBe(false)
    })

    it('should return false when card is in market', () => {
      impInstance.location = CardLocation.MARKET
      const result = effect.canApply(context)
      expect(result).toBe(false)
    })

    it('should return false when card has no owner', () => {
      impInstance.ownerId = null
      const result = effect.canApply(context)
      expect(result).toBe(false)
    })
  })

  describe('Recover Effect - Apply', () => {
    let effect: ImpRecoverEffect
    let context: EffectContext

    beforeEach(() => {
      effect = new ImpRecoverEffect()
      context = {
        card: impInstance,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              field: ['imp-001'],
            },
          ],
        },
        triggerType: EffectTrigger.PERMANENT,
      }
    })

    it('should mark card as recoverable', () => {
      const result = effect.apply(context)
      expect(result.success).toBe(true)
      expect(result.stateChanges?.recoverable).toBe(true)
    })

    it('should return success message', () => {
      const result = effect.apply(context)
      expect(result.success).toBe(true)
      expect(result.message).toContain('Card marked as recoverable')
    })
  })

  // ============================================
  // STATIC UTILITY METHODS TESTS
  // ============================================

  describe('Static Utility Methods', () => {
    it('should correctly identify recoverable card', () => {
      const result = ImpRecoverEffect.canRecoverCard(impInstance)
      expect(result).toBe(true)
    })

    it('should not identify non-recoverable card', () => {
      const nonRecoverableCard = {
        ...impInstance,
        effects: [impInstance.effects[0]], // Only EARN_STONES effect
      }
      const result = ImpRecoverEffect.canRecoverCard(nonRecoverableCard)
      expect(result).toBe(false)
    })

    it('should get all recoverable cards from field', () => {
      const cards = [
        impInstance,
        { ...impInstance, instanceId: 'imp-002' },
        { ...impInstance, instanceId: 'other-001', effects: [] }, // Not recoverable
      ]
      const recoverableCards = ImpRecoverEffect.getRecoverableCards(cards)
      expect(recoverableCards).toHaveLength(2)
    })
  })

  // ============================================
  // IMP EFFECTS COMBO CLASS TESTS
  // ============================================

  describe('ImpEffects Combo Class', () => {
    let context: EffectContext

    beforeEach(() => {
      context = {
        card: impInstance,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              stones: { ONE: 0, THREE: 0, SIX: 0, WATER: 0, FIRE: 0, EARTH: 0, WIND: 0 },
              field: ['imp-001'],
            },
          ],
        },
        triggerType: EffectTrigger.ON_TAME,
      }
    })

    it('should process ON_TAME effect correctly', () => {
      const result = ImpEffects.processOnTame(context)
      expect(result.success).toBe(true)
      expect(result.stonesGained?.ONE).toBe(3)
    })

    it('should check if card can be recovered', () => {
      const result = ImpEffects.canBeRecovered(impInstance)
      expect(result).toBe(true)
    })
  })

  // ============================================
  // RECOVERY CYCLE TESTS
  // ============================================

  describe('Recovery Cycle Simulation', () => {
    it('should simulate full recovery cycle', () => {
      const earnEffect = new ImpEarnStonesEffect()

      // First taming
      const context1: EffectContext = {
        card: impInstance,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              stones: { ONE: 0, THREE: 0, SIX: 0, WATER: 0, FIRE: 0, EARTH: 0, WIND: 0 },
              field: [],
            },
          ],
        },
        triggerType: EffectTrigger.ON_TAME,
      }

      const result1 = earnEffect.apply(context1)
      expect(result1.stonesGained?.ONE).toBe(3)

      // Simulate recovery (card goes back to hand)
      impInstance.location = CardLocation.HAND

      // Second taming (after recovery)
      impInstance.location = CardLocation.FIELD
      const context2: EffectContext = {
        ...context1,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              stones: { ONE: 3, THREE: 0, SIX: 0, WATER: 0, FIRE: 0, EARTH: 0, WIND: 0 },
              field: ['imp-001'],
            },
          ],
        },
      }

      const result2 = earnEffect.apply(context2)
      expect(result2.stonesGained?.ONE).toBe(3)

      // Total stones gained across 2 cycles = 6
      const totalStonesGained = (result1.stonesGained?.ONE || 0) + (result2.stonesGained?.ONE || 0)
      expect(totalStonesGained).toBe(6)
    })
  })

  // ============================================
  // DESCRIPTION TESTS
  // ============================================

  describe('Effect Description', () => {
    it('should get English description for EarnStones', () => {
      const effect = new ImpEarnStonesEffect()
      const description = effect.getDescription(impInstance, 'en')
      expect(description).toBe('Earn 1 1 1.')
    })

    it('should get Chinese description for EarnStones', () => {
      const effect = new ImpEarnStonesEffect()
      const description = effect.getDescription(impInstance, 'tw')
      expect(description).toBe('獲得 3 個 1 點石頭。')
    })

    it('should get English description for Recover', () => {
      const effect = new ImpRecoverEffect()
      const description = effect.getDescription(impInstance, 'en')
      expect(description).toBe('Recover.')
    })

    it('should get Chinese description for Recover', () => {
      const effect = new ImpRecoverEffect()
      const description = effect.getDescription(impInstance, 'tw')
      expect(description).toBe('可被回收。')
    })
  })
})
