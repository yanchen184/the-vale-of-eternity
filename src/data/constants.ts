/**
 * Game constants and configurations
 * @version 1.1.1
 */
console.log('[data/constants.ts] v1.1.1 loaded')

import { Element } from '@/types'

// ============================================
// LEGACY TYPES (for backward compatibility)
// ============================================

/**
 * Card rarity levels (legacy - not used in MVP)
 */
export enum Rarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY',
}

/**
 * Creature types (legacy - not used in MVP)
 */
export enum CreatureType {
  BEAST = 'BEAST',
  SPIRIT = 'SPIRIT',
  DRAGON = 'DRAGON',
  ELEMENTAL = 'ELEMENTAL',
  MYTHICAL = 'MYTHICAL',
}

/**
 * App version
 */
export const APP_VERSION = '1.1.1'

/**
 * Game configuration
 */
export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  STARTING_HAND_SIZE: 5,
  STARTING_GOLD: 0,
  MARKET_SIZE: 4,
  MAX_HAND_SIZE: 10,
  MAX_FIELD_SIZE: 12,
  TOTAL_ROUNDS: 4,
  TURN_TIME_LIMIT: 60, // seconds
  RECONNECT_TIMEOUT: 30, // seconds
} as const

/**
 * Card costs by rarity
 */
export const CARD_COSTS: Record<Rarity, number[]> = {
  [Rarity.COMMON]: [1, 2],
  [Rarity.UNCOMMON]: [2, 3, 4],
  [Rarity.RARE]: [4, 5, 6],
  [Rarity.LEGENDARY]: [6, 7, 8],
}

/**
 * Base points by rarity
 */
export const BASE_POINTS: Record<Rarity, number[]> = {
  [Rarity.COMMON]: [1, 2],
  [Rarity.UNCOMMON]: [2, 3, 4],
  [Rarity.RARE]: [4, 5, 6],
  [Rarity.LEGENDARY]: [7, 8, 9, 10],
}

/**
 * Element colors for UI (Tailwind classes)
 */
export const ELEMENT_COLORS_TW: Record<Element, { bg: string; text: string; border: string }> = {
  [Element.FIRE]: {
    bg: 'bg-fire/20',
    text: 'text-fire',
    border: 'border-fire',
  },
  [Element.WATER]: {
    bg: 'bg-water/20',
    text: 'text-water',
    border: 'border-water',
  },
  [Element.EARTH]: {
    bg: 'bg-earth/20',
    text: 'text-earth',
    border: 'border-earth',
  },
  [Element.WIND]: {
    bg: 'bg-wind/20',
    text: 'text-wind',
    border: 'border-wind',
  },
  [Element.DRAGON]: {
    bg: 'bg-dragon/20',
    text: 'text-dragon',
    border: 'border-dragon',
  },
}

/**
 * Element names in Traditional Chinese
 */
export const ELEMENT_NAMES_TW_CONST: Record<Element, string> = {
  [Element.FIRE]: '\u706B',
  [Element.WATER]: '\u6C34',
  [Element.EARTH]: '\u571F',
  [Element.WIND]: '\u98A8',
  [Element.DRAGON]: '\u9F8D',
}

/**
 * Rarity names in Traditional Chinese
 */
export const RARITY_NAMES_TW: Record<Rarity, string> = {
  [Rarity.COMMON]: '\u666E\u901A',
  [Rarity.UNCOMMON]: '\u7A00\u6709',
  [Rarity.RARE]: '\u7CBE\u826F',
  [Rarity.LEGENDARY]: '\u50B3\u5947',
}

/**
 * Creature type names in Traditional Chinese
 */
export const CREATURE_NAMES_TW: Record<CreatureType, string> = {
  [CreatureType.BEAST]: '\u91CE\u7378',
  [CreatureType.SPIRIT]: '\u7CBE\u9748',
  [CreatureType.DRAGON]: '\u9F8D\u65CF',
  [CreatureType.ELEMENTAL]: '\u5143\u7D20',
  [CreatureType.MYTHICAL]: '\u795E\u8A71',
}

/**
 * Rarity colors for UI
 */
export const RARITY_COLORS: Record<Rarity, { bg: string; text: string; glow: string }> = {
  [Rarity.COMMON]: {
    bg: 'bg-gray-500/20',
    text: 'text-gray-300',
    glow: 'shadow-gray-500/30',
  },
  [Rarity.UNCOMMON]: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    glow: 'shadow-green-500/30',
  },
  [Rarity.RARE]: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/30',
  },
  [Rarity.LEGENDARY]: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/30',
  },
}

/**
 * Firebase paths
 */
export const DB_PATHS = {
  GAMES: 'games',
  PLAYERS: 'players',
  USERS: 'users',
  ROOMS: 'rooms',
  LOBBIES: 'lobbies',
  STATS: 'stats',
} as const

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  USER_SETTINGS: 'vale-user-settings',
  LAST_ROOM_CODE: 'vale-last-room-code',
  PLAYER_NAME: 'vale-player-name',
  USER_ID: 'vale-user-id',
} as const

/**
 * Animation durations (ms)
 */
export const ANIMATION_DURATION = {
  CARD_FLIP: 600,
  CARD_DRAW: 400,
  CARD_PLAY: 300,
  MODAL_OPEN: 200,
  MODAL_CLOSE: 150,
  TOAST: 3000,
} as const
