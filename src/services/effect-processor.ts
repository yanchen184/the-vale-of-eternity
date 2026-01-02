/**
 * Effect Processor for The Vale of Eternity
 * Handles all card effect processing (ON_TAME, PERMANENT, ON_SCORE)
 * @version 3.2.0 - Only execute fully implemented effects
 */
console.log('[services/effect-processor.ts] v3.2.0 loaded')

import { ref, get, update } from 'firebase/database'
import { database } from '@/lib/firebase'
import { getBaseCardById } from '@/data/cards'
import type { CardEffect } from '@/types/cards'
// Note: CardTemplate is used indirectly via getBaseCardById return type
import { EffectType, EffectTrigger, StoneType, CardLocation } from '@/types/cards'
import type { PlayerState, StonePool, CardInstanceData } from './multiplayer-game'
import { isEffectFullyImplemented } from '@/utils/effect-implementation-status'

// ============================================
// TYPES
// ============================================

export interface EffectContext {
  gameId: string
  playerId: string
  cardInstanceId: string
  currentPlayerState: PlayerState
  allPlayers: { [playerId: string]: PlayerState }
  gameCards: { [instanceId: string]: CardInstanceData }
}

export interface EffectResult {
  success: boolean
  stonesGained?: Partial<StonePool>
  cardsDrawn?: string[]
  cardsMoved?: { instanceId: string; from: CardLocation; to: CardLocation }[]
  message?: string
  error?: string
}

// ============================================
// EFFECT PROCESSOR
// ============================================

export class EffectProcessor {
  /**
   * Process all ON_TAME effects for a card
   */
  async processOnTameEffects(context: EffectContext): Promise<EffectResult[]> {
    const { cardInstanceId, gameCards } = context
    const card = gameCards[cardInstanceId]

    if (!card) {
      return [{ success: false, error: 'Card not found' }]
    }

    // Get card template to access effects
    const template = getBaseCardById(card.cardId)
    if (!template) {
      return [{ success: false, error: 'Card template not found' }]
    }

    // Filter ON_TAME effects
    const onTameEffects = template.effects.filter(effect => effect.trigger === EffectTrigger.ON_TAME)

    if (onTameEffects.length === 0) {
      return [{ success: true, message: 'No ON_TAME effects' }]
    }

    // Process each effect
    const results: EffectResult[] = []
    for (const effect of onTameEffects) {
      const result = await this.processEffect(effect, context)
      results.push(result)
    }

    return results
  }

  /**
   * Process a single effect
   */
  async processEffect(effect: CardEffect, context: EffectContext): Promise<EffectResult> {
    // Check if effect is fully implemented
    if (!isEffectFullyImplemented(effect.type)) {
      console.log(`[EffectProcessor] Effect ${effect.type} is not fully implemented, skipping execution`)
      return {
        success: false,
        message: `效果 ${effect.type} 尚未實現，不會自動執行`,
      }
    }

    switch (effect.type) {
      case EffectType.EARN_STONES:
        return this.processEarnStones(effect, context)

      case EffectType.DRAW_CARD:
        return this.processDrawCard(effect, context)

      case EffectType.EXCHANGE_STONES:
        return this.processExchangeStones(effect, context)

      case EffectType.DISCARD_FROM_HAND:
        return this.processDiscardFromHand(effect, context)

      case EffectType.RECOVER_CARD:
        return this.processRecoverCard(effect, context)

      case EffectType.FREE_SUMMON:
        return this.processFreeSummon(effect, context)

      case EffectType.COPY_INSTANT_EFFECT:
        return this.processCopyInstantEffect(effect, context)

      case EffectType.CONDITIONAL_EARN:
        return this.processConditionalEarn(effect, context)

      // TODO: Implement other effect types
      default:
        return {
          success: false,
          error: `Effect type ${effect.type} not implemented yet`,
        }
    }
  }

  /**
   * EARN_STONES - Gain stones
   */
  private async processEarnStones(effect: CardEffect, context: EffectContext): Promise<EffectResult> {
    const { gameId, playerId } = context

    if (!effect.stones || effect.stones.length === 0) {
      return { success: false, error: 'No stones specified in effect' }
    }

    const stonesGained: Partial<StonePool> = {}

    for (const stoneConfig of effect.stones) {
      const stoneType = stoneConfig.type
      stonesGained[stoneType] = (stonesGained[stoneType] || 0) + stoneConfig.amount
    }

    // Update player's stones
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
    const playerSnapshot = await get(playerRef)

    if (!playerSnapshot.exists()) {
      return { success: false, error: 'Player not found' }
    }

    const player: PlayerState = playerSnapshot.val()
    const updatedStones = { ...player.stones }

    for (const [stoneType, amount] of Object.entries(stonesGained)) {
      updatedStones[stoneType as StoneType] += amount
    }

    await update(playerRef, { stones: updatedStones })

    return {
      success: true,
      stonesGained,
      message: `Gained stones: ${JSON.stringify(stonesGained)}`,
    }
  }

