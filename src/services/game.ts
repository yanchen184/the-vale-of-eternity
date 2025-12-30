/**
 * Game service for managing game state in Firebase
 * @version 1.0.0
 */
console.log('[services/game.ts] v1.0.0 loaded')

import { onValue, off } from 'firebase/database'
import { getRef, writeData, readData, updateData, deleteData } from './database'
import { generateRoomCode, generateId, shuffle } from '@/lib/utils'
import { DB_PATHS, GAME_CONFIG } from '@/data/constants'
import { GamePhase, PlayerStatus, TurnPhase } from '@/types'
import type { GameState, GameSettings, RoomInfo } from '@/types'
import type { Player } from '@/types'

/**
 * Create a new game room
 */
export async function createGame(
  hostId: string,
  hostName: string,
  settings: Partial<GameSettings> = {}
): Promise<GameState> {
  const roomCode = generateRoomCode()
  const gameId = generateId(12)

  const gameSettings: GameSettings = {
    maxPlayers: settings.maxPlayers || 4,
    useExpansion: settings.useExpansion || false,
    turnTimeLimit: settings.turnTimeLimit || 60,
    autoEnd: settings.autoEnd ?? true,
  }

  const hostPlayer: Player = {
    id: hostId,
    name: hostName,
    status: PlayerStatus.READY,
    isHost: true,
    hand: [],
    field: [],
    gold: 0,
    score: 0,
    bonusPoints: 0,
    turnOrder: 0,
    isCurrentTurn: false,
    lastActiveAt: Date.now(),
    joinedAt: Date.now(),
  }

  const game: GameState = {
    id: gameId,
    roomCode,
    hostId,
    settings: gameSettings,
    phase: GamePhase.WAITING,
    currentRound: 0,
    maxRounds: GAME_CONFIG.TOTAL_ROUNDS,
    currentPlayerIndex: 0,
    turnPhase: TurnPhase.DRAW,
    players: [hostPlayer],
    marketCards: [],
    deck: [],
    discardPile: [],
    lastAction: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startedAt: null,
    endedAt: null,
  }

  // Save to Firebase
  await writeData(`${DB_PATHS.GAMES}/${gameId}`, game)
  await writeData(`${DB_PATHS.ROOMS}/${gameId}`, {
    id: gameId,
    roomCode,
    hostName,
    playerCount: 1,
    maxPlayers: gameSettings.maxPlayers,
    phase: 'WAITING',
    useExpansion: gameSettings.useExpansion,
    createdAt: Date.now(),
  } as RoomInfo)

  return game
}

/**
 * Join an existing game
 */
export async function joinGame(
  roomCode: string,
  playerId: string,
  playerName: string
): Promise<GameState | null> {
  // Find game by room code
  const rooms = await readData<Record<string, RoomInfo>>(DB_PATHS.ROOMS)
  if (!rooms) return null

  const roomEntry = Object.entries(rooms).find(([_, room]) => room.roomCode === roomCode)
  if (!roomEntry) return null

  const [gameId] = roomEntry
  const game = await readData<GameState>(`${DB_PATHS.GAMES}/${gameId}`)
  if (!game) return null

  // Check if game is joinable
  if (game.phase !== 'WAITING') {
    throw new Error('遊戲已開始，無法加入')
  }
  if (game.players.length >= game.settings.maxPlayers) {
    throw new Error('房間已滿')
  }
  if (game.players.some(p => p.id === playerId)) {
    // Already in game
    return game
  }

  // Add player
  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    status: PlayerStatus.WAITING,
    isHost: false,
    hand: [],
    field: [],
    gold: 0,
    score: 0,
    bonusPoints: 0,
    turnOrder: game.players.length,
    isCurrentTurn: false,
    lastActiveAt: Date.now(),
    joinedAt: Date.now(),
  }

  const updatedPlayers = [...game.players, newPlayer]

  await updateData(`${DB_PATHS.GAMES}/${gameId}`, {
    players: updatedPlayers,
    updatedAt: Date.now(),
  })

  await updateData(`${DB_PATHS.ROOMS}/${gameId}`, {
    playerCount: updatedPlayers.length,
  })

  return { ...game, players: updatedPlayers }
}

