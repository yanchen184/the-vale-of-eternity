# 卡片資料規格書

> **The Vale of Eternity - 永恆之谷**
> 版本：MVP 1.0
> 最後更新：2024-12-30

---

## 1. 卡片資料結構

### 1.1 卡片模板 (CardTemplate)

卡片模板定義卡片的基本屬性，作為建立卡片實例的藍本。

```typescript
interface CardTemplate {
  // === 識別資訊 ===
  id: string;               // 唯一識別碼 (如 'F001')
  name: string;             // 英文名稱
  nameTw: string;           // 繁體中文名稱

  // === 基本屬性 ===
  element: Element;         // 所屬元素
  cost: number;             // 卡片費用 (0-6)
  baseScore: number;        // 基礎分數

  // === 效果屬性 ===
  effectType: EffectType;   // 效果類型
  effectTrigger: EffectTrigger;  // 觸發時機
  effectValue?: number;     // 效果數值
  effectTarget?: Element | 'DRAGON';  // 效果目標

  // === 描述文字 ===
  effectDescription: string;     // 效果說明 (英文)
  effectDescriptionTw: string;   // 效果說明 (中文)
  flavorText?: string;           // 風味文字 (英文)
  flavorTextTw?: string;         // 風味文字 (中文)

  // === 視覺資源 ===
  imageUrl?: string;        // 卡片圖片 URL
  iconUrl?: string;         // 圖示 URL
}
```

### 1.2 元素類型 (Element)

```typescript
enum Element {
  FIRE = 'FIRE',       // 火
  WATER = 'WATER',     // 水
  EARTH = 'EARTH',     // 土
  WIND = 'WIND',       // 風 (Air)
  DRAGON = 'DRAGON',   // 龍
}
```

### 1.3 效果類型 (EffectType)

```typescript
enum EffectType {
  // 無效果
  NONE = 'NONE',

  // 即時效果 (馴服時觸發一次)
  GAIN_STONES = 'GAIN_STONES',              // 獲得石頭
  DRAW_FROM_DISCARD = 'DRAW_FROM_DISCARD',  // 從棄牌堆抽牌

  // 永久效果 (持續生效)
  INCREASE_STONE_LIMIT = 'INCREASE_STONE_LIMIT',  // 增加石頭上限

  // 計分效果 (結算時計算)
  SCORE_PER_ELEMENT = 'SCORE_PER_ELEMENT',  // 每張指定元素卡加分
  SCORE_PER_DRAGON = 'SCORE_PER_DRAGON',    // 每張龍卡加分
}
```

### 1.4 觸發時機 (EffectTrigger)

```typescript
enum EffectTrigger {
  NONE = 'NONE',           // 無觸發
  ON_TAME = 'ON_TAME',     // 馴服時
  PERMANENT = 'PERMANENT', // 永久生效
  ON_SCORE = 'ON_SCORE',   // 計分時
}
```

---

## 2. MVP 卡片完整資料 (20 張)

### 2.1 火家族 (Fire) - 4 張

#### F001 - Hestia 赫斯提亞

| 屬性 | 值 |
|------|-----|
| ID | `F001` |
| 名稱 | Hestia / 赫斯提亞 |
| 元素 | FIRE |
| 費用 | 0 |
| 基礎分數 | 0 |
| 效果類型 | INCREASE_STONE_LIMIT |
| 觸發時機 | PERMANENT |
| 效果數值 | 2 |
| 效果說明 | 石頭上限 +2 |

```typescript
{
  id: 'F001',
  name: 'Hestia',
  nameTw: '赫斯提亞',
  element: Element.FIRE,
  cost: 0,
  baseScore: 0,
  effectType: EffectType.INCREASE_STONE_LIMIT,
  effectTrigger: EffectTrigger.PERMANENT,
  effectValue: 2,
  effectDescription: 'Your stone limit increases by 2.',
  effectDescriptionTw: '你的石頭上限增加 2。',
  flavorTextTw: '家與爐火的守護者，賜予你更多承載力量的空間。',
}
```

#### F002 - Imp 小惡魔

