/**
 * F001 - Hestia (赫斯提亞)
 * Fire family resource card that permanently increases stone limit
 * @version 1.0.0
 */
console.log('[cards/F001-Hestia/Hestia.card.ts] v1.0.0 loaded')

import { CardTemplate, Element, EffectType, EffectTrigger } from '@/types/cards'

export const HESTIA_CARD: CardTemplate = {
  // === 識別資訊 ===
  id: 'F001',
  name: 'Hestia',
  nameTw: '赫斯提亞',

  // === 基本屬性 ===
  element: Element.FIRE,
  cost: 0,
  baseScore: 1,

  // === 效果定義 ===
  effects: [
    {
      type: EffectType.INCREASE_STONE_LIMIT,
      trigger: EffectTrigger.PERMANENT,
      value: 2,
      description: 'You can keep two more stones.',
      descriptionTw: '你的石頭持有上限增加 2。',
    },
  ],

  // === 描述文字 ===
  flavorText: 'Guardian of hearth and home.',
  flavorTextTw: '家與爐火的守護者，賜予你更多承載力量的空間。',

  // === 視覺資源 ===
  imageUrl: '200px-Hestia.webp',
}

export default HESTIA_CARD
