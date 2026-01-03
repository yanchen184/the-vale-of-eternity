/**
 * Single Player Game Engine for Vale of Eternity v7.23.0
 * Core game logic for single-player mode with Stone Economy System
 * Based on GAME_FLOW.md specifications
 * @version 7.23.0 - Added validation: cannot end turn with unprocessed currentTurnCards
 */
console.log('[lib/single-player-engine.ts] v7.23.0 loaded - Cannot end turn with unprocessed cards')

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
import { ARTIFACTS_BY_ID } from '@/data/artifacts'
import { ArtifactType } from '@/types/artifacts'

// ============================================
// ARTIFACT EFFECT TYPES
// ============================================

/**
 * Artifact effect execution result
 */
export interface ArtifactEffectResult {
  /** Whether the effect was executed successfully */
  success: boolean
  /** Message describing what happened */
  message: string
  /** Stones gained from the effect */
  stonesGained?: Partial<StonePool>
  /** Stones spent for the effect */
  stonesSpent?: Partial<StonePool>
  /** Cards drawn from the effect */
  cardsDrawn?: CardInstance[]
  /** Cards moved to sanctuary */
  cardsSheltered?: CardInstance[]
  /** Cards discarded */
  cardsDiscarded?: CardInstance[]
  /** Cards recalled to hand */
  cardsRecalled?: CardInstance[]
  /** Whether the effect requires player input */
  requiresInput?: boolean
  /** Type of input required */
  inputType?: 'SELECT_CARDS' | 'SELECT_STONES' | 'CHOOSE_OPTION'
  /** Options for player to choose from */
  options?: ArtifactEffectOption[]
}

/**
 * Artifact effect option for player choices
 */
export interface ArtifactEffectOption {
  /** Option identifier */
  id: string
  /** Description of the option */
  description: string
  /** Chinese description */
  descriptionTw: string
  /** Whether this option is available */
  available: boolean
  /** Reason if not available */
  unavailableReason?: string
}

/**
 * Artifact state tracking for the current round
 */
export interface ArtifactState {
  /** The confirmed artifact ID for this round */
  artifactId: string | null
  /** Whether ACTION type artifact has been used this round */
  actionUsed: boolean
  /** Whether INSTANT effect has been executed */
  instantExecuted: boolean
  /** PERMANENT effect active state */
  permanentActive: boolean
  /** Pending effect that requires player input */
  pendingEffect?: {
    effectType: string
    options: ArtifactEffectOption[]
    selectedOption?: string
    selectedCards?: string[]
    selectedStones?: Partial<StonePool>
  }
}

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
  ERR_ARTIFACT_ALREADY_USED = 'ERR_ARTIFACT_ALREADY_USED',
  ERR_ARTIFACT_EFFECT_FAILED = 'ERR_ARTIFACT_EFFECT_FAILED',
  ERR_INSUFFICIENT_CARDS = 'ERR_INSUFFICIENT_CARDS',
  ERR_SANCTUARY_EMPTY = 'ERR_SANCTUARY_EMPTY',
  ERR_MARKET_EMPTY = 'ERR_MARKET_EMPTY',
  ERR_INVALID_ARTIFACT_OPTION = 'ERR_INVALID_ARTIFACT_OPTION',
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
 * NOTE: Currently unused - taming is FREE in single player mode
 * Kept for potential future use
 */
