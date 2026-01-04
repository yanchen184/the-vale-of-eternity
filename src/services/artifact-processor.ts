/**
 * Artifact Processor for Multiplayer Mode
 * Handles ACTION type artifact execution
 * @version 1.0.0
 */
console.log('[services/artifact-processor.ts] v1.0.0 loaded')

import { ref, get, update } from 'firebase/database'
import { database } from '@/lib/firebase'
import type { GameRoom, PlayerState, CardInstance, StonePool } from '@/types/game'
import { CardLocation } from '@/types/cards'

/**
 * Artifact execution result
 */
export interface ArtifactExecutionResult {
  success: boolean
  message: string
  requiresInput?: boolean
  inputType?: 'CHOOSE_OPTION' | 'SELECT_PAYMENT' | 'SELECT_CARDS' | 'SELECT_STONES'
  options?: ArtifactEffectOption[]
  stonePaymentOptions?: Partial<StonePool>[]
  paymentAmount?: number
}

/**
 * Artifact effect option
 */
export interface ArtifactEffectOption {
  id: string
  description: string
  descriptionTw: string
  available: boolean
  unavailableReason?: string
}

/**
 * Execute Incense Burner effect
 * ACTION: Buy 1 card from market for 3 points worth of stones (any color), OR shelter top 2 cards from deck
 */
export async function executeIncenseBurner(
  gameId: string,
  playerId: string,
  optionId?: string,
  selectedPayment?: Partial<StonePool>,
  selectedCards?: string[]
): Promise<ArtifactExecutionResult> {
  const gameRef = ref(database, `games/${gameId}`)
  const snapshot = await get(gameRef)

  if (!snapshot.exists()) {
    return { success: false, message: 'Game not found' }
  }

  const game: GameRoom = snapshot.val()
  const player = game.players[playerId]

  if (!player) {
    return { success: false, message: 'Player not found' }
  }

  // Step 1: Choose option if not selected
  if (!optionId) {
    return {
      success: false,
      message: '請選擇效果選項',
      requiresInput: true,
      inputType: 'CHOOSE_OPTION',
      options: [
        {
          id: 'buy_card',
          description: 'Buy 1 card from market for 3 points worth of stones',
          descriptionTw: '支付3分購買買入區的1張卡',
          available: game.marketIds && game.marketIds.length > 0,
          unavailableReason: !game.marketIds || game.marketIds.length === 0 ? '買入區沒有卡牌' : undefined,
        },
        {
          id: 'shelter_deck',
          description: 'Shelter top 2 cards from deck',
          descriptionTw: '將牌庫頂的2張卡棲息地',
          available: game.deckIds && game.deckIds.length > 0,
          unavailableReason: !game.deckIds || game.deckIds.length === 0 ? '牌庫沒有卡牌' : undefined,
        },
      ],
    }
  }

  if (optionId === 'buy_card') {
    const PAYMENT_AMOUNT = 3

    // Step 2: Select payment method
    if (!selectedPayment) {
      const paymentOptions = getPaymentCombinations(player.stones, PAYMENT_AMOUNT)
      if (paymentOptions.length === 0) {
        return { success: false, message: '石頭分數不足（需要3分）' }
      }
      return {
        success: false,
        message: '請選擇如何支付 3 分',
        requiresInput: true,
        inputType: 'SELECT_PAYMENT',
        stonePaymentOptions: paymentOptions,
        paymentAmount: PAYMENT_AMOUNT,
      }
    }

    // Step 3: Select card to purchase
    if (!selectedCards || selectedCards.length !== 1) {
      return {
        success: false,
        message: '請選擇1張買入區的卡牌',
        requiresInput: true,
        inputType: 'SELECT_CARDS',
      }
    }

    const cardId = selectedCards[0]
    if (!game.marketIds?.includes(cardId)) {
      return { success: false, message: '卡牌不在買入區' }
    }

    // Validate payment is sufficient
    const paymentValue =
      (selectedPayment.ONE ?? 0) + (selectedPayment.THREE ?? 0) * 3 + (selectedPayment.SIX ?? 0) * 6
    if (paymentValue < PAYMENT_AMOUNT) {
      return { success: false, message: '支付金額不足（需要3分）' }
    }

    // Validate player has enough stones
    if (
      (selectedPayment.ONE ?? 0) > player.stones.ONE ||
      (selectedPayment.THREE ?? 0) > player.stones.THREE ||
      (selectedPayment.SIX ?? 0) > player.stones.SIX
    ) {
      return { success: false, message: '石頭不足' }
    }

    // Get card data
    const cardSnapshot = await get(ref(database, `games/${gameId}/cards/${cardId}`))
    if (!cardSnapshot.exists()) {
      return { success: false, message: 'Card not found' }
    }
    const card = cardSnapshot.val() as CardInstance

    // Deduct stones
    const newStones = {
      ONE: player.stones.ONE - (selectedPayment.ONE ?? 0),
      THREE: player.stones.THREE - (selectedPayment.THREE ?? 0),
      SIX: player.stones.SIX - (selectedPayment.SIX ?? 0),
      FIRE: player.stones.FIRE,
      WATER: player.stones.WATER,
      WIND: player.stones.WIND,
      EARTH: player.stones.EARTH,
    }

    // Move card to player's hand
    const newHand = [...player.hand, cardId]
    const newMarketIds = game.marketIds.filter(id => id !== cardId)

    // Refill market from deck
    let newDeckIds = game.deckIds || []
    if (newDeckIds.length > 0) {
      const refillCardId = newDeckIds[0]
      newMarketIds.push(refillCardId)
      newDeckIds = newDeckIds.slice(1)

      // Update refill card location
      await update(ref(database, `games/${gameId}/cards/${refillCardId}`), {
        location: CardLocation.MARKET,
        isRevealed: true,
      })
    }

    // Update card location to HAND
    await update(ref(database, `games/${gameId}/cards/${cardId}`), {
      location: CardLocation.HAND,
    })

    // Update game state
    await update(gameRef, {
      [`players/${playerId}/stones`]: newStones,
      [`players/${playerId}/hand`]: newHand,
      marketIds: newMarketIds,
      deckIds: newDeckIds,
      [`players/${playerId}/artifactUsedThisRound`]: true,
      updatedAt: Date.now(),
    })

    return {
      success: true,
      message: `香爐：支付3分購買了 ${card.nameTw || card.name}`,
    }
  } else if (optionId === 'shelter_deck') {
    // Shelter top 2 cards from deck
    if (!game.deckIds || game.deckIds.length === 0) {
      return { success: false, message: '牌庫沒有卡牌' }
    }

    const shelterCount = Math.min(2, game.deckIds.length)
    const shelterCardIds = game.deckIds.slice(0, shelterCount)
    const newDeckIds = game.deckIds.slice(shelterCount)
    const newSanctuaryIds = [...(player.sanctuary || []), ...shelterCardIds]

    // Update each sheltered card's location
    for (const cardId of shelterCardIds) {
      await update(ref(database, `games/${gameId}/cards/${cardId}`), {
        location: CardLocation.FIELD,
        isRevealed: true,
      })
    }

    // Update game state
    await update(gameRef, {
      [`players/${playerId}/sanctuary`]: newSanctuaryIds,
      deckIds: newDeckIds,
      [`players/${playerId}/artifactUsedThisRound`]: true,
      updatedAt: Date.now(),
    })

    return {
      success: true,
      message: `香爐：將牌庫頂的${shelterCount}張卡棲息地`,
    }
  }

  return { success: false, message: '無效的選項' }
}

