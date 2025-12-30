/**
 * Earth Family Cards (15 cards)
 * Complete card data with Stone Economy System
 * @version 3.0.0
 */
console.log('[data/cards/earth-cards.ts] v3.0.0 loaded')

import {
  type CardTemplate,
  Element,
  EffectType,
  EffectTrigger,
  StoneType,
} from '@/types/cards'

/**
 * Earth Family - 15 Cards (E001, E003-E016)
 * Note: E002 (Dandelion Spirit) moved to Wind family as A015
 * Characteristics: Stone exchange, stealing, discard manipulation, free summon
 * Cost distribution: 0(1), 1(2), 2(2), 3(2), 4(2), 5(1), 6(3), 9(1), 10(1)
 */
export const EARTH_CARDS: readonly CardTemplate[] = [
  // ============================================
  // Cost 0
  // ============================================
  {
    id: 'E001',
    name: 'Young Forest Spirit',
    nameTw: '幼年森靈',
    element: Element.EARTH,
    cost: 0,
    baseScore: 1,
    effects: [
      {
        type: EffectType.FREE_SUMMON,
        trigger: EffectTrigger.ON_TAME,
        description: 'Discard a card from your hand and summon another card for free.',
        descriptionTw: '棄掉 1 張手牌，免費召喚另 1 張卡。',
      },
    ],
    flavorText: 'Newly awakened from the ancient tree.',
    flavorTextTw: '剛從古樹中誕生的精靈，帶著森林的祝福。',
    imageUrl: '200px-Youngforestspirit.webp',
  },

  // ============================================
  // Cost 1
  // ============================================
  {
    id: 'E003',
    name: 'Goblin',
    nameTw: '哥布林',
    element: Element.EARTH,
    cost: 1,
    baseScore: 2,
    effects: [
      {
        type: EffectType.STEAL_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description: 'Steal 1 from any opponent.',
        descriptionTw: '從任意對手偷取 1 個 1 點石頭。',
      },
    ],
    flavorText: 'Small but cunning.',
    flavorTextTw: '洞穴中的小矮人，貪婪但意外地好用。',
    imageUrl: '200px-Goblin.webp',
  },
  {
    id: 'E004',
    name: 'Mud Slime',
    nameTw: '泥漿史萊姆',
    element: Element.EARTH,
    cost: 1,
    baseScore: 1,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.SIX, amount: 1 }],
        description: 'Earn 6.',
        descriptionTw: '獲得 1 個 6 點石頭。',
      },
      {
        type: EffectType.RECOVER_CARD,
        trigger: EffectTrigger.PERMANENT,
        description: 'Recover.',
        descriptionTw: '可被回收。',
      },
    ],
    flavorText: 'Sticky but useful.',
    flavorTextTw: '黏糊糊的泥巴生物，體內藏有寶石。',
    imageUrl: '200px-Mudslime.webp',
  },

  // ============================================
  // Cost 2
  // ============================================
  {
    id: 'E005',
    name: 'Forest Spirit',
    nameTw: '森林精靈',
    element: Element.EARTH,
    cost: 2,
    baseScore: 3,
    effects: [
      {
        type: EffectType.DISCARD_FROM_HAND,
        trigger: EffectTrigger.ON_TAME,
        description: 'Discard a card from your hand and earn WATER (cost written on the card).',
        descriptionTw: '棄掉 1 張手牌，獲得等於該卡 cost 數量的水石頭。',
      },
    ],
    flavorText: 'Guardian of the grove.',
    flavorTextTw: '古老森林的守護者，與大地共鳴。',
    imageUrl: '200px-Forestspirit.webp',
  },
  {
    id: 'E006',
    name: 'Gargoyle',
    nameTw: '石像鬼',
    element: Element.EARTH,
    cost: 2,
    baseScore: 4,
    effects: [
      {
        type: EffectType.EARN_ON_SUMMON,
        trigger: EffectTrigger.PERMANENT,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        targetElement: Element.EARTH,
        description: 'Whenever you summon a card using EARTH, earn 1.',
        descriptionTw: '每次使用土石頭召喚卡片時，獲得 1 個 1 點石頭。',
      },
    ],
    flavorText: 'Stone guardian awakened.',
    flavorTextTw: '沉睡於古堡的石獸，覺醒時堅不可摧。',
    imageUrl: '200px-Gargoyle.webp',
  },

  // ============================================
  // Cost 3
  // ============================================
  {
    id: 'E007',
    name: 'Basilisk',
    nameTw: '蛇怪',
    element: Element.EARTH,
    cost: 3,
    baseScore: 5,
    effects: [
      {
        type: EffectType.EXCHANGE_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [
          { type: StoneType.ONE, amount: -1 },
          { type: StoneType.ONE, amount: -1 },
          { type: StoneType.ONE, amount: -1 },
          { type: StoneType.WATER, amount: -1 },
          { type: StoneType.SIX, amount: 1 },
          { type: StoneType.WATER, amount: 1 },
          { type: StoneType.SIX, amount: 1 },
        ],
        description: 'Lose 0 1 1 1 WATER, then earn 6 WATER 6.',
        descriptionTw: '失去 0、1、1、1、水石頭，然後獲得 6、水、6 石頭。',
      },
    ],
    flavorText: 'Its gaze turns flesh to stone.',
    flavorTextTw: '凝視即化為石像的恐怖蛇王。',
    imageUrl: '200px-Basilisk.webp',
  },
  {
    id: 'E008',
    name: 'Troll',
    nameTw: '巨魔',
    element: Element.EARTH,
    cost: 3,
    baseScore: 6,
    effects: [
      {
        type: EffectType.CONDITIONAL_EARN,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description: 'If you have 6, earn 1.',
        descriptionTw: '如果你有 6 點石頭，獲得 1 個 1 點石頭。',
      },
    ],
    flavorText: 'Beware the bridge.',
    flavorTextTw: '橋下的恐怖，力大無窮的巨魔。',
    imageUrl: '200px-Troll.webp',
  },

  // ============================================
  // Cost 4
  // ============================================
  {
    id: 'E009',
    name: 'Goblin Soldier',
    nameTw: '哥布林士兵',
    element: Element.EARTH,
    cost: 4,
    baseScore: 6,
    effects: [
      {
        type: EffectType.CONDITIONAL_EARN,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description: 'If any opponent has more points than you, earn 1. Otherwise lose 1.',
        descriptionTw: '如果任意對手分數比你高，獲得 1 個 1 點石頭；否則失去 1 個 1 點石頭。',
      },
    ],
    flavorText: 'Armed and dangerous.',
    flavorTextTw: '受過訓練的哥布林戰士，團結就是力量。',
    imageUrl: '200px-Goblinsoldier.webp',
  },
  {
    id: 'E010',
    name: 'Medusa',
    nameTw: '美杜莎',
    element: Element.EARTH,
    cost: 4,
    baseScore: 7,
    effects: [
      {
        type: EffectType.DISCARD_FROM_HAND,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.SIX, amount: 1 }],
        description: 'Discard a card from your hand, then earn 6.',
        descriptionTw: '棄掉 1 張手牌，然後獲得 1 個 6 點石頭。',
      },
    ],
    flavorText: 'Do not meet her gaze.',
    flavorTextTw: '蛇髮女妖，凝視者將化為石像。',
    imageUrl: '200px-Medusa.webp',
  },

  // ============================================
  // Cost 5
  // ============================================
  {
    id: 'E011',
    name: 'Cerberus',
    nameTw: '地獄犬',
    element: Element.EARTH,
    cost: 5,
    baseScore: 8,
    effects: [
      {
        type: EffectType.DISCARD_FROM_HAND,
        trigger: EffectTrigger.ON_TAME,
        value: 3,
        description: 'Discard up to 3 of your other summoned cards.',
        descriptionTw: '棄掉最多 3 張你其他已召喚的卡。',
      },
    ],
    flavorText: 'Guardian of the underworld.',
    flavorTextTw: '守護冥界入口的三頭犬。',
    imageUrl: '200px-Cerberus.webp',
  },

  // ============================================
  // Cost 6
  // ============================================
  {
    id: 'E012',
    name: 'Mimic',
    nameTw: '擬態怪',
    element: Element.EARTH,
    cost: 6,
    baseScore: 8,
    effects: [
      {
        type: EffectType.RECOVER_CARD,
        trigger: EffectTrigger.ON_TAME,
        targetElement: Element.EARTH,
        description: 'Choose any EARTH card from discard pile. Add it into your hand.',
        descriptionTw: '從棄牌堆選擇任意 1 張土卡加入手牌。',
      },
    ],
    flavorText: 'It could be anything.',
    flavorTextTw: '偽裝成寶箱的怪物，能從棄牌堆找回土系夥伴。',
    imageUrl: '200px-Mimic.webp',
  },
  {
    id: 'E013',
    name: 'Rock Golem',
    nameTw: '岩石魔像',
    element: Element.EARTH,
    cost: 6,
    baseScore: 9,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn WATER (total value of your 6).',
        descriptionTw: '獲得水石頭，數量等於你所有 6 點石頭的總價值。',
      },
    ],
    flavorText: 'Animated stone.',
    flavorTextTw: '由魔法賦予生命的岩石巨人。',
    imageUrl: '200px-Rockgolem.webp',
  },
  {
    id: 'E014',
    name: 'Stone Golem',
    nameTw: '石魔像',
    element: Element.EARTH,
    cost: 6,
    baseScore: 9,
    effects: [
      {
        type: EffectType.EXCHANGE_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.SIX, amount: 1 }],
        description: 'Exchange each of your stones with 6.',
        descriptionTw: '將你所有石頭都換成 6 點石頭。',
      },
    ],
    flavorText: 'Heart of precious gems.',
    flavorTextTw: '體內蘊含珍貴寶石的石像巨人，能將所有石頭轉化為最高級。',
    imageUrl: '200px-Stonegolem.webp',
  },

  // ============================================
  // Cost 9
  // ============================================
  {
    id: 'E015',
    name: 'Behemoth',
    nameTw: '貝希摩斯',
    element: Element.EARTH,
    cost: 9,
    baseScore: 12,
    effects: [
      {
        type: EffectType.EARN_PER_FAMILY,
        trigger: EffectTrigger.ON_TAME,
        value: 3,
        description: 'Earn 3 for each card family in your area.',
        descriptionTw: '你場上每個不同的卡片家族獲得 3 個石頭。',
      },
    ],
    flavorText: 'First beast of the land.',
    flavorTextTw: '陸地上最強大的巨獸，無可匹敵。',
    imageUrl: '200px-Behemoth.webp',
  },

  // ============================================
  // Cost 10
  // ============================================
  {
    id: 'E016',
    name: 'Sand Giant',
    nameTw: '沙漠巨人',
    element: Element.EARTH,
    cost: 10,
    baseScore: 13,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.SIX, amount: 1 }],
        targetElement: Element.EARTH,
        description: 'Earn 6 for each EARTH card in your area.',
        descriptionTw: '你場上每張土卡獲得 1 個 6 點石頭。',
      },
    ],
    flavorText: 'Lord of the dunes.',
    flavorTextTw: '沙漠的主宰，由無數沙粒凝聚而成。',
    imageUrl: '200px-Sandgiant.webp',
  },
] as const

