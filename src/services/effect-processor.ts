/**
 * Effect Processor for The Vale of Eternity
 * Handles all card effect processing (ON_TAME, PERMANENT, ON_SCORE)
 * @version 4.8.0 - Fixed: EARN_PER_FAMILY gives points not stones (F015 Surtr)
 */
console.log('[services/effect-processor.ts] v4.8.0 loaded')

import { ref, get, update } from 'firebase/database'
import { database } from '@/lib/firebase'
import { getBaseCardById } from '@/data/cards'
import type { CardEffect } from '@/types/cards'
// Note: CardTemplate is used indirectly via getBaseCardById return type
import { EffectType, EffectTrigger, StoneType, CardLocation, Element } from '@/types/cards'
import type { PlayerState, StonePool, CardInstanceData } from './multiplayer-game'
// Reserved for future effect validation
// import { isEffectFullyImplemented } from '@/utils/effect-implementation-status'

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
  scoreChange?: number
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

    console.log(`[EffectProcessor] ========== processOnTameEffects START ==========`)
    console.log(`[EffectProcessor] Card instance ID:`, cardInstanceId)
    console.log(`[EffectProcessor] Card:`, card)

    if (!card) {
      console.log(`[EffectProcessor] ❌ Card not found!`)
      return [{ success: false, error: 'Card not found' }]
    }

    // Get card template to access effects
    const template = getBaseCardById(card.cardId)
    console.log(`[EffectProcessor] Template:`, template?.nameTw, template?.id)

    if (!template) {
      console.log(`[EffectProcessor] ❌ Card template not found!`)
      return [{ success: false, error: 'Card template not found' }]
    }

    // Filter ON_TAME effects
    const onTameEffects = template.effects.filter(effect => effect.trigger === EffectTrigger.ON_TAME)
    console.log(`[EffectProcessor] ON_TAME effects found:`, onTameEffects.length)

    if (onTameEffects.length === 0) {
      console.log(`[EffectProcessor] No ON_TAME effects to process`)
      return [{ success: true, message: 'No ON_TAME effects' }]
    }

    // Process each effect
    const results: EffectResult[] = []
    for (const effect of onTameEffects) {
      console.log(`[EffectProcessor] Processing effect:`, effect.type, `isImplemented:`, effect.isImplemented)
      const result = await this.processEffect(effect, context)
      console.log(`[EffectProcessor] Effect result:`, result)
      results.push(result)
    }

    console.log(`[EffectProcessor] ========== processOnTameEffects END ==========`)
    console.log(`[EffectProcessor] Total results:`, results.length)
    return results
  }

  /**
   * Process a single effect
   */
  async processEffect(effect: CardEffect, context: EffectContext): Promise<EffectResult> {
    // Check if effect is fully implemented using effect.isImplemented property
    if (effect.isImplemented !== true) {
      console.log(`[EffectProcessor] Effect ${effect.type} is not marked as implemented (isImplemented=${effect.isImplemented}), skipping execution`)
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

      case EffectType.EARN_PER_ELEMENT:
        return this.processEarnPerElement(effect, context)

      case EffectType.CONDITIONAL_AREA:
        return this.processConditionalArea(effect, context)

      case EffectType.CONDITIONAL_HAND:
        return this.processConditionalHand(effect, context)

      case EffectType.EARN_PER_FAMILY:
        return this.processEarnPerFamily(effect, context)

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

    console.log(`[EffectProcessor] processEarnStones called`)
    console.log(`[EffectProcessor] effect.stones:`, effect.stones)

    if (!effect.stones || effect.stones.length === 0) {
      console.log(`[EffectProcessor] ❌ No stones specified in effect`)
      return { success: false, error: 'No stones specified in effect' }
    }

    const stonesGained: Partial<StonePool> = {}

    for (const stoneConfig of effect.stones) {
      const stoneType = stoneConfig.type
      stonesGained[stoneType] = (stonesGained[stoneType] || 0) + stoneConfig.amount
      console.log(`[EffectProcessor] Processing stone: type=${stoneType}, amount=${stoneConfig.amount}`)
    }

    console.log(`[EffectProcessor] Total stones to gain:`, stonesGained)

    // Update player's stones
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
    const playerSnapshot = await get(playerRef)

    if (!playerSnapshot.exists()) {
      console.log(`[EffectProcessor] ❌ Player not found`)
      return { success: false, error: 'Player not found' }
    }

    const player: PlayerState = playerSnapshot.val()
    const updatedStones = { ...player.stones }
    console.log(`[EffectProcessor] Current stones BEFORE:`, player.stones)

    for (const [stoneType, amount] of Object.entries(stonesGained)) {
      updatedStones[stoneType as StoneType] += amount
      console.log(`[EffectProcessor] Adding ${amount} to ${stoneType}: ${player.stones[stoneType as StoneType]} → ${updatedStones[stoneType as StoneType]}`)
    }

    console.log(`[EffectProcessor] Updated stones AFTER:`, updatedStones)
    await update(playerRef, { stones: updatedStones })
    console.log(`[EffectProcessor] ✅ Firebase updated successfully`)

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
   * Supports:
   * - F009 Burning Skull: Discard 1-stone, earn 3 points
   */
  private async processExchangeStones(
    effect: CardEffect,
    context: EffectContext
  ): Promise<EffectResult> {
    const { gameId, playerId, currentPlayerState, cardInstanceId, gameCards } = context

    // Get the card that triggered this effect
    const triggerCard = gameCards[cardInstanceId]
    const triggerCardId = triggerCard?.cardId

    // F009 Burning Skull: Discard 1-stone, earn 3 points
    if (triggerCardId === 'F009') {
      // Check if player has at least one 1-stone
      const oneStoneCount = currentPlayerState.stones[StoneType.ONE] || 0
      if (oneStoneCount < 1) {
        return {
          success: false,
          error: 'Not enough 1-stones to exchange (requires at least 1)',
        }
      }

      // Discard one 1-stone
      const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
      const playerSnapshot = await get(playerRef)
      if (!playerSnapshot.exists()) {
        return { success: false, error: 'Player not found' }
      }

      const player: PlayerState = playerSnapshot.val()
      const updatedStones = { ...player.stones }
      updatedStones[StoneType.ONE] -= 1

      // Earn 3 points
      const pointsEarned = effect.value || 3
      const newScore = (player.score || 0) + pointsEarned

      await update(playerRef, {
        stones: updatedStones,
        score: newScore
      })

      console.log(`[EffectProcessor] F009 Burning Skull: Discarded 1 ONE-stone, earned ${pointsEarned} points. Score: ${player.score} -> ${newScore}`)

      return {
        success: true,
        scoreChange: pointsEarned,
        message: `Exchanged 1 ONE-stone for ${pointsEarned} points`,
      }
    }

    // Other EXCHANGE_STONES effects require user interaction
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
   * EARN_PER_ELEMENT - Earn stones OR points for each card on field
   * Supports:
   * - Default: Give stones per field card
   * - F010 Lava Giant: Give 2 points per FIRE element card
   * - W015 Poseidon: Give 3 points per WATER element card
   * - A012 Freyja: Give 1 point per card with ON_SCORE effect
   */
  private async processEarnPerElement(
    effect: CardEffect,
    context: EffectContext
  ): Promise<EffectResult> {
    const { gameId, playerId, currentPlayerState, gameCards, cardInstanceId } = context

    // Get the card that triggered this effect
    const triggerCard = gameCards[cardInstanceId]
    const triggerCardId = triggerCard?.cardId

    // Check if this is a SCORE-based effect (F010, W015, A012)
    const scoreBasedCards = ['F010', 'W015', 'A012']
    const isScoreBased = scoreBasedCards.includes(triggerCardId || '')

    if (isScoreBased) {
      return this.processEarnPerElementScore(effect, context, triggerCardId || '')
    }

    // Default: Give stones per field card
    const fieldCardCount = currentPlayerState.field.length

    console.log(`[EffectProcessor] EARN_PER_ELEMENT: field has ${fieldCardCount} cards`)

    if (!effect.stones || effect.stones.length === 0) {
      return { success: false, error: 'No stones specified in effect' }
    }

    const stonesGained: Partial<StonePool> = {}

    // Calculate stones based on field card count
    for (const stoneConfig of effect.stones) {
      const totalAmount = stoneConfig.amount * fieldCardCount
      stonesGained[stoneConfig.type] = (stonesGained[stoneConfig.type] || 0) + totalAmount
    }

    // Update player's stones in Firebase
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
    const playerSnapshot = await get(playerRef)

    if (!playerSnapshot.exists()) {
      return { success: false, error: 'Player not found' }
    }

    const player: PlayerState = playerSnapshot.val()
    const updatedStones = { ...player.stones }

    for (const [stoneType, amount] of Object.entries(stonesGained)) {
      updatedStones[stoneType as StoneType] = (updatedStones[stoneType as StoneType] || 0) + amount
    }

    await update(playerRef, { stones: updatedStones })

    console.log(`[EffectProcessor] EARN_PER_ELEMENT: gave ${JSON.stringify(stonesGained)} stones to player ${playerId}`)

    return {
      success: true,
      stonesGained,
      message: `Earned ${JSON.stringify(stonesGained)} from ${fieldCardCount} cards on field`,
    }
  }

  /**
   * EARN_PER_ELEMENT (Score-based) - Give points per matching card
   * - F010 Lava Giant: 2 points per FIRE element card
   * - W015 Poseidon: 3 points per WATER element card
   * - A012 Freyja: 1 point per card with ON_SCORE effect
   */
  private async processEarnPerElementScore(
    effect: CardEffect,
    context: EffectContext,
    triggerCardId: string
  ): Promise<EffectResult> {
    const { gameId, playerId, currentPlayerState, gameCards } = context

    let validCardCount = 0
    let conditionDescription = ''
    let pointsPerCard = effect.value || 1

    // F010 Lava Giant: Count FIRE element cards
    if (triggerCardId === 'F010') {
      for (const cardId of currentPlayerState.field) {
        const card = gameCards[cardId]
        if (card) {
          const template = getBaseCardById(card.cardId)
          if (template && template.element === Element.FIRE) {
            validCardCount++
          }
        }
      }
      pointsPerCard = 2
      conditionDescription = 'FIRE element cards'
      console.log(`[EffectProcessor] EARN_PER_ELEMENT (F010 Lava Giant): found ${validCardCount} FIRE cards`)
    }
    // W015 Poseidon: Count WATER element cards
    else if (triggerCardId === 'W015') {
      for (const cardId of currentPlayerState.field) {
        const card = gameCards[cardId]
        if (card) {
          const template = getBaseCardById(card.cardId)
          if (template && template.element === Element.WATER) {
            validCardCount++
          }
        }
      }
      pointsPerCard = 3
      conditionDescription = 'WATER element cards'
      console.log(`[EffectProcessor] EARN_PER_ELEMENT (W015 Poseidon): found ${validCardCount} WATER cards`)
    }
    // A012 Freyja: Count cards with ON_SCORE effect
    else if (triggerCardId === 'A012') {
      for (const cardId of currentPlayerState.field) {
        const card = gameCards[cardId]
        if (card) {
          const template = getBaseCardById(card.cardId)
          if (template) {
            const hasOnScore = template.effects.some(
              e => e.trigger === EffectTrigger.ON_SCORE
            )
            if (hasOnScore) {
              validCardCount++
            }
          }
        }
      }
      pointsPerCard = 1
      conditionDescription = 'cards with ON_SCORE effect'
      console.log(`[EffectProcessor] EARN_PER_ELEMENT (A012 Freyja): found ${validCardCount} cards with ON_SCORE effect`)
    }

    const totalPoints = validCardCount * pointsPerCard

    console.log(`[EffectProcessor] EARN_PER_ELEMENT (Score): ${validCardCount} ${conditionDescription} x ${pointsPerCard} points = ${totalPoints} total points`)

    // Update player's score in Firebase
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
    const playerSnapshot = await get(playerRef)

    if (!playerSnapshot.exists()) {
      return { success: false, error: 'Player not found' }
    }

    const player: PlayerState = playerSnapshot.val()
    const newScore = (player.score || 0) + totalPoints

    await update(playerRef, { score: newScore })

    console.log(`[EffectProcessor] EARN_PER_ELEMENT (Score): updated score ${player.score} -> ${newScore} (+${totalPoints})`)

    return {
      success: true,
      scoreChange: totalPoints,
      message: `Earned ${totalPoints} points from ${validCardCount} ${conditionDescription}`,
    }
  }

  /**
   * CONDITIONAL_AREA - Earn points based on number of cards in area
   * Supports:
   * - F005 Salamander: Fixed 1 point (ON_SCORE, doesn't count cards)
   * - F007 Ifrit: All cards in field, 1 point per card (score)
   * - F008 Incubus: Cards with cost <= 2 in field, 2 points per card (score)
   */
  private async processConditionalArea(
    effect: CardEffect,
    context: EffectContext
  ): Promise<EffectResult> {
    const { gameId, playerId, currentPlayerState, gameCards, cardInstanceId } = context

    // Safety check: Ensure currentPlayerState exists
    if (!currentPlayerState) {
      console.error(`[EffectProcessor] ERROR: currentPlayerState is undefined`)
      return { success: false, error: 'Player state not found' }
    }

    // Get the card that triggered this effect
    const triggerCard = gameCards[cardInstanceId]
    const triggerCardId = triggerCard?.cardId

    let validCardCount = 0
    let conditionDescription = ''

    // F003 Succubus: Check if field has cards with cost 1, 2, 3, AND 4
    if (triggerCardId === 'F003') {
      const costsInField = new Set<number>()
      for (const cardId of currentPlayerState.field) {
        const card = gameCards[cardId]
        if (card) {
          const template = getBaseCardById(card.cardId)
          if (template) {
            costsInField.add(template.cost)
          }
        }
      }

      // Check if all required costs (1, 2, 3, 4) are present
      const hasAllCosts = [1, 2, 3, 4].every(cost => costsInField.has(cost))
      validCardCount = hasAllCosts ? 1 : 0  // Use 1 as multiplier if condition met
      conditionDescription = hasAllCosts
        ? `has cards with cost 1, 2, 3, 4 (bonus triggered!)`
        : `missing some costs (1,2,3,4), found: ${Array.from(costsInField).sort().join(',')}`
      console.log(`[EffectProcessor] CONDITIONAL_AREA (F003 Succubus): costsInField=${Array.from(costsInField).sort().join(',')}, hasAllCosts=${hasAllCosts}`)
    }
    // F005 Salamander: Fixed 1 point (doesn't count cards)
    else if (triggerCardId === 'F005') {
      validCardCount = 1
      conditionDescription = `fixed`
      console.log(`[EffectProcessor] CONDITIONAL_AREA (F005 Salamander): fixed 1 point`)
    }
    // F008 Incubus: Count cards with cost <= 2
    else if (triggerCardId === 'F008') {
      for (const cardId of currentPlayerState.field) {
        const card = gameCards[cardId]
        if (card) {
          const template = getBaseCardById(card.cardId)
          if (template && template.cost <= 2) {
            validCardCount++
          }
        }
      }
      conditionDescription = `cost <= 2 cards`
      console.log(`[EffectProcessor] CONDITIONAL_AREA (F008 Incubus): found ${validCardCount} cards with cost <= 2`)
    }
    // Default: Count ALL cards in field (F007 Ifrit behavior)
    else {
      validCardCount = currentPlayerState.field.length
      conditionDescription = `all cards`
      console.log(`[EffectProcessor] CONDITIONAL_AREA (default): field has ${validCardCount} cards`)
    }

    const pointsPerCard = effect.value || 1 // Default 1 point per card
    const totalPoints = validCardCount * pointsPerCard

    console.log(`[EffectProcessor] CONDITIONAL_AREA: ${validCardCount} ${conditionDescription} x ${pointsPerCard} points = ${totalPoints} total points`)

    // Update player's score in Firebase
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
    const playerSnapshot = await get(playerRef)

    if (!playerSnapshot.exists()) {
      return { success: false, error: 'Player not found' }
    }

    const player: PlayerState = playerSnapshot.val()
    const newScore = (player.score || 0) + totalPoints

    await update(playerRef, { score: newScore })

    console.log(`[EffectProcessor] CONDITIONAL_AREA: updated score ${player.score} -> ${newScore} (+${totalPoints})`)

    return {
      success: true,
      scoreChange: totalPoints,
      message: `Earned ${totalPoints} points from ${validCardCount} ${conditionDescription}`,
    }
  }

  /**
   * CONDITIONAL_HAND - Earn points or stones based on number of cards in hand
   * Supports:
   * - F004 Firefox: Earn 1 point per card in hand (ON_TAME, score mode)
   * - A003 Harpuia: Earn 1 ONE-stone if hand < field (ON_TAME)
   * - A015 Bahamut: Earn 1 WATER-stone per card in hand (ON_TAME)
   */
  private async processConditionalHand(
    effect: CardEffect,
    context: EffectContext
  ): Promise<EffectResult> {
    const { gameId, playerId, currentPlayerState, cardInstanceId, gameCards } = context

    // Safety check: Ensure currentPlayerState exists
    if (!currentPlayerState) {
      console.error(`[EffectProcessor] ERROR: currentPlayerState is undefined`)
      return { success: false, error: 'Player state not found' }
    }

    // Get the card that triggered this effect
    const triggerCard = gameCards[cardInstanceId]
    const triggerCardId = triggerCard?.cardId

    // IMPORTANT: Fetch fresh player state from Firebase to ensure we have the latest hand count
    // The currentPlayerState passed in might be stale after card was moved to field
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
    const freshPlayerSnapshot = await get(playerRef)

    if (!freshPlayerSnapshot.exists()) {
      console.error(`[EffectProcessor] ERROR: Cannot fetch fresh player state`)
      return { success: false, error: 'Player not found' }
    }

    const freshPlayerState: PlayerState = freshPlayerSnapshot.val()
    const handSize = freshPlayerState.hand?.length || 0

    console.log(`[EffectProcessor] CONDITIONAL_HAND: Fresh hand size = ${handSize}, hand IDs = ${JSON.stringify(freshPlayerState.hand)}`)

    // Determine if this is a score-based or stone-based effect
    const isScoreMode = effect.value !== undefined && (!effect.stones || effect.stones.length === 0)

    let conditionMet = true
    let conditionDescription = ''
    let multiplier = handSize

    // A003 Harpuia: Only give stone if hand < field
    if (triggerCardId === 'A003') {
      const fieldSize = currentPlayerState.field.length
      conditionMet = handSize < fieldSize
      multiplier = conditionMet ? 1 : 0
      conditionDescription = conditionMet
        ? `hand (${handSize}) < field (${fieldSize}), condition met`
        : `hand (${handSize}) >= field (${fieldSize}), condition not met`
      console.log(`[EffectProcessor] CONDITIONAL_HAND (A003 Harpuia): ${conditionDescription}`)
    } else {
      conditionDescription = `${handSize} cards in hand`
    }

    // Score mode: F004 Firefox - earn points per card in hand
    if (isScoreMode) {
      const pointsPerCard = effect.value || 1
      const totalPoints = multiplier * pointsPerCard

      console.log(`[EffectProcessor] CONDITIONAL_HAND (${triggerCardId}): ${handSize} cards in hand x ${pointsPerCard} points = ${totalPoints} total points`)

      if (totalPoints === 0) {
        return {
          success: true,
          message: `No points earned: ${conditionDescription}`,
        }
      }

      // Update player's score in Firebase (use freshPlayerState we already fetched)
      const newScore = (freshPlayerState.score || 0) + totalPoints

      await update(playerRef, { score: newScore })

      console.log(`[EffectProcessor] CONDITIONAL_HAND: updated score ${freshPlayerState.score} -> ${newScore} (+${totalPoints})`)

      return {
        success: true,
        scoreChange: totalPoints,
        message: `Earned ${totalPoints} points from ${conditionDescription}`,
      }
    }

    // Stone mode: A003 Harpuia, A015 Bahamut - earn stones
    let stonesPerCard = 1
    let stoneType = StoneType.ONE

    if (effect.stones && effect.stones.length > 0) {
      stoneType = effect.stones[0].type
      stonesPerCard = effect.stones[0].amount
    }

    console.log(`[EffectProcessor] CONDITIONAL_HAND (${triggerCardId}): ${handSize} cards in hand x ${stonesPerCard} ${stoneType} stones`)

    const totalStones = multiplier * stonesPerCard

    if (totalStones === 0) {
      console.log(`[EffectProcessor] CONDITIONAL_HAND: No stones to give`)
      return {
        success: true,
        message: `Condition not met: ${conditionDescription}`,
      }
    }

    const stonesGained: Partial<StonePool> = {
      [stoneType]: totalStones
    }

    // Reuse the fresh player state we already fetched at the beginning
    const updatedStones = { ...freshPlayerState.stones }
    updatedStones[stoneType] = (updatedStones[stoneType] || 0) + totalStones

    await update(playerRef, { stones: updatedStones })

    console.log(`[EffectProcessor] CONDITIONAL_HAND: gave ${totalStones} ${stoneType} stones (${conditionDescription})`)
    console.log(`[EffectProcessor] CONDITIONAL_HAND: stones updated ${freshPlayerState.stones[stoneType]} -> ${updatedStones[stoneType]}`)

    return {
      success: true,
      stonesGained,
      message: `Earned ${totalStones}x ${stoneType} stones from ${conditionDescription}`,
    }
  }

  /**
   * EARN_PER_FAMILY - Earn points per unique element (family) in area
   * Supports:
   * - F015 Surtr: Earn 2 points per unique element in area (ON_TAME)
   */
  private async processEarnPerFamily(
    effect: CardEffect,
    context: EffectContext
  ): Promise<EffectResult> {
    const { gameId, playerId, currentPlayerState, gameCards, cardInstanceId } = context

    // Safety check: Ensure currentPlayerState exists
    if (!currentPlayerState) {
      console.error(`[EffectProcessor] ERROR: currentPlayerState is undefined`)
      return { success: false, error: 'Player state not found' }
    }

    // Get the card that triggered this effect (to include its element)
    const triggerCard = gameCards[cardInstanceId]
    const triggerCardId = triggerCard?.cardId

    // Count unique elements (families) in player's field
    const uniqueElements = new Set<Element>()

    // Add elements from cards already in field
    for (const cardId of currentPlayerState.field) {
      const card = gameCards[cardId]
      if (card) {
        const template = getBaseCardById(card.cardId)
        if (template) {
          uniqueElements.add(template.element)
        }
      }
    }

    // Add the element of the card being tamed (it's not in field yet during ON_TAME)
    if (triggerCard) {
      const triggerTemplate = getBaseCardById(triggerCard.cardId)
      if (triggerTemplate) {
        uniqueElements.add(triggerTemplate.element)
      }
    }

    const familyCount = uniqueElements.size
    console.log(`[EffectProcessor] EARN_PER_FAMILY (${triggerCardId}): found ${familyCount} unique elements: ${Array.from(uniqueElements).join(', ')}`)

    // Determine points per family from effect.value (default 2 for F015 Surtr)
    const pointsPerFamily = effect.value ?? 2
    const totalPoints = familyCount * pointsPerFamily

    if (totalPoints === 0) {
      console.log(`[EffectProcessor] EARN_PER_FAMILY: No families found, no points to give`)
      return {
        success: true,
        message: `No families found in area`,
      }
    }

    // Update player's score in Firebase
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
    const playerSnapshot = await get(playerRef)

    if (!playerSnapshot.exists()) {
      return { success: false, error: 'Player not found' }
    }

    const player: PlayerState = playerSnapshot.val()
    const newScore = (player.score || 0) + totalPoints

    await update(playerRef, { score: newScore })

    console.log(`[EffectProcessor] EARN_PER_FAMILY: gave ${totalPoints} points (${familyCount} families x ${pointsPerFamily} points)`)
    console.log(`[EffectProcessor] EARN_PER_FAMILY: score updated ${player.score} -> ${newScore}`)

    return {
      success: true,
      scoreChange: totalPoints,
      message: `Earned ${totalPoints} points from ${familyCount} unique families`,
    }
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