| 屬性 | 值 |
|------|-----|
| ID | `F002` |
| 名稱 | Imp / 小惡魔 |
| 元素 | FIRE |
| 費用 | 1 |
| 基礎分數 | 2 |
| 效果類型 | NONE |
| 效果說明 | - |

```typescript
{
  id: 'F002',
  name: 'Imp',
  nameTw: '小惡魔',
  element: Element.FIRE,
  cost: 1,
  baseScore: 2,
  effectType: EffectType.NONE,
  effectTrigger: EffectTrigger.NONE,
  effectDescription: '',
  effectDescriptionTw: '',
  flavorTextTw: '頑皮的火焰精靈，雖然弱小但忠誠。',
}
```

#### F003 - Firefox 火狐

| 屬性 | 值 |
|------|-----|
| ID | `F003` |
| 名稱 | Firefox / 火狐 |
| 元素 | FIRE |
| 費用 | 2 |
| 基礎分數 | 3 |
| 效果類型 | SCORE_PER_ELEMENT |
| 觸發時機 | ON_SCORE |
| 效果數值 | 1 |
| 效果目標 | FIRE |
| 效果說明 | 每張火卡 +1 分 |

```typescript
{
  id: 'F003',
  name: 'Firefox',
  nameTw: '火狐',
  element: Element.FIRE,
  cost: 2,
  baseScore: 3,
  effectType: EffectType.SCORE_PER_ELEMENT,
  effectTrigger: EffectTrigger.ON_SCORE,
  effectValue: 1,
  effectTarget: Element.FIRE,
  effectDescription: 'Score +1 for each Fire card you have.',
  effectDescriptionTw: '你的每張火卡額外 +1 分。',
  flavorTextTw: '九尾之火在夜空中閃耀，照亮同族的榮光。',
}
```

#### F004 - Salamander 火蜥蜴

| 屬性 | 值 |
|------|-----|
| ID | `F004` |
| 名稱 | Salamander / 火蜥蜴 |
| 元素 | FIRE |
| 費用 | 3 |
| 基礎分數 | 4 |
| 效果類型 | GAIN_STONES |
| 觸發時機 | ON_TAME |
| 效果數值 | 2 |
| 效果說明 | 馴服時獲得 2 顆石頭 |

```typescript
{
  id: 'F004',
  name: 'Salamander',
  nameTw: '火蜥蜴',
  element: Element.FIRE,
  cost: 3,
  baseScore: 4,
  effectType: EffectType.GAIN_STONES,
  effectTrigger: EffectTrigger.ON_TAME,
  effectValue: 2,
  effectDescription: 'When tamed, gain 2 stones.',
  effectDescriptionTw: '馴服時，獲得 2 顆石頭。',
  flavorTextTw: '火焰的化身，將熾熱轉化為可用的能量。',
}
```

---

### 2.2 水家族 (Water) - 4 張

#### W001 - Kappa 河童

| 屬性 | 值 |
|------|-----|
| ID | `W001` |
| 名稱 | Kappa / 河童 |
| 元素 | WATER |
| 費用 | 1 |
| 基礎分數 | 2 |
| 效果類型 | NONE |
| 效果說明 | - |

```typescript
{
  id: 'W001',
  name: 'Kappa',
  nameTw: '河童',
  element: Element.WATER,
  cost: 1,
  baseScore: 2,
  effectType: EffectType.NONE,
  effectTrigger: EffectTrigger.NONE,
  effectDescription: '',
  effectDescriptionTw: '',
  flavorTextTw: '棲息於河川的古老妖怪，頭頂之水是力量的泉源。',
}
```

#### W002 - Yuki Onna 雪女

| 屬性 | 值 |
|------|-----|
| ID | `W002` |
| 名稱 | Yuki Onna / 雪女 |
| 元素 | WATER |
| 費用 | 2 |
| 基礎分數 | 3 |
| 效果類型 | SCORE_PER_ELEMENT |
| 觸發時機 | ON_SCORE |
| 效果數值 | 1 |
| 效果目標 | WATER |
| 效果說明 | 每張水卡 +1 分 |