/**
 * Execute Monkey King's Staff effect
 * ACTION: Discard 2 cards from hand to gain 1 red (ONE), 1 blue (THREE), and 1 green (SIX) stone
 */
export async function executeMonkeyKingStaff(
  gameId: string,
  playerId: string,
  selectedCards?: string[]
): Promise<ArtifactExecutionResult> {
  const gameRef = ref(database, `games/${gameId}`)
  const snapshot = await get(gameRef)

  if (!snapshot.exists()) {
    return { success: false, message: 'Game not found' }
  }

  const game: GameRoom = snapshot.val()
  const player = game.players[playerId]

  if (!player) {
    return { success: false, message: 'Player not found' }
  }

  // Step 1: Select cards to discard
  if (!selectedCards || selectedCards.length !== 2) {
    if (player.hand.length < 2) {
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
  for (const cardId of selectedCards) {
    if (!player.hand.includes(cardId)) {
      return { success: false, message: '選擇的卡牌不在手牌中' }
    }
  }

  // Remove cards from hand
  const newHand = player.hand.filter(id => !selectedCards.includes(id))
  const newDiscardPile = [...(game.discardPileIds || []), ...selectedCards]

  // Update discarded cards' location
  for (const cardId of selectedCards) {
    await update(ref(database, `games/${gameId}/cards/${cardId}`), {
      location: CardLocation.DISCARD,
    })
  }

  // Gain stones: 1 ONE (red), 1 THREE (blue), 1 SIX (green)
  const newStones = {
    ONE: player.stones.ONE + 1,
    THREE: player.stones.THREE + 1,
    SIX: player.stones.SIX + 1,
    FIRE: player.stones.FIRE,
    WATER: player.stones.WATER,
    WIND: player.stones.WIND,
    EARTH: player.stones.EARTH,
  }

  // Update game state
  await update(gameRef, {
    [`players/${playerId}/hand`]: newHand,
    [`players/${playerId}/stones`]: newStones,
    discardPileIds: newDiscardPile,
    [`players/${playerId}/artifactUsedThisRound`]: true,
    updatedAt: Date.now(),
  })

  return {
    success: true,
    message: '齊天大聖金箍棒：棄掉2張手牌，獲得1顆紅石、1顆藍石和1顆綠石',
  }
}

/**
 * Execute Book of Thoth effect
 * ACTION: Upgrade stones (最多2次): ONE → THREE → SIX
 */
export async function executeBookOfThoth(
  gameId: string,
  playerId: string,
  selectedStones?: Partial<StonePool>
): Promise<ArtifactExecutionResult> {
  const gameRef = ref(database, `games/${gameId}`)
  const snapshot = await get(gameRef)

  if (!snapshot.exists()) {
    return { success: false, message: 'Game not found' }
  }

  const game: GameRoom = snapshot.val()
  const player = game.players[playerId]

  if (!player) {
    return { success: false, message: 'Player not found' }
  }

  // Step 1: Select stones to upgrade
  if (!selectedStones) {
    const { ONE, THREE, SIX } = player.stones
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

  // selectedStones format: {ONE: -2, THREE: 2} means: lose 2 ONE stones, gain 2 THREE stones
  const onesConsumed = (selectedStones.ONE ?? 0) < 0 ? Math.abs(selectedStones.ONE ?? 0) : 0
  const threesConsumed = (selectedStones.THREE ?? 0) < 0 ? Math.abs(selectedStones.THREE ?? 0) : 0
  const upgradeCount = onesConsumed + threesConsumed

  if (upgradeCount === 0) {
    return { success: false, message: '請至少選擇1顆石頭升級' }
  }
  if (upgradeCount > 2) {
    return { success: false, message: '最多只能升級2次' }
  }

  // Validate player has enough stones
  const currentStones = player.stones
  if (onesConsumed > currentStones.ONE) {
    return { success: false, message: '紅石不足' }
  }
  if (threesConsumed > currentStones.THREE) {
    return { success: false, message: '藍石不足' }
  }
  if ((selectedStones.SIX ?? 0) < 0) {
    return { success: false, message: '紫石（6點）已是最高級，無法升級' }
  }

  // Perform upgrades: ONE → THREE → SIX
  const newStones = {
    ONE: currentStones.ONE - onesConsumed,
    THREE: currentStones.THREE - threesConsumed + onesConsumed,
    SIX: currentStones.SIX + threesConsumed,
    FIRE: currentStones.FIRE,
    WATER: currentStones.WATER,
    WIND: currentStones.WIND,
    EARTH: currentStones.EARTH,
  }

  // Update game state
  await update(gameRef, {
    [`players/${playerId}/stones`]: newStones,
    [`players/${playerId}/artifactUsedThisRound`]: true,
    updatedAt: Date.now(),
  })

  const upgradeMessages: string[] = []
  if (onesConsumed > 0) upgradeMessages.push(`${onesConsumed}顆紅石→藍石`)
  if (threesConsumed > 0) upgradeMessages.push(`${threesConsumed}顆藍石→紫石`)

  return {
    success: true,
    message: `透特之書：升級了${upgradeMessages.join('、')}`,
  }
}

/**
 * Get all possible payment combinations for a given amount
 * Returns all valid combinations of stones that can pay the amount
 */
export function getPaymentCombinations(stones: StonePool, amount: number): Partial<StonePool>[] {
  const { ONE, THREE, SIX } = stones
  const combinations: Partial<StonePool>[] = []

  // Try all combinations of stones that equal the payment amount
  for (let six = 0; six <= Math.min(SIX, Math.floor(amount / 6)); six++) {
    for (let three = 0; three <= Math.min(THREE, Math.floor((amount - six * 6) / 3)); three++) {
      const remaining = amount - six * 6 - three * 3
      if (remaining >= 0 && remaining <= ONE) {
        const one = remaining
        if (six + three + one > 0) {
          combinations.push({ ONE: one, THREE: three, SIX: six })
        }
      }
    }
  }

  return combinations
}

export default {
  executeIncenseBurner,
  executeMonkeyKingStaff,
  executeBookOfThoth,
  getPaymentCombinations,
}
