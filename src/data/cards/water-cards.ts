/**
 * Water Family Cards (15 cards)
 * Complete card data with Stone Economy System
 * @version 3.0.0
 */
console.log('[data/cards/water-cards.ts] v3.0.0 loaded')

import {
  type CardTemplate,
  Element,
  EffectType,
  EffectTrigger,
  StoneType,
} from '@/types/cards'

/**
 * Water Family - 15 Cards (W001-W015)
 * Characteristics: Water stone mechanics, stone value exchange, point conversion
 * Cost distribution: 0(1), 1(3), 2(1), 3(3), 4(4), 5(1), 7(1)
 */
export const WATER_CARDS: readonly CardTemplate[] = [
  // ============================================
  // Cost 0
  // ============================================
  {
    id: 'W001',
    name: 'Yuki Onna',
    nameTw: '雪女',
    element: Element.WATER,
    cost: 0,
    baseScore: 2,
    effects: [
      {
        type: EffectType.DISCARD_ALL_FOR_POINTS,
        trigger: EffectTrigger.ON_TAME,
        description:
          'Discard all your stones and earn (total value of discarded stones).',
        descriptionTw: '棄掉你所有的石頭，獲得等值的分數。',
      },
    ],
    flavorText: 'Spirit of the frozen wastes.',
    flavorTextTw: '冰雪中的幽靈美人，將所有資源轉化為分數。',
    imageUrl: '200px-Yukionna.webp',
  },

  // ============================================
  // Cost 1
  // ============================================
  {
    id: 'W002',
    name: 'Kappa',
    nameTw: '河童',
    element: Element.WATER,
    cost: 1,
    baseScore: 2,
    effects: [
      {
        type: EffectType.EARN_ON_SUMMON,
        trigger: EffectTrigger.PERMANENT,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description: 'Whenever you summon a card using Water stone, earn 1.',
        descriptionTw: '每次使用水石頭召喚卡片時，獲得 1 個 1 點石頭。',
      },
    ],
    flavorText: 'Mischievous river spirit.',
    flavorTextTw: '棲息於河川的古老妖怪，頭頂之水是力量的泉源。',
    imageUrl: '200px-Kappa.webp',
  },
  {
    id: 'W003',
    name: 'Sea Spirit',
    nameTw: '海之靈',
    element: Element.WATER,
    cost: 1,
    baseScore: 2,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.PERMANENT,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description: 'Earn 1 for each your Water stone.',
        descriptionTw: '每個水石頭獲得 1 個 1 點石頭。',
      },
    ],
    flavorText: 'Whispers of the deep.',
    flavorTextTw: '深海的記憶守護者，水石頭越多收益越高。',
    imageUrl: '200px-Seaspirit.webp',
  },
  {
    id: 'W004',
    name: 'Undine',
    nameTw: '水精靈',
    element: Element.WATER,
    cost: 1,
    baseScore: 1,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stone.',
        descriptionTw: '獲得 1 個水石頭。',
      },
      {
        type: EffectType.RECOVER_CARD,
        trigger: EffectTrigger.PERMANENT,
        description: 'Recover.',
        descriptionTw: '可被回收。',
      },
    ],
    flavorText: 'Grace of flowing water.',
    flavorTextTw: '水的化身，流動的優雅蘊含著純淨的力量。',
    imageUrl: '200px-Undine.webp',
  },

  // ============================================
  // Cost 2
  // ============================================
  {
    id: 'W005',
    name: 'Nessie',
    nameTw: '尼斯湖水怪',
    element: Element.WATER,
    cost: 2,
    baseScore: 4,
    effects: [
      {
        type: EffectType.CONDITIONAL_AREA,
        trigger: EffectTrigger.PERMANENT,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description: 'If there is no 6 card in your area, earn 1.',
        descriptionTw: '如果你的場上沒有 6 分卡，獲得 1 個 1 點石頭。',
      },
    ],
    flavorText: 'Elusive legend of the lake.',
    flavorTextTw: '湖中的神秘生物，隱藏於低調的策略中。',
    imageUrl: '200px-Nessie.webp',
  },

  // ============================================
  // Cost 3
  // ============================================
  {
    id: 'W006',
    name: 'Hae-tae',
    nameTw: '獬豸',
    element: Element.WATER,
    cost: 3,
    baseScore: 4,
    effects: [
      {
        type: EffectType.EXCHANGE_STONES,
        trigger: EffectTrigger.PERMANENT,
        description:
          'Value of your Water stone counts as 3. Value of your 3 counts as Water stone.',
        descriptionTw: '水石頭價值視為 3 點，3 點石頭價值視為水石頭。',
      },
    ],
    flavorText: 'Guardian of justice.',
    flavorTextTw: '正義的守護獸，可交換水石頭與 3 點石頭的價值。',
    imageUrl: '200px-Hae-tae.webp',
  },
  {
    id: 'W007',
    name: 'Snail Maiden',
    nameTw: '蝸牛姑娘',
    element: Element.WATER,
    cost: 3,
    baseScore: 5,
    effects: [
      {
        type: EffectType.EXCHANGE_STONES,
        trigger: EffectTrigger.PERMANENT,
        stones: [
          { type: StoneType.SIX, amount: -1 },
          { type: StoneType.WATER, amount: 1 },
        ],
        description:
          'Exchange one of your 6 with Water stone and one of your Water stone with 6.',
        descriptionTw: '交換 1 個 6 點石頭和 1 個水石頭。',
      },
    ],
    flavorText: 'Gentle spirit of the shore.',
    flavorTextTw: '溫柔的海岸精靈，緩慢但穩定地轉換能量。',
    imageUrl: '200px-Snailmaiden.webp',
  },
  {
    id: 'W008',
    name: 'Undine Queen',
    nameTw: '水精靈女王',
    element: Element.WATER,
    cost: 3,
    baseScore: 5,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stone.',
        descriptionTw: '獲得 1 個水石頭。',
      },
    ],
    flavorText: 'Ruler of water spirits.',
    flavorTextTw: '統領所有水精靈的女王，水之力量的化身。',
    imageUrl: '200px-Undinequeen.webp',
  },

  // ============================================
  // Cost 4
  // ============================================
  {
    id: 'W009',
    name: 'Yuki Onna Exalted',
    nameTw: '崇高雪女',
    element: Element.WATER,
    cost: 4,
    baseScore: 6,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 1 }],
        description: 'Earn Water stone (total value of your Water stones).',
        descriptionTw: '獲得水石頭，數量等於你所有水石頭的總價值。',
      },
    ],
    flavorText: 'Ascended spirit of winter.',
    flavorTextTw: '超越凡俗的冰雪女神，水石頭越多收益越高。',
    imageUrl: '200px-Yukionnaexalted.webp',
  },
  {
    id: 'W010',
    name: 'Hydra',
    nameTw: '九頭蛇',
    element: Element.WATER,
    cost: 4,
    baseScore: 6,
    effects: [
      {
        type: EffectType.MULTI_CHOICE,
        trigger: EffectTrigger.ON_TAME,
        value: 2,
        description:
          'Choose 2 between (Water stone) / draw a card / earn them.',
        descriptionTw:
          '從「獲得水石頭」、「抽牌」、「獲得石頭」中選擇 2 個。',
      },
    ],
    flavorText: 'Cut one head, two grow back.',
    flavorTextTw: '砍掉一個頭，會長出兩個，永不消亡的怪獸。',
    imageUrl: '200px-Hydra.webp',
  },
  {
    id: 'W011',
    name: 'Leviathan',
    nameTw: '利維坦',
    element: Element.WATER,
    cost: 4,
    baseScore: 7,
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
        value: 1,
        description:
          'A player of your choice discards one of their unsummoned cards.',
        descriptionTw: '指定一位對手棄掉 1 張未召喚的卡。',
      },
    ],
    flavorText: 'Beast of the abyss.',
    flavorTextTw: '深淵的巨獸，海洋的霸主，令對手失去寶貴的卡片。',
    imageUrl: '200px-Leviathan.webp',
  },
  {
    id: 'W012',
    name: 'Triton',
    nameTw: '特里同',
    element: Element.WATER,
    cost: 4,
    baseScore: 6,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.PERMANENT,
        stones: [{ type: StoneType.WATER, amount: 2 }],
        targetElement: Element.WATER,
        description: 'Whenever you tame a Water card, earn 2 Water stones.',
        descriptionTw: '每次馴服水卡時，獲得 2 個水石頭。',
      },
    ],
    flavorText: 'Messenger of the sea.',
    flavorTextTw: '海神的使者，吹響海螺召喚潮汐。',
    imageUrl: '200px-Triton.webp',
  },
  {
    id: 'W013',
    name: 'Water Giant',
    nameTw: '水巨人',
    element: Element.WATER,
    cost: 4,
    baseScore: 7,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.WATER, amount: 2 }],
        description: 'Earn 2 Water stones.',
        descriptionTw: '獲得 2 個水石頭。',
      },
      {
        type: EffectType.INCREASE_STONE_VALUE,
        trigger: EffectTrigger.PERMANENT,
        stones: [
          { type: StoneType.WATER, amount: 1 },
          { type: StoneType.SIX, amount: 1 },
        ],
        value: 1,
        description: 'Values of your Water stone and 6 are each increased by 1.',
        descriptionTw: '你的水石頭和 6 點石頭的價值各 +1。',
      },
    ],
    flavorText: 'Living tsunami.',
    flavorTextTw: '由海水凝聚而成的巨大存在，提升關鍵石頭的價值。',
    imageUrl: '200px-Watergiant.webp',
  },

  // ============================================
  // Cost 5
  // ============================================
  {
    id: 'W014',
    name: 'Charybdis',
    nameTw: '卡律布狄斯',
    element: Element.WATER,
    cost: 5,
    baseScore: 8,
    effects: [
      {
        type: EffectType.EXCHANGE_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [
          { type: StoneType.WATER, amount: -1 },
          { type: StoneType.WATER, amount: 1 },
        ],
        description: 'Discard one of your Water stone, then earn Water stone.',
        descriptionTw: '棄掉 1 個水石頭，然後獲得水石頭。',
      },
    ],
    flavorText: 'The great whirlpool.',
    flavorTextTw: '吞噬一切的大漩渦，循環水石頭的力量。',
    imageUrl: '200px-Charybdis.webp',
  },

  // ============================================
  // Cost 7
  // ============================================
  {
    id: 'W015',
    name: 'Poseidon',
    nameTw: '波賽頓',
    element: Element.WATER,
    cost: 7,
    baseScore: 10,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.THREE, amount: 1 }],
        targetElement: Element.WATER,
        description: 'Earn 3 for each Water card in your area.',
        descriptionTw: '你場上每張水卡獲得 1 個 3 點石頭。',
      },
    ],
    flavorText: 'God of the seas.',
    flavorTextTw: '希臘神話中的海神，統御所有海洋生物。',
    imageUrl: '200px-Poseidon.webp',
  },
] as const