```typescript
{
  id: 'W002',
  name: 'Yuki Onna',
  nameTw: '雪女',
  element: Element.WATER,
  cost: 2,
  baseScore: 3,
  effectType: EffectType.SCORE_PER_ELEMENT,
  effectTrigger: EffectTrigger.ON_SCORE,
  effectValue: 1,
  effectTarget: Element.WATER,
  effectDescription: 'Score +1 for each Water card you have.',
  effectDescriptionTw: '你的每張水卡額外 +1 分。',
  flavorTextTw: '冰雪之中的幽靈美人，寒風中凝聚同類的力量。',
}
```

#### W003 - Undine 水精靈

| 屬性 | 值 |
|------|-----|
| ID | `W003` |
| 名稱 | Undine / 水精靈 |
| 元素 | WATER |
| 費用 | 3 |
| 基礎分數 | 5 |
| 效果類型 | NONE |
| 效果說明 | - |

```typescript
{
  id: 'W003',
  name: 'Undine',
  nameTw: '水精靈',
  element: Element.WATER,
  cost: 3,
  baseScore: 5,
  effectType: EffectType.NONE,
  effectTrigger: EffectTrigger.NONE,
  effectDescription: '',
  effectDescriptionTw: '',
  flavorTextTw: '水的化身，流動的優雅蘊含著純淨的力量。',
}
```

#### W004 - Sea Spirit 海之靈

| 屬性 | 值 |
|------|-----|
| ID | `W004` |
| 名稱 | Sea Spirit / 海之靈 |
| 元素 | WATER |
| 費用 | 4 |
| 基礎分數 | 4 |
| 效果類型 | DRAW_FROM_DISCARD |
| 觸發時機 | ON_TAME |
| 效果數值 | 1 |
| 效果說明 | 馴服時從棄牌堆抽 1 張牌 |

```typescript
{
  id: 'W004',
  name: 'Sea Spirit',
  nameTw: '海之靈',
  element: Element.WATER,
  cost: 4,
  baseScore: 4,
  effectType: EffectType.DRAW_FROM_DISCARD,
  effectTrigger: EffectTrigger.ON_TAME,
  effectValue: 1,
  effectDescription: 'When tamed, draw 1 card from the discard pile.',
  effectDescriptionTw: '馴服時，從棄牌堆抽取 1 張卡片加入手牌。',
  flavorTextTw: '深海的記憶守護者，能喚回被遺忘的力量。',
}
```

---

### 2.3 土家族 (Earth) - 4 張

#### E001 - Young Forest Spirit 幼年森靈

| 屬性 | 值 |
|------|-----|
| ID | `E001` |
| 名稱 | Young Forest Spirit / 幼年森靈 |
| 元素 | EARTH |
| 費用 | 0 |
| 基礎分數 | 1 |
| 效果類型 | NONE |
| 效果說明 | - |

```typescript
{
  id: 'E001',
  name: 'Young Forest Spirit',
  nameTw: '幼年森靈',
  element: Element.EARTH,
  cost: 0,
  baseScore: 1,
  effectType: EffectType.NONE,
  effectTrigger: EffectTrigger.NONE,
  effectDescription: '',
  effectDescriptionTw: '',
  flavorTextTw: '剛從古樹中誕生的精靈，帶著森林的祝福。',
}
```

#### E002 - Goblin 哥布林

| 屬性 | 值 |
|------|-----|
| ID | `E002` |
| 名稱 | Goblin / 哥布林 |
| 元素 | EARTH |
| 費用 | 1 |
| 基礎分數 | 2 |
| 效果類型 | NONE |
| 效果說明 | - |

```typescript
{
  id: 'E002',
  name: 'Goblin',
  nameTw: '哥布林',
  element: Element.EARTH,
  cost: 1,
  baseScore: 2,
  effectType: EffectType.NONE,
  effectTrigger: EffectTrigger.NONE,
  effectDescription: '',
  effectDescriptionTw: '',
  flavorTextTw: '洞穴中的小矮人，貪婪但意外地好用。',
}
```

#### E003 - Forest Spirit 森林精靈

