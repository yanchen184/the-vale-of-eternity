/**
 * Player Color Types and Constants
 * Defines the color system for multiplayer game player markers
 * @version 1.0.0
 */
console.log('[types/player-color.ts] v1.0.0 loaded')

// ============================================
// TYPES
// ============================================

/**
 * Available player colors
 */
export type PlayerColor = 'green' | 'red' | 'purple' | 'black'

/**
 * Color configuration for UI styling
 */
export interface PlayerColorConfig {
  /** Background color class */
  bg: string
  /** Border color class */
  border: string
  /** Text color class */
  text: string
  /** Hex color value */
  hex: string
  /** Ring/glow color class */
  ring: string
  /** Shadow color */
  shadow: string
  /** Display name in Chinese */
  nameTw: string
  /** Display name in English */
  nameEn: string
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Player color configurations
 * Used for styling player markers and UI elements
 */
export const PLAYER_COLORS: Record<PlayerColor, PlayerColorConfig> = {
  green: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-500',
    text: 'text-emerald-500',
    hex: '#10b981',
    ring: 'ring-emerald-500',
    shadow: 'shadow-emerald-500/50',
    nameTw: '綠色',
    nameEn: 'Green',
  },
  red: {
    bg: 'bg-red-500',
    border: 'border-red-500',
    text: 'text-red-500',
    hex: '#ef4444',
    ring: 'ring-red-500',
    shadow: 'shadow-red-500/50',
    nameTw: '紅色',
    nameEn: 'Red',
  },
  purple: {
    bg: 'bg-purple-500',
    border: 'border-purple-500',
    text: 'text-purple-500',
    hex: '#a855f7',
    ring: 'ring-purple-500',
    shadow: 'shadow-purple-500/50',
    nameTw: '紫色',
    nameEn: 'Purple',
  },
  black: {
    bg: 'bg-slate-800',
    border: 'border-slate-800',
    text: 'text-slate-800',
    hex: '#1e293b',
    ring: 'ring-slate-800',
    shadow: 'shadow-slate-800/50',
    nameTw: '黑色',
    nameEn: 'Black',
  },
}

/**
 * Default color assignment order
 * First player gets green, second gets red, etc.
 */
export const DEFAULT_COLOR_ORDER: PlayerColor[] = ['green', 'red', 'purple', 'black']

/**
 * Get color by player index
 * @param index Player index (0-3)
 * @returns Player color
 */
export function getColorByIndex(index: number): PlayerColor {
  return DEFAULT_COLOR_ORDER[index % DEFAULT_COLOR_ORDER.length]
}

/**
 * Get available colors (excluding those already taken)
 * @param takenColors Colors already assigned to other players
 * @returns Array of available colors
 */
export function getAvailableColors(takenColors: PlayerColor[]): PlayerColor[] {
  return DEFAULT_COLOR_ORDER.filter(color => !takenColors.includes(color))
}

/**
 * Check if a color is available
 * @param color Color to check
 * @param takenColors Colors already assigned
 * @returns true if color is available
 */
export function isColorAvailable(color: PlayerColor, takenColors: PlayerColor[]): boolean {
  return !takenColors.includes(color)
}
