/**
 * Effect Implementation Status Checker
 * Tracks which card effects have been implemented in the game
 * @version 1.2.0 - Only lightning effects (EARN_STONES, DRAW_CARD) marked as implemented
 */
console.log('[utils/effect-implementation-status.ts] v1.2.0 loaded')

import type { CardInstance } from '@/types/cards'
import { EffectType } from '@/types/cards'

// ============================================
// IMPLEMENTATION STATUS DEFINITIONS
// ============================================

/**
 * Fully implemented effects - ONLY lightning effects (閃電效果)
 * These are instant effects that trigger automatically
 * Manual review in progress - effects will be added one by one after verification
 */
export const FULLY_IMPLEMENTED_EFFECTS: readonly EffectType[] = [
  // ALL EFFECTS TEMPORARILY MARKED AS NOT IMPLEMENTED FOR MANUAL REVIEW
] as const

/**
 * Partially implemented effects - basic functionality works but may have limitations
 * Currently EMPTY - all non-lightning effects are treated as NOT_IMPLEMENTED
 */
export const PARTIALLY_IMPLEMENTED_EFFECTS: readonly EffectType[] = [
  // All moved to NOT_IMPLEMENTED for manual review
] as const

/**
 * Effects that don't require implementation (no effect)
 */
export const NO_IMPLEMENTATION_NEEDED: readonly EffectType[] = [
  EffectType.NONE,
] as const

// ============================================
// IMPLEMENTATION STATUS ENUM
// ============================================

/**
 * Implementation status for an effect or card
 */