| 屬性 | 值 |
|------|-----|
| ID | `E003` |
| 名稱 | Forest Spirit / 森林精靈 |
| 元素 | EARTH |
| 費用 | 3 |
| 基礎分數 | 4 |
| 效果類型 | SCORE_PER_ELEMENT |
| 觸發時機 | ON_SCORE |
| 效果數值 | 1 |
| 效果目標 | EARTH |
| 效果說明 | 每張土卡 +1 分 |

```typescript
{
  id: 'E003',
  name: 'Forest Spirit',
  nameTw: '森林精靈',
  element: Element.EARTH,
  cost: 3,
  baseScore: 4,
  effectType: EffectType.SCORE_PER_ELEMENT,
  effectTrigger: EffectTrigger.ON_SCORE,
  effectValue: 1,
  effectTarget: Element.EARTH,
  effectDescription: 'Score +1 for each Earth card you have.',
  effectDescriptionTw: '你的每張土卡額外 +1 分。',
  flavorTextTw: '古老森林的守護者，與大地共鳴。',
}
```

#### E004 - Gargoyle 石像鬼

| 屬性 | 值 |
|------|-----|
| ID | `E004` |
| 名稱 | Gargoyle / 石像鬼 |
| 元素 | EARTH |
| 費用 | 4 |
| 基礎分數 | 6 |
| 效果類型 | NONE |
| 效果說明 | - |

```typescript
{
  id: 'E004',
  name: 'Gargoyle',
  nameTw: '石像鬼',
  element: Element.EARTH,
  cost: 4,
  baseScore: 6,
  effectType: EffectType.NONE,
  effectTrigger: EffectTrigger.NONE,
  effectDescription: '',
  effectDescriptionTw: '',
  flavorTextTw: '沉睡於古堡的石獸，覺醒時堅不可摧。',
}
```

---

### 2.4 風家族 (Wind/Air) - 4 張

#### A001 - Harpy 鷹身女妖

| 屬性 | 值 |
|------|-----|
| ID | `A001` |
| 名稱 | Harpy / 鷹身女妖 |
| 元素 | WIND |
| 費用 | 1 |
| 基礎分數 | 2 |
| 效果類型 | NONE |
| 效果說明 | - |

```typescript
{
  id: 'A001',
  name: 'Harpy',
  nameTw: '鷹身女妖',
  element: Element.WIND,
  cost: 1,
  baseScore: 2,
  effectType: EffectType.NONE,
  effectTrigger: EffectTrigger.NONE,
  effectDescription: '',
  effectDescriptionTw: '',
  flavorTextTw: '風暴中的掠食者，尖銳的叫聲劃破天際。',
}
```

#### A002 - Pegasus 飛馬

| 屬性 | 值 |
|------|-----|
| ID | `A002` |
| 名稱 | Pegasus / 飛馬 |
| 元素 | WIND |
| 費用 | 2 |
| 基礎分數 | 3 |
| 效果類型 | GAIN_STONES |
| 觸發時機 | ON_TAME |
| 效果數值 | 1 |
| 效果說明 | 馴服時獲得 1 顆石頭 |

```typescript
{
  id: 'A002',
  name: 'Pegasus',
  nameTw: '飛馬',
  element: Element.WIND,
  cost: 2,
  baseScore: 3,
  effectType: EffectType.GAIN_STONES,
  effectTrigger: EffectTrigger.ON_TAME,
  effectValue: 1,
  effectDescription: 'When tamed, gain 1 stone.',
  effectDescriptionTw: '馴服時，獲得 1 顆石頭。',
  flavorTextTw: '翱翔於雲端的神駒，帶來天界的饋贈。',
}
```

#### A003 - Sylph 風精靈

| 屬性 | 值 |
|------|-----|
| ID | `A003` |
| 名稱 | Sylph / 風精靈 |
| 元素 | WIND |
| 費用 | 3 |
| 基礎分數 | 4 |
| 效果類型 | SCORE_PER_ELEMENT |
| 觸發時機 | ON_SCORE |
| 效果數值 | 1 |
| 效果目標 | WIND |
| 效果說明 | 每張風卡 +1 分 |

