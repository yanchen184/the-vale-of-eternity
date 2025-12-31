/**
 * Effect System for Single Player Mode v3.0.0
 * Handles all card effect processing with Stone Economy System
 * @version 3.0.0
 */
console.log('[lib/effect-system.ts] v3.0.0 loaded')

import type { CardInstance, EffectResult, StoneConfig } from '@/types/cards'
import { Element, EffectType, EffectTrigger, CardLocation, StoneType } from '@/types/cards'
import type { SinglePlayerGameState, StonePool } from '@/types/game'
import { addStonesToPool } from '@/types/game'

// ============================================
// STONE UTILITIES
// ============================================

/**
 * Convert StoneType to StonePool key
 */
function stoneTypeToPoolKey(type: StoneType): keyof StonePool {
  const mapping: Record<StoneType, keyof StonePool> = {
    [StoneType.ONE]: 'ONE',
    [StoneType.THREE]: 'THREE',
    [StoneType.SIX]: 'SIX',
    [StoneType.WATER]: 'WATER',
    [StoneType.FIRE]: 'FIRE',
    [StoneType.EARTH]: 'EARTH',
    [StoneType.WIND]: 'WIND',
  }
  return mapping[type]
}

/**
 * Convert StoneConfig array to StonePool partial
 */
export function stoneConfigsToPool(configs: StoneConfig[]): Partial<StonePool> {
  const result: Partial<StonePool> = {}
  for (const config of configs) {
    const key = stoneTypeToPoolKey(config.type)
    result[key] = (result[key] ?? 0) + config.amount
  }
  return result
}

// ============================================
// EFFECT PROCESSING FOR SINGLE PLAYER
// ============================================

/**
 * Process ON_TAME effects for single player mode
 * @param card The card being tamed
 * @param state Current game state
 * @returns Effect result with changes to apply
 */
export function processOnTameEffectSinglePlayer(
  card: CardInstance,
  state: SinglePlayerGameState
): {
  stonesGained: Partial<StonePool>
  cardsDrawn: CardInstance[]
  message: string
} {
  const result = {
    stonesGained: {} as Partial<StonePool>,
    cardsDrawn: [] as CardInstance[],
    message: '',
  }

  // Process each effect on the card
  for (const effect of card.effects) {
    if (effect.trigger !== EffectTrigger.ON_TAME) {
      continue
    }

    switch (effect.type) {
      case EffectType.EARN_STONES:
        if (effect.stones) {
          const additions = stoneConfigsToPool(effect.stones)
          result.stonesGained = addStonesToPool(
            result.stonesGained as StonePool,
            additions
          )
          result.message += `Earned stones. `
        }
        break

      case EffectType.DRAW_CARD:
        if (effect.value && effect.value > 0 && state.deck.length > 0) {
          const drawCount = Math.min(effect.value, state.deck.length)
          const drawnCards = state.deck.slice(0, drawCount).map(c => ({
            ...c,
            location: CardLocation.HAND,
            isRevealed: true,
          }))
          result.cardsDrawn.push(...drawnCards)
          result.message += `Drew ${drawCount} card(s). `
        }
        break

      case EffectType.RECOVER_CARD:
        if (effect.value && effect.value > 0 && state.discardPile.length > 0) {
          const recoverCount = Math.min(effect.value, state.discardPile.length)
          const recoveredCards = state.discardPile.slice(-recoverCount).map(c => ({
            ...c,
            location: CardLocation.HAND,
            isRevealed: true,
          }))
          result.cardsDrawn.push(...recoveredCards)
          result.message += `Recovered ${recoverCount} card(s) from discard. `
        }
        break

      case EffectType.EXCHANGE_STONES:
        result.message += 'Exchange effect available. '
        break

      case EffectType.FREE_SUMMON:
        result.message += 'Free summon triggered. '
        break

      case EffectType.COPY_INSTANT_EFFECT:
        result.message += 'Copy effect available. '
        break

      default:
        break
    }
  }

  return result
}

// ============================================
// LEGACY EFFECT PROCESSING (For backward compatibility)
// ============================================