/**
 * Water cards by cost for quick lookup
 */
export const WATER_CARDS_BY_COST = {
  0: WATER_CARDS.filter((card) => card.cost === 0),
  1: WATER_CARDS.filter((card) => card.cost === 1),
  2: WATER_CARDS.filter((card) => card.cost === 2),
  3: WATER_CARDS.filter((card) => card.cost === 3),
  4: WATER_CARDS.filter((card) => card.cost === 4),
  5: WATER_CARDS.filter((card) => card.cost === 5),
  7: WATER_CARDS.filter((card) => card.cost === 7),
} as const

/**
 * Water cards with recovery effects
 */
export const WATER_RECOVERY_CARDS = WATER_CARDS.filter((card) =>
  card.effects.some((effect) => effect.type === EffectType.RECOVER_CARD)
)

/**
 * Water cards with permanent effects
 */
export const WATER_PERMANENT_CARDS = WATER_CARDS.filter((card) =>
  card.effects.some((effect) => effect.trigger === EffectTrigger.PERMANENT)
)

/**
 * Water cards with Water stone generation
 */
export const WATER_STONE_GENERATORS = WATER_CARDS.filter((card) =>
  card.effects.some(
    (effect) =>
      effect.stones?.some(
        (stone) => stone.type === StoneType.WATER && stone.amount > 0
      )
  )
)