```typescript
{
  id: 'A003',
  name: 'Sylph',
  nameTw: '風精靈',
  element: Element.WIND,
  cost: 3,
  baseScore: 4,
  effectType: EffectType.SCORE_PER_ELEMENT,
  effectTrigger: EffectTrigger.ON_SCORE,
  effectValue: 1,
  effectTarget: Element.WIND,
  effectDescription: 'Score +1 for each Wind card you have.',
  effectDescriptionTw: '你的每張風卡額外 +1 分。',
  flavorTextTw: '微風中的舞者，聚集同伴的力量。',
}
```

#### A004 - Tengu 天狗

| 屬性 | 值 |
|------|-----|
| ID | `A004` |
| 名稱 | Tengu / 天狗 |
| 元素 | WIND |
| 費用 | 4 |
| 基礎分數 | 5 |
| 效果類型 | NONE |
| 效果說明 | - |

```typescript
{
  id: 'A004',
  name: 'Tengu',
  nameTw: '天狗',
  element: Element.WIND,
  cost: 4,
  baseScore: 5,
  effectType: EffectType.NONE,
  effectTrigger: EffectTrigger.NONE,
  effectDescription: '',
  effectDescriptionTw: '',
  flavorTextTw: '山間的長鼻妖怪，操控風的大師。',
}
```

---

### 2.5 龍家族 (Dragon) - 4 張

#### D001 - Dragon Egg 龍蛋

| 屬性 | 值 |
|------|-----|
| ID | `D001` |
| 名稱 | Dragon Egg / 龍蛋 |
| 元素 | DRAGON |
| 費用 | 0 |
| 基礎分數 | 0 |
| 效果類型 | SCORE_PER_DRAGON |
| 觸發時機 | ON_SCORE |
| 效果數值 | 2 |
| 效果說明 | 每張龍卡 +2 分 |

```typescript
{
  id: 'D001',
  name: 'Dragon Egg',
  nameTw: '龍蛋',
  element: Element.DRAGON,
  cost: 0,
  baseScore: 0,
  effectType: EffectType.SCORE_PER_DRAGON,
  effectTrigger: EffectTrigger.ON_SCORE,
  effectValue: 2,
  effectDescription: 'Score +2 for each Dragon card you have.',
  effectDescriptionTw: '你的每張龍卡額外 +2 分。',
  flavorTextTw: '蘊含無限可能的神秘之卵，與龍族共鳴。',
}
```

#### D002 - Ember 熾焰龍

| 屬性 | 值 |
|------|-----|
| ID | `D002` |
| 名稱 | Ember / 熾焰龍 |
| 元素 | DRAGON |
| 費用 | 4 |
| 基礎分數 | 5 |
| 效果類型 | SCORE_PER_ELEMENT |
| 觸發時機 | ON_SCORE |
| 效果數值 | 2 |
| 效果目標 | FIRE |
| 效果說明 | 每張火卡 +2 分 |

```typescript
{
  id: 'D002',
  name: 'Ember',
  nameTw: '熾焰龍',
  element: Element.DRAGON,
  cost: 4,
  baseScore: 5,
  effectType: EffectType.SCORE_PER_ELEMENT,
  effectTrigger: EffectTrigger.ON_SCORE,
  effectValue: 2,
  effectTarget: Element.FIRE,
  effectDescription: 'Score +2 for each Fire card you have.',
  effectDescriptionTw: '你的每張火卡額外 +2 分。',
  flavorTextTw: '烈焰之心的幼龍，與火焰生物心意相通。',
}
```

#### D003 - Tidal 潮汐龍

| 屬性 | 值 |
|------|-----|
| ID | `D003` |
| 名稱 | Tidal / 潮汐龍 |
| 元素 | DRAGON |
| 費用 | 4 |
| 基礎分數 | 5 |
| 效果類型 | SCORE_PER_ELEMENT |
| 觸發時機 | ON_SCORE |
| 效果數值 | 2 |
| 效果目標 | WATER |
| 效果說明 | 每張水卡 +2 分 |

