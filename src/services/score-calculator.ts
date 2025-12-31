/**
 * Score Calculator for The Vale of Eternity
 * Calculates final scores with ON_SCORE effects and stone values
 * @version 3.1.0
 */
console.log('[services/score-calculator.ts] v3.1.0 loaded')

import { getBaseCardById } from '@/data/cards'
import type { CardTemplate } from '@/types/cards'
import { EffectType, EffectTrigger, StoneType, Element } from '@/types/cards'
import type { PlayerState, StonePool, CardInstanceData } from './multiplayer-game'

// ============================================
// TYPES
// ============================================

export interface ScoreBreakdown {
  playerId: string
  baseScore: number
  onScoreEffects: number
  permanentEffects: number
  stoneValue: number
  totalScore: number
  details: {
    cardsInField: number
    stoneBreakdown: Partial<Record<StoneType, { amount: number; value: number; total: number }>>
    effectDetails: string[]
  }
}

// ============================================
// SCORE CALCULATOR
// ============================================

export class ScoreCalculator {
  /**
   * Calculate final score for a player
   */
  calculatePlayerScore(
    playerState: PlayerState,
    gameCards: { [instanceId: string]: CardInstanceData }
  ): ScoreBreakdown {
    // 1. Calculate base score from all cards in field
    let baseScore = 0
    const cardsInField = playerState.field.length

    for (const cardId of playerState.field) {
      const card = gameCards[cardId]
      if (card) {
        baseScore += card.baseScore + (card.scoreModifier || 0)
      }
    }

    // 2. Process ON_SCORE effects
    let onScoreEffects = 0
    const effectDetails: string[] = []

    for (const cardId of playerState.field) {
      const card = gameCards[cardId]
      if (!card) continue

      const template = getBaseCardById(card.cardId)
      if (!template) continue

      const scoreEffects = template.effects.filter(effect => effect.trigger === EffectTrigger.ON_SCORE)

      for (const effect of scoreEffects) {
        const points = this.calculateScoreEffect(effect, template, playerState, gameCards)
        onScoreEffects += points
        effectDetails.push(`${template.name}: +${points} (${effect.description})`)
      }
    }

    // 3. Calculate PERMANENT effect modifiers
    const { stoneValueModifiers } = this.calculatePermanentModifiers(playerState, gameCards)

    // 4. Calculate stone value
    const { stoneValue, stoneBreakdown } = this.calculateStoneValue(
      playerState.stones,
      stoneValueModifiers
    )

    // 5. Total score
    const totalScore = baseScore + onScoreEffects + stoneValue

    return {
      playerId: playerState.playerId,
      baseScore,
      onScoreEffects,
      permanentEffects: 0, // Already included in stone value modifiers
      stoneValue,
      totalScore,
      details: {
        cardsInField,
        stoneBreakdown,
        effectDetails,
      },
    }
  }

  /**
   * Calculate score from a single ON_SCORE effect
   */
  private calculateScoreEffect(
    effect: any,
    _template: CardTemplate,
    playerState: PlayerState,
    gameCards: { [instanceId: string]: CardInstanceData }
  ): number {
    switch (effect.type) {
      case EffectType.EARN_PER_ELEMENT:
        // Earn points per card of specific element
        return this.calculateEarnPerElement(effect, playerState, gameCards)

      case EffectType.EARN_PER_FAMILY:
        // Earn points per family represented
        return this.calculateEarnPerFamily(playerState, gameCards)

      case EffectType.CONDITIONAL_AREA:
        // Earn points based on number of cards in field
        return this.calculateConditionalArea(effect, playerState)

      default:
        return 0
    }
  }

  /**
   * EARN_PER_ELEMENT - Points per card of specific element
   */
  private calculateEarnPerElement(
    effect: any,
    playerState: PlayerState,
    gameCards: { [instanceId: string]: CardInstanceData }
  ): number {
    const targetElement = effect.targetElement
    const pointsPerCard = effect.value || 1

    if (!targetElement) return 0

    let count = 0
    for (const cardId of playerState.field) {
      const card = gameCards[cardId]
      if (card && card.element === targetElement) {
        count++
      }
    }

    return count * pointsPerCard
  }

