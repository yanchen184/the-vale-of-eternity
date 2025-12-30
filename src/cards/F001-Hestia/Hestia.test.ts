/**
 * F001 Hestia Unit Tests
 * Tests card data integrity and basic functionality
 * Based on CARD_DEVELOPMENT_GUIDE.md test requirements
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest'
import { HESTIA_CARD } from './Hestia.card'
import { Element, EffectType, EffectTrigger } from '@/types/cards'

describe('F001 - Hestia Card Data', () => {
  // ============================================
  // CARD IDENTIFICATION TESTS
  // ============================================

  describe('Card Identification', () => {
    it('should have correct card ID', () => {
      expect(HESTIA_CARD.id).toBe('F001')
    })

    it('should have correct English name', () => {
      expect(HESTIA_CARD.name).toBe('Hestia')
    })

    it('should have correct Chinese name', () => {
      expect(HESTIA_CARD.nameTw).toBe('赫斯提亞')
    })
  })

  // ============================================
  // BASIC ATTRIBUTES TESTS
  // ============================================

  describe('Basic Attributes', () => {
    it('should be a Fire element card', () => {
      expect(HESTIA_CARD.element).toBe(Element.FIRE)
    })

    it('should have cost of 0', () => {
      expect(HESTIA_CARD.cost).toBe(0)
    })

    it('should have base score of 1', () => {
      expect(HESTIA_CARD.baseScore).toBe(1)
    })

    it('should have correct image URL', () => {
      expect(HESTIA_CARD.imageUrl).toBe('200px-Hestia.webp')
    })
  })

  // ============================================
  // EFFECT CONFIGURATION TESTS
  // ============================================

  describe('Effect Configuration', () => {
    it('should have exactly one effect', () => {
      expect(HESTIA_CARD.effects).toHaveLength(1)
    })

    it('should have INCREASE_STONE_LIMIT effect', () => {
      expect(HESTIA_CARD.effects[0].type).toBe(EffectType.INCREASE_STONE_LIMIT)
    })

    it('should trigger as PERMANENT effect', () => {
      expect(HESTIA_CARD.effects[0].trigger).toBe(EffectTrigger.PERMANENT)
    })

    it('should increase stone limit by 2', () => {
      expect(HESTIA_CARD.effects[0].value).toBe(2)
    })

    it('should have English effect description', () => {
      expect(HESTIA_CARD.effects[0].description).toBe('You can keep two more stones.')
    })

    it('should have Chinese effect description', () => {
      expect(HESTIA_CARD.effects[0].descriptionTw).toBe('你的石頭持有上限增加 2。')
    })
  })

  // ============================================
  // FLAVOR TEXT TESTS
  // ============================================

  describe('Flavor Text', () => {
    it('should have English flavor text', () => {
      expect(HESTIA_CARD.flavorText).toBe('Guardian of hearth and home.')
    })

    it('should have Chinese flavor text', () => {
      expect(HESTIA_CARD.flavorTextTw).toBe('家與爐火的守護者，賜予你更多承載力量的空間。')
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
        expect(HESTIA_CARD).toHaveProperty(field)
      })
    })

    it('should have effects array as non-empty', () => {
      expect(Array.isArray(HESTIA_CARD.effects)).toBe(true)
      expect(HESTIA_CARD.effects.length).toBeGreaterThan(0)
    })

    it('each effect should have required properties', () => {
      HESTIA_CARD.effects.forEach((effect) => {
        expect(effect).toHaveProperty('type')
        expect(effect).toHaveProperty('trigger')
        expect(effect).toHaveProperty('description')
        expect(effect).toHaveProperty('descriptionTw')
      })
    })
  })

  // ============================================
  // CARD BALANCE TESTS
  // ============================================

  describe('Card Balance', () => {
    it('should be a Cost 0 card (free)', () => {
      expect(HESTIA_CARD.cost).toBe(0)
    })

    it('should have low base score to balance powerful effect', () => {
      expect(HESTIA_CARD.baseScore).toBeLessThanOrEqual(2)
    })

    it('should provide meaningful stone limit increase', () => {
      const increaseValue = HESTIA_CARD.effects[0].value || 0
      expect(increaseValue).toBeGreaterThanOrEqual(2)
      expect(increaseValue).toBeLessThanOrEqual(3)
    })
  })

  // ============================================
  // TYPE SAFETY TESTS
  // ============================================

  describe('Type Safety', () => {
    it('should have Element type for element field', () => {
      const elementValues = Object.values(Element)
      expect(elementValues).toContain(HESTIA_CARD.element)
    })

    it('should have EffectType for effect type field', () => {
      const effectTypeValues = Object.values(EffectType)
      HESTIA_CARD.effects.forEach((effect) => {
        expect(effectTypeValues).toContain(effect.type)
      })
    })

    it('should have EffectTrigger for effect trigger field', () => {
      const triggerValues = Object.values(EffectTrigger)
      HESTIA_CARD.effects.forEach((effect) => {
        expect(triggerValues).toContain(effect.trigger)
      })
    })
  })
})
