/**
 * Fire Family Cards (15 cards)
 * Complete card data with Stone Economy System
 * @version 3.9.0 - Fixed F015 (Surtr) effect: earn 2 points per unique element in area
 */
console.log('[data/cards/fire-cards.ts] v3.9.0 loaded')

import {
  type CardTemplate,
  Element,
  EffectType,
  EffectTrigger,
  StoneType,
} from '@/types/cards'

/**
 * Fire Family - 15 Cards (F001-F015)
 * Characteristics: Stone generation, value modification, recovery mechanics
 * Cost distribution: 0(1), 1(4), 2(2), 3(3), 4(5)
 */
export const FIRE_CARDS: readonly CardTemplate[] = [
  // ============================================
  // Cost 0
  // ============================================
  {
    id: 'F001',
    name: 'Hestia',
    nameTw: '赫斯提亞',
    element: Element.FIRE,
    cost: 0,
    baseScore: 1,
    effects: [
      {
        type: EffectType.INCREASE_STONE_LIMIT,
        trigger: EffectTrigger.PERMANENT,
        value: 2,
        description: 'You can keep two more stones.',
        descriptionTw: '你的石頭持有上限增加 2。',
      },
    ],
    flavorText: 'Guardian of hearth and home.',
    flavorTextTw: '家與爐火的守護者，賜予你更多承載力量的空間。',
    imageUrl: '200px-Hestia.webp',
  },

  // ============================================
  // Cost 1
  // ============================================
  {
    id: 'F002',
    name: 'Imp',
    nameTw: '小惡魔',
    element: Element.FIRE,
    cost: 1,
    baseScore: 2,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.ONE, amount: 2 }],
        description: 'Earn 1 1.',
        descriptionTw: '獲得 2 個 1 點石頭。',
        isImplemented: true,
      },
      {
        type: EffectType.RECOVER_CARD,
        trigger: EffectTrigger.ON_SCORE,
        description: 'Recover.',
        descriptionTw: '可被回收。',
        isImplemented: true,
      },
    ],
    flavorText: 'Small but mischievous.',
    flavorTextTw: '頑皮的火焰精靈,雖然弱小但忠誠。',
    imageUrl: '200px-Imp.webp',
  },
  {
    id: 'F003',
    name: 'Succubus',
    nameTw: '魅魔',
    element: Element.FIRE,
    cost: 1,
    baseScore: 4,
    effects: [
      {
        type: EffectType.CONDITIONAL_AREA,
        trigger: EffectTrigger.ON_TAME,
        value: 10,
        description:
          'If cards with written cost of 1, 2, 3, and 4 are all in your area, earn 10.',
        descriptionTw:
          '如果你的場上同時有 cost 1、2、3、4 的卡片，獲得 10 分。',
        isImplemented: true,
      },
    ],
    flavorText: 'Beauty can be deceiving.',
    flavorTextTw: '魅惑人心的惡魔，集齊四種力量可獲得巨大獎勵。',
    imageUrl: '200px-Succubus.webp',
  },
  {
    id: 'F004',
    name: 'Firefox',
    nameTw: '火狐',
    element: Element.FIRE,
    cost: 1,
    baseScore: 3,
    effects: [
      {
        type: EffectType.CONDITIONAL_HAND,
        trigger: EffectTrigger.ON_TAME,
        value: 1,  // 1 point per card in hand
        description: 'Earn 1 point for each card in your hand.',
        descriptionTw: '手牌每張卡獲得 1 分。',
        isImplemented: true,
      },
    ],
    flavorText: 'Nine tails blaze in the night.',
    flavorTextTw: '九尾之火在夜空中閃耀，手牌越多收益越高。',
    imageUrl: '200px-Firefox.webp',
  },
  {
    id: 'F005',
    name: 'Salamander',
    nameTw: '火蜥蜴',
    element: Element.FIRE,
    cost: 1,
    baseScore: 2,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_SCORE,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description: 'Earn 1.',
        descriptionTw: '回合結束獲得 1 個 1 點石頭。',
        isImplemented: true,
      },
      {
        type: EffectType.CONDITIONAL_AREA,
        trigger: EffectTrigger.ON_SCORE,
        value: 1,
        description: 'Earn 1 point.',
        descriptionTw: '回合結束獲得 1 分。',
        isImplemented: true,
      },
    ],
    flavorText: 'Born from the flames themselves.',
    flavorTextTw: '火焰的化身，將熾熱轉化為穩定的能量來源。',
    imageUrl: '200px-Salamander.webp',
  },

  // ============================================
  // Cost 2
  // ============================================
  {
    id: 'F006',
    name: 'Horned Salamander',
    nameTw: '角火蜥蜴',
    element: Element.FIRE,
    cost: 2,
    baseScore: 6,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_SCORE,
        stones: [{ type: StoneType.ONE, amount: 4 }],
        description: 'Earn 1 1 1 1.',
        descriptionTw: '回合結束獲得 4 個 1 點石頭。',
        isImplemented: true,
      },
    ],
    flavorText: 'Ancient and powerful.',
    flavorTextTw: '比普通火蜥蜴更加強大的古老存在，持續產出大量石頭。',
    imageUrl: '200px-Hornedsalamander.webp',
  },
  {
    id: 'F007',
    name: 'Ifrit',
    nameTw: '伊夫利特',
    element: Element.FIRE,
    cost: 2,
    baseScore: 6,
    effects: [
      {
        type: EffectType.CONDITIONAL_AREA,
        trigger: EffectTrigger.ON_TAME,
        value: 1, // 1 point per card
        description: 'Earn 1 point for each card in your area.',
        descriptionTw: '你場上的每張卡獲得 1 分。',
        isImplemented: true,
      },
    ],
    flavorText: 'Djinn of flames.',
    flavorTextTw: '火焰精靈王，場上卡片越多收益越高。',
    imageUrl: '200px-Ifrit.webp',
  },

  // ============================================
  // Cost 3 (originally marked as Cost 2)
  // ============================================
  {
    id: 'F008',
    name: 'Incubus',
    nameTw: '夢魔',
    element: Element.FIRE,
    cost: 2,
    baseScore: 6,
    effects: [
      {
        type: EffectType.CONDITIONAL_AREA,
        trigger: EffectTrigger.ON_TAME,
        value: 2, // 2 points per matching card
        description:
          'Earn 2 points for each card with a written cost of 2 or less in your area.',
        descriptionTw: '你場上每張 cost 2 或更低的卡，獲得 2 分。',
        isImplemented: true,
      },
    ],
    flavorText: 'Haunter of dreams.',
    flavorTextTw: '潛入夢境的惡魔，獎勵低費卡片的策略。',
    imageUrl: '200px-Incubus.webp',
  },
  {
    id: 'F009',
    name: 'Burning Skull',
    nameTw: '燃燒骷髏',
    element: Element.FIRE,
    cost: 3,
    baseScore: 6,
    effects: [
      {
        type: EffectType.EXCHANGE_STONES,
        trigger: EffectTrigger.ON_SCORE,
        stones: [
          { type: StoneType.ONE, amount: -1 },  // Discard 1-stone
        ],
        value: 3,  // Earn 3 points
        description: 'Discard one of your 1, then earn 3 points.',
        descriptionTw: '棄掉 1 個 1 點石頭，然後獲得 3 分。',
        isImplemented: true,
        isConditional: true, // Requires at least one 1-stone to activate
      },
    ],
    flavorText: 'Flames of vengeance.',
    flavorTextTw: '不滅的復仇之火，將大石頭轉換為小石頭。',
    imageUrl: '200px-Burningskull.webp',
  },
  {
    id: 'F010',
    name: 'Lava Giant',
    nameTw: '熔岩巨人',
    element: Element.FIRE,
    cost: 3,
    baseScore: 8,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_TAME,
        targetElement: Element.FIRE,
        value: 2,
        description: 'Earn 2 points for each Fire card in your area.',
        descriptionTw: '你場上每張火屬性卡獲得 2 分。',
        isImplemented: true,
      },
    ],
    flavorText: 'Molten rock given form.',
    flavorTextTw: '由熔岩凝聚而成的巨大存在，獎勵火屬性卡策略。',
    imageUrl: '200px-Lavagiant.webp',
  },
  {
    id: 'F011',
    name: 'Phoenix',
    nameTw: '鳳凰',
    element: Element.FIRE,
    cost: 3,
    baseScore: 8,
    effects: [
      {
        type: EffectType.EARN_ON_SUMMON,
        trigger: EffectTrigger.PERMANENT,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description: 'Whenever you summon a card, earn 1 for each used 3.',
        descriptionTw: '每次召喚卡片時，每個使用的 3 點石頭獲得 1 個 1 點石頭。',
      },
    ],
    flavorText: 'Rising from ashes.',
    flavorTextTw: '從灰燼中重生的不死鳥，獎勵使用 3 點石頭召喚。',
    imageUrl: '200px-Phoenix.webp',
  },

  // ============================================
  // Cost 4
  // ============================================
  {
    id: 'F012',
    name: 'Agni',
    nameTw: '阿耆尼',
    element: Element.FIRE,
    cost: 4,
    baseScore: 4,
    effects: [
      {
        type: EffectType.INCREASE_STONE_VALUE,
        trigger: EffectTrigger.PERMANENT,
        stones: [{ type: StoneType.THREE, amount: 1 }],
        value: 1,
        description: 'The value of your 3 is increased by 1.',
        descriptionTw: '你所有 3 點石頭的價值永久 +1。',
      },
    ],
    flavorText: 'God of fire.',
    flavorTextTw: '印度神話中的火神，提升 3 點石頭的價值。',
    imageUrl: '200px-Agni.webp',
  },
  {
    id: 'F013',
    name: 'Asmodeus',
    nameTw: '阿斯莫德',
    element: Element.FIRE,
    cost: 4,
    baseScore: 4,
    effects: [
      {
        type: EffectType.RECOVER_CARD,
        trigger: EffectTrigger.PERMANENT,
        value: 2,
        description:
          'Recover one of your cards with instant effect and a written cost of 2 or less.',
        descriptionTw: '回收 1 張你場上 cost 2 或以下且有即時效果的卡。',
      },
    ],
    flavorText: 'Prince of demons.',
    flavorTextTw: '七宗罪之一的惡魔王子，允許回收低費即時效果卡。',
    imageUrl: '200px-Asmodeus.webp',
  },
  {
    id: 'F014',
    name: 'Balog',
    nameTw: '巴洛格',
    element: Element.FIRE,
    cost: 4,
    baseScore: 4,
    effects: [
      {
        type: EffectType.RECOVER_CARD,
        trigger: EffectTrigger.PERMANENT,
        value: 6,
        description: 'Recover one of your 6 cards with instant effect.',
        descriptionTw: '回收 1 張你場上 6 分且有即時效果的卡。',
      },
    ],
    flavorText: 'Demon of shadow and flame.',
    flavorTextTw: '影與火焰的惡魔，允許回收高分即時效果卡。',
    imageUrl: '200px-Balog.webp',
  },
  {
    id: 'F015',
    name: 'Surtr',
    nameTw: '蘇爾特爾',
    element: Element.FIRE,
    cost: 4,
    baseScore: 4,
    effects: [
      {
        type: EffectType.EARN_PER_FAMILY,
        trigger: EffectTrigger.ON_TAME,
        value: 2, // 2 points per family
        description: 'Earn 2 for each card family in your area.',
        descriptionTw: '你場上每個不同的卡片家族獲得 2 分。',
        isImplemented: true,
      },
    ],
    flavorText: 'Bringer of Ragnarok.',
    flavorTextTw: '北歐神話中的火焰巨人之王，獎勵多元化家族策略。',
    imageUrl: '200px-Surtr.webp',
  },
] as const

/**
 * Fire cards by cost for quick lookup
 */
export const FIRE_CARDS_BY_COST = {
  0: FIRE_CARDS.filter((card) => card.cost === 0),
  1: FIRE_CARDS.filter((card) => card.cost === 1),
  2: FIRE_CARDS.filter((card) => card.cost === 2),
  3: FIRE_CARDS.filter((card) => card.cost === 3),
  4: FIRE_CARDS.filter((card) => card.cost === 4),
} as const

/**
 * Fire cards with recovery effects
 */
export const FIRE_RECOVERY_CARDS = FIRE_CARDS.filter((card) =>
  card.effects.some((effect) => effect.type === EffectType.RECOVER_CARD)
)

/**
 * Fire cards with permanent effects
 */
export const FIRE_PERMANENT_CARDS = FIRE_CARDS.filter((card) =>
  card.effects.some((effect) => effect.trigger === EffectTrigger.PERMANENT)
)
