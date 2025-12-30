/**
 * Database service for Firebase Realtime Database
 * @version 1.0.0
 */
console.log('[services/database.ts] v1.0.0 loaded')

import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,

  type DatabaseReference,
  type Unsubscribe,
} from 'firebase/database'
import { database } from '@/lib/firebase'
import { DB_PATHS } from '@/data/constants'

/**
 * Get a database reference
 */
export function getRef(path: string): DatabaseReference {
  return ref(database, path)
}

/**
 * Write data to a path
 */
export async function writeData<T>(path: string, data: T): Promise<void> {
  await set(ref(database, path), data)
}

/**
 * Read data from a path
 */
export async function readData<T>(path: string): Promise<T | null> {
  const snapshot = await get(ref(database, path))
  return snapshot.exists() ? (snapshot.val() as T) : null
}

/**
 * Update data at a path
 */
export async function updateData(path: string, updates: Record<string, unknown>): Promise<void> {
  await update(ref(database, path), updates)
}

/**
 * Delete data at a path
 */
export async function deleteData(path: string): Promise<void> {
  await remove(ref(database, path))
}

/**
 * Push new data with auto-generated key
 */
export async function pushData<T>(path: string, data: T): Promise<string> {
  const newRef = push(ref(database, path))
  await set(newRef, data)
  return newRef.key!
}

/**
 * Subscribe to data changes
 */
export function subscribeToData<T>(
  path: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const dbRef = ref(database, path)
  onValue(dbRef, snapshot => {
    callback(snapshot.exists() ? (snapshot.val() as T) : null)
  })
  return () => off(dbRef)
}

/**
 * Subscribe to a query
 */
export function subscribeToQuery<T>(
  path: string,
  field: string,
  value: string | number | boolean,
  callback: (data: Record<string, T> | null) => void
): Unsubscribe {
  const dbRef = query(ref(database, path), orderByChild(field), equalTo(value))
  onValue(dbRef, snapshot => {
    callback(snapshot.exists() ? (snapshot.val() as Record<string, T>) : null)
  })
  return () => off(dbRef)
}

/**
 * Get rooms reference
 */
export function getRoomsRef(): DatabaseReference {
  return ref(database, DB_PATHS.ROOMS)
}

/**
 * Get game reference
 */
export function getGameRef(gameId: string): DatabaseReference {
  return ref(database, `${DB_PATHS.GAMES}/${gameId}`)
}

/**
 * Get user reference
 */
export function getUserRef(userId: string): DatabaseReference {
  return ref(database, `${DB_PATHS.USERS}/${userId}`)
}
