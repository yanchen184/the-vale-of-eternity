/**
 * Single Player Game Engine for Vale of Eternity v7.6.0
 * Core game logic for single-player mode with Stone Economy System
 * Based on GAME_FLOW.md specifications
 * @version 7.6.0 - Implemented round-based field size limits (round + areaBonus)
 */
console.log('[lib/single-player-engine.ts] v7.6.0 loaded - Round-based field size limits')

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
  /** Absolute maximum field size (hard cap) */
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
    console.log('[SinglePlayerEngine] Initialized v7.1.0')
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

    // Start with empty hand (0 cards)
    const hand: CardInstance[] = []

    // Setup market (4 cards) - Show immediately like multiplayer
    // In multiplayer: player count × 2 cards are shown at start of hunting phase
    // In single player: 4 cards (like 2 players × 2)
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
      areaBonus: 0, // Area bonus starts at 0 (+1 or +2 based on round/achievements)
    }

    // Create game state - start in DRAW phase like multiplayer
    this.state = {
      gameId: generateGameId(),
      version: '3.3.0',
      player,
      deck,
      market,
      discardPile: [],
      sanctuary: [],  // Initialize sanctuary array
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
      // Enable expansion mode - show artifact selection in HUNTING phase like multiplayer
      isExpansionMode: true,
      availableArtifacts: this.getRandomArtifacts(3),
      selectedArtifact: null,
      initialCards: [],
      selectedInitialCard: null,
      // Artifact selection phase (like multiplayer)
      artifactSelectionPhase: {
        isComplete: false,  // Start with artifact selection active
        confirmedArtifactId: null,
      },
    } as SinglePlayerGameState

    this.notifyStateChange()
    return this.state!
  }

  /**
   * Get random artifacts for selection
   */
  private getRandomArtifacts(count: number): string[] {
    // All artifact IDs from the game (matching artifacts.ts)
    const allArtifactIds = [
      'incense_burner',        // Core
      'monkey_king_staff',     // Core
      'pied_piper_pipe',       // Core
      'seven_league_boots',    // 3-player
      'golden_fleece',         // 4-player
      'book_of_thoth',         // Random
      'cap_of_hades',          // Random
      'gem_of_kukulkan',       // Random
      'imperial_seal',         // Random
      'philosopher_stone',     // Random
      'ring_of_wishes',        // Random
    ]
    const shuffled = [...allArtifactIds].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

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
   * Select an artifact during DRAW/HUNTING phase (like multiplayer)
   * @param artifactId Artifact ID to select
   */
  selectArtifact(artifactId: string): void {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    // Allow artifact selection in DRAW phase (like multiplayer's hunting phase)
    if (this.state.phase !== SinglePlayerPhase.DRAW) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Can only select artifact during DRAW (hunting) phase'
      )
    }

    if (!this.state.availableArtifacts?.includes(artifactId)) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_ARTIFACT_NOT_AVAILABLE,
        'Artifact not available'
      )
    }

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.SELECT_ARTIFACT,
      timestamp: Date.now(),
      payload: { cardInstanceId: artifactId },
    }

    this.state = {
      ...this.state,
      selectedArtifact: artifactId,
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Artifact selected:', artifactId)
    this.notifyStateChange()
  }

  /**
   * Confirm artifact selection (in DRAW/hunting phase, like multiplayer)
   * After confirming artifact, sets artifactSelectionPhase.isComplete = true
   * Player stays in DRAW phase to select market cards
   * (Following multiplayer game flow exactly)
   */
  confirmArtifact(): void {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    // Allow confirming artifact in DRAW phase (like multiplayer hunting phase)
    if (this.state.phase !== SinglePlayerPhase.DRAW) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Can only confirm artifact during DRAW (hunting) phase'
      )
    }

    if (!this.state.selectedArtifact) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_NO_ARTIFACT_SELECTED,
        'No artifact selected'
      )
    }

    // Check artifact selection phase is active
    if (this.state.artifactSelectionPhase?.isComplete) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Artifact selection already complete'
      )
    }

    const confirmedArtifact = this.state.selectedArtifact

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.CONFIRM_ARTIFACT,
      timestamp: Date.now(),
      payload: { cardInstanceId: confirmedArtifact },
    }

    // After confirming artifact:
    // 1. Remove it from available artifacts
    // 2. Set artifactSelectionPhase.isComplete = true (like multiplayer)
    // 3. Clear selectedArtifact so player can select cards
    // Market cards are already showing (like multiplayer)
    const newAvailableArtifacts = (this.state.availableArtifacts || []).filter(
      id => id !== confirmedArtifact
    )

    this.state = {
      ...this.state,
      availableArtifacts: newAvailableArtifacts,
      selectedArtifact: null,  // Clear selection so player can select cards
      artifactSelectionPhase: {
        isComplete: true,  // ✅ Artifact selection done, can now select cards
        confirmedArtifactId: confirmedArtifact,
      },
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Artifact confirmed:', confirmedArtifact)
    console.log('[SinglePlayerEngine] artifactSelectionPhase.isComplete = true')
    console.log('[SinglePlayerEngine] Can now select cards from market')
    this.notifyStateChange()
  }

  /**
   * Take selected cards from market to hand during DRAW/hunting phase (after artifact selection)
   * Unlike tameCreature, this is FREE and doesn't require payment
   * @param cardInstanceIds Array of card instance IDs to take from market
   * @returns Updated game state
   */
  takeCardsFromMarket(cardInstanceIds: string[]): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (this.state.phase !== SinglePlayerPhase.DRAW) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Can only take cards from market during DRAW (hunting) phase'
      )
    }

    if (!this.state.artifactSelectionPhase?.isComplete) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Must complete artifact selection first'
      )
    }

    // Validate all cards exist in market
    const cardsToTake: CardInstance[] = []
    for (const cardId of cardInstanceIds) {
      const card = this.state.market.find(c => c.instanceId === cardId)
      if (!card) {
        throw new SinglePlayerError(
          SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
          `Card ${cardId} not found in market`
        )
      }
      cardsToTake.push(card)
    }

    // Remove cards from market
    const newMarket = this.state.market.filter(
      c => !cardInstanceIds.includes(c.instanceId)
    )

    // Add cards to hand
    const newHand = [
      ...this.state.player.hand,
      ...cardsToTake.map(c => ({
        ...c,
        location: CardLocation.HAND,
        isRevealed: true,
      })),
    ]

    // Refill market from deck
    let newDeck = this.state.deck
    if (newDeck.length > 0) {
      const refillCount = Math.min(
        SINGLE_PLAYER_CONSTANTS.MARKET_SIZE - newMarket.length,
        newDeck.length
      )
      const refillCards = newDeck.slice(0, refillCount).map(c => ({
        ...c,
        location: CardLocation.MARKET,
        isRevealed: true,
      }))
      newMarket.push(...refillCards)
      newDeck = newDeck.slice(refillCount)
    }

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.DRAW_CARD, // Reuse DRAW_CARD type
      timestamp: Date.now(),
      payload: { cardInstanceId: cardInstanceIds.join(',') },
    }

    // Transition to ACTION phase after taking cards
    this.state = {
      ...this.state,
      deck: newDeck,
      market: newMarket,
      player: {
        ...this.state.player,
        hand: newHand,
        // Store the selected cards in currentTurnCards for ACTION phase display
        currentTurnCards: cardsToTake.map(c => ({
          ...c,
          location: CardLocation.HAND,
          isRevealed: true,
        })),
      },
      phase: SinglePlayerPhase.ACTION, // ✅ Now move to ACTION phase
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Took cards from market:', cardInstanceIds)
    console.log('[SinglePlayerEngine] Set currentTurnCards:', cardsToTake.length, 'cards')
    console.log('[SinglePlayerEngine] Transitioned to ACTION phase')
    this.notifyStateChange()
    return this.state
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

    // Simply add card to hand and transition to ACTION phase
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

    console.log('[SinglePlayerEngine] Drew card:', drawnCard.instanceId, '- added directly to hand')
    console.log('[SinglePlayerEngine] Transitioned to ACTION phase')
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

    // Check field capacity based on current round and area bonus
    const maxFieldSize = this.getMaxFieldSize()
    if (this.state.player.field.length >= maxFieldSize) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_FIELD_FULL,
        `Field is full (maximum ${maxFieldSize} cards for round ${this.state.round})`
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
   * Move a card from currentTurnCards to hand (keep in hand)
   * This is used after drawing cards - player confirms they want to keep the card
   * @param cardInstanceId Card instance ID to move
   * @returns Updated game state
   */
  moveCurrentDrawnCardToHand(cardInstanceId: string): SinglePlayerGameState {
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

    // Allow in both ACTION and SCORE phases
    if (this.state.phase !== SinglePlayerPhase.ACTION && this.state.phase !== SinglePlayerPhase.SCORE) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Not in action or score phase'
      )
    }

    // Find card in currentTurnCards
    const card = this.state.player.currentTurnCards?.find(
      c => c.instanceId === cardInstanceId
    )

    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
        'Card not found in current turn cards'
      )
    }

    // Remove from currentTurnCards (card is already in hand, just remove from currentTurnCards)
    const newCurrentTurnCards = (this.state.player.currentTurnCards || []).filter(
      c => c.instanceId !== cardInstanceId
    )

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.DRAW_CARD, // Reuse DRAW_CARD type
      timestamp: Date.now(),
      payload: { cardInstanceId },
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        currentTurnCards: newCurrentTurnCards,
      },
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Moved card to hand:', cardInstanceId)
    console.log('[SinglePlayerEngine] Remaining currentTurnCards:', newCurrentTurnCards.length)

    // Auto-complete settlement if all cards processed and in SCORE phase
    if (this.state.phase === SinglePlayerPhase.SCORE && newCurrentTurnCards.length === 0) {
      console.log('[SinglePlayerEngine] All cards processed, auto-completing settlement')
      this.notifyStateChange()
      return this.completeSettlement()
    }

    this.notifyStateChange()
    return this.state
  }

  /**
   * Sell a card from currentTurnCards
   * Convert the card to stones based on its cost
   * @param cardInstanceId Card instance ID to sell
   * @returns Updated game state
   */
  sellCurrentDrawnCard(cardInstanceId: string): SinglePlayerGameState {
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

    // Allow in both ACTION and SCORE phases
    if (this.state.phase !== SinglePlayerPhase.ACTION && this.state.phase !== SinglePlayerPhase.SCORE) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Not in action or score phase'
      )
    }

    // Find card in currentTurnCards
    const card = this.state.player.currentTurnCards?.find(
      c => c.instanceId === cardInstanceId
    )

    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
        'Card not found in current turn cards'
      )
    }

    // Calculate stones gained (sell value = card cost)
    // Convert cost to appropriate stones (prefer larger denominations)
    const stonesGained: Partial<StonePool> = {}
    let remainingCost = card.cost
    if (remainingCost >= 6) {
      stonesGained.SIX = Math.floor(remainingCost / 6)
      remainingCost = remainingCost % 6
    }
    if (remainingCost >= 3) {
      stonesGained.THREE = Math.floor(remainingCost / 3)
      remainingCost = remainingCost % 3
    }
    if (remainingCost > 0) {
      stonesGained.ONE = remainingCost
    }

    // Remove card from both hand and currentTurnCards
    const newHand = this.state.player.hand.filter(c => c.instanceId !== cardInstanceId)
    const newCurrentTurnCards = (this.state.player.currentTurnCards || []).filter(
      c => c.instanceId !== cardInstanceId
    )

    // Add stones to player's pool
    const newStones = addStonesToPool(this.state.player.stones, stonesGained)

    // Move card to discard pile
    const discardedCard: CardInstance = {
      ...card,
      location: CardLocation.DISCARD,
    }

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.PASS, // Use PASS type for selling
      timestamp: Date.now(),
      payload: { cardInstanceId },
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        hand: newHand,
        currentTurnCards: newCurrentTurnCards,
        stones: newStones,
      },
      discardPile: [...this.state.discardPile, discardedCard],
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Sold card:', cardInstanceId, 'for', stonesGained)
    console.log('[SinglePlayerEngine] New stone pool:', newStones)
    console.log('[SinglePlayerEngine] Remaining currentTurnCards:', newCurrentTurnCards.length)

    // Auto-complete settlement if all cards processed and in SCORE phase
    if (this.state.phase === SinglePlayerPhase.SCORE && newCurrentTurnCards.length === 0) {
      console.log('[SinglePlayerEngine] All cards processed, auto-completing settlement')
      this.notifyStateChange()
      return this.completeSettlement()
    }

    this.notifyStateChange()
    return this.state
  }

  /**
   * Pass the current action phase
   * Moves to SCORE phase (settlement) like multiplayer
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

    // Move to SCORE phase (settlement) like multiplayer
    // Player must process currentTurnCards before advancing to next round
    this.state = {
      ...this.state,
      phase: SinglePlayerPhase.SCORE,
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Moved to SCORE phase (settlement)')
    this.notifyStateChange()
    return this.state
  }

  /**
   * Complete the settlement phase and move to next round
   * Called after all currentTurnCards are processed (kept or sold)
   * @returns Updated game state
   */
  completeSettlement(): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (this.state.phase !== SinglePlayerPhase.SCORE) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_PHASE,
        'Not in score phase'
      )
    }

    // Check if all currentTurnCards have been processed
    if (this.state.player.currentTurnCards && this.state.player.currentTurnCards.length > 0) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_ACTION,
        'Must process all current turn cards before completing settlement'
      )
    }

    // Move to next round's draw phase
    this.state = {
      ...this.state,
      phase: SinglePlayerPhase.DRAW,
      round: this.state.round + 1,
      actionsThisRound: [],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Settlement complete, moved to next round DRAW phase')
    this.notifyStateChange()
    return this.state
  }

  /**
   * Discard a card from field to discard pile
   * @param cardInstanceId Card instance ID to discard
   * @returns Updated game state
   */
  discardCard(cardInstanceId: string): SinglePlayerGameState {
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

    // Find card in field
    const card = this.state.player.field.find(c => c.instanceId === cardInstanceId)

    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
        'Card not found in field'
      )
    }

    // Remove card from field
    const newField = this.state.player.field.filter(c => c.instanceId !== cardInstanceId)

    // Add card to discard pile
    const discardedCard: CardInstance = {
      ...card,
      location: CardLocation.DISCARD,
    }

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.DISCARD_CARD,
      timestamp: Date.now(),
      payload: { cardInstanceId },
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        field: newField,
      },
      discardPile: [...this.state.discardPile, discardedCard],
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Discarded card:', cardInstanceId)
    this.notifyStateChange()
    return this.state
  }

  /**
   * Move a card from field to sanctuary (expansion mode feature)
   * @param cardInstanceId Card instance ID to move
   * @returns Updated game state
   */
  moveToSanctuary(cardInstanceId: string): SinglePlayerGameState {
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

    // Find card in field
    const card = this.state.player.field.find(c => c.instanceId === cardInstanceId)

    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
        'Card not found in field'
      )
    }

    // Remove card from field
    const newField = this.state.player.field.filter(c => c.instanceId !== cardInstanceId)

    // Add card to sanctuary (preserve card location as FIELD since it's permanent storage)
    const sanctuaryCard: CardInstance = {
      ...card,
      location: CardLocation.FIELD, // Keep as FIELD since sanctuary cards count for scoring
    }

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.MOVE_TO_SANCTUARY,
      timestamp: Date.now(),
      payload: { cardInstanceId },
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        field: newField,
      },
      sanctuary: [...this.state.sanctuary, sanctuaryCard],
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Moved card to sanctuary:', cardInstanceId)
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

      case EffectType.CONDITIONAL_AREA:
        // CONDITIONAL_AREA with ON_TAME trigger - calculate based on field at time of taming
        // This handles effects like "Earn X for each card in your area"
        if (this.state && effect.trigger === EffectTrigger.ON_TAME) {
          // Calculate stones based on field size + 1 (including the card being tamed)
          // The card is not yet in field array when ON_TAME effects are processed
          const fieldSize = this.state.player.field.length + 1
          const stoneValue = effect.value ?? 1
          const totalStones = fieldSize * stoneValue

          if (totalStones > 0 && effect.stones && effect.stones.length > 0) {
            // If specific stones are defined, use those
            const additions: Partial<StonePool> = {}
            for (const stone of effect.stones) {
              const key = stoneTypeToPoolKey(stone.type)
              additions[key] = (additions[key] ?? 0) + (stone.amount * fieldSize)
            }
            result.stonesGained = additions
            result.message = `Earned stones (${fieldSize} cards in area × ${stoneValue})`
          } else if (totalStones > 0) {
            // Default to ONE stones
            result.stonesGained = { ONE: totalStones }
            result.message = `Earned ${totalStones} stones (${fieldSize} cards in area × ${stoneValue})`
          }
        } else {
          // ON_SCORE trigger - will be processed at game end
          result.message = 'Area scoring effect registered'
        }
        break

      case EffectType.CONDITIONAL_HAND:
        // CONDITIONAL_HAND with ON_TAME trigger - calculate based on hand size
        if (this.state && effect.trigger === EffectTrigger.ON_TAME) {
          const handSize = this.state.player.hand.length
          const stoneValue = effect.value ?? 1
          const totalStones = handSize * stoneValue

          if (totalStones > 0 && effect.stones && effect.stones.length > 0) {
            const additions: Partial<StonePool> = {}
            for (const stone of effect.stones) {
              const key = stoneTypeToPoolKey(stone.type)
              additions[key] = (additions[key] ?? 0) + (stone.amount * handSize)
            }
            result.stonesGained = additions
            result.message = `Earned stones (${handSize} cards in hand)`
          } else if (totalStones > 0) {
            result.stonesGained = { ONE: totalStones }
            result.message = `Earned ${totalStones} stones (${handSize} cards in hand)`
          }
        } else {
          // ON_SCORE trigger - will be processed at game end
          result.message = 'Hand scoring effect registered'
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

    // Calculate area bonus (field size × areaBonus)
    const areaBonus = field.length * this.state.player.areaBonus
    if (areaBonus > 0) {
      breakdown.permanentBonuses.push({
        cardId: 'area-bonus',
        cardName: '區域加成',
        effectDescription: `場上 ${field.length} 張卡 × 區域+${this.state.player.areaBonus}`,
        bonus: areaBonus,
      })
      breakdown.totalPermanentBonus += areaBonus
    }

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
    // Check field capacity based on current round and area bonus
    const maxFieldSize = this.getMaxFieldSize()
    if (this.state.player.field.length >= maxFieldSize) {
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

  // ============================================
  // AREA BONUS MANAGEMENT
  // ============================================

  /**
   * Set the area bonus for the player
   * Area bonus adds to final score: field.length × areaBonus
   * @param bonus Area bonus value (+1 or +2)
   * @returns Updated game state
   */
  setAreaBonus(bonus: number): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    if (bonus < 0 || bonus > 2) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_ACTION,
        'Area bonus must be 0, 1, or 2'
      )
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        areaBonus: bonus,
      },
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Area bonus set to:', bonus)
    this.notifyStateChange()
    return this.state
  }

  /**
   * Get current area bonus
   * @returns Current area bonus value
   */
  getAreaBonus(): number {
    return this.state?.player.areaBonus ?? 0
  }

  /**
   * Get maximum field size based on current round and area bonus
   * Formula: min(current_round + areaBonus, MAX_FIELD_SIZE)
   * Round 1 → 1 slot (+ areaBonus)
   * Round 2 → 2 slots (+ areaBonus)
   * ...
   * Round 12 → 12 slots (max)
   * @returns Maximum number of cards allowed on field
   */
  getMaxFieldSize(): number {
    if (!this.state) return 1

    const baseLimit = this.state.round
    const areaBonus = this.state.player.areaBonus
    const maxSize = Math.min(baseLimit + areaBonus, SINGLE_PLAYER_CONSTANTS.MAX_FIELD_SIZE)

    return maxSize
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

/**
 * Default single player engine instance
 */
export const singlePlayerEngine = new SinglePlayerEngine()
