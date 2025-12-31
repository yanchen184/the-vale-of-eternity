/**
 * Test helper functions and factories
 * Based on TEST_SPEC.md requirements
 * @version 1.0.0
 */
import type { CardInstance, CardTemplate } from '@/types/cards'

// Simple ID generator for tests
let idCounter = 0
function generateTestId(): string {
  return `test-${++idCounter}-${Math.random().toString(36).slice(2, 10)}`
}
import { Element, EffectType, EffectTrigger, CardLocation } from '@/types/cards'
import type { MVPGameState, MVPPlayerState } from '@/lib/game-engine'
import { GamePhase } from '@/lib/game-engine'

// ============================================
// PLAYER FACTORIES
// ============================================

/**
 * Create a test player state with optional overrides
 */
export function createTestPlayer(overrides: Partial<MVPPlayerState> = {}): MVPPlayerState {
  const id = overrides.id ?? `player-${generateTestId()}`
  return {
    id,
    name: overrides.name ?? 'Test Player',
    index: overrides.index ?? 0,
    stones: overrides.stones ?? 0,
    stoneLimit: overrides.stoneLimit ?? 3,
    score: overrides.score ?? 0,
    roundScore: overrides.roundScore ?? 0,
    hand: overrides.hand ?? [],
    field: overrides.field ?? [],
    hasActedThisPhase: overrides.hasActedThisPhase ?? false,
    hasPassed: overrides.hasPassed ?? false,
  }
}

// ============================================
// CARD FACTORIES
// ============================================

/**
 * Create a test card instance with optional overrides
 */
export function createTestCard(overrides: Partial<CardInstance> = {}): CardInstance {
  const instanceId = overrides.instanceId ?? `card-${generateTestId()}`
  return {
    instanceId,
    cardId: overrides.cardId ?? 'TEST001',
    name: overrides.name ?? 'Test Card',
    nameTw: overrides.nameTw ?? '測試卡片',
    element: overrides.element ?? Element.FIRE,
    cost: overrides.cost ?? 1,
    baseScore: overrides.baseScore ?? 2,
    effects: overrides.effects ?? [],
    effectType: overrides.effectType ?? EffectType.NONE,
    effectTrigger: overrides.effectTrigger ?? EffectTrigger.NONE,
    effectValue: overrides.effectValue,
    effectTarget: overrides.effectTarget,
    effectDescription: overrides.effectDescription ?? '',
    effectDescriptionTw: overrides.effectDescriptionTw ?? '',
    ownerId: overrides.ownerId ?? null,
    location: overrides.location ?? CardLocation.DECK,
    isRevealed: overrides.isRevealed ?? false,
    scoreModifier: overrides.scoreModifier ?? 0,
    hasUsedAbility: overrides.hasUsedAbility ?? false,
  }
}

/**
 * Create a test card template with optional overrides
 */
export function createTestCardTemplate(overrides: Partial<CardTemplate> = {}): CardTemplate {
  return {
    id: overrides.id ?? 'TEST001',
    name: overrides.name ?? 'Test Card',
    nameTw: overrides.nameTw ?? '測試卡片',
    element: overrides.element ?? Element.FIRE,
    cost: overrides.cost ?? 1,
    baseScore: overrides.baseScore ?? 2,
    effects: overrides.effects ?? [],
    effectType: overrides.effectType ?? EffectType.NONE,
    effectTrigger: overrides.effectTrigger ?? EffectTrigger.NONE,
    effectValue: overrides.effectValue,
    effectTarget: overrides.effectTarget,
    effectDescription: overrides.effectDescription ?? '',
    effectDescriptionTw: overrides.effectDescriptionTw ?? '',
    flavorText: overrides.flavorText,
    flavorTextTw: overrides.flavorTextTw,
  }
}

/**
 * Create a fire card with specific effect
 */
export function createFireCard(overrides: Partial<CardInstance> = {}): CardInstance {
  return createTestCard({
    element: Element.FIRE,
    ...overrides,
  })
}

/**
 * Create a water card with specific effect
 */
