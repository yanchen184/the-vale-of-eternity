/**
 * Cards Module Index
 * Central export point for all card implementations
 * @version 1.0.0
 */
console.log('[cards/index.ts] v1.0.0 loaded')

// ============================================
// CARD IMPORTS
// ============================================

export { HESTIA_CARD, HestiaEffect } from './F001-Hestia'

// ============================================
// CARD REGISTRY
// ============================================

import { HESTIA_CARD } from './F001-Hestia'
import type { CardTemplate } from '@/types/cards'

/**
 * All implemented cards
 * Add new cards here as they are implemented
 */
export const IMPLEMENTED_CARDS: readonly CardTemplate[] = [
  HESTIA_CARD,
  // Add more cards here...
] as const

/**
 * Get a card by ID
 */
export function getCardById(id: string): CardTemplate | undefined {
  return IMPLEMENTED_CARDS.find((card) => card.id === id)
}

/**
 * Get cards by element
 */
export function getCardsByElement(element: string): CardTemplate[] {
  return IMPLEMENTED_CARDS.filter((card) => card.element === element)
}

/**
 * Get all card IDs
 */
export function getAllCardIds(): string[] {
  return IMPLEMENTED_CARDS.map((card) => card.id)
}

/**
 * Card implementation statistics
 */
export function getCardStats() {
  return {
    total: IMPLEMENTED_CARDS.length,
    byElement: {
      FIRE: IMPLEMENTED_CARDS.filter((c) => c.element === 'FIRE').length,
      WATER: IMPLEMENTED_CARDS.filter((c) => c.element === 'WATER').length,
      EARTH: IMPLEMENTED_CARDS.filter((c) => c.element === 'EARTH').length,
      WIND: IMPLEMENTED_CARDS.filter((c) => c.element === 'WIND').length,
      DRAGON: IMPLEMENTED_CARDS.filter((c) => c.element === 'DRAGON').length,
    },
  }
}

console.log('[cards/index.ts] Loaded cards:', getCardStats())
