/**
 * Game State Store for Single Player Mode v3.4.0
 * Using Zustand for state management
 * Supports single-player game with Stone Economy System
 * @version 3.4.0 - Added takeCardsFromMarket action for free card selection in DRAW phase
 */
console.log('[stores/useGameStore.ts] v3.4.0 loaded')

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
  GameMode,
  ManualOperationType,
  createManualOperation,
} from '@/types/manual'
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
  startGame: (playerName: string, expansionMode?: boolean) => void
  /** Reset the game */
  resetGame: () => void

  // === Setup Phase Actions (v3.2.0) ===
  /** Select artifact during setup */
  selectArtifact: (artifactId: string) => void
  /** Confirm artifact selection */
  confirmArtifact: () => void
  /** Select initial card during setup */
  selectInitialCard: (cardInstanceId: string) => void
  /** Confirm initial card selection */
  confirmInitialCard: () => void

  // === Draw Phase Actions ===
  /** Draw a card from deck */
  drawCard: () => void
  /** Take selected cards from market to hand (free during DRAW phase after artifact selection) */
  takeCardsFromMarket: (cardInstanceIds: string[]) => void

  // === Action Phase Actions ===
  /** Tame a creature */
  tameCreature: (cardInstanceId: string, from: 'HAND' | 'MARKET') => void
  /** Move current turn card to hand */
  moveCurrentCardToHand: (cardInstanceId: string) => void
  /** Sell current turn card for coins */
  sellCurrentCard: (cardInstanceId: string) => void
  /** Pass turn (move to settlement/SCORE phase) */
  pass: () => void
  /** Complete settlement and move to next round (after processing all currentTurnCards) */
  completeSettlement: () => void
  /** Discard a card from field to discard pile */
  discardCard: (cardInstanceId: string) => void
  /** Move a card from field to sanctuary */
  moveToSanctuary: (cardInstanceId: string) => void
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

  // === Manual Mode (v3.1.0) ===
  /** Set game mode */
  setGameMode: (mode: GameMode) => void
  /** Add stones (manual mode) */
  addStones: (type: StoneType, amount: number) => void
  /** Remove stones (manual mode) */
  removeStones: (type: StoneType, amount: number) => void
  /** Adjust score (manual mode) */
  adjustScore: (amount: number, reason?: string) => void
  /** Undo last manual operation */
  undoOperation: () => void
  /** Clear manual operation history */
  clearHistory: () => void
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
      // This is the ONLY place where gameState should be updated
      engine.onStateChange(state => {
        console.log('[GameStore] onStateChange triggered:', state?.phase, state?.isExpansionMode, 'artifacts:', state?.availableArtifacts?.length)
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
        startGame: (playerName: string, expansionMode: boolean = true) => {
          console.log('[GameStore] startGame called with:', { playerName, expansionMode })
          set({ isLoading: true, error: null })
          try {
            // engine.initGame() will trigger onStateChange callback which will set gameState
            const initialState = engine.initGame(playerName, expansionMode)
            console.log('[GameStore] initGame returned:', initialState?.phase, initialState?.isExpansionMode)
            set({ isLoading: false })
          } catch (err) {
            console.error('[GameStore] startGame error:', err)
            console.error('[GameStore] Error details:', {
              name: (err as Error)?.name,
              message: (err as Error)?.message,
              stack: (err as Error)?.stack
            })
            const message = err instanceof SinglePlayerError
              ? err.message
              : (err as Error)?.message || 'Failed to start game'
            set({ error: message, isLoading: false })
          }
        },

        resetGame: () => {
          engine.resetGame()
          set({ gameState: null, error: null })
        },

        // === Setup Phase Actions (v3.2.0) ===
        selectArtifact: (artifactId: string) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.selectArtifact(artifactId)
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to select artifact'
            set({ error: message })
          }
        },

        confirmArtifact: () => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.confirmArtifact()
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to confirm artifact'
            set({ error: message })
          }
        },

        selectInitialCard: (cardInstanceId: string) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.selectInitialCard(cardInstanceId)
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to select initial card'
            set({ error: message })
          }
        },

        confirmInitialCard: () => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.confirmInitialCard()
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to confirm initial card'
            set({ error: message })
          }
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

        takeCardsFromMarket: (cardInstanceIds: string[]) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.takeCardsFromMarket(cardInstanceIds)
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to take cards from market'
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

        moveCurrentCardToHand: (cardInstanceId: string) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.moveCurrentDrawnCardToHand(cardInstanceId)
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to move card to hand'
            set({ error: message })
          }
        },

        sellCurrentCard: (cardInstanceId: string) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.sellCurrentDrawnCard(cardInstanceId)
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to sell card'
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

        completeSettlement: () => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.completeSettlement()
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to complete settlement'
            set({ error: message })
          }
        },

        discardCard: (cardInstanceId: string) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.discardCard(cardInstanceId)
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to discard card'
            set({ error: message })
          }
        },

        moveToSanctuary: (cardInstanceId: string) => {
          const { gameState } = get()
          if (!gameState) return

          try {
            engine.moveToSanctuary(cardInstanceId)
          } catch (err) {
            const message = err instanceof SinglePlayerError
              ? err.message
              : 'Failed to move card to sanctuary'
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

        // === Manual Mode (v3.1.0) ===
        setGameMode: (mode: GameMode) => {
          const { gameState } = get()
          if (!gameState) return

          set({
            gameState: {
              ...gameState,
              gameMode: mode,
            },
          })
        },

        addStones: (type: StoneType, amount: number) => {
          const { gameState } = get()
          if (!gameState) return

          // Validate amount
          if (amount <= 0) {
            set({ error: '石頭數量必須大於 0' })
            return
          }

          const newStones = { ...gameState.player.stones }
          newStones[type] = (newStones[type] || 0) + amount

          // Create operation record with proper state snapshots
          const operation = createManualOperation(
            ManualOperationType.ADD_STONES,
            `增加 ${amount} 個 ${type} 石頭`,
            { type: 'ADD_STONES', stoneType: type, amount },
            { player: { ...gameState.player, stones: { ...gameState.player.stones } } } as Partial<SinglePlayerGameState>,
            { player: { ...gameState.player, stones: newStones } } as Partial<SinglePlayerGameState>
          )

          set({
            gameState: {
              ...gameState,
              player: {
                ...gameState.player,
                stones: newStones,
              },
              manualOperations: [...gameState.manualOperations, operation],
              updatedAt: Date.now(),
            },
          })
        },

        removeStones: (type: StoneType, amount: number) => {
          const { gameState } = get()
          if (!gameState) return

          // Validate amount
          if (amount <= 0) {
            set({ error: '石頭數量必須大於 0' })
            return
          }

          const currentAmount = gameState.player.stones[type] || 0
          if (currentAmount < amount) {
            set({ error: `${type} 石頭不足（當前: ${currentAmount}）` })
            return
          }

          const newStones = { ...gameState.player.stones }
          newStones[type] = currentAmount - amount

          // Create operation record with proper state snapshots
          const operation = createManualOperation(
            ManualOperationType.REMOVE_STONES,
            `減少 ${amount} 個 ${type} 石頭`,
            { type: 'REMOVE_STONES', stoneType: type, amount },
            { player: { ...gameState.player, stones: { ...gameState.player.stones } } } as Partial<SinglePlayerGameState>,
            { player: { ...gameState.player, stones: newStones } } as Partial<SinglePlayerGameState>
          )

          set({
            gameState: {
              ...gameState,
              player: {
                ...gameState.player,
                stones: newStones,
              },
              manualOperations: [...gameState.manualOperations, operation],
              updatedAt: Date.now(),
            },
          })
        },

        adjustScore: (amount: number, reason: string = '') => {
          const { gameState } = get()
          if (!gameState || gameState.gameMode !== GameMode.MANUAL) return

          if (amount === 0) {
            set({ error: '分數調整不能為 0' })
            return
          }

          const currentScore = gameState.finalScore || 0
          const newScore = currentScore + amount
          const description = reason
            ? `調整分數 ${amount > 0 ? '+' : ''}${amount}（${reason}）`
            : `調整分數 ${amount > 0 ? '+' : ''}${amount}`

          // Create operation record with proper state snapshots
          const operation = createManualOperation(
            ManualOperationType.ADJUST_SCORE,
            description,
            { type: 'ADJUST_SCORE', amount, reason },
            { finalScore: currentScore } as Partial<SinglePlayerGameState>,
            { finalScore: newScore } as Partial<SinglePlayerGameState>
          )

          set({
            gameState: {
              ...gameState,
              finalScore: newScore,
              manualOperations: [...gameState.manualOperations, operation],
              updatedAt: Date.now(),
            },
          })
        },

        undoOperation: () => {
          const { gameState } = get()
          if (!gameState || gameState.gameMode !== GameMode.MANUAL) return

          const { manualOperations } = gameState
          if (manualOperations.length === 0) {
            set({ error: '沒有可撤銷的操作' })
            return
          }

          // Get last operation
          const lastOperation = manualOperations[manualOperations.length - 1]
          if (!lastOperation.canUndo) {
            set({ error: '此操作不可撤銷' })
            return
          }

          // Restore state before operation
          const restoredState = { ...gameState }

          // Restore player stones if stored in stateBefore
          if (lastOperation.stateBefore.player?.stones) {
            restoredState.player = {
              ...restoredState.player,
              stones: lastOperation.stateBefore.player.stones,
            }
          }

          // Restore final score if stored in stateBefore
          if (lastOperation.stateBefore.finalScore !== undefined) {
            restoredState.finalScore = lastOperation.stateBefore.finalScore
          }

          // Remove last operation
          restoredState.manualOperations = manualOperations.slice(0, -1)
          restoredState.updatedAt = Date.now()

          set({ gameState: restoredState })
        },

        clearHistory: () => {
          const { gameState } = get()
          if (!gameState) return

          set({
            gameState: {
              ...gameState,
              manualOperations: [],
              updatedAt: Date.now(),
            },
          })
        },
      }
    }),
    { name: 'single-player-game-store' }
  )
)