export function createWaterCard(overrides: Partial<CardInstance> = {}): CardInstance {
  return createTestCard({
    element: Element.WATER,
    ...overrides,
  })
}

/**
 * Create a dragon card with specific effect
 */
export function createDragonCard(overrides: Partial<CardInstance> = {}): CardInstance {
  return createTestCard({
    element: Element.DRAGON,
    ...overrides,
  })
}

/**
 * Create a card with EARN_PER_ELEMENT effect (scores per element)
 */
export function createScorePerElementCard(
  targetElement: Element,
  effectValue: number = 1,
  overrides: Partial<CardInstance> = {}
): CardInstance {
  return createTestCard({
    effectType: EffectType.EARN_PER_ELEMENT,
    effectTrigger: EffectTrigger.ON_SCORE,
    effectTarget: targetElement,
    effectValue,
    ...overrides,
  })
}

/**
 * Create a card with EARN_PER_FAMILY effect (scores per dragon)
 */
export function createScorePerDragonCard(
  effectValue: number = 2,
  overrides: Partial<CardInstance> = {}
): CardInstance {
  return createTestCard({
    element: Element.DRAGON,
    effectType: EffectType.EARN_PER_FAMILY,
    effectTrigger: EffectTrigger.ON_SCORE,
    effectValue,
    ...overrides,
  })
}

/**
 * Create a card with EARN_STONES effect
 */
export function createGainStonesCard(
  stonesAmount: number = 2,
  overrides: Partial<CardInstance> = {}
): CardInstance {
  return createTestCard({
    effectType: EffectType.EARN_STONES,
    effectTrigger: EffectTrigger.ON_TAME,
    effectValue: stonesAmount,
    ...overrides,
  })
}

/**
 * Create a card with INCREASE_STONE_LIMIT effect
 */
export function createIncreaseStoneLimitCard(
  limitIncrease: number = 2,
  overrides: Partial<CardInstance> = {}
): CardInstance {
  return createTestCard({
    effectType: EffectType.INCREASE_STONE_LIMIT,
    effectTrigger: EffectTrigger.PERMANENT,
    effectValue: limitIncrease,
    ...overrides,
  })
}

/**
 * Create a card with RECOVER_CARD effect (draw from discard)
 */
export function createDrawFromDiscardCard(
  drawCount: number = 1,
  overrides: Partial<CardInstance> = {}
): CardInstance {
  return createTestCard({
    effectType: EffectType.RECOVER_CARD,
    effectTrigger: EffectTrigger.ON_TAME,
    effectValue: drawCount,
    ...overrides,
  })
}

// ============================================
// GAME STATE FACTORIES
// ============================================

/**
 * Create a test game state with optional overrides
 */
export function createTestState(overrides: Partial<MVPGameState> = {}): MVPGameState {
  const player1 = overrides.players?.[0] ?? createTestPlayer({ index: 0, name: 'Player 1' })
  const player2 = overrides.players?.[1] ?? createTestPlayer({ index: 1, name: 'Player 2' })

  return {
    gameId: overrides.gameId ?? `game-${generateTestId()}`,
    version: overrides.version ?? 'MVP-1.0.0',
    phase: overrides.phase ?? GamePhase.HUNTING,
    round: overrides.round ?? 1,
    turn: overrides.turn ?? 1,
    players: [player1, player2] as [MVPPlayerState, MVPPlayerState],
    currentPlayerIndex: overrides.currentPlayerIndex ?? 0,
    firstPlayerIndex: overrides.firstPlayerIndex ?? 0,
    deck: overrides.deck ?? [],
    market: overrides.market ?? [],
    discardPile: overrides.discardPile ?? [],
    huntingSelections: overrides.huntingSelections ?? [],
    actionsThisPhase: overrides.actionsThisPhase ?? [],
    isGameOver: overrides.isGameOver ?? false,
    winner: overrides.winner ?? null,
    endReason: overrides.endReason ?? null,
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt ?? Date.now(),
  }
}

/**
 * Create a game state with specific player stones
 */
