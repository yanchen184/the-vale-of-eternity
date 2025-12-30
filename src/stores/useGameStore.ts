/**
 * Game State Store for Single Player Mode v3.0.0
 * Using Zustand for state management
 * Supports single-player game with Stone Economy System
 * @version 3.0.0
 */
console.log('[stores/useGameStore.ts] v3.0.0 loaded')

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { CardInstance, StoneType } from '@/types/cards'
import {
  type SinglePlayerGameState,
  type StonePool,
  type ScoreBreakdown,
  SinglePlayerPhase,
  SinglePlayerActionType,
  calculateStonePoolValue,
} from '@/types/game'
import {
  SinglePlayerEngine,
  SinglePlayerError,
  SinglePlayerErrorCode,
  SINGLE_PLAYER_CONSTANTS,
} from '@/lib/single-player-engine'

// ============================================
// STORE INTERFACE
// ============================================

interface GameStore {
  // === State ===
  /** Current game state */
  gameState: SinglePlayerGameState | null
  /** Game engine instance */
  engine: SinglePlayerEngine
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null

  // === Game Lifecycle ===
  /** Start a new single-player game */
  startGame: (playerName: string) => void
  /** Reset the game */
  resetGame: () => void

  // === Draw Phase Actions ===
  /** Draw a card from deck */
  drawCard: () => void

  // === Action Phase Actions ===
  /** Tame a creature */
  tameCreature: (cardInstanceId: string, from: 'HAND' | 'MARKET') => void
  /** Pass turn (continue to next draw phase) */
  pass: () => void
  /** Manually end the game */
  endGame: () => void
  /** Exchange stones */
  exchangeStones: (fromType: StoneType, toType: StoneType, amount: number) => void

  // === Queries ===
  /** Check if a card can be tamed */
  canTameCard: (cardInstanceId: string) => boolean
  /** Get the cost of a card */
  getCardCost: (cardInstanceId: string) => number
  /** Get available actions */
  getAvailableActions: () => SinglePlayerActionType[]
  /** Get total stone value */
  getTotalStoneValue: () => number
  /** Get cards that can be tamed from hand */
  getTameableFromHand: () => CardInstance[]
  /** Get cards that can be tamed from market */
  getTameableFromMarket: () => CardInstance[]

  // === Internal ===
  /** Set loading state */
  setLoading: (loading: boolean) => void
  /** Set error message */
  setError: (error: string | null) => void
  /** Sync state from engine */
  syncState: () => void
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useGameStore = create<GameStore>()(
  devtools(
    subscribeWithSelector((set, get) => {
      // Create engine instance
      const engine = new SinglePlayerEngine()

      // Subscribe to engine state changes
      engine.onStateChange(state => {
        set({ gameState: state, error: null })
      })

      engine.onGameEnd(state => {
        console.log('[GameStore] Game ended with score:', state.finalScore)
      })

      return {
        // === Initial State ===
        gameState: null,
        engine,
        isLoading: false,
        error: null,

        // === Game Lifecycle ===
        startGame: (playerName: string) => {
          set({ isLoading: true, error: null })
          try {
            const state = engine.initGame(playerName)
            set({ gameState: state, isLoading: false })
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to start game'
            set({ error: message, isLoading: false })
          }
        },

        resetGame: () => {
          engine.resetGame()
          set({ gameState: null, error: null })
        },

        // === Draw Phase Actions ===
        drawCard: () => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.drawCard()
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to draw card'
            set({ error: message })
          }
        },

        // === Action Phase Actions ===
        tameCreature: (cardInstanceId: string, from: 'HAND' | 'MARKET') => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.tameCreature(cardInstanceId, from)
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to tame creature'
            set({ error: message })
          }
        },

        pass: () => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.pass()
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to pass'
            set({ error: message })
          }
        },

        endGame: () => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.endGame()
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to end game'
            set({ error: message })
          }
        },

        exchangeStones: (fromType: StoneType, toType: StoneType, amount: number) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.exchangeStones(fromType, toType, amount)
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to exchange stones'
            set({ error: message })
          }
        },

        // === Queries ===
        canTameCard: (cardInstanceId: string) => {
          return engine.canTameCard(cardInstanceId)
        },

        getCardCost: (cardInstanceId: string) => {
          return engine.getCardCost(cardInstanceId)
        },

        getAvailableActions: () => {
          return engine.getAvailableActions()
        },

        getTotalStoneValue: () => {
          const { gameState } = get()
          if (!gameState) return 0
          return calculateStonePoolValue(gameState.player.stones)
        },

        getTameableFromHand: () => {
          const { gameState, canTameCard } = get()
          if (!gameState) return []
          return gameState.player.hand.filter(card => canTameCard(card.instanceId))
        },

        getTameableFromMarket: () => {
          const { gameState, canTameCard } = get()
          if (!gameState) return []
          return gameState.market.filter(card => canTameCard(card.instanceId))
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
      }
    }),
    { name: 'single-player-game-store' }
  )
)

