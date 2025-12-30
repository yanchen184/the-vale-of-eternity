/**
 * MVP 1.0 Card Data - 20 Cards (5 elements x 4 cards each)
 * Updated to use new effects array format
 * @version 3.0.0
 */
console.log('[data/cards/mvp-cards.ts] v3.0.0 loaded')

import {
  type CardTemplate,
  type CardInstance,
  type CardEffect,
  Element,
  EffectType,
  EffectTrigger,
  CardLocation,
  StoneType,
} from '@/types/cards'

// ============================================
// FIRE FAMILY (4 cards)
// ============================================

const FIRE_CARDS: readonly CardTemplate[] = [
  {
    id: 'F001',
    name: 'Hestia',
    nameTw: '赫斯提亞',
    element: Element.FIRE,
    cost: 0,
    baseScore: 0,
    effects: [
      {
        type: EffectType.INCREASE_STONE_LIMIT,
        trigger: EffectTrigger.PERMANENT,
        value: 2,
        description: 'Your stone limit increases by 2.',
        descriptionTw: '你的石頭上限增加 2。',
      },
    ],
    flavorTextTw: '家與爐火的守護者，賜予你更多承載力量的空間。',
  },
  {
    id: 'F002',
    name: 'Imp',
    nameTw: '小惡魔',
    element: Element.FIRE,
    cost: 1,
    baseScore: 2,
    effects: [],
    flavorTextTw: '頑皮的火焰精靈，雖然弱小但忠誠。',
  },
  {
    id: 'F003',
    name: 'Firefox',
    nameTw: '火狐',
    element: Element.FIRE,
    cost: 2,
    baseScore: 3,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_SCORE,
        value: 1,
        targetElement: Element.FIRE,
        description: 'Score +1 for each Fire card you have.',
        descriptionTw: '你的每張火卡額外 +1 分。',
      },
    ],
    flavorTextTw: '九尾之火在夜空中閃耀，照亮同族的榮光。',
  },
  {
    id: 'F004',
    name: 'Salamander',
    nameTw: '火蜥蜴',
    element: Element.FIRE,
    cost: 3,
    baseScore: 4,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.ONE, amount: 2 }],
        description: 'When tamed, gain 2 stones.',
        descriptionTw: '馴服時，獲得 2 顆石頭。',
      },
    ],
    flavorTextTw: '火焰的化身，將熾熱轉化為可用的能量。',
  },
] as const

// ============================================
// WATER FAMILY (4 cards)
// ============================================

const WATER_CARDS: readonly CardTemplate[] = [
  {
    id: 'W001',
    name: 'Kappa',
    nameTw: '河童',
    element: Element.WATER,
    cost: 1,
    baseScore: 2,
    effects: [],
    flavorTextTw: '棲息於河川的古老妖怪，頭頂之水是力量的泉源。',
  },
  {
    id: 'W002',
    name: 'Yuki Onna',
    nameTw: '雪女',
    element: Element.WATER,
    cost: 2,
    baseScore: 3,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_SCORE,
        value: 1,
        targetElement: Element.WATER,
        description: 'Score +1 for each Water card you have.',
        descriptionTw: '你的每張水卡額外 +1 分。',
      },
    ],
    flavorTextTw: '冰雪之中的幽靈美人，寒風中凝聚同類的力量。',
  },
  {
    id: 'W003',
    name: 'Undine',
    nameTw: '水精靈',
    element: Element.WATER,
    cost: 3,
    baseScore: 5,
    effects: [],
    flavorTextTw: '水的化身，流動的優雅蘊含著純淨的力量。',
  },
  {
    id: 'W004',
    name: 'Sea Spirit',
    nameTw: '海之靈',
    element: Element.WATER,
    cost: 4,
    baseScore: 4,
    effects: [
      {
        type: EffectType.RECOVER_CARD,
        trigger: EffectTrigger.ON_TAME,
        value: 1,
        description: 'When tamed, draw 1 card from the discard pile.',
        descriptionTw: '馴服時，從棄牌堆抽取 1 張卡片加入手牌。',
      },
    ],
    flavorTextTw: '深海的記憶守護者，能喚回被遺忘的力量。',
  },
] as const

// ============================================
// EARTH FAMILY (4 cards)
// ============================================

