/**
 * F002 Imp Unit Tests
 * Tests card data integrity and basic functionality
 * Based on CARD_DEVELOPMENT_GUIDE.md test requirements
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest'
import { IMP_CARD } from './Imp.card'
import { Element, EffectType, EffectTrigger, StoneType } from '@/types/cards'

describe('F002 - Imp Card Data', () => {
  // ============================================
  // CARD IDENTIFICATION TESTS
  // ============================================

  describe('Card Identification', () => {
    it('should have correct card ID', () => {
      expect(IMP_CARD.id).toBe('F002')
    })

    it('should have correct English name', () => {
      expect(IMP_CARD.name).toBe('Imp')
    })

    it('should have correct Chinese name', () => {
      expect(IMP_CARD.nameTw).toBe('小惡魔')
    })
  })

  // ============================================
  // BASIC ATTRIBUTES TESTS
  // ============================================

  describe('Basic Attributes', () => {
    it('should be a Fire element card', () => {
      expect(IMP_CARD.element).toBe(Element.FIRE)
    })

    it('should have cost of 1', () => {
      expect(IMP_CARD.cost).toBe(1)
    })

    it('should have base score of 2', () => {
      expect(IMP_CARD.baseScore).toBe(2)
    })

    it('should have correct image URL', () => {
      expect(IMP_CARD.imageUrl).toBe('200px-Imp.webp')
    })
  })

  // ============================================
  // EFFECT CONFIGURATION TESTS
  // ============================================

  describe('Effect Configuration', () => {
    it('should have exactly two effects', () => {
      expect(IMP_CARD.effects).toHaveLength(2)
    })

    describe('Effect 1: EARN_STONES', () => {
      const earnStonesEffect = IMP_CARD.effects[0]

      it('should have EARN_STONES effect type', () => {
        expect(earnStonesEffect.type).toBe(EffectType.EARN_STONES)
      })

      it('should trigger ON_TAME', () => {
        expect(earnStonesEffect.trigger).toBe(EffectTrigger.ON_TAME)
      })

      it('should grant 3 ONE stones', () => {
        expect(earnStonesEffect.stones).toBeDefined()
        expect(earnStonesEffect.stones).toHaveLength(1)
        expect(earnStonesEffect.stones![0].type).toBe(StoneType.ONE)
        expect(earnStonesEffect.stones![0].amount).toBe(3)
      })

      it('should have English effect description', () => {
        expect(earnStonesEffect.description).toBe('Earn 1 1 1.')
      })

      it('should have Chinese effect description', () => {
        expect(earnStonesEffect.descriptionTw).toBe('獲得 3 個 1 點石頭。')
      })
    })

    describe('Effect 2: RECOVER_CARD', () => {
      const recoverEffect = IMP_CARD.effects[1]

      it('should have RECOVER_CARD effect type', () => {
        expect(recoverEffect.type).toBe(EffectType.RECOVER_CARD)
      })

      it('should trigger PERMANENT', () => {
        expect(recoverEffect.trigger).toBe(EffectTrigger.PERMANENT)
      })

      it('should have English effect description', () => {
        expect(recoverEffect.description).toBe('Recover.')
      })

      it('should have Chinese effect description', () => {
        expect(recoverEffect.descriptionTw).toBe('可被回收。')
      })
    })
  })

  // ============================================
  // FLAVOR TEXT TESTS
  // ============================================

  describe('Flavor Text', () => {
    it('should have English flavor text', () => {
      expect(IMP_CARD.flavorText).toBe('Small but mischievous.')
    })

    it('should have Chinese flavor text', () => {
      expect(IMP_CARD.flavorTextTw).toBe('頑皮的火焰精靈，雖然弱小但忠誠。')
    })
  })

  // ============================================
  // CARD STRUCTURE VALIDATION
  // ============================================

  describe('Card Structure Validation', () => {
    it('should have all required fields', () => {
      const requiredFields = [
        'id',
        'name',
        'nameTw',
        'element',
        'cost',
        'baseScore',
        'effects',
        'imageUrl',
      ]

      requiredFields.forEach((field) => {
        expect(IMP_CARD).toHaveProperty(field)
      })
    })

    it('should have effects array with 2 effects', () => {
      expect(Array.isArray(IMP_CARD.effects)).toBe(true)
      expect(IMP_CARD.effects.length).toBe(2)
    })

    it('each effect should have required properties', () => {
      IMP_CARD.effects.forEach((effect) => {
        expect(effect).toHaveProperty('type')
        expect(effect).toHaveProperty('trigger')
        expect(effect).toHaveProperty('description')
        expect(effect).toHaveProperty('descriptionTw')
      })
    })

    it('first effect should have stones property', () => {
      expect(IMP_CARD.effects[0]).toHaveProperty('stones')
      expect(Array.isArray(IMP_CARD.effects[0].stones)).toBe(true)
    })
  })

  // ============================================
  // CARD BALANCE TESTS
  // ============================================

  describe('Card Balance', () => {
    it('should be a Cost 1 card (low cost)', () => {
      expect(IMP_CARD.cost).toBe(1)
    })

    it('should have low base score (2 points)', () => {
      expect(IMP_CARD.baseScore).toBe(2)
    })

    it('should provide meaningful stone gain (3 stones)', () => {
      const stoneGain = IMP_CARD.effects[0].stones?.[0].amount || 0
      expect(stoneGain).toBe(3)
    })

    it('should have net positive stone gain after taming', () => {
      // Taming cost = ceil(1/2) = 1 stone
      // Stone gain = 3 stones
      // Net gain = 3 - 1 = 2 stones
      const tameCost = Math.ceil(IMP_CARD.cost / 2)
      const stoneGain = IMP_CARD.effects[0].stones?.[0].amount || 0
      const netGain = stoneGain - tameCost

      expect(netGain).toBeGreaterThan(0)
      expect(netGain).toBe(2)
    })
  })

  // ============================================
  // TYPE SAFETY TESTS
  // ============================================

  describe('Type Safety', () => {
    it('should have Element type for element field', () => {
      const elementValues = Object.values(Element)
      expect(elementValues).toContain(IMP_CARD.element)
    })

    it('should have EffectType for effect type fields', () => {
      const effectTypeValues = Object.values(EffectType)
      IMP_CARD.effects.forEach((effect) => {
        expect(effectTypeValues).toContain(effect.type)
      })
    })

    it('should have EffectTrigger for effect trigger fields', () => {
      const triggerValues = Object.values(EffectTrigger)
      IMP_CARD.effects.forEach((effect) => {
        expect(triggerValues).toContain(effect.trigger)
      })
    })

    it('should have StoneType for stone type in stones config', () => {
      const stoneTypeValues = Object.values(StoneType)
      const stonesConfig = IMP_CARD.effects[0].stones

      if (stonesConfig) {
        stonesConfig.forEach((config) => {
          expect(stoneTypeValues).toContain(config.type)
        })
      }
    })
  })

  // ============================================
  // MULTI-EFFECT CARD TESTS
  // ============================================

  describe('Multi-Effect Card Features', () => {
    it('should have both instant and permanent effects', () => {
      const hasOnTame = IMP_CARD.effects.some(e => e.trigger === EffectTrigger.ON_TAME)
      const hasPermanent = IMP_CARD.effects.some(e => e.trigger === EffectTrigger.PERMANENT)

      expect(hasOnTame).toBe(true)
      expect(hasPermanent).toBe(true)
    })

    it('should have different effect types', () => {
      const effectTypes = IMP_CARD.effects.map(e => e.type)
      const uniqueTypes = new Set(effectTypes)

      expect(uniqueTypes.size).toBe(2)
      expect(uniqueTypes.has(EffectType.EARN_STONES)).toBe(true)
      expect(uniqueTypes.has(EffectType.RECOVER_CARD)).toBe(true)
    })

    it('should have ON_TAME effect first and PERMANENT effect second', () => {
      expect(IMP_CARD.effects[0].trigger).toBe(EffectTrigger.ON_TAME)
      expect(IMP_CARD.effects[1].trigger).toBe(EffectTrigger.PERMANENT)
    })
  })
})
