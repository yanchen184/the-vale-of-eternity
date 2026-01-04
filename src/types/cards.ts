/**
 * Card type definitions for Full Game v3.0.0
 * Complete 70 cards with Stone Economy System
 * @version 3.0.0
 */
console.log('[types/cards.ts] v3.0.0 loaded')

// ============================================
// ENUMS
// ============================================

/**
 * Element types in the game (5 elements)
 */
export enum Element {
  FIRE = 'FIRE',
  WATER = 'WATER',
  EARTH = 'EARTH',
  WIND = 'WIND',
  DRAGON = 'DRAGON',
}

/**
 * Stone types in the game (Stone Economy System)
 */
export enum StoneType {
  /** 1-point stone */
  ONE = 'ONE',
  /** 3-point stone */
  THREE = 'THREE',
  /** 6-point stone */
  SIX = 'SIX',
  /** Water element stone */
  WATER = 'WATER',
  /** Fire element stone */
  FIRE = 'FIRE',
  /** Earth element stone */
  EARTH = 'EARTH',
  /** Wind element stone */
  WIND = 'WIND',
}

/**
 * Effect types for all 70 cards (Stone Economy System)
 */
export enum EffectType {
  /** No effect - card only provides base score */
  NONE = 'NONE',

  // Stone Operations
  /** Earn stones (1, 3, 6, or element stones) */
  EARN_STONES = 'EARN_STONES',
  /** Discard stones */
  DISCARD_STONES = 'DISCARD_STONES',
  /** Exchange stones between types */
  EXCHANGE_STONES = 'EXCHANGE_STONES',
  /** Increase stone value permanently */
  INCREASE_STONE_VALUE = 'INCREASE_STONE_VALUE',
  /** Increase stone limit permanently */
  INCREASE_STONE_LIMIT = 'INCREASE_STONE_LIMIT',
  /** Steal stones from opponent */
  STEAL_STONES = 'STEAL_STONES',

  // Card Operations
  /** Draw card(s) */
  DRAW_CARD = 'DRAW_CARD',
  /** Discard card from hand */
  DISCARD_FROM_HAND = 'DISCARD_FROM_HAND',
  /** Recover card from discard pile to hand */
  RECOVER_CARD = 'RECOVER_CARD',
  /** Free summon (discard this, summon another for free) */
  FREE_SUMMON = 'FREE_SUMMON',
  /** Return card to hand or deck */
  RETURN_CARD = 'RETURN_CARD',
  /** Opponent discards card(s) */
  OPPONENT_DISCARD = 'OPPONENT_DISCARD',

  // Cost Modification
  /** Reduce cost of cards */
  REDUCE_COST = 'REDUCE_COST',
  /** Decrease cost by value */
  DECREASE_COST = 'DECREASE_COST',

  // Effect Activation
  /** Activate all permanent effects */
  ACTIVATE_ALL_PERMANENT = 'ACTIVATE_ALL_PERMANENT',
  /** Copy another card's instant effect */
  COPY_INSTANT_EFFECT = 'COPY_INSTANT_EFFECT',

  // Conditional Effects
  /** Earn stones based on condition */
  CONDITIONAL_EARN = 'CONDITIONAL_EARN',
  /** Effect based on cards in area */
  CONDITIONAL_AREA = 'CONDITIONAL_AREA',
  /** Effect based on hand size */
  CONDITIONAL_HAND = 'CONDITIONAL_HAND',

  // Scoring Effects
  /** Earn stones per element card */
  EARN_PER_ELEMENT = 'EARN_PER_ELEMENT',
  /** Earn stones per card family */
  EARN_PER_FAMILY = 'EARN_PER_FAMILY',
  /** Earn stones when summoning */
  EARN_ON_SUMMON = 'EARN_ON_SUMMON',

  // Special Effects
  /** Discard all stones and earn points */
  DISCARD_ALL_FOR_POINTS = 'DISCARD_ALL_FOR_POINTS',
  /** Multiple choice effect */
  MULTI_CHOICE = 'MULTI_CHOICE',
  /** Protection from effects */
  PROTECTION = 'PROTECTION',
  /** Put card on top of deck */
  PUT_ON_DECK_TOP = 'PUT_ON_DECK_TOP',
}