export function createTestStateWithStones(
  p1Stones: number,
  p2Stones: number = 0
): MVPGameState {
  return createTestState({
    players: [
      createTestPlayer({ index: 0, stones: p1Stones }),
      createTestPlayer({ index: 1, stones: p2Stones }),
    ] as [MVPPlayerState, MVPPlayerState],
  })
}

/**
 * Create a game state in ACTION phase
 */
export function createActionPhaseState(overrides: Partial<MVPGameState> = {}): MVPGameState {
  return createTestState({
    phase: GamePhase.ACTION,
    ...overrides,
  })
}

/**
 * Create a game state in RESOLUTION phase
 */
export function createResolutionPhaseState(overrides: Partial<MVPGameState> = {}): MVPGameState {
  return createTestState({
    phase: GamePhase.RESOLUTION,
    ...overrides,
  })
}

// ============================================
// DECK UTILITIES
// ============================================

/**
 * Create a simple test deck with specified cards
 */
export function createTestDeck(count: number = 10): CardInstance[] {
  return Array.from({ length: count }, (_, i) =>
    createTestCard({
      instanceId: `deck-card-${i}`,
      cardId: `DECK${i.toString().padStart(3, '0')}`,
      location: CardLocation.DECK,
    })
  )
}

/**
 * Create market cards
 */
export function createTestMarket(count: number = 4): CardInstance[] {
  return Array.from({ length: count }, (_, i) =>
    createTestCard({
      instanceId: `market-card-${i}`,
      cardId: `MARKET${i.toString().padStart(3, '0')}`,
      location: CardLocation.MARKET,
      isRevealed: true,
    })
  )
}

// ============================================
// ASSERTION HELPERS
// ============================================

/**
 * Helper to count cards by element in a card array
 */
export function countByElement(cards: CardInstance[], element: Element): number {
  return cards.filter(c => c.element === element).length
}

/**
 * Helper to count cards by effect type
 */
export function countByEffectType(cards: CardInstance[], effectType: EffectType): number {
  return cards.filter(c => c.effectType === effectType).length
}

/**
 * Helper to check if a card array has unique instance IDs
 */
export function hasUniqueIds(cards: CardInstance[]): boolean {
  const ids = cards.map(c => c.instanceId)
  return new Set(ids).size === ids.length
}

// ============================================
// SIMULATION HELPERS
// ============================================

/**
 * Advance game state to specific round (mocked)
 */
export function advanceToRound(state: MVPGameState, targetRound: number): MVPGameState {
  return {
    ...state,
    round: targetRound,
    updatedAt: Date.now(),
  }
}

/**
 * Set player score (for testing victory conditions)
 */
export function setPlayerScore(
  state: MVPGameState,
  playerIndex: 0 | 1,
  score: number
): MVPGameState {
  const players = [...state.players] as [MVPPlayerState, MVPPlayerState]
  players[playerIndex] = { ...players[playerIndex], score }
  return {
    ...state,
    players,
    updatedAt: Date.now(),
  }
}

/**
 * Add card to player's field
 */
export function addCardToField(
  state: MVPGameState,
  playerIndex: 0 | 1,
  card: CardInstance
): MVPGameState {
  const players = [...state.players] as [MVPPlayerState, MVPPlayerState]
  players[playerIndex] = {
    ...players[playerIndex],
    field: [...players[playerIndex].field, { ...card, location: CardLocation.FIELD }],
  }
  return {
    ...state,
    players,
    updatedAt: Date.now(),
  }
}

/**
 * Add card to player's hand
 */
export function addCardToHand(
  state: MVPGameState,
  playerIndex: 0 | 1,
  card: CardInstance
): MVPGameState {
  const players = [...state.players] as [MVPPlayerState, MVPPlayerState]
  players[playerIndex] = {
    ...players[playerIndex],
    hand: [...players[playerIndex].hand, { ...card, location: CardLocation.HAND }],
  }
  return {
    ...state,
    players,
    updatedAt: Date.now(),
  }
}
