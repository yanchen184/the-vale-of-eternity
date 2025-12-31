/**
 * Effect System Tests
 * Tests all card effect processing logic
 * Based on TEST_SPEC.md and GAME_ENGINE_SPEC.md
 * @version 1.0.0
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  processOnTameEffect,
  processPermanentEffect,
  calculateScoringEffect,
  calculatePlayerScore,
  calculateScoreBreakdown,
  calculateEffectiveStoneLimit,
  hasEffect,
  hasScoringEffect,
  hasOnTameEffect,
  hasPermanentEffect,
  getEffectDescription,
  getEffectTypeName,
  getEffectTriggerName,
} from '../effect-system'
import { Element, EffectType, EffectTrigger, CardLocation } from '@/types/cards'
import type { MVPGameState, MVPPlayerState } from '../game-engine'
import {
  createTestCard,
  createFireCard,
  createDragonCard,
  createGainStonesCard,
  createIncreaseStoneLimitCard,
  createDrawFromDiscardCard,
  createScorePerElementCard,
  createScorePerDragonCard,
  createTestPlayer,
  createTestState,
} from '@/test/test-helpers'

// ============================================
// ON_TAME EFFECT TESTS
// ============================================

describe('processOnTameEffect', () => {
  let state: MVPGameState
  let player: MVPPlayerState

  beforeEach(() => {
    player = createTestPlayer({ stones: 0, stoneLimit: 3 })
    state = createTestState({
      players: [player, createTestPlayer({ index: 1 })] as [MVPPlayerState, MVPPlayerState],
      discardPile: [],
    })
  })

  describe('GAIN_STONES effect', () => {
    it('should gain specified stones amount', () => {
      const card = createGainStonesCard(2)
      const result = processOnTameEffect(card, state, 0)

      expect(result.stonesGained).toBe(2)
      expect(result.message).toContain('2')
    })

    it('should respect stone limit', () => {
      // Player has 2 stones, limit 3, gains 2 would be 4 but cap at 3
      const playerWithStones = createTestPlayer({ stones: 2, stoneLimit: 3 })
      const limitedState = createTestState({
        players: [playerWithStones, createTestPlayer({ index: 1 })] as [
          MVPPlayerState,
          MVPPlayerState,
        ],
      })

      const card = createGainStonesCard(2)
      const result = processOnTameEffect(card, limitedState, 0)

      expect(result.stonesGained).toBe(1) // Only gain 1 to reach limit
    })

    it('should return 0 when already at limit', () => {
      const playerAtLimit = createTestPlayer({ stones: 3, stoneLimit: 3 })
      const fullState = createTestState({
        players: [playerAtLimit, createTestPlayer({ index: 1 })] as [
          MVPPlayerState,
          MVPPlayerState,
        ],
      })

      const card = createGainStonesCard(2)
      const result = processOnTameEffect(card, fullState, 0)

      expect(result.stonesGained).toBe(0)
    })
  })

  describe('DRAW_FROM_DISCARD effect', () => {
    it('should draw cards from discard pile', () => {
      const discardedCard = createTestCard({
        instanceId: 'discarded-1',
        location: CardLocation.DISCARD,
      })
      const stateWithDiscard = createTestState({
        players: [player, createTestPlayer({ index: 1 })] as [MVPPlayerState, MVPPlayerState],
        discardPile: [discardedCard],
      })

      const card = createDrawFromDiscardCard(1)
      const result = processOnTameEffect(card, stateWithDiscard, 0)

      expect(result.cardsDrawn).toHaveLength(1)
      expect(result.cardsDrawn[0].instanceId).toBe('discarded-1')
      expect(result.cardsDrawn[0].location).toBe(CardLocation.HAND)
    })

    it('should return empty array when discard is empty', () => {
      const card = createDrawFromDiscardCard(1)
      const result = processOnTameEffect(card, state, 0)

      expect(result.cardsDrawn).toHaveLength(0)
      expect(result.message).toContain('empty')
    })

    it('should draw from top of discard pile (most recent first)', () => {
      const discard1 = createTestCard({ instanceId: 'discard-1' })
      const discard2 = createTestCard({ instanceId: 'discard-2' })
      const discard3 = createTestCard({ instanceId: 'discard-3' })
      const stateWithMultipleDiscard = createTestState({
        players: [player, createTestPlayer({ index: 1 })] as [MVPPlayerState, MVPPlayerState],
        discardPile: [discard1, discard2, discard3],
      })

      const card = createDrawFromDiscardCard(1)
      const result = processOnTameEffect(card, stateWithMultipleDiscard, 0)

      expect(result.cardsDrawn[0].instanceId).toBe('discard-3') // Most recent
    })
  })

  describe('Non-ON_TAME effects', () => {
    it('should return empty result for NONE effect cards', () => {
      const card = createTestCard({ effectType: EffectType.NONE })
      const result = processOnTameEffect(card, state, 0)

      expect(result.stonesGained).toBe(0)
      expect(result.cardsDrawn).toHaveLength(0)
      expect(result.stoneLimitIncrease).toBe(0)
    })

    it('should return empty result for PERMANENT trigger cards', () => {
      const card = createIncreaseStoneLimitCard(2)
      const result = processOnTameEffect(card, state, 0)

      expect(result.stonesGained).toBe(0)
      expect(result.stoneLimitIncrease).toBe(0)
    })

    it('should return empty result for ON_SCORE trigger cards', () => {
      const card = createScorePerElementCard(Element.FIRE, 1)
      const result = processOnTameEffect(card, state, 0)

      expect(result.stonesGained).toBe(0)
      expect(result.stoneLimitIncrease).toBe(0)
    })
  })
})

// ============================================
// PERMANENT EFFECT TESTS
// ============================================

describe('processPermanentEffect', () => {
  let player: MVPPlayerState

  beforeEach(() => {
    player = createTestPlayer({ stoneLimit: 3 })
  })

  describe('INCREASE_STONE_LIMIT effect', () => {
    it('should return stone limit increase value', () => {
      const card = createIncreaseStoneLimitCard(2)
      const result = processPermanentEffect(card, player)

      expect(result.stoneLimitIncrease).toBe(2)
      expect(result.message).toContain('2')
    })

    it('should handle different increase values', () => {
      const card = createIncreaseStoneLimitCard(3)
      const result = processPermanentEffect(card, player)

      expect(result.stoneLimitIncrease).toBe(3)
    })
  })

  describe('Non-PERMANENT effects', () => {
    it('should return 0 for ON_TAME effects', () => {
      const card = createGainStonesCard(2)
      const result = processPermanentEffect(card, player)

      expect(result.stoneLimitIncrease).toBe(0)
    })

    it('should return 0 for ON_SCORE effects', () => {
      const card = createScorePerElementCard(Element.FIRE, 1)
      const result = processPermanentEffect(card, player)

      expect(result.stoneLimitIncrease).toBe(0)
    })

    it('should return 0 for NONE effects', () => {
      const card = createTestCard({ effectType: EffectType.NONE })
      const result = processPermanentEffect(card, player)

      expect(result.stoneLimitIncrease).toBe(0)
    })
  })
})

// ============================================
// SCORING EFFECT TESTS
// ============================================

describe('calculateScoringEffect', () => {
  describe('SCORE_PER_ELEMENT effect', () => {
    it('should calculate bonus for matching elements', () => {
      const scoringCard = createScorePerElementCard(Element.FIRE, 1, {
        element: Element.FIRE,
        instanceId: 'scoring',
      })
      const fire1 = createFireCard({ instanceId: 'fire-1' })
      const fire2 = createFireCard({ instanceId: 'fire-2' })
      const water = createTestCard({ element: Element.WATER, instanceId: 'water' })

      const field = [scoringCard, fire1, fire2, water]

      // 3 fire cards * 1 point each = 3 bonus
      expect(calculateScoringEffect(scoringCard, field)).toBe(3)
    })

    it('should multiply by effectValue', () => {
      const scoringCard = createScorePerElementCard(Element.WATER, 2, {
        element: Element.DRAGON,
        instanceId: 'scoring',
      })
      const water1 = createTestCard({ element: Element.WATER, instanceId: 'water-1' })
      const water2 = createTestCard({ element: Element.WATER, instanceId: 'water-2' })

      const field = [scoringCard, water1, water2]

      // 2 water cards * 2 points each = 4 bonus
      expect(calculateScoringEffect(scoringCard, field)).toBe(4)
    })

    it('should return 0 when no matching elements', () => {
      const scoringCard = createScorePerElementCard(Element.FIRE, 1, {
        element: Element.WATER,
        instanceId: 'scoring',
      })
      const water = createTestCard({ element: Element.WATER, instanceId: 'water' })
      const earth = createTestCard({ element: Element.EARTH, instanceId: 'earth' })

      const field = [scoringCard, water, earth]

      expect(calculateScoringEffect(scoringCard, field)).toBe(0)
    })
  })

  describe('SCORE_PER_DRAGON effect', () => {
    it('should calculate bonus for dragon cards', () => {
      const dragonEgg = createScorePerDragonCard(2, {
        element: Element.DRAGON,
        instanceId: 'egg',
      })
      const dragon1 = createDragonCard({ instanceId: 'dragon-1' })
      const dragon2 = createDragonCard({ instanceId: 'dragon-2' })
      const fire = createFireCard({ instanceId: 'fire' })

      const field = [dragonEgg, dragon1, dragon2, fire]

      // 3 dragons * 2 points each = 6 bonus
      expect(calculateScoringEffect(dragonEgg, field)).toBe(6)
    })

    it('should use default value of 2 when effectValue not specified', () => {
      const dragonEgg = createTestCard({
        effectType: EffectType.EARN_PER_FAMILY,
        effectTrigger: EffectTrigger.ON_SCORE,
        element: Element.DRAGON,
        instanceId: 'egg',
      })
      const dragon = createDragonCard({ instanceId: 'dragon' })

      const field = [dragonEgg, dragon]

      // 2 dragons * 2 points each = 4 bonus
      expect(calculateScoringEffect(dragonEgg, field)).toBe(4)
    })
  })

  describe('Non-scoring effects', () => {
    it('should return 0 for ON_TAME trigger', () => {
      const card = createGainStonesCard(2)
      expect(calculateScoringEffect(card, [card])).toBe(0)
    })

    it('should return 0 for PERMANENT trigger', () => {
      const card = createIncreaseStoneLimitCard(2)
      expect(calculateScoringEffect(card, [card])).toBe(0)
    })

    it('should return 0 for NONE effect', () => {
      const card = createTestCard({ effectType: EffectType.NONE })
      expect(calculateScoringEffect(card, [card])).toBe(0)
    })
  })
})

// ============================================
// PLAYER SCORE CALCULATION TESTS
// ============================================

describe('calculatePlayerScore', () => {
  it('should sum base scores of all cards', () => {
    const card1 = createTestCard({ baseScore: 3, instanceId: 'card-1' })
    const card2 = createTestCard({ baseScore: 5, instanceId: 'card-2' })
    const card3 = createTestCard({ baseScore: 2, instanceId: 'card-3' })

    expect(calculatePlayerScore([card1, card2, card3])).toBe(10)
  })

  it('should include scoreModifier', () => {
    const card = createTestCard({ baseScore: 3, scoreModifier: 2 })
    expect(calculatePlayerScore([card])).toBe(5)
  })

  it('should include scoring effects', () => {
    const firefox = createScorePerElementCard(Element.FIRE, 1, {
      baseScore: 3,
      element: Element.FIRE,
      instanceId: 'firefox',
    })
    const fire1 = createFireCard({ baseScore: 2, instanceId: 'fire-1' })
    const fire2 = createFireCard({ baseScore: 2, instanceId: 'fire-2' })

    const field = [firefox, fire1, fire2]

    // Firefox: 3 base + 3 (3 fire * 1) = 6
    // Fire1: 2
    // Fire2: 2
    // Total: 10
    expect(calculatePlayerScore(field)).toBe(10)
  })

  it('should handle empty field', () => {
    expect(calculatePlayerScore([])).toBe(0)
  })

  it('should correctly calculate complex scoring scenario', () => {
    // Dragon Egg synergy scenario
    const dragonEgg = createScorePerDragonCard(2, {
      baseScore: 0,
      element: Element.DRAGON,
      instanceId: 'egg',
    })
    const ember = createScorePerElementCard(Element.FIRE, 2, {
      baseScore: 5,
      element: Element.DRAGON,
      instanceId: 'ember',
    })
    const fire1 = createFireCard({ baseScore: 2, instanceId: 'fire-1' })
    const fire2 = createFireCard({ baseScore: 4, instanceId: 'fire-2' })

    const field = [dragonEgg, ember, fire1, fire2]

    // DragonEgg: 0 base + 4 (2 dragons * 2) = 4
    // Ember: 5 base + 4 (2 fire * 2) = 9
    // Fire1: 2
    // Fire2: 4
    // Total: 19
    expect(calculatePlayerScore(field)).toBe(19)
  })
})

describe('calculateScoreBreakdown', () => {
  it('should return breakdown for each card', () => {
    const card1 = createTestCard({ baseScore: 3, instanceId: 'card-1', nameTw: '測試卡1' })
    const card2 = createTestCard({ baseScore: 5, instanceId: 'card-2', nameTw: '測試卡2' })

    const breakdown = calculateScoreBreakdown([card1, card2])

    expect(breakdown).toHaveLength(2)
    expect(breakdown[0].cardId).toBe('card-1')
    expect(breakdown[0].cardName).toBe('測試卡1')
    expect(breakdown[0].baseScore).toBe(3)
    expect(breakdown[0].effectBonus).toBe(0)
    expect(breakdown[0].totalScore).toBe(3)

    expect(breakdown[1].cardId).toBe('card-2')
    expect(breakdown[1].totalScore).toBe(5)
  })

  it('should include effect bonuses in breakdown', () => {
    const firefox = createScorePerElementCard(Element.FIRE, 1, {
      baseScore: 3,
      element: Element.FIRE,
      instanceId: 'firefox',
      nameTw: '火狐',
    })
    const fire = createFireCard({ baseScore: 2, instanceId: 'fire', nameTw: '火焰卡' })

    const breakdown = calculateScoreBreakdown([firefox, fire])

    expect(breakdown[0].cardName).toBe('火狐')
    expect(breakdown[0].baseScore).toBe(3)
    expect(breakdown[0].effectBonus).toBe(2) // 2 fire cards * 1
    expect(breakdown[0].totalScore).toBe(5)
  })
})

// ============================================
// STONE LIMIT CALCULATION TESTS
// ============================================

describe('calculateEffectiveStoneLimit', () => {
  it('should return base limit with no effect cards', () => {
    const field = [createTestCard(), createTestCard()]
    expect(calculateEffectiveStoneLimit(3, field)).toBe(3)
  })

  it('should add INCREASE_STONE_LIMIT effects', () => {
    const limitCard = createIncreaseStoneLimitCard(2)
    expect(calculateEffectiveStoneLimit(3, [limitCard])).toBe(5)
  })

  it('should stack multiple limit increase cards', () => {
    const limit1 = createIncreaseStoneLimitCard(2, { instanceId: 'limit-1' })
    const limit2 = createIncreaseStoneLimitCard(2, { instanceId: 'limit-2' })
    expect(calculateEffectiveStoneLimit(3, [limit1, limit2])).toBe(7)
  })

  it('should only count PERMANENT trigger cards', () => {
    const limitCard = createIncreaseStoneLimitCard(2)
    const gainCard = createGainStonesCard(2) // ON_TAME, should not count
    expect(calculateEffectiveStoneLimit(3, [limitCard, gainCard])).toBe(5)
  })

  it('should handle empty field', () => {
    expect(calculateEffectiveStoneLimit(3, [])).toBe(3)
  })
})

// ============================================
// EFFECT UTILITY TESTS
// ============================================

describe('hasEffect', () => {
  it('should return false for NONE effect', () => {
    const card = createTestCard({ effectType: EffectType.NONE })
    expect(hasEffect(card)).toBe(false)
  })

  it('should return true for any non-NONE effect', () => {
    expect(hasEffect(createGainStonesCard(2))).toBe(true)
    expect(hasEffect(createIncreaseStoneLimitCard(2))).toBe(true)
    expect(hasEffect(createScorePerElementCard(Element.FIRE, 1))).toBe(true)
    expect(hasEffect(createScorePerDragonCard(2))).toBe(true)
    expect(hasEffect(createDrawFromDiscardCard(1))).toBe(true)
  })
})

describe('hasScoringEffect', () => {
  it('should return true for ON_SCORE trigger', () => {
    expect(hasScoringEffect(createScorePerElementCard(Element.FIRE, 1))).toBe(true)
    expect(hasScoringEffect(createScorePerDragonCard(2))).toBe(true)
  })

  it('should return false for other triggers', () => {
    expect(hasScoringEffect(createGainStonesCard(2))).toBe(false)
    expect(hasScoringEffect(createIncreaseStoneLimitCard(2))).toBe(false)
    expect(hasScoringEffect(createTestCard())).toBe(false)
  })
})

describe('hasOnTameEffect', () => {
  it('should return true for ON_TAME trigger', () => {
    expect(hasOnTameEffect(createGainStonesCard(2))).toBe(true)
    expect(hasOnTameEffect(createDrawFromDiscardCard(1))).toBe(true)
  })

  it('should return false for other triggers', () => {
    expect(hasOnTameEffect(createScorePerElementCard(Element.FIRE, 1))).toBe(false)
    expect(hasOnTameEffect(createIncreaseStoneLimitCard(2))).toBe(false)
    expect(hasOnTameEffect(createTestCard())).toBe(false)
  })
})

describe('hasPermanentEffect', () => {
  it('should return true for PERMANENT trigger', () => {
    expect(hasPermanentEffect(createIncreaseStoneLimitCard(2))).toBe(true)
  })

  it('should return false for other triggers', () => {
    expect(hasPermanentEffect(createGainStonesCard(2))).toBe(false)
    expect(hasPermanentEffect(createScorePerElementCard(Element.FIRE, 1))).toBe(false)
    expect(hasPermanentEffect(createTestCard())).toBe(false)
  })
})

// ============================================
// DISPLAY HELPER TESTS
// ============================================

describe('getEffectDescription', () => {
  it('should return Chinese description by default', () => {
    const card = createTestCard({
      effectType: EffectType.EARN_STONES,
      effectDescription: 'Earn 2 stones',
      effectDescriptionTw: '獲得 2 顆石頭',
    })

    expect(getEffectDescription(card)).toBe('獲得 2 顆石頭')
  })

  it('should return English description when specified', () => {
    const card = createTestCard({
      effectType: EffectType.EARN_STONES,
      effectDescription: 'Earn 2 stones',
      effectDescriptionTw: '獲得 2 顆石頭',
    })

    expect(getEffectDescription(card, false)).toBe('Earn 2 stones')
  })

  it('should return empty string for NONE effect', () => {
    const card = createTestCard({ effectType: EffectType.NONE })
    expect(getEffectDescription(card)).toBe('')
  })
})

describe('getEffectTypeName', () => {
  it('should return Chinese names by default', () => {
    expect(getEffectTypeName(EffectType.NONE)).toBe('無')
    expect(getEffectTypeName(EffectType.EARN_STONES)).toBe('獲得石頭')
    expect(getEffectTypeName(EffectType.INCREASE_STONE_LIMIT)).toBe('增加上限')
    expect(getEffectTypeName(EffectType.EARN_PER_ELEMENT)).toBe('元素加成')
    expect(getEffectTypeName(EffectType.EARN_PER_FAMILY)).toBe('龍族加成')
    expect(getEffectTypeName(EffectType.RECOVER_CARD)).toBe('回收卡片')
  })

  it('should return English names when specified', () => {
    expect(getEffectTypeName(EffectType.NONE, false)).toBe('None')
    expect(getEffectTypeName(EffectType.EARN_STONES, false)).toBe('Earn Stones')
    expect(getEffectTypeName(EffectType.EARN_PER_ELEMENT, false)).toBe('Element Synergy')
  })
})

describe('getEffectTriggerName', () => {
  it('should return Chinese names by default', () => {
    expect(getEffectTriggerName(EffectTrigger.NONE)).toBe('無')
    expect(getEffectTriggerName(EffectTrigger.ON_TAME)).toBe('馴服時')
    expect(getEffectTriggerName(EffectTrigger.PERMANENT)).toBe('永久')
    expect(getEffectTriggerName(EffectTrigger.ON_SCORE)).toBe('計分時')
  })

  it('should return English names when specified', () => {
    expect(getEffectTriggerName(EffectTrigger.NONE, false)).toBe('None')
    expect(getEffectTriggerName(EffectTrigger.ON_TAME, false)).toBe('On Tame')
    expect(getEffectTriggerName(EffectTrigger.PERMANENT, false)).toBe('Permanent')
    expect(getEffectTriggerName(EffectTrigger.ON_SCORE, false)).toBe('On Score')
  })
})
