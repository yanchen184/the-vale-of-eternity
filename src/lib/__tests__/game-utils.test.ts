/**
 * Game Utility Functions Tests
 * Tests cost calculations, score calculations, and validation functions
 * Based on TEST_SPEC.md and GAME_ENGINE_SPEC.md
 * @version 1.0.0
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateTameCost,
  calculateSellValue,
  canAfford,
  calculateCardScore,
  calculateTotalScore,
  calculateStoneLimit,
  validateTameAction,
  validateSellAction,
  validateMarketSelection,
  drawCards,
  refillMarket,
  generateId,
  determineHuntingOrder,
  MVP_CONSTANTS,
} from '../game-utils'
import { Element, EffectType, EffectTrigger, CardLocation } from '@/types/cards'
import {
  createTestCard,
  createFireCard,
  createDragonCard,
  createScorePerElementCard,
  createScorePerDragonCard,
  createIncreaseStoneLimitCard,
  createTestMarket,
  createTestDeck,
} from '@/test/test-helpers'

// ============================================
// TAME COST CALCULATION TESTS
// ============================================

describe('calculateTameCost', () => {
  describe('TAME_COST_TABLE verification', () => {
    it('cost 0 should require 0 stones', () => {
      expect(calculateTameCost(0)).toBe(0)
    })

    it('cost 1 should require 1 stone', () => {
      expect(calculateTameCost(1)).toBe(1)
    })

    it('cost 2 should require 1 stone', () => {
      expect(calculateTameCost(2)).toBe(1)
    })

    it('cost 3 should require 2 stones', () => {
      expect(calculateTameCost(3)).toBe(2)
    })

    it('cost 4 should require 2 stones', () => {
      expect(calculateTameCost(4)).toBe(2)
    })

    it('cost 5 should require 3 stones', () => {
      expect(calculateTameCost(5)).toBe(3)
    })

    it('cost 6 should require 3 stones', () => {
      expect(calculateTameCost(6)).toBe(3)
    })
  })

  describe('Edge cases', () => {
    it('should handle negative costs (clamp to 0)', () => {
      expect(calculateTameCost(-1)).toBe(0)
      expect(calculateTameCost(-100)).toBe(0)
    })

    it('should handle costs above 6 (clamp to 6)', () => {
      expect(calculateTameCost(7)).toBe(3)
      expect(calculateTameCost(100)).toBe(3)
    })
  })
})

// ============================================
// SELL VALUE CALCULATION TESTS
// ============================================

describe('calculateSellValue', () => {
  it('should return card cost when player has room', () => {
    expect(calculateSellValue(3, 0, 5)).toBe(3)
    expect(calculateSellValue(5, 0, 10)).toBe(5)
  })

  it('should cap at stone limit when selling would exceed limit', () => {
    // Player has 4 stones, limit is 5, selling cost 3 card
    // Can only gain 1 stone
    expect(calculateSellValue(3, 4, 5)).toBe(1)
  })

  it('should return 0 when already at stone limit', () => {
    expect(calculateSellValue(5, 5, 5)).toBe(0)
  })

  it('should handle cost 0 cards', () => {
    expect(calculateSellValue(0, 0, 5)).toBe(0)
  })

  it('should handle exact room remaining', () => {
    // Player has 2 stones, limit is 5, selling cost 3 card
    // Can gain exactly 3 stones
    expect(calculateSellValue(3, 2, 5)).toBe(3)
  })
})

// ============================================
// AFFORDABILITY CHECK TESTS
// ============================================

describe('canAfford', () => {
  it('should return true when player has exact stones needed', () => {
    expect(canAfford(3, 2)).toBe(true) // cost 3 needs 2 stones
    expect(canAfford(5, 3)).toBe(true) // cost 5 needs 3 stones
  })

  it('should return true when player has more than needed', () => {
    expect(canAfford(3, 5)).toBe(true)
    expect(canAfford(1, 10)).toBe(true)
  })

  it('should return false when player has insufficient stones', () => {
    expect(canAfford(3, 1)).toBe(false) // cost 3 needs 2, has 1
    expect(canAfford(5, 2)).toBe(false) // cost 5 needs 3, has 2
  })

  it('should always return true for cost 0 cards', () => {
    expect(canAfford(0, 0)).toBe(true)
    expect(canAfford(0, 5)).toBe(true)
  })

  it('should handle edge case of 0 stones', () => {
    expect(canAfford(1, 0)).toBe(false) // cost 1 needs 1 stone
    expect(canAfford(0, 0)).toBe(true) // cost 0 needs 0 stones
  })
})

// ============================================
// SCORE CALCULATION TESTS
// ============================================

describe('calculateCardScore', () => {
  describe('Basic score', () => {
    it('should return baseScore for NONE effect cards', () => {
      const card = createTestCard({ baseScore: 5, effectType: EffectType.NONE })
      expect(calculateCardScore(card, [])).toBe(5)
    })

    it('should include scoreModifier in calculation', () => {
      const card = createTestCard({ baseScore: 5, scoreModifier: 2, effectType: EffectType.NONE })
      expect(calculateCardScore(card, [card])).toBe(7)
    })
  })

  describe('SCORE_PER_ELEMENT effect', () => {
    it('should add bonus for each matching element card', () => {
      const scoringCard = createScorePerElementCard(Element.FIRE, 1, {
        baseScore: 3,
        instanceId: 'scoring-card',
      })
      const fireCard1 = createFireCard({ instanceId: 'fire-1' })
      const fireCard2 = createFireCard({ instanceId: 'fire-2' })
      const waterCard = createTestCard({ element: Element.WATER, instanceId: 'water-1' })

      const field = [scoringCard, fireCard1, fireCard2, waterCard]

      // Base 3 + (3 fire cards including itself * 1) = 6
      expect(calculateCardScore(scoringCard, field)).toBe(6)
    })

    it('should multiply by effectValue', () => {
      const scoringCard = createScorePerElementCard(Element.FIRE, 2, {
        baseScore: 5,
        instanceId: 'scoring-card',
      })
      const fireCard1 = createFireCard({ instanceId: 'fire-1' })
      const fireCard2 = createFireCard({ instanceId: 'fire-2' })

      const field = [scoringCard, fireCard1, fireCard2]

      // Base 5 + (3 fire cards * 2) = 11
      // Note: scoringCard itself is not fire, so it's 2 fire cards
      // Actually, need to check the card's element
      // scoringCard has Element.FIRE by default from createScorePerElementCard
      expect(calculateCardScore(scoringCard, field)).toBe(11)
    })

    it('should return base score when no matching elements', () => {
      const scoringCard = createScorePerElementCard(Element.FIRE, 1, {
        baseScore: 3,
        element: Element.WATER, // Card itself is water
        instanceId: 'scoring-card',
      })
      const waterCard = createTestCard({ element: Element.WATER, instanceId: 'water-1' })
      const earthCard = createTestCard({ element: Element.EARTH, instanceId: 'earth-1' })

      const field = [scoringCard, waterCard, earthCard]

      // Base 3 + (0 fire cards * 1) = 3
      expect(calculateCardScore(scoringCard, field)).toBe(3)
    })
  })

  describe('SCORE_PER_DRAGON effect', () => {
    it('should add bonus for each dragon card', () => {
      const dragonEgg = createScorePerDragonCard(2, {
        baseScore: 0,
        element: Element.DRAGON,
        instanceId: 'dragon-egg',
      })
      const dragon1 = createDragonCard({ instanceId: 'dragon-1' })
      const dragon2 = createDragonCard({ instanceId: 'dragon-2' })
      const fireCard = createFireCard({ instanceId: 'fire-1' })

      const field = [dragonEgg, dragon1, dragon2, fireCard]

      // Base 0 + (3 dragons * 2) = 6
      expect(calculateCardScore(dragonEgg, field)).toBe(6)
    })

    it('should use default effectValue of 2 when not specified', () => {
      const dragonEgg = createTestCard({
        effectType: EffectType.SCORE_PER_DRAGON,
        effectTrigger: EffectTrigger.ON_SCORE,
        element: Element.DRAGON,
        baseScore: 0,
        instanceId: 'dragon-egg',
      })
      const dragon1 = createDragonCard({ instanceId: 'dragon-1' })

      const field = [dragonEgg, dragon1]

      // Base 0 + (2 dragons * 2) = 4
      expect(calculateCardScore(dragonEgg, field)).toBe(4)
    })
  })
})

describe('calculateTotalScore', () => {
  it('should sum all card scores', () => {
    const card1 = createTestCard({ baseScore: 3, instanceId: 'card-1' })
    const card2 = createTestCard({ baseScore: 5, instanceId: 'card-2' })
    const card3 = createTestCard({ baseScore: 2, instanceId: 'card-3' })

    const field = [card1, card2, card3]
    expect(calculateTotalScore(field)).toBe(10)
  })

  it('should handle empty field', () => {
    expect(calculateTotalScore([])).toBe(0)
  })

  it('should include effect bonuses in total', () => {
    const firefoxCard = createScorePerElementCard(Element.FIRE, 1, {
      baseScore: 3,
      element: Element.FIRE,
      instanceId: 'firefox',
    })
    const fireCard = createFireCard({ baseScore: 2, instanceId: 'fire-1' })

    const field = [firefoxCard, fireCard]

    // Firefox: 3 + (2 fire * 1) = 5
    // Fire card: 2
    // Total: 7
    expect(calculateTotalScore(field)).toBe(7)
  })
})

// ============================================
// STONE LIMIT CALCULATION TESTS
// ============================================

describe('calculateStoneLimit', () => {
  it('should return base limit when no effect cards', () => {
    const field = [createTestCard(), createTestCard()]
    expect(calculateStoneLimit(3, field)).toBe(3)
  })

  it('should add INCREASE_STONE_LIMIT effects', () => {
    const limitCard = createIncreaseStoneLimitCard(2)
    const field = [limitCard, createTestCard()]
    expect(calculateStoneLimit(3, field)).toBe(5)
  })

  it('should stack multiple INCREASE_STONE_LIMIT cards', () => {
    const limitCard1 = createIncreaseStoneLimitCard(2, { instanceId: 'limit-1' })
    const limitCard2 = createIncreaseStoneLimitCard(2, { instanceId: 'limit-2' })
    const field = [limitCard1, limitCard2]
    expect(calculateStoneLimit(3, field)).toBe(7)
  })

  it('should handle empty field', () => {
    expect(calculateStoneLimit(3, [])).toBe(3)
  })
})

// ============================================
// VALIDATION TESTS
// ============================================

describe('validateTameAction', () => {
  it('should return valid for affordable card with field space', () => {
    const card = createTestCard({ cost: 3 })
    const result = validateTameAction(card, 2, 0, 12)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should return invalid when field is full', () => {
    const card = createTestCard({ cost: 0 })
    const result = validateTameAction(card, 5, 12, 12)

    expect(result.valid).toBe(false)
    expect(result.errorCode).toBe('ERR_FIELD_FULL')
  })

  it('should return invalid when insufficient stones', () => {
    const card = createTestCard({ cost: 5 }) // needs 3 stones
    const result = validateTameAction(card, 1, 0, 12)

    expect(result.valid).toBe(false)
    expect(result.errorCode).toBe('ERR_INSUFFICIENT_STONES')
    expect(result.error).toContain('3') // needed
    expect(result.error).toContain('1') // have
  })

  it('should use default maxFieldSize of 12', () => {
    const card = createTestCard()
    const result = validateTameAction(card, 5, 12)

    expect(result.valid).toBe(false)
    expect(result.errorCode).toBe('ERR_FIELD_FULL')
  })
})

describe('validateSellAction', () => {
  it('should return valid when card is in hand', () => {
    const card = createTestCard({ location: CardLocation.HAND })
    const result = validateSellAction(card, CardLocation.HAND)

    expect(result.valid).toBe(true)
  })

  it('should return invalid when card is not in hand', () => {
    const card = createTestCard({ location: CardLocation.FIELD })

    expect(validateSellAction(card, CardLocation.FIELD).valid).toBe(false)
    expect(validateSellAction(card, CardLocation.MARKET).valid).toBe(false)
    expect(validateSellAction(card, CardLocation.DECK).valid).toBe(false)
    expect(validateSellAction(card, CardLocation.DISCARD).valid).toBe(false)
  })

  it('should have correct error code', () => {
    const card = createTestCard({ location: CardLocation.FIELD })
    const result = validateSellAction(card, CardLocation.FIELD)

    expect(result.errorCode).toBe('ERR_CARD_NOT_IN_HAND')
  })
})

describe('validateMarketSelection', () => {
  let market: ReturnType<typeof createTestMarket>

  beforeEach(() => {
    market = createTestMarket(4)
  })

  it('should return valid when card is in market', () => {
    const result = validateMarketSelection(market[0].instanceId, market)
    expect(result.valid).toBe(true)
  })

  it('should return invalid when card is not in market', () => {
    const result = validateMarketSelection('non-existent-id', market)

    expect(result.valid).toBe(false)
    expect(result.errorCode).toBe('ERR_CARD_NOT_IN_MARKET')
  })

  it('should return invalid for empty market', () => {
    const result = validateMarketSelection('any-id', [])
    expect(result.valid).toBe(false)
  })
})

// ============================================
// DECK UTILITIES TESTS
// ============================================

describe('drawCards', () => {
  let deck: ReturnType<typeof createTestDeck>

  beforeEach(() => {
    deck = createTestDeck(10)
  })

  it('should draw specified number of cards from top', () => {
    const { drawn, remaining } = drawCards(deck, 3)

    expect(drawn).toHaveLength(3)
    expect(remaining).toHaveLength(7)
    expect(drawn[0].instanceId).toBe(deck[0].instanceId)
    expect(drawn[1].instanceId).toBe(deck[1].instanceId)
    expect(drawn[2].instanceId).toBe(deck[2].instanceId)
  })

  it('should return empty drawn array when drawing 0', () => {
    const { drawn, remaining } = drawCards(deck, 0)

    expect(drawn).toHaveLength(0)
    expect(remaining).toHaveLength(10)
  })

  it('should return all cards when drawing more than deck size', () => {
    const { drawn, remaining } = drawCards(deck, 15)

    expect(drawn).toHaveLength(10)
    expect(remaining).toHaveLength(0)
  })

  it('should not modify original deck', () => {
    const originalLength = deck.length
    drawCards(deck, 5)
    expect(deck).toHaveLength(originalLength)
  })
})

describe('refillMarket', () => {
  let deck: ReturnType<typeof createTestDeck>

  beforeEach(() => {
    deck = createTestDeck(20)
  })

  it('should fill market to target size', () => {
    const { market, deck: remainingDeck } = refillMarket([], deck, 4)

    expect(market).toHaveLength(4)
    expect(remainingDeck).toHaveLength(16)
  })

  it('should top up partially filled market', () => {
    const existingMarket = createTestMarket(2)
    const { market, deck: remainingDeck } = refillMarket(existingMarket, deck, 4)

    expect(market).toHaveLength(4)
    expect(remainingDeck).toHaveLength(18)
  })

  it('should not add cards if market already at target', () => {
    const existingMarket = createTestMarket(4)
    const { market, deck: remainingDeck } = refillMarket(existingMarket, deck, 4)

    expect(market).toHaveLength(4)
    expect(remainingDeck).toHaveLength(20)
  })

  it('should set cards to MARKET location and revealed', () => {
    const { market } = refillMarket([], deck, 4)

    market.forEach(card => {
      expect(card.location).toBe(CardLocation.MARKET)
      expect(card.isRevealed).toBe(true)
    })
  })

  it('should use default target size of 4', () => {
    const { market } = refillMarket([], deck)
    expect(market).toHaveLength(4)
  })

  it('should handle deck smaller than needed', () => {
    const smallDeck = createTestDeck(2)
    const { market, deck: remainingDeck } = refillMarket([], smallDeck, 4)

    expect(market).toHaveLength(2)
    expect(remainingDeck).toHaveLength(0)
  })
})

// ============================================
// PLAYER UTILITIES TESTS
// ============================================

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('should generate string IDs', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })
})

describe('determineHuntingOrder', () => {
  it('should let lower score player go first', () => {
    const [first, second] = determineHuntingOrder(10, 20, 0)
    expect(first).toBe(0) // Player 1 (lower score) goes first
    expect(second).toBe(1)
  })

  it('should let lower score player go first (reversed)', () => {
    const [first, second] = determineHuntingOrder(20, 10, 0)
    expect(first).toBe(1) // Player 2 (lower score) goes first
    expect(second).toBe(0)
  })

  it('should use opposite of last first player on tie', () => {
    // If player 0 went first last round, player 1 goes first on tie
    const [first1] = determineHuntingOrder(15, 15, 0)
    expect(first1).toBe(1)

    // If player 1 went first last round, player 0 goes first on tie
    const [first2] = determineHuntingOrder(15, 15, 1)
    expect(first2).toBe(0)
  })
})

// ============================================
// MVP CONSTANTS TESTS
// ============================================

describe('MVP_CONSTANTS', () => {
  it('should have correct starting stones', () => {
    expect(MVP_CONSTANTS.STARTING_STONES).toBe(0)
  })

  it('should have correct base stone limit', () => {
    expect(MVP_CONSTANTS.BASE_STONE_LIMIT).toBe(3)
  })

  it('should have correct stones per round', () => {
    expect(MVP_CONSTANTS.STONES_PER_ROUND).toBe(1)
  })

  it('should have correct max hand size', () => {
    expect(MVP_CONSTANTS.MAX_HAND_SIZE).toBe(10)
  })

  it('should have correct max field size', () => {
    expect(MVP_CONSTANTS.MAX_FIELD_SIZE).toBe(12)
  })

  it('should have correct market size', () => {
    expect(MVP_CONSTANTS.MARKET_SIZE).toBe(4)
  })

  it('should have correct max rounds', () => {
    expect(MVP_CONSTANTS.MAX_ROUNDS).toBe(10)
  })

  it('should have correct victory score', () => {
    expect(MVP_CONSTANTS.VICTORY_SCORE).toBe(60)
  })

  it('should have correct cards per type', () => {
    expect(MVP_CONSTANTS.CARDS_PER_TYPE).toBe(2)
  })

  it('should have correct total deck size', () => {
    expect(MVP_CONSTANTS.TOTAL_DECK_SIZE).toBe(40)
  })
})
