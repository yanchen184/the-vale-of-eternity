/**
 * Dragon Family Cards (10 cards)
 * Complete card data with Stone Economy System
 * @version 3.0.0
 */
console.log('[data/cards/dragon-cards.ts] v3.0.0 loaded')

import {
  type CardTemplate,
  Element,
  EffectType,
  EffectTrigger,
  StoneType,
} from '@/types/cards'

/**
 * Dragon Family - 10 Cards (D001-D010)
 * Characteristics: High cost, powerful effects, element synergies, opponent disruption
 * Cost distribution: 0(1), 5(1), 7(2), 8(2), 9(2), 10(1), 12(1)
 */
export const DRAGON_CARDS: readonly CardTemplate[] = [
  // ============================================
  // Cost 0
  // ============================================
  {
    id: 'D001',
    name: 'Dragon Egg',
    nameTw: '龍蛋',
    element: Element.DRAGON,
    cost: 0,
    baseScore: 0,
    effects: [
      {
        type: EffectType.FREE_SUMMON,
        trigger: EffectTrigger.ON_TAME,
        targetElement: Element.DRAGON,
        description: 'Discard this card and summon a Dragon card for free.',
        descriptionTw: '棄掉此卡，免費召喚 1 張龍卡。',
      },
    ],
    flavorText: 'Infinite potential sleeps within.',
    flavorTextTw: '蘊含無限可能的神秘之卵，能喚醒沉睡的龍族。',
    imageUrl: '200px-Dragonegg.webp',
  },

  // ============================================
  // Cost 5
  // ============================================
  {
    id: 'D002',
    name: 'Tidal',
    nameTw: '潮汐龍',
    element: Element.DRAGON,
    cost: 5,
    baseScore: 8,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_TAME,
        targetElement: Element.WATER,
        stones: [{ type: StoneType.THREE, amount: 1 }],
        description: 'Earn 3 for each Water card in your area.',
        descriptionTw: '你場上每張水卡獲得 1 個 3 點石頭。',
      },
    ],
    flavorText: 'Born from ocean depths.',
    flavorTextTw: '統領海洋的水龍，與水之生物同調。',
    imageUrl: '200px-Tidal.webp',
  },

  // ============================================
  // Cost 7
  // ============================================
  {
    id: 'D003',
    name: 'Ember',
    nameTw: '熾焰龍',
    element: Element.DRAGON,
    cost: 7,
    baseScore: 10,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stone points.',
        descriptionTw: '獲得水石頭分數。',
      },
      {
        type: EffectType.OPPONENT_DISCARD,
        trigger: EffectTrigger.ON_TAME,
        targetElement: Element.FIRE,
        description:
          'A player of your choice discards one of their unsummoned Fire cards.',
        descriptionTw: '指定一位對手棄掉 1 張未召喚的火卡。',
      },
    ],
    flavorText: 'Heart of living flame.',
    flavorTextTw: '烈焰之心的龍，能壓制敵方火焰生物。',
    imageUrl: '200px-Ember.webp',
  },
  {
    id: 'D004',
    name: 'Marina',
    nameTw: '瑪琳娜龍',
    element: Element.DRAGON,
    cost: 7,
    baseScore: 10,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stone points.',
        descriptionTw: '獲得水石頭分數。',
      },
      {
        type: EffectType.OPPONENT_DISCARD,
        trigger: EffectTrigger.ON_TAME,
        targetElement: Element.WATER,
        description:
          'A player of your choice discards one of their unsummoned Water cards.',
        descriptionTw: '指定一位對手棄掉 1 張未召喚的水卡。',
      },
    ],
    flavorText: 'Queen of the deep.',
    flavorTextTw: '深海女王龍，能壓制敵方水族生物。',
    imageUrl: '200px-Marina.webp',
  },

  // ============================================
  // Cost 8
  // ============================================
  {
    id: 'D005',
    name: 'Boulder',
    nameTw: '磐石龍',
    element: Element.DRAGON,
    cost: 8,
    baseScore: 11,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stone points.',
        descriptionTw: '獲得水石頭分數。',
      },
      {
        type: EffectType.OPPONENT_DISCARD,
        trigger: EffectTrigger.ON_TAME,
        targetElement: Element.EARTH,
        description:
          'A player of your choice discards one of their unsummoned Earth cards.',
        descriptionTw: '指定一位對手棄掉 1 張未召喚的土卡。',
      },
    ],
    flavorText: 'Unshakable as mountains.',
    flavorTextTw: '山脈的守護者，能壓制敵方大地生物。',
    imageUrl: '200px-Boulder.webp',
  },
  {
    id: 'D006',
    name: 'Gust',
    nameTw: '疾風龍',
    element: Element.DRAGON,
    cost: 8,
    baseScore: 11,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stone points.',
        descriptionTw: '獲得水石頭分數。',
      },
      {
        type: EffectType.OPPONENT_DISCARD,
        trigger: EffectTrigger.ON_TAME,
        targetElement: Element.WIND,
        description:
          'A player of your choice discards one of their unsummoned Wind cards.',
        descriptionTw: '指定一位對手棄掉 1 張未召喚的風卡。',
      },
    ],
    flavorText: 'Swift as the tempest.',
    flavorTextTw: '如疾風般迅速的龍，能壓制敵方風之生物。',
    imageUrl: '200px-Gust.webp',
  },

  // ============================================
  // Cost 9
  // ============================================
  {
    id: 'D007',
    name: 'Aeris',
    nameTw: '天空龍',
    element: Element.DRAGON,
    cost: 9,
    baseScore: 12,
    effects: [
      {
        type: EffectType.RECOVER_CARD,
        trigger: EffectTrigger.ON_TAME,
        description: 'Recover one of your other cards.',
        descriptionTw: '回收 1 張你其他的卡。',
      },
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stones equal to the cost written on the card.',
        descriptionTw: '獲得等於該卡 cost 的水石頭。',
      },
    ],
    flavorText: 'Lord of the skies.',
    flavorTextTw: '天空的主宰，回收卡片並獲得其費用價值的石頭。',
    imageUrl: '200px-Aeris.webp',
  },
  {
    id: 'D008',
    name: 'Scorch',
    nameTw: '焦炎龍',
    element: Element.DRAGON,
    cost: 9,
    baseScore: 12,
    effects: [
      {
        type: EffectType.COPY_INSTANT_EFFECT,
        trigger: EffectTrigger.ON_TAME,
        description:
          'Copy one instant effect of another card in your area and activate it.',
        descriptionTw: '複製你場上另 1 張卡的即時效果並觸發。',
      },
    ],
    flavorText: 'Its breath melts steel.',
    flavorTextTw: '吐息能融化鋼鐵的火焰龍王，能複製任何即時效果。',
    imageUrl: '200px-Scorch.webp',
  },

  // ============================================
  // Cost 10
  // ============================================
  {
    id: 'D009',
    name: 'Willow',
    nameTw: '柳樹龍',
    element: Element.DRAGON,
    cost: 10,
    baseScore: 13,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [
          { type: StoneType.SIX, amount: 1 },
          { type: StoneType.WATER, amount: 1 },
          { type: StoneType.SIX, amount: 1 },
          { type: StoneType.THREE, amount: 1 },
        ],
        description: 'Earn 6, Water, 6, and 3.',
        descriptionTw: '獲得 6 點石頭、水石頭、6 點石頭和 3 點石頭。',
      },
      {
        type: EffectType.DRAW_CARD,
        trigger: EffectTrigger.ON_TAME,
        value: 1,
        description: 'Draw a card.',
        descriptionTw: '抽 1 張卡。',
      },
    ],
    flavorText: 'Ancient as the forests.',
    flavorTextTw: '與古老森林共生的龍，帶來豐富的資源與智慧。',
    imageUrl: '200px-Willow.webp',
  },

  // ============================================
  // Cost 12
  // ============================================
  {
    id: 'D010',
    name: 'Eternity',
    nameTw: '永恆龍',
    element: Element.DRAGON,
    cost: 12,
    baseScore: 15,
    effects: [
      {
        type: EffectType.EARN_PER_FAMILY,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.SIX, amount: 1 }],
        value: 6,
        description: 'Earn 6 for each card family in your area.',
        descriptionTw: '你場上每個不同的卡片家族獲得 1 個 6 點石頭。',
      },
    ],
    flavorText: 'The dragon that gave the Vale its name.',
    flavorTextTw: '賦予永恆之谷其名的傳說龍，萬物的起源與終結。',
    imageUrl: '200px-Eternity.webp',
  },
] as const

/**
 * Dragon cards by cost for quick lookup
 */
export const DRAGON_CARDS_BY_COST = {
  0: DRAGON_CARDS.filter((card) => card.cost === 0),
  5: DRAGON_CARDS.filter((card) => card.cost === 5),
  7: DRAGON_CARDS.filter((card) => card.cost === 7),
  8: DRAGON_CARDS.filter((card) => card.cost === 8),
  9: DRAGON_CARDS.filter((card) => card.cost === 9),
  10: DRAGON_CARDS.filter((card) => card.cost === 10),
  12: DRAGON_CARDS.filter((card) => card.cost === 12),
} as const

/**
 * Dragon cards with opponent discard effects
 */
export const DRAGON_DISCARD_CARDS = DRAGON_CARDS.filter((card) =>
  card.effects.some((effect) => effect.type === EffectType.OPPONENT_DISCARD)
)

/**
 * Dragon cards with instant effects (ON_TAME)
 */
export const DRAGON_INSTANT_CARDS = DRAGON_CARDS.filter((card) =>
  card.effects.some((effect) => effect.trigger === EffectTrigger.ON_TAME)
)
