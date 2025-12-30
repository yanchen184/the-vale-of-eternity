/**
 * Game utility functions for Single Player Mode v3.0.0
 * Based on GAME_FLOW.md specifications
 * @version 3.0.0
 */
console.log('[lib/game-utils.ts] v3.0.0 loaded')

import type { CardInstance } from '@/types/cards'
import { Element, EffectType, CardLocation } from '@/types/cards'

// ============================================
// COST CALCULATION
// ============================================

/**
 * Tame cost table based on card cost
 * Card Cost -> Tame Cost (stones required)
 */
const TAME_COST_TABLE: Record<number, number> = {
  0: 0,
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
}

/**
 * Calculate the tame cost (stones required) for a card
 * @param cardCost The cost value of the card (0-6)
 * @returns Number of stones required to tame
 */
export function calculateTameCost(cardCost: number): number {
  // Cap at 6 for higher costs
  const clampedCost = Math.min(Math.max(cardCost, 0), 6)
  return TAME_COST_TABLE[clampedCost] ?? 3
}

/**
 * Calculate the sell value (stones gained) for a card
 * Selling a card gives stones equal to its cost (capped by stone limit)
 * @param cardCost The cost value of the card
 * @param currentStones Player's current stones
 * @param stoneLimit Player's stone limit
 * @returns Number of stones that would be gained
 */
export function calculateSellValue(
  cardCost: number,
  currentStones: number,
  stoneLimit: number
): number {
  const maxGainable = stoneLimit - currentStones
  return Math.min(cardCost, maxGainable)
}

/**
 * Check if a player can afford to tame a card
 * @param cardCost The cost value of the card
 * @param playerStones Player's current stones
 * @returns true if player can afford the tame cost
 */
export function canAfford(cardCost: number, playerStones: number): boolean {
  const tameCost = calculateTameCost(cardCost)
  return playerStones >= tameCost
}

// ============================================
// SCORE CALCULATION
// ============================================

/**
 * Calculate the total score for a single card including effects
 * @param card The card to calculate score for
 * @param playerField All cards on the player's field
 * @returns Total score for this card
 */
export function calculateCardScore(
  card: CardInstance,
  playerField: readonly CardInstance[]
): number {
  let score = card.baseScore + card.scoreModifier

  // Use new effects array format
  for (const effect of card.effects) {
    if (effect.trigger === 'ON_SCORE') {
      switch (effect.type) {
        case EffectType.EARN_PER_ELEMENT:
          if (effect.targetElement) {
            const elementCount = playerField.filter(
              fieldCard => fieldCard.element === effect.targetElement
            ).length
            score += elementCount * (effect.value ?? 1)
          }
          break

        case EffectType.EARN_PER_FAMILY: {
          const dragonCount = playerField.filter(
            fieldCard => fieldCard.element === Element.DRAGON
          ).length
          score += dragonCount * (effect.value ?? 2)
          break
        }
      }
    }
  }

  // Legacy support
  switch (card.effectType) {
    case EffectType.EARN_PER_ELEMENT:
      if (card.effectTarget) {
        const elementCount = playerField.filter(
          fieldCard => fieldCard.element === card.effectTarget
        ).length
        score += elementCount * (card.effectValue ?? 1)
      }
      break

    case EffectType.EARN_PER_FAMILY: {
      const dragonCount = playerField.filter(
        fieldCard => fieldCard.element === Element.DRAGON
      ).length
      score += dragonCount * (card.effectValue ?? 2)
      break
    }

    default:
      // No scoring effect
      break
  }

  return score
}

/**
 * Calculate total score for all cards on a player's field
 * @param playerField All cards on the player's field
 * @returns Total score
 */
export function calculateTotalScore(
  playerField: readonly CardInstance[]
): number {
  return playerField.reduce(
    (total, card) => total + calculateCardScore(card, playerField),
    0
  )
}

/**
 * Calculate the effective stone limit for a player
 * Base limit is 3, increased by permanent effects
 * @param baseLimit Base stone limit (usually 3)
 * @param playerField Cards on the player's field
 * @returns Effective stone limit
 */
export function calculateStoneLimit(
  baseLimit: number,
  playerField: readonly CardInstance[]
): number {
  let limit = baseLimit

  for (const card of playerField) {
    if (card.effectType === EffectType.INCREASE_STONE_LIMIT) {
      limit += card.effectValue ?? 0
    }
  }

  return limit
}

// ============================================
// VALIDATION
// ============================================

/**
 * Action validation result
 */
export interface ValidationResult {
  valid: boolean
  error?: string
  errorCode?: string
}

/**
 * Validate if a tame action is legal
 * @param card Card to tame
 * @param playerStones Player's current stones
 * @param fieldSize Current number of cards on field
 * @param maxFieldSize Maximum field size (default 12)
 * @returns Validation result
 */
