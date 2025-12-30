/**
 * F002 - Imp (小惡魔)
 * Fire family card with dual effects:
 * 1. Earn 3 one-point stones when tamed
 * 2. Can be recovered by other cards (permanent marker)
 * @version 1.0.0
 */
console.log('[cards/F002-Imp/Imp.card.ts] v1.0.0 loaded')

import { CardTemplate, Element, EffectType, EffectTrigger, StoneType } from '@/types/cards'

export const IMP_CARD: CardTemplate = {
  // === 識別資訊 ===
  id: 'F002',
  name: 'Imp',
  nameTw: '小惡魔',

  // === 基本屬性 ===
  element: Element.FIRE,
  cost: 1,
  baseScore: 2,

  // === 效果定義 (雙效果卡) ===
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [{ type: StoneType.ONE, amount: 3 }],
      description: 'Earn 1 1 1.',
      descriptionTw: '獲得 3 個 1 點石頭。',
    },
    {
      type: EffectType.RECOVER_CARD,
      trigger: EffectTrigger.PERMANENT,
      description: 'Recover.',
      descriptionTw: '可被回收。',
    },
  ],

  // === 描述文字 ===
  flavorText: 'Small but mischievous.',
  flavorTextTw: '頑皮的火焰精靈，雖然弱小但忠誠。',

  // === 視覺資源 ===
  imageUrl: '200px-Imp.webp',
}

export default IMP_CARD