// Legacy player state interface for old game engine
interface LegacyPlayerState {
  stones: number
  stoneLimit: number
  field: CardInstance[]
  hand: CardInstance[]
}

// Legacy game state interface for old game engine
interface LegacyGameState {
  players: [LegacyPlayerState, LegacyPlayerState]
  discardPile: CardInstance[]
}

/**
 * Process an effect when a card is tamed (ON_TAME effects) - Legacy version
 * @deprecated Use processOnTameEffectSinglePlayer for single player mode
 */
export function processOnTameEffect(
  card: CardInstance,
  state: LegacyGameState,
  playerIndex: 0 | 1
): EffectResult {
  const player = state.players[playerIndex]
  const result: EffectResult = {
    stonesGained: 0,
    cardsDrawn: [],
    stoneLimitIncrease: 0,
  }

  // Only process ON_TAME effects
  if (card.effectTrigger !== EffectTrigger.ON_TAME) {
    return result
  }

  switch (card.effectType) {
    case EffectType.EARN_STONES:
      result.stonesGained = processGainStones(card, player)
      result.message = `Gained ${result.stonesGained} stone(s)`
      break

    case EffectType.RECOVER_CARD:
      const drawResult = processDrawFromDiscard(card, state)
      result.cardsDrawn = drawResult.cards
      result.message = drawResult.message
      break

    default:
      break
  }

  return result
}

/**
 * Process permanent effects (INCREASE_STONE_LIMIT)
 * @deprecated Use calculatePermanentEffects for single player mode
 */
export function processPermanentEffect(
  card: CardInstance,
  _player: LegacyPlayerState
): EffectResult {
  const result: EffectResult = {
    stonesGained: 0,
    cardsDrawn: [],
    stoneLimitIncrease: 0,
  }

  if (card.effectTrigger !== EffectTrigger.PERMANENT) {
    return result
  }

  switch (card.effectType) {
    case EffectType.INCREASE_STONE_LIMIT:
      result.stoneLimitIncrease = card.effectValue ?? 0
      result.message = `Stone limit increased by ${result.stoneLimitIncrease}`
      break

    default:
      break
  }

  return result
}

/**
 * Process EARN_STONES effect (legacy)
 */
function processGainStones(
  card: CardInstance,
  player: LegacyPlayerState
): number {
  const valueToGain = card.effectValue ?? 0
  const maxGainable = player.stoneLimit - player.stones
  return Math.min(valueToGain, maxGainable)
}

/**
 * Process RECOVER_CARD effect (legacy)
 */
function processDrawFromDiscard(
  card: CardInstance,
  state: LegacyGameState
): { cards: CardInstance[]; message: string } {
  const drawCount = card.effectValue ?? 1

  if (state.discardPile.length === 0) {
    return {
      cards: [],
      message: 'Discard pile is empty',
    }
  }

  const cardsToDraw = Math.min(drawCount, state.discardPile.length)
  const drawnCards = state.discardPile.slice(-cardsToDraw)

  return {
    cards: drawnCards.map(c => ({
      ...c,
      location: CardLocation.HAND,
    })),
    message: `Drew ${drawnCards.length} card(s) from discard pile`,
  }
}

// ============================================
// SCORING EFFECTS
// ============================================

/**
 * Calculate score bonus from a card's scoring effect
 * Uses the new effects array format
 */
export function calculateScoringEffect(
  card: CardInstance,
  playerField: readonly CardInstance[]
): number {
  let totalBonus = 0

  for (const effect of card.effects) {
    if (effect.trigger !== EffectTrigger.ON_SCORE) {
      continue
    }

    switch (effect.type) {
      case EffectType.EARN_PER_ELEMENT:
        if (effect.targetElement) {
          const matchingCount = playerField.filter(
            c => c.element === effect.targetElement
          ).length
          totalBonus += matchingCount * (effect.value ?? 1)
        }
        break

      case EffectType.EARN_PER_FAMILY:
        const uniqueElements = new Set(playerField.map(c => c.element))
        totalBonus += uniqueElements.size * (effect.value ?? 1)
        break

      case EffectType.CONDITIONAL_AREA:
        totalBonus += playerField.length * (effect.value ?? 1)
        break

      case EffectType.CONDITIONAL_HAND:
        // This requires hand size - handled separately
        break

      default:
        break
    }
  }

  // Legacy support: check effectType directly
  if (card.effectTrigger === EffectTrigger.ON_SCORE) {
    switch (card.effectType) {
      case EffectType.EARN_PER_ELEMENT:
        if (card.effectTarget) {
          const matchingCount = playerField.filter(
            c => c.element === card.effectTarget
          ).length
          totalBonus += matchingCount * (card.effectValue ?? 1)
        }
        break

      case EffectType.EARN_PER_FAMILY:
        const dragonCount = playerField.filter(
          c => c.element === Element.DRAGON
        ).length
        totalBonus += dragonCount * (card.effectValue ?? 2)
        break
    }
  }

  return totalBonus
}

