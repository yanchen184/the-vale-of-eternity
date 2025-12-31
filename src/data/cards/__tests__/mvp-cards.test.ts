/**
 * MVP Cards Data Tests
 * Tests card data integrity and helper functions
 * Based on TEST_SPEC.md and CARD_DATA_SPEC.md
 * @version 1.0.0
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  MVP_CARDS,
  FIRE_CARDS,
  WATER_CARDS,
  EARTH_CARDS,
  WIND_CARDS,
  DRAGON_CARDS,
  getCardById,
  getCardsByElement,
  getCardsByEffectType,
  createCardInstance,
  buildDeck,
  buildShuffledDeck,
  shuffleArray,
} from '../mvp-cards'
import { Element, EffectType, EffectTrigger, CardLocation } from '@/types/cards'

describe('MVP Cards Data', () => {
  // ============================================
  // CARD COUNT TESTS
  // ============================================

  describe('Card Count', () => {
    it('should have exactly 20 unique card templates', () => {
      expect(MVP_CARDS).toHaveLength(20)
    })

    it('should have 4 cards per element family', () => {
      expect(FIRE_CARDS).toHaveLength(4)
      expect(WATER_CARDS).toHaveLength(4)
      expect(EARTH_CARDS).toHaveLength(4)
      expect(WIND_CARDS).toHaveLength(4)
      expect(DRAGON_CARDS).toHaveLength(4)
    })

    it('should have correct total when combining all family cards', () => {
      const total =
        FIRE_CARDS.length +
        WATER_CARDS.length +
        EARTH_CARDS.length +
        WIND_CARDS.length +
        DRAGON_CARDS.length
      expect(total).toBe(20)
    })
  })

  // ============================================
  // CARD STRUCTURE TESTS
  // ============================================

  describe('Card Structure', () => {
    it('each card should have all required fields', () => {
      const requiredFields = [
        'id',
        'name',
        'nameTw',
        'element',
        'cost',
        'baseScore',
        'effects', // New format uses effects array
      ]

      MVP_CARDS.forEach(card => {
        requiredFields.forEach(field => {
          expect(card).toHaveProperty(field)
        })
      })
    })

    it('each card should have a unique ID', () => {
      const ids = MVP_CARDS.map(card => card.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('each card ID should follow correct naming convention', () => {
      // Fire: F001-F004, Water: W001-W004, Earth: E001-E004
      // Wind: A001-A004, Dragon: D001-D004
      const idPatterns = {
        FIRE: /^F\d{3}$/,
        WATER: /^W\d{3}$/,
        EARTH: /^E\d{3}$/,
        WIND: /^A\d{3}$/,
        DRAGON: /^D\d{3}$/,
      }

      MVP_CARDS.forEach(card => {
        const pattern = idPatterns[card.element]
        expect(card.id).toMatch(pattern)
      })
    })

    it('card costs should be in valid range (0-6)', () => {
      MVP_CARDS.forEach(card => {
        expect(card.cost).toBeGreaterThanOrEqual(0)
        expect(card.cost).toBeLessThanOrEqual(6)
      })
    })

    it('card base scores should be non-negative', () => {
      MVP_CARDS.forEach(card => {
        expect(card.baseScore).toBeGreaterThanOrEqual(0)
      })
    })

    it('element should be a valid Element enum value', () => {
      const validElements = Object.values(Element)
      MVP_CARDS.forEach(card => {
        expect(validElements).toContain(card.element)
      })
    })

    it('effects should have valid EffectType enum values', () => {
      const validEffectTypes = Object.values(EffectType)
      MVP_CARDS.forEach(card => {
        card.effects.forEach(effect => {
          expect(validEffectTypes).toContain(effect.type)
        })
      })
    })

    it('effects should have valid EffectTrigger enum values', () => {
      const validTriggers = Object.values(EffectTrigger)
      MVP_CARDS.forEach(card => {
        card.effects.forEach(effect => {
          expect(validTriggers).toContain(effect.trigger)
        })
      })
    })
  })

  // ============================================
  // ELEMENT DISTRIBUTION TESTS
  // ============================================

  describe('Element Distribution', () => {
    it('should have exactly 4 FIRE cards', () => {
      const fireCards = MVP_CARDS.filter(c => c.element === Element.FIRE)
      expect(fireCards).toHaveLength(4)
    })

    it('should have exactly 4 WATER cards', () => {
      const waterCards = MVP_CARDS.filter(c => c.element === Element.WATER)
      expect(waterCards).toHaveLength(4)
    })

    it('should have exactly 4 EARTH cards', () => {
      const earthCards = MVP_CARDS.filter(c => c.element === Element.EARTH)
      expect(earthCards).toHaveLength(4)
    })

    it('should have exactly 4 WIND cards', () => {
      const windCards = MVP_CARDS.filter(c => c.element === Element.WIND)
      expect(windCards).toHaveLength(4)
    })

    it('should have exactly 4 DRAGON cards', () => {
      const dragonCards = MVP_CARDS.filter(c => c.element === Element.DRAGON)
      expect(dragonCards).toHaveLength(4)
    })
  })

  // ============================================
  // EFFECT DISTRIBUTION TESTS
  // ============================================

  describe('Effect Distribution', () => {
    it('should have correct number of NONE effect cards', () => {
      const noEffectCards = MVP_CARDS.filter(card => card.effects.length === 0)
      // F002, W001, W003, E001, E002, E004, A001, A004, D004 = 9 cards
      expect(noEffectCards).toHaveLength(9)
    })

    it('should have correct number of EARN_STONES cards', () => {
      const earnStonesCards = MVP_CARDS.filter(card =>
        card.effects.some(e => e.type === EffectType.EARN_STONES)
      )
      // F004 (+2), A002 (+1) = 2 cards
      expect(earnStonesCards).toHaveLength(2)
    })

    it('should have correct number of INCREASE_STONE_LIMIT cards', () => {
      const increaseLimitCards = MVP_CARDS.filter(card =>
        card.effects.some(e => e.type === EffectType.INCREASE_STONE_LIMIT)
      )
      // F001 (+2) = 1 card
      expect(increaseLimitCards).toHaveLength(1)
    })

    it('should have correct number of EARN_PER_ELEMENT cards', () => {
      const earnPerElementCards = MVP_CARDS.filter(card =>
        card.effects.some(e => e.type === EffectType.EARN_PER_ELEMENT)
      )
      // F003, W002, E003, A003, D002, D003 = 6 cards
      expect(earnPerElementCards).toHaveLength(6)
    })

    it('should have correct number of EARN_PER_FAMILY (dragon) cards', () => {
      const earnPerFamilyCards = MVP_CARDS.filter(card =>
        card.effects.some(e => e.type === EffectType.EARN_PER_FAMILY)
      )
      // D001 = 1 card
      expect(earnPerFamilyCards).toHaveLength(1)
    })

    it('should have correct number of RECOVER_CARD cards', () => {
      const recoverCardCards = MVP_CARDS.filter(card =>
        card.effects.some(e => e.type === EffectType.RECOVER_CARD)
      )
      // W004 = 1 card
      expect(recoverCardCards).toHaveLength(1)
    })
  })

  // ============================================
  // SPECIFIC CARD VALIDATION
  // ============================================

  describe('Specific Card Validation', () => {
    it('F001 (Hestia) should have correct stats', () => {
      const hestia = getCardById('F001')
      expect(hestia).toBeDefined()
      expect(hestia?.name).toBe('Hestia')
      expect(hestia?.nameTw).toBe('赫斯提亞')
      expect(hestia?.element).toBe(Element.FIRE)
      expect(hestia?.cost).toBe(0)
      expect(hestia?.baseScore).toBe(0)
      // Using effects array for validation
      expect(hestia?.effects[0]?.type).toBe(EffectType.INCREASE_STONE_LIMIT)
      expect(hestia?.effects[0]?.trigger).toBe(EffectTrigger.PERMANENT)
      expect(hestia?.effects[0]?.value).toBe(2)
    })

    it('F004 (Salamander) should have EARN_STONES effect', () => {
      const salamander = getCardById('F004')
      expect(salamander).toBeDefined()
      expect(salamander?.name).toBe('Salamander')
      // Using effects array for validation
      expect(salamander?.effects[0]?.type).toBe(EffectType.EARN_STONES)
      expect(salamander?.effects[0]?.trigger).toBe(EffectTrigger.ON_TAME)
      // Salamander earns 2 x ONE stones
      expect(salamander?.effects[0]?.stones?.[0]?.amount).toBe(2)
    })

    it('W004 (Sea Spirit) should have RECOVER_CARD effect', () => {
      const seaSpirit = getCardById('W004')
      expect(seaSpirit).toBeDefined()
      expect(seaSpirit?.name).toBe('Sea Spirit')
      // Using effects array for validation
      expect(seaSpirit?.effects[0]?.type).toBe(EffectType.RECOVER_CARD)
      expect(seaSpirit?.effects[0]?.trigger).toBe(EffectTrigger.ON_TAME)
      expect(seaSpirit?.effects[0]?.value).toBe(1)
    })

    it('D001 (Dragon Egg) should have EARN_PER_FAMILY effect', () => {
      const dragonEgg = getCardById('D001')
      expect(dragonEgg).toBeDefined()
      expect(dragonEgg?.name).toBe('Dragon Egg')
      // Using effects array for validation
      expect(dragonEgg?.effects[0]?.type).toBe(EffectType.EARN_PER_FAMILY)
      expect(dragonEgg?.effects[0]?.trigger).toBe(EffectTrigger.ON_SCORE)
      expect(dragonEgg?.effects[0]?.value).toBe(2)
    })

    it('D004 (Boulder) should be highest cost card', () => {
      const boulder = getCardById('D004')
      expect(boulder).toBeDefined()
      expect(boulder?.name).toBe('Boulder')
      expect(boulder?.cost).toBe(5)
      expect(boulder?.baseScore).toBe(7)
    })
  })

  // ============================================
  // HELPER FUNCTION TESTS
  // ============================================

  describe('getCardById', () => {
    it('should return correct card for valid ID', () => {
      const card = getCardById('F001')
      expect(card).toBeDefined()
      expect(card?.id).toBe('F001')
    })

    it('should return undefined for invalid ID', () => {
      const card = getCardById('INVALID')
      expect(card).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      const card = getCardById('')
      expect(card).toBeUndefined()
    })

    it('should be case-sensitive', () => {
      const card = getCardById('f001')
      expect(card).toBeUndefined()
    })
  })

  describe('getCardsByElement', () => {
    it('should return all FIRE cards', () => {
      const cards = getCardsByElement(Element.FIRE)
      expect(cards).toHaveLength(4)
      cards.forEach(card => {
        expect(card.element).toBe(Element.FIRE)
      })
    })

    it('should return all WATER cards', () => {
      const cards = getCardsByElement(Element.WATER)
      expect(cards).toHaveLength(4)
      cards.forEach(card => {
        expect(card.element).toBe(Element.WATER)
      })
    })

    it('should return all DRAGON cards', () => {
      const cards = getCardsByElement(Element.DRAGON)
      expect(cards).toHaveLength(4)
      cards.forEach(card => {
        expect(card.element).toBe(Element.DRAGON)
      })
    })
  })

  describe('getCardsByEffectType', () => {
    it('should return cards with empty effects for NONE type query (no match)', () => {
      // getCardsByEffectType looks for cards with the specified effect type
      // Cards without effects have empty effects array, so NONE won't match any
      const cards = getCardsByEffectType(EffectType.NONE)
      expect(cards).toHaveLength(0)
    })

    it('cards without effects should have empty effects array', () => {
      // Cards without effects (F002, W001, W003, E001, E002, E004, A001, A004, D004) = 9 cards
      const noEffectCards = MVP_CARDS.filter(card => card.effects.length === 0)
      expect(noEffectCards).toHaveLength(9)
    })

    it('should return all EARN_PER_ELEMENT cards', () => {
      const cards = getCardsByEffectType(EffectType.EARN_PER_ELEMENT)
      expect(cards).toHaveLength(6)
      cards.forEach(card => {
        const hasEffect = card.effects.some(e => e.type === EffectType.EARN_PER_ELEMENT)
        expect(hasEffect).toBe(true)
      })
    })
  })

  // ============================================
  // CARD INSTANCE TESTS
  // ============================================

  describe('createCardInstance', () => {
    it('should create instance with correct instanceId format', () => {
      const template = getCardById('F001')!
      const instance = createCardInstance(template, 0)
      expect(instance.instanceId).toBe('F001-0')
    })

    it('should create instance with incremented index', () => {
      const template = getCardById('F001')!
      const instance1 = createCardInstance(template, 0)
      const instance2 = createCardInstance(template, 1)
      expect(instance1.instanceId).toBe('F001-0')
      expect(instance2.instanceId).toBe('F001-1')
    })

    it('should copy all template properties', () => {
      const template = getCardById('F003')!
      const instance = createCardInstance(template, 0)

      expect(instance.cardId).toBe(template.id)
      expect(instance.name).toBe(template.name)
      expect(instance.nameTw).toBe(template.nameTw)
      expect(instance.element).toBe(template.element)
      expect(instance.cost).toBe(template.cost)
      expect(instance.baseScore).toBe(template.baseScore)
      // New format: effects array is copied
      expect(instance.effects).toEqual(template.effects)
      // Legacy fields are extracted from effects array
      expect(instance.effectType).toBe(EffectType.EARN_PER_ELEMENT)
      expect(instance.effectTrigger).toBe(EffectTrigger.ON_SCORE)
      expect(instance.effectValue).toBe(1)
      expect(instance.effectTarget).toBe(Element.FIRE)
    })

    it('should initialize runtime properties correctly', () => {
      const template = getCardById('F001')!
      const instance = createCardInstance(template, 0)

      expect(instance.ownerId).toBeNull()
      expect(instance.location).toBe(CardLocation.DECK)
      expect(instance.isRevealed).toBe(false)
      expect(instance.scoreModifier).toBe(0)
      expect(instance.hasUsedAbility).toBe(false)
    })
  })

  // ============================================
  // DECK BUILDING TESTS
  // ============================================

  describe('buildDeck', () => {
    let deck: ReturnType<typeof buildDeck>

    beforeEach(() => {
      deck = buildDeck()
    })

    it('should create exactly 40 cards (20 types x 2 copies)', () => {
      expect(deck).toHaveLength(40)
    })

    it('should have 2 copies of each card type', () => {
      const cardCounts = new Map<string, number>()
      deck.forEach(card => {
        const count = cardCounts.get(card.cardId) || 0
        cardCounts.set(card.cardId, count + 1)
      })

      cardCounts.forEach(count => {
        expect(count).toBe(2)
      })
    })

    it('should have unique instance IDs for all cards', () => {
      const instanceIds = deck.map(card => card.instanceId)
      const uniqueIds = new Set(instanceIds)
      expect(uniqueIds.size).toBe(40)
    })

    it('should have correct instance ID format (cardId-0 and cardId-1)', () => {
      deck.forEach(card => {
        const match = card.instanceId.match(/^(.+)-([01])$/)
        expect(match).not.toBeNull()
        expect(match![1]).toBe(card.cardId)
        expect(['0', '1']).toContain(match![2])
      })
    })

    it('should have 8 cards per element (4 types x 2 copies)', () => {
      const elementCounts = new Map<Element, number>()
      deck.forEach(card => {
        const count = elementCounts.get(card.element) || 0
        elementCounts.set(card.element, count + 1)
      })

      expect(elementCounts.get(Element.FIRE)).toBe(8)
      expect(elementCounts.get(Element.WATER)).toBe(8)
      expect(elementCounts.get(Element.EARTH)).toBe(8)
      expect(elementCounts.get(Element.WIND)).toBe(8)
      expect(elementCounts.get(Element.DRAGON)).toBe(8)
    })

    it('all cards should start in DECK location', () => {
      deck.forEach(card => {
        expect(card.location).toBe(CardLocation.DECK)
      })
    })
  })

  describe('buildShuffledDeck', () => {
    it('should return 40 cards', () => {
      const deck = buildShuffledDeck()
      expect(deck).toHaveLength(40)
    })

    it('should return different order on multiple calls (probabilistic)', () => {
      // Build multiple decks and check that at least some have different orders
      const decks = Array.from({ length: 5 }, () => buildShuffledDeck())
      const firstDeckOrder = decks[0].map(c => c.instanceId).join(',')

      // At least one deck should have a different order
      const hasDifferentOrder = decks
        .slice(1)
        .some(deck => deck.map(c => c.instanceId).join(',') !== firstDeckOrder)

      expect(hasDifferentOrder).toBe(true)
    })

    it('should preserve all 40 cards after shuffling', () => {
      const deck = buildShuffledDeck()
      const instanceIds = new Set(deck.map(c => c.instanceId))
      expect(instanceIds.size).toBe(40)
    })
  })

  describe('shuffleArray', () => {
    it('should not modify the original array', () => {
      const original = [1, 2, 3, 4, 5]
      const copy = [...original]
      shuffleArray(original)
      expect(original).toEqual(copy)
    })

    it('should return array of same length', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const shuffled = shuffleArray(original)
      expect(shuffled).toHaveLength(original.length)
    })

    it('should contain all original elements', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      expect(shuffled.sort()).toEqual(original.sort())
    })

    it('should handle empty array', () => {
      const shuffled = shuffleArray([])
      expect(shuffled).toEqual([])
    })

    it('should handle single element array', () => {
      const shuffled = shuffleArray([1])
      expect(shuffled).toEqual([1])
    })
  })

  // ============================================
  // DATA CONSISTENCY TESTS
  // ============================================

  describe('Data Consistency', () => {
    it('cards with ON_TAME trigger should have EARN_STONES or RECOVER_CARD effect', () => {
      const onTameCards = MVP_CARDS.filter(card =>
        card.effects.some(e => e.trigger === EffectTrigger.ON_TAME)
      )
      onTameCards.forEach(card => {
        const hasValidEffect = card.effects.some(e =>
          [EffectType.EARN_STONES, EffectType.RECOVER_CARD].includes(e.type)
        )
        expect(hasValidEffect).toBe(true)
      })
    })

    it('cards with PERMANENT trigger should have INCREASE_STONE_LIMIT effect', () => {
      const permanentCards = MVP_CARDS.filter(card =>
        card.effects.some(e => e.trigger === EffectTrigger.PERMANENT)
      )
      permanentCards.forEach(card => {
        const hasLimitEffect = card.effects.some(e => e.type === EffectType.INCREASE_STONE_LIMIT)
        expect(hasLimitEffect).toBe(true)
      })
    })

    it('cards with ON_SCORE trigger should have EARN_PER_ELEMENT or EARN_PER_FAMILY effect', () => {
      const onScoreCards = MVP_CARDS.filter(card =>
        card.effects.some(e => e.trigger === EffectTrigger.ON_SCORE)
      )
      onScoreCards.forEach(card => {
        const hasValidEffect = card.effects.some(e =>
          [EffectType.EARN_PER_ELEMENT, EffectType.EARN_PER_FAMILY].includes(e.type)
        )
        expect(hasValidEffect).toBe(true)
      })
    })

    it('cards without effects should have empty effects array', () => {
      const noEffectCards = MVP_CARDS.filter(card => card.effects.length === 0)
      noEffectCards.forEach(card => {
        expect(card.effects).toHaveLength(0)
      })
    })

    it('EARN_PER_ELEMENT cards should have targetElement defined', () => {
      const earnPerElementCards = MVP_CARDS.filter(card =>
        card.effects.some(e => e.type === EffectType.EARN_PER_ELEMENT)
      )
      earnPerElementCards.forEach(card => {
        const effect = card.effects.find(e => e.type === EffectType.EARN_PER_ELEMENT)
        expect(effect?.targetElement).toBeDefined()
      })
    })

    it('cards with effects should have value or stones defined', () => {
      const cardsWithEffects = MVP_CARDS.filter(card => card.effects.length > 0)
      cardsWithEffects.forEach(card => {
        card.effects.forEach(effect => {
          const hasValue = effect.value !== undefined || effect.stones !== undefined
          expect(hasValue).toBe(true)
        })
      })
    })

    it('all cards should have Chinese name (nameTw)', () => {
      MVP_CARDS.forEach(card => {
        expect(card.nameTw).toBeDefined()
        expect(card.nameTw.length).toBeGreaterThan(0)
      })
    })
  })
})
