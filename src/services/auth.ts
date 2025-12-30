/**
 * Authentication service (Local storage based)
 * @version 1.1.0
 */
console.log('[services/auth.ts] v1.1.0 loaded')

import { STORAGE_KEYS } from '@/data/constants'
import { generateId } from '@/lib/utils'

export interface LocalUser {
  uid: string
  createdAt: number
}

/**
 * Get or create local user ID
 */
export function getOrCreateUserId(): LocalUser {
  let storedUser = localStorage.getItem(STORAGE_KEYS.USER_ID)

  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser) as LocalUser
      console.log('[Auth] Using existing user ID:', parsed.uid)
      return parsed
    } catch (e) {
      console.warn('[Auth] Invalid stored user, creating new one')
    }
  }

  // Create new user
  const newUser: LocalUser = {
    uid: generateId(20),
    createdAt: Date.now()
  }

  localStorage.setItem(STORAGE_KEYS.USER_ID, JSON.stringify(newUser))
  console.log('[Auth] Created new user ID:', newUser.uid)
  return newUser
}

/**
 * Sign in (just return or create user ID)
 */
export async function signInAnon(): Promise<LocalUser> {
  return getOrCreateUserId()
}

/**
 * Clear user ID (sign out)
 */
export function signOut(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_ID)
  console.log('[Auth] User signed out')
}

/**
 * Get current user
 */
export function getCurrentUser(): LocalUser | null {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_ID)
  if (!stored) return null

  try {
    return JSON.parse(stored) as LocalUser
  } catch {
    return null
  }
}

/**
 * Get or set player name from local storage
 */
export function getStoredPlayerName(): string {
  return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || ''
}

export function setStoredPlayerName(name: string): void {
  localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name)
}

/**
 * Get stored room code
 */
export function getStoredRoomCode(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_ROOM_CODE)
}

export function setStoredRoomCode(code: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_ROOM_CODE, code)
}
