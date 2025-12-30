/**
 * Firebase initialization and configuration (Database only)
 * @version 1.1.0
 */
console.log('[firebase.ts] v1.1.0 loaded')

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

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize database only
export const database = getDatabase(app)

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectDatabaseEmulator(database, 'localhost', 9000)
  console.log('[Firebase] Connected to database emulator')
}

export default app
