/**
 * Wind Family Cards (15 cards)
 * Complete card data with Stone Economy System
 * @version 3.0.0
 */
console.log('[data/cards/wind-cards.ts] v3.0.0 loaded')

import {
  type CardTemplate,
  Element,
  EffectType,
  EffectTrigger,
  StoneType,
} from '@/types/cards'

/**
 * Wind Family - 15 Cards (A001-A014 + A015)
 * Characteristics: Draw cards, cost reduction, effect manipulation
 * Cost distribution: 0(1), 2(1), 3(2), 4(4), 5(2), 6(1), 7(2), 8(1), 10(1)
 * Note: A015 (Dandelion Spirit) moved from Earth family
 */
export const WIND_CARDS: readonly CardTemplate[] = [
  // ============================================
  // Cost 0
  // ============================================
  {
    id: 'A015',
    name: 'Dandelion Spirit',
    nameTw: '蒲公英精靈',
    element: Element.WIND,
    cost: 0,
    baseScore: 0,
    effects: [
      {
        type: EffectType.DRAW_CARD,
        trigger: EffectTrigger.ON_TAME,
        value: 1,
        description: 'Draw a card.',
        descriptionTw: '抽 1 張卡。',
      },
      {
        type: EffectType.RECOVER_CARD,
        trigger: EffectTrigger.PERMANENT,
        description: 'Recover.',
        descriptionTw: '可被回收。',
      },
    ],
    flavorText: 'Seeds of hope carried by wind.',
    flavorTextTw: '隨風飄散的希望種子，帶來新的可能。',
    imageUrl: '200px-Dandelionspirit.webp',
  },

  // ============================================
  // Cost 2
  // ============================================
  {
    id: 'A001',
    name: 'Harpy',
    nameTw: '鷹身女妖',
    element: Element.WIND,
    cost: 2,
    baseScore: 3,
    effects: [
      {
        type: EffectType.CONDITIONAL_HAND,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description:
          'If the number of cards in your hand is less than the number of cards in your area, earn 1.',
        descriptionTw:
          '如果你手牌數量少於場上卡片數量，獲得 1 個 1 點石頭。',
      },
    ],
    flavorText: 'Swift and deadly.',
    flavorTextTw: '風暴中的掠食者，尖銳的叫聲劃破天際。',
    imageUrl: '200px-Harpy.webp',
  },

  // ============================================
  // Cost 3
  // ============================================
  {
    id: 'A002',
    name: 'Pegasus',
    nameTw: '飛馬',
    element: Element.WIND,
    cost: 3,
    baseScore: 4,
    effects: [
      {
        type: EffectType.DRAW_CARD,
        trigger: EffectTrigger.ON_TAME,
        value: 1,
        description: 'Draw a card.',
        descriptionTw: '抽 1 張卡。',
      },
      {
        type: EffectType.DECREASE_COST,
        trigger: EffectTrigger.PERMANENT,
        value: 1,
        description: 'The cost of your card is decreased by 1.',
        descriptionTw: '你的卡片 cost 永久 -1。',
      },
    ],
    flavorText: 'Divine steed of the gods.',
    flavorTextTw: '翱翔於雲端的神駒，帶來天界的饋贈。',
    imageUrl: '200px-Pegasus.webp',
  },
  {
    id: 'A003',
    name: 'Tengu',
    nameTw: '天狗',
    element: Element.WIND,
    cost: 3,
    baseScore: 5,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stone and put this card on the top of the draw deck.',
        descriptionTw: '獲得 1 個水石頭，並將此卡放回牌庫頂。',
      },
      {
        type: EffectType.PUT_ON_DECK_TOP,
        trigger: EffectTrigger.ON_TAME,
        description: 'Put this card on the top of the draw deck.',
        descriptionTw: '將此卡放回牌庫頂。',
      },
    ],
    flavorText: 'Master of the mountain winds.',
    flavorTextTw: '山間的長鼻妖怪，操控風的大師。',
    imageUrl: '200px-Tengu.webp',
  },

  // ============================================
  // Cost 4
  // ============================================
  {
    id: 'A004',
    name: 'Boreas',
    nameTw: '波瑞阿斯',
    element: Element.WIND,
    cost: 4,
    baseScore: 6,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_TAME,
        targetElement: Element.WIND,
        stones: [{ type: StoneType.THREE, amount: 1 }],
        description: 'Earn 3 for each Wind card. Immediately recover this card.',
        descriptionTw: '每張風卡獲得 1 個 3 點石頭，立即回收此卡。',
      },
      {
        type: EffectType.RECOVER_CARD,
        trigger: EffectTrigger.ON_TAME,
        description: 'Immediately recover this card.',
        descriptionTw: '立即回收此卡到手牌。',
      },
    ],
    flavorText: 'North wind incarnate.',
    flavorTextTw: '北風之神，能召回你派出的夥伴。',
    imageUrl: '200px-Boreas.webp',
  },
  {
    id: 'A005',
    name: 'Genie',
    nameTw: '精靈',
    element: Element.WIND,
    cost: 4,
    baseScore: 6,
    effects: [
      {
        type: EffectType.ACTIVATE_ALL_PERMANENT,
        trigger: EffectTrigger.ON_TAME,
        description: 'Activate all available permanent effects of cards in your area.',
        descriptionTw: '觸發你場上所有可用的永久效果。',
      },
    ],
    flavorText: 'Your wish is my command.',
    flavorTextTw: '來自神燈的精靈，實現你的願望。',
    imageUrl: '200px-Genie.webp',
  },
  {
    id: 'A006',
    name: 'Hippogriff',
    nameTw: '駿鷹',
    element: Element.WIND,
    cost: 4,
    baseScore: 6,
    effects: [
      {
        type: EffectType.DRAW_CARD,
        trigger: EffectTrigger.ON_TAME,
        value: 1,
        description: 'Draw a card.',
        descriptionTw: '抽 1 張卡。',
      },
      {
        type: EffectType.DECREASE_COST,
        trigger: EffectTrigger.PERMANENT,
        targetElement: Element.WIND,
        value: 2,
        description: 'The cost of your Wind card is decreased by 2.',
        descriptionTw: '你的風卡 cost 永久 -2。',
      },
    ],
    flavorText: 'Half eagle, half horse.',
    flavorTextTw: '鷹與馬的結合體，高貴而迅捷。',
    imageUrl: '200px-Hippogriff.webp',
  },
  {
    id: 'A007',
    name: 'Sylph',
    nameTw: '風精靈',
    element: Element.WIND,
    cost: 4,
    baseScore: 6,
    effects: [
      {
        type: EffectType.DRAW_CARD,
        trigger: EffectTrigger.ON_TAME,
        value: 1,
        description: 'Draw a card.',
        descriptionTw: '抽 1 張卡。',
      },
      {
        type: EffectType.EARN_ON_SUMMON,
        trigger: EffectTrigger.PERMANENT,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description: 'Whenever you summon a card, earn 1.',
        descriptionTw: '每次召喚卡片時獲得 1 個 1 點石頭。',
      },
    ],
    flavorText: 'Dance upon the breeze.',
    flavorTextTw: '微風中的舞者，聚集同伴的力量。',
    imageUrl: '200px-Sylph.webp',
  },

  // ============================================
  // Cost 5
  // ============================================
  {
    id: 'A008',
    name: 'Genie Exalted',
    nameTw: '崇高精靈',
    element: Element.WIND,
    cost: 5,
    baseScore: 8,
    effects: [
      {
        type: EffectType.COPY_INSTANT_EFFECT,
        trigger: EffectTrigger.ON_TAME,
        description:
          'Copy one instant effect of another card in your area and activate it.',
        descriptionTw: '複製你場上另 1 張卡的即時效果並觸發。',
      },
    ],
    flavorText: 'Unlimited power!',
    flavorTextTw: '超越凡俗的精靈，能實現更大的願望。',
    imageUrl: '200px-Genieexalted.webp',
  },
  {
    id: 'A009',
    name: 'Valkyrie',
    nameTw: '女武神',
    element: Element.WIND,
    cost: 5,
    baseScore: 8,
    effects: [
      {
        type: EffectType.EARN_PER_FAMILY,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.THREE, amount: 1 }],
        value: 3,
        description: 'Earn 3 for each card family in your area.',
        descriptionTw: '你場上每個不同的卡片家族獲得 1 個 3 點石頭。',
      },
    ],
    flavorText: 'Chooser of the slain.',
    flavorTextTw: '選擇英靈的戰士女神，帶回逝去的勇者。',
    imageUrl: '200px-Valkyrie.webp',
  },

  // ============================================
  // Cost 6
  // ============================================
  {
    id: 'A011',
    name: 'Odin',
    nameTw: '奧丁',
    element: Element.WIND,
    cost: 6,
    baseScore: 9,
    effects: [
      {
        type: EffectType.CONDITIONAL_AREA,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.SIX, amount: 1 }],
        value: 6,
        description:
          'If you have less than 6 cards in your area, earn 6. Otherwise, earn 6.',
        descriptionTw: '如果你場上少於 6 張卡獲得 6 點石頭；否則也獲得 6 點石頭。',
      },
    ],
    flavorText: 'All-Father, seeker of wisdom.',
    flavorTextTw: '北歐眾神之父，為智慧獻出一切。',
    imageUrl: '200px-Odin.webp',
  },

  // ============================================
  // Cost 7
  // ============================================
  {
    id: 'A010',
    name: 'Griffon',
    nameTw: '獅鷲',
    element: Element.WIND,
    cost: 7,
    baseScore: 10,
    effects: [
      {
        type: EffectType.DRAW_CARD,
        trigger: EffectTrigger.ON_TAME,
        value: 1,
        description: 'Draw a card.',
        descriptionTw: '抽 1 張卡。',
      },
    ],
    flavorText: 'King of all creatures.',
    flavorTextTw: '獅子與鷹的結合，萬獸之王。',
    imageUrl: '200px-Griffon.webp',
  },
  {
    id: 'A012',
    name: 'Freyja',
    nameTw: '芙蕾雅',
    element: Element.WIND,
    cost: 7,
    baseScore: 10,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_TAME,
        targetElement: Element.WIND,
        stones: [{ type: StoneType.THREE, amount: 1 }],
        description: 'Earn 3 for each card with Wind in your area.',
        descriptionTw: '你場上每張風卡獲得 1 個 3 點石頭。',
      },
    ],
    flavorText: 'Goddess of love and war.',
    flavorTextTw: '愛與戰爭的女神，統御華納神族。',
    imageUrl: '200px-Freyja.webp',
  },

  // ============================================
  // Cost 8
  // ============================================
  {
    id: 'A013',
    name: 'Rudra',
    nameTw: '樓陀羅',
    element: Element.WIND,
    cost: 8,
    baseScore: 11,
    effects: [
      {
        type: EffectType.CONDITIONAL_HAND,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stone for each card in your hand.',
        descriptionTw: '你手牌中的每張卡獲得 1 個水石頭。',
      },
    ],
    flavorText: 'God of storms and destruction.',
    flavorTextTw: '風暴與毀滅之神，印度神話中的原始力量。',
    imageUrl: '200px-Rudra.webp',
  },

  // ============================================
  // Cost 10
  // ============================================
  {
    id: 'A014',
    name: 'Gi-rin',
    nameTw: '麒麟',
    element: Element.WIND,
    cost: 10,
    baseScore: 13,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stone for each card in your area.',
        descriptionTw: '你場上的每張卡獲得 1 個水石頭。',
      },
    ],
    flavorText: 'Auspicious beast of the east.',
    flavorTextTw: '祥瑞之獸，只在聖人出現時降臨人間。',
    imageUrl: '200px-Gi-rin.webp',
  },
] as const

