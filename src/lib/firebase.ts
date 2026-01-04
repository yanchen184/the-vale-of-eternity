/**
 * Firebase initialization and configuration (Database only)
 * @version 1.2.0 - Added single-player emulator support
 */
console.log('[firebase.ts] v1.2.0 loaded')

import { initializeApp } from 'firebase/app'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBVkl66EYpcIaSM46XhQZB_yWwVVd8dUhw",
  authDomain: "the-vale-of-eternity.firebaseapp.com",
  databaseURL: "https://the-vale-of-eternity-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-vale-of-eternity",
  storageBucket: "the-vale-of-eternity.firebasestorage.app",
  messagingSenderId: "465091637532",
  appId: "1:465091637532:web:e9ffb9e91532d6ea06cad9",
  measurementId: "G-8W75K5SH0Y"
}

// Initialize Firebase Apps
const app = initializeApp(firebaseConfig)
const singlePlayerApp = initializeApp(firebaseConfig, 'single-player')

// Multiplayer database (production Firebase)
export const database = getDatabase(app)
console.log('[Firebase] Multiplayer database using production Firebase')

// Single-player database (local emulator)
export const singlePlayerDatabase = getDatabase(singlePlayerApp)

// Connect single-player to emulator (always in dev mode)
if (import.meta.env.DEV) {
  try {
    connectDatabaseEmulator(singlePlayerDatabase, 'localhost', 9000)
    console.log('[Firebase] ✅ Single-player database connected to emulator at localhost:9000')
    console.log('[Firebase] 💡 Make sure Firebase emulator is running: firebase emulators:start')
  } catch (error) {
    console.error('[Firebase] ❌ Failed to connect to emulator:', error)
    console.warn('[Firebase] 🚨 Please run: firebase emulators:start')
  }
}

export default app