/**
 * Effect trigger timing
 */
export enum EffectTrigger {
  /** No trigger */
  NONE = 'NONE',
  /** Triggered when card is tamed */
  ON_TAME = 'ON_TAME',
  /** Always active while on field */
  PERMANENT = 'PERMANENT',
  /** Calculated during score phase */
  ON_SCORE = 'ON_SCORE',
}

/**
 * Card location in game
 */
export enum CardLocation {
  DECK = 'DECK',
  MARKET = 'MARKET',
  HAND = 'HAND',
  FIELD = 'FIELD',
  DISCARD = 'DISCARD',
  SANCTUARY = 'SANCTUARY',
}

// ============================================
// INTERFACES
// ============================================

/**
 * Stone configuration for card effects
 */
export interface StoneConfig {
  /** Type of stone */
  type: StoneType
  /** Amount of stones */
  amount: number
}

/**
 * Card effect configuration (supports multiple effects)
 */
export interface CardEffect {
  /** Effect type */
  type: EffectType
  /** Effect trigger timing */
  trigger: EffectTrigger
  /** Stones to earn/discard */
  stones?: StoneConfig[]
  /** Target element (for element-specific effects) */
  targetElement?: Element
  /** Numerical value (for counters, limits, etc.) */
  value?: number
  /** Effect description in English */
  description: string
  /** Effect description in Traditional Chinese */
  descriptionTw: string
  /** Whether this effect is fully implemented (default: false) */
  isImplemented?: boolean
}

/**
 * Card template definition (blueprint for cards)
 * Used to define the static properties of each card type
 */
export interface CardTemplate {
  /** Unique card identifier (e.g., 'F001', 'W002') */
  readonly id: string
  /** English name */
  readonly name: string
  /** Traditional Chinese name */
  readonly nameTw: string
  /** Element type */
  readonly element: Element
  /** Card cost (0-12) */
  readonly cost: number
  /** Base score value */
  readonly baseScore: number
  /** Card effects (can have multiple) */
  readonly effects: readonly CardEffect[]
  /** Flavor text in English */
  readonly flavorText?: string
  /** Flavor text in Traditional Chinese */
  readonly flavorTextTw?: string
  /** Card image URL */
  readonly imageUrl?: string

  // Legacy fields for backward compatibility (deprecated)
  /** @deprecated Use effects array instead */
  readonly effectType?: EffectType
  /** @deprecated Use effects array instead */
  readonly effectTrigger?: EffectTrigger
  /** @deprecated Use effects array instead */
  readonly effectValue?: number
  /** @deprecated Use effects array instead */
  readonly effectTarget?: Element
  /** @deprecated Use effects array instead */
  readonly effectDescription?: string
  /** @deprecated Use effects array instead */
  readonly effectDescriptionTw?: string
}

/**
 * Card instance in game (actual card during gameplay)
 * Extends template with runtime state
 */
export interface CardInstance {
  /** Unique instance ID (e.g., 'F001-0', 'F001-1') */
  readonly instanceId: string
  /** Reference to card template ID */
  readonly cardId: string
  /** English name (copied from template) */
  readonly name: string
  /** Traditional Chinese name (copied from template) */
  readonly nameTw: string
  /** Element type (copied from template) */
  readonly element: Element
  /** Card cost (copied from template) */
  readonly cost: number
  /** Base score (copied from template) */
  readonly baseScore: number
  /** Card effects array (copied from template) */
  readonly effects: readonly CardEffect[]
  /** Owner player ID (null if not owned) */
  ownerId: string | null
  /** Current location in game */
  location: CardLocation
  /** Whether card is face-up/revealed */
  isRevealed: boolean
  /** Score modifier from effects */
  scoreModifier: number
  /** Whether ability has been used this round */
  hasUsedAbility: boolean

  // Legacy fields for backward compatibility (deprecated)
  /** @deprecated Use effects array instead */
  readonly effectType?: EffectType
  /** @deprecated Use effects array instead */
  readonly effectTrigger?: EffectTrigger
  /** @deprecated Use effects array instead */
  readonly effectValue?: number
  /** @deprecated Use effects array instead */
  readonly effectTarget?: Element
  /** @deprecated Use effects array instead */
  readonly effectDescription?: string
  /** @deprecated Use effects array instead */
  readonly effectDescriptionTw?: string
}

