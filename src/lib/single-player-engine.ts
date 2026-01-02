/**
 * Single Player Game Engine for Vale of Eternity v7.0.0
 * Core game logic for single-player mode with Stone Economy System
 * Based on GAME_FLOW.md specifications
 * @version 7.0.0 - Simplified flow without setup phases (like multiplayer)
 */
console.log('[lib/single-player-engine.ts] v7.0.0 loaded - Simplified flow without setup phases')

import type { CardInstance, CardEffect, StoneConfig } from '@/types/cards'
import { CardLocation, Element, EffectType, EffectTrigger, StoneType } from '@/types/cards'
import {
  type SinglePlayerGameState,
  type SinglePlayerState,
  type StonePool,
  type SinglePlayerAction,
  type ScoreBreakdown,
  type EffectProcessingResult,
  SinglePlayerPhase,
  SinglePlayerActionType,
  createEmptyStonePool,
  calculateStonePoolValue,
  addStonesToPool,
} from '@/types/game'
import { getAllBaseCards, createCardInstance, shuffleArray } from '@/data/cards'

// ============================================
// CONSTANTS
// ============================================

/**
 * Single player game constants
 */
export const SINGLE_PLAYER_CONSTANTS = {
  /** Initial hand size */
  INITIAL_HAND_SIZE: 5,
  /** Market size (always 4 cards) */
  MARKET_SIZE: 4,
  /** Maximum field size */
  MAX_FIELD_SIZE: 12,
  /** Maximum hand size */
  MAX_HAND_SIZE: 10,
  /** Total cards in base game */
  TOTAL_CARDS: 70,
} as const

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Single player error codes
 */
export enum SinglePlayerErrorCode {
  ERR_GAME_NOT_STARTED = 'ERR_GAME_NOT_STARTED',
  ERR_GAME_ALREADY_OVER = 'ERR_GAME_ALREADY_OVER',
  ERR_INVALID_PHASE = 'ERR_INVALID_PHASE',
  ERR_DECK_EMPTY = 'ERR_DECK_EMPTY',
  ERR_CARD_NOT_FOUND = 'ERR_CARD_NOT_FOUND',
  ERR_INSUFFICIENT_STONES = 'ERR_INSUFFICIENT_STONES',
  ERR_FIELD_FULL = 'ERR_FIELD_FULL',
  ERR_HAND_FULL = 'ERR_HAND_FULL',
  ERR_INVALID_EXCHANGE = 'ERR_INVALID_EXCHANGE',
  ERR_INVALID_ACTION = 'ERR_INVALID_ACTION',
  ERR_ARTIFACT_NOT_AVAILABLE = 'ERR_ARTIFACT_NOT_AVAILABLE',
  ERR_NO_ARTIFACT_SELECTED = 'ERR_NO_ARTIFACT_SELECTED',
  ERR_CARD_NOT_AVAILABLE = 'ERR_CARD_NOT_AVAILABLE',
  ERR_NO_CARD_SELECTED = 'ERR_NO_CARD_SELECTED',
}

/**
 * Custom error class for single player game
 */
