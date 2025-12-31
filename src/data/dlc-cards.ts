/**
 * DLC Card Templates for Artifacts Expansion
 * Contains DLC expansion creature cards
 * @version 1.3.0 - Added flavor text to all DLC cards
 */
console.log('[data/dlc-cards.ts] v1.3.0 loaded')

import {
  CardTemplate,
  Element,
  EffectType,
  EffectTrigger,
  StoneType,
} from '@/types/cards'

// ============================================
// FIRE ELEMENT DLC CARDS (6 cards)
// ============================================

export const ASH: CardTemplate = {
  id: 'DLC_F001',
  name: 'Ash',
  nameTw: '灰燼',
  element: Element.FIRE,
  cost: 1,
  baseScore: 1,
  effects: [
    {
      type: EffectType.CONDITIONAL_AREA,
      trigger: EffectTrigger.PERMANENT,
      description: 'When discarded from hand, recover it and earn points equal to round number.',
      descriptionTw: '當從手牌棄掉時，改為回收它並獲得等於回合數的分數。',
    },
  ],
  flavorText: 'From ashes, new life emerges.',
  flavorTextTw: '灰燼中蘊藏著重生的力量，每一次捨棄都是新的開始。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Ash.jpg',
}

export const FIRE_RAT: CardTemplate = {
  id: 'DLC_F002',
  name: 'Fire Rat',
  nameTw: '火鼠',
  element: Element.FIRE,
  cost: 2,
  baseScore: 2,
  effects: [
    {
      type: EffectType.EARN_PER_ELEMENT,
      trigger: EffectTrigger.ON_TAME,
      targetElement: Element.FIRE,
      description: 'When tamed: Earn 1 stone per fire card in your area.',
      descriptionTw: '馴服時：你的場上每有1張火卡，獲得1顆石頭。',
    },
  ],
  flavorText: 'Flames dance where it runs.',
  flavorTextTw: '火焰伴隨著牠的奔跑而舞動，點燃周圍的火之精靈。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Firerat.jpg',
}

export const BUL_GAE: CardTemplate = {
  id: 'DLC_F003',
  name: 'Bul-gae',
  nameTw: '不可害',
  element: Element.FIRE,
  cost: 3,
  baseScore: 2,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [{ type: StoneType.FIRE, amount: 1 }],
      description: 'When tamed: Earn 1 fire stone. Count as 2 fire cards for scoring.',
      descriptionTw: '馴服時：獲得1顆火石。計分時算作2張火卡。',
    },
  ],
  flavorText: 'Guardian of eternal flames.',
  flavorTextTw: '永恆火焰的守護者，燃燒的熱情倍增火之力量。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Bul-gae.jpg',
}

export const FIREBLAST: CardTemplate = {
  id: 'DLC_F004',
  name: 'Fireblast',
  nameTw: '火焰爆發',
  element: Element.FIRE,
  cost: 3,
  baseScore: 3,
  effects: [
    {
      type: EffectType.OPPONENT_DISCARD,
      trigger: EffectTrigger.ON_TAME,
      value: 1,
      description: 'When tamed: All opponents discard 1 card from hand.',
      descriptionTw: '馴服時：所有對手從手牌棄掉1張卡。',
    },
  ],
  flavorText: 'Burning chaos engulfs all.',
  flavorTextTw: '熾烈的爆炸吞噬一切，迫使敵人棄械投降。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Fireblast.jpg',
}

export const HEPHAESTUS: CardTemplate = {
  id: 'DLC_F005',
  name: 'Hephaestus',
  nameTw: '赫菲斯托斯',
  element: Element.FIRE,
  cost: 4,
  baseScore: 3,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [{ type: StoneType.FIRE, amount: 1 }],
      description: 'When tamed: Earn 1 fire stone.',
      descriptionTw: '馴服時：獲得1顆火石。',
    },
    {
      type: EffectType.DECREASE_COST,
      trigger: EffectTrigger.PERMANENT,
      targetElement: Element.FIRE,
      value: 1,
      description: 'Permanent: Your fire cards cost 1 stone less (minimum 1 stone).',
      descriptionTw: '永久：你的火卡費用減少1顆石頭（最低1顆）。',
    },
  ],
  flavorText: 'Master craftsman of divine forge.',
  flavorTextTw: '神聖鍛造之神，精湛的技藝減輕火焰的負擔。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Hephaestus.jpg',
}

