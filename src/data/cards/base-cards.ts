/**
 * Base Game Cards - All 70 Cards
 * Combines all element families
 * @version 3.0.0
 */
console.log('[data/cards/base-cards.ts] v3.0.0 loaded')

import {
  type CardTemplate,
  type CardInstance,
  type CardEffect,
  Element,
  CardLocation,
  EffectType,
  EffectTrigger,
} from '@/types/cards'

// Import all element families
import { FIRE_CARDS } from './fire-cards'
import { WATER_CARDS } from './water-cards'
import { EARTH_CARDS } from './earth-cards'
import { WIND_CARDS } from './wind-cards'
import { DRAGON_CARDS } from './dragon-cards'

// ============================================
// COMBINED BASE CARDS
// ============================================

/**
 * All 70 base game card templates
 * Distribution:
 * - Fire: 15 cards
 * - Water: 15 cards
 * - Earth: 16 cards
 * - Wind: 14 cards
 * - Dragon: 10 cards
 * Total: 70 cards
 */
export const BASE_CARDS: readonly CardTemplate[] = [
  ...FIRE_CARDS,
  ...WATER_CARDS,
  ...EARTH_CARDS,
  ...WIND_CARDS,
  ...DRAGON_CARDS,
] as const

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a card template by ID
 * @param id Card ID (e.g., 'F001', 'W002')
 * @returns CardTemplate or undefined if not found
 */
export function getCardById(id: string): CardTemplate | undefined {
  return BASE_CARDS.find(card => card.id === id)
}

/**
 * Get a card template by name
 * @param name Card name (e.g., 'Hestia', 'Dragon Egg')
 * @returns CardTemplate or undefined if not found
 */
export function getCardByName(name: string): CardTemplate | undefined {
  const lowerName = name.toLowerCase()
  return BASE_CARDS.find(card => card.name.toLowerCase() === lowerName)
}

/**
 * Get all cards of a specific element
 * @param element Element type
 * @returns Array of card templates
 */
export function getCardsByElement(element: Element): CardTemplate[] {
  return BASE_CARDS.filter(card => card.element === element)
}

/**
 * Get all cards with a specific cost
 * @param cost Card cost
 * @returns Array of card templates
 */
export function getCardsByCost(cost: number): CardTemplate[] {
  return BASE_CARDS.filter(card => card.cost === cost)
}

/**
 * Extract legacy effect fields from effects array for backward compatibility
 * @param effects Effects array from CardTemplate
 * @returns Legacy effect fields
 */
function extractLegacyEffectFields(effects: readonly CardEffect[]): {
  effectType: EffectType
  effectTrigger: EffectTrigger
  effectValue?: number
  effectTarget?: Element
  effectDescription: string
  effectDescriptionTw: string
} {
  // Use first effect for legacy fields, or defaults if no effects
  if (effects.length === 0) {
    return {
      effectType: EffectType.NONE,
      effectTrigger: EffectTrigger.NONE,
      effectDescription: 'No effect.',
      effectDescriptionTw: '無效果。',
    }
  }

  const primaryEffect = effects[0]

  // Combine all effect descriptions for legacy fields
  const effectDescription = effects.map(e => e.description).join(' ')
  const effectDescriptionTw = effects.map(e => e.descriptionTw).join(' ')

  return {
    effectType: primaryEffect.type,
    effectTrigger: primaryEffect.trigger,
    effectValue: primaryEffect.value,
    effectTarget: primaryEffect.targetElement,
    effectDescription,
    effectDescriptionTw,
  }
}

/**
 * Create a card instance from a template
 * Supports both new effects array format and legacy format for backward compatibility
 * @param template Card template
 * @param instanceIndex Instance index (0 or 1)
 * @returns CardInstance
 */