export class SinglePlayerError extends Error {
  constructor(
    public code: SinglePlayerErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'SinglePlayerError'
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate unique game ID
 */
function generateGameId(): string {
  return `sp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Convert StoneType to StonePool key
 */
function stoneTypeToPoolKey(type: StoneType): keyof StonePool {
  const mapping: Record<StoneType, keyof StonePool> = {
    [StoneType.ONE]: 'ONE',
    [StoneType.THREE]: 'THREE',
    [StoneType.SIX]: 'SIX',
    [StoneType.WATER]: 'WATER',
    [StoneType.FIRE]: 'FIRE',
    [StoneType.EARTH]: 'EARTH',
    [StoneType.WIND]: 'WIND',
  }
  return mapping[type]
}

/**
 * Convert Element to corresponding StoneType (for element matching)
 */
function elementToStoneType(element: Element): StoneType | null {
  const mapping: Partial<Record<Element, StoneType>> = {
    [Element.WATER]: StoneType.WATER,
    [Element.FIRE]: StoneType.FIRE,
    [Element.EARTH]: StoneType.EARTH,
    [Element.WIND]: StoneType.WIND,
  }
  return mapping[element] ?? null
}

/**
 * Calculate optimal stone payment for a cost
 * Uses greedy algorithm: pay with smallest denominations first
 */
function calculateOptimalPayment(
  pool: StonePool,
  cost: number,
  cardElement?: Element
): { payment: Partial<StonePool>; remaining: StonePool } | null {
  if (cost <= 0) {
    return { payment: {}, remaining: { ...pool } }
  }

  const remaining = { ...pool }
  const payment: Partial<StonePool> = {}
  let remainingCost = cost

  // Order of payment priority (smallest first for numeric, then element)
  const paymentOrder: { key: keyof StonePool; value: number }[] = [
    { key: 'ONE', value: 1 },
    { key: 'THREE', value: 3 },
    { key: 'SIX', value: 6 },
  ]

  // If card has an element, that element stone can also be used
  if (cardElement) {
    const elementStoneType = elementToStoneType(cardElement)
    if (elementStoneType) {
      const key = stoneTypeToPoolKey(elementStoneType)
      // Element stones are worth 1 for payment
      paymentOrder.unshift({ key, value: 1 })
    }
  }

  // Try to pay with available stones
  for (const { key, value } of paymentOrder) {
    while (remaining[key] > 0 && remainingCost > 0) {
      // For larger denominations, only use if needed
      if (value > remainingCost && key !== 'ONE') {
        // Can still use if it's the only option
        const totalSmaller = remaining.ONE + (remaining.THREE || 0) * 3
        if (totalSmaller >= remainingCost) {
          continue // Skip this denomination, smaller ones can cover it
        }
      }

      remaining[key]--
      payment[key] = (payment[key] ?? 0) + 1
      remainingCost -= value
    }
  }

  // Also check element stones for any element
  const elementKeys: (keyof StonePool)[] = ['WATER', 'FIRE', 'EARTH', 'WIND']
  for (const key of elementKeys) {
    while (remaining[key] > 0 && remainingCost > 0) {
      remaining[key]--
      payment[key] = (payment[key] ?? 0) + 1
      remainingCost -= 1 // Element stones are worth 1 for payment
    }
  }

  if (remainingCost > 0) {
    return null // Cannot afford
  }

  return { payment, remaining }
}

// ============================================
// SINGLE PLAYER ENGINE CLASS
// ============================================

/**
 * Single Player Game Engine
 * Manages all game logic for single-player mode
 */
export class SinglePlayerEngine {
  private state: SinglePlayerGameState | null = null
  private stateListeners: Array<(state: SinglePlayerGameState) => void> = []
  private gameEndListeners: Array<(state: SinglePlayerGameState) => void> = []

  constructor() {
    console.log('[SinglePlayerEngine] Initialized v3.0.0')
  }

  // ============================================
  // GAME LIFECYCLE
  // ============================================

  /**
   * Initialize a new single-player game
   * @param playerName Player's display name
   * @param _expansionMode Deprecated - kept for API compatibility but no longer used
   * @returns Initial game state
   */
  initGame(playerName: string, _expansionMode: boolean = false): SinglePlayerGameState {
    // Build deck from all 70 base cards
    const allCards = getAllBaseCards()
    const deck = shuffleArray(
      allCards.map((template, index) => createCardInstance(template, index))
    )

    // Draw initial hand (5 cards)
    const hand = deck.splice(0, SINGLE_PLAYER_CONSTANTS.INITIAL_HAND_SIZE)
    hand.forEach(card => {
      card.location = CardLocation.HAND
      card.isRevealed = true
    })

    // Setup market (4 cards)
    const market = deck.splice(0, SINGLE_PLAYER_CONSTANTS.MARKET_SIZE)
    market.forEach(card => {
      card.location = CardLocation.MARKET
      card.isRevealed = true
    })

    // Create initial player state
    const player: SinglePlayerState = {
      name: playerName,
      hand,
      field: [],
      stones: createEmptyStonePool(),
    }

    // Create game state - start in DRAW phase like multiplayer
    this.state = {
      gameId: generateGameId(),
      version: '3.2.0',
      player,
      deck,
      market,
      discardPile: [],
      phase: SinglePlayerPhase.DRAW,
      round: 1,
      actionsThisRound: [],
      isGameOver: false,
      finalScore: null,
      endReason: null,
      scoreBreakdown: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gameMode: 'AUTOMATIC',
      manualOperations: [],
      // No expansion mode setup phases - will use HUNTING phase like multiplayer
      isExpansionMode: false,
      availableArtifacts: undefined,
      selectedArtifact: null,
      initialCards: [],
      selectedInitialCard: null,
    } as SinglePlayerGameState

    this.notifyStateChange()
    return this.state!
  }

  // NOTE: getRandomArtifacts removed in v7.0.0 - artifact selection phase no longer used

  /**
   * Get current game state
   */
  getState(): SinglePlayerGameState | null {
    return this.state
  }

  /**
   * Reset the game
   */
  resetGame(): void {
    this.state = null
  }

  // ============================================
  // SETUP PHASE - ARTIFACT SELECTION
  // ============================================

  /**
   * Select an artifact during setup
   * @param artifactId Artifact ID to select
   */
  selectArtifact(artifactId: string): void {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (this.state.phase !== SinglePlayerPhase.SETUP_ARTIFACT) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Can only select artifact during SETUP_ARTIFACT phase'
      )
    }

    if (!this.state.availableArtifacts?.includes(artifactId)) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_ARTIFACT_NOT_AVAILABLE,
        'Artifact not available'
      )
    }

    this.state = {
      ...this.state,
      selectedArtifact: artifactId,
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
  }

  /**
   * Confirm artifact selection and move to initial card selection
   */
  confirmArtifact(): void {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (this.state.phase !== SinglePlayerPhase.SETUP_ARTIFACT) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Can only confirm artifact during SETUP_ARTIFACT phase'
      )
    }

    if (!this.state.selectedArtifact) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_NO_ARTIFACT_SELECTED,
        'No artifact selected'
      )
    }

    // Draw 2 cards for initial selection from deck
    const card1 = this.state.deck[0]
    const card2 = this.state.deck[1]

    if (!card1 || !card2) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_DECK_EMPTY,
        'Not enough cards in deck for initial selection'
      )
    }

    // Mark cards as revealed for selection
    const initialCards: CardInstance[] = [
      { ...card1, location: CardLocation.HAND, isRevealed: true },
      { ...card2, location: CardLocation.HAND, isRevealed: true },
    ]

    // Remove cards from deck
    const newDeck = this.state.deck.slice(2)

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.CONFIRM_ARTIFACT,
      timestamp: Date.now(),
      payload: { cardInstanceId: this.state.selectedArtifact },
    }

    this.state = {
      ...this.state,
      deck: newDeck,
      initialCards,
      phase: SinglePlayerPhase.SETUP_INITIAL_CARDS,
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
  }

  // ============================================
  // SETUP PHASE - INITIAL CARD SELECTION
  // ============================================

  /**
   * Select initial card during setup
   * @param cardInstanceId Card instance ID to select
   */
  selectInitialCard(cardInstanceId: string): void {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (this.state.phase !== SinglePlayerPhase.SETUP_INITIAL_CARDS) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Can only select initial card during SETUP_INITIAL_CARDS phase'
      )
    }

    const card = this.state.initialCards?.find(c => c.instanceId === cardInstanceId)
    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_AVAILABLE,
        'Card not available for selection'
      )
    }

    this.state = {
      ...this.state,
      selectedInitialCard: cardInstanceId,
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
  }

  /**
   * Confirm initial card selection and start game
   */
  confirmInitialCard(): void {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (this.state.phase !== SinglePlayerPhase.SETUP_INITIAL_CARDS) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Can only confirm initial card during SETUP_INITIAL_CARDS phase'
      )
    }

    if (!this.state.selectedInitialCard) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_NO_CARD_SELECTED,
        'No initial card selected'
      )
    }

    // Add selected card to hand
    const selectedCard = this.state.initialCards!.find(
      c => c.instanceId === this.state!.selectedInitialCard
    )!

    // Find unselected card
    const unselectedCard = this.state.initialCards!.find(
      c => c.instanceId !== this.state!.selectedInitialCard
    )!

    // Return unselected card to deck and shuffle
    const newDeck = shuffleArray([
      { ...unselectedCard, location: CardLocation.DECK, isRevealed: false },
      ...this.state.deck,
    ])

    // Add selected card to hand
    const newHand = [
      ...this.state.player.hand,
      { ...selectedCard, location: CardLocation.HAND, isRevealed: true },
    ]

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.CONFIRM_INITIAL_CARD,
      timestamp: Date.now(),
      payload: { cardInstanceId: this.state.selectedInitialCard },
    }

    this.state = {
      ...this.state,
      deck: newDeck,
      player: {
        ...this.state.player,
        hand: newHand,
      },
      phase: SinglePlayerPhase.DRAW,
      initialCards: [],
      selectedInitialCard: null,
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
  }

  // ============================================
  // DRAW PHASE
  // ============================================

  /**
   * Draw a card from the deck
   * Called at the start of each round
   * @returns Updated game state
   */
  drawCard(): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (this.state.isGameOver) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_ALREADY_OVER,
        'Game is already over'
      )
    }

    if (this.state.phase !== SinglePlayerPhase.DRAW) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Not in draw phase'
      )
    }

    // Check if deck is empty
    if (this.state.deck.length === 0) {
      // Auto-end game when deck is empty
      return this.endGame()
    }

    // Check hand limit
    if (this.state.player.hand.length >= SINGLE_PLAYER_CONSTANTS.MAX_HAND_SIZE) {
      // Skip draw but continue to action phase
      this.state = {
        ...this.state,
        phase: SinglePlayerPhase.ACTION,
        updatedAt: Date.now(),
      }
      this.notifyStateChange()
      return this.state
    }

    // Draw 1 card
    const drawnCard = this.state.deck[0]
    drawnCard.location = CardLocation.HAND
    drawnCard.isRevealed = true

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.DRAW_CARD,
      timestamp: Date.now(),
      payload: { cardInstanceId: drawnCard.instanceId },
    }

    this.state = {
      ...this.state,
      deck: this.state.deck.slice(1),
      player: {
        ...this.state.player,
        hand: [...this.state.player.hand, drawnCard],
      },
      phase: SinglePlayerPhase.ACTION,
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    return this.state
  }

  // ============================================
  // ACTION PHASE
  // ============================================

  /**
   * Tame a creature from hand or market
   * @param cardInstanceId Card instance ID to tame
   * @param from Source location ('HAND' or 'MARKET')
   * @returns Updated game state
   */
  tameCreature(
    cardInstanceId: string,
    from: 'HAND' | 'MARKET'
  ): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (this.state.isGameOver) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_ALREADY_OVER,
        'Game is already over'
      )
    }

    if (this.state.phase !== SinglePlayerPhase.ACTION) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Not in action phase'
      )
    }

    // Check field capacity
    if (this.state.player.field.length >= SINGLE_PLAYER_CONSTANTS.MAX_FIELD_SIZE) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_FIELD_FULL,
        'Field is full (maximum 12 cards)'
      )
    }

    // Find the card
    let card: CardInstance | undefined
    let sourceArray: CardInstance[]

    if (from === 'HAND') {
      card = this.state.player.hand.find(c => c.instanceId === cardInstanceId)
      sourceArray = this.state.player.hand
    } else {
      card = this.state.market.find(c => c.instanceId === cardInstanceId)
      sourceArray = this.state.market
    }

    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
        `Card not found in ${from.toLowerCase()}`
      )
    }

    // Calculate cost and check payment
    const cost = card.cost
    const paymentResult = calculateOptimalPayment(
      this.state.player.stones,
      cost,
      card.element
    )

    if (!paymentResult) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INSUFFICIENT_STONES,
        `Insufficient stones. Need ${cost}, have ${calculateStonePoolValue(this.state.player.stones)}`
      )
    }

    // Move card to field
    const tamedCard: CardInstance = {
      ...card,
      location: CardLocation.FIELD,
    }

    // Remove from source
    const newSourceArray = sourceArray.filter(c => c.instanceId !== cardInstanceId)

    // Process ON_TAME effects
    const effectResult = this.processOnTameEffects(tamedCard)

    // Apply stones gained from effects
    let newStones = paymentResult.remaining
    if (effectResult.stonesGained) {
      newStones = addStonesToPool(newStones, effectResult.stonesGained)
    }

    // Handle drawn cards from effects
    let newHand = from === 'HAND' ? newSourceArray : this.state.player.hand
    let newDeck = this.state.deck
    let newDiscardPile = this.state.discardPile

    if (effectResult.cardsDrawn && effectResult.cardsDrawn.length > 0) {
      newHand = [...newHand, ...effectResult.cardsDrawn]
    }

    // Refill market if card was taken from market
    let newMarket = from === 'MARKET' ? newSourceArray : this.state.market
    if (from === 'MARKET' && newDeck.length > 0) {
      const refillCount = Math.min(
        SINGLE_PLAYER_CONSTANTS.MARKET_SIZE - newMarket.length,
        newDeck.length
      )
      const refillCards = newDeck.slice(0, refillCount).map(c => ({
        ...c,
        location: CardLocation.MARKET,
        isRevealed: true,
      }))
      newMarket = [...newMarket, ...refillCards]
      newDeck = newDeck.slice(refillCount)
    }

    // Record action
    const action: SinglePlayerAction = {
      type: from === 'HAND'
        ? SinglePlayerActionType.TAME_FROM_HAND
        : SinglePlayerActionType.TAME_FROM_MARKET,
      timestamp: Date.now(),
      payload: {
        cardInstanceId,
        from,
        stonesSpent: cost,
        stonesGained: effectResult.stonesGained as StonePool | undefined,
      },
    }

    this.state = {
      ...this.state,
      deck: newDeck,
      market: newMarket,
      discardPile: newDiscardPile,
      player: {
        ...this.state.player,
        hand: newHand,
        field: [...this.state.player.field, tamedCard],
        stones: newStones,
      },
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    return this.state
  }

  /**
   * Pass the current action phase
   * Moves to next draw phase
   * @returns Updated game state
   */
  pass(): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (this.state.isGameOver) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_ALREADY_OVER,
        'Game is already over'
      )
    }

    if (this.state.phase !== SinglePlayerPhase.ACTION) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Not in action phase'
      )
    }

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.PASS,
      timestamp: Date.now(),
      payload: {},
    }

    // Move to next round's draw phase
    this.state = {
      ...this.state,
      phase: SinglePlayerPhase.DRAW,
      round: this.state.round + 1,
      actionsThisRound: [action],
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    return this.state
  }

  /**
   * Manually end the game
   * @returns Final game state with scores
   */
  endGame(): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (this.state.isGameOver) {
      return this.state
    }

    // Calculate final score
    const scoreBreakdown = this.calculateFinalScore()

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.END_GAME,
      timestamp: Date.now(),
      payload: {},
    }

    const endReason = this.state.deck.length === 0 ? 'DECK_EMPTY' : 'MANUAL_END'

    this.state = {
      ...this.state,
      phase: SinglePlayerPhase.SCORE,
      isGameOver: true,
      finalScore: scoreBreakdown.grandTotal,
      endReason,
      scoreBreakdown,
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    this.notifyGameEnd()
    return this.state
  }

  // ============================================
  // STONE MANAGEMENT
  // ============================================

  /**
   * Add stones to the player's pool
   * @param stones Stones to add
   */
  earnStones(stones: StoneConfig[]): void {
    if (!this.state) return

    const additions: Partial<StonePool> = {}
    for (const stone of stones) {
      const key = stoneTypeToPoolKey(stone.type)
      additions[key] = (additions[key] ?? 0) + stone.amount
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        stones: addStonesToPool(this.state.player.stones, additions),
      },
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
  }

  /**
   * Exchange stones between types
   * @param fromType Source stone type
   * @param toType Target stone type
   * @param amount Amount to exchange
   */
  exchangeStones(
    fromType: StoneType,
    toType: StoneType,
    amount: number
  ): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    const fromKey = stoneTypeToPoolKey(fromType)
    const toKey = stoneTypeToPoolKey(toType)

    if (this.state.player.stones[fromKey] < amount) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_EXCHANGE,
        `Insufficient ${fromType} stones for exchange`
      )
    }

    const newStones = { ...this.state.player.stones }
    newStones[fromKey] -= amount
    newStones[toKey] += amount

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.EXCHANGE_STONES,
      timestamp: Date.now(),
      payload: {
        exchange: { from: fromType, to: toType, amount },
      },
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        stones: newStones,
      },
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    return this.state
  }

  // ============================================
  // EFFECT PROCESSING
  // ============================================

  /**
   * Process ON_TAME effects for a card
   * @param card Card being tamed
   * @returns Effect processing result
   */
  private processOnTameEffects(card: CardInstance): EffectProcessingResult {
    const result: EffectProcessingResult = {
      success: true,
      message: '',
    }

    // Process each effect on the card
    for (const effect of card.effects) {
      if (effect.trigger !== EffectTrigger.ON_TAME) {
        continue
      }

      const effectResult = this.processSingleEffect(effect, card)

      // Merge results
      if (effectResult.stonesGained) {
        const currentPool: StonePool = {
          ONE: result.stonesGained?.ONE ?? 0,
          THREE: result.stonesGained?.THREE ?? 0,
          SIX: result.stonesGained?.SIX ?? 0,
          WATER: result.stonesGained?.WATER ?? 0,
          FIRE: result.stonesGained?.FIRE ?? 0,
          EARTH: result.stonesGained?.EARTH ?? 0,
          WIND: result.stonesGained?.WIND ?? 0,
        }
        result.stonesGained = addStonesToPool(currentPool, effectResult.stonesGained)
      }
      if (effectResult.cardsDrawn) {
        result.cardsDrawn = [
          ...(result.cardsDrawn ?? []),
          ...effectResult.cardsDrawn,
        ]
      }
      if (effectResult.message) {
        result.message += (result.message ? '; ' : '') + effectResult.message
      }
    }

    return result
  }

  /**
   * Process a single card effect
   * @param effect Effect to process
   * @param sourceCard Card that triggered the effect
   * @returns Effect processing result
   */
  private processSingleEffect(
    effect: CardEffect,
    _sourceCard: CardInstance
  ): EffectProcessingResult {
    const result: EffectProcessingResult = {
      success: true,
      message: '',
    }

    switch (effect.type) {
      case EffectType.EARN_STONES:
        if (effect.stones) {
          const additions: Partial<StonePool> = {}
          for (const stone of effect.stones) {
            const key = stoneTypeToPoolKey(stone.type)
            additions[key] = (additions[key] ?? 0) + stone.amount
          }
          result.stonesGained = additions
          result.message = `Earned stones`
        }
        break

      case EffectType.DRAW_CARD:
        if (this.state && effect.value && effect.value > 0) {
          const drawCount = Math.min(effect.value, this.state.deck.length)
          const drawnCards = this.state.deck.slice(0, drawCount).map(c => ({
            ...c,
            location: CardLocation.HAND,
            isRevealed: true,
          }))
          result.cardsDrawn = drawnCards
          result.message = `Drew ${drawCount} card(s)`
          // Note: deck update is handled in tameCreature
        }
        break

      case EffectType.EXCHANGE_STONES:
        // Exchange effect - handled separately by player choice
        result.message = 'Exchange effect available'
        break

      case EffectType.FREE_SUMMON:
        result.freeSummonTriggered = true
        result.message = 'Free summon triggered'
        break

      case EffectType.COPY_INSTANT_EFFECT:
        // Player needs to choose which effect to copy
        result.message = 'Copy effect available'
        break

      case EffectType.DISCARD_STONES:
        // Discard stones effect
        if (effect.stones && this.state) {
          for (const stone of effect.stones) {
            const key = stoneTypeToPoolKey(stone.type)
            const discardAmount = Math.min(
              stone.amount,
              this.state.player.stones[key]
            )
            if (!result.stonesGained) {
              result.stonesGained = {}
            }
            (result.stonesGained as Record<string, number>)[key] = -discardAmount
          }
          result.message = 'Discarded stones'
        }
        break

      case EffectType.RECOVER_CARD:
        // Recover from discard pile
        if (this.state && this.state.discardPile.length > 0 && effect.value) {
          const recoverCount = Math.min(
            effect.value,
            this.state.discardPile.length
          )
          const recoveredCards = this.state.discardPile
            .slice(-recoverCount)
            .map(c => ({
              ...c,
              location: CardLocation.HAND,
              isRevealed: true,
            }))
          result.cardsDrawn = recoveredCards
          result.message = `Recovered ${recoverCount} card(s) from discard`
        }
        break

      case EffectType.INCREASE_STONE_VALUE:
      case EffectType.INCREASE_STONE_LIMIT:
      case EffectType.DECREASE_COST:
      case EffectType.EARN_ON_SUMMON:
        // PERMANENT effects - processed differently
        result.message = 'Permanent effect activated'
        break

      case EffectType.EARN_PER_ELEMENT:
      case EffectType.EARN_PER_FAMILY:
      case EffectType.CONDITIONAL_AREA:
      case EffectType.CONDITIONAL_HAND:
      case EffectType.CONDITIONAL_EARN:
        // ON_SCORE effects - processed at game end
        result.message = 'Scoring effect registered'
        break

      default:
        // Other effects
        result.message = `Effect ${effect.type} processed`
        break
    }

    return result
  }

  // ============================================
  // SCORING
  // ============================================

  /**
   * Calculate final score with detailed breakdown
   * @returns Score breakdown
   */
  calculateFinalScore(): ScoreBreakdown {
    if (!this.state) {
      return {
        baseScores: [],
        totalBaseScore: 0,
        effectBonuses: [],
        totalEffectBonus: 0,
        permanentBonuses: [],
        totalPermanentBonus: 0,
        stoneValue: 0,
        grandTotal: 0,
      }
    }

    const field = this.state.player.field
    const breakdown: ScoreBreakdown = {
      baseScores: [],
      totalBaseScore: 0,
      effectBonuses: [],
      totalEffectBonus: 0,
      permanentBonuses: [],
      totalPermanentBonus: 0,
      stoneValue: 0,
      grandTotal: 0,
    }

    // Calculate base scores
    for (const card of field) {
      breakdown.baseScores.push({
        cardId: card.instanceId,
        cardName: card.name,
        cardNameTw: card.nameTw,
        baseScore: card.baseScore,
      })
      breakdown.totalBaseScore += card.baseScore
    }

    // Calculate ON_SCORE effect bonuses
    for (const card of field) {
      for (const effect of card.effects) {
        if (effect.trigger !== EffectTrigger.ON_SCORE) {
          continue
        }

        const bonus = this.calculateScoringEffectBonus(effect, field)
        if (bonus > 0) {
          breakdown.effectBonuses.push({
            cardId: card.instanceId,
            cardName: card.nameTw,
            effectDescription: effect.descriptionTw,
            bonus,
          })
          breakdown.totalEffectBonus += bonus
        }
      }
    }

    // Calculate PERMANENT effect bonuses (if any contribute to score)
    for (const card of field) {
      for (const effect of card.effects) {
        if (effect.trigger !== EffectTrigger.PERMANENT) {
          continue
        }

        // Some permanent effects may affect scoring
        const bonus = this.calculatePermanentEffectBonus(effect, field)
        if (bonus > 0) {
          breakdown.permanentBonuses.push({
            cardId: card.instanceId,
            cardName: card.nameTw,
            effectDescription: effect.descriptionTw,
            bonus,
          })
          breakdown.totalPermanentBonus += bonus
        }
      }
    }

    // Calculate remaining stone value
    breakdown.stoneValue = calculateStonePoolValue(this.state.player.stones)

    // Calculate grand total
    breakdown.grandTotal =
      breakdown.totalBaseScore +
      breakdown.totalEffectBonus +
      breakdown.totalPermanentBonus +
      breakdown.stoneValue

    return breakdown
  }

  /**
   * Calculate bonus from a scoring effect
   */
  private calculateScoringEffectBonus(
    effect: CardEffect,
    field: CardInstance[]
  ): number {
    switch (effect.type) {
      case EffectType.EARN_PER_ELEMENT:
        if (effect.targetElement) {
          const count = field.filter(
            c => c.element === effect.targetElement
          ).length
          return count * (effect.value ?? 1)
        }
        break

      case EffectType.EARN_PER_FAMILY:
        // Count unique elements (families)
        const uniqueElements = new Set(field.map(c => c.element))
        return uniqueElements.size * (effect.value ?? 1)

      case EffectType.CONDITIONAL_AREA:
        // Bonus based on number of cards on field
        return field.length * (effect.value ?? 1)

      case EffectType.CONDITIONAL_HAND:
        // Bonus based on cards in hand at game end
        if (this.state) {
          return this.state.player.hand.length * (effect.value ?? 1)
        }
        break
    }

    return 0
  }

  /**
   * Calculate bonus from a permanent effect
   */
  private calculatePermanentEffectBonus(
    effect: CardEffect,
    _field: CardInstance[]
  ): number {
    switch (effect.type) {
      case EffectType.INCREASE_STONE_VALUE:
        // This increases the value of remaining stones at game end
        if (this.state) {
          return calculateStonePoolValue(this.state.player.stones) * (effect.value ?? 0)
        }
        break
    }

    return 0
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * Check if a card can be tamed
   * @param cardInstanceId Card instance ID
   * @returns true if card can be tamed
   */
  canTameCard(cardInstanceId: string): boolean {
    if (!this.state) return false
    if (this.state.phase !== SinglePlayerPhase.ACTION) return false
    if (this.state.player.field.length >= SINGLE_PLAYER_CONSTANTS.MAX_FIELD_SIZE) {
      return false
    }

    // Find card in hand or market
    let card = this.state.player.hand.find(c => c.instanceId === cardInstanceId)
    if (!card) {
      card = this.state.market.find(c => c.instanceId === cardInstanceId)
    }

    if (!card) return false

    // Check if player can afford the cost
    const paymentResult = calculateOptimalPayment(
      this.state.player.stones,
      card.cost,
      card.element
    )

    return paymentResult !== null
  }

  /**
   * Get the cost of a card
   * @param cardInstanceId Card instance ID
   * @returns Card cost or -1 if not found
   */
  getCardCost(cardInstanceId: string): number {
    if (!this.state) return -1

    let card = this.state.player.hand.find(c => c.instanceId === cardInstanceId)
    if (!card) {
      card = this.state.market.find(c => c.instanceId === cardInstanceId)
    }

    return card?.cost ?? -1
  }

  /**
   * Get available actions for current phase
   */
  getAvailableActions(): SinglePlayerActionType[] {
    if (!this.state) return []
    if (this.state.isGameOver) return []

    const actions: SinglePlayerActionType[] = []

    switch (this.state.phase) {
      case SinglePlayerPhase.SETUP_ARTIFACT:
        actions.push(SinglePlayerActionType.SELECT_ARTIFACT)
        if (this.state.selectedArtifact) {
          actions.push(SinglePlayerActionType.CONFIRM_ARTIFACT)
        }
        break

      case SinglePlayerPhase.SETUP_INITIAL_CARDS:
        actions.push(SinglePlayerActionType.SELECT_INITIAL_CARD)
        if (this.state.selectedInitialCard) {
          actions.push(SinglePlayerActionType.CONFIRM_INITIAL_CARD)
        }
        break

      case SinglePlayerPhase.DRAW:
        actions.push(SinglePlayerActionType.DRAW_CARD)
        break

      case SinglePlayerPhase.ACTION:
        // Can always pass
        actions.push(SinglePlayerActionType.PASS)
        // Can end game
        actions.push(SinglePlayerActionType.END_GAME)

        // Check if can tame any card from hand
        const canTameFromHand = this.state.player.hand.some(card =>
          this.canTameCard(card.instanceId)
        )
        if (canTameFromHand) {
          actions.push(SinglePlayerActionType.TAME_FROM_HAND)
        }

        // Check if can tame any card from market
        const canTameFromMarket = this.state.market.some(card =>
          this.canTameCard(card.instanceId)
        )
        if (canTameFromMarket) {
          actions.push(SinglePlayerActionType.TAME_FROM_MARKET)
        }
        break

      case SinglePlayerPhase.SCORE:
      case SinglePlayerPhase.GAME_OVER:
        // No actions in score/game over phase
        break
    }

    return actions
  }

  // ============================================
  // EVENT SUBSCRIPTIONS
  // ============================================

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: SinglePlayerGameState) => void): () => void {
    this.stateListeners.push(callback)
    return () => {
      this.stateListeners = this.stateListeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Subscribe to game end
   */
  onGameEnd(callback: (state: SinglePlayerGameState) => void): () => void {
    this.gameEndListeners.push(callback)
    return () => {
      this.gameEndListeners = this.gameEndListeners.filter(cb => cb !== callback)
    }
  }

  private notifyStateChange(): void {
    if (this.state) {
      this.stateListeners.forEach(cb => cb(this.state!))
    }
  }

  private notifyGameEnd(): void {
    if (this.state) {
      this.gameEndListeners.forEach(cb => cb(this.state!))
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

/**
 * Default single player engine instance
 */
export const singlePlayerEngine = new SinglePlayerEngine()
