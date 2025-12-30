/**
 * F001 Hestia Integration Tests
 * Tests card behavior within game system
 * Based on CARD_DEVELOPMENT_GUIDE.md integration test requirements
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { HESTIA_CARD } from './Hestia.card'
import { HestiaEffect } from './Hestia.effect'
import { CardLocation, EffectTrigger } from '@/types/cards'
import type { CardInstance } from '@/types/cards'
import type { EffectContext } from '@/lib/effects'

describe('F001 - Hestia Integration Tests', () => {
  let hestiaInstance: CardInstance

  beforeEach(() => {
    // Create a card instance from template
    hestiaInstance = {
      ...HESTIA_CARD,
      instanceId: 'hestia-001',
      location: CardLocation.FIELD,
      ownerId: '0',
      isRevealed: true,
    }
  })

  // ============================================
  // EFFECT INSTANTIATION TESTS
  // ============================================

  describe('Effect Instantiation', () => {
    it('should create HestiaEffect instance', () => {
      const effect = new HestiaEffect()
      expect(effect).toBeInstanceOf(HestiaEffect)
    })

    it('should have correct effect type', () => {
      const effect = new HestiaEffect()
      expect(effect.effectType).toBe('INCREASE_STONE_LIMIT')
    })

    it('should have correct trigger type', () => {
      const effect = new HestiaEffect()
      expect(effect.triggerType).toBe(EffectTrigger.PERMANENT)
    })
  })

  // ============================================
  // EFFECT CAN APPLY TESTS
  // ============================================

  describe('Effect Can Apply', () => {
    let effect: HestiaEffect
    let context: EffectContext

    beforeEach(() => {
      effect = new HestiaEffect()
      context = {
        card: hestiaInstance,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              stoneLimit: 3,
              field: ['hestia-001'],
            },
          ],
        },
        triggerType: EffectTrigger.PERMANENT,
      }
    })

    it('should return true when card is in field', () => {
      hestiaInstance.location = CardLocation.FIELD
      const result = effect.canApply(context)
      expect(result).toBe(true)
    })

    it('should return false when card is in hand', () => {
      hestiaInstance.location = CardLocation.HAND
      const result = effect.canApply(context)
      expect(result).toBe(false)
    })

    it('should return false when card is in market', () => {
      hestiaInstance.location = CardLocation.MARKET
      const result = effect.canApply(context)
      expect(result).toBe(false)
    })

    it('should return false when card is in deck', () => {
      hestiaInstance.location = CardLocation.DECK
      const result = effect.canApply(context)
      expect(result).toBe(false)
    })
  })

  // ============================================
  // EFFECT APPLY TESTS
  // ============================================

  describe('Effect Apply', () => {
    let effect: HestiaEffect
    let context: EffectContext

    beforeEach(() => {
      effect = new HestiaEffect()
      context = {
        card: hestiaInstance,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              stoneLimit: 3,
              field: ['hestia-001'],
            },
          ],
        },
        triggerType: EffectTrigger.PERMANENT,
      }
    })

    it('should increase stone limit by 2', () => {
      const result = effect.apply(context)
      expect(result.success).toBe(true)
      expect(result.stateChanges?.stoneLimitChange).toBe(2)
      expect(result.stateChanges?.stoneLimit).toBe(5)
    })

    it('should return success message', () => {
      const result = effect.apply(context)
      expect(result.success).toBe(true)
      expect(result.message).toContain('Stone limit increased')
      expect(result.message).toContain('from 3 to 5')
    })
  })

  // ============================================
  // MULTIPLE HESTIA STACKING TESTS
  // ============================================

  describe('Multiple Hestia Cards Stacking', () => {
    it('should stack multiple Hestia effects', () => {
      const effect = new HestiaEffect()

      // First Hestia
      const context1: EffectContext = {
        card: hestiaInstance,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              stoneLimit: 3,
              field: ['hestia-001'],
            },
          ],
        },
        triggerType: EffectTrigger.PERMANENT,
      }

      const result1 = effect.apply(context1)
      expect(result1.stateChanges?.stoneLimit).toBe(5)

      // Second Hestia
      const hestia2Instance = {
        ...hestiaInstance,
        instanceId: 'hestia-002',
      }

      const context2: EffectContext = {
        card: hestia2Instance,
        state: {
          players: [
            {
              index: 0,
              name: 'Player 1',
              stoneLimit: 5, // After first Hestia
              field: ['hestia-001', 'hestia-002'],
            },
          ],
        },
        triggerType: EffectTrigger.PERMANENT,
      }

      const result2 = effect.apply(context2)
      expect(result2.stateChanges?.stoneLimit).toBe(7) // 5 + 2 = 7
    })
  })

  // ============================================
  // STATIC UTILITY METHOD TESTS
  // ============================================

  describe('Static Utility Methods', () => {
    it('should calculate total stone limit with one Hestia', () => {
      const state = {
        players: [
          {
            field: ['hestia-001'],
            cards: {
              'hestia-001': {
                templateId: 'F001',
                effects: [
                  {
                    type: 'INCREASE_STONE_LIMIT',
                    value: 2,
                  },
                ],
              },
            },
          },
        ],
      }

      const limit = HestiaEffect.calculatePlayerStoneLimit(state, 0)
      expect(limit).toBe(5) // 3 + 2
    })

    it('should calculate total stone limit with multiple Hestia cards', () => {
      const state = {
        players: [
          {
            field: ['hestia-001', 'hestia-002'],
            cards: {
              'hestia-001': {
                templateId: 'F001',
                effects: [{ type: 'INCREASE_STONE_LIMIT', value: 2 }],
              },
              'hestia-002': {
                templateId: 'F001',
                effects: [{ type: 'INCREASE_STONE_LIMIT', value: 2 }],
              },
            },
          },
        ],
      }

      const limit = HestiaEffect.calculatePlayerStoneLimit(state, 0)
      expect(limit).toBe(7) // 3 + 2 + 2
    })

    it('should return base limit when no Hestia cards', () => {
      const state = {
        players: [
          {
            field: [],
            cards: {},
          },
        ],
      }

      const limit = HestiaEffect.calculatePlayerStoneLimit(state, 0)
      expect(limit).toBe(3) // Base limit
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should handle missing player gracefully', () => {
      const effect = new HestiaEffect()
      const context: EffectContext = {
        card: hestiaInstance,
        state: {
          players: [], // No players
        },
        triggerType: EffectTrigger.PERMANENT,
      }

      const result = effect.apply(context)
      expect(result.success).toBe(false)
      expect(result.message).toContain('Player not found')
    })
  })

  // ============================================
  // DESCRIPTION TESTS
  // ============================================

  describe('Effect Description', () => {
    it('should get English description', () => {
      const effect = new HestiaEffect()
      const description = effect.getDescription(hestiaInstance, 'en')
      expect(description).toBe('You can keep two more stones.')
    })

    it('should get Chinese description', () => {
      const effect = new HestiaEffect()
      const description = effect.getDescription(hestiaInstance, 'tw')
      expect(description).toBe('你的石頭持有上限增加 2。')
    })
  })
})
