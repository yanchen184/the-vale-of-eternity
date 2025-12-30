/**
 * Game core type definitions
 * @version 1.0.0
 */
console.log('[types/game.ts] v1.0.0 loaded')

import type { CardInstance } from './cards'
import type { Player } from './player'

/**
 * Game phase enum
 */
export enum GamePhase {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  DRAFTING = 'DRAFTING',
  PLAYING = 'PLAYING',
  ROUND_END = 'ROUND_END',
  GAME_END = 'GAME_END',
}

/**
 * Turn phase enum
 */
export enum TurnPhase {
  DRAW = 'DRAW',
  ACTION = 'ACTION',
  DISCARD = 'DISCARD',
  END = 'END',
}

/**
 * Game settings
 */
export interface GameSettings {
  maxPlayers: 2 | 3 | 4
  useExpansion: boolean
  turnTimeLimit: number // in seconds, 0 = no limit
  autoEnd: boolean
}

/**
 * Game state
 */
export interface GameState {
  id: string
  roomCode: string
  hostId: string
  settings: GameSettings
  phase: GamePhase
  currentRound: number
  maxRounds: number
  currentPlayerIndex: number
  turnPhase: TurnPhase
  players: Player[]
  marketCards: CardInstance[]
  deck: CardInstance[]
  discardPile: CardInstance[]
  lastAction: GameAction | null
  createdAt: number
  updatedAt: number
  startedAt: number | null
  endedAt: number | null
}

/**
 * Game action types
 */
export enum ActionType {
  JOIN_GAME = 'JOIN_GAME',
  LEAVE_GAME = 'LEAVE_GAME',
  START_GAME = 'START_GAME',
  DRAW_CARD = 'DRAW_CARD',
  TAKE_MARKET_CARD = 'TAKE_MARKET_CARD',
  PLAY_CARD = 'PLAY_CARD',
  ACTIVATE_ABILITY = 'ACTIVATE_ABILITY',
  DISCARD_CARD = 'DISCARD_CARD',
  END_TURN = 'END_TURN',
  PASS = 'PASS',
}

/**
 * Game action
 */
export interface GameAction {
  type: ActionType
  playerId: string
  payload?: Record<string, unknown>
  timestamp: number
}

/**
 * Game result
 */
export interface GameResult {
  gameId: string
  winner: string
  rankings: PlayerRanking[]
  endReason: 'NORMAL' | 'TIMEOUT' | 'FORFEIT'
  duration: number
}

/**
 * Player ranking
 */
export interface PlayerRanking {
  playerId: string
  playerName: string
  rank: number
  score: number
  bonusPoints: number
  cardCount: number
}

/**
 * Room info for lobby display
 */
export interface RoomInfo {
  id: string
  roomCode: string
  hostName: string
  playerCount: number
  maxPlayers: number
  phase: GamePhase
  useExpansion: boolean
  createdAt: number
}