export enum ImplementationStatus {
  /** All effects are fully implemented */
  FULLY_IMPLEMENTED = 'FULLY_IMPLEMENTED',
  /** Some effects are partially implemented */
  PARTIALLY_IMPLEMENTED = 'PARTIALLY_IMPLEMENTED',
  /** Has effects that are not implemented */
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  /** Card has no effects or only NONE effects */
  NO_EFFECTS = 'NO_EFFECTS',
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a single effect type is fully implemented
 */
export function isEffectFullyImplemented(effectType: EffectType): boolean {
  return FULLY_IMPLEMENTED_EFFECTS.includes(effectType)
}

/**
 * Check if a single effect type is partially implemented
 */
export function isEffectPartiallyImplemented(effectType: EffectType): boolean {
  return PARTIALLY_IMPLEMENTED_EFFECTS.includes(effectType)
}

/**
 * Check if a single effect type requires no implementation
 */
export function isEffectNoImplementationNeeded(effectType: EffectType): boolean {
  return NO_IMPLEMENTATION_NEEDED.includes(effectType)
}

/**
 * Get the implementation status of a single effect
 */
export function getEffectImplementationStatus(effectType: EffectType): ImplementationStatus {
  if (isEffectNoImplementationNeeded(effectType)) {
    return ImplementationStatus.NO_EFFECTS
  }
  if (isEffectFullyImplemented(effectType)) {
    return ImplementationStatus.FULLY_IMPLEMENTED
  }
  if (isEffectPartiallyImplemented(effectType)) {
    return ImplementationStatus.PARTIALLY_IMPLEMENTED
  }
  return ImplementationStatus.NOT_IMPLEMENTED
}

// ============================================
// CARD-LEVEL FUNCTIONS
// ============================================

/**
 * Get the implementation status of all effects on a card
 * Returns the "worst" status among all effects
 */
export function getCardImplementationStatus(card: CardInstance): ImplementationStatus {
  const effects = card.effects

  // No effects or empty effects array
  if (!effects || effects.length === 0) {
    // Check legacy effectType
    if (card.effectType && card.effectType !== EffectType.NONE) {
      return getEffectImplementationStatus(card.effectType)
    }
    return ImplementationStatus.NO_EFFECTS
  }

  // Filter out NONE effects
  const meaningfulEffects = effects.filter(e => e.type !== EffectType.NONE)

  if (meaningfulEffects.length === 0) {
    return ImplementationStatus.NO_EFFECTS
  }

  // Check each effect and return the worst status
  let hasPartial = false
  let hasNotImplemented = false

  for (const effect of meaningfulEffects) {
    const status = getEffectImplementationStatus(effect.type)

    if (status === ImplementationStatus.NOT_IMPLEMENTED) {
      hasNotImplemented = true
    } else if (status === ImplementationStatus.PARTIALLY_IMPLEMENTED) {
      hasPartial = true
    }
  }

  // Return worst status
  if (hasNotImplemented) {
    return ImplementationStatus.NOT_IMPLEMENTED
  }
  if (hasPartial) {
    return ImplementationStatus.PARTIALLY_IMPLEMENTED
  }

  return ImplementationStatus.FULLY_IMPLEMENTED
}

/**
 * Check if a card has any unimplemented effects
 */
export function hasUnimplementedEffects(card: CardInstance): boolean {
  const status = getCardImplementationStatus(card)
  return status === ImplementationStatus.NOT_IMPLEMENTED
}

/**
 * Check if a card has any partially implemented effects
 */
export function hasPartiallyImplementedEffects(card: CardInstance): boolean {
  const status = getCardImplementationStatus(card)
  return status === ImplementationStatus.PARTIALLY_IMPLEMENTED
}

/**
 * Get a list of unimplemented effect types on a card
 */
export function getUnimplementedEffectTypes(card: CardInstance): EffectType[] {
  const unimplemented: EffectType[] = []

  for (const effect of card.effects) {
    if (effect.type !== EffectType.NONE) {
      const status = getEffectImplementationStatus(effect.type)
      if (status === ImplementationStatus.NOT_IMPLEMENTED) {
        if (!unimplemented.includes(effect.type)) {
          unimplemented.push(effect.type)
        }
      }
    }
  }

  // Check legacy effectType
  if (card.effectType && card.effectType !== EffectType.NONE) {
    const status = getEffectImplementationStatus(card.effectType)
    if (status === ImplementationStatus.NOT_IMPLEMENTED) {
      if (!unimplemented.includes(card.effectType)) {
        unimplemented.push(card.effectType)
      }
    }
  }

  return unimplemented
}

/**
 * Get a list of partially implemented effect types on a card
 */
export function getPartiallyImplementedEffectTypes(card: CardInstance): EffectType[] {
  const partial: EffectType[] = []

  for (const effect of card.effects) {
    if (effect.type !== EffectType.NONE) {
      const status = getEffectImplementationStatus(effect.type)
      if (status === ImplementationStatus.PARTIALLY_IMPLEMENTED) {
        if (!partial.includes(effect.type)) {
          partial.push(effect.type)
        }
      }
    }
  }

  // Check legacy effectType
  if (card.effectType && card.effectType !== EffectType.NONE) {
    const status = getEffectImplementationStatus(card.effectType)
    if (status === ImplementationStatus.PARTIALLY_IMPLEMENTED) {
      if (!partial.includes(card.effectType)) {
        partial.push(card.effectType)
      }
    }
  }

  return partial
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Badge position on the card
 */
export type BadgePosition = 'top-right' | 'bottom-right'

/**
 * Badge type for different display styles
 */
export type BadgeType = 'text' | 'star'

export interface ImplementationStatusDisplay {
  /** Whether to show the status badge */
  show: boolean
  /** Badge type: 'text' for warning labels, 'star' for implemented indicator */
  type: BadgeType
  /** Badge text (for text type) */
  text: string
  /** Badge color class (Tailwind) */
  colorClass: string
  /** Tooltip text */
  tooltip: string
  /** Position on the card */
  position: BadgePosition
}

/**
 * Get display information for the implementation status badge
 */
export function getImplementationStatusDisplay(card: CardInstance): ImplementationStatusDisplay {
  const status = getCardImplementationStatus(card)

  switch (status) {
    case ImplementationStatus.FULLY_IMPLEMENTED:
      // Show golden star for fully implemented effects
      return {
        show: true,
        type: 'star',
        text: '★',
        colorClass: 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]',
        tooltip: '效果已實現，會自動執行',
        position: 'bottom-right',
      }

    case ImplementationStatus.NO_EFFECTS:
      // No badge for cards without effects
      return {
        show: false,
        type: 'text',
        text: '',
        colorClass: '',
        tooltip: '',
        position: 'top-right',
      }

    case ImplementationStatus.PARTIALLY_IMPLEMENTED:
      const partialTypes = getPartiallyImplementedEffectTypes(card)
      return {
        show: true,
        type: 'text',
        text: '部分',
        colorClass: 'bg-yellow-500/80 text-yellow-100',
        tooltip: `部分實現: ${partialTypes.join(', ')}`,
        position: 'top-right',
      }

    case ImplementationStatus.NOT_IMPLEMENTED:
      const unimplTypes = getUnimplementedEffectTypes(card)
      return {
        show: true,
        type: 'text',
        text: '未實現',
        colorClass: 'bg-red-500/80 text-red-100',
        tooltip: `未實現: ${unimplTypes.join(', ')}`,
        position: 'top-right',
      }

    default:
      return {
        show: false,
        type: 'text',
        text: '',
        colorClass: '',
        tooltip: '',
        position: 'top-right',
      }
  }
}
