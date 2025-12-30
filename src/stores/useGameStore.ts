/**
 * Game State Store for MVP 1.0
 * Using Zustand for state management
 * Based on GAME_ENGINE_SPEC.md
 * @version 1.0.0
 */
console.log('[stores/useGameStore.ts] v1.0.0 loaded')

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { CardInstance } from '@/types/cards'
import {
  GameEngine,
  GamePhase,
  ActionType,
  type MVPGameState,
  type MVPPlayerState,
  type GameAction,
  type VictoryResult,
  GameError,
  GameErrorCode,
} from '@/lib/game-engine'

// ============================================
// STORE INTERFACE
// ============================================

interface GameStore {
  // === State ===
  /** Current game state */
  gameState: MVPGameState | null
  /** Game engine instance */
  engine: GameEngine
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Local player index (for UI purposes) */
  localPlayerIndex: 0 | 1

  // === Game Lifecycle ===
  /** Initialize a new game */
  initGame: (player1Name: string, player2Name: string) => void
  /** Reset the game */
  resetGame: () => void

  // === Hunting Phase Actions ===
  /** Select a card from market (take to hand) */
  takeMarketCard: (cardInstanceId: string) => void
  /** Tame a card directly from market */
  tameMarketCard: (cardInstanceId: string) => void

  // === Action Phase Actions ===
  /** Tame a card from hand */
  tameFromHand: (cardInstanceId: string) => void
  /** Sell a card from hand */
  sellCard: (cardInstanceId: string) => void
  /** Pass turn */
  pass: () => void

  // === Phase Control ===
  /** End current phase and move to next */
  endPhase: () => void
  /** Start next round */
  nextRound: () => void

  // === Queries ===
  /** Get current player */
  getCurrentPlayer: () => MVPPlayerState | null
  /** Get opponent player */
  getOpponent: () => MVPPlayerState | null
  /** Get valid actions for current player */
  getValidActions: () => ActionType[]
  /** Check if a card can be tamed */
  canTameCard: (cardInstanceId: string) => boolean
  /** Check if a card can be sold */
  canSellCard: (cardInstanceId: string) => boolean
  /** Check if it's local player's turn */
  isMyTurn: () => boolean

  // === Internal ===
  /** Set loading state */
  setLoading: (loading: boolean) => void
  /** Set error message */
  setError: (error: string | null) => void
  /** Update game state from engine */
  syncState: () => void
  /** Set local player index */
  setLocalPlayerIndex: (index: 0 | 1) => void
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useGameStore = create<GameStore>()(
  devtools(
    subscribeWithSelector((set, get) => {
      // Create engine instance
      const engine = new GameEngine()

      // Subscribe to engine state changes
      engine.onStateChange(state => {
        set({ gameState: state, error: null })
      })

      engine.onGameEnd(result => {
        console.log('[GameStore] Game ended:', result)
      })

      return {
        // === Initial State ===
        gameState: null,
        engine,
        isLoading: false,
        error: null,
        localPlayerIndex: 0,

        // === Game Lifecycle ===
        initGame: (player1Name: string, player2Name: string) => {
          set({ isLoading: true, error: null })
          try {
            const state = engine.initializeGame(player1Name, player2Name)
            set({ gameState: state, isLoading: false })
          } catch (err) {
            const message = err instanceof GameError ? err.message : 'Failed to initialize game'
            set({ error: message, isLoading: false })
          }
        },

        resetGame: () => {
          engine.resetGame()
          set({ gameState: null, error: null, localPlayerIndex: 0 })
        },

        // === Hunting Phase Actions ===
        takeMarketCard: (cardInstanceId: string) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.selectMarketCard(gameState.currentPlayerIndex, cardInstanceId, 'TAKE')
          } catch (err) {
            const message = err instanceof GameError ? err.message : 'Failed to take card'
            set({ error: message })
          }
        },

        tameMarketCard: (cardInstanceId: string) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.selectMarketCard(gameState.currentPlayerIndex, cardInstanceId, 'TAME')
          } catch (err) {
            const message = err instanceof GameError ? err.message : 'Failed to tame card'
            set({ error: message })
          }
        },

        // === Action Phase Actions ===
        tameFromHand: (cardInstanceId: string) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.tameFromHand(gameState.currentPlayerIndex, cardInstanceId)
          } catch (err) {
            const message = err instanceof GameError ? err.message : 'Failed to tame card'
            set({ error: message })
          }
        },

        sellCard: (cardInstanceId: string) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.sellCard(gameState.currentPlayerIndex, cardInstanceId)
          } catch (err) {
            const message = err instanceof GameError ? err.message : 'Failed to sell card'
            set({ error: message })
          }
        },

        pass: () => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.pass(gameState.currentPlayerIndex)
          } catch (err) {
            const message = err instanceof GameError ? err.message : 'Failed to pass'
            set({ error: message })
          }
        },

        // === Phase Control ===
        endPhase: () => {
          const { gameState } = get()
          if (!gameState) return

          try {
            if (gameState.phase === GamePhase.RESOLUTION && !gameState.isGameOver) {
              engine.startNextRound()
            }
          } catch (err) {
            const message = err instanceof GameError ? err.message : 'Failed to end phase'
            set({ error: message })
          }
        },

        nextRound: () => {
          const { gameState } = get()
          if (!gameState || gameState.isGameOver) return

          try {
            engine.startNextRound()
          } catch (err) {
            const message = err instanceof GameError ? err.message : 'Failed to start next round'
            set({ error: message })
          }
        },

        // === Queries ===
        getCurrentPlayer: () => {
          const { gameState } = get()
          if (!gameState) return null
          return gameState.players[gameState.currentPlayerIndex]
        },

        getOpponent: () => {
          const { gameState } = get()
          if (!gameState) return null
          const opponentIndex = gameState.currentPlayerIndex === 0 ? 1 : 0
          return gameState.players[opponentIndex]
        },

        getValidActions: () => {
          return engine.getValidActions()
        },

        canTameCard: (cardInstanceId: string) => {
          return engine.canTameCard(cardInstanceId)
        },

        canSellCard: (cardInstanceId: string) => {
          return engine.canSellCard(cardInstanceId)
        },

        isMyTurn: () => {
          const { gameState, localPlayerIndex } = get()
          if (!gameState) return false
          return gameState.currentPlayerIndex === localPlayerIndex
        },

        // === Internal ===
        setLoading: (loading: boolean) => {
          set({ isLoading: loading })
        },

        setError: (error: string | null) => {
          set({ error })
        },

        syncState: () => {
          const state = engine.getState()
          if (state) {
            set({ gameState: state })
          }
        },

        setLocalPlayerIndex: (index: 0 | 1) => {
          set({ localPlayerIndex: index })
        },
      }
    }),
    { name: 'game-store' }
  )
)

