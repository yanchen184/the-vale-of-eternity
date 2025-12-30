# 永恆之谷 - 卡片系統更新 v3.0.0
## Card System Update Summary

> **重大更新**：從圖片分析提取正確效果，實現完整的石頭經濟系統
>
> 更新日期：2025-01-XX
> 版本：v2.0.0 → v3.0.0

---

## 📊 更新總覽

### 完成項目

✅ **所有 70 張卡片效果分析** - 從實際卡片圖片提取正確效果
✅ **石頭經濟系統設計** - 新增 7 種石頭類型 (1, 3, 6, 💧, 🔥, 🌳, 🌸)
✅ **類型定義重構** - 新增 38 種 EffectType，支援多效果卡片
✅ **所有卡片資料檔案更新** - 5 個家族共 70 張卡片
✅ **核心函數更新** - createCardInstance, 驗證函數等
✅ **向後兼容** - 保留 deprecated 欄位供過渡使用

---

## 🎯 關鍵變更

### 1. 新的類型系統

#### StoneType (新增)
```typescript
export enum StoneType {
  ONE = 'ONE',           // 1點石頭
  THREE = 'THREE',       // 3點石頭
  SIX = 'SIX',          // 6點石頭
  WATER = 'WATER',      // 💧 水石頭
  FIRE = 'FIRE',        // 🔥 火石頭
  EARTH = 'EARTH',      // 🌳 土石頭
  WIND = 'WIND',        // 🌸 風石頭
}
```

#### EffectType (重構)
**舊系統 (19 種)** → **新系統 (38 種)**

新增的重要效果類型：
- `EARN_STONES` - 獲得石頭
- `DISCARD_STONES` - 棄掉石頭
- `EXCHANGE_STONES` - 交換石頭
- `INCREASE_STONE_VALUE` - 提升石頭價值
- `INCREASE_STONE_LIMIT` - 增加石頭上限
- `FREE_SUMMON` - 免費召喚
- `ACTIVATE_ALL_PERMANENT` - 觸發所有永久效果
- `COPY_INSTANT_EFFECT` - 複製即時效果
- `DISCARD_ALL_FOR_POINTS` - 棄掉所有石頭換分數
- `PUT_ON_DECK_TOP` - 放回牌庫頂

### 2. CardTemplate 結構變更

**舊格式：**
```typescript
interface CardTemplate {
  effectType: EffectType
  effectTrigger: EffectTrigger
  effectValue?: number
  effectTarget?: Element
  effectDescription: string
  effectDescriptionTw: string
}
```

**新格式：**
```typescript
interface CardTemplate {
  effects: readonly CardEffect[]  // ✨ 支援多效果

  // Legacy fields (deprecated)
  effectType?: EffectType
  effectTrigger?: EffectTrigger
  // ...
}

interface CardEffect {
  type: EffectType
  trigger: EffectTrigger
  stones?: StoneConfig[]          // ✨ 石頭配置
  targetElement?: Element
  value?: number
  description: string
  descriptionTw: string
}
```

### 3. 多效果卡片範例

**F002 - Imp (雙效果)**
```typescript
{
  id: 'F002',
  name: 'Imp',
  cost: 1,
  baseScore: 2,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [
        { type: StoneType.ONE, amount: 3 }
      ],
      description: 'Earn 1 1 1.',
      descriptionTw: '獲得 3 個 1 點石頭。',
    },
    {
      type: EffectType.RECOVER_CARD,
      trigger: EffectTrigger.PERMANENT,
      description: 'Recover.',
      descriptionTw: '可回收。',
    },
  ],
}
```

**W013 - Water Giant (雙效果)**
```typescript
{
  id: 'W013',
  name: 'Water Giant',
  cost: 4,
  baseScore: 7,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [
        { type: StoneType.WATER, amount: 2 }
      ],
      description: 'Earn 💧 💧.',
      descriptionTw: '獲得 2 個水石頭。',
    },
    {
      type: EffectType.INCREASE_STONE_VALUE,
      trigger: EffectTrigger.PERMANENT,
      value: 1,
      description: 'Values of your 💧 and 6 are each increased by 1.',
      descriptionTw: '你的💧和 6 點石頭價值各 +1。',
    },
  ],
}
```

---

## 📁 更新的檔案清單

### 類型定義
- ✅ `src/types/cards.ts` (v3.0.0)
  - 新增 StoneType enum
  - 新增 38 種 EffectType
  - 新增 CardEffect, StoneConfig 介面
  - CardTemplate 支援 effects 陣列
  - CardInstance 支援 effects 陣列

### 卡片資料
- ✅ `src/data/cards/fire-cards.ts` (v3.0.0) - 15 張
- ✅ `src/data/cards/water-cards.ts` (v3.0.0) - 15 張
- ✅ `src/data/cards/earth-cards.ts` (v3.0.0) - 15 張
- ✅ `src/data/cards/wind-cards.ts` (v3.0.0) - 15 張
- ✅ `src/data/cards/dragon-cards.ts` (v3.0.0) - 10 張
- ✅ `src/data/cards/base-cards.ts` (v3.0.0)
- ✅ `src/data/cards/mvp-cards.ts` (v3.0.0)
- ✅ `src/data/cards/index.ts` (v3.0.0)