// ============================================
// CACHED EMPTY ARRAYS
// ============================================
// Cache empty arrays to prevent infinite re-renders
const EMPTY_ARTIFACT_ARRAY: string[] = []
const EMPTY_CARD_ARRAY: CardInstance[] = []
const EMPTY_MARKET_ARRAY: CardInstance[] = []
const EMPTY_HAND_ARRAY: CardInstance[] = []
const EMPTY_FIELD_ARRAY: CardInstance[] = []
const EMPTY_DISCARD_ARRAY: CardInstance[] = []

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
  state.gameState?.market ?? EMPTY_MARKET_ARRAY

/**
 * Select player hand
 */
export const selectHand = (state: GameStore): CardInstance[] =>
  state.gameState?.player.hand ?? EMPTY_HAND_ARRAY

/**
 * Select player field
 */
export const selectField = (state: GameStore): CardInstance[] =>
  state.gameState?.player.field ?? EMPTY_FIELD_ARRAY

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
  state.gameState?.discardPile ?? EMPTY_DISCARD_ARRAY

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

/**
 * Select available artifacts for setup
 */
export const selectAvailableArtifacts = (state: GameStore): string[] =>
  state.gameState?.availableArtifacts ?? EMPTY_ARTIFACT_ARRAY

/**
 * Select selected artifact (artifact ID string)
 */