export const BELPHEGOR: CardTemplate = {
  id: 'DLC_F006',
  name: 'Belphegor',
  nameTw: '貝爾芬格',
  element: Element.FIRE,
  cost: 4,
  baseScore: 4,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [{ type: StoneType.FIRE, amount: 1 }],
      description: 'When tamed: Earn 1 fire stone.',
      descriptionTw: '馴服時：獲得1顆火石。',
    },
    {
      type: EffectType.REDUCE_COST,
      trigger: EffectTrigger.PERMANENT,
      targetElement: Element.FIRE,
      value: 1,
      description: 'Permanent: Your fire cards cost fixed 1 stone.',
      descriptionTw: '永久：你的火卡固定費用為1顆石頭。',
    },
  ],
  flavorText: 'Prince of sloth and innovation.',
  flavorTextTw: '懶惰與創新的王子，以最省力的方式掌握火焰。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Belphegor.jpg',
}

export const PYRO: CardTemplate = {
  id: 'DLC_D005',
  name: 'Pyro',
  nameTw: '烈焰',
  element: Element.DRAGON,
  cost: 7,
  baseScore: 7,
  effects: [
    {
      type: EffectType.MULTI_CHOICE,
      trigger: EffectTrigger.ON_TAME,
      description:
        'When tamed: A player of your choice loses all their summoned cards with this card.',
      descriptionTw: '馴服時：選擇1位玩家，該玩家失去所有已馴服的卡片。',
    },
  ],
  flavorText: 'Inferno that devours worlds.',
  flavorTextTw: '吞噬世界的地獄烈焰，焚毀一切阻礙。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Pyro.jpg',
}

// ============================================
// WATER ELEMENT DLC CARDS (6 cards)
// ============================================

export const AKHLUT: CardTemplate = {
  id: 'DLC_W001',
  name: 'Akhlut',
  nameTw: '阿克魯特',
  element: Element.WATER,
  cost: 1,
  baseScore: 1,
  effects: [
    {
      type: EffectType.DRAW_CARD,
      trigger: EffectTrigger.ON_TAME,
      value: 1,
      description: 'When tamed: Draw 1 card.',
      descriptionTw: '馴服時：抽1張卡。',
    },
  ],
  flavorText: 'Hybrid of wolf and orca.',
  flavorTextTw: '狼與虎鯨的混合體，帶來知識的流動。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Akhlut.jpg',
}

export const MELUSINE: CardTemplate = {
  id: 'DLC_W002',
  name: 'Melusine',
  nameTw: '梅呂辛',
  element: Element.WATER,
  cost: 2,
  baseScore: 2,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [{ type: StoneType.WATER, amount: 1 }],
      description: 'When tamed: Earn 1 water stone.',
      descriptionTw: '馴服時：獲得1顆水石。',
    },
  ],
  flavorText: 'Water spirit of ancient springs.',
  flavorTextTw: '古老泉源的水之精靈，賜予純淨的力量。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Melusine.jpg',
}

export const THALASSA: CardTemplate = {
  id: 'DLC_W003',
  name: 'Thalassa',
  nameTw: '塔拉薩',
  element: Element.WATER,
  cost: 3,
  baseScore: 3,
  effects: [
    {
      type: EffectType.PUT_ON_DECK_TOP,
      trigger: EffectTrigger.ON_TAME,
      description: 'When tamed: You may put 1 card from discard pile on top of your deck.',
      descriptionTw: '馴服時：你可以將棄牌堆的1張卡放到你的牌庫頂。',
    },
  ],
  flavorText: 'Primordial sea goddess.',
  flavorTextTw: '原始海洋女神，掌控潮汐與回溯之力。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Thalassa.jpg',
}

export const SIREN: CardTemplate = {
  id: 'DLC_W004',
  name: 'Siren',
  nameTw: '賽蓮',
  element: Element.WATER,
  cost: 4,
  baseScore: 3,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [{ type: StoneType.WATER, amount: 1 }],
      description: 'When tamed: Earn 1 water stone.',
      descriptionTw: '馴服時：獲得1顆水石。',
    },
    {
      type: EffectType.DRAW_CARD,
      trigger: EffectTrigger.PERMANENT,
      value: 1,
      description: 'Permanent: At start of each round, draw 1 card.',
      descriptionTw: '永久：每回合開始時，抽1張卡。',
    },
  ],
  flavorText: 'Enchanting song of the sea.',
  flavorTextTw: '迷人的海之歌聲，源源不絕的靈感湧現。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Siren.jpg',
}