/**
 * Effect result after processing an effect
 */
export interface EffectResult {
  /** Updated game state */
  stonesGained: number
  /** Cards drawn from effect */
  cardsDrawn: CardInstance[]
  /** Stones limit increase */
  stoneLimitIncrease: number
  /** Message describing what happened */
  message?: string
}

/**
 * Effect change tracking for applying effects
 */
export interface EffectChange {
  type: 'STONES' | 'STONE_LIMIT' | 'DRAW_DISCARD' | 'SCORE'
  value: number
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Element color configuration for UI
 */
export interface ElementColorConfig {
  primary: string
  secondary: string
  background: string
  border: string
  gradient: string
}

/**
 * Element colors for all elements
 */
export const ELEMENT_COLORS: Record<Element, ElementColorConfig> = {
  [Element.FIRE]: {
    primary: '#EF4444',
    secondary: '#FCA5A5',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '#DC2626',
    gradient: 'linear-gradient(135deg, #EF4444, #F97316)',
  },
  [Element.WATER]: {
    primary: '#3B82F6',
    secondary: '#93C5FD',
    background: 'rgba(59, 130, 246, 0.2)',
    border: '#2563EB',
    gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
  },
  [Element.EARTH]: {
    primary: '#84CC16',
    secondary: '#BEF264',
    background: 'rgba(132, 204, 22, 0.2)',
    border: '#65A30D',
    gradient: 'linear-gradient(135deg, #84CC16, #22C55E)',
  },
  [Element.WIND]: {
    primary: '#A855F7',
    secondary: '#D8B4FE',
    background: 'rgba(168, 85, 247, 0.2)',
    border: '#9333EA',
    gradient: 'linear-gradient(135deg, #A855F7, #EC4899)',
  },
  [Element.DRAGON]: {
    primary: '#F59E0B',
    secondary: '#FCD34D',
    background: 'rgba(245, 158, 11, 0.2)',
    border: '#D97706',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
  },
}

/**
 * Element emoji icons
 */
export const ELEMENT_ICONS: Record<Element, string> = {
  [Element.FIRE]: '\u{1F525}', // Fire emoji
  [Element.WATER]: '\u{1F4A7}', // Water drop emoji
  [Element.EARTH]: '\u{1F33F}', // Herb emoji
  [Element.WIND]: '\u{1F4A8}', // Dash emoji
  [Element.DRAGON]: '\u{1F409}', // Dragon emoji
}

/**
 * Element names in Traditional Chinese
 */
export const ELEMENT_NAMES_TW: Record<Element, string> = {
  [Element.FIRE]: '\u706B',
  [Element.WATER]: '\u6C34',
  [Element.EARTH]: '\u571F',
  [Element.WIND]: '\u98A8',
  [Element.DRAGON]: '\u9F8D',
}

/**
 * Stone icons for UI display
 */
export const STONE_ICONS: Record<StoneType, string> = {
  [StoneType.ONE]: '1️⃣',
  [StoneType.THREE]: '3️⃣',
  [StoneType.SIX]: '6️⃣',
  [StoneType.WATER]: '💧',
  [StoneType.FIRE]: '🔥',
  [StoneType.EARTH]: '🌳',
  [StoneType.WIND]: '🌸',
}

/**
 * Stone names in Traditional Chinese
 */
export const STONE_NAMES_TW: Record<StoneType, string> = {
  [StoneType.ONE]: '1點石頭',
  [StoneType.THREE]: '3點石頭',
  [StoneType.SIX]: '6點石頭',
  [StoneType.WATER]: '水石頭',
  [StoneType.FIRE]: '火石頭',
  [StoneType.EARTH]: '土石頭',
  [StoneType.WIND]: '風石頭',
}

/**
 * Effect trigger symbols
 */
export const EFFECT_TRIGGER_SYMBOLS = {
  INSTANT: '⚡',
  PERMANENT: '∞',
  SCORE: '⌛',
} as const
