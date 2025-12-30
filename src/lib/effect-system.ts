/**
 * Effect System for MVP 1.0
 * Handles all card effect processing
 * Based on GAME_ENGINE_SPEC.md
 * @version 1.0.0
 */
console.log('[lib/effect-system.ts] v1.0.0 loaded')

import type { CardInstance, EffectResult } from '@/types/cards'
import { Element, EffectType, EffectTrigger, CardLocation } from '@/types/cards'
import type { MVPPlayerState, MVPGameState } from '@/lib/game-engine'

// ============================================
// EFFECT PROCESSING
// ============================================

/**
 * Process an effect when a card is tamed (ON_TAME effects)
 * @param card The card being tamed
 * @param state Current game state
 * @param playerIndex Player who tamed the card
 * @returns Effect result with changes to apply
 */
export function processOnTameEffect(
  card: CardInstance,
  state: MVPGameState,
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
    case EffectType.GAIN_STONES:
      result.stonesGained = processGainStones(card, player)
      result.message = `Gained ${result.stonesGained} stone(s)`
      break

    case EffectType.DRAW_FROM_DISCARD:
      const drawResult = processDrawFromDiscard(card, state)
      result.cardsDrawn = drawResult.cards
      result.message = drawResult.message
      break

    default:
      // No ON_TAME effect for this card
      break
  }

  return result
}

/**
 * Process permanent effects (INCREASE_STONE_LIMIT)
 * These are processed when card enters field
 * @param card The card with permanent effect
 * @param player Current player state
 * @returns Effect result with changes
 */