### 文檔
- ✅ `CARD_EFFECTS_ANALYSIS.md` - 完整的效果分析文檔

---

## 🔧 關鍵函數更新

### createCardInstance()

**新功能**：
- 優先使用 `template.effects` 陣列
- 自動生成 legacy 欄位（向後兼容）
- 支援舊格式 CardTemplate fallback

**使用範例**：
```typescript
const template = getBaseCardById('F002')
const instance = createCardInstance(template, 0)

// instance 包含：
// - effects: CardEffect[]        // 新格式
// - effectType: EffectType       // deprecated, 自動生成
// - effectTrigger: EffectTrigger // deprecated, 自動生成
```

### 新增工具函數

```typescript
// 按效果類型篩選
getCardsByEffectType(EffectType.EARN_STONES)

// 按觸發時機篩選
getCardsByEffectTrigger(EffectTrigger.PERMANENT)

// 提取 legacy 欄位
extractLegacyEffectFields(template)
```

---

## 📈 卡片統計

### 總覽
- **總卡片數**: 70 張
- **Fire**: 15 張
- **Water**: 15 張
- **Earth**: 15 張 (E002 → A015)
- **Wind**: 15 張 (新增 A015)
- **Dragon**: 10 張

### 效果類型分布

| 效果類型 | 數量 | 範例卡片 |
|---------|------|----------|
| EARN_STONES | 25+ | F002, F005, W008, E004 |
| CONDITIONAL_EARN | 8+ | F003, F004, E008, E009 |
| DRAW_CARD | 6+ | A015, A002, A006, A007 |
| RECOVER_CARD | 5+ | F002, F013, F014, A015 |
| COPY_INSTANT_EFFECT | 2 | A008, D008 |
| ACTIVATE_ALL_PERMANENT | 1 | A005 |
| EXCHANGE_STONES | 4+ | F009, W006, W007, E007 |
| FREE_SUMMON | 2 | E001, D001 |

### 觸發時機分布

| 觸發時機 | 數量 | 說明 |
|---------|------|------|
| ON_TAME (⚡) | ~60% | 馴服時觸發 |
| PERMANENT (∞) | ~35% | 永久被動效果 |
| ON_SCORE (⌛) | ~5% | 計分時觸發 |

---

## 🎮 石頭經濟系統

### 核心概念

1. **石頭類型**：
   - 數字石頭：1, 3, 6 (點數)
   - 元素石頭：💧💧🔥🌳🌸 (特殊價值)

2. **石頭操作**：
   - Earn - 獲得石頭
   - Discard - 棄掉石頭
   - Exchange - 交換石頭類型
   - Increase Value - 提升石頭價值

3. **石頭用途**：
   - 召喚卡片
   - 支付費用
   - 轉換分數
   - 觸發效果

### 關鍵卡片

**石頭生成**：
- F002 Imp - 獲得 3 個 1 點石頭
- F005 Salamander - 永久獲得 3+1 石頭
- F006 Horned Salamander - 永久獲得 4 個 3 點石頭
- W004 Undine - 獲得💧石頭 + 回收

**石頭轉換**：
- W001 Yuki Onna - 棄掉所有石頭換分數
- W006 Hae-tae - 💧=3, 3=💧
- E014 Stone Golem - 所有石頭換成 6 點

**石頭增值**：
- F012 Agni - 3 點石頭價值 +1
- W013 Water Giant - 💧和 6 點石頭價值各 +1

---

## ⚠️ 已知問題

### 需要後續處理

1. **測試檔案** (`__tests__/*.test.ts`) - 使用舊的 EffectType 名稱
2. **遊戲邏輯** (`lib/effect-system.ts`, `lib/game-utils.ts`) - 需要實現新的效果處理
3. **UI 元件** - 可能需要更新以顯示新的效果資訊

### 向後兼容性

✅ **已保留**：
- CardTemplate 和 CardInstance 的舊欄位標記為 `@deprecated`
- createCardInstance 自動生成 legacy 欄位
- 現有 UI 元件可繼續使用 effectType/effectTrigger

⚠️ **建議遷移**：
- 新元件應使用 `effects` 陣列
- 逐步移除對 deprecated 欄位的依賴

---

## 🚀 下一步

### 短期 (MVP v1.0)
1. ⏳ 修復 Firebase Auth 配置問題
2. ⏳ 繪製遊戲流程 Mermaid 圖
3. ⏳ 實現石頭經濟系統的遊戲邏輯
4. ⏳ 更新 UI 以顯示新的效果資訊

### 中期 (MVP v1.1)
1. 更新所有測試檔案
2. 實現所有 38 種效果類型的處理邏輯
3. UI/UX 優化以展示石頭系統
4. E2E 測試所有卡片效果

### 長期 (Full Game)
1. 多人遊戲支援
2. AI 對手
3. 擴充卡包
4. 成就系統

---

## 📚 參考文件

- `CARD_EFFECTS_ANALYSIS.md` - 完整的效果分析
- `src/types/cards.ts` - 類型定義
- `SDD.md` - 系統設計文檔
- Firebase 配置文檔（待建立）

---

**更新者**: Claude Code AI
**更新日期**: 2025-01-XX
**版本**: v3.0.0