// ============================================
// SELECTORS
// ============================================

/**
 * Select current game phase
 */
export const selectPhase = (state: GameStore): SinglePlayerPhase | null =>
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
 * Select player hand
 */
export const selectHand = (state: GameStore): CardInstance[] =>
  state.gameState?.player.hand ?? []

/**
 * Select player field
 */
export const selectField = (state: GameStore): CardInstance[] =>
  state.gameState?.player.field ?? []

/**
 * Select player stones
 */
export const selectStones = (state: GameStore): StonePool | null =>
  state.gameState?.player.stones ?? null

/**
 * Select deck size
 */
export const selectDeckSize = (state: GameStore): number =>
  state.gameState?.deck.length ?? 0

/**
 * Select discard pile
 */
export const selectDiscardPile = (state: GameStore): CardInstance[] =>
  state.gameState?.discardPile ?? []

/**
 * Select if game is over
 */
export const selectIsGameOver = (state: GameStore): boolean =>
  state.gameState?.isGameOver ?? false

/**
 * Select final score
 */
export const selectFinalScore = (state: GameStore): number | null =>
  state.gameState?.finalScore ?? null

/**
 * Select score breakdown
 */
export const selectScoreBreakdown = (state: GameStore): ScoreBreakdown | null =>
  state.gameState?.scoreBreakdown ?? null

/**
 * Select end reason
 */
export const selectEndReason = (state: GameStore): string | null =>
  state.gameState?.endReason ?? null

/**
 * Select player name
 */
export const selectPlayerName = (state: GameStore): string =>
  state.gameState?.player.name ?? ''

// ============================================
// HOOKS
// ============================================

/**
 * Hook to get current phase
 */
export function useGamePhase(): SinglePlayerPhase | null {
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
 * Hook to get player hand
 */
export function useHand(): CardInstance[] {
  return useGameStore(selectHand)
}

/**
 * Hook to get player field
 */
export function useField(): CardInstance[] {
  return useGameStore(selectField)
}

/**
 * Hook to get player stones
 */
export function useStones(): StonePool | null {
  return useGameStore(selectStones)
}

/**
 * Hook to get deck size
 */
export function useDeckSize(): number {
  return useGameStore(selectDeckSize)
}

/**
 * Hook to get discard pile
 */
export function useDiscardPile(): CardInstance[] {
  return useGameStore(selectDiscardPile)
}

/**
 * Hook to get game over state
 */
export function useGameOver(): {
  isOver: boolean
  score: number | null
  reason: string | null
  breakdown: ScoreBreakdown | null
} {
  const isOver = useGameStore(selectIsGameOver)
  const score = useGameStore(selectFinalScore)
  const reason = useGameStore(selectEndReason)
  const breakdown = useGameStore(selectScoreBreakdown)
  return { isOver, score, reason, breakdown }
}

/**
 * Hook to get player name
 */
export function usePlayerName(): string {
  return useGameStore(selectPlayerName)
}

/**
 * Hook to get total stone value
 */
export function useTotalStoneValue(): number {
  return useGameStore(state => state.getTotalStoneValue())
}

/**
 * Hook to get available actions
 */
export function useAvailableActions(): SinglePlayerActionType[] {
  return useGameStore(state => state.getAvailableActions())
}

/**
 * Hook to get tameable cards from hand
 */
export function useTameableFromHand(): CardInstance[] {
  return useGameStore(state => state.getTameableFromHand())
}

/**
 * Hook to get tameable cards from market
 */
export function useTameableFromMarket(): CardInstance[] {
  return useGameStore(state => state.getTameableFromMarket())
}

// ============================================
// RE-EXPORTS
// ============================================

export {
  SinglePlayerPhase,
  SinglePlayerActionType,
  SinglePlayerError,
  SinglePlayerErrorCode,
  SINGLE_PLAYER_CONSTANTS,
}

export type { SinglePlayerGameState, StonePool, ScoreBreakdown }

export default useGameStore