// ============================================
// SCORE CALCULATION
// ============================================

/**
 * Calculate total score for a player based on all cards and effects
 */
export function calculatePlayerScore(
  playerField: readonly CardInstance[]
): number {
  let totalScore = 0

  for (const card of playerField) {
    let cardScore = card.baseScore + card.scoreModifier
    cardScore += calculateScoringEffect(card, playerField)
    totalScore += cardScore
  }

  return totalScore
}

/**
 * Calculate breakdown of score for display purposes
 */
export function calculateScoreBreakdown(
  playerField: readonly CardInstance[]
): Array<{
  cardId: string
  cardName: string
  baseScore: number
  effectBonus: number
  totalScore: number
}> {
  return playerField.map(card => {
    const effectBonus = calculateScoringEffect(card, playerField)
    return {
      cardId: card.instanceId,
      cardName: card.nameTw,
      baseScore: card.baseScore + card.scoreModifier,
      effectBonus,
      totalScore: card.baseScore + card.scoreModifier + effectBonus,
    }
  })
}

// ============================================
// STONE LIMIT CALCULATION
// ============================================

/**
 * Calculate effective stone limit for a player
 */
export function calculateEffectiveStoneLimit(
  baseLimit: number,
  playerField: readonly CardInstance[]
): number {
  let limit = baseLimit

  for (const card of playerField) {
    // Check new effects array format
    for (const effect of card.effects) {
      if (
        effect.type === EffectType.INCREASE_STONE_LIMIT &&
        effect.trigger === EffectTrigger.PERMANENT
      ) {
        limit += effect.value ?? 0
      }
    }

    // Legacy support
    if (
      card.effectType === EffectType.INCREASE_STONE_LIMIT &&
      card.effectTrigger === EffectTrigger.PERMANENT
    ) {
      limit += card.effectValue ?? 0
    }
  }

  return limit
}

// ============================================
// EFFECT UTILITIES
// ============================================

/**
 * Check if a card has an active effect
 */
export function hasEffect(card: CardInstance): boolean {
  return card.effects.length > 0 || card.effectType !== EffectType.NONE
}

/**
 * Check if a card has a scoring effect
 */
export function hasScoringEffect(card: CardInstance): boolean {
  return (
    card.effects.some(e => e.trigger === EffectTrigger.ON_SCORE) ||
    card.effectTrigger === EffectTrigger.ON_SCORE
  )
}

/**
 * Check if a card has an on-tame effect
 */
export function hasOnTameEffect(card: CardInstance): boolean {
  return (
    card.effects.some(e => e.trigger === EffectTrigger.ON_TAME) ||
    card.effectTrigger === EffectTrigger.ON_TAME
  )
}

/**
 * Check if a card has a permanent effect
 */
export function hasPermanentEffect(card: CardInstance): boolean {
  return (
    card.effects.some(e => e.trigger === EffectTrigger.PERMANENT) ||
    card.effectTrigger === EffectTrigger.PERMANENT
  )
}

/**
 * Get effect description for display
 */
export function getEffectDescription(
  card: CardInstance,
  useChinese: boolean = true
): string {
  // New format: combine all effect descriptions
  if (card.effects.length > 0) {
    return card.effects
      .map(e => (useChinese ? e.descriptionTw : e.description))
      .join(' ')
  }

  // Legacy format
  if (card.effectType === EffectType.NONE) {
    return ''
  }

  return useChinese
    ? (card.effectDescriptionTw ?? '')
    : (card.effectDescription ?? '')
}

