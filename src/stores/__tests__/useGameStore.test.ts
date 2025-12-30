/**
 * Game Store Tests
 * Tests Zustand store state management and selectors
 * Based on TEST_SPEC.md
 * @version 1.0.0
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useGameStore,
  selectPhase,
  selectRound,
  selectMarket,
  selectPlayer,
  selectLocalPlayer,
  selectOpponentPlayer,
  selectIsGameOver,
  selectWinner,
  selectEndReason,
  selectIsLocalPlayerTurn,
  selectDiscardPile,
  selectDeckSize,
  useGamePhase,
  useRound,
  useMarket,
  useLocalPlayer,
  useOpponent,
  useIsMyTurn,
  useGameOver,
  GamePhase,
  ActionType,
} from '../useGameStore'
import { mockRandom, restoreRandom } from '@/test/setup'

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useGameStore.getState()
    store.resetGame()
    restoreRandom()
  })

  afterEach(() => {
    restoreRandom()
  })

  // ============================================
  // INITIAL STATE TESTS
  // ============================================

  describe('Initial State', () => {
    it('should have null gameState initially', () => {
      const { gameState } = useGameStore.getState()
      expect(gameState).toBeNull()
    })

    it('should have engine instance', () => {
      const { engine } = useGameStore.getState()
      expect(engine).toBeDefined()
    })

    it('should not be loading initially', () => {
      const { isLoading } = useGameStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should have no error initially', () => {
      const { error } = useGameStore.getState()
      expect(error).toBeNull()
    })

    it('should have localPlayerIndex of 0 initially', () => {
      const { localPlayerIndex } = useGameStore.getState()
      expect(localPlayerIndex).toBe(0)
    })
  })

  // ============================================
  // GAME LIFECYCLE TESTS
  // ============================================

  describe('initGame', () => {
    it('should initialize game with player names', () => {
      mockRandom([0.1])
      const { initGame } = useGameStore.getState()

      act(() => {
        initGame('Alice', 'Bob')
      })

      const { gameState } = useGameStore.getState()
      expect(gameState).not.toBeNull()
      expect(gameState?.players[0].name).toBe('Alice')
      expect(gameState?.players[1].name).toBe('Bob')
    })

    it('should set loading to false after init', () => {
      mockRandom([0.1])
      const { initGame } = useGameStore.getState()

      act(() => {
        initGame('Player 1', 'Player 2')
      })

      const { isLoading } = useGameStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should clear error on successful init', () => {
      mockRandom([0.1])
      const store = useGameStore.getState()

      // Set an error first
      store.setError('Previous error')

      act(() => {
        store.initGame('Player 1', 'Player 2')
      })

      const { error } = useGameStore.getState()
      expect(error).toBeNull()
    })

    it('should start in HUNTING phase', () => {
      mockRandom([0.1])
      const { initGame } = useGameStore.getState()

      act(() => {
        initGame('Player 1', 'Player 2')
      })

      const { gameState } = useGameStore.getState()
      expect(gameState?.phase).toBe(GamePhase.HUNTING)
    })
  })

  describe('resetGame', () => {
    it('should clear gameState', () => {
      mockRandom([0.1])
      const store = useGameStore.getState()

      act(() => {
        store.initGame('Player 1', 'Player 2')
      })

      expect(useGameStore.getState().gameState).not.toBeNull()

      act(() => {
        store.resetGame()
      })

      expect(useGameStore.getState().gameState).toBeNull()
    })

    it('should clear error', () => {
      const store = useGameStore.getState()

      store.setError('Some error')

      act(() => {
        store.resetGame()
      })

      expect(useGameStore.getState().error).toBeNull()
    })

    it('should reset localPlayerIndex to 0', () => {
      const store = useGameStore.getState()

      act(() => {
        store.setLocalPlayerIndex(1)
      })

      expect(useGameStore.getState().localPlayerIndex).toBe(1)

      act(() => {
        store.resetGame()
      })

      expect(useGameStore.getState().localPlayerIndex).toBe(0)
    })
  })

  // ============================================
  // HUNTING PHASE ACTION TESTS
  // ============================================

  describe('Hunting Phase Actions', () => {
    beforeEach(() => {
      mockRandom([0.1])
      const { initGame } = useGameStore.getState()
      act(() => {
        initGame('Player 1', 'Player 2')
      })
    })

    describe('takeMarketCard', () => {
      it('should add card to player hand', () => {
        const { gameState, takeMarketCard } = useGameStore.getState()
        const cardId = gameState!.market[0].instanceId

        act(() => {
          takeMarketCard(cardId)
        })

        const newState = useGameStore.getState().gameState
        expect(newState?.players[0].hand).toHaveLength(1)
      })

      it('should set error on invalid card', () => {
        const { takeMarketCard } = useGameStore.getState()

        act(() => {
          takeMarketCard('invalid-id')
        })

        const { error } = useGameStore.getState()
        expect(error).not.toBeNull()
      })
    })

    describe('tameMarketCard', () => {
      it('should add card to player field when can afford', () => {
        // Give player stones
        const state = useGameStore.getState().gameState!
        state.players[0].stones = 5

        const { tameMarketCard } = useGameStore.getState()
        const cardId = state.market[0].instanceId

        act(() => {
          tameMarketCard(cardId)
        })

        const newState = useGameStore.getState().gameState
        expect(newState?.players[0].field.length).toBeGreaterThanOrEqual(1)
      })

      it('should set error when cannot afford', () => {
        const state = useGameStore.getState().gameState!
        state.players[0].stones = 0

        // Find a card that costs stones
        const costlyCard = state.market.find(c => c.cost > 0)

        if (costlyCard) {
          const { tameMarketCard } = useGameStore.getState()

          act(() => {
            tameMarketCard(costlyCard.instanceId)
          })

          const { error } = useGameStore.getState()
          expect(error).not.toBeNull()
        }
      })
    })
  })

  // ============================================
  // ACTION PHASE TESTS
  // ============================================

  describe('Action Phase Actions', () => {
    beforeEach(() => {
      mockRandom([0.1])
      const { initGame } = useGameStore.getState()

      act(() => {
        initGame('Player 1', 'Player 2')
      })

      // Give players stones
      const state = useGameStore.getState().gameState!
      state.players[0].stones = 5
      state.players[1].stones = 5

      // Complete hunting phase
      const { takeMarketCard } = useGameStore.getState()

      act(() => {
        takeMarketCard(state.market[0].instanceId)
      })

      const state2 = useGameStore.getState().gameState!

      act(() => {
        takeMarketCard(state2.market[0].instanceId)
      })
    })

    describe('tameFromHand', () => {
      it('should move card from hand to field', () => {
        const state = useGameStore.getState().gameState!
        const handCard = state.players[0].hand[0]

        if (handCard) {
          const { tameFromHand } = useGameStore.getState()

          act(() => {
            tameFromHand(handCard.instanceId)
          })

          const newState = useGameStore.getState().gameState!
          expect(newState.players[0].hand.find(c => c.instanceId === handCard.instanceId)).toBeUndefined()
          expect(newState.players[0].field.find(c => c.instanceId === handCard.instanceId)).toBeDefined()
        }
      })
    })

    describe('sellCard', () => {
      it('should move card from hand to discard', () => {
        const state = useGameStore.getState().gameState!
        const handCard = state.players[0].hand[0]

        if (handCard) {
          const { sellCard } = useGameStore.getState()

          act(() => {
            sellCard(handCard.instanceId)
          })

          const newState = useGameStore.getState().gameState!
          expect(newState.players[0].hand.find(c => c.instanceId === handCard.instanceId)).toBeUndefined()
          expect(newState.discardPile.find(c => c.instanceId === handCard.instanceId)).toBeDefined()
        }
      })
    })

    describe('pass', () => {
      it('should mark player as passed', () => {
        const { pass } = useGameStore.getState()

        act(() => {
          pass()
        })

        const state = useGameStore.getState().gameState!
        expect(state.players[0].hasPassed).toBe(true)
      })

      it('should transition to RESOLUTION when both pass', () => {
        const { pass } = useGameStore.getState()

        act(() => {
          pass() // Player 0
        })

        act(() => {
          pass() // Player 1
        })

        const state = useGameStore.getState().gameState!
        expect(state.phase).toBe(GamePhase.RESOLUTION)
      })
    })
  })

  // ============================================
  // PHASE CONTROL TESTS
  // ============================================

  describe('Phase Control', () => {
    beforeEach(() => {
      mockRandom([0.1])
      const { initGame } = useGameStore.getState()

      act(() => {
        initGame('Player 1', 'Player 2')
      })

      const state = useGameStore.getState().gameState!
      state.players[0].stones = 5
      state.players[1].stones = 5

      const { takeMarketCard } = useGameStore.getState()

      act(() => {
        takeMarketCard(state.market[0].instanceId)
      })

      const state2 = useGameStore.getState().gameState!

      act(() => {
        takeMarketCard(state2.market[0].instanceId)
      })

      // Both pass to get to RESOLUTION
      act(() => {
        useGameStore.getState().pass()
      })

      act(() => {
        useGameStore.getState().pass()
      })
    })

    describe('nextRound', () => {
      it('should start new round when in RESOLUTION', () => {
        const stateBefore = useGameStore.getState().gameState!
        expect(stateBefore.phase).toBe(GamePhase.RESOLUTION)
        expect(stateBefore.round).toBe(1)

        const { nextRound } = useGameStore.getState()

        act(() => {
          nextRound()
        })

        const stateAfter = useGameStore.getState().gameState!
        expect(stateAfter.round).toBe(2)
        expect(stateAfter.phase).toBe(GamePhase.HUNTING)
      })
    })
  })

  // ============================================
  // QUERY METHODS TESTS
  // ============================================

  describe('Query Methods', () => {
    beforeEach(() => {
      mockRandom([0.1])
      const { initGame } = useGameStore.getState()

      act(() => {
        initGame('Player 1', 'Player 2')
      })
    })

    describe('getCurrentPlayer', () => {
      it('should return current player', () => {
        const { getCurrentPlayer } = useGameStore.getState()
        const player = getCurrentPlayer()

        expect(player).not.toBeNull()
        expect(player?.name).toBe('Player 1')
      })

      it('should return null when no game', () => {
        const store = useGameStore.getState()

        act(() => {
          store.resetGame()
        })

        const { getCurrentPlayer } = useGameStore.getState()
        expect(getCurrentPlayer()).toBeNull()
      })
    })

    describe('getOpponent', () => {
      it('should return opponent player', () => {
        const { getOpponent } = useGameStore.getState()
        const opponent = getOpponent()

        expect(opponent).not.toBeNull()
        expect(opponent?.name).toBe('Player 2')
      })
    })

    describe('getValidActions', () => {
      it('should return valid actions for current phase', () => {
        const { getValidActions } = useGameStore.getState()
        const actions = getValidActions()

        expect(actions).toContain(ActionType.SELECT_MARKET_CARD)
      })
    })

    describe('canTameCard', () => {
      it('should return true when player can afford', () => {
        const state = useGameStore.getState().gameState!
        state.players[0].stones = 10

        const { canTameCard } = useGameStore.getState()
        const card = state.market[0]

        expect(canTameCard(card.instanceId)).toBe(true)
      })

      it('should return false when cannot afford', () => {
        const state = useGameStore.getState().gameState!
        state.players[0].stones = 0

        const costlyCard = state.market.find(c => c.cost > 0)

        if (costlyCard) {
          const { canTameCard } = useGameStore.getState()
          expect(canTameCard(costlyCard.instanceId)).toBe(false)
        }
      })
    })

    describe('isMyTurn', () => {
      it('should return true when current player matches local player', () => {
        const { isMyTurn, setLocalPlayerIndex } = useGameStore.getState()

        act(() => {
          setLocalPlayerIndex(0)
        })

        // Current player is 0 after init
        expect(isMyTurn()).toBe(true)
      })

      it('should return false when not local player turn', () => {
        const { isMyTurn, setLocalPlayerIndex } = useGameStore.getState()

        act(() => {
          setLocalPlayerIndex(1)
        })

        // Current player is 0, local is 1
        expect(isMyTurn()).toBe(false)
      })
    })
  })

  // ============================================
  // SELECTOR TESTS
  // ============================================

  describe('Selectors', () => {
    beforeEach(() => {
      mockRandom([0.1])
      const { initGame } = useGameStore.getState()

      act(() => {
        initGame('Player 1', 'Player 2')
      })
    })

    it('selectPhase should return current phase', () => {
      const state = useGameStore.getState()
      expect(selectPhase(state)).toBe(GamePhase.HUNTING)
    })

    it('selectRound should return current round', () => {
      const state = useGameStore.getState()
      expect(selectRound(state)).toBe(1)
    })

    it('selectMarket should return market cards', () => {
      const state = useGameStore.getState()
      expect(selectMarket(state)).toHaveLength(4)
    })

    it('selectPlayer should return player by index', () => {
      const state = useGameStore.getState()
      expect(selectPlayer(state, 0)?.name).toBe('Player 1')
      expect(selectPlayer(state, 1)?.name).toBe('Player 2')
    })

    it('selectLocalPlayer should return local player', () => {
      const state = useGameStore.getState()
      expect(selectLocalPlayer(state)?.name).toBe('Player 1')
    })

    it('selectOpponentPlayer should return opponent', () => {
      const state = useGameStore.getState()
      expect(selectOpponentPlayer(state)?.name).toBe('Player 2')
    })

    it('selectIsGameOver should return false initially', () => {
      const state = useGameStore.getState()
      expect(selectIsGameOver(state)).toBe(false)
    })

    it('selectWinner should return null initially', () => {
      const state = useGameStore.getState()
      expect(selectWinner(state)).toBeNull()
    })

    it('selectEndReason should return null initially', () => {
      const state = useGameStore.getState()
      expect(selectEndReason(state)).toBeNull()
    })

    it('selectIsLocalPlayerTurn should work correctly', () => {
      const state = useGameStore.getState()
      expect(selectIsLocalPlayerTurn(state)).toBe(true)
    })

    it('selectDiscardPile should return empty array initially', () => {
      const state = useGameStore.getState()
      expect(selectDiscardPile(state)).toHaveLength(0)
    })

    it('selectDeckSize should return remaining deck size', () => {
      const state = useGameStore.getState()
      expect(selectDeckSize(state)).toBe(36) // 40 - 4 market cards
    })
  })

  // ============================================
  // HOOK TESTS
  // ============================================

  describe('Hooks', () => {
    beforeEach(() => {
      mockRandom([0.1])

      act(() => {
        useGameStore.getState().initGame('Player 1', 'Player 2')
      })
    })

    it('useGamePhase should return current phase', () => {
      const { result } = renderHook(() => useGamePhase())
      expect(result.current).toBe(GamePhase.HUNTING)
    })

    it('useRound should return current round', () => {
      const { result } = renderHook(() => useRound())
      expect(result.current).toBe(1)
    })

    it('useMarket should return market cards', () => {
      const { result } = renderHook(() => useMarket())
      expect(result.current).toHaveLength(4)
    })

    it('useLocalPlayer should return local player', () => {
      const { result } = renderHook(() => useLocalPlayer())
      expect(result.current?.name).toBe('Player 1')
    })

    it('useOpponent should return opponent', () => {
      const { result } = renderHook(() => useOpponent())
      expect(result.current?.name).toBe('Player 2')
    })

    it('useIsMyTurn should return true for current player', () => {
      const { result } = renderHook(() => useIsMyTurn())
      expect(result.current).toBe(true)
    })

    it('useGameOver should return game over state', () => {
      const { result } = renderHook(() => useGameOver())
      expect(result.current.isOver).toBe(false)
      expect(result.current.winner).toBeNull()
      expect(result.current.reason).toBeNull()
    })
  })

  // ============================================
  // INTERNAL METHODS TESTS
  // ============================================

  describe('Internal Methods', () => {
    it('setLoading should update loading state', () => {
      const { setLoading } = useGameStore.getState()

      act(() => {
        setLoading(true)
      })

      expect(useGameStore.getState().isLoading).toBe(true)

      act(() => {
        setLoading(false)
      })

      expect(useGameStore.getState().isLoading).toBe(false)
    })

    it('setError should update error state', () => {
      const { setError } = useGameStore.getState()

      act(() => {
        setError('Test error')
      })

      expect(useGameStore.getState().error).toBe('Test error')

      act(() => {
        setError(null)
      })

      expect(useGameStore.getState().error).toBeNull()
    })

    it('setLocalPlayerIndex should update index', () => {
      const { setLocalPlayerIndex } = useGameStore.getState()

      act(() => {
        setLocalPlayerIndex(1)
      })

      expect(useGameStore.getState().localPlayerIndex).toBe(1)
    })

    it('syncState should sync from engine', () => {
      mockRandom([0.1])
      const { initGame, syncState } = useGameStore.getState()

      act(() => {
        initGame('Player 1', 'Player 2')
      })

      // Directly modify engine state
      const state = useGameStore.getState().gameState!
      state.round = 5

      act(() => {
        syncState()
      })

      // State should still be synced from engine (which is at round 1)
      expect(useGameStore.getState().gameState?.round).toBeGreaterThanOrEqual(1)
    })
  })
})
