/**
 * Effect Implementation Status Checker
 * Tracks which card effects have been implemented in the game
 * @version 1.0.0
 */
console.log('[utils/effect-implementation-status.ts] v1.0.0 loaded')

import type { CardInstance } from '@/types/cards'
import { EffectType } from '@/types/cards'

// ============================================
// IMPLEMENTATION STATUS DEFINITIONS
// ============================================

/**
 * Fully implemented effects - these work correctly in the game
 */
export const FULLY_IMPLEMENTED_EFFECTS: readonly EffectType[] = [
  EffectType.EARN_STONES,
  EffectType.DRAW_CARD,
  EffectType.CONDITIONAL_EARN,
] as const

/**
 * Partially implemented effects - basic functionality works but may have limitations
 */
export const PARTIALLY_IMPLEMENTED_EFFECTS: readonly EffectType[] = [
  EffectType.EXCHANGE_STONES,
  EffectType.DISCARD_FROM_HAND,
  EffectType.RECOVER_CARD,
  EffectType.FREE_SUMMON,
  EffectType.COPY_INSTANT_EFFECT,
  EffectType.INCREASE_STONE_VALUE, // permanent effect
  EffectType.DECREASE_COST, // permanent effect
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

export interface ImplementationStatusDisplay {
  /** Whether to show the status badge */
  show: boolean
  /** Badge text */
  text: string
  /** Badge color class (Tailwind) */
  colorClass: string
  /** Tooltip text */
  tooltip: string
}

/**
 * Get display information for the implementation status badge
 */
export function getImplementationStatusDisplay(card: CardInstance): ImplementationStatusDisplay {
  const status = getCardImplementationStatus(card)

  switch (status) {
    case ImplementationStatus.FULLY_IMPLEMENTED:
    case ImplementationStatus.NO_EFFECTS:
      return {
        show: false,
        text: '',
        colorClass: '',
        tooltip: '',
      }

    case ImplementationStatus.PARTIALLY_IMPLEMENTED:
      const partialTypes = getPartiallyImplementedEffectTypes(card)
      return {
        show: true,
        text: '部分',
        colorClass: 'bg-yellow-500/80 text-yellow-100',
        tooltip: `部分實現: ${partialTypes.join(', ')}`,
      }

    case ImplementationStatus.NOT_IMPLEMENTED:
      const unimplTypes = getUnimplementedEffectTypes(card)
      return {
        show: true,
        text: '未實現',
        colorClass: 'bg-red-500/80 text-red-100',
        tooltip: `未實現: ${unimplTypes.join(', ')}`,
      }

    default:
      return {
        show: false,
        text: '',
        colorClass: '',
        tooltip: '',
      }
  }
}