const EARTH_CARDS: readonly CardTemplate[] = [
  {
    id: 'E001',
    name: 'Young Forest Spirit',
    nameTw: '幼年森靈',
    element: Element.EARTH,
    cost: 0,
    baseScore: 1,
    effects: [],
    flavorTextTw: '剛從古樹中誕生的精靈，帶著森林的祝福。',
  },
  {
    id: 'E002',
    name: 'Goblin',
    nameTw: '哥布林',
    element: Element.EARTH,
    cost: 1,
    baseScore: 2,
    effects: [],
    flavorTextTw: '洞穴中的小矮人，貪婪但意外地好用。',
  },
  {
    id: 'E003',
    name: 'Forest Spirit',
    nameTw: '森林精靈',
    element: Element.EARTH,
    cost: 3,
    baseScore: 4,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_SCORE,
        value: 1,
        targetElement: Element.EARTH,
        description: 'Score +1 for each Earth card you have.',
        descriptionTw: '你的每張土卡額外 +1 分。',
      },
    ],
    flavorTextTw: '古老森林的守護者，與大地共鳴。',
  },
  {
    id: 'E004',
    name: 'Gargoyle',
    nameTw: '石像鬼',
    element: Element.EARTH,
    cost: 4,
    baseScore: 6,
    effects: [],
    flavorTextTw: '沉睡於古堡的石獸，覺醒時堅不可摧。',
  },
] as const

// ============================================
// WIND FAMILY (4 cards)
// ============================================

const WIND_CARDS: readonly CardTemplate[] = [
  {
    id: 'A001',
    name: 'Harpy',
    nameTw: '鷹身女妖',
    element: Element.WIND,
    cost: 1,
    baseScore: 2,
    effects: [],
    flavorTextTw: '風暴中的掠食者，尖銳的叫聲劃破天際。',
  },
  {
    id: 'A002',
    name: 'Pegasus',
    nameTw: '飛馬',
    element: Element.WIND,
    cost: 2,
    baseScore: 3,
    effects: [
      {
        type: EffectType.EARN_STONES,
        trigger: EffectTrigger.ON_TAME,
        stones: [{ type: StoneType.ONE, amount: 1 }],
        description: 'When tamed, gain 1 stone.',
        descriptionTw: '馴服時，獲得 1 顆石頭。',
      },
    ],
    flavorTextTw: '翱翔於雲端的神駒，帶來天界的饋贈。',
  },
  {
    id: 'A003',
    name: 'Sylph',
    nameTw: '風精靈',
    element: Element.WIND,
    cost: 3,
    baseScore: 4,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_SCORE,
        value: 1,
        targetElement: Element.WIND,
        description: 'Score +1 for each Wind card you have.',
        descriptionTw: '你的每張風卡額外 +1 分。',
      },
    ],
    flavorTextTw: '微風中的舞者，聚集同伴的力量。',
  },
  {
    id: 'A004',
    name: 'Tengu',
    nameTw: '天狗',
    element: Element.WIND,
    cost: 4,
    baseScore: 5,
    effects: [],
    flavorTextTw: '山間的長鼻妖怪，操控風的大師。',
  },
] as const

// ============================================
// DRAGON FAMILY (4 cards)
// ============================================

const DRAGON_CARDS: readonly CardTemplate[] = [
  {
    id: 'D001',
    name: 'Dragon Egg',
    nameTw: '龍蛋',
    element: Element.DRAGON,
    cost: 0,
    baseScore: 0,
    effects: [
      {
        type: EffectType.EARN_PER_FAMILY,
        trigger: EffectTrigger.ON_SCORE,
        value: 2,
        targetElement: Element.DRAGON,
        description: 'Score +2 for each Dragon card you have.',
        descriptionTw: '你的每張龍卡額外 +2 分。',
      },
    ],
    flavorTextTw: '蘊含無限可能的神秘之卵，與龍族共鳴。',
  },
  {
    id: 'D002',
    name: 'Ember',
    nameTw: '熾焰龍',
    element: Element.DRAGON,
    cost: 4,
    baseScore: 5,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_SCORE,
        value: 2,
        targetElement: Element.FIRE,
        description: 'Score +2 for each Fire card you have.',
        descriptionTw: '你的每張火卡額外 +2 分。',
      },
    ],
    flavorTextTw: '烈焰之心的幼龍，與火焰生物心意相通。',
  },
  {
    id: 'D003',
    name: 'Tidal',
    nameTw: '潮汐龍',
    element: Element.DRAGON,
    cost: 4,
    baseScore: 5,
    effects: [
      {
        type: EffectType.EARN_PER_ELEMENT,
        trigger: EffectTrigger.ON_SCORE,
        value: 2,
        targetElement: Element.WATER,
        description: 'Score +2 for each Water card you have.',
        descriptionTw: '你的每張水卡額外 +2 分。',
      },
    ],
    flavorTextTw: '統領海洋的幼龍，與水之生物同調。',
  },
  {
    id: 'D004',
    name: 'Boulder',
    nameTw: '磐石龍',
    element: Element.DRAGON,
    cost: 5,
    baseScore: 7,
    effects: [],
    flavorTextTw: '山脈的守護者，堅如磐石的巨龍。',
  },
] as const

