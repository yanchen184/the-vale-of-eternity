/**
 * Single Player Adapter for Firebase
 * Allows single player mode to use multiplayer-game.ts service
 * @version 1.0.0
 */
console.log('[services/single-player-adapter.ts] v1.0.0 loaded')

import { ref, update, get } from 'firebase/database'
import { database } from '@/lib/firebase'
import { multiplayerGameService } from './multiplayer-game'

/**
 * Create a single player game using Firebase
 * This creates a multiplayer game with only 1 player slot
 */
export async function createSinglePlayerGame(
  playerName: string,
  expansionMode: boolean = true
): Promise<{ gameId: string; playerId: string; roomCode: string }> {
  console.log('[SinglePlayerAdapter] Creating single player game:', { playerName, expansionMode })

  // Generate a unique player ID
  const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Create a multiplayer room with correct parameter order
  // createRoom(hostId, hostName, maxPlayers, isExpansionMode)
  const { gameId, roomCode } = await multiplayerGameService.createRoom(playerId, playerName, 2, expansionMode)

  // Mark as single player mode
  const gameRef = ref(database, `games/${gameId}`)
  await update(gameRef, {
    isSinglePlayer: true,
  })

  // Start the game to initialize deck, market, and artifacts
  await multiplayerGameService.startGame(gameId, playerId)

  console.log('[SinglePlayerAdapter] Single player game created and started:', { gameId, playerId, roomCode })

  return { gameId, playerId, roomCode }
}

/**
 * Start a single player game
 * Since there's only 1 player, we can start immediately
 */
export async function startSinglePlayerGame(gameId: string, hostId: string): Promise<void> {
  console.log('[SinglePlayerAdapter] Starting single player game:', gameId)

  // Use the multiplayer service to start the game
  await multiplayerGameService.startGame(gameId, hostId)

  console.log('[SinglePlayerAdapter] Single player game started')
}

/**
 * Check if a game is single player mode
 */
export async function isSinglePlayerGame(gameId: string): Promise<boolean> {
  const gameRef = ref(database, `games/${gameId}/isSinglePlayer`)
  const snapshot = await get(gameRef)
  return snapshot.val() === true
}

/**
 * Get single player game state
 * This is a convenience wrapper around the multiplayer service
 */
export async function getSinglePlayerGameState(gameId: string) {
  const gameRef = ref(database, `games/${gameId}`)
  const snapshot = await get(gameRef)

  if (!snapshot.exists()) {
    throw new Error('Game not found')
  }

  return snapshot.val()
}

export default {
  createSinglePlayerGame,
  startSinglePlayerGame,
  isSinglePlayerGame,
  getSinglePlayerGameState,
}