```typescript
{
  id: 'D003',
  name: 'Tidal',
  nameTw: '潮汐龍',
  element: Element.DRAGON,
  cost: 4,
  baseScore: 5,
  effectType: EffectType.SCORE_PER_ELEMENT,
  effectTrigger: EffectTrigger.ON_SCORE,
  effectValue: 2,
  effectTarget: Element.WATER,
  effectDescription: 'Score +2 for each Water card you have.',
  effectDescriptionTw: '你的每張水卡額外 +2 分。',
  flavorTextTw: '統領海洋的幼龍，與水之生物同調。',
}
```

#### D004 - Boulder 磐石龍

| 屬性 | 值 |
|------|-----|
| ID | `D004` |
| 名稱 | Boulder / 磐石龍 |
| 元素 | DRAGON |
| 費用 | 5 |
| 基礎分數 | 7 |
| 效果類型 | NONE |
| 效果說明 | - |

```typescript
{
  id: 'D004',
  name: 'Boulder',
  nameTw: '磐石龍',
  element: Element.DRAGON,
  cost: 5,
  baseScore: 7,
  effectType: EffectType.NONE,
  effectTrigger: EffectTrigger.NONE,
  effectDescription: '',
  effectDescriptionTw: '',
  flavorTextTw: '山脈的守護者，堅如磐石的巨龍。',
}
```

---

## 3. 卡片資料匯總表

### 3.1 完整卡片列表

| ID | 名稱 | 元素 | 費用 | 分數 | 效果類型 | 效果 |
|----|------|------|------|------|----------|------|
| F001 | Hestia | FIRE | 0 | 0 | INCREASE_STONE_LIMIT | +2 上限 |
| F002 | Imp | FIRE | 1 | 2 | NONE | - |
| F003 | Firefox | FIRE | 2 | 3 | SCORE_PER_ELEMENT | 火卡+1 |
| F004 | Salamander | FIRE | 3 | 4 | GAIN_STONES | +2 石頭 |
| W001 | Kappa | WATER | 1 | 2 | NONE | - |
| W002 | Yuki Onna | WATER | 2 | 3 | SCORE_PER_ELEMENT | 水卡+1 |
| W003 | Undine | WATER | 3 | 5 | NONE | - |
| W004 | Sea Spirit | WATER | 4 | 4 | DRAW_FROM_DISCARD | 抽1張 |
| E001 | Young Forest Spirit | EARTH | 0 | 1 | NONE | - |
| E002 | Goblin | EARTH | 1 | 2 | NONE | - |
| E003 | Forest Spirit | EARTH | 3 | 4 | SCORE_PER_ELEMENT | 土卡+1 |
| E004 | Gargoyle | EARTH | 4 | 6 | NONE | - |
| A001 | Harpy | WIND | 1 | 2 | NONE | - |
| A002 | Pegasus | WIND | 2 | 3 | GAIN_STONES | +1 石頭 |
| A003 | Sylph | WIND | 3 | 4 | SCORE_PER_ELEMENT | 風卡+1 |
| A004 | Tengu | WIND | 4 | 5 | NONE | - |
| D001 | Dragon Egg | DRAGON | 0 | 0 | SCORE_PER_DRAGON | 龍卡+2 |
| D002 | Ember | DRAGON | 4 | 5 | SCORE_PER_ELEMENT | 火卡+2 |
| D003 | Tidal | DRAGON | 4 | 5 | SCORE_PER_ELEMENT | 水卡+2 |
| D004 | Boulder | DRAGON | 5 | 7 | NONE | - |

### 3.2 按元素分布

| 元素 | 卡片數 | 費用範圍 | 分數範圍 |
|------|--------|----------|----------|
| FIRE | 4 | 0-3 | 0-4 |
| WATER | 4 | 1-4 | 2-5 |
| EARTH | 4 | 0-4 | 1-6 |
| WIND | 4 | 1-4 | 2-5 |
| DRAGON | 4 | 0-5 | 0-7 |

### 3.3 按效果類型分布