// ============================================
// COMBINED MVP CARDS
// ============================================

/**
 * All 20 MVP card templates
 */
export const MVP_CARDS: readonly CardTemplate[] = [
  ...FIRE_CARDS,
  ...WATER_CARDS,
  ...EARTH_CARDS,
  ...WIND_CARDS,
  ...DRAGON_CARDS,
] as const

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a card template by ID
 * @param id Card ID (e.g., 'F001')
 * @returns CardTemplate or undefined if not found
 */
export function getCardById(id: string): CardTemplate | undefined {
  return MVP_CARDS.find(card => card.id === id)
}

/**
 * Get all cards of a specific element
 * @param element Element type
 * @returns Array of card templates
 */
export function getCardsByElement(element: Element): CardTemplate[] {
  return MVP_CARDS.filter(card => card.element === element)
}

/**
 * Get all cards with a specific effect type
 * @param effectType Effect type
 * @returns Array of card templates
 */
export function getCardsByEffectType(effectType: EffectType): CardTemplate[] {
  return MVP_CARDS.filter(card =>
    card.effects.some(effect => effect.type === effectType)
  )
}

/**
 * Extract legacy effect fields from effects array for backward compatibility
 * @param effects Effects array from CardTemplate
 * @returns Legacy effect fields
 */
function extractLegacyEffectFields(effects: readonly CardEffect[]): {
  effectType: EffectType
  effectTrigger: EffectTrigger
  effectValue?: number
  effectTarget?: Element
  effectDescription: string
  effectDescriptionTw: string
} {
  if (effects.length === 0) {
    return {
      effectType: EffectType.NONE,
      effectTrigger: EffectTrigger.NONE,
      effectDescription: '',
      effectDescriptionTw: '',
    }
  }

  const primaryEffect = effects[0]
  const effectDescription = effects.map(e => e.description).join(' ')
  const effectDescriptionTw = effects.map(e => e.descriptionTw).join(' ')

  return {
    effectType: primaryEffect.type,
    effectTrigger: primaryEffect.trigger,
    effectValue: primaryEffect.value,
    effectTarget: primaryEffect.targetElement,
    effectDescription,
    effectDescriptionTw,
  }
}

/**
 * Create a card instance from a template
 * @param template Card template
 * @param instanceIndex Instance index (0 or 1 for MVP)
 * @returns CardInstance
 */
export function createCardInstance(
  template: CardTemplate,
  instanceIndex: number
): CardInstance {
  const legacyFields = extractLegacyEffectFields(template.effects)

  return {
    instanceId: `${template.id}-${instanceIndex}`,
    cardId: template.id,
    name: template.name,
    nameTw: template.nameTw,
    element: template.element,
    cost: template.cost,
    baseScore: template.baseScore,
    effects: template.effects,
    // Legacy fields for backward compatibility
    effectType: legacyFields.effectType,
    effectTrigger: legacyFields.effectTrigger,
    effectValue: legacyFields.effectValue,
    effectTarget: legacyFields.effectTarget,
    effectDescription: legacyFields.effectDescription,
    effectDescriptionTw: legacyFields.effectDescriptionTw,
    // Runtime state
    ownerId: null,
    location: CardLocation.DECK,
    isRevealed: false,
    scoreModifier: 0,
    hasUsedAbility: false,
  }
}

/**
 * Build a full deck for MVP (20 cards x 2 copies = 40 cards)
 * @returns Array of 40 card instances
 */
export function buildDeck(): CardInstance[] {
  const deck: CardInstance[] = []

  for (const template of MVP_CARDS) {
    // Create 2 copies of each card
    deck.push(createCardInstance(template, 0))
    deck.push(createCardInstance(template, 1))
  }

  return deck
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param array Array to shuffle
 * @returns New shuffled array
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Build and shuffle a deck for a new game
 * @returns Shuffled array of 40 card instances
 */
export function buildShuffledDeck(): CardInstance[] {
  return shuffleArray(buildDeck())
}

/**
 * Get all cards - alias for MVP_CARDS
 * @returns All MVP card templates
 */
export function getAllCards(): readonly CardTemplate[] {
  return MVP_CARDS
}

// ============================================
// EXPORTS
// ============================================

export {
  FIRE_CARDS,
  WATER_CARDS,
  EARTH_CARDS,
  WIND_CARDS,
  DRAGON_CARDS,
}
