/**
 * Base Cards Test Suite
 * Validates all 70 cards data integrity
 * @version 2.0.0
 */

import { describe, it, expect } from 'vitest'
import {
  BASE_CARDS,
  FIRE_CARDS,
  WATER_CARDS,
  EARTH_CARDS,
  WIND_CARDS,
  DRAGON_CARDS,
  getCardById,
  getCardByName,
  getCardsByElement,
  getCardsByCost,
  validateCardData,
  buildFullDeck,
} from '@/data/cards/base-cards'
import { Element, EffectType } from '@/types/cards'
import { getCardImagePath, hasCardImage, getCardImageCount } from '@/lib/card-images'

describe('Base Cards Data', () => {
  describe('Card Count Validation', () => {
    it('should have exactly 70 cards in total', () => {
      expect(BASE_CARDS.length).toBe(70)
    })

    it('should have 15 Fire cards', () => {
      expect(FIRE_CARDS.length).toBe(15)
    })

    it('should have 15 Water cards', () => {
      expect(WATER_CARDS.length).toBe(15)
    })

    it('should have 15 Earth cards', () => {
      expect(EARTH_CARDS.length).toBe(15)
    })

    it('should have 15 Wind cards', () => {
      expect(WIND_CARDS.length).toBe(15)
    })

    it('should have 10 Dragon cards', () => {
      expect(DRAGON_CARDS.length).toBe(10)
    })

    it('should have correct element distribution', () => {
      const fireCounts = getCardsByElement(Element.FIRE).length
      const waterCounts = getCardsByElement(Element.WATER).length
      const earthCounts = getCardsByElement(Element.EARTH).length
      const windCounts = getCardsByElement(Element.WIND).length
      const dragonCounts = getCardsByElement(Element.DRAGON).length

      expect(fireCounts).toBe(15)
      expect(waterCounts).toBe(15)
      expect(earthCounts).toBe(15)
      expect(windCounts).toBe(15)
      expect(dragonCounts).toBe(10)
      expect(fireCounts + waterCounts + earthCounts + windCounts + dragonCounts).toBe(70)
    })
  })

  describe('Card ID Uniqueness', () => {
    it('should have unique IDs for all cards', () => {
      const ids = BASE_CARDS.map(card => card.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(BASE_CARDS.length)
    })

    it('should have correct ID prefixes for each element', () => {
      FIRE_CARDS.forEach(card => {
        expect(card.id.startsWith('F')).toBe(true)
      })
      WATER_CARDS.forEach(card => {
        expect(card.id.startsWith('W')).toBe(true)
      })
      EARTH_CARDS.forEach(card => {
        expect(card.id.startsWith('E')).toBe(true)
      })
      WIND_CARDS.forEach(card => {
        expect(card.id.startsWith('A')).toBe(true)
      })
      DRAGON_CARDS.forEach(card => {
        expect(card.id.startsWith('D')).toBe(true)
      })
    })
  })

  describe('Card Properties Validation', () => {
    it('should have valid cost values (0-12)', () => {
      BASE_CARDS.forEach(card => {
        expect(card.cost).toBeGreaterThanOrEqual(0)
        expect(card.cost).toBeLessThanOrEqual(12)
      })
    })

    it('should have valid base score values (0-15)', () => {
      BASE_CARDS.forEach(card => {
        expect(card.baseScore).toBeGreaterThanOrEqual(0)
        expect(card.baseScore).toBeLessThanOrEqual(15)
      })
    })

    it('should have name and nameTw for all cards', () => {
      BASE_CARDS.forEach(card => {
        expect(card.name).toBeTruthy()
        expect(card.nameTw).toBeTruthy()
        expect(card.name.length).toBeGreaterThan(0)
        expect(card.nameTw.length).toBeGreaterThan(0)
      })
    })

    it('should have valid element types', () => {
      const validElements = Object.values(Element)
      BASE_CARDS.forEach(card => {
        expect(validElements).toContain(card.element)
      })
    })

    it('should have valid effect types in effects array', () => {
      const validEffectTypes = Object.values(EffectType)
      BASE_CARDS.forEach(card => {
        // New format: check effects array
        card.effects.forEach(effect => {
          expect(validEffectTypes).toContain(effect.type)
        })
      })
    })
  })

  describe('Helper Functions', () => {
    it('getCardById should find cards correctly', () => {
      const hestia = getCardById('F001')
      expect(hestia).toBeDefined()
      expect(hestia?.name).toBe('Hestia')

      const dragonEgg = getCardById('D001')
      expect(dragonEgg).toBeDefined()
      expect(dragonEgg?.name).toBe('Dragon Egg')

      const nonExistent = getCardById('X999')
      expect(nonExistent).toBeUndefined()
    })

    it('getCardByName should find cards correctly', () => {
      const hestia = getCardByName('Hestia')
      expect(hestia).toBeDefined()
      expect(hestia?.id).toBe('F001')

      const eternity = getCardByName('Eternity')
      expect(eternity).toBeDefined()
      expect(eternity?.id).toBe('D010')
    })

    it('getCardsByCost should return correct cards', () => {
      const cost0Cards = getCardsByCost(0)
      expect(cost0Cards.length).toBeGreaterThan(0)
      cost0Cards.forEach(card => {
        expect(card.cost).toBe(0)
      })

      const cost6Cards = getCardsByCost(6)
      expect(cost6Cards.length).toBeGreaterThan(0)
      cost6Cards.forEach(card => {
        expect(card.cost).toBe(6)
      })
    })

    it('validateCardData should return valid result', () => {
      const validation = validateCardData()
      expect(validation.isValid).toBe(true)
      expect(validation.totalCards).toBe(70)
      expect(validation.uniqueIds).toBe(70)
      expect(validation.duplicateIds).toHaveLength(0)
    })

    it('buildFullDeck should create 140 cards', () => {
      const deck = buildFullDeck()
      expect(deck.length).toBe(140) // 70 cards x 2 copies
    })
  })

  describe('Card Image Mapping', () => {
    it('should have image mappings for all 70 cards', () => {
      expect(getCardImageCount()).toBe(70)
    })

    it('should have image paths for all card IDs', () => {
      BASE_CARDS.forEach(card => {
        expect(hasCardImage(card.id)).toBe(true)
      })
    })

    it('should return valid image paths', () => {
      const hestiaPath = getCardImagePath('F001')
      expect(hestiaPath).toContain('Hestia')
      expect(hestiaPath).toContain('.webp')

      const dragonEggPath = getCardImagePath('D001')
      expect(dragonEggPath).toContain('Dragonegg')
      expect(dragonEggPath).toContain('.webp')
    })

    it('should return placeholder for invalid card ID', () => {
      const path = getCardImagePath('INVALID')
      expect(path).toContain('placeholder')
    })
  })

  describe('Specific Card Validation', () => {
    it('should have Hestia with correct properties', () => {
      const hestia = getCardById('F001')
      expect(hestia).toBeDefined()
      expect(hestia?.name).toBe('Hestia')
      expect(hestia?.element).toBe(Element.FIRE)
      expect(hestia?.cost).toBe(0)
      expect(hestia?.baseScore).toBe(1)
      // Hestia has INCREASE_STONE_LIMIT effect
      expect(hestia?.effects[0]?.type).toBe(EffectType.INCREASE_STONE_LIMIT)
      expect(hestia?.effects[0]?.value).toBe(2)
    })

    it('should have Eternity (legendary dragon) with correct properties', () => {
      const eternity = getCardById('D010')
      expect(eternity).toBeDefined()
      expect(eternity?.name).toBe('Eternity')
      expect(eternity?.element).toBe(Element.DRAGON)
      expect(eternity?.cost).toBe(12)
      expect(eternity?.baseScore).toBe(15)
      // Eternity uses EARN_PER_FAMILY effect
      expect(eternity?.effects[0]?.type).toBe(EffectType.EARN_PER_FAMILY)
    })

    it('should have Dragon Egg with FREE_SUMMON effect', () => {
      const dragonEgg = getCardById('D001')
      expect(dragonEgg).toBeDefined()
      // Dragon Egg uses FREE_SUMMON for dragon summoning
      expect(dragonEgg?.effects[0]?.type).toBe(EffectType.FREE_SUMMON)
      expect(dragonEgg?.effects[0]?.targetElement).toBe(Element.DRAGON)
    })
  })
})
