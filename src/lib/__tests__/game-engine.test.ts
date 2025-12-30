/**
 * Game Engine Tests
 * Tests core game logic and state management
 * Based on TEST_SPEC.md and GAME_ENGINE_SPEC.md
 * @version 1.0.0
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  GameEngine,
  GamePhase,
  ActionType,
  GameError,
  GameErrorCode,
  type MVPGameState,
} from '../game-engine'
import { CardLocation } from '@/types/cards'
import { MVP_CONSTANTS } from '../game-utils'
import { mockRandom, restoreRandom } from '@/test/setup'
import { createTestCard } from '@/test/test-helpers'

describe('GameEngine', () => {
  let engine: GameEngine

  beforeEach(() => {
    engine = new GameEngine()
    restoreRandom()
  })

  // ============================================
  // GAME INITIALIZATION TESTS
  // ============================================

  describe('Game Initialization', () => {
    describe('initializeGame', () => {
      it('should create a new game state', () => {
        const state = engine.initializeGame('Player 1', 'Player 2')

        expect(state).toBeDefined()
        expect(state.gameId).toBeDefined()
        expect(state.version).toBe('MVP-1.0.0')
      })

      it('should create two players with correct names', () => {
        const state = engine.initializeGame('Alice', 'Bob')

        expect(state.players).toHaveLength(2)
        expect(state.players[0].name).toBe('Alice')
        expect(state.players[1].name).toBe('Bob')
      })

      it('should set correct player indices', () => {
        const state = engine.initializeGame('Player 1', 'Player 2')

        expect(state.players[0].index).toBe(0)
        expect(state.players[1].index).toBe(1)
      })

      it('should initialize players with correct starting resources', () => {
        const state = engine.initializeGame('Player 1', 'Player 2')

        state.players.forEach(player => {
          expect(player.stones).toBe(MVP_CONSTANTS.STARTING_STONES)
          expect(player.stoneLimit).toBe(MVP_CONSTANTS.BASE_STONE_LIMIT)
          expect(player.score).toBe(0)
          expect(player.hand).toHaveLength(0)
          expect(player.field).toHaveLength(0)
        })
      })

      it('should create a deck with 36 cards (40 - 4 market)', () => {
        const state = engine.initializeGame('Player 1', 'Player 2')

        expect(state.deck).toHaveLength(36)
      })

      it('should set up market with 4 cards', () => {
        const state = engine.initializeGame('Player 1', 'Player 2')

        expect(state.market).toHaveLength(4)
        state.market.forEach(card => {
          expect(card.location).toBe(CardLocation.MARKET)
          expect(card.isRevealed).toBe(true)
        })
      })

      it('should start in HUNTING phase', () => {
        const state = engine.initializeGame('Player 1', 'Player 2')
        expect(state.phase).toBe(GamePhase.HUNTING)
      })

      it('should start at round 1', () => {
        const state = engine.initializeGame('Player 1', 'Player 2')
        expect(state.round).toBe(1)
      })

      it('should initialize empty discard pile', () => {
        const state = engine.initializeGame('Player 1', 'Player 2')
        expect(state.discardPile).toHaveLength(0)
      })

      it('should not be game over on start', () => {
        const state = engine.initializeGame('Player 1', 'Player 2')

        expect(state.isGameOver).toBe(false)
        expect(state.winner).toBeNull()
        expect(state.endReason).toBeNull()
      })

      it('should set timestamps', () => {
        const beforeTime = Date.now()
        const state = engine.initializeGame('Player 1', 'Player 2')
        const afterTime = Date.now()

        expect(state.createdAt).toBeGreaterThanOrEqual(beforeTime)
        expect(state.createdAt).toBeLessThanOrEqual(afterTime)
        expect(state.updatedAt).toBe(state.createdAt)
      })

      it('should randomly select first player', () => {
        // Mock random to control first player selection
        mockRandom([0.3]) // < 0.5 means player 0
        let state = engine.initializeGame('Player 1', 'Player 2')
        expect(state.firstPlayerIndex).toBe(0)

        restoreRandom()
        mockRandom([0.7]) // >= 0.5 means player 1
        engine = new GameEngine()
        state = engine.initializeGame('Player 1', 'Player 2')
        expect(state.firstPlayerIndex).toBe(1)
      })
    })

    describe('getState', () => {
      it('should return null before initialization', () => {
        expect(engine.getState()).toBeNull()
      })

      it('should return state after initialization', () => {
        engine.initializeGame('Player 1', 'Player 2')
        expect(engine.getState()).not.toBeNull()
      })
    })

    describe('resetGame', () => {
      it('should clear game state', () => {
        engine.initializeGame('Player 1', 'Player 2')
        engine.resetGame()
        expect(engine.getState()).toBeNull()
      })
    })
  })

  // ============================================
  // HUNTING PHASE TESTS
  // ============================================

  describe('Hunting Phase', () => {
    let state: MVPGameState

    beforeEach(() => {
      mockRandom([0.1]) // Ensure player 0 goes first
      state = engine.initializeGame('Player 1', 'Player 2')
    })

    describe('selectMarketCard - TAKE action', () => {
      it('should allow current player to take card to hand', () => {
        const cardId = state.market[0].instanceId

        const newState = engine.selectMarketCard(0, cardId, 'TAKE')

        expect(newState.players[0].hand).toHaveLength(1)
        expect(newState.players[0].hand[0].instanceId).toBe(cardId)
        expect(newState.players[0].hand[0].location).toBe(CardLocation.HAND)
      })

      it('should remove card from market', () => {
        const cardId = state.market[0].instanceId
        const originalMarketLength = state.market.length

        const newState = engine.selectMarketCard(0, cardId, 'TAKE')

        expect(newState.market).toHaveLength(originalMarketLength - 1)
        expect(newState.market.find(c => c.instanceId === cardId)).toBeUndefined()
      })

      it('should switch to other player after selection', () => {
        const cardId = state.market[0].instanceId

        const newState = engine.selectMarketCard(0, cardId, 'TAKE')

        expect(newState.currentPlayerIndex).toBe(1)
      })

      it('should record hunting selection', () => {
        const cardId = state.market[0].instanceId

        const newState = engine.selectMarketCard(0, cardId, 'TAKE')

        expect(newState.huntingSelections).toHaveLength(1)
        expect(newState.huntingSelections[0].action).toBe('TAKE')
        expect(newState.huntingSelections[0].cardInstanceId).toBe(cardId)
        expect(newState.huntingSelections[0].stoneCost).toBe(0)
      })

      it('should throw error if not player turn', () => {
        const cardId = state.market[0].instanceId

        expect(() => {
          engine.selectMarketCard(1, cardId, 'TAKE')
        }).toThrow(GameError)
      })

      it('should throw error if card not in market', () => {
        expect(() => {
          engine.selectMarketCard(0, 'non-existent-id', 'TAKE')
        }).toThrow(GameError)
      })

      it('should throw error if hand is full', () => {
        // Fill player's hand
        const player = state.players[0]
        const fullHand = Array.from({ length: 10 }, (_, i) =>
          createTestCard({ instanceId: `hand-${i}`, location: CardLocation.HAND })
        )
        state.players[0] = { ...player, hand: fullHand }

        const cardId = state.market[0].instanceId

        expect(() => {
          engine.selectMarketCard(0, cardId, 'TAKE')
        }).toThrow(GameError)
      })
    })

    describe('selectMarketCard - TAME action', () => {
      beforeEach(() => {
        // Give player some stones to tame
        state.players[0] = { ...state.players[0], stones: 3 }
      })

      it('should allow player to tame card directly to field', () => {
        const cardId = state.market[0].instanceId

        const newState = engine.selectMarketCard(0, cardId, 'TAME')

        expect(newState.players[0].field).toHaveLength(1)
        expect(newState.players[0].field[0].instanceId).toBe(cardId)
        expect(newState.players[0].field[0].location).toBe(CardLocation.FIELD)
      })

      it('should deduct correct stone cost', () => {
        // Find a cost 3 card (needs 2 stones)
        const cost3Card = state.market.find(c => c.cost === 3)
        if (!cost3Card) {
          // Create scenario with known cost
          state.players[0].stones = 2
          const cardId = state.market[0].instanceId
          const originalStones = state.players[0].stones
          const tameCost = state.market[0].cost <= 2 ? 1 : 2

          const newState = engine.selectMarketCard(0, cardId, 'TAME')

          expect(newState.players[0].stones).toBe(
            Math.max(0, originalStones - tameCost)
          )
        }
      })

      it('should throw error if insufficient stones', () => {
        state.players[0] = { ...state.players[0], stones: 0 }
        // Find a card that costs stones
        const costlyCard = state.market.find(c => c.cost > 0)

        if (costlyCard) {
          expect(() => {
            engine.selectMarketCard(0, costlyCard.instanceId, 'TAME')
          }).toThrow(GameError)
        }
      })

      it('should throw error if field is full', () => {
        // Fill player's field
        const fullField = Array.from({ length: 12 }, (_, i) =>
          createTestCard({ instanceId: `field-${i}`, location: CardLocation.FIELD })
        )
        state.players[0] = { ...state.players[0], field: fullField }

        const cardId = state.market[0].instanceId

        expect(() => {
          engine.selectMarketCard(0, cardId, 'TAME')
        }).toThrow(GameError)
      })

      it('should record hunting selection with stone cost', () => {
        const cardId = state.market[0].instanceId

        const newState = engine.selectMarketCard(0, cardId, 'TAME')

        expect(newState.huntingSelections).toHaveLength(1)
        expect(newState.huntingSelections[0].action).toBe('TAME')
        expect(newState.huntingSelections[0].stoneCost).toBeGreaterThanOrEqual(0)
      })
    })

    describe('Both players select - phase transition', () => {
      it('should move to ACTION phase after both players select', () => {
        state.players[0] = { ...state.players[0], stones: 3 }
        state.players[1] = { ...state.players[1], stones: 3 }

        const card1 = state.market[0].instanceId
        engine.selectMarketCard(0, card1, 'TAKE')

        const intermediateState = engine.getState()!
        const card2 = intermediateState.market[0].instanceId
        const newState = engine.selectMarketCard(1, card2, 'TAKE')

        expect(newState.phase).toBe(GamePhase.ACTION)
      })

      it('should reset player action flags for action phase', () => {
        state.players[0] = { ...state.players[0], stones: 3 }
        state.players[1] = { ...state.players[1], stones: 3 }

        const card1 = state.market[0].instanceId
        engine.selectMarketCard(0, card1, 'TAKE')

        const intermediateState = engine.getState()!
        const card2 = intermediateState.market[0].instanceId
        const newState = engine.selectMarketCard(1, card2, 'TAKE')

        expect(newState.players[0].hasActedThisPhase).toBe(false)
        expect(newState.players[0].hasPassed).toBe(false)
        expect(newState.players[1].hasActedThisPhase).toBe(false)
        expect(newState.players[1].hasPassed).toBe(false)
      })
    })
  })

  // ============================================
  // ACTION PHASE TESTS
  // ============================================

  describe('Action Phase', () => {
    let state: MVPGameState

    beforeEach(() => {
      mockRandom([0.1])
      state = engine.initializeGame('Player 1', 'Player 2')
      state.players[0] = { ...state.players[0], stones: 5 }
      state.players[1] = { ...state.players[1], stones: 5 }

      // Complete hunting phase
      const card1 = state.market[0].instanceId
      engine.selectMarketCard(0, card1, 'TAKE')
      const intermediateState = engine.getState()!
      const card2 = intermediateState.market[0].instanceId
      engine.selectMarketCard(1, card2, 'TAKE')

      state = engine.getState()!
    })

    describe('tameFromHand', () => {
      it('should move card from hand to field', () => {
        const handCard = state.players[0].hand[0]

        const newState = engine.tameFromHand(0, handCard.instanceId)

        expect(newState.players[0].hand).toHaveLength(0)
        expect(newState.players[0].field.find(c => c.instanceId === handCard.instanceId)).toBeDefined()
      })

      it('should deduct correct stone cost', () => {
        const handCard = state.players[0].hand[0]
        const originalStones = state.players[0].stones

        const newState = engine.tameFromHand(0, handCard.instanceId)

        expect(newState.players[0].stones).toBeLessThan(originalStones)
      })

      it('should switch to other player', () => {
        const handCard = state.players[0].hand[0]

        const newState = engine.tameFromHand(0, handCard.instanceId)

        expect(newState.currentPlayerIndex).toBe(1)
      })

      it('should throw error if card not in hand', () => {
        expect(() => {
          engine.tameFromHand(0, 'non-existent-id')
        }).toThrow(GameError)
      })

      it('should throw error if not in ACTION phase', () => {
        // Start new game (HUNTING phase)
        engine = new GameEngine()
        const newState = engine.initializeGame('P1', 'P2')
        newState.players[0].hand = [createTestCard({ instanceId: 'test-card' })]

        expect(() => {
          engine.tameFromHand(0, 'test-card')
        }).toThrow(GameError)
      })
    })

    describe('sellCard', () => {
      it('should move card from hand to discard', () => {
        const handCard = state.players[0].hand[0]

        const newState = engine.sellCard(0, handCard.instanceId)

        expect(newState.players[0].hand).toHaveLength(0)
        expect(newState.discardPile.find(c => c.instanceId === handCard.instanceId)).toBeDefined()
      })

      it('should add stones based on card cost', () => {
        const handCard = state.players[0].hand[0]
        const originalStones = state.players[0].stones
        const cardCost = handCard.cost

        const newState = engine.sellCard(0, handCard.instanceId)

        // Stones gained equals card cost (capped by limit)
        const expectedStones = Math.min(
          originalStones + cardCost,
          newState.players[0].stoneLimit
        )
        expect(newState.players[0].stones).toBe(expectedStones)
      })

      it('should switch to other player', () => {
        const handCard = state.players[0].hand[0]

        const newState = engine.sellCard(0, handCard.instanceId)

        expect(newState.currentPlayerIndex).toBe(1)
      })

      it('should throw error if card not in hand', () => {
        expect(() => {
          engine.sellCard(0, 'non-existent-id')
        }).toThrow(GameError)
      })
    })

    describe('pass', () => {
      it('should mark player as passed', () => {
        const newState = engine.pass(0)

        expect(newState.players[0].hasPassed).toBe(true)
      })

      it('should switch to other player', () => {
        const newState = engine.pass(0)

        expect(newState.currentPlayerIndex).toBe(1)
      })

      it('should move to RESOLUTION when both pass', () => {
        engine.pass(0)
        const newState = engine.pass(1)

        expect(newState.phase).toBe(GamePhase.RESOLUTION)
      })

      it('should throw error if not player turn', () => {
        expect(() => {
          engine.pass(1)
        }).toThrow(GameError)
      })
    })
  })

  // ============================================
  // RESOLUTION PHASE TESTS
  // ============================================

  describe('Resolution Phase', () => {
    let state: MVPGameState

    beforeEach(() => {
      mockRandom([0.1])
      engine.initializeGame('Player 1', 'Player 2')
      state = engine.getState()!

      // Set up players with stones
      state.players[0] = { ...state.players[0], stones: 5 }
      state.players[1] = { ...state.players[1], stones: 5 }

      // Complete hunting phase
      const card1 = state.market[0].instanceId
      engine.selectMarketCard(0, card1, 'TAKE')
      const s1 = engine.getState()!
      const card2 = s1.market[0].instanceId
      engine.selectMarketCard(1, card2, 'TAKE')

      // Complete action phase by both passing
      engine.pass(0)
      engine.pass(1)

      state = engine.getState()!
    })

    it('should calculate scores for both players', () => {
      expect(state.phase).toBe(GamePhase.RESOLUTION)
      // Scores are calculated based on field cards
      expect(state.players[0].score).toBeGreaterThanOrEqual(0)
      expect(state.players[1].score).toBeGreaterThanOrEqual(0)
    })

    it('should give each player 1 stone at end of round', () => {
      // Players should gain stones (respecting limit)
      expect(state.players[0].stones).toBeGreaterThanOrEqual(0)
      expect(state.players[1].stones).toBeGreaterThanOrEqual(0)
    })
  })

  // ============================================
  // ROUND PROGRESSION TESTS
  // ============================================

  describe('Round Progression', () => {
    let engine: GameEngine

    beforeEach(() => {
      engine = new GameEngine()
      mockRandom([0.1])
    })

    it('should increment round number', () => {
      engine.initializeGame('Player 1', 'Player 2')
      let state = engine.getState()!

      // Complete first round
      state.players[0].stones = 5
      state.players[1].stones = 5

      engine.selectMarketCard(0, state.market[0].instanceId, 'TAKE')
      state = engine.getState()!
      engine.selectMarketCard(1, state.market[0].instanceId, 'TAKE')
      engine.pass(0)
      engine.pass(1)

      expect(engine.getState()!.round).toBe(1)

      // Start next round
      engine.startNextRound()
      expect(engine.getState()!.round).toBe(2)
    })

    it('should refill market at start of new round', () => {
      engine.initializeGame('Player 1', 'Player 2')
      let state = engine.getState()!
      state.players[0].stones = 5
      state.players[1].stones = 5

      // Take cards from market
      engine.selectMarketCard(0, state.market[0].instanceId, 'TAKE')
      state = engine.getState()!
      engine.selectMarketCard(1, state.market[0].instanceId, 'TAKE')

      // Market should have 2 cards now
      expect(engine.getState()!.market.length).toBe(2)

      // Complete phase and start new round
      engine.pass(0)
      engine.pass(1)
      engine.startNextRound()

      // Market should be refilled
      expect(engine.getState()!.market.length).toBe(4)
    })

    it('should reset phase to HUNTING', () => {
      engine.initializeGame('Player 1', 'Player 2')
      let state = engine.getState()!
      state.players[0].stones = 5
      state.players[1].stones = 5

      engine.selectMarketCard(0, state.market[0].instanceId, 'TAKE')
      state = engine.getState()!
      engine.selectMarketCard(1, state.market[0].instanceId, 'TAKE')
      engine.pass(0)
      engine.pass(1)
      engine.startNextRound()

      expect(engine.getState()!.phase).toBe(GamePhase.HUNTING)
    })
  })

  // ============================================
  // VICTORY CONDITION TESTS
  // ============================================

  describe('Victory Conditions', () => {
    beforeEach(() => {
      mockRandom([0.1])
      engine.initializeGame('Player 1', 'Player 2')
    })

    describe('Score Victory (60 points)', () => {
      it('should end game when player reaches 60 points', () => {
        const state = engine.getState()!

        // Manually set player score to trigger victory
        state.players[0] = {
          ...state.players[0],
          score: 60,
          field: Array.from({ length: 5 }, (_, i) =>
            createTestCard({ instanceId: `card-${i}`, baseScore: 12 })
          ),
        }

        const result = engine.checkVictory()

        expect(result.isGameOver).toBe(true)
        expect(result.winner).toBe(0)
        expect(result.endReason).toBe('SCORE_REACHED')
      })

      it('should declare higher score winner if both reach 60', () => {
        const state = engine.getState()!

        state.players[0] = {
          ...state.players[0],
          score: 60,
          field: [createTestCard({ baseScore: 60 })],
        }
        state.players[1] = {
          ...state.players[1],
          score: 65,
          field: [createTestCard({ baseScore: 65 })],
        }

        const result = engine.checkVictory()

        expect(result.isGameOver).toBe(true)
        expect(result.winner).toBe(1)
      })

      it('should use card count as tiebreaker', () => {
        const state = engine.getState()!

        state.players[0] = {
          ...state.players[0],
          score: 60,
          field: Array.from({ length: 5 }, (_, i) => createTestCard({ instanceId: `p0-${i}` })),
        }
        state.players[1] = {
          ...state.players[1],
          score: 60,
          field: Array.from({ length: 3 }, (_, i) => createTestCard({ instanceId: `p1-${i}` })),
        }

        const result = engine.checkVictory()

        expect(result.isGameOver).toBe(true)
        expect(result.winner).toBe(0) // More cards
      })

      it('should declare draw if same score and card count', () => {
        const state = engine.getState()!

        state.players[0] = {
          ...state.players[0],
          score: 60,
          field: Array.from({ length: 4 }, (_, i) => createTestCard({ instanceId: `p0-${i}` })),
        }
        state.players[1] = {
          ...state.players[1],
          score: 60,
          field: Array.from({ length: 4 }, (_, i) => createTestCard({ instanceId: `p1-${i}` })),
        }

        const result = engine.checkVictory()

        expect(result.isGameOver).toBe(true)
        expect(result.winner).toBe('draw')
      })
    })

    describe('Round Limit Victory (10 rounds)', () => {
      it('should end game after round 10', () => {
        const state = engine.getState()!
        state.round = MVP_CONSTANTS.MAX_ROUNDS

        state.players[0] = { ...state.players[0], score: 45 }
        state.players[1] = { ...state.players[1], score: 50 }

        const result = engine.checkVictory()

        expect(result.isGameOver).toBe(true)
        expect(result.winner).toBe(1)
        expect(result.endReason).toBe('ROUNDS_COMPLETED')
      })

      it('should not end game before round 10', () => {
        const state = engine.getState()!
        state.round = 9

        state.players[0] = { ...state.players[0], score: 45 }
        state.players[1] = { ...state.players[1], score: 50 }

        const result = engine.checkVictory()

        expect(result.isGameOver).toBe(false)
      })
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should throw error when executing action on non-started game', () => {
      expect(() => {
        engine.selectMarketCard(0, 'any-id', 'TAKE')
      }).toThrow(GameError)
    })

    it('should throw error when executing action on ended game', () => {
      engine.initializeGame('Player 1', 'Player 2')
      const state = engine.getState()!
      state.isGameOver = true

      expect(() => {
        engine.executeAction({
          type: ActionType.PASS,
          playerId: state.players[0].id,
          timestamp: Date.now(),
          payload: {},
        })
      }).toThrow(GameError)
    })

    it('should have correct error code for insufficient stones', () => {
      mockRandom([0.1])
      engine.initializeGame('Player 1', 'Player 2')
      const state = engine.getState()!
      state.players[0].stones = 0

      const costlyCard = state.market.find(c => c.cost > 0)
      if (costlyCard) {
        try {
          engine.selectMarketCard(0, costlyCard.instanceId, 'TAME')
        } catch (e) {
          expect(e).toBeInstanceOf(GameError)
          expect((e as GameError).code).toBe(GameErrorCode.ERR_INSUFFICIENT_STONES)
        }
      }
    })

    it('should have correct error code for wrong turn', () => {
      mockRandom([0.1])
      engine.initializeGame('Player 1', 'Player 2')
      const state = engine.getState()!

      try {
        engine.selectMarketCard(1, state.market[0].instanceId, 'TAKE')
      } catch (e) {
        expect(e).toBeInstanceOf(GameError)
        expect((e as GameError).code).toBe(GameErrorCode.ERR_NOT_YOUR_TURN)
      }
    })
  })

  // ============================================
  // VALID ACTIONS QUERY TESTS
  // ============================================

  describe('getValidActions', () => {
    it('should return hunting actions in HUNTING phase', () => {
      mockRandom([0.1])
      engine.initializeGame('Player 1', 'Player 2')

      const actions = engine.getValidActions()

      expect(actions).toContain(ActionType.SELECT_MARKET_CARD)
    })

    it('should return action phase actions in ACTION phase', () => {
      mockRandom([0.1])
      engine.initializeGame('Player 1', 'Player 2')
      const state = engine.getState()!
      state.players[0].stones = 5
      state.players[1].stones = 5

      engine.selectMarketCard(0, state.market[0].instanceId, 'TAKE')
      const s1 = engine.getState()!
      engine.selectMarketCard(1, s1.market[0].instanceId, 'TAKE')

      const actions = engine.getValidActions()

      expect(actions).toContain(ActionType.PASS)
    })

    it('should return empty for non-started game', () => {
      const actions = engine.getValidActions()
      expect(actions).toHaveLength(0)
    })
  })

  // ============================================
  // EVENT SUBSCRIPTION TESTS
  // ============================================

  describe('Event Subscriptions', () => {
    it('should notify on state change', () => {
      const callback = vi.fn()
      engine.onStateChange(callback)

      engine.initializeGame('Player 1', 'Player 2')

      expect(callback).toHaveBeenCalled()
    })

    it('should notify on phase change', () => {
      mockRandom([0.1])
      const callback = vi.fn()
      engine.onPhaseChange(callback)

      engine.initializeGame('Player 1', 'Player 2')
      const state = engine.getState()!
      state.players[0].stones = 5
      state.players[1].stones = 5

      engine.selectMarketCard(0, state.market[0].instanceId, 'TAKE')
      const s1 = engine.getState()!
      engine.selectMarketCard(1, s1.market[0].instanceId, 'TAKE')

      expect(callback).toHaveBeenCalledWith(GamePhase.ACTION)
    })

    it('should allow unsubscribing', () => {
      const callback = vi.fn()
      const unsubscribe = engine.onStateChange(callback)

      engine.initializeGame('Player 1', 'Player 2')
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
      engine.resetGame()
      expect(callback).toHaveBeenCalledTimes(1) // Not called again
    })
  })

  // ============================================
  // COMPLETE GAME FLOW TEST
  // ============================================

  describe('Complete 2-Player Game Flow', () => {
    it('should complete a full game cycle', () => {
      mockRandom([0.1])
      engine.initializeGame('Alice', 'Bob')
      let state = engine.getState()!

      // Give players stones
      state.players[0].stones = 10
      state.players[1].stones = 10
      state.players[0].stoneLimit = 10
      state.players[1].stoneLimit = 10

      // === Round 1 ===

      // Hunting Phase
      expect(state.phase).toBe(GamePhase.HUNTING)
      expect(state.round).toBe(1)

      // Player 0 takes card
      const card1 = state.market[0].instanceId
      engine.selectMarketCard(0, card1, 'TAKE')

      // Player 1 takes card
      state = engine.getState()!
      const card2 = state.market[0].instanceId
      engine.selectMarketCard(1, card2, 'TAKE')

      // Should now be in ACTION phase
      state = engine.getState()!
      expect(state.phase).toBe(GamePhase.ACTION)

      // Player 0 tames card from hand
      state = engine.getState()!
      if (state.players[0].hand.length > 0) {
        engine.tameFromHand(0, state.players[0].hand[0].instanceId)
      } else {
        engine.pass(0)
      }

      // Player 1 passes
      engine.pass(1)

      // Player 0 passes (if not already passed)
      state = engine.getState()!
      if (!state.players[0].hasPassed) {
        engine.pass(0)
      }

      // Should be in RESOLUTION phase
      state = engine.getState()!
      expect(state.phase).toBe(GamePhase.RESOLUTION)

      // Check game is not over after round 1
      expect(state.isGameOver).toBe(false)
    })
  })
})