// ============================================
// SELECTORS
// ============================================

/**
 * Select current game phase
 */
export const selectPhase = (state: GameStore): GamePhase | null =>
  state.gameState?.phase ?? null

/**
 * Select current round number
 */
export const selectRound = (state: GameStore): number =>
  state.gameState?.round ?? 0

/**
 * Select market cards
 */
export const selectMarket = (state: GameStore): CardInstance[] =>
  state.gameState?.market ?? []

/**
 * Select player by index
 */
export const selectPlayer = (state: GameStore, index: 0 | 1): MVPPlayerState | null =>
  state.gameState?.players[index] ?? null

/**
 * Select local player
 */
export const selectLocalPlayer = (state: GameStore): MVPPlayerState | null =>
  state.gameState?.players[state.localPlayerIndex] ?? null

/**
 * Select opponent
 */
export const selectOpponentPlayer = (state: GameStore): MVPPlayerState | null => {
  if (!state.gameState) return null
  const opponentIndex = state.localPlayerIndex === 0 ? 1 : 0
  return state.gameState.players[opponentIndex]
}

/**
 * Select if game is over
 */
export const selectIsGameOver = (state: GameStore): boolean =>
  state.gameState?.isGameOver ?? false

/**
 * Select winner
 */
export const selectWinner = (state: GameStore): 0 | 1 | 'draw' | null =>
  state.gameState?.winner ?? null

/**
 * Select end reason
 */
export const selectEndReason = (state: GameStore): string | null =>
  state.gameState?.endReason ?? null

/**
 * Select if it's the local player's turn
 */
export const selectIsLocalPlayerTurn = (state: GameStore): boolean => {
  if (!state.gameState) return false
  return state.gameState.currentPlayerIndex === state.localPlayerIndex
}

/**
 * Select discard pile
 */
export const selectDiscardPile = (state: GameStore): CardInstance[] =>
  state.gameState?.discardPile ?? []

/**
 * Select deck size (for display)
 */
export const selectDeckSize = (state: GameStore): number =>
  state.gameState?.deck.length ?? 0

// ============================================
// HOOKS
// ============================================

/**
 * Hook to get current phase
 */
export function useGamePhase(): GamePhase | null {
  return useGameStore(selectPhase)
}

/**
 * Hook to get current round
 */
export function useRound(): number {
  return useGameStore(selectRound)
}

/**
 * Hook to get market cards
 */
export function useMarket(): CardInstance[] {
  return useGameStore(selectMarket)
}

/**
 * Hook to get local player
 */
export function useLocalPlayer(): MVPPlayerState | null {
  return useGameStore(selectLocalPlayer)
}

/**
 * Hook to get opponent
 */
export function useOpponent(): MVPPlayerState | null {
  return useGameStore(selectOpponentPlayer)
}

/**
 * Hook to check if it's local player's turn
 */
export function useIsMyTurn(): boolean {
  return useGameStore(selectIsLocalPlayerTurn)
}

/**
 * Hook to get game over state
 */
export function useGameOver(): { isOver: boolean; winner: 0 | 1 | 'draw' | null; reason: string | null } {
  const isOver = useGameStore(selectIsGameOver)
  const winner = useGameStore(selectWinner)
  const reason = useGameStore(selectEndReason)
  return { isOver, winner, reason }
}

// ============================================
// RE-EXPORTS
// ============================================

export { GamePhase, ActionType, GameError, GameErrorCode }
export type { MVPGameState, MVPPlayerState, GameAction, VictoryResult }

export default useGameStore