/**
 * Leave a game
 */
export async function leaveGame(gameId: string, playerId: string): Promise<void> {
  const game = await readData<GameState>(`${DB_PATHS.GAMES}/${gameId}`)
  if (!game) return

  const remainingPlayers = game.players.filter(p => p.id !== playerId)

  if (remainingPlayers.length === 0) {
    // Delete game if no players left
    await deleteData(`${DB_PATHS.GAMES}/${gameId}`)
    await deleteData(`${DB_PATHS.ROOMS}/${gameId}`)
    return
  }

  // Transfer host if leaving player is host
  let updatedPlayers = remainingPlayers
  if (game.hostId === playerId) {
    const newHost = remainingPlayers[0]
    updatedPlayers = remainingPlayers.map((p, i) =>
      i === 0 ? { ...p, isHost: true } : p
    )
    await updateData(`${DB_PATHS.GAMES}/${gameId}`, {
      hostId: newHost.id,
    })
    await updateData(`${DB_PATHS.ROOMS}/${gameId}`, {
      hostName: newHost.name,
    })
  }

  await updateData(`${DB_PATHS.GAMES}/${gameId}`, {
    players: updatedPlayers,
    updatedAt: Date.now(),
  })

  await updateData(`${DB_PATHS.ROOMS}/${gameId}`, {
    playerCount: updatedPlayers.length,
  })
}

/**
 * Start a game
 */
export async function startGame(gameId: string): Promise<void> {
  const game = await readData<GameState>(`${DB_PATHS.GAMES}/${gameId}`)
  if (!game) throw new Error('遊戲不存在')
  if (game.players.length < GAME_CONFIG.MIN_PLAYERS) {
    throw new Error(`需要至少 ${GAME_CONFIG.MIN_PLAYERS} 名玩家才能開始`)
  }

  // Shuffle player order
  const shuffledPlayers = shuffle(game.players).map((p, i) => ({
    ...p,
    turnOrder: i,
    isCurrentTurn: i === 0,
    status: PlayerStatus.PLAYING,
  }))

  await updateData(`${DB_PATHS.GAMES}/${gameId}`, {
    phase: 'PLAYING',
    currentRound: 1,
    currentPlayerIndex: 0,
    players: shuffledPlayers,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  })

  await updateData(`${DB_PATHS.ROOMS}/${gameId}`, {
    phase: 'PLAYING',
  })
}

/**
 * Subscribe to game updates
 */
export function subscribeToGame(
  gameId: string,
  callback: (game: GameState | null) => void
): () => void {
  const gameRef = getRef(`${DB_PATHS.GAMES}/${gameId}`)
  onValue(gameRef, snapshot => {
    callback(snapshot.exists() ? (snapshot.val() as GameState) : null)
  })
  return () => off(gameRef)
}

/**
 * Subscribe to room list
 */
export function subscribeToRooms(
  callback: (rooms: RoomInfo[]) => void
): () => void {
  const roomsRef = getRef(DB_PATHS.ROOMS)
  onValue(roomsRef, snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, RoomInfo>
      const rooms = Object.values(data).filter(r => r.phase === 'WAITING')
      callback(rooms)
    } else {
      callback([])
    }
  })
  return () => off(roomsRef)
}

/**
 * Find game by room code
 */
export async function findGameByRoomCode(roomCode: string): Promise<GameState | null> {
  const rooms = await readData<Record<string, RoomInfo>>(DB_PATHS.ROOMS)
  if (!rooms) return null

  const roomEntry = Object.entries(rooms).find(([_, room]) => room.roomCode === roomCode)
  if (!roomEntry) return null

  const [gameId] = roomEntry
  return readData<GameState>(`${DB_PATHS.GAMES}/${gameId}`)
}