  /**
   * EARN_PER_FAMILY - Points per unique family
   */
  private calculateEarnPerFamily(
    playerState: PlayerState,
    gameCards: { [instanceId: string]: CardInstanceData }
  ): number {
    const families = new Set<Element>()

    for (const cardId of playerState.field) {
      const card = gameCards[cardId]
      if (card) {
        families.add(card.element)
      }
    }

    // Each unique family gives 1 point
    return families.size
  }

  /**
   * CONDITIONAL_AREA - Points based on cards in field
   */
  private calculateConditionalArea(effect: any, playerState: PlayerState): number {
    const cardsInField = playerState.field.length
    const pointsPerCard = effect.value || 1

    return cardsInField * pointsPerCard
  }

  /**
   * Calculate PERMANENT effect modifiers
   */
  private calculatePermanentModifiers(
    playerState: PlayerState,
    gameCards: { [instanceId: string]: CardInstanceData }
  ): {
    stoneValueModifiers: Partial<Record<StoneType, number>>
  } {
    const stoneValueModifiers: Partial<Record<StoneType, number>> = {}

    for (const cardId of playerState.field) {
      const card = gameCards[cardId]
      if (!card) continue

      const template = getBaseCardById(card.cardId)
      if (!template) continue

      const permanentEffects = template.effects.filter(
        effect => effect.trigger === EffectTrigger.PERMANENT
      )

      for (const effect of permanentEffects) {
        if (effect.type === EffectType.INCREASE_STONE_VALUE) {
          const value = effect.value || 1
          // Apply to all stone types (simplified)
          for (const stoneType of Object.values(StoneType)) {
            stoneValueModifiers[stoneType] = (stoneValueModifiers[stoneType] || 0) + value
          }
        }
      }
    }

    return { stoneValueModifiers }
  }

  /**
   * Calculate stone value with modifiers
   */
  private calculateStoneValue(
    stones: StonePool,
    modifiers: Partial<Record<StoneType, number>>
  ): {
    stoneValue: number
    stoneBreakdown: Partial<Record<StoneType, { amount: number; value: number; total: number }>>
  } {
    const stoneBreakdown: Partial<Record<StoneType, { amount: number; value: number; total: number }>> =
      {}
    let totalValue = 0

    // Define base stone values
    const baseValues: Record<StoneType, number> = {
      [StoneType.ONE]: 1,
      [StoneType.THREE]: 3,
      [StoneType.SIX]: 6,
      [StoneType.WATER]: 1,
      [StoneType.FIRE]: 1,
      [StoneType.EARTH]: 1,
      [StoneType.WIND]: 1,
    }

    for (const [stoneType, amount] of Object.entries(stones) as [StoneType, number][]) {
      if (amount > 0) {
        const baseValue = baseValues[stoneType]
        const modifier = modifiers[stoneType] || 0
        const finalValue = baseValue + modifier
        const total = amount * finalValue

        stoneBreakdown[stoneType] = {
          amount,
          value: finalValue,
          total,
        }

        totalValue += total
      }
    }

    return { stoneValue: totalValue, stoneBreakdown }
  }

  /**
   * Calculate scores for all players
   */
  calculateAllScores(
    allPlayers: { [playerId: string]: PlayerState },
    gameCards: { [instanceId: string]: CardInstanceData }
  ): ScoreBreakdown[] {
    const scores: ScoreBreakdown[] = []

    for (const [playerId, playerState] of Object.entries(allPlayers)) {
      // Skip if player state is undefined or null
      if (!playerState) {
        console.warn(`[ScoreCalculator] Player state is undefined for playerId: ${playerId}`)
        continue
      }

      const score = this.calculatePlayerScore(playerState, gameCards)
      scores.push(score)
    }

    // Sort by total score descending
    scores.sort((a, b) => b.totalScore - a.totalScore)

    return scores
  }
}

export const scoreCalculator = new ScoreCalculator()
