# 卡片開發指南

> **The Vale of Eternity - 永恆之谷**
> 每張卡片都是獨立的遊戲功能模組
> 版本：1.0.0
> 最後更新：2025-01-01

---

## 📋 目錄

1. [開發哲學](#開發哲學)
2. [卡片架構](#卡片架構)
3. [開發流程](#開發流程)
4. [檔案結構](#檔案結構)
5. [程式碼規範](#程式碼規範)
6. [測試要求](#測試要求)
7. [範例：F001 Hestia](#範例f001-hestia)

---

## 開發哲學

### 核心理念

**每張卡片都是一個獨立的功能模組，具有：**

- ✅ **獨立的設計文件（SDD）** - 記錄設計思路與規格
- ✅ **獨立的實作程式碼** - 卡片定義 + 效果邏輯
- ✅ **獨立的測試套件（TDD）** - 單元測試 + 整合測試
- ✅ **獨立的版本控制** - 每張卡有自己的版本號

### 為什麼要這樣做？

1. **清晰的責任劃分** - 每張卡片的邏輯獨立，易於維護
2. **便於協作開發** - 多人可同時開發不同卡片
3. **完整的文件記錄** - 設計意圖不會遺失
4. **高測試覆蓋率** - 每張卡都經過嚴格測試
5. **易於平衡調整** - 修改單張卡不影響其他卡

---

## 卡片架構

### 三層架構

```
┌─────────────────────────────────────┐
│  卡片定義層 (Card Definition)        │
│  - 卡片資料（JSON）                  │
│  - 基本屬性（ID, name, cost, etc）  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  效果實作層 (Effect Implementation)  │
│  - 效果處理函數                      │
│  - 條件檢查邏輯                      │
│  - 狀態變更邏輯                      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  效果註冊層 (Effect Registry)        │
│  - 效果註冊系統                      │
│  - 效果執行引擎                      │
│  - 效果組合器                        │
└─────────────────────────────────────┘
```

### 卡片生命週期

```
設計 → 實作 → 測試 → 註冊 → 使用
 ↓      ↓      ↓      ↓      ↓
SDD   Code   Test  Registry Game
```

---

## 開發流程

### 標準 SDD → TDD 流程

#### Phase 1: 設計階段（SDD）

1. **閱讀卡片模板** - 參考 `CARD_TEMPLATE.md`
2. **撰寫設計文件** - 在 `src/cards/[CardID]/README.md`
3. **定義效果規格** - 明確效果類型、觸發時機、數值
4. **設計測試案例** - 列出所有需要測試的情境

#### Phase 2: 實作階段（Implementation）

5. **建立卡片定義** - 在 `[CardName].card.ts` 定義卡片資料
6. **實作效果邏輯** - 在 `[CardName].effect.ts` 實作效果函數
7. **註冊效果** - 在 `EffectRegistry.ts` 註冊效果處理器

#### Phase 3: 測試階段（TDD）

8. **撰寫單元測試** - 在 `[CardName].test.ts` 測試卡片資料
9. **撰寫效果測試** - 測試效果邏輯的正確性
10. **撰寫整合測試** - 在 `[CardName].integration.test.ts` 測試與遊戲系統的整合

#### Phase 4: 驗收階段

11. **測試覆蓋率** - 確保覆蓋率 >= 80%
12. **程式碼審查** - 檢查程式碼品質
13. **文件完整性** - 確認 SDD 文件完整
14. **版本標記** - 標記卡片版本號

---

## 檔案結構

### 標準卡片資料夾結構

```
src/cards/[CardID]-[CardName]/
├── README.md                    # 📄 卡片設計文件（SDD）
├── [CardName].card.ts          # 🎴 卡片定義
├── [CardName].effect.ts        # ⚡ 效果實作
├── [CardName].test.ts          # 🧪 單元測試
├── [CardName].integration.test.ts  # 🔗 整合測試
├── [CardName].assets.ts        # 🖼️ 資源定義（可選）
└── CHANGELOG.md                # 📝 版本歷史（可選）
```

### 範例：F001 Hestia

```
src/cards/F001-Hestia/
├── README.md                    # Hestia 設計文件
├── Hestia.card.ts              # Hestia 卡片定義
├── Hestia.effect.ts            # 增加石頭上限效果
├── Hestia.test.ts              # Hestia 單元測試
├── Hestia.integration.test.ts  # Hestia 整合測試
└── Hestia.assets.ts            # Hestia 圖片資源
```

---

## 程式碼規範

### 1. 卡片定義 ([CardName].card.ts)

```typescript
/**
 * [Card ID] - [Card Name] ([Chinese Name])
 * [Brief description]
 * @version 1.0.0
 */

import { CardTemplate, Element, EffectType, EffectTrigger } from '@/types/cards'
import { [CardName]Effect } from './[CardName].effect'

export const [CARD_CONSTANT_NAME]: CardTemplate = {
  // === 識別資訊 ===
  id: '[CARD_ID]',
  name: '[English Name]',
  nameTw: '[Chinese Name]',

  // === 基本屬性 ===
  element: Element.[ELEMENT],
  cost: [0-6],
  baseScore: [0-10],

  // === 效果定義 ===
  effects: [
    {
      type: EffectType.[TYPE],
      trigger: EffectTrigger.[TRIGGER],
      value: [NUMBER],
      description: '[English description]',
      descriptionTw: '[Chinese description]',
    },
  ],

  // === 描述文字 ===
  flavorText: '[English flavor text]',
  flavorTextTw: '[Chinese flavor text]',

  // === 視覺資源 ===
  imageUrl: '[image-filename].webp',
}

export default [CARD_CONSTANT_NAME]
```

### 2. 效果實作 ([CardName].effect.ts)

```typescript
/**
 * [Card Name] Effect Implementation
 * [Effect description]
 * @version 1.0.0
 */

import type { CardInstance, EffectResult } from '@/types/cards'
import type { SinglePlayerGameState } from '@/types/game'

/**
 * Process [effect name] for [Card Name]
 * @param card - The card instance
 * @param state - Current game state
 * @returns Effect result with state changes
 */
export function process[CardName]Effect(
  card: CardInstance,
  state: SinglePlayerGameState
): EffectResult {
  // 效果實作邏輯

  return {
    success: true,
    message: '[Effect message]',
    stateChanges: {
      // 狀態變更
    },
  }
}
```

### 3. 單元測試 ([CardName].test.ts)

```typescript
/**
 * [Card Name] Unit Tests
 * Tests card data integrity and basic functionality
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest'
import { [CARD_CONSTANT_NAME] } from './[CardName].card'
import { Element, EffectType, EffectTrigger } from '@/types/cards'

describe('[Card ID] - [Card Name]', () => {
  describe('Card Data Integrity', () => {
    it('should have correct card ID', () => {
      expect([CARD_CONSTANT_NAME].id).toBe('[CARD_ID]')
    })

    it('should have correct element', () => {
      expect([CARD_CONSTANT_NAME].element).toBe(Element.[ELEMENT])
    })

    it('should have correct cost', () => {
      expect([CARD_CONSTANT_NAME].cost).toBe([COST])
    })

    it('should have correct base score', () => {
      expect([CARD_CONSTANT_NAME].baseScore).toBe([SCORE])
    })
  })

  describe('Effect Configuration', () => {
    it('should have [effect type] effect', () => {
      expect([CARD_CONSTANT_NAME].effects[0].type).toBe(EffectType.[TYPE])
    })

    it('should trigger on [trigger]', () => {
      expect([CARD_CONSTANT_NAME].effects[0].trigger).toBe(EffectTrigger.[TRIGGER])
    })
  })
})
```

### 4. 整合測試 ([CardName].integration.test.ts)

```typescript
/**
 * [Card Name] Integration Tests
 * Tests card behavior within game system
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createMockGameState } from '@/test/test-helpers'
import { process[CardName]Effect } from './[CardName].effect'

describe('[Card ID] - [Card Name] Integration', () => {
  let gameState: SinglePlayerGameState

  beforeEach(() => {
    gameState = createMockGameState()
  })

  describe('Effect Execution', () => {
    it('should [test case description]', () => {
      // 測試邏輯
    })
  })
})
```

---

## 測試要求

### 測試覆蓋率目標

| 層級 | 目標 | 說明 |
|------|------|------|
| 卡片資料 | 100% | 所有欄位都要測試 |
| 效果邏輯 | >= 90% | 覆蓋所有分支 |
| 整合測試 | >= 80% | 主要使用情境 |

### 必測項目

#### 1. 卡片資料完整性
- ✅ ID 正確
- ✅ 名稱正確（中英文）
- ✅ 元素正確
- ✅ Cost 正確
- ✅ Base Score 正確
- ✅ 效果配置正確

#### 2. 效果邏輯正確性
- ✅ 觸發時機正確
- ✅ 效果計算正確
- ✅ 狀態變更正確
- ✅ 邊界條件處理

#### 3. 與遊戲系統整合
- ✅ 能正確加入牌庫
- ✅ 能正確被抽取
- ✅ 能正確被打出
- ✅ 效果能正確執行
- ✅ 與其他卡片組合正常

---

## 範例：F001 Hestia

### 完整開發示範

詳見：`src/cards/F001-Hestia/README.md`

**設計重點**：
- Cost 0 的資源型卡片
- 永久增加石頭上限 +2
- 適合開局建立資源優勢

**實作重點**：
- 簡單的數值增加邏輯
- 永久效果處理
- 多張疊加效果測試

**測試重點**：
- 基本資料驗證
- 上限增加驗證
- 多張疊加驗證
- 整合遊戲流程驗證

---

## 常見問題

### Q1: 一張卡片可以有多個效果嗎？

**A**: 可以！`effects` 是陣列，可以定義多個效果。

```typescript
effects: [
  { type: EffectType.EARN_STONES, trigger: EffectTrigger.ON_TAME, ... },
  { type: EffectType.RECOVER_CARD, trigger: EffectTrigger.PERMANENT, ... },
]
```

### Q2: 如何處理複雜的條件效果？

**A**: 在 `[CardName].effect.ts` 中實作自訂邏輯，然後註冊到 `EffectRegistry`。

### Q3: 測試要寫到什麼程度？

**A**: 至少覆蓋：
1. 基本資料正確性
2. 主要功能路徑
3. 邊界條件
4. 與其他系統的互動

### Q4: 如何處理卡片版本更新？

**A**:
1. 更新 `@version` 註解
2. 更新 `CHANGELOG.md`
3. 重新執行所有測試
4. 更新相關文件

---

## 開發檢查清單

### 卡片開發完成前檢查

- [ ] README.md 完整且清晰
- [ ] 卡片定義符合規範
- [ ] 效果實作邏輯正確
- [ ] 單元測試覆蓋率 >= 90%
- [ ] 整合測試通過
- [ ] 所有測試通過
- [ ] 程式碼已格式化
- [ ] 已註冊到 EffectRegistry
- [ ] 已加入卡片索引
- [ ] 版本號已標記

---

## 相關文件

- [卡片設計模板](./CARD_TEMPLATE.md)
- [效果系統文件](../../docs/specs/GAME_ENGINE_SPEC.md)
- [測試規格書](../../docs/specs/TEST_SPEC.md)
- [卡片資料規格](../../docs/specs/CARD_DATA_SPEC.md)

---

## 版本歷史

- **v1.0.0** (2025-01-01): 初版發布
  - 建立卡片開發流程
  - 定義程式碼規範
  - 建立測試要求

---

> **記住**: 每張卡片都是遊戲的靈魂，值得用心設計、實作、測試！