| 效果類型 | 卡片數 | 卡片 |
|----------|--------|------|
| NONE | 9 | F002, W001, W003, E001, E002, E004, A001, A004, D004 |
| GAIN_STONES | 2 | F004 (+2), A002 (+1) |
| INCREASE_STONE_LIMIT | 1 | F001 (+2) |
| SCORE_PER_ELEMENT | 6 | F003, W002, E003, A003, D002, D003 |
| SCORE_PER_DRAGON | 1 | D001 |
| DRAW_FROM_DISCARD | 1 | W004 |

---

## 4. 效果系統設計

### 4.1 效果處理流程

```typescript
function processEffect(
  card: CardInstance,
  trigger: EffectTrigger,
  state: MVPGameState,
  playerIndex: 0 | 1
): EffectResult {
  // 檢查觸發時機是否匹配
  if (card.effectTrigger !== trigger) {
    return { state, changes: [] };
  }

  const player = state.players[playerIndex];
  const changes: EffectChange[] = [];

  switch (card.effectType) {
    case EffectType.GAIN_STONES:
      const gained = Math.min(
        card.effectValue || 0,
        player.stoneLimit - player.stones
      );
      changes.push({ type: 'STONES', value: gained });
      break;

    case EffectType.INCREASE_STONE_LIMIT:
      changes.push({ type: 'STONE_LIMIT', value: card.effectValue || 0 });
      break;

    case EffectType.DRAW_FROM_DISCARD:
      if (state.discardPile.length > 0) {
        changes.push({ type: 'DRAW_DISCARD', value: 1 });
      }
      break;

    case EffectType.SCORE_PER_ELEMENT:
    case EffectType.SCORE_PER_DRAGON:
      // 這些在計分階段處理
      break;
  }

  return applyChanges(state, playerIndex, changes);
}
```

### 4.2 計分效果計算

```typescript
function calculateCardScore(
  card: CardInstance,
  playerField: CardInstance[]
): number {
  let score = card.baseScore;

  switch (card.effectType) {
    case EffectType.SCORE_PER_ELEMENT:
      const elementCount = playerField.filter(
        c => c.element === card.effectTarget
      ).length;
      score += elementCount * (card.effectValue || 1);
      break;

    case EffectType.SCORE_PER_DRAGON:
      const dragonCount = playerField.filter(
        c => c.element === Element.DRAGON
      ).length;
      score += dragonCount * (card.effectValue || 2);
      break;
  }

  return score;
}
```

---

## 5. 牌庫建構

### 5.1 建構規則

- MVP 使用 20 種卡片
- 每種卡片 2 份 = 40 張總牌庫
- 遊戲開始時隨機洗牌

### 5.2 牌庫建構函數

```typescript
function createMVPDeck(): CardInstance[] {
  const deck: CardInstance[] = [];

  // 載入所有卡片模板
  const templates = MVP_CARDS;

  // 每張卡片建立 2 份實例
  for (const template of templates) {
    for (let i = 0; i < 2; i++) {
      deck.push({
        instanceId: `${template.id}-${i}`,
        cardId: template.id,
        ...template,
        ownerId: null,
        location: CardLocation.DECK,
        isRevealed: false,
        scoreModifier: 0,
        hasUsedAbility: false,
      });
    }
  }

  return shuffleDeck(deck);
}
```

---

## 6. 資料檔案結構

### 6.1 檔案位置

```
src/
└── data/
    └── cards/
        ├── index.ts           # 匯出所有卡片資料
        ├── types.ts           # 卡片相關類型定義
        ├── mvpCards.ts        # MVP 20張卡片資料
        └── effectHandlers.ts  # 效果處理函數
```

### 6.2 匯出格式