export function validateTameAction(
  card: CardInstance,
  playerStones: number,
  fieldSize: number,
  maxFieldSize: number = 12
): ValidationResult {
  // Check field capacity
  if (fieldSize >= maxFieldSize) {
    return {
      valid: false,
      error: 'Field is full (maximum 12 cards)',
      errorCode: 'ERR_FIELD_FULL',
    }
  }

  // Check stone cost
  const tameCost = calculateTameCost(card.cost)
  if (playerStones < tameCost) {
    return {
      valid: false,
      error: `Insufficient stones. Need ${tameCost}, have ${playerStones}`,
      errorCode: 'ERR_INSUFFICIENT_STONES',
    }
  }

  return { valid: true }
}

/**
 * Validate if a sell action is legal
 * @param card Card to sell
 * @param cardLocation Current location of the card
 * @returns Validation result
 */
export function validateSellAction(
  _card: CardInstance,
  cardLocation: CardLocation
): ValidationResult {
  if (cardLocation !== CardLocation.HAND) {
    return {
      valid: false,
      error: 'Can only sell cards from hand',
      errorCode: 'ERR_CARD_NOT_IN_HAND',
    }
  }

  return { valid: true }
}

/**
 * Validate if a market selection is legal
 * @param cardInstanceId Card instance ID to select from market
 * @param marketCards Current market cards
 * @returns Validation result
 */
export function validateMarketSelection(
  cardInstanceId: string,
  marketCards: readonly CardInstance[]
): ValidationResult {
  const inMarket = marketCards.some(c => c.instanceId === cardInstanceId)

  if (!inMarket) {
    return {
      valid: false,
      error: 'Card not in market',
      errorCode: 'ERR_CARD_NOT_IN_MARKET',
    }
  }

  return { valid: true }
}

// ============================================
// DECK UTILITIES
// ============================================

/**
 * Draw cards from the deck
 * @param deck Current deck
 * @param count Number of cards to draw
 * @returns Object with drawn cards and remaining deck
 */
export function drawCards(
  deck: readonly CardInstance[],
  count: number
): { drawn: CardInstance[]; remaining: CardInstance[] } {
  const drawn = deck.slice(0, count)
  const remaining = deck.slice(count)
  return { drawn, remaining }
}

/**
 * Refill market from deck to target size
 * @param market Current market cards
 * @param deck Current deck
 * @param targetSize Target market size (default 4)
 * @returns Object with new market and remaining deck
 */
export function refillMarket(
  market: readonly CardInstance[],
  deck: readonly CardInstance[],
  targetSize: number = 4
): { market: CardInstance[]; deck: CardInstance[] } {
  const needed = Math.max(0, targetSize - market.length)
  const { drawn, remaining } = drawCards(deck, needed)

  const newMarket = [
    ...market.map(c => ({ ...c, location: CardLocation.MARKET, isRevealed: true })),
    ...drawn.map(c => ({ ...c, location: CardLocation.MARKET, isRevealed: true })),
  ]

  return { market: newMarket, deck: remaining }
}

// ============================================
// PLAYER UTILITIES
// ============================================

/**
 * Generate a unique ID
 * @returns Unique string ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Compare two players for hunting order
 * Lower score goes first; if tied, use tiebreaker (last player index)
 * @param p1Score Player 1's score
 * @param p2Score Player 2's score
 * @param lastFirstPlayerIndex Index of last round's first player
 * @returns [firstPlayerIndex, secondPlayerIndex]
 */
export function determineHuntingOrder(
  p1Score: number,
  p2Score: number,
  lastFirstPlayerIndex: 0 | 1
): [0 | 1, 0 | 1] {
  if (p1Score < p2Score) {
    return [0, 1]
  } else if (p2Score < p1Score) {
    return [1, 0]
  } else {
    // Tied: opposite of last first player goes first
    return lastFirstPlayerIndex === 0 ? [1, 0] : [0, 1]
  }
}

// ============================================
// GAME CONSTANTS
// ============================================

/**
 * MVP Game constants
 */
export const MVP_CONSTANTS = {
  /** Starting stones for each player */
  STARTING_STONES: 0,
  /** Base stone limit before effects */
  BASE_STONE_LIMIT: 3,
  /** Stones gained at end of each round */
  STONES_PER_ROUND: 1,
  /** Maximum cards in hand */
  MAX_HAND_SIZE: 10,
  /** Maximum cards on field */
  MAX_FIELD_SIZE: 12,
  /** Number of cards in market */
  MARKET_SIZE: 4,
  /** Maximum number of rounds */
  MAX_ROUNDS: 10,
  /** Target score for victory */
  VICTORY_SCORE: 60,
  /** Copies of each card in deck */
  CARDS_PER_TYPE: 2,
  /** Total cards in MVP deck (20 types x 2 copies) */
  TOTAL_DECK_SIZE: 40,
} as const

export type MVPConstants = typeof MVP_CONSTANTS