export function createCardInstance(
  template: CardTemplate,
  instanceIndex: number
): CardInstance {
  // Prefer new effects array format
  if (template.effects && template.effects.length > 0) {
    const legacyFields = extractLegacyEffectFields(template.effects)

    return {
      instanceId: `${template.id}-${instanceIndex}`,
      cardId: template.id,
      name: template.name,
      nameTw: template.nameTw,
      element: template.element,
      cost: template.cost,
      baseScore: template.baseScore,
      effects: template.effects,
      // Legacy fields for backward compatibility
      effectType: legacyFields.effectType,
      effectTrigger: legacyFields.effectTrigger,
      effectValue: legacyFields.effectValue,
      effectTarget: legacyFields.effectTarget,
      effectDescription: legacyFields.effectDescription,
      effectDescriptionTw: legacyFields.effectDescriptionTw,
      // Runtime state
      ownerId: null,
      location: CardLocation.DECK,
      isRevealed: false,
      scoreModifier: 0,
      hasUsedAbility: false,
    }
  }

  // Fallback to legacy format for old card definitions
  // Convert legacy fields to effects array
  const legacyEffects: CardEffect[] = []
  if (template.effectType && template.effectType !== EffectType.NONE) {
    legacyEffects.push({
      type: template.effectType,
      trigger: template.effectTrigger ?? EffectTrigger.NONE,
      value: template.effectValue,
      targetElement: template.effectTarget,
      description: template.effectDescription ?? '',
      descriptionTw: template.effectDescriptionTw ?? '',
    })
  }

  return {
    instanceId: `${template.id}-${instanceIndex}`,
    cardId: template.id,
    name: template.name,
    nameTw: template.nameTw,
    element: template.element,
    cost: template.cost,
    baseScore: template.baseScore,
    effects: legacyEffects,
    // Legacy fields
    effectType: template.effectType ?? EffectType.NONE,
    effectTrigger: template.effectTrigger ?? EffectTrigger.NONE,
    effectValue: template.effectValue,
    effectTarget: template.effectTarget,
    effectDescription: template.effectDescription ?? '',
    effectDescriptionTw: template.effectDescriptionTw ?? '',
    // Runtime state
    ownerId: null,
    location: CardLocation.DECK,
    isRevealed: false,
    scoreModifier: 0,
    hasUsedAbility: false,
  }
}

/**
 * Build a full deck (70 cards x 2 copies = 140 cards)
 * @returns Array of 140 card instances
 */
export function buildFullDeck(): CardInstance[] {
  const deck: CardInstance[] = []

  for (const template of BASE_CARDS) {
    // Create 2 copies of each card
    deck.push(createCardInstance(template, 0))
    deck.push(createCardInstance(template, 1))
  }

  return deck
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param array Array to shuffle
 * @returns New shuffled array
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Build and shuffle a deck for a new game
 * @returns Shuffled array of 140 card instances
 */
export function buildShuffledDeck(): CardInstance[] {
  return shuffleArray(buildFullDeck())
}

/**
 * Get all cards - alias for BASE_CARDS
 * @returns All base card templates
 */
export function getAllCards(): readonly CardTemplate[] {
  return BASE_CARDS
}

/**
 * Get card count by element
 * @returns Object with element counts
 */
export function getCardCountByElement(): Record<Element, number> {
  return {
    [Element.FIRE]: FIRE_CARDS.length,
    [Element.WATER]: WATER_CARDS.length,
    [Element.EARTH]: EARTH_CARDS.length,
    [Element.WIND]: WIND_CARDS.length,
    [Element.DRAGON]: DRAGON_CARDS.length,
  }
}

/**
 * Verify card data integrity
 * @returns Object with validation results
 */
export function validateCardData(): {
  isValid: boolean
  totalCards: number
  uniqueIds: number
  duplicateIds: string[]
  elementCounts: Record<Element, number>
  cardsWithEffects: number
  cardsWithoutEffects: number
} {
  const ids = BASE_CARDS.map(card => card.id)
  const uniqueIds = new Set(ids)
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)

  const cardsWithEffects = BASE_CARDS.filter(
    card => card.effects && card.effects.length > 0
  ).length
  const cardsWithoutEffects = BASE_CARDS.length - cardsWithEffects

  return {
    isValid: uniqueIds.size === BASE_CARDS.length && BASE_CARDS.length === 70,
    totalCards: BASE_CARDS.length,
    uniqueIds: uniqueIds.size,
    duplicateIds,
    elementCounts: getCardCountByElement(),
    cardsWithEffects,
    cardsWithoutEffects,
  }
}

/**
 * Get cards by effect type
 * @param effectType Effect type to filter by
 * @returns Array of card templates with the specified effect type
 */
export function getCardsByEffectType(effectType: EffectType): CardTemplate[] {
  return BASE_CARDS.filter(card =>
    card.effects.some(effect => effect.type === effectType)
  )
}

/**
 * Get cards by effect trigger
 * @param trigger Effect trigger to filter by
 * @returns Array of card templates with the specified trigger
 */
export function getCardsByEffectTrigger(
  trigger: EffectTrigger
): CardTemplate[] {
  return BASE_CARDS.filter(card =>
    card.effects.some(effect => effect.trigger === trigger)
  )
}

// ============================================
// RE-EXPORTS
// ============================================

export {
  FIRE_CARDS,
  WATER_CARDS,
  EARTH_CARDS,
  WIND_CARDS,
  DRAGON_CARDS,
}