```typescript
// src/data/cards/mvpCards.ts
export const MVP_CARDS: CardTemplate[] = [
  // Fire
  { id: 'F001', name: 'Hestia', ... },
  { id: 'F002', name: 'Imp', ... },
  { id: 'F003', name: 'Firefox', ... },
  { id: 'F004', name: 'Salamander', ... },

  // Water
  { id: 'W001', name: 'Kappa', ... },
  { id: 'W002', name: 'Yuki Onna', ... },
  { id: 'W003', name: 'Undine', ... },
  { id: 'W004', name: 'Sea Spirit', ... },

  // Earth
  { id: 'E001', name: 'Young Forest Spirit', ... },
  { id: 'E002', name: 'Goblin', ... },
  { id: 'E003', name: 'Forest Spirit', ... },
  { id: 'E004', name: 'Gargoyle', ... },

  // Wind
  { id: 'A001', name: 'Harpy', ... },
  { id: 'A002', name: 'Pegasus', ... },
  { id: 'A003', name: 'Sylph', ... },
  { id: 'A004', name: 'Tengu', ... },

  // Dragon
  { id: 'D001', name: 'Dragon Egg', ... },
  { id: 'D002', name: 'Ember', ... },
  { id: 'D003', name: 'Tidal', ... },
  { id: 'D004', name: 'Boulder', ... },
];

// 輔助函數
export function getCardById(id: string): CardTemplate | undefined;
export function getCardsByElement(element: Element): CardTemplate[];
export function getCardsByEffectType(effectType: EffectType): CardTemplate[];
```

---

## 附錄 A：元素視覺設計

### A.1 元素顏色定義

```typescript
const ELEMENT_COLORS = {
  FIRE: {
    primary: '#EF4444',    // red-500
    secondary: '#FCA5A5',  // red-300
    background: 'rgba(239, 68, 68, 0.2)',
    border: '#DC2626',     // red-600
    gradient: 'linear-gradient(135deg, #EF4444, #F97316)',
  },
  WATER: {
    primary: '#3B82F6',    // blue-500
    secondary: '#93C5FD',  // blue-300
    background: 'rgba(59, 130, 246, 0.2)',
    border: '#2563EB',     // blue-600
    gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
  },
  EARTH: {
    primary: '#84CC16',    // lime-500
    secondary: '#BEF264',  // lime-300
    background: 'rgba(132, 204, 22, 0.2)',
    border: '#65A30D',     // lime-600
    gradient: 'linear-gradient(135deg, #84CC16, #22C55E)',
  },
  WIND: {
    primary: '#A855F7',    // purple-500
    secondary: '#D8B4FE',  // purple-300
    background: 'rgba(168, 85, 247, 0.2)',
    border: '#9333EA',     // purple-600
    gradient: 'linear-gradient(135deg, #A855F7, #EC4899)',
  },
  DRAGON: {
    primary: '#F59E0B',    // amber-500
    secondary: '#FCD34D',  // amber-300
    background: 'rgba(245, 158, 11, 0.2)',
    border: '#D97706',     // amber-600
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
  },
};
```

### A.2 元素圖示

| 元素 | 圖示 | Unicode |
|------|------|---------|
| FIRE | 🔥 | U+1F525 |
| WATER | 💧 | U+1F4A7 |
| EARTH | 🌿 | U+1F33F |
| WIND | 💨 | U+1F4A8 |
| DRAGON | 🐉 | U+1F409 |

---

## 附錄 B：卡片平衡性分析

### B.1 費用效率分析

| 費用 | 馴服成本 | 平均分數 | 效率 (分/石) |
|------|----------|----------|-------------|
| 0 | 0 | 0.5 | N/A (免費) |
| 1 | 1 | 2 | 2.0 |
| 2 | 1 | 3 | 3.0 |
| 3 | 2 | 4.25 | 2.125 |
| 4 | 2 | 5 | 2.5 |
| 5 | 3 | 7 | 2.33 |

### B.2 效果價值評估

| 效果 | 估計價值 | 說明 |
|------|----------|------|
| +1 石頭 | ~0.5 分 | 可用於馴服其他卡 |
| +2 石頭 | ~1 分 | 較高價值 |
| +2 石頭上限 | ~1 分 | 長期價值 |
| 同元素 +1 | ~2-4 分 | 依場上卡片數 |
| 同元素 +2 | ~4-8 分 | 高價值組合 |
| 龍卡 +2 | ~2-6 分 | 依龍卡數量 |

---

> **文件結束**
> 如有疑問請參考其他規格文件或聯繫開發團隊。