/**
 * Get effect type display name
 */
export function getEffectTypeName(
  effectType: EffectType,
  useChinese: boolean = true
): string {
  const names: Record<EffectType, { en: string; tw: string }> = {
    [EffectType.NONE]: { en: 'None', tw: '無' },
    [EffectType.EARN_STONES]: { en: 'Earn Stones', tw: '獲得石頭' },
    [EffectType.DISCARD_STONES]: { en: 'Discard Stones', tw: '棄置石頭' },
    [EffectType.EXCHANGE_STONES]: { en: 'Exchange Stones', tw: '交換石頭' },
    [EffectType.INCREASE_STONE_VALUE]: { en: 'Increase Value', tw: '增加價值' },
    [EffectType.INCREASE_STONE_LIMIT]: { en: 'Increase Limit', tw: '增加上限' },
    [EffectType.STEAL_STONES]: { en: 'Steal Stones', tw: '偷取石頭' },
    [EffectType.DRAW_CARD]: { en: 'Draw Cards', tw: '抽牌' },
    [EffectType.DISCARD_FROM_HAND]: { en: 'Discard', tw: '棄牌' },
    [EffectType.RECOVER_CARD]: { en: 'Recover Card', tw: '回收卡片' },
    [EffectType.FREE_SUMMON]: { en: 'Free Summon', tw: '免費召喚' },
    [EffectType.RETURN_CARD]: { en: 'Return Card', tw: '歸還卡片' },
    [EffectType.OPPONENT_DISCARD]: { en: 'Force Discard', tw: '強制棄牌' },
    [EffectType.REDUCE_COST]: { en: 'Reduce Cost', tw: '降低費用' },
    [EffectType.DECREASE_COST]: { en: 'Decrease Cost', tw: '減少費用' },
    [EffectType.ACTIVATE_ALL_PERMANENT]: { en: 'Activate All', tw: '啟動全部' },
    [EffectType.COPY_INSTANT_EFFECT]: { en: 'Copy Effect', tw: '複製效果' },
    [EffectType.CONDITIONAL_EARN]: { en: 'Conditional Earn', tw: '條件獲得' },
    [EffectType.CONDITIONAL_AREA]: { en: 'Area Bonus', tw: '區域加成' },
    [EffectType.CONDITIONAL_HAND]: { en: 'Hand Bonus', tw: '手牌加成' },
    [EffectType.EARN_PER_ELEMENT]: { en: 'Element Synergy', tw: '元素加成' },
    [EffectType.EARN_PER_FAMILY]: { en: 'Family Synergy', tw: '龍族加成' },
    [EffectType.EARN_ON_SUMMON]: { en: 'Summon Bonus', tw: '召喚加成' },
    [EffectType.DISCARD_ALL_FOR_POINTS]: { en: 'All for Points', tw: '全換分數' },
    [EffectType.MULTI_CHOICE]: { en: 'Multi Choice', tw: '多選效果' },
    [EffectType.PROTECTION]: { en: 'Protection', tw: '保護' },
    [EffectType.PUT_ON_DECK_TOP]: { en: 'Deck Top', tw: '放回牌頂' },
  }

  return useChinese
    ? (names[effectType]?.tw ?? effectType)
    : (names[effectType]?.en ?? effectType)
}

/**
 * Get effect trigger display name
 */
export function getEffectTriggerName(
  trigger: EffectTrigger,
  useChinese: boolean = true
): string {
  const names: Record<EffectTrigger, { en: string; tw: string }> = {
    [EffectTrigger.NONE]: { en: 'None', tw: '無' },
    [EffectTrigger.ON_TAME]: { en: 'On Tame', tw: '馴服時' },
    [EffectTrigger.PERMANENT]: { en: 'Permanent', tw: '永久' },
    [EffectTrigger.ON_SCORE]: { en: 'On Score', tw: '計分時' },
  }

  return useChinese ? names[trigger].tw : names[trigger].en
}