export const selectSelectedArtifact = (state: GameStore): string | null =>
  state.gameState?.selectedArtifact ?? null

/**
 * Select player's current turn cards (cards selected during DRAW phase)
 */
export const selectCurrentTurnCards = (state: GameStore): CardInstance[] =>
  state.gameState?.player.currentTurnCards ?? EMPTY_CARD_ARRAY

/**
 * Select player's selected artifact card instance
 */
export const selectSelectedArtifactCard = (state: GameStore): CardInstance | null =>
  state.gameState?.player.selectedArtifact ?? null

/**
 * Select initial cards for selection
 */
export const selectInitialCards = (state: GameStore): CardInstance[] =>
  state.gameState?.initialCards ?? EMPTY_CARD_ARRAY

/**
 * Select selected initial card
 */
export const selectSelectedInitialCard = (state: GameStore): string | null =>
  state.gameState?.selectedInitialCard ?? null

/**
 * Select if expansion mode is enabled
 */
export const selectIsExpansionMode = (state: GameStore): boolean =>
  state.gameState?.isExpansionMode ?? false

/**
 * Select artifact selection phase state
 */
export const selectArtifactSelectionPhase = (state: GameStore): { isComplete: boolean; confirmedArtifactId?: string | null } | null =>
  state.gameState?.artifactSelectionPhase ?? null

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

// Note: useTotalStoneValue and useAvailableActions removed due to infinite loop issues
// Use store methods getTotalStoneValue() and getAvailableActions() directly in components

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

/**
 * Hook to get available artifacts for setup
 */
export function useAvailableArtifacts(): string[] {
  return useGameStore(selectAvailableArtifacts)
}

/**
 * Hook to get selected artifact ID
 */
export function useSelectedArtifact(): string | null {
  return useGameStore(selectSelectedArtifact)
}

/**
 * Hook to get current turn cards (cards selected during DRAW phase)
 */
export function useCurrentTurnCards(): CardInstance[] {
  return useGameStore(selectCurrentTurnCards)
}

/**
 * Hook to get selected artifact card instance
 */
export function useSelectedArtifactCard(): CardInstance | null {
  return useGameStore(selectSelectedArtifactCard)
}

/**
 * Hook to get initial cards for selection
 */
export function useInitialCards(): CardInstance[] {
  return useGameStore(selectInitialCards)
}

/**
 * Hook to get selected initial card
 */
export function useSelectedInitialCard(): string | null {
  return useGameStore(selectSelectedInitialCard)
}

/**
 * Hook to get expansion mode status
 */
export function useIsExpansionMode(): boolean {
  return useGameStore(selectIsExpansionMode)
}

/**
 * Hook to get artifact selection phase state
 */
export function useArtifactSelectionPhase(): { isComplete: boolean; confirmedArtifactId?: string | null } | null {
  return useGameStore(selectArtifactSelectionPhase)
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
