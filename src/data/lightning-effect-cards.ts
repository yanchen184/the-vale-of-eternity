/**
 * Lightning Effect Cards Registry
 * Cards that should trigger lightning visual effect when played
 * @version 1.0.0
 */
console.log('[data/lightning-effect-cards.ts] v1.0.0 loaded')

/**
 * Card IDs that trigger lightning effect
 * Add any card with instant/lightning effects here
 */
export const LIGHTNING_EFFECT_CARD_IDS = [
  'F002', // Imp (小惡魔) - Earn 2x ONE stones
  'F007', // Ifrit (伊夫利特) - Earn 1 point per card in area
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
 * @returns Lightning effect description
 */
export function getLightningEffectDescription(
  cardId: string,
  cardName: string,
  cardNameTw: string,
  effectValue: number
): {
  cardName: string
  cardNameTw: string
  reason: string
} {
  switch (cardId) {
    case 'F002': // Imp
      return {
        cardName,
        cardNameTw,
        reason: `獲得 ${effectValue} 個 1 點石頭`,
      }
    case 'F007': // Ifrit
      return {
        cardName,
        cardNameTw,
        reason: `場上有 ${effectValue} 張卡\n伊夫利特獲得 +${effectValue} 分加成！`,
      }
    default:
      return {
        cardName,
        cardNameTw,
        reason: '閃電效果觸發',
      }
  }
}