export const KRAKEN: CardTemplate = {
  id: 'DLC_W005',
  name: 'Kraken',
  nameTw: '克拉肯',
  element: Element.WATER,
  cost: 5,
  baseScore: 5,
  effects: [
    {
      type: EffectType.EARN_PER_FAMILY,
      trigger: EffectTrigger.ON_TAME,
      description: 'When tamed: Choose 1 family. Earn 2pt per card of that family in your area.',
      descriptionTw: '馴服時：選擇1個家族。你的場上每有1張該家族的卡，獲得2分。',
    },
  ],
  flavorText: 'Leviathan of the abyss.',
  flavorTextTw: '深淵的利維坦，聚集同族的巨大力量。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Kraken.jpg',
}

export const TAWERET: CardTemplate = {
  id: 'DLC_W006',
  name: 'Taweret',
  nameTw: '塔沃瑞特',
  element: Element.WATER,
  cost: 6,
  baseScore: 5,
  effects: [
    {
      type: EffectType.PROTECTION,
      trigger: EffectTrigger.PERMANENT,
      description: 'Permanent: Your cards cannot be targeted by opponent effects.',
      descriptionTw: '永久：你的卡片不會被對手的效果指定。',
    },
  ],
  flavorText: 'Maternal protector of life.',
  flavorTextTw: '生命的慈母守護者，庇護萬物免於傷害。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Taweret.jpg',
}

export const DEEPDIVE: CardTemplate = {
  id: 'DLC_D006',
  name: 'Deepdive',
  nameTw: '深潛',
  element: Element.DRAGON,
  cost: 7,
  baseScore: 7,
  effects: [
    {
      type: EffectType.MULTI_CHOICE,
      trigger: EffectTrigger.ON_TAME,
      description: 'When tamed: A player of your choice swaps one of their summoned cards with this card.',
      descriptionTw: '馴服時：選擇1位玩家，該玩家的1張已馴服卡片與此卡交換。',
    },
  ],
  flavorText: 'Dragged into the depths.',
  flavorTextTw: '潛入深海的龍影，將獵物拖入無盡深淵。',
  imageUrl: '/the-vale-of-eternity/assets/dlc/Deepdive.jpg',
}


// ============================================
// EARTH ELEMENT DLC CARDS (6 cards)
// ============================================