  /**
   * DRAW_CARD - Draw cards from deck
   */
  private async processDrawCard(effect: CardEffect, context: EffectContext): Promise<EffectResult> {
    const { gameId, playerId } = context
    const drawCount = effect.value || 1

    // Get game state
    const gameRef = ref(database, `games/${gameId}`)
    const gameSnapshot = await get(gameRef)

    if (!gameSnapshot.exists()) {
      return { success: false, error: 'Game not found' }
    }

    const game = gameSnapshot.val()
    const deckIds = game.deckIds || []

    if (deckIds.length < drawCount) {
      return {
        success: false,
        error: `Not enough cards in deck. Need ${drawCount}, have ${deckIds.length}`,
      }
    }

    // Draw cards from deck
    const drawnCards = deckIds.slice(0, drawCount)
    const remainingDeck = deckIds.slice(drawCount)

    // Update game deck
    await update(gameRef, { deckIds: remainingDeck })

    // Add cards to player's hand
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
    const playerSnapshot = await get(playerRef)

    if (!playerSnapshot.exists()) {
      return { success: false, error: 'Player not found' }
    }

    const player: PlayerState = playerSnapshot.val()
    const updatedHand = [...player.hand, ...drawnCards]

    await update(playerRef, { hand: updatedHand })

    // Update card locations
    for (const cardId of drawnCards) {
      await update(ref(database, `games/${gameId}/cards/${cardId}`), {
        location: CardLocation.HAND,
        ownerId: playerId,
      })
    }

    return {
      success: true,
      cardsDrawn: drawnCards,
      message: `Drew ${drawCount} card(s)`,
    }
  }

  /**
   * EXCHANGE_STONES - Exchange stone types
   */
  private async processExchangeStones(
    _effect: CardEffect,
    _context: EffectContext
  ): Promise<EffectResult> {
    // This requires user interaction to choose which stones to exchange
    // For now, return a message indicating manual processing needed
    return {
      success: true,
      message: 'Exchange stones effect requires user interaction',
    }
  }

  /**
   * DISCARD_FROM_HAND - Discard cards from hand
   */
  private async processDiscardFromHand(
    _effect: CardEffect,
    _context: EffectContext
  ): Promise<EffectResult> {
    // Requires user interaction to choose which cards to discard
    return {
      success: true,
      message: 'Discard from hand effect requires user interaction',
    }
  }

  /**
   * RECOVER_CARD - Passive effect (card can be recovered)
   */
  private async processRecoverCard(_effect: CardEffect, _context: EffectContext): Promise<EffectResult> {
    // This is a passive effect, just mark it in the card instance
    return {
      success: true,
      message: 'Card marked as recoverable',
    }
  }

  /**
   * FREE_SUMMON - Free summon another card
   */
  private async processFreeSummon(_effect: CardEffect, _context: EffectContext): Promise<EffectResult> {
    // Requires user interaction to choose which card to summon
    return {
      success: true,
      message: 'Free summon effect requires user interaction',
    }
  }

  /**
   * COPY_INSTANT_EFFECT - Copy another card's instant effect
   */
  private async processCopyInstantEffect(
    _effect: CardEffect,
    _context: EffectContext
  ): Promise<EffectResult> {
    // Requires user interaction to choose which card's effect to copy
    return {
      success: true,
      message: 'Copy instant effect requires user interaction',
    }
  }

  /**
   * CONDITIONAL_EARN - Earn stones based on condition
   */
  private async processConditionalEarn(
    effect: CardEffect,
    context: EffectContext
  ): Promise<EffectResult> {
    const { currentPlayerState, gameCards } = context

    // Count cards in player's field matching the condition
    let matchCount = 0

    if (effect.targetElement) {
      // Count cards of specific element
      for (const cardId of currentPlayerState.field) {
        const card = gameCards[cardId]
        if (card && card.element === effect.targetElement) {
          matchCount++
        }
      }
    }

    const stonesGained: Partial<StonePool> = {}

    if (effect.stones && effect.stones.length > 0) {
      for (const stoneConfig of effect.stones) {
        const totalAmount = stoneConfig.amount * matchCount
        stonesGained[stoneConfig.type] = (stonesGained[stoneConfig.type] || 0) + totalAmount
      }

      // Update player's stones
      const { gameId, playerId } = context
      const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
      const playerSnapshot = await get(playerRef)

      if (!playerSnapshot.exists()) {
        return { success: false, error: 'Player not found' }
      }

      const player: PlayerState = playerSnapshot.val()
      const updatedStones = { ...player.stones }

      for (const [stoneType, amount] of Object.entries(stonesGained)) {
        updatedStones[stoneType as StoneType] += amount
      }

      await update(playerRef, { stones: updatedStones })

      return {
        success: true,
        stonesGained,
        message: `Earned ${JSON.stringify(stonesGained)} from ${matchCount} matching cards`,
      }
    }

    return { success: false, error: 'No stones specified in conditional effect' }
  }

  /**
   * Calculate PERMANENT effects on stones
   */
  calculatePermanentEffects(playerState: PlayerState, gameCards: { [id: string]: CardInstanceData }): {
    stoneValueModifiers: Partial<Record<StoneType, number>>
    costReductions: { [element: string]: number }
  } {
    const stoneValueModifiers: Partial<Record<StoneType, number>> = {}
    const costReductions: { [element: string]: number } = {}

    // Iterate through all cards in field
    for (const cardId of playerState.field) {
      const card = gameCards[cardId]
      if (!card) continue

      const template = getBaseCardById(card.cardId)
      if (!template) continue

      // Check for PERMANENT effects
      const permanentEffects = template.effects.filter(
        effect => effect.trigger === EffectTrigger.PERMANENT
      )

      for (const effect of permanentEffects) {
        if (effect.type === EffectType.INCREASE_STONE_VALUE) {
          // Increase stone value
          const value = effect.value || 1
          // This effect might specify which stones are affected
          // For now, apply to all stones (simplified)
          for (const stoneType of Object.values(StoneType)) {
            stoneValueModifiers[stoneType] = (stoneValueModifiers[stoneType] || 0) + value
          }
        }

        if (effect.type === EffectType.DECREASE_COST) {
          // Decrease cost for specific element
          if (effect.targetElement) {
            const element = effect.targetElement
            const value = effect.value || 1
            costReductions[element] = (costReductions[element] || 0) + value
          }
        }
      }
    }

    return { stoneValueModifiers, costReductions }
  }
}

export const effectProcessor = new EffectProcessor()
