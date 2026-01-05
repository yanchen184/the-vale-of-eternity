/**
 * Lightning Effect Cards Registry
 * Cards that should trigger lightning visual effect when played
 * @version 1.6.0 - Added F015 (Surtr) - EARN_PER_FAMILY effect (2 stones per unique element)
 */
console.log('[data/lightning-effect-cards.ts] v1.6.0 loaded')

/**
 * Card IDs that trigger lightning effect
 * Add any card with instant/lightning effects here (ON_TAME only)
 */
export const LIGHTNING_EFFECT_CARD_IDS = [
  'F002', // Imp (小惡魔) - Earn 2x ONE stones
  'F004', // Firefox (火狐) - Earn 1 ONE-stone per card in hand
  'F007', // Ifrit (伊夫利特) - Earn 1 point per card in area
  'F008', // Incubus (夢魔) - Earn 2 points per cost ≤ 2 card
  'F010', // Lava Giant (熔岩巨人) - Earn 2 points per FIRE card
  'F015', // Surtr (蘇爾特爾) - Earn 2 ONE-stones per unique element
  'W015', // Poseidon (波賽頓) - Earn 3 points per WATER card
] as const

/**
 * Check if a card has lightning effect
 */
export function hasLightningEffect(cardId: string): boolean {
  return LIGHTNING_EFFECT_CARD_IDS.includes(cardId as any)
}

/**
 * Get lightning effect description for a card
 * @param cardId Card ID
 * @param cardName English card name
 * @param cardNameTw Traditional Chinese card name
 * @param effectValue Effect value (e.g., stones gained, score gained)
 * @param currentScore Current player score (optional, for score-based effects)
 * @param matchCount Number of matching cards (optional, for specific card logic)
 * @returns Lightning effect description
 */
export function getLightningEffectDescription(
  cardId: string,
  cardName: string,
  cardNameTw: string,
  effectValue: number,
  currentScore?: number,
  matchCount?: number
): {
  cardName: string
  cardNameTw: string
  reason: string
} {
  const score = currentScore || 0
  const newScore = score + effectValue

  switch (cardId) {
    case 'F002': // Imp
      return {
        cardName,
        cardNameTw,
        reason: `獲得 ${effectValue} 個 1 點石頭`,
      }
    case 'F004': // Firefox (火狐)
      return {
        cardName,
        cardNameTw,
        reason: `手牌有 ${effectValue} 張卡\n火狐獲得 ${effectValue} 個 1 點石頭！`,
      }
    case 'F007': // Ifrit
      return {
        cardName,
        cardNameTw,
        reason: `場上有 ${effectValue} 張卡\n伊夫利特獲得 +${effectValue} 分加成！\n${score} 分 -> ${newScore} 分`,
      }
    case 'F008': // Incubus (夢魔)
      const incubusCount = matchCount || Math.floor(effectValue / 2)
      return {
        cardName,
        cardNameTw,
        reason: `場上有 ${incubusCount} 張 cost <= 2 的卡\n夢魔獲得 +${effectValue} 分加成！\n${score} 分 -> ${newScore} 分`,
      }
    case 'F010': // Lava Giant (熔岩巨人)
      const lavaCount = matchCount || Math.floor(effectValue / 2)
      return {
        cardName,
        cardNameTw,
        reason: `場上有 ${lavaCount} 張火元素卡\n熔岩巨人獲得 +${effectValue} 分加成！\n${score} 分 -> ${newScore} 分`,
      }
    case 'F015': // Surtr (蘇爾特爾)
      const familyCount = matchCount || Math.floor(effectValue / 2)
      return {
        cardName,
        cardNameTw,
        reason: `場上有 ${familyCount} 種不同的家族\n蘇爾特爾獲得 +${effectValue} 分加成！\n${score} 分 -> ${newScore} 分`,
      }
    case 'W015': // Poseidon (波賽頓)
      const poseidonCount = matchCount || Math.floor(effectValue / 3)
      return {
        cardName,
        cardNameTw,
        reason: `場上有 ${poseidonCount} 張水元素卡\n波賽頓獲得 +${effectValue} 分加成！\n${score} 分 -> ${newScore} 分`,
      }
    default:
      return {
        cardName,
        cardNameTw,
        reason: '閃電效果觸發',
      }
  }
}
