/**
 * Game Store Tests
 * Tests Zustand store state management and selectors for Single Player Mode
 * @version 2.0.0 - Updated for Single Player Mode
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useGameStore,
  selectPhase,
  selectRound,
  selectMarket,
  selectHand,
  selectField,
  selectStones,
  selectIsGameOver,
  selectFinalScore,
  selectEndReason,
  selectDiscardPile,
  selectDeckSize,
  selectPlayerName,
  useGamePhase,
  useRound,
  useMarket,
  useHand,
  useField,
  useStones,
  useDeckSize,
  useDiscardPile,
  useGameOver,
  usePlayerName,
  SinglePlayerPhase,
  SinglePlayerActionType,
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
  })

  // ============================================
  // GAME LIFECYCLE TESTS
  // ============================================

  describe('startGame', () => {
    it('should initialize game with player name', () => {
      mockRandom([0.1])
      const { startGame } = useGameStore.getState()

      act(() => {
        startGame('Alice')
      })

      const { gameState } = useGameStore.getState()
      expect(gameState).not.toBeNull()
      expect(gameState?.player.name).toBe('Alice')
    })

    it('should set loading to false after start', () => {
      mockRandom([0.1])
      const { startGame } = useGameStore.getState()

      act(() => {
        startGame('Player 1')
      })

      const { isLoading } = useGameStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should clear error on successful start', () => {
      mockRandom([0.1])
      const store = useGameStore.getState()

      // Set an error first
      store.setError('Previous error')

      act(() => {
        store.startGame('Player 1')
      })

      const { error } = useGameStore.getState()
      expect(error).toBeNull()
    })

    it('should start in DRAW phase', () => {
      mockRandom([0.1])
      const { startGame } = useGameStore.getState()

      act(() => {
        startGame('Player 1')
      })

      const { gameState } = useGameStore.getState()
      expect(gameState?.phase).toBe(SinglePlayerPhase.DRAW)
    })

    it('should initialize with correct deck and market', () => {
      mockRandom([0.1])
      const { startGame } = useGameStore.getState()

      act(() => {
        startGame('Player 1')
      })

      const { gameState } = useGameStore.getState()
      expect(gameState?.market).toHaveLength(4)
      expect(gameState?.deck.length).toBeGreaterThan(0)
    })

    it('should initialize with empty hand and field', () => {
      mockRandom([0.1])
      const { startGame } = useGameStore.getState()

      act(() => {
        startGame('Player 1')
      })

      const { gameState } = useGameStore.getState()
      expect(gameState?.player.hand).toHaveLength(0)
      expect(gameState?.player.field).toHaveLength(0)
    })

    it('should initialize with correct stone pool', () => {
      mockRandom([0.1])
      const { startGame } = useGameStore.getState()

      act(() => {
        startGame('Player 1')
      })

      const { gameState } = useGameStore.getState()
      expect(gameState?.player.stones).toBeDefined()
      expect(gameState?.player.stones.ONE).toBe(0)
      expect(gameState?.player.stones.THREE).toBe(0)
      expect(gameState?.player.stones.SIX).toBe(0)
    })
  })

  describe('resetGame', () => {
    it('should clear gameState', () => {
      mockRandom([0.1])
      const store = useGameStore.getState()

      act(() => {
        store.startGame('Player 1')
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
  })

  // ============================================
  // DRAW PHASE ACTION TESTS
  // ============================================

  describe('Draw Phase Actions', () => {
    beforeEach(() => {
      mockRandom([0.1])
      const { startGame } = useGameStore.getState()
      act(() => {
        startGame('Player 1')
      })
    })

    describe('drawCard', () => {
      it('should add card to player hand', () => {
        const { drawCard } = useGameStore.getState()
        const stateBefore = useGameStore.getState().gameState

        act(() => {
          drawCard()
        })

        const stateAfter = useGameStore.getState().gameState
        expect(stateAfter?.player.hand.length).toBe((stateBefore?.player.hand.length || 0) + 1)
      })

      it('should transition to ACTION phase after drawing', () => {
        const { drawCard } = useGameStore.getState()

        act(() => {
          drawCard()
        })

        const { gameState } = useGameStore.getState()
        expect(gameState?.phase).toBe(SinglePlayerPhase.ACTION)
      })
    })
  })

  // ============================================
  // ACTION PHASE TESTS
  // ============================================

  describe('Action Phase Actions', () => {
    beforeEach(() => {
      mockRandom([0.1])
      const { startGame, drawCard } = useGameStore.getState()

      act(() => {
        startGame('Player 1')
      })

      // Draw card to enter ACTION phase
      act(() => {
        drawCard()
      })
    })

    describe('pass', () => {
      it('should transition back to DRAW phase', () => {
        const { pass } = useGameStore.getState()

        act(() => {
          pass()
        })

        const { gameState } = useGameStore.getState()
        expect(gameState?.phase).toBe(SinglePlayerPhase.DRAW)
      })

      it('should increment round', () => {
        const roundBefore = useGameStore.getState().gameState?.round || 0
        const { pass } = useGameStore.getState()

        act(() => {
          pass()
        })

        const { gameState } = useGameStore.getState()
        expect(gameState?.round).toBe(roundBefore + 1)
      })
    })

    describe('endGame', () => {
      it('should end the game', () => {
        const { endGame } = useGameStore.getState()

        act(() => {
          endGame()
        })

        const { gameState } = useGameStore.getState()
        expect(gameState?.isGameOver).toBe(true)
        expect(gameState?.phase).toBe(SinglePlayerPhase.SCORE)
      })

      it('should calculate final score', () => {
        const { endGame } = useGameStore.getState()

        act(() => {
          endGame()
        })

        const { gameState } = useGameStore.getState()
        expect(gameState?.finalScore).not.toBeNull()
      })
    })
  })

  // ============================================
  // QUERY METHODS TESTS
  // ============================================

  describe('Query Methods', () => {
    beforeEach(() => {
      mockRandom([0.1])
      const { startGame } = useGameStore.getState()

      act(() => {
        startGame('Player 1')
      })
    })

    describe('getAvailableActions', () => {
      it('should return DRAW_CARD in DRAW phase', () => {
        const { getAvailableActions } = useGameStore.getState()
        const actions = getAvailableActions()

        expect(actions).toContain(SinglePlayerActionType.DRAW_CARD)
      })

      it('should return appropriate actions in ACTION phase', () => {
        const { drawCard, getAvailableActions } = useGameStore.getState()

        act(() => {
          drawCard()
        })

        const actions = getAvailableActions()
        expect(actions).toContain(SinglePlayerActionType.PASS)
        expect(actions).toContain(SinglePlayerActionType.END_GAME)
      })
    })

    describe('getTotalStoneValue', () => {
      it('should return 0 when no stones', () => {
        const { getTotalStoneValue } = useGameStore.getState()
        expect(getTotalStoneValue()).toBe(0)
      })
    })

    describe('getTameableFromHand', () => {
      it('should return empty array when hand is empty', () => {
        const { getTameableFromHand } = useGameStore.getState()
        expect(getTameableFromHand()).toHaveLength(0)
      })
    })

    describe('getTameableFromMarket', () => {
      it('should return cards that can be tamed with enough stones', () => {
        const { getTameableFromMarket } = useGameStore.getState()
        const tameable = getTameableFromMarket()
        // With 0 stones, only free cards can be tamed
        expect(Array.isArray(tameable)).toBe(true)
      })
    })
  })

  // ============================================
  // SELECTOR TESTS
  // ============================================

  describe('Selectors', () => {
    beforeEach(() => {
      mockRandom([0.1])
      const { startGame } = useGameStore.getState()

      act(() => {
        startGame('Player 1')
      })
    })

    it('selectPhase should return current phase', () => {
      const state = useGameStore.getState()
      expect(selectPhase(state)).toBe(SinglePlayerPhase.DRAW)
    })

    it('selectRound should return current round', () => {
      const state = useGameStore.getState()
      expect(selectRound(state)).toBe(1)
    })

    it('selectMarket should return market cards', () => {
      const state = useGameStore.getState()
      expect(selectMarket(state)).toHaveLength(4)
    })

    it('selectHand should return player hand', () => {
      const state = useGameStore.getState()
      expect(selectHand(state)).toHaveLength(0)
    })

    it('selectField should return player field', () => {
      const state = useGameStore.getState()
      expect(selectField(state)).toHaveLength(0)
    })

    it('selectStones should return player stones', () => {
      const state = useGameStore.getState()
      expect(selectStones(state)).not.toBeNull()
    })

    it('selectIsGameOver should return false initially', () => {
      const state = useGameStore.getState()
      expect(selectIsGameOver(state)).toBe(false)
    })

    it('selectFinalScore should return null initially', () => {
      const state = useGameStore.getState()
      expect(selectFinalScore(state)).toBeNull()
    })

    it('selectEndReason should return null initially', () => {
      const state = useGameStore.getState()
      expect(selectEndReason(state)).toBeNull()
    })

    it('selectDiscardPile should return empty array initially', () => {
      const state = useGameStore.getState()
      expect(selectDiscardPile(state)).toHaveLength(0)
    })

    it('selectDeckSize should return remaining deck size', () => {
      const state = useGameStore.getState()
      expect(selectDeckSize(state)).toBeGreaterThan(0)
    })

    it('selectPlayerName should return player name', () => {
      const state = useGameStore.getState()
      expect(selectPlayerName(state)).toBe('Player 1')
    })
  })

  // ============================================
  // HOOK TESTS
  // ============================================

  describe('Hooks', () => {
    beforeEach(() => {
      mockRandom([0.1])

      act(() => {
        useGameStore.getState().startGame('Player 1')
      })
    })

    it('useGamePhase should return current phase', () => {
      const { result } = renderHook(() => useGamePhase())
      expect(result.current).toBe(SinglePlayerPhase.DRAW)
    })

    it('useRound should return current round', () => {
      const { result } = renderHook(() => useRound())
      expect(result.current).toBe(1)
    })

    it('useMarket should return market cards', () => {
      const { result } = renderHook(() => useMarket())
      expect(result.current).toHaveLength(4)
    })

    it('useHand should return player hand', () => {
      const { result } = renderHook(() => useHand())
      expect(result.current).toHaveLength(0)
    })

    it('useField should return player field', () => {
      const { result } = renderHook(() => useField())
      expect(result.current).toHaveLength(0)
    })

    it('useStones should return player stones', () => {
      const { result } = renderHook(() => useStones())
      expect(result.current).not.toBeNull()
    })

    it('useDeckSize should return deck size', () => {
      const { result } = renderHook(() => useDeckSize())
      expect(result.current).toBeGreaterThan(0)
    })

    it('useDiscardPile should return discard pile', () => {
      const { result } = renderHook(() => useDiscardPile())
      expect(result.current).toHaveLength(0)
    })

    it('useGameOver should return game over state', () => {
      const { result } = renderHook(() => useGameOver())
      expect(result.current.isOver).toBe(false)
      expect(result.current.score).toBeNull()
      expect(result.current.reason).toBeNull()
    })

    it('usePlayerName should return player name', () => {
      const { result } = renderHook(() => usePlayerName())
      expect(result.current).toBe('Player 1')
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

    it('syncState should sync from engine', () => {
      mockRandom([0.1])
      const { startGame, syncState } = useGameStore.getState()

      act(() => {
        startGame('Player 1')
      })

      act(() => {
        syncState()
      })

      // State should be synced from engine
      expect(useGameStore.getState().gameState).not.toBeNull()
    })
  })
})