export function processPermanentEffect(
  card: CardInstance,
  _player: MVPPlayerState
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
 * Calculate score bonus from a card's scoring effect
 * @param card The card with scoring effect
 * @param playerField All cards on player's field
 * @returns Bonus score from this card's effect
 */
export function calculateScoringEffect(
  card: CardInstance,
  playerField: readonly CardInstance[]
): number {
  if (card.effectTrigger !== EffectTrigger.ON_SCORE) {
    return 0
  }

  switch (card.effectType) {
    case EffectType.SCORE_PER_ELEMENT:
      return calculateScorePerElement(card, playerField)

    case EffectType.SCORE_PER_DRAGON:
      return calculateScorePerDragon(card, playerField)

    default:
      return 0
  }
}

// ============================================
// EFFECT HANDLERS
// ============================================

/**
 * Process GAIN_STONES effect
 * @param card Card with GAIN_STONES effect
 * @param player Player state
 * @returns Number of stones actually gained (respecting limit)
 */
function processGainStones(
  card: CardInstance,
  player: MVPPlayerState
): number {
  const valueToGain = card.effectValue ?? 0
  const maxGainable = player.stoneLimit - player.stones
  return Math.min(valueToGain, maxGainable)
}

/**
 * Process DRAW_FROM_DISCARD effect
 * @param card Card with DRAW_FROM_DISCARD effect
 * @param state Game state (for discard pile access)
 * @returns Cards drawn and message
 */
function processDrawFromDiscard(
  card: CardInstance,
  state: MVPGameState
): { cards: CardInstance[]; message: string } {
  const drawCount = card.effectValue ?? 1

  if (state.discardPile.length === 0) {
    return {
      cards: [],
      message: 'Discard pile is empty',
    }
  }

  // Draw from top of discard pile
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

/**
 * Calculate SCORE_PER_ELEMENT bonus
 * @param card Card with SCORE_PER_ELEMENT effect
 * @param playerField All cards on player's field
 * @returns Bonus score
 */
function calculateScorePerElement(
  card: CardInstance,
  playerField: readonly CardInstance[]
): number {
  if (!card.effectTarget) {
    return 0
  }

  const matchingCount = playerField.filter(
    c => c.element === card.effectTarget
  ).length

  return matchingCount * (card.effectValue ?? 1)
}

/**
 * Calculate SCORE_PER_DRAGON bonus
 * @param card Card with SCORE_PER_DRAGON effect
 * @param playerField All cards on player's field
 * @returns Bonus score
 */
function calculateScorePerDragon(
  card: CardInstance,
  playerField: readonly CardInstance[]
): number {
  const dragonCount = playerField.filter(
    c => c.element === Element.DRAGON
  ).length

  return dragonCount * (card.effectValue ?? 2)
}

// ============================================
// SCORE CALCULATION
// ============================================

/**
 * Calculate total score for a player based on all cards and effects
 * @param playerField All cards on player's field
 * @returns Total score
 */
export function calculatePlayerScore(
  playerField: readonly CardInstance[]
): number {
  let totalScore = 0

  for (const card of playerField) {
    // Base score
    let cardScore = card.baseScore + card.scoreModifier

    // Add scoring effect bonus
    cardScore += calculateScoringEffect(card, playerField)

    totalScore += cardScore
  }

  return totalScore
}

/**
 * Calculate breakdown of score for display purposes
 * @param playerField All cards on player's field
 * @returns Score breakdown by card
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
 * @param baseLimit Base stone limit (usually 3)
 * @param playerField All cards on player's field
 * @returns Effective stone limit
 */
export function calculateEffectiveStoneLimit(
  baseLimit: number,
  playerField: readonly CardInstance[]
): number {
  let limit = baseLimit

  for (const card of playerField) {
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
 * @param card Card to check
 * @returns true if card has a non-NONE effect
 */
export function hasEffect(card: CardInstance): boolean {
  return card.effectType !== EffectType.NONE
}

/**
 * Check if a card has a scoring effect
 * @param card Card to check
 * @returns true if card has ON_SCORE effect
 */
export function hasScoringEffect(card: CardInstance): boolean {
  return card.effectTrigger === EffectTrigger.ON_SCORE
}

/**
 * Check if a card has an on-tame effect
 * @param card Card to check
 * @returns true if card has ON_TAME effect
 */
export function hasOnTameEffect(card: CardInstance): boolean {
  return card.effectTrigger === EffectTrigger.ON_TAME
}

/**
 * Check if a card has a permanent effect
 * @param card Card to check
 * @returns true if card has PERMANENT effect
 */
export function hasPermanentEffect(card: CardInstance): boolean {
  return card.effectTrigger === EffectTrigger.PERMANENT
}

/**
 * Get effect description for display
 * @param card Card to get description for
 * @param useChinese Whether to use Chinese description
 * @returns Effect description string
 */
export function getEffectDescription(
  card: CardInstance,
  useChinese: boolean = true
): string {
  if (card.effectType === EffectType.NONE) {
    return ''
  }

  return useChinese ? card.effectDescriptionTw : card.effectDescription
}

/**
 * Get effect type display name
 * @param effectType Effect type
 * @param useChinese Whether to use Chinese
 * @returns Display name
 */
export function getEffectTypeName(
  effectType: EffectType,
  useChinese: boolean = true
): string {
  const names: Record<EffectType, { en: string; tw: string }> = {
    [EffectType.NONE]: { en: 'None', tw: '無' },
    [EffectType.GAIN_STONES]: { en: 'Gain Stones', tw: '獲得石頭' },
    [EffectType.INCREASE_STONE_LIMIT]: { en: 'Increase Limit', tw: '增加上限' },
    [EffectType.SCORE_PER_ELEMENT]: { en: 'Element Synergy', tw: '元素加成' },
    [EffectType.SCORE_PER_DRAGON]: { en: 'Dragon Synergy', tw: '龍族加成' },
    [EffectType.DRAW_FROM_DISCARD]: { en: 'Recover Card', tw: '回收卡片' },
    [EffectType.DRAW_FROM_DECK]: { en: 'Draw Cards', tw: '抽牌' },
    [EffectType.RETURN_TO_HAND]: { en: 'Return Card', tw: '送回手牌' },
    [EffectType.OPPONENT_DISCARD]: { en: 'Force Discard', tw: '強制棄牌' },
    [EffectType.STEAL_STONES]: { en: 'Steal Stones', tw: '偷取石頭' },
    [EffectType.COPY_ABILITY]: { en: 'Copy Ability', tw: '複製能力' },
    [EffectType.SCORE_PER_CARD]: { en: 'Card Synergy', tw: '卡片加成' },
    [EffectType.CONDITIONAL_SCORE]: { en: 'Conditional', tw: '條件加成' },
    [EffectType.REDUCE_COST]: { en: 'Cost Reduction', tw: '降低費用' },
    [EffectType.PEEK_DECK]: { en: 'Peek Deck', tw: '查看牌庫' },
    [EffectType.SWAP_CARD]: { en: 'Swap Card', tw: '交換卡片' },
    [EffectType.SCORE_PER_OPPONENT]: { en: 'Opponent Cards', tw: '對手卡片' },
    [EffectType.PROTECTION]: { en: 'Protection', tw: '保護' },
    [EffectType.SCORE_PER_UNIQUE_ELEMENT]: { en: 'Element Diversity', tw: '元素多樣性' },
    [EffectType.SCORE_PER_HAND]: { en: 'Hand Bonus', tw: '手牌加成' },
    [EffectType.CHAIN_EFFECT]: { en: 'Chain Effect', tw: '連鎖效果' },
  }

  return useChinese ? names[effectType].tw : names[effectType].en
}

/**
 * Get effect trigger display name
 * @param trigger Effect trigger
 * @param useChinese Whether to use Chinese
 * @returns Display name
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
