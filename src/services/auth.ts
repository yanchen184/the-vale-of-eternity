/**
 * Authentication service
 * @version 1.0.0
 */
console.log('[services/auth.ts] v1.0.0 loaded')

import {
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { STORAGE_KEYS } from '@/data/constants'

/**
 * Sign in anonymously
 */
export async function signInAnon(): Promise<User> {
  const credential = await signInAnonymously(auth)
  return credential.user
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
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
