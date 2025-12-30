/**
 * Player type definitions
 * @version 1.0.0
 */
console.log('[types/player.ts] v1.0.0 loaded')

import type { CardInstance } from './cards'

/**
 * Player status enum
 */
export enum PlayerStatus {
  WAITING = 'WAITING',
  READY = 'READY',
  PLAYING = 'PLAYING',
  DISCONNECTED = 'DISCONNECTED',
  LEFT = 'LEFT',
}

/**
 * Player data
 */
export interface Player {
  id: string
  name: string
  avatarUrl?: string
  status: PlayerStatus
  isHost: boolean
  hand: CardInstance[]
  field: CardInstance[]
  gold: number
  score: number
  bonusPoints: number
  turnOrder: number
  isCurrentTurn: boolean
  lastActiveAt: number
  joinedAt: number
}

/**
 * Player stats (for profile/leaderboard)
 */
export interface PlayerStats {
  playerId: string
  gamesPlayed: number
  gamesWon: number
  winRate: number
  totalScore: number
  averageScore: number
  highestScore: number
  favoriteElement: string
  lastPlayedAt: number
}

/**
 * User profile
 */
export interface UserProfile {
  uid: string
  displayName: string
  email?: string
  photoURL?: string
  createdAt: number
  lastLoginAt: number
  stats: PlayerStats
  settings: UserSettings
}

/**
 * User settings
 */
export interface UserSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  animationsEnabled: boolean
  language: 'zh-TW' | 'en'
  theme: 'light' | 'dark' | 'auto'
  notifications: boolean
}

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  soundEnabled: true,
  musicEnabled: true,
  animationsEnabled: true,
  language: 'zh-TW',
  theme: 'dark',
  notifications: true,
}