/**
 * Earth cards by cost for quick lookup
 */
export const EARTH_CARDS_BY_COST = {
  0: EARTH_CARDS.filter((card) => card.cost === 0),
  1: EARTH_CARDS.filter((card) => card.cost === 1),
  2: EARTH_CARDS.filter((card) => card.cost === 2),
  3: EARTH_CARDS.filter((card) => card.cost === 3),
  4: EARTH_CARDS.filter((card) => card.cost === 4),
  5: EARTH_CARDS.filter((card) => card.cost === 5),
  6: EARTH_CARDS.filter((card) => card.cost === 6),
  9: EARTH_CARDS.filter((card) => card.cost === 9),
  10: EARTH_CARDS.filter((card) => card.cost === 10),
} as const

/**
 * Earth cards with recovery effects
 */
export const EARTH_RECOVERY_CARDS = EARTH_CARDS.filter((card) =>
  card.effects.some((effect) => effect.type === EffectType.RECOVER_CARD)
)

/**
 * Earth cards with permanent effects
 */
export const EARTH_PERMANENT_CARDS = EARTH_CARDS.filter((card) =>
  card.effects.some((effect) => effect.trigger === EffectTrigger.PERMANENT)
)

/**
 * Earth cards with steal/exchange effects
 */
export const EARTH_MANIPULATION_CARDS = EARTH_CARDS.filter((card) =>
  card.effects.some(
    (effect) =>
      effect.type === EffectType.STEAL_STONES ||
      effect.type === EffectType.EXCHANGE_STONES
  )
)