/**
 * Wind cards by cost for quick lookup
 */
export const WIND_CARDS_BY_COST = {
  0: WIND_CARDS.filter((card) => card.cost === 0),
  2: WIND_CARDS.filter((card) => card.cost === 2),
  3: WIND_CARDS.filter((card) => card.cost === 3),
  4: WIND_CARDS.filter((card) => card.cost === 4),
  5: WIND_CARDS.filter((card) => card.cost === 5),
  6: WIND_CARDS.filter((card) => card.cost === 6),
  7: WIND_CARDS.filter((card) => card.cost === 7),
  8: WIND_CARDS.filter((card) => card.cost === 8),
  10: WIND_CARDS.filter((card) => card.cost === 10),
} as const

/**
 * Wind cards with draw effects
 */
export const WIND_DRAW_CARDS = WIND_CARDS.filter((card) =>
  card.effects.some((effect) => effect.type === EffectType.DRAW_CARD)
)

/**
 * Wind cards with cost reduction effects
 */
export const WIND_COST_REDUCTION_CARDS = WIND_CARDS.filter((card) =>
  card.effects.some((effect) => effect.type === EffectType.DECREASE_COST)
)

/**
 * Wind cards with permanent effects
 */
export const WIND_PERMANENT_CARDS = WIND_CARDS.filter((card) =>
  card.effects.some((effect) => effect.trigger === EffectTrigger.PERMANENT)
)

/**
 * Wind cards with recovery effects
 */
export const WIND_RECOVERY_CARDS = WIND_CARDS.filter((card) =>
  card.effects.some((effect) => effect.type === EffectType.RECOVER_CARD)
)