export const ANUBIS: CardTemplate = {
  id: 'DLC_E001',
  name: 'Anubis',
  nameTw: '阿努比斯',
  element: Element.EARTH,
  cost: 1,
  baseScore: 0,
  effects: [
    {
      type: EffectType.RECOVER_CARD,
      trigger: EffectTrigger.ON_TAME,
      value: 1,
      description: 'When tamed: Recover 1 card from discard pile to hand.',
      descriptionTw: '馴服時：從棄牌堆回收1張卡到手牌。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Anubis.jpg',
}

export const DUDURI: CardTemplate = {
  id: 'DLC_E002',
  name: 'Duduri',
  nameTw: '豆豆里',
  element: Element.EARTH,
  cost: 2,
  baseScore: 2,
  effects: [
    {
      type: EffectType.CONDITIONAL_AREA,
      trigger: EffectTrigger.ON_SCORE,
      description: 'Scoring: Earn 5pt if you have exactly 3 Duduri cards.',
      descriptionTw: '計分時：如果你剛好有3張豆豆里卡，獲得5分。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Duduri.jpg',
}

export const MANDRAKE: CardTemplate = {
  id: 'DLC_E003',
  name: 'Mandrake',
  nameTw: '曼德拉草',
  element: Element.EARTH,
  cost: 3,
  baseScore: 2,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [{ type: StoneType.EARTH, amount: 1 }],
      description: 'When tamed: Earn 1 earth stone. Count as 2 earth cards for scoring.',
      descriptionTw: '馴服時：獲得1顆地石。計分時算作2張地卡。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Mandrake.jpg',
}

export const TOTEM_POLE: CardTemplate = {
  id: 'DLC_E004',
  name: 'Totem Pole',
  nameTw: '圖騰柱',
  element: Element.EARTH,
  cost: 4,
  baseScore: 4,
  effects: [
    {
      type: EffectType.EARN_PER_ELEMENT,
      trigger: EffectTrigger.ON_TAME,
      targetElement: Element.EARTH,
      description: 'When tamed: Earn 1pt per earth card in your area.',
      descriptionTw: '馴服時：你的場上每有1張地卡，獲得1分。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Totempole.jpg',
}

export const WENDIGO: CardTemplate = {
  id: 'DLC_E005',
  name: 'Wendigo',
  nameTw: '溫迪哥',
  element: Element.EARTH,
  cost: 5,
  baseScore: 3,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [{ type: StoneType.EARTH, amount: 2 }],
      description: 'When tamed: Earn 2 earth stones.',
      descriptionTw: '馴服時：獲得2顆地石。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Wendigo.jpg',
}

export const DUDURI_KING: CardTemplate = {
  id: 'DLC_E006',
  name: 'Duduri King',
  nameTw: '豆豆里王',
  element: Element.EARTH,
  cost: 6,
  baseScore: 6,
  effects: [
    {
      type: EffectType.CONDITIONAL_AREA,
      trigger: EffectTrigger.ON_SCORE,
      description: 'Scoring: Earn 10pt if you have at least 1 other Duduri card.',
      descriptionTw: '計分時：如果你有至少1張其他豆豆里卡，獲得10分。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Duduriking.jpg',
}


// ============================================
// WIND ELEMENT DLC CARDS (4 cards)
// ============================================

export const ANZU: CardTemplate = {
  id: 'DLC_Wi001',
  name: 'Anzu',
  nameTw: '安祖鳥',
  element: Element.WIND,
  cost: 3,
  baseScore: 2,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [{ type: StoneType.WIND, amount: 1 }],
      description: 'When tamed: Earn 1 wind stone. Count as 2 wind cards for scoring.',
      descriptionTw: '馴服時：獲得1顆風石。計分時算作2張風卡。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Anzu.jpg',
}

export const NURIKABE: CardTemplate = {
  id: 'DLC_Wi002',
  name: 'Nurikabe',
  nameTw: '塗壁',
  element: Element.WIND,
  cost: 4,
  baseScore: 3,
  effects: [
    {
      type: EffectType.PROTECTION,
      trigger: EffectTrigger.PERMANENT,
      description: 'Permanent: Opponents cannot discard cards from your hand.',
      descriptionTw: '永久：對手無法棄掉你手牌中的卡。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Nurikabe.jpg',
}

export const RUKH: CardTemplate = {
  id: 'DLC_Wi003',
  name: 'Rukh',
  nameTw: '洛克鳥',
  element: Element.WIND,
  cost: 5,
  baseScore: 4,
  effects: [
    {
      type: EffectType.DRAW_CARD,
      trigger: EffectTrigger.ON_TAME,
      value: 2,
      description: 'When tamed: Draw 2 cards.',
      descriptionTw: '馴服時：抽2張卡。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Rukh.jpg',
}

export const BANSHEE: CardTemplate = {
  id: 'DLC_Wi004',
  name: 'Banshee',
  nameTw: '女妖',
  element: Element.WIND,
  cost: 6,
  baseScore: 5,
  effects: [
    {
      type: EffectType.OPPONENT_DISCARD,
      trigger: EffectTrigger.ON_TAME,
      value: 2,
      description: 'When tamed: All opponents discard 2 cards from hand.',
      descriptionTw: '馴服時：所有對手從手牌棄掉2張卡。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Banshee.jpg',
}

// ============================================
// DRAGON ELEMENT DLC CARDS (4 cards)
// ============================================

export const HORUS: CardTemplate = {
  id: 'DLC_Wi005',
  name: 'Horus',
  nameTw: '荷魯斯',
  element: Element.WIND,
  cost: 7,
  baseScore: 7,
  effects: [
    {
      type: EffectType.COPY_INSTANT_EFFECT,
      trigger: EffectTrigger.ON_TAME,
      description: 'When tamed: Summon a card for free and earn (cost written on the card).',
      descriptionTw: '馴服時：免費召喚1張卡片並獲得（該卡上的費用）分。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Horus.jpg',
}

export const LOKI: CardTemplate = {
  id: 'DLC_Wi006',
  name: 'Loki',
  nameTw: '洛基',
  element: Element.WIND,
  cost: 7,
  baseScore: 7,
  effects: [
    {
      type: EffectType.MULTI_CHOICE,
      trigger: EffectTrigger.PERMANENT,
      description:
        'You can treat this card as if it were of any family during your turn. Earn (1) for each card with (permanent).',
      descriptionTw: '你可以將此卡視為任何家族。每張永久符號卡獲得(1)分。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Loki.jpg',
}

export const ROCKSCALE: CardTemplate = {
  id: 'DLC_D003',
  name: 'Rockscale',
  nameTw: '岩鱗龍',
  element: Element.DRAGON,
  cost: 8,
  baseScore: 6,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [
        { type: StoneType.FIRE, amount: 1 },
        { type: StoneType.WATER, amount: 1 },
        { type: StoneType.EARTH, amount: 1 },
        { type: StoneType.WIND, amount: 1 },
      ],
      description:
        'When tamed: Earn 1 stone of each element (fire, water, earth, wind). Dragon swap: Exchange with sheltered card.',
      descriptionTw: '馴服時：獲得各1顆元素石（火、水、地、風）。龍交換：與庇護區卡片交換。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Rockscale.jpg',
}

export const WHISPER: CardTemplate = {
  id: 'DLC_D004',
  name: 'Whisper',
  nameTw: '低語',
  element: Element.DRAGON,
  cost: 10,
  baseScore: 8,
  effects: [
    {
      type: EffectType.ACTIVATE_ALL_PERMANENT,
      trigger: EffectTrigger.ON_TAME,
      description:
        'When tamed: Activate all permanent effects of cards in your area. Dragon swap: Exchange with sheltered card.',
      descriptionTw: '馴服時：啟動你場上所有卡的永久效果。龍交換：與庇護區卡片交換。',
    },
  ],
  imageUrl: '/the-vale-of-eternity/assets/dlc/Whisper.jpg',
}

// ============================================
// COLLECTIONS
// ============================================

/**
 * All DLC cards indexed by ID
 */
export const DLC_CARDS_BY_ID: Record<string, CardTemplate> = {
  // Fire
  [ASH.id]: ASH,
  [FIRE_RAT.id]: FIRE_RAT,
  [BUL_GAE.id]: BUL_GAE,
  [FIREBLAST.id]: FIREBLAST,
  [HEPHAESTUS.id]: HEPHAESTUS,
  [BELPHEGOR.id]: BELPHEGOR,

  // Water
  [AKHLUT.id]: AKHLUT,
  [MELUSINE.id]: MELUSINE,
  [THALASSA.id]: THALASSA,
  [SIREN.id]: SIREN,
  [KRAKEN.id]: KRAKEN,
  [TAWERET.id]: TAWERET,

  // Earth
  [ANUBIS.id]: ANUBIS,
  [DUDURI.id]: DUDURI,
  [MANDRAKE.id]: MANDRAKE,
  [TOTEM_POLE.id]: TOTEM_POLE,
  [WENDIGO.id]: WENDIGO,
  [DUDURI_KING.id]: DUDURI_KING,

  // Wind
  [ANZU.id]: ANZU,
  [NURIKABE.id]: NURIKABE,
  [RUKH.id]: RUKH,
  [BANSHEE.id]: BANSHEE,
  [HORUS.id]: HORUS,
  [LOKI.id]: LOKI,

  // Dragon
  [PYRO.id]: PYRO,
  [DEEPDIVE.id]: DEEPDIVE,
  [ROCKSCALE.id]: ROCKSCALE,
  [WHISPER.id]: WHISPER,
}

/**
 * All DLC cards as an array
 */
export const ALL_DLC_CARDS: CardTemplate[] = Object.values(DLC_CARDS_BY_ID)

/**
 * DLC cards by element
 */
export const DLC_FIRE_CARDS: CardTemplate[] = [
  ASH,
  FIRE_RAT,
  BUL_GAE,
  FIREBLAST,
  HEPHAESTUS,
  BELPHEGOR,
]
export const DLC_WATER_CARDS: CardTemplate[] = [
  AKHLUT,
  MELUSINE,
  THALASSA,
  SIREN,
  KRAKEN,
  TAWERET,
]
export const DLC_EARTH_CARDS: CardTemplate[] = [
  ANUBIS,
  DUDURI,
  MANDRAKE,
  TOTEM_POLE,
  WENDIGO,
  DUDURI_KING,
]
export const DLC_WIND_CARDS: CardTemplate[] = [ANZU, NURIKABE, RUKH, BANSHEE, HORUS, LOKI]
export const DLC_DRAGON_CARDS: CardTemplate[] = [PYRO, DEEPDIVE, ROCKSCALE, WHISPER]

export default {
  DLC_CARDS_BY_ID,
  ALL_DLC_CARDS,
  DLC_FIRE_CARDS,
  DLC_WATER_CARDS,
  DLC_EARTH_CARDS,
  DLC_WIND_CARDS,
  DLC_DRAGON_CARDS,
}