// @ts-expect-error - Function kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  /** Artifact state tracking for the current round */
  private artifactState: ArtifactState = {
    artifactId: null,
    actionUsed: false,
    instantExecuted: false,
    permanentActive: false,
  }

  constructor() {
    console.log('[SinglePlayerEngine] Initialized v7.19.0')
  }

  // ============================================
  // GAME LIFECYCLE
  // ============================================

  /**
   * Initialize a new single-player game
   * @param playerName Player's display name
   * @param _expansionMode Deprecated - kept for API compatibility but no longer used
   * @param forceTestCardsInMarket Force test cards (Ifrit, Imp) to appear in market for testing
   * @returns Initial game state
   */
  initGame(
    playerName: string,
    _expansionMode: boolean = false,
    forceTestCardsInMarket: boolean = true  // Default to true for testing
  ): SinglePlayerGameState {
    // Build deck from all 70 base cards
    const allCards = getAllBaseCards()
    let deck = shuffleArray(
      allCards.map((template, index) => createCardInstance(template, index))
    )

    // [TEST] Force Imp (F002) into initial hand for testing resolution phase
    let hand: CardInstance[] = []
    if (forceTestCardsInMarket) {
      const impIndex = deck.findIndex(card => card.cardId === 'F002')
      if (impIndex !== -1) {
        const [impCard] = deck.splice(impIndex, 1)
        impCard.location = CardLocation.HAND
        impCard.isRevealed = true
        hand.push(impCard)
        console.log('[SinglePlayerEngine] [TEST] Forced Imp (F002) to initial hand for testing')
      }
    }

    // Setup market (4 cards) - Show immediately like multiplayer
    // In multiplayer: player count × 2 cards are shown at start of hunting phase
    // In single player: 4 cards (like 2 players × 2)
    let market: CardInstance[] = []

    // [TEST] Force test cards (Ifrit F007) to appear in market for testing
    if (forceTestCardsInMarket) {
      // Cards to force into market for testing
      const testCardIds = ['F007']  // Ifrit (Imp now in hand)

      for (const cardId of testCardIds) {
        const cardIndex = deck.findIndex(card => card.cardId === cardId)
        if (cardIndex !== -1 && market.length < SINGLE_PLAYER_CONSTANTS.MARKET_SIZE) {
          // Remove card from deck and add to market
          const [card] = deck.splice(cardIndex, 1)
          card.location = CardLocation.MARKET
          card.isRevealed = true
          market.push(card)
          console.log(`[SinglePlayerEngine] [TEST] Forced ${cardId} to market for testing`)
        }
      }

      // Fill remaining market slots
      const remainingSlots = SINGLE_PLAYER_CONSTANTS.MARKET_SIZE - market.length
      const additionalCards = deck.splice(0, remainingSlots)
      additionalCards.forEach(card => {
        card.location = CardLocation.MARKET
        card.isRevealed = true
      })
      market.push(...additionalCards)
    } else {
      // Normal market setup
      market = deck.splice(0, SINGLE_PLAYER_CONSTANTS.MARKET_SIZE)
      market.forEach(card => {
        card.location = CardLocation.MARKET
        card.isRevealed = true
      })
    }

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
  private getRandomArtifacts(_count: number): string[] {
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
    // Return ALL artifacts for testing in single-player mode
    return allArtifactIds
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
    // NOTE: player.selectedArtifact is not set because artifacts are not CardInstance
    // The confirmed artifact ID is stored in artifactSelectionPhase.confirmedArtifactId
    const newAvailableArtifacts = (this.state.availableArtifacts || []).filter(
      id => id !== confirmedArtifact
    )

    this.state = {
      ...this.state,
      availableArtifacts: newAvailableArtifacts,
      selectedArtifact: null,  // Clear selection so player can select cards
      artifactSelectionPhase: {
        isComplete: true,  // Artifact selection done, can now select cards
        confirmedArtifactId: confirmedArtifact,
      },
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    // Initialize artifact state for effect execution
    if (confirmedArtifact) {
      this.initializeArtifactState(confirmedArtifact)
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

    // ✅ FIX: Initial cards displayed in ACTION phase slots, NOT added to hand or deck yet
    // Player will decide to keep (→ deck) or sell (→ stones) for each card
    // Hand remains empty (0 cards)
    const newHand = this.state.player.hand

    // Don't shuffle into deck yet - wait for player decision
    let newDeck = this.state.deck

    // Refill market from deck
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
        // ✅ Set currentTurnCards to display in ACTION phase slots
        // Player will decide to keep (→ deck) or sell (→ stones) for each card
        currentTurnCards: cardsToTake.map(c => ({
          ...c,
          location: CardLocation.HAND, // Temporary location for display
          isRevealed: true,
        })),
      },
      phase: SinglePlayerPhase.ACTION, // ✅ Now move to ACTION phase
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Set initial cards to currentTurnCards:', cardInstanceIds)
    console.log('[SinglePlayerEngine] Hand count:', newHand.length, '(should be 0)')
    console.log('[SinglePlayerEngine] currentTurnCards count:', cardsToTake.length)
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

    // Like takeCardsFromMarket, store drawn card in currentTurnCards for ACTION phase
    // Player must decide to keep in hand or sell during ACTION/SCORE phase
    this.state = {
      ...this.state,
      deck: this.state.deck.slice(1),
      player: {
        ...this.state.player,
        hand: [...this.state.player.hand, drawnCard],
        // Store the drawn card in currentTurnCards for ACTION phase display
        currentTurnCards: [{
          ...drawnCard,
          location: CardLocation.HAND,
          isRevealed: true,
        }],
      },
      phase: SinglePlayerPhase.ACTION,
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Drew card:', drawnCard.instanceId)
    console.log('[SinglePlayerEngine] Set currentTurnCards with 1 card')
    console.log('[SinglePlayerEngine] Transitioned to ACTION phase')
    this.notifyStateChange()
    return this.state
  }

  // ============================================
  // ACTION PHASE
  // ============================================

  /**
   * Draw a card during ACTION phase
   * Allows player to draw cards even during action phase
   * Like takeCardsFromMarket, adds card to both hand and currentTurnCards
   * @returns Updated game state
   */
  drawCardInActionPhase(): SinglePlayerGameState {
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

    // Check if deck is empty
    if (this.state.deck.length === 0) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_DECK_EMPTY,
        '牌庫已空，無法抽牌'
      )
    }

    // Check hand limit
    if (this.state.player.hand.length >= SINGLE_PLAYER_CONSTANTS.MAX_HAND_SIZE) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_HAND_FULL,
        `手牌已滿（${SINGLE_PLAYER_CONSTANTS.MAX_HAND_SIZE}張），無法抽牌`
      )
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

    // In ACTION phase, only add to hand (not currentTurnCards)
    // This is different from DRAW phase where cards go to currentTurnCards
    this.state = {
      ...this.state,
      deck: this.state.deck.slice(1),
      player: {
        ...this.state.player,
        hand: [...this.state.player.hand, drawnCard],
      },
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Drew card in ACTION phase:', drawnCard.instanceId)
    console.log('[SinglePlayerEngine] Added to hand only (not currentTurnCards)')
    this.notifyStateChange()
    return this.state
  }

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

    // No cost check - taming is FREE in single player mode
    // Just process the tame action without payment

    // Move card to field
    const tamedCard: CardInstance = {
      ...card,
      location: CardLocation.FIELD,
    }

    // Remove from source
    const newSourceArray = sourceArray.filter(c => c.instanceId !== cardInstanceId)

    // Process ON_TAME effects
    const effectResult = this.processOnTameEffects(tamedCard)

    // Apply stones gained from effects (no cost deduction)
    let newStones = this.state.player.stones
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
        stonesSpent: 0, // No cost in single player mode
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
   * Move a card from currentTurnCards to hand (keep)
   * - For initial cards: card is NOT in hand yet, add it
   * - For normal draws: card is ALREADY in hand, just remove from currentTurnCards
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

    // Remove from currentTurnCards
    const newCurrentTurnCards = (this.state.player.currentTurnCards || []).filter(
      c => c.instanceId !== cardInstanceId
    )

    // Check if this is from normal draw (card already in hand) or initial selection
    const cardAlreadyInHand = this.state.player.hand.some(c => c.instanceId === cardInstanceId)

    let newHand = this.state.player.hand
    let newDeck = this.state.deck

    if (!cardAlreadyInHand) {
      // Initial card selection: card not in hand yet, need to add it
      const cardForHand = {
        ...card,
        location: CardLocation.HAND,
        isRevealed: true,
      }
      newHand = [...newHand, cardForHand]
      console.log('[SinglePlayerEngine] Added initial card to hand:', cardInstanceId)
    } else {
      // Normal drawn cards are ALREADY in hand (added by drawCard/drawCardInActionPhase)
      // Just remove from currentTurnCards, no need to add to hand again
      console.log('[SinglePlayerEngine] Card already in hand, just removed from currentTurnCards:', cardInstanceId)
    }

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.DRAW_CARD, // Reuse DRAW_CARD type
      timestamp: Date.now(),
      payload: { cardInstanceId },
    }

    this.state = {
      ...this.state,
      deck: newDeck,
      player: {
        ...this.state.player,
        hand: newHand,
        currentTurnCards: newCurrentTurnCards,
      },
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

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

    // ✅ Sell card for stones based on element (fixed values, no cost concept)
    // Each element has a specific stone combination:
    // - FIRE: 3×ONE = 3 total
    // - WATER: 1×THREE = 3 total
    // - EARTH: 4×ONE = 4 total
    // - WIND: 1×THREE + 1×ONE = 4 total
    // - DRAGON: 1×SIX = 6 total
    const stonesGained: Partial<StonePool> = {}

    switch (card.element) {
      case Element.FIRE:
        // Fire: 3 ONE stones = 3 total
        stonesGained.ONE = 3
        break
      case Element.WATER:
        // Water: 1 THREE stone = 3 total
        stonesGained.THREE = 1
        break
      case Element.EARTH:
        // Earth: 4 ONE stones = 4 total
        stonesGained.ONE = 4
        break
      case Element.WIND:
        // Wind: 1 THREE + 1 ONE = 4 total
        stonesGained.THREE = 1
        stonesGained.ONE = 1
        break
      case Element.DRAGON:
        // Dragon: 1 SIX stone = 6 total
        stonesGained.SIX = 1
        break
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

    // ✅ Check if all currentTurnCards have been processed (kept or sold)
    if (this.state.player.currentTurnCards && this.state.player.currentTurnCards.length > 0) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_ACTION,
        `還有 ${this.state.player.currentTurnCards.length} 張行動階段卡片未處理（需上手或賣出）`
      )
    }

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.PASS,
      timestamp: Date.now(),
      payload: {},
    }

    // Find cards with RECOVER_CARD PERMANENT effect (like Imp)
    // These cards can optionally return to hand during resolution phase
    const pendingResolutionCards = this.state.player.field
      .filter(card =>
        card.effects.some(effect =>
          effect.type === EffectType.RECOVER_CARD &&
          effect.trigger === EffectTrigger.PERMANENT
        )
      )
      .map(card => card.instanceId)

    console.log('[SinglePlayerEngine] Cards with RECOVER_CARD effect:', pendingResolutionCards.length)

    // Move to SCORE phase (settlement) like multiplayer
    // Player must process currentTurnCards before advancing to next round
    this.state = {
      ...this.state,
      phase: SinglePlayerPhase.SCORE,
      pendingResolutionCards,
      processedResolutionCards: [],
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
   * AND all resolution cards have been processed (player chose yes/no for each)
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

    // Check if all resolution cards have been processed
    const pendingCount = this.state.pendingResolutionCards?.length ?? 0
    const processedCount = this.state.processedResolutionCards?.length ?? 0
    if (pendingCount > 0 && processedCount < pendingCount) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_ACTION,
        '必須處理完所有結算效果卡片才能結束回合'
      )
    }

    // Reset artifact state for new round
    this.resetArtifactState()

    // Move to next round's draw phase with artifact selection (like multiplayer)
    // Reset artifact selection phase so player can select new artifact
    this.state = {
      ...this.state,
      phase: SinglePlayerPhase.DRAW,
      round: this.state.round + 1,
      actionsThisRound: [],
      selectedArtifact: null,  // Clear previous artifact selection
      artifactSelectionPhase: {
        isComplete: false,  // Reset to allow new artifact selection
        confirmedArtifactId: null,
      },
      pendingResolutionCards: [],  // Clear resolution cards
      processedResolutionCards: [],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Settlement complete, moved to next round DRAW phase (artifact selection)')
    this.notifyStateChange()
    return this.state
  }

  /**
   * Check if a field card has pending resolution effect
   * @param cardInstanceId Card instance ID to check
   * @returns Whether the card has pending resolution effect
   */
  hasPendingResolutionEffect(cardInstanceId: string): boolean {
    if (!this.state) return false
    const pending = this.state.pendingResolutionCards ?? []
    const processed = this.state.processedResolutionCards ?? []
    return pending.includes(cardInstanceId) && !processed.includes(cardInstanceId)
  }

  /**
   * Get all cards with pending resolution effects that haven't been processed yet
   * @returns Array of card instance IDs
   */
  getUnprocessedResolutionCards(): string[] {
    if (!this.state) return []
    const pending = this.state.pendingResolutionCards ?? []
    const processed = this.state.processedResolutionCards ?? []
    return pending.filter(id => !processed.includes(id))
  }

  /**
   * Process a resolution card's effect (player chose to activate or skip)
   * For RECOVER_CARD effect, choosing to activate returns the card to hand
   * @param cardInstanceId Card instance ID to process
   * @param activate Whether to activate the effect (true = return to hand, false = stay on field)
   * @returns Updated game state
   */
  processResolutionCard(cardInstanceId: string, activate: boolean): SinglePlayerGameState {
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

    // Check if card is in pending resolution list
    if (!this.hasPendingResolutionEffect(cardInstanceId)) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_ACTION,
        'Card does not have pending resolution effect'
      )
    }

    let newField = this.state.player.field
    let newHand = this.state.player.hand

    if (activate) {
      // Find card in field
      const card = this.state.player.field.find(c => c.instanceId === cardInstanceId)
      if (!card) {
        throw new SinglePlayerError(
          SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
          'Card not found on field'
        )
      }

      // Return card to hand
      newField = this.state.player.field.filter(c => c.instanceId !== cardInstanceId)
      const returnedCard: CardInstance = {
        ...card,
        location: CardLocation.HAND,
      }
      newHand = [...this.state.player.hand, returnedCard]

      console.log('[SinglePlayerEngine] Resolution effect activated: returned card to hand:', cardInstanceId)
    } else {
      console.log('[SinglePlayerEngine] Resolution effect skipped: card stays on field:', cardInstanceId)
    }

    // Mark card as processed
    const processedResolutionCards = [...(this.state.processedResolutionCards ?? []), cardInstanceId]

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        field: newField,
        hand: newHand,
      },
      processedResolutionCards,
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    return this.state
  }

  /**
   * Return a card from field to hand
   * Can only be used during ACTION phase
   * @param cardInstanceId Card instance ID to return
   * @returns Updated game state
   */
  returnCardToHand(cardInstanceId: string): SinglePlayerGameState {
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

    // Only allow during ACTION phase
    if (this.state.phase !== SinglePlayerPhase.ACTION) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_ACTION,
        '只能在行動階段將卡片回手'
      )
    }

    // Find card in field
    const card = this.state.player.field.find(c => c.instanceId === cardInstanceId)
    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
        'Card not found on field'
      )
    }

    // Remove card from field
    const newField = this.state.player.field.filter(c => c.instanceId !== cardInstanceId)

    // Add card to hand
    const returnedCard: CardInstance = {
      ...card,
      location: CardLocation.HAND,
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        hand: [...this.state.player.hand, returnedCard],
        field: newField,
      },
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Returned card to hand from field:', cardInstanceId)
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

    // Find card in hand or field
    let card = this.state.player.hand.find(c => c.instanceId === cardInstanceId)
    let fromHand = !!card

    if (!card) {
      card = this.state.player.field.find(c => c.instanceId === cardInstanceId)
      fromHand = false
    }

    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
        'Card not found in hand or field'
      )
    }

    // Remove card from hand or field
    const newHand = fromHand
      ? this.state.player.hand.filter(c => c.instanceId !== cardInstanceId)
      : this.state.player.hand
    const newField = !fromHand
      ? this.state.player.field.filter(c => c.instanceId !== cardInstanceId)
      : this.state.player.field

    // Add card to discard pile
    const discardedCard: CardInstance = {
      ...card,
      location: CardLocation.DISCARD,
    }

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.DISCARD_CARD,
      timestamp: Date.now(),
      payload: {
        cardInstanceId,
        from: fromHand ? 'HAND' : 'FIELD' as 'HAND' | 'MARKET',
      },
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        hand: newHand,
        field: newField,
      },
      discardPile: [...this.state.discardPile, discardedCard],
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Discarded card from', fromHand ? 'hand' : 'field', ':', cardInstanceId)
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

    // Find card in hand or field
    let card = this.state.player.hand.find(c => c.instanceId === cardInstanceId)
    let fromHand = !!card

    if (!card) {
      card = this.state.player.field.find(c => c.instanceId === cardInstanceId)
      fromHand = false
    }

    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
        'Card not found in hand or field'
      )
    }

    // Remove card from hand or field
    const newHand = fromHand
      ? this.state.player.hand.filter(c => c.instanceId !== cardInstanceId)
      : this.state.player.hand
    const newField = !fromHand
      ? this.state.player.field.filter(c => c.instanceId !== cardInstanceId)
      : this.state.player.field

    // Add card to sanctuary (preserve card location as FIELD since it's permanent storage)
    const sanctuaryCard: CardInstance = {
      ...card,
      location: CardLocation.FIELD, // Keep as FIELD since sanctuary cards count for scoring
    }

    // Record action
    const action: SinglePlayerAction = {
      type: SinglePlayerActionType.MOVE_TO_SANCTUARY,
      timestamp: Date.now(),
      payload: {
        cardInstanceId,
        from: fromHand ? 'HAND' : 'FIELD' as 'HAND' | 'MARKET',
      },
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        hand: newHand,
        field: newField,
      },
      sanctuary: [...this.state.sanctuary, sanctuaryCard],
      actionsThisRound: [...this.state.actionsThisRound, action],
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Moved card to sanctuary from', fromHand ? 'hand' : 'field', ':', cardInstanceId)
    this.notifyStateChange()
    return this.state
  }

  /**
   * Take a card from discard pile to hand
   * @param cardInstanceId Card instance ID to take
   * @returns Updated game state
   */
  takeCardFromDiscard(cardInstanceId: string): SinglePlayerGameState {
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

    // Only allow during ACTION phase
    if (this.state.phase !== SinglePlayerPhase.ACTION) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_ACTION,
        '只能在行動階段從棄置牌堆拿牌'
      )
    }

    // Find card in discard pile
    const card = this.state.discardPile.find(c => c.instanceId === cardInstanceId)
    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
        'Card not found in discard pile'
      )
    }

    // Check hand size limit
    if (this.state.player.hand.length >= SINGLE_PLAYER_CONSTANTS.MAX_HAND_SIZE) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_HAND_FULL,
        `手牌已滿 (${SINGLE_PLAYER_CONSTANTS.MAX_HAND_SIZE})`
      )
    }

    // Remove card from discard pile
    const newDiscardPile = this.state.discardPile.filter(c => c.instanceId !== cardInstanceId)

    // Add card to hand
    const takenCard: CardInstance = {
      ...card,
      location: CardLocation.HAND,
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        hand: [...this.state.player.hand, takenCard],
      },
      discardPile: newDiscardPile,
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Took card from discard pile to hand:', cardInstanceId)
    this.notifyStateChange()
    return this.state
  }

  /**
   * Take a card from sanctuary back to hand
   * Only allowed during ACTION phase
   * @param cardInstanceId - ID of the card to take from sanctuary
   * @returns Updated game state
   */
  takeCardFromSanctuary(cardInstanceId: string): SinglePlayerGameState {
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

    // Only allow during ACTION phase
    if (this.state.phase !== SinglePlayerPhase.ACTION) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_ACTION,
        '只能在行動階段從棲息地拿牌'
      )
    }

    // Find card in sanctuary
    const card = this.state.sanctuary.find(c => c.instanceId === cardInstanceId)
    if (!card) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_CARD_NOT_FOUND,
        'Card not found in sanctuary'
      )
    }

    // Check hand size limit
    if (this.state.player.hand.length >= SINGLE_PLAYER_CONSTANTS.MAX_HAND_SIZE) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_HAND_FULL,
        `手牌已滿 (${SINGLE_PLAYER_CONSTANTS.MAX_HAND_SIZE})`
      )
    }

    // Remove card from sanctuary
    const newSanctuary = this.state.sanctuary.filter(c => c.instanceId !== cardInstanceId)

    // Add card to hand
    const takenCard: CardInstance = {
      ...card,
      location: CardLocation.HAND,
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        hand: [...this.state.player.hand, takenCard],
      },
      sanctuary: newSanctuary,
      updatedAt: Date.now(),
    }

    console.log('[SinglePlayerEngine] Took card from sanctuary to hand:', cardInstanceId)
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
        // EARN_PER_ELEMENT can be ON_TAME (Ifrit) or ON_SCORE
        if (this.state && effect.trigger === EffectTrigger.ON_TAME) {
          // Ifrit effect: earn stones per card on field (including itself)
          // The card is not yet in field array when ON_TAME effects are processed
          const fieldSize = this.state.player.field.length + 1
          const stoneValue = effect.value ?? 1

          if (effect.stones && effect.stones.length > 0) {
            const additions: Partial<StonePool> = {}
            for (const stone of effect.stones) {
              const key = stoneTypeToPoolKey(stone.type)
              additions[key] = (additions[key] ?? 0) + (stone.amount * fieldSize)
            }
            result.stonesGained = additions
            result.message = `Earned stones (${fieldSize} cards in area × ${stoneValue})`
          } else {
            result.stonesGained = { ONE: fieldSize * stoneValue }
            result.message = `Earned ${fieldSize * stoneValue} stones (${fieldSize} cards in area)`
          }

          console.log('[SinglePlayerEngine] Ifrit ON_TAME effect processed:', {
            fieldSize,
            stoneValue,
            stonesGained: result.stonesGained,
          })
        } else {
          // ON_SCORE effects - processed at game end
          result.message = 'Scoring effect registered'
        }
        break

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

    // Stone value is NOT part of score (kept for reference only)
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

    // Calculate grand total (stones do NOT contribute to score)
    breakdown.grandTotal =
      breakdown.totalBaseScore +
      breakdown.totalEffectBonus +
      breakdown.totalPermanentBonus

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

    // No cost check - taming is FREE in single player mode
    // Only check field capacity (done above)
    return true
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
   * Toggle area bonus (cycle: 0 → 1 → 2 → 0)
   * Area bonus adds extra field slots and final score bonus
   * Can only be toggled during ACTION phase
   * @returns Updated game state
   */
  toggleAreaBonus(): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    // Only allow toggling during ACTION phase
    if (this.state.phase !== SinglePlayerPhase.ACTION) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_INVALID_ACTION,
        '只能在行動階段切換區域指示物'
      )
    }

    const currentBonus = this.state.player.areaBonus
    // Cycle: 0 → 1 → 2 → 0
    const newBonus = ((currentBonus + 1) % 3) as 0 | 1 | 2

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        areaBonus: newBonus,
      },
      updatedAt: Date.now(),
    }

    console.log(`[SinglePlayerEngine] Area bonus toggled: ${currentBonus} → ${newBonus}`)
    this.notifyStateChange()
    return this.state
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

  // ============================================
  // ARTIFACT EFFECT EXECUTION
  // ============================================

  /**
   * Get the current artifact state
   * @returns Current artifact state
   */
  getArtifactState(): ArtifactState {
    return { ...this.artifactState }
  }

  /**
   * Reset artifact state for a new round
   * Called when transitioning to a new round
   */
  private resetArtifactState(): void {
    this.artifactState = {
      artifactId: null,
      actionUsed: false,
      instantExecuted: false,
      permanentActive: false,
    }
    console.log('[SinglePlayerEngine] Artifact state reset for new round')
  }

  /**
   * Initialize artifact state when artifact is confirmed
   * @param artifactId The confirmed artifact ID
   */
  private initializeArtifactState(artifactId: string): void {
    const artifact = ARTIFACTS_BY_ID[artifactId]
    if (!artifact) {
      console.warn('[SinglePlayerEngine] Unknown artifact:', artifactId)
      return
    }

    this.artifactState = {
      artifactId,
      actionUsed: false,
      instantExecuted: false,
      permanentActive: artifact.type === ArtifactType.PERMANENT,
    }

    console.log('[SinglePlayerEngine] Artifact state initialized:', {
      artifactId,
      type: artifact.type,
      permanentActive: this.artifactState.permanentActive,
    })
  }

  /**
   * Check if the current artifact can be used
   * @returns true if artifact can be used
   */
  canUseArtifact(): boolean {
    if (!this.state) return false
    if (!this.artifactState.artifactId) return false

    const artifact = ARTIFACTS_BY_ID[this.artifactState.artifactId]
    if (!artifact) return false

    // Check based on artifact type
    switch (artifact.type) {
      case ArtifactType.INSTANT:
        // INSTANT can only be used once when confirmed
        return !this.artifactState.instantExecuted
      case ArtifactType.ACTION:
        // ACTION can only be used once per round during ACTION phase
        return !this.artifactState.actionUsed && this.state.phase === SinglePlayerPhase.ACTION
      case ArtifactType.PERMANENT:
        // PERMANENT is always active (checked when specific conditions are met)
        return this.artifactState.permanentActive
      default:
        return false
    }
  }

  /**
   * Get available artifact effect options for the current artifact
   * Used for artifacts that offer multiple choices
   * @returns Array of available options
   */
  getArtifactEffectOptions(): ArtifactEffectOption[] {
    if (!this.state || !this.artifactState.artifactId) return []

    const artifact = ARTIFACTS_BY_ID[this.artifactState.artifactId]
    if (!artifact) return []

    switch (this.artifactState.artifactId) {
      case 'incense_burner':
        return this.getIncenseBurnerOptions()
      case 'pied_piper_pipe':
        return this.getPiedPiperPipeOptions()
      case 'cap_of_hades':
        return this.getCapOfHadesOptions()
      case 'golden_fleece':
        return this.getGoldenFleeceOptions()
      case 'ring_of_wishes':
        return this.getRingOfWishesOptions()
      default:
        return []
    }
  }

  /**
   * Execute artifact effect with optional parameters
   * @param optionId Optional option ID for artifacts with multiple choices
   * @param selectedCards Optional array of card IDs for effects requiring card selection
   * @param selectedStones Optional stone configuration for stone-based effects
   * @returns Artifact effect result
   */
  executeArtifactEffect(
    optionId?: string,
    selectedCards?: string[],
    selectedStones?: Partial<StonePool>
  ): ArtifactEffectResult {
    if (!this.state) {
      return { success: false, message: 'Game not started' }
    }

    if (!this.artifactState.artifactId) {
      return { success: false, message: 'No artifact selected' }
    }

    const artifact = ARTIFACTS_BY_ID[this.artifactState.artifactId]
    if (!artifact) {
      return { success: false, message: 'Unknown artifact' }
    }

    // Check if artifact can be used
    if (!this.canUseArtifact()) {
      if (artifact.type === ArtifactType.ACTION && this.artifactState.actionUsed) {
        return { success: false, message: '此神器本回合已使用' }
      }
      if (artifact.type === ArtifactType.INSTANT && this.artifactState.instantExecuted) {
        return { success: false, message: '此神器效果已執行' }
      }
      return { success: false, message: '無法使用此神器' }
    }

    // Execute based on artifact ID
    let result: ArtifactEffectResult

    switch (this.artifactState.artifactId) {
      // ============================================
      // CORE ARTIFACTS
      // ============================================
      case 'incense_burner':
        result = this.executeIncenseBurner(optionId, selectedCards)
        break
      case 'monkey_king_staff':
        result = this.executeMonkeyKingStaff(selectedCards)
        break
      case 'pied_piper_pipe':
        result = this.executePiedPiperPipe(optionId)
        break

      // ============================================
      // RANDOM ARTIFACTS
      // ============================================
      case 'book_of_thoth':
        result = this.executeBookOfThoth(selectedStones)
        break
      case 'cap_of_hades':
        result = this.executeCapOfHades(optionId, selectedCards)
        break
      case 'philosopher_stone':
        // PERMANENT effect - handled separately in discard/sell card methods
        result = this.executePhilosopherStone(selectedCards)
        break
      case 'imperial_seal':
        result = this.executeImperialSeal(selectedCards)
        break
      case 'ring_of_wishes':
        result = this.executeRingOfWishes(optionId, selectedCards)
        break
      case 'gem_of_kukulkan':
        result = this.executeGemOfKukulkan(selectedCards)
        break

      default:
        result = { success: false, message: `神器 ${artifact.nameTw} 效果尚未實作` }
    }

    // Mark artifact as used based on type
    if (result.success) {
      if (artifact.type === ArtifactType.INSTANT) {
        this.artifactState.instantExecuted = true
      } else if (artifact.type === ArtifactType.ACTION) {
        this.artifactState.actionUsed = true
      }
    }

    this.notifyStateChange()
    return result
  }

  // ============================================
  // CORE ARTIFACT IMPLEMENTATIONS
  // ============================================

  /**
   * Get options for Incense Burner artifact
   * Option A: Buy 1 card from buy area for 3 stones of any color
   * Option B: Shelter top 2 cards from deck
   */
  private getIncenseBurnerOptions(): ArtifactEffectOption[] {
    if (!this.state) return []

    const totalStones = calculateStonePoolValue(this.state.player.stones)
    const hasEnoughStones = totalStones >= 3
    const marketHasCards = this.state.market.length > 0
    const deckHasCards = this.state.deck.length >= 1

    return [
      {
        id: 'buy_card',
        description: 'Buy 1 card from buy area for 3 stones',
        descriptionTw: '支付3顆任意顏色的石頭購買買入區的1張卡',
        available: hasEnoughStones && marketHasCards,
        unavailableReason: !hasEnoughStones
          ? '石頭不足（需要3顆）'
          : !marketHasCards
            ? '買入區沒有卡牌'
            : undefined,
      },
      {
        id: 'shelter_deck',
        description: 'Shelter top 2 cards from deck',
        descriptionTw: '將牌庫頂的2張卡棲息地',
        available: deckHasCards,
        unavailableReason: !deckHasCards ? '牌庫沒有卡牌' : undefined,
      },
    ]
  }

  /**
   * Execute Incense Burner effect
   * Option A: Buy 1 card for 3 stones
   * Option B: Shelter 2 cards from deck
   */
  private executeIncenseBurner(
    optionId?: string,
    selectedCards?: string[]
  ): ArtifactEffectResult {
    if (!this.state) {
      return { success: false, message: 'Game not started' }
    }

    if (!optionId) {
      return {
        success: false,
        message: '請選擇效果選項',
        requiresInput: true,
        inputType: 'CHOOSE_OPTION',
        options: this.getIncenseBurnerOptions(),
      }
    }

    if (optionId === 'buy_card') {
      // Buy 1 card from buy area for 3 stones
      if (!selectedCards || selectedCards.length !== 1) {
        return {
          success: false,
          message: '請選擇1張買入區的卡牌',
          requiresInput: true,
          inputType: 'SELECT_CARDS',
        }
      }

      const cardId = selectedCards[0]
      const card = this.state.market.find(c => c.instanceId === cardId)
      if (!card) {
        return { success: false, message: '卡牌不在買入區' }
      }

      // Check and deduct 3 stones
      const totalStones = calculateStonePoolValue(this.state.player.stones)
      if (totalStones < 3) {
        return { success: false, message: '石頭不足（需要3顆）' }
      }

      // Deduct stones (prefer smaller denominations)
      const stonesSpent = this.deductStones(3)
      if (!stonesSpent) {
        return { success: false, message: '無法扣除石頭' }
      }

      // Move card to hand
      const newMarket = this.state.market.filter(c => c.instanceId !== cardId)
      const newHand = [...this.state.player.hand, { ...card, location: CardLocation.HAND }]

      // Refill market
      let newDeck = this.state.deck
      if (newDeck.length > 0) {
        const refillCard = { ...newDeck[0], location: CardLocation.MARKET, isRevealed: true }
        newMarket.push(refillCard)
        newDeck = newDeck.slice(1)
      }

      this.state = {
        ...this.state,
        deck: newDeck,
        market: newMarket,
        player: {
          ...this.state.player,
          hand: newHand,
          stones: this.state.player.stones,
        },
        updatedAt: Date.now(),
      }

      return {
        success: true,
        message: `香爐：以3顆石頭購買了 ${card.nameTw}`,
        stonesSpent,
        cardsDrawn: [card],
      }
    } else if (optionId === 'shelter_deck') {
      // Shelter top 2 cards from deck
      if (this.state.deck.length === 0) {
        return { success: false, message: '牌庫沒有卡牌' }
      }

      const shelterCount = Math.min(2, this.state.deck.length)
      const shelterCards = this.state.deck.slice(0, shelterCount).map(c => ({
        ...c,
        location: CardLocation.FIELD,
        isRevealed: true,
      }))

      this.state = {
        ...this.state,
        deck: this.state.deck.slice(shelterCount),
        sanctuary: [...this.state.sanctuary, ...shelterCards],
        updatedAt: Date.now(),
      }

      return {
        success: true,
        message: `香爐：將牌庫頂的${shelterCount}張卡棲息地`,
        cardsSheltered: shelterCards,
      }
    }

    return { success: false, message: '無效的選項' }
  }

  /**
   * Execute Monkey King's Staff effect
   * Discard 2 cards from hand to gain 1 red, 1 blue, and 1 green stone
   */
  private executeMonkeyKingStaff(selectedCards?: string[]): ArtifactEffectResult {
    if (!this.state) {
      return { success: false, message: 'Game not started' }
    }

    if (!selectedCards || selectedCards.length !== 2) {
      if (this.state.player.hand.length < 2) {
        return { success: false, message: '手牌不足2張' }
      }
      return {
        success: false,
        message: '請選擇2張手牌棄掉',
        requiresInput: true,
        inputType: 'SELECT_CARDS',
      }
    }

    // Validate cards are in hand
    const cardsToDiscard = selectedCards.map(id =>
      this.state!.player.hand.find(c => c.instanceId === id)
    )
    if (cardsToDiscard.some(c => !c)) {
      return { success: false, message: '選擇的卡牌不在手牌中' }
    }

    // Discard the cards
    const newHand = this.state.player.hand.filter(
      c => !selectedCards.includes(c.instanceId)
    )
    const discardedCards = cardsToDiscard.filter(c => c) as CardInstance[]
    const newDiscardPile = [
      ...this.state.discardPile,
      ...discardedCards.map(c => ({ ...c, location: CardLocation.DISCARD })),
    ]

    // Gain stones: 1 ONE (red), 1 THREE (blue), 1 SIX (green) based on description
    // Note: Based on artifact description "1 red, 1 blue, 1 green stone"
    // In the game's stone system: ONE=1, THREE=3, SIX=6
    const stonesGained: Partial<StonePool> = {
      ONE: 1,   // 1 red stone (1 point)
      THREE: 1, // 1 blue stone (3 points)
      SIX: 1,   // 1 green stone (6 points) - Actually should be just gaining element stones
    }

    // Actually based on the artifact description, it should be element stones
    // "獲得1顆紅石、1顆藍石和1顆綠石" - these are element stones
    // But the game uses FIRE for red, WATER for blue, EARTH for green
    // Let me reconsider: the description says "red, blue, green" which in game terms means:
    // - Red = FIRE element stone
    // - Blue = WATER element stone
    // - Green = EARTH element stone
    // However, looking at the game's stone economy, the ONE/THREE/SIX are coins, not element stones
    // The artifact likely means: gain 1 of each basic stone type (1 + 3 + 6 = 10 total value)

    // Update stones
    const newStones = addStonesToPool(this.state.player.stones, stonesGained)

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        hand: newHand,
        stones: newStones,
      },
      discardPile: newDiscardPile,
      updatedAt: Date.now(),
    }

    return {
      success: true,
      message: '齊天大聖金箍棒：棄掉2張手牌，獲得1顆紅石、1顆藍石和1顆綠石',
      stonesGained,
      cardsDiscarded: discardedCards,
    }
  }

  /**
   * Get options for Pied Piper's Pipe artifact
   * Option A: Draw 1 card from deck
   * Option B: Recall all cards from sanctuary
   */
  private getPiedPiperPipeOptions(): ArtifactEffectOption[] {
    if (!this.state) return []

    const deckHasCards = this.state.deck.length > 0
    const sanctuaryHasCards = this.state.sanctuary.length > 0
    const handNotFull = this.state.player.hand.length < SINGLE_PLAYER_CONSTANTS.MAX_HAND_SIZE

    return [
      {
        id: 'draw_card',
        description: 'Draw 1 card from deck',
        descriptionTw: '從牌庫抽1張卡',
        available: deckHasCards && handNotFull,
        unavailableReason: !deckHasCards
          ? '牌庫沒有卡牌'
          : !handNotFull
            ? '手牌已滿'
            : undefined,
      },
      {
        id: 'recall_sanctuary',
        description: 'Recall all cards from sanctuary',
        descriptionTw: '召回棲息地所有的卡牌',
        available: sanctuaryHasCards,
        unavailableReason: !sanctuaryHasCards ? '棲息地沒有卡牌' : undefined,
      },
    ]
  }

  /**
   * Execute Pied Piper's Pipe effect (INSTANT)
   * Option A: Draw 1 card from deck
   * Option B: Recall all cards from sanctuary
   */
  private executePiedPiperPipe(optionId?: string): ArtifactEffectResult {
    if (!this.state) {
      return { success: false, message: 'Game not started' }
    }

    if (!optionId) {
      return {
        success: false,
        message: '請選擇效果選項',
        requiresInput: true,
        inputType: 'CHOOSE_OPTION',
        options: this.getPiedPiperPipeOptions(),
      }
    }

    if (optionId === 'draw_card') {
      if (this.state.deck.length === 0) {
        return { success: false, message: '牌庫沒有卡牌' }
      }
      if (this.state.player.hand.length >= SINGLE_PLAYER_CONSTANTS.MAX_HAND_SIZE) {
        return { success: false, message: '手牌已滿' }
      }

      const drawnCard = {
        ...this.state.deck[0],
        location: CardLocation.HAND,
        isRevealed: true,
      }

      this.state = {
        ...this.state,
        deck: this.state.deck.slice(1),
        player: {
          ...this.state.player,
          hand: [...this.state.player.hand, drawnCard],
        },
        updatedAt: Date.now(),
      }

      return {
        success: true,
        message: `吹笛人之笛：從牌庫抽了 ${drawnCard.nameTw}`,
        cardsDrawn: [drawnCard],
      }
    } else if (optionId === 'recall_sanctuary') {
      if (this.state.sanctuary.length === 0) {
        return { success: false, message: '棲息地沒有卡牌' }
      }

      const recalledCards = this.state.sanctuary.map(c => ({
        ...c,
        location: CardLocation.HAND,
      }))

      this.state = {
        ...this.state,
        sanctuary: [],
        player: {
          ...this.state.player,
          hand: [...this.state.player.hand, ...recalledCards],
        },
        updatedAt: Date.now(),
      }

      return {
        success: true,
        message: `吹笛人之笛：召回棲息地的${recalledCards.length}張卡牌`,
        cardsRecalled: recalledCards,
      }
    }

    return { success: false, message: '無效的選項' }
  }

  // ============================================
  // RANDOM ARTIFACT IMPLEMENTATIONS
  // ============================================

  /**
   * Execute Book of Thoth effect (ACTION)
   * Upgrade up to 2 stones by one level (Red → Blue → Green → Purple)
   * Red (ONE) → Blue (THREE) → Green (SIX) → Purple (special 6-point)
   */
  private executeBookOfThoth(selectedStones?: Partial<StonePool>): ArtifactEffectResult {
    if (!this.state) {
      return { success: false, message: 'Game not started' }
    }

    if (!selectedStones) {
      // Check if player has any stones to upgrade
      const { ONE, THREE, SIX } = this.state.player.stones
      if (ONE === 0 && THREE === 0 && SIX === 0) {
        return { success: false, message: '沒有可升級的石頭' }
      }

      return {
        success: false,
        message: '請選擇要升級的石頭（最多2次）',
        requiresInput: true,
        inputType: 'SELECT_STONES',
      }
    }

    // Count total upgrade operations (max 2)
    const upgradeCount = (selectedStones.ONE ?? 0) + (selectedStones.THREE ?? 0) + (selectedStones.SIX ?? 0)
    if (upgradeCount === 0) {
      return { success: false, message: '請至少選擇1顆石頭升級' }
    }
    if (upgradeCount > 2) {
      return { success: false, message: '最多只能升級2次' }
    }

    // Validate player has enough stones
    const currentStones = this.state.player.stones
    if ((selectedStones.ONE ?? 0) > currentStones.ONE) {
      return { success: false, message: '紅石不足' }
    }
    if ((selectedStones.THREE ?? 0) > currentStones.THREE) {
      return { success: false, message: '藍石不足' }
    }
    if ((selectedStones.SIX ?? 0) > currentStones.SIX) {
      return { success: false, message: '紫石不足（紫石無法再升級）' }
    }

    // Perform upgrades: ONE → THREE → SIX → (special purple, not in pool)
    const newStones = { ...currentStones }
    const upgradeOneCount = selectedStones.ONE ?? 0
    const upgradeThreeCount = selectedStones.THREE ?? 0
    const upgradeSixCount = selectedStones.SIX ?? 0

    // ONE → THREE
    newStones.ONE -= upgradeOneCount
    newStones.THREE += upgradeOneCount

    // THREE → SIX
    newStones.THREE -= upgradeThreeCount
    newStones.SIX += upgradeThreeCount

    // SIX → Purple (6-point stone is already the highest level)
    // Purple stones (SIX) are worth 6 points and cannot be upgraded further
    if (upgradeSixCount > 0) {
      return { success: false, message: '紫石（6點）已是最高級，無法升級' }
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        stones: newStones,
      },
      updatedAt: Date.now(),
    }

    const upgradeMessages: string[] = []
    if (upgradeOneCount > 0) upgradeMessages.push(`${upgradeOneCount}顆紅石→藍石`)
    if (upgradeThreeCount > 0) upgradeMessages.push(`${upgradeThreeCount}顆藍石→紫石`)

    return {
      success: true,
      message: `透特之書：升級了${upgradeMessages.join('、')}`,
      stonesSpent: { ONE: upgradeOneCount, THREE: upgradeThreeCount },
      stonesGained: { THREE: upgradeOneCount, SIX: upgradeThreeCount },
    }
  }

  /**
   * Get options for Cap of Hades artifact
   * Option A: Shelter 1 from hand + free buy from market
   * Option B: Gain 1 blue stone
   */
  private getCapOfHadesOptions(): ArtifactEffectOption[] {
    if (!this.state) return []

    const handHasCards = this.state.player.hand.length > 0
    const marketHasCards = this.state.market.length > 0

    return [
      {
        id: 'shelter_and_buy',
        description: 'Shelter 1 card from hand and buy 1 card for free',
        descriptionTw: '將手上的1張卡棲息地並免費購買買入區的1張卡',
        available: handHasCards && marketHasCards,
        unavailableReason: !handHasCards
          ? '手牌沒有卡牌'
          : !marketHasCards
            ? '買入區沒有卡牌'
            : undefined,
      },
      {
        id: 'gain_blue',
        description: 'Gain 1 blue stone (3 points)',
        descriptionTw: '獲得1顆藍石',
        available: true,
      },
    ]
  }

  /**
   * Execute Cap of Hades effect (ACTION)
   * Option A: Shelter 1 from hand + free buy from market
   * Option B: Gain 1 blue stone
   */
  private executeCapOfHades(
    optionId?: string,
    selectedCards?: string[]
  ): ArtifactEffectResult {
    if (!this.state) {
      return { success: false, message: 'Game not started' }
    }

    if (!optionId) {
      return {
        success: false,
        message: '請選擇效果選項',
        requiresInput: true,
        inputType: 'CHOOSE_OPTION',
        options: this.getCapOfHadesOptions(),
      }
    }

    if (optionId === 'shelter_and_buy') {
      if (!selectedCards || selectedCards.length !== 2) {
        return {
          success: false,
          message: '請選擇1張手牌棲息地，以及1張買入區的卡牌購買',
          requiresInput: true,
          inputType: 'SELECT_CARDS',
        }
      }

      const [shelterCardId, buyCardId] = selectedCards

      // Find shelter card in hand
      const shelterCard = this.state.player.hand.find(c => c.instanceId === shelterCardId)
      if (!shelterCard) {
        return { success: false, message: '棲息地的卡牌不在手牌中' }
      }

      // Find buy card in market
      const buyCard = this.state.market.find(c => c.instanceId === buyCardId)
      if (!buyCard) {
        return { success: false, message: '購買的卡牌不在買入區' }
      }

      // Remove shelter card from hand and add to sanctuary
      const newHand = this.state.player.hand.filter(c => c.instanceId !== shelterCardId)
      const shelteredCard = { ...shelterCard, location: CardLocation.FIELD }

      // Remove buy card from market and add to hand
      const newMarket = this.state.market.filter(c => c.instanceId !== buyCardId)
      const boughtCard = { ...buyCard, location: CardLocation.HAND, isRevealed: true }
      newHand.push(boughtCard)

      // Refill market
      let newDeck = this.state.deck
      if (newDeck.length > 0) {
        const refillCard = { ...newDeck[0], location: CardLocation.MARKET, isRevealed: true }
        newMarket.push(refillCard)
        newDeck = newDeck.slice(1)
      }

      this.state = {
        ...this.state,
        deck: newDeck,
        market: newMarket,
        sanctuary: [...this.state.sanctuary, shelteredCard],
        player: {
          ...this.state.player,
          hand: newHand,
        },
        updatedAt: Date.now(),
      }

      return {
        success: true,
        message: `哈迪斯隱形帽：棲息地 ${shelterCard.nameTw}，免費購買 ${buyCard.nameTw}`,
        cardsSheltered: [shelteredCard],
        cardsDrawn: [boughtCard],
      }
    } else if (optionId === 'gain_blue') {
      const stonesGained: Partial<StonePool> = { THREE: 1 }
      const newStones = addStonesToPool(this.state.player.stones, stonesGained)

      this.state = {
        ...this.state,
        player: {
          ...this.state.player,
          stones: newStones,
        },
        updatedAt: Date.now(),
      }

      return {
        success: true,
        message: '哈迪斯隱形帽：獲得1顆藍石',
        stonesGained,
      }
    }

    return { success: false, message: '無效的選項' }
  }

  /**
   * Execute Philosopher's Stone effect (PERMANENT)
   * When selling/discarding a creature card, pay 1 red stone to return to hand
   * This is triggered when a card is being discarded/sold
   * @param selectedCards Array with 1 card ID to return to hand
   */
  private executePhilosopherStone(selectedCards?: string[]): ArtifactEffectResult {
    if (!this.state) {
      return { success: false, message: 'Game not started' }
    }

    // This is a passive effect - check if it can be triggered
    if (!this.artifactState.permanentActive) {
      return { success: false, message: '賢者之石效果未啟動' }
    }

    if (!selectedCards || selectedCards.length !== 1) {
      return { success: false, message: '請選擇要返回手牌的卡牌' }
    }

    // Check if player has 1 red stone (ONE)
    if (this.state.player.stones.ONE < 1) {
      return { success: false, message: '需要1顆紅石來啟動賢者之石效果' }
    }

    const cardId = selectedCards[0]
    // Find card in discard pile (most recent)
    const cardIndex = this.state.discardPile.findIndex(c => c.instanceId === cardId)
    if (cardIndex === -1) {
      return { success: false, message: '卡牌不在棄牌堆中' }
    }

    const card = this.state.discardPile[cardIndex]

    // Deduct 1 red stone
    const newStones = { ...this.state.player.stones }
    newStones.ONE -= 1

    // Return card to hand
    const newDiscardPile = this.state.discardPile.filter(c => c.instanceId !== cardId)
    const returnedCard = { ...card, location: CardLocation.HAND }
    const newHand = [...this.state.player.hand, returnedCard]

    this.state = {
      ...this.state,
      discardPile: newDiscardPile,
      player: {
        ...this.state.player,
        hand: newHand,
        stones: newStones,
      },
      updatedAt: Date.now(),
    }

    return {
      success: true,
      message: `賢者之石：支付1顆紅石，將 ${card.nameTw} 返回手牌`,
      stonesSpent: { ONE: 1 },
      cardsRecalled: [returnedCard],
    }
  }

  /**
   * Execute Imperial Seal effect (ACTION)
   * Discard 1 card from play area. If water element, gain 1 green stone
   */
  private executeImperialSeal(selectedCards?: string[]): ArtifactEffectResult {
    if (!this.state) {
      return { success: false, message: 'Game not started' }
    }

    if (!selectedCards || selectedCards.length !== 1) {
      if (this.state.player.field.length === 0) {
        return { success: false, message: '場上沒有卡牌' }
      }
      return {
        success: false,
        message: '請選擇1張場上的卡牌棄掉',
        requiresInput: true,
        inputType: 'SELECT_CARDS',
      }
    }

    const cardId = selectedCards[0]
    const card = this.state.player.field.find(c => c.instanceId === cardId)
    if (!card) {
      return { success: false, message: '卡牌不在場上' }
    }

    // Remove card from field
    const newField = this.state.player.field.filter(c => c.instanceId !== cardId)
    const discardedCard = { ...card, location: CardLocation.DISCARD }
    const newDiscardPile = [...this.state.discardPile, discardedCard]

    // Check if water element - gain 1 green stone (SIX)
    let stonesGained: Partial<StonePool> | undefined
    let newStones = this.state.player.stones
    if (card.element === Element.WATER) {
      stonesGained = { SIX: 1 }
      newStones = addStonesToPool(newStones, stonesGained)
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        field: newField,
        stones: newStones,
      },
      discardPile: newDiscardPile,
      updatedAt: Date.now(),
    }

    const message = card.element === Element.WATER
      ? `帝王印璽：棄掉水屬性卡 ${card.nameTw}，獲得1顆綠石`
      : `帝王印璽：棄掉 ${card.nameTw}`

    return {
      success: true,
      message,
      stonesGained,
      cardsDiscarded: [discardedCard],
    }
  }

  /**
   * Get options for Ring of Wishes artifact
   * Option A: Recall 1 card from sanctuary to hand
   * Option B: Discard 1 card from sanctuary to gain 1 purple stone (6 points)
   * Can do both if desired
   */
  private getRingOfWishesOptions(): ArtifactEffectOption[] {
    if (!this.state) return []

    const sanctuaryHasCards = this.state.sanctuary.length > 0
    const handNotFull = this.state.player.hand.length < SINGLE_PLAYER_CONSTANTS.MAX_HAND_SIZE

    return [
      {
        id: 'recall_one',
        description: 'Recall 1 card from sanctuary to hand',
        descriptionTw: '從棲息地拿回1張卡到手牌',
        available: sanctuaryHasCards && handNotFull,
        unavailableReason: !sanctuaryHasCards
          ? '棲息地沒有卡牌'
          : !handNotFull
            ? '手牌已滿'
            : undefined,
      },
      {
        id: 'discard_for_purple',
        description: 'Discard 1 card from sanctuary to gain 1 purple stone (6 points)',
        descriptionTw: '從棲息地棄掉1張卡以獲得1顆紫石（6分）',
        available: sanctuaryHasCards,
        unavailableReason: !sanctuaryHasCards ? '棲息地沒有卡牌' : undefined,
      },
      {
        id: 'both',
        description: 'Do both: recall 1 AND discard 1 for purple stone',
        descriptionTw: '兩者都做：拿回1張卡並棄掉另1張卡獲得紫石',
        available: sanctuaryHasCards && this.state.sanctuary.length >= 2 && handNotFull,
        unavailableReason: this.state.sanctuary.length < 2
          ? '棲息地需要至少2張卡'
          : !handNotFull
            ? '手牌已滿'
            : undefined,
      },
    ]
  }

  /**
   * Execute Ring of Wishes effect (INSTANT)
   * Recall 1 from sanctuary AND/OR discard 1 from sanctuary for purple stone
   */
  private executeRingOfWishes(
    optionId?: string,
    selectedCards?: string[]
  ): ArtifactEffectResult {
    if (!this.state) {
      return { success: false, message: 'Game not started' }
    }

    if (!optionId) {
      return {
        success: false,
        message: '請選擇效果選項',
        requiresInput: true,
        inputType: 'CHOOSE_OPTION',
        options: this.getRingOfWishesOptions(),
      }
    }

    if (optionId === 'recall_one') {
      if (!selectedCards || selectedCards.length !== 1) {
        return {
          success: false,
          message: '請選擇1張棲息地的卡牌拿回手牌',
          requiresInput: true,
          inputType: 'SELECT_CARDS',
        }
      }

      const cardId = selectedCards[0]
      const card = this.state.sanctuary.find(c => c.instanceId === cardId)
      if (!card) {
        return { success: false, message: '卡牌不在棲息地' }
      }

      const newSanctuary = this.state.sanctuary.filter(c => c.instanceId !== cardId)
      const recalledCard = { ...card, location: CardLocation.HAND }
      const newHand = [...this.state.player.hand, recalledCard]

      this.state = {
        ...this.state,
        sanctuary: newSanctuary,
        player: {
          ...this.state.player,
          hand: newHand,
        },
        updatedAt: Date.now(),
      }

      return {
        success: true,
        message: `許願戒指：從棲息地拿回 ${card.nameTw}`,
        cardsRecalled: [recalledCard],
      }
    } else if (optionId === 'discard_for_purple') {
      if (!selectedCards || selectedCards.length !== 1) {
        return {
          success: false,
          message: '請選擇1張棲息地的卡牌棄掉',
          requiresInput: true,
          inputType: 'SELECT_CARDS',
        }
      }

      const cardId = selectedCards[0]
      const card = this.state.sanctuary.find(c => c.instanceId === cardId)
      if (!card) {
        return { success: false, message: '卡牌不在棲息地' }
      }

      const newSanctuary = this.state.sanctuary.filter(c => c.instanceId !== cardId)
      const discardedCard = { ...card, location: CardLocation.DISCARD }
      const newDiscardPile = [...this.state.discardPile, discardedCard]

      // Gain 1 purple stone (6 points) - we use SIX as purple is worth 6
      const stonesGained: Partial<StonePool> = { SIX: 1 }
      const newStones = addStonesToPool(this.state.player.stones, stonesGained)

      this.state = {
        ...this.state,
        sanctuary: newSanctuary,
        discardPile: newDiscardPile,
        player: {
          ...this.state.player,
          stones: newStones,
        },
        updatedAt: Date.now(),
      }

      return {
        success: true,
        message: `許願戒指：棄掉 ${card.nameTw}，獲得1顆紫石（6分）`,
        stonesGained,
        cardsDiscarded: [discardedCard],
      }
    } else if (optionId === 'both') {
      if (!selectedCards || selectedCards.length !== 2) {
        return {
          success: false,
          message: '請選擇2張棲息地的卡牌：1張拿回手牌，1張棄掉獲得紫石',
          requiresInput: true,
          inputType: 'SELECT_CARDS',
        }
      }

      const [recallCardId, discardCardId] = selectedCards

      const recallCard = this.state.sanctuary.find(c => c.instanceId === recallCardId)
      const discardCard = this.state.sanctuary.find(c => c.instanceId === discardCardId)

      if (!recallCard || !discardCard) {
        return { success: false, message: '選擇的卡牌不在棲息地' }
      }
      if (recallCardId === discardCardId) {
        return { success: false, message: '請選擇兩張不同的卡牌' }
      }

      const newSanctuary = this.state.sanctuary.filter(
        c => c.instanceId !== recallCardId && c.instanceId !== discardCardId
      )
      const recalledCard = { ...recallCard, location: CardLocation.HAND }
      const discardedCard = { ...discardCard, location: CardLocation.DISCARD }

      const newHand = [...this.state.player.hand, recalledCard]
      const newDiscardPile = [...this.state.discardPile, discardedCard]

      const stonesGained: Partial<StonePool> = { SIX: 1 }
      const newStones = addStonesToPool(this.state.player.stones, stonesGained)

      this.state = {
        ...this.state,
        sanctuary: newSanctuary,
        discardPile: newDiscardPile,
        player: {
          ...this.state.player,
          hand: newHand,
          stones: newStones,
        },
        updatedAt: Date.now(),
      }

      return {
        success: true,
        message: `許願戒指：拿回 ${recallCard.nameTw}，棄掉 ${discardCard.nameTw} 獲得1顆紫石`,
        stonesGained,
        cardsRecalled: [recalledCard],
        cardsDiscarded: [discardedCard],
      }
    }

    return { success: false, message: '無效的選項' }
  }

  /**
   * Execute Gem of Kukulkan effect (ACTION)
   * Activate the instant effect of 1 card from buy area without purchasing
   */
  private executeGemOfKukulkan(selectedCards?: string[]): ArtifactEffectResult {
    if (!this.state) {
      return { success: false, message: 'Game not started' }
    }

    if (!selectedCards || selectedCards.length !== 1) {
      // Find cards with instant effects in market
      const cardsWithEffects = this.state.market.filter(card =>
        card.effects.some(e => e.trigger === EffectTrigger.ON_TAME)
      )

      if (cardsWithEffects.length === 0) {
        return { success: false, message: '買入區沒有具有立即效果的卡牌' }
      }

      return {
        success: false,
        message: '請選擇1張買入區的卡牌啟動其立即效果',
        requiresInput: true,
        inputType: 'SELECT_CARDS',
      }
    }

    const cardId = selectedCards[0]
    const card = this.state.market.find(c => c.instanceId === cardId)
    if (!card) {
      return { success: false, message: '卡牌不在買入區' }
    }

    // Check if card has instant effects
    const instantEffects = card.effects.filter(e => e.trigger === EffectTrigger.ON_TAME)
    if (instantEffects.length === 0) {
      return { success: false, message: `${card.nameTw} 沒有立即效果` }
    }

    // Process the instant effects
    let stonesGained: Partial<StonePool> = {}
    let cardsDrawn: CardInstance[] = []
    const messages: string[] = []

    for (const effect of instantEffects) {
      const effectResult = this.processSingleEffect(effect, card)

      if (effectResult.stonesGained) {
        stonesGained = addStonesToPool(
          stonesGained as StonePool || createEmptyStonePool(),
          effectResult.stonesGained
        )
      }
      if (effectResult.cardsDrawn) {
        cardsDrawn = [...cardsDrawn, ...effectResult.cardsDrawn]
      }
      if (effectResult.message) {
        messages.push(effectResult.message)
      }
    }

    // Apply stone gains
    if (Object.keys(stonesGained).length > 0) {
      this.state = {
        ...this.state,
        player: {
          ...this.state.player,
          stones: addStonesToPool(this.state.player.stones, stonesGained),
        },
        updatedAt: Date.now(),
      }
    }

    // Apply card draws
    if (cardsDrawn.length > 0) {
      // Remove drawn cards from deck and add to hand
      const drawnCardIds = cardsDrawn.map(c => c.instanceId)
      const newDeck = this.state.deck.filter(c => !drawnCardIds.includes(c.instanceId))
      const newHand = [...this.state.player.hand, ...cardsDrawn]

      this.state = {
        ...this.state,
        deck: newDeck,
        player: {
          ...this.state.player,
          hand: newHand,
        },
        updatedAt: Date.now(),
      }
    }

    return {
      success: true,
      message: `庫庫爾坎寶石：啟動 ${card.nameTw} 的立即效果 - ${messages.join(', ')}`,
      stonesGained: Object.keys(stonesGained).length > 0 ? stonesGained : undefined,
      cardsDrawn: cardsDrawn.length > 0 ? cardsDrawn : undefined,
    }
  }

  // ============================================
  // HELPER METHODS FOR ARTIFACT EFFECTS
  // ============================================

  /**
   * Get options for Golden Fleece artifact (4-player)
   * Option A: Gain 2 red stones + shelter 1 from deck
   * Option B: Recall 1 card from play area
   */
  private getGoldenFleeceOptions(): ArtifactEffectOption[] {
    if (!this.state) return []

    const deckHasCards = this.state.deck.length > 0
    const fieldHasCards = this.state.player.field.length > 0

    return [
      {
        id: 'stones_and_shelter',
        description: 'Gain 2 red stones and shelter 1 from deck',
        descriptionTw: '獲得2顆紅石並將牌庫頂的1張卡棲息地',
        available: deckHasCards,
        unavailableReason: !deckHasCards ? '牌庫沒有卡牌' : undefined,
      },
      {
        id: 'recall_from_field',
        description: 'Recall 1 card from your play area',
        descriptionTw: '從場上召回1張卡',
        available: fieldHasCards,
        unavailableReason: !fieldHasCards ? '場上沒有卡牌' : undefined,
      },
    ]
  }

  /**
   * Deduct stones from player pool
   * Prefers smaller denominations first
   * @param amount Amount to deduct
   * @returns Stones deducted or null if insufficient
   */
  private deductStones(amount: number): Partial<StonePool> | null {
    if (!this.state) return null

    const currentStones = this.state.player.stones
    const totalValue = calculateStonePoolValue(currentStones)
    if (totalValue < amount) return null

    const deducted: Partial<StonePool> = {}
    let remaining = amount
    const newStones = { ...currentStones }

    // Deduct ONE stones first (1 point each)
    while (remaining > 0 && newStones.ONE > 0) {
      newStones.ONE--
      deducted.ONE = (deducted.ONE ?? 0) + 1
      remaining--
    }

    // Then THREE stones (3 points each)
    while (remaining > 0 && newStones.THREE > 0) {
      newStones.THREE--
      deducted.THREE = (deducted.THREE ?? 0) + 1
      remaining -= 3
    }

    // Then SIX stones (6 points each)
    while (remaining > 0 && newStones.SIX > 0) {
      newStones.SIX--
      deducted.SIX = (deducted.SIX ?? 0) + 1
      remaining -= 6
    }

    // If we've deducted enough
    if (remaining <= 0) {
      this.state = {
        ...this.state,
        player: {
          ...this.state.player,
          stones: newStones,
        },
        updatedAt: Date.now(),
      }
      return deducted
    }

    return null
  }

  /**
   * Check if Philosopher's Stone can be triggered
   * Called when a card is about to be discarded/sold
   * @returns true if the effect can be triggered
   */
  canTriggerPhilosopherStone(): boolean {
    if (!this.state) return false
    if (this.artifactState.artifactId !== 'philosopher_stone') return false
    if (!this.artifactState.permanentActive) return false

    // Check if player has 1 red stone
    return this.state.player.stones.ONE >= 1
  }

  /**
   * Add stones to player pool (public method for UI)
   * @param stones Stones to add
   * @returns Updated game state
   */
  addStones(stones: Partial<StonePool>): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        stones: addStonesToPool(this.state.player.stones, stones),
      },
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    return this.state
  }

  /**
   * Remove stones from player pool (public method for UI)
   * @param stones Stones to remove
   * @returns Updated game state
   */
  removeStones(stones: Partial<StonePool>): SinglePlayerGameState {
    if (!this.state) {
      throw new SinglePlayerError(
        SinglePlayerErrorCode.ERR_GAME_NOT_STARTED,
        'Game not started'
      )
    }

    const newStones = { ...this.state.player.stones }
    for (const [key, value] of Object.entries(stones)) {
      const stoneKey = key as keyof StonePool
      if (value && newStones[stoneKey] >= value) {
        newStones[stoneKey] -= value
      } else if (value) {
        throw new SinglePlayerError(
          SinglePlayerErrorCode.ERR_INSUFFICIENT_STONES,
          `Insufficient ${key} stones`
        )
      }
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        stones: newStones,
      },
      updatedAt: Date.now(),
    }

    this.notifyStateChange()
    return this.state
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

/**
 * Default single player engine instance
 */
export const singlePlayerEngine = new SinglePlayerEngine()
