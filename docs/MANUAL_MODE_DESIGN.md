# 手動操作模式設計文件 (Manual Mode Design Document)

**版本**: 1.0.0
**日期**: 2025-12-30
**狀態**: 設計中

## 目錄

1. [概述](#概述)
2. [設計目標](#設計目標)
3. [架構設計](#架構設計)
4. [UI 組件設計](#ui-組件設計)
5. [狀態管理](#狀態管理)
6. [資料結構](#資料結構)
7. [實作階段](#實作階段)
8. [測試計畫](#測試計畫)

---

## 概述

### 背景

目前遊戲已實作完整的卡片效果系統（Effect System），包含：
- `BaseEffect` 抽象類別
- `EffectRegistry` 單例管理器
- F001 Hestia 和 F002 Imp 的效果實作
- 122 個通過的測試

### 需求變更

使用者希望增加遊戲的自由度，允許玩家手動操作所有遊戲動作，包括：
- ✅ 手動增減石頭
- ✅ 手動調整分數
- ✅ 手動觸發卡片效果
- ✅ 自由控制遊戲流程

### 核心決策：並存模式（Coexistence Model）

**保留**現有的效果系統，**新增**手動操作模式，兩者可以切換使用：

```
┌─────────────────────────────────────┐
│       遊戲模式 (Game Mode)          │
├─────────────────────────────────────┤
│  [自動模式]     [手動模式]           │
│   Automatic      Manual             │
│                                     │
│  效果自動執行    玩家手動操作          │
│  Effect Auto     Manual Control     │
└─────────────────────────────────────┘
```

---

## 設計目標

### 1. 非破壞性（Non-Destructive）
- ✅ 保留所有已實作的效果系統代碼
- ✅ 保留所有測試（122 個）
- ✅ 未來可無縫切換回自動模式

### 2. 高自由度（High Freedom）
- ✅ 玩家可完全控制遊戲節奏
- ✅ 石頭、分數、效果全部手動管理
- ✅ 支援任意操作，無限制

### 3. 可追溯性（Traceability）
- ✅ 記錄所有手動操作歷史
- ✅ 可撤銷/重做（Undo/Redo）
- ✅ 匯出操作記錄

### 4. 向下相容（Backward Compatible）
- ✅ 不修改現有 `SinglePlayerEngine`
- ✅ 不修改現有卡片資料
- ✅ 不影響多人模式（未來）

---

## 架構設計

### 1. 整體架構圖

```
┌──────────────────────────────────────────────────────────┐
│                    GameBoard.tsx                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  遊戲模式切換器 (GameModeToggle)                     │  │
│  │  [ 自動模式 | 手動模式 ]                              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─────────────┐  ┌─────────────────────────────────┐   │
│  │  自動模式     │  │  手動模式                         │   │
│  │  (現有)      │  │  (新增)                          │   │
│  │             │  │  ┌─────────────────────────────┐ │   │
│  │  - 效果自動  │  │  │  ManualControlPanel         │ │   │
│  │  - 規則檢查  │  │  │                             │ │   │
│  │             │  │  │  1. StoneManualControl      │ │   │
│  │             │  │  │  2. ScoreManualControl      │ │   │
│  │             │  │  │  3. EffectManualTrigger     │ │   │
│  │             │  │  │  4. OperationHistory        │ │   │
│  │             │  │  └─────────────────────────────┘ │   │
│  └─────────────┘  └─────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                           ↓
                ┌──────────────────────┐
                │  useGameStore        │
                │  (Zustand)          │
                │                     │
                │  + gameMode         │  ← 新增屬性
                │  + manualHistory    │  ← 新增屬性
                │  + addManualOp()    │  ← 新增方法
                │  + undoManualOp()   │  ← 新增方法
                └──────────────────────┘
                           ↓
                ┌──────────────────────┐
                │  SinglePlayerEngine  │
                │  (保持不變)           │
                └──────────────────────┘
```

### 2. 模式切換機制

```typescript
// 新增 GameMode 枚舉
export enum GameMode {
  /** 自動模式：效果自動執行 */
  AUTOMATIC = 'AUTOMATIC',
  /** 手動模式：玩家手動操作 */
  MANUAL = 'MANUAL',
}

// 在 SinglePlayerGameState 中新增
export interface SinglePlayerGameState {
  // ... 現有屬性 ...

  /** 遊戲模式 */
  gameMode: GameMode

  /** 手動操作記錄 */
  manualOperations: ManualOperation[]
}
```

### 3. 手動操作資料結構

```typescript
/** 手動操作類型 */
export enum ManualOperationType {
  /** 增加石頭 */
  ADD_STONES = 'ADD_STONES',
  /** 減少石頭 */
  REMOVE_STONES = 'REMOVE_STONES',
  /** 調整分數 */
  ADJUST_SCORE = 'ADJUST_SCORE',
  /** 手動觸發效果 */
  TRIGGER_EFFECT = 'TRIGGER_EFFECT',
  /** 移動卡片 */
  MOVE_CARD = 'MOVE_CARD',
  /** 自訂操作 */
  CUSTOM = 'CUSTOM',
}

/** 手動操作記錄 */
export interface ManualOperation {
  /** 操作 ID */
  id: string
  /** 操作類型 */
  type: ManualOperationType
  /** 時間戳記 */
  timestamp: number
  /** 操作描述 */
  description: string
  /** 操作前狀態快照 */
  stateBefore: Partial<SinglePlayerGameState>
  /** 操作後狀態快照 */
  stateAfter: Partial<SinglePlayerGameState>
  /** 操作資料 */
  payload: ManualOperationPayload
  /** 是否可撤銷 */
  canUndo: boolean
}

/** 手動操作資料 */
export type ManualOperationPayload =
  | { type: 'ADD_STONES'; stoneType: StoneType; amount: number }
  | { type: 'REMOVE_STONES'; stoneType: StoneType; amount: number }
  | { type: 'ADJUST_SCORE'; amount: number; reason: string }
  | { type: 'TRIGGER_EFFECT'; cardId: string; effectIndex: number }
  | { type: 'MOVE_CARD'; cardId: string; from: CardLocation; to: CardLocation }
  | { type: 'CUSTOM'; data: Record<string, unknown> }
```

---

## UI 組件設計

### 1. GameModeToggle（遊戲模式切換器）

**位置**: GameBoard.tsx 頂部

```tsx
interface GameModeToggleProps {
  currentMode: GameMode
  onModeChange: (mode: GameMode) => void
}

function GameModeToggle({ currentMode, onModeChange }: GameModeToggleProps) {
  return (
    <div className="flex gap-2 bg-slate-800 p-2 rounded-lg">
      <button
        className={cn(
          'px-4 py-2 rounded',
          currentMode === GameMode.AUTOMATIC
            ? 'bg-vale-500 text-white'
            : 'text-slate-400 hover:bg-slate-700'
        )}
        onClick={() => onModeChange(GameMode.AUTOMATIC)}
      >
        🤖 自動模式
      </button>
      <button
        className={cn(
          'px-4 py-2 rounded',
          currentMode === GameMode.MANUAL
            ? 'bg-amber-500 text-white'
            : 'text-slate-400 hover:bg-slate-700'
        )}
        onClick={() => onModeChange(GameMode.MANUAL)}
      >
        🎮 手動模式
      </button>
    </div>
  )
}
```

### 2. ManualControlPanel（手動操作面板）

**位置**: 新增 `src/components/game/ManualControlPanel.tsx`

```tsx
interface ManualControlPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ManualControlPanel({ isOpen, onClose }: ManualControlPanelProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="手動操作面板" size="xl">
      <div className="space-y-6">
        {/* 1. 石頭管理 */}
        <StoneManualControl />

        {/* 2. 分數調整 */}
        <ScoreManualControl />

        {/* 3. 效果觸發 */}
        <EffectManualTrigger />

        {/* 4. 操作記錄 */}
        <OperationHistory />
      </div>
    </Modal>
  )
}
```

### 3. StoneManualControl（石頭手動管理）

```tsx
export function StoneManualControl() {
  const [selectedType, setSelectedType] = useState<StoneType>(StoneType.ONE)
  const [amount, setAmount] = useState(1)
  const { addStones, removeStones } = useGameStore()

  return (
    <section className="bg-slate-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">💎 石頭管理</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* 石頭類型選擇 */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">石頭類型</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as StoneType)}
            className="w-full bg-slate-700 p-2 rounded"
          >
            <option value={StoneType.ONE}>1點石頭</option>
            <option value={StoneType.THREE}>3點石頭</option>
            <option value={StoneType.SIX}>6點石頭</option>
          </select>
        </div>

        {/* 數量輸入 */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">數量</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
            className="w-full bg-slate-700 p-2 rounded"
          />
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => addStones(selectedType, amount)}
          className="flex-1"
        >
          ➕ 增加
        </Button>
        <Button
          onClick={() => removeStones(selectedType, amount)}
          variant="secondary"
          className="flex-1"
        >
          ➖ 減少
        </Button>
      </div>
    </section>
  )
}
```

### 4. ScoreManualControl（分數手動調整）

```tsx
export function ScoreManualControl() {
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')
  const { adjustScore } = useGameStore()

  return (
    <section className="bg-slate-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🎯 分數調整</h3>

      <div className="space-y-4">
        {/* 分數變動 */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            分數變動（正數加分，負數扣分）
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full bg-slate-700 p-2 rounded"
            placeholder="例如: +5 或 -3"
          />
        </div>

        {/* 調整原因 */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">原因（選填）</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-700 p-2 rounded"
            placeholder="例如: 特殊規則加分"
          />
        </div>

        {/* 操作按鈕 */}
        <Button
          onClick={() => adjustScore(amount, reason)}
          disabled={amount === 0}
          className="w-full"
        >
          ✏️ 調整分數
        </Button>
      </div>
    </section>
  )
}
```

### 5. EffectManualTrigger（效果手動觸發）

```tsx
export function EffectManualTrigger() {
  const { gameState, triggerEffect } = useGameStore()
  const fieldCards = gameState?.player.field ?? []

  return (
    <section className="bg-slate-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">⚡ 手動觸發效果</h3>

      {fieldCards.length === 0 ? (
        <p className="text-slate-500 text-sm">場上沒有卡片</p>
      ) : (
        <div className="space-y-2">
          {fieldCards.map((card) => (
            <div key={card.instanceId} className="bg-slate-700 p-3 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{card.nameTw || card.name}</h4>
                  <p className="text-xs text-slate-400">{card.id}</p>
                </div>
              </div>

              {/* 效果列表 */}
              {card.effects.length === 0 ? (
                <p className="text-xs text-slate-500">無效果</p>
              ) : (
                <div className="space-y-1">
                  {card.effects.map((effect, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => triggerEffect(card.instanceId, index)}
                      className="w-full text-left justify-start"
                    >
                      <span className="text-xs">
                        {effect.descriptionTw || effect.description}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
```

### 6. OperationHistory（操作記錄）

```tsx
export function OperationHistory() {
  const { manualOperations, undoOperation, redoOperation, exportHistory } = useGameStore()

  return (
    <section className="bg-slate-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📜 操作記錄</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={undoOperation}>
            ↶ 撤銷
          </Button>
          <Button size="sm" variant="ghost" onClick={redoOperation}>
            ↷ 重做
          </Button>
          <Button size="sm" variant="secondary" onClick={exportHistory}>
            💾 匯出
          </Button>
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2">
        {manualOperations.length === 0 ? (
          <p className="text-slate-500 text-sm">尚無操作記錄</p>
        ) : (
          manualOperations.map((op) => (
            <div key={op.id} className="bg-slate-700 p-2 rounded text-sm">
              <div className="flex justify-between items-start">
                <span className="text-slate-300">{op.description}</span>
                <span className="text-xs text-slate-500">
                  {new Date(op.timestamp).toLocaleTimeString('zh-TW')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
```

---

## 狀態管理

### 1. useGameStore 擴充

```typescript
// 在 useGameStore.ts 中新增

interface GameStore {
  // ... 現有屬性 ...

  // === 手動模式新增 ===
  /** 當前遊戲模式 */
  gameMode: GameMode
  /** 手動操作記錄 */
  manualOperations: ManualOperation[]
  /** 撤銷堆疊索引 */
  undoIndex: number

  // === 手動模式方法 ===
  /** 切換遊戲模式 */
  setGameMode: (mode: GameMode) => void
  /** 手動增加石頭 */
  addStones: (type: StoneType, amount: number) => void
  /** 手動減少石頭 */
  removeStones: (type: StoneType, amount: number) => void
  /** 手動調整分數 */
  adjustScore: (amount: number, reason?: string) => void
  /** 手動觸發效果 */
  triggerEffect: (cardId: string, effectIndex: number) => void
  /** 撤銷操作 */
  undoOperation: () => void
  /** 重做操作 */
  redoOperation: () => void
  /** 匯出操作記錄 */
  exportHistory: () => void
  /** 清空操作記錄 */
  clearHistory: () => void
}
```

### 2. 手動操作實作範例

```typescript
// addStones 實作
addStones: (type: StoneType, amount: number) => {
  const state = get().gameState
  if (!state || get().gameMode !== GameMode.MANUAL) return

  const stateBefore = { stones: { ...state.player.stones } }

  // 直接修改石頭數量（手動模式不走 engine）
  const newStones = { ...state.player.stones }
  newStones[type] = (newStones[type] || 0) + amount

  const stateAfter = { stones: newStones }

  // 記錄操作
  const operation: ManualOperation = {
    id: crypto.randomUUID(),
    type: ManualOperationType.ADD_STONES,
    timestamp: Date.now(),
    description: `增加 ${amount} 個 ${type} 石頭`,
    stateBefore,
    stateAfter,
    payload: { type: 'ADD_STONES', stoneType: type, amount },
    canUndo: true,
  }

  set(state => ({
    gameState: {
      ...state.gameState!,
      player: {
        ...state.gameState!.player,
        stones: newStones,
      },
    },
    manualOperations: [...state.manualOperations, operation],
    undoIndex: state.manualOperations.length,
  }))
}
```

---

## 資料結構

### 1. 類型定義檔案結構

```
src/types/
├── cards.ts           # 現有：卡片類型
├── game.ts            # 擴充：新增 GameMode
├── manual.ts          # 新增：手動操作類型
└── player.ts          # 現有：玩家類型
```

### 2. manual.ts 完整定義

```typescript
/**
 * Manual Mode Type Definitions
 * @version 1.0.0
 */

import type { StoneType, CardLocation } from './cards'
import type { SinglePlayerGameState } from './game'

/** 遊戲模式 */
export enum GameMode {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

/** 手動操作類型 */
export enum ManualOperationType {
  ADD_STONES = 'ADD_STONES',
  REMOVE_STONES = 'REMOVE_STONES',
  ADJUST_SCORE = 'ADJUST_SCORE',
  TRIGGER_EFFECT = 'TRIGGER_EFFECT',
  MOVE_CARD = 'MOVE_CARD',
  CUSTOM = 'CUSTOM',
}

/** 手動操作記錄 */
export interface ManualOperation {
  id: string
  type: ManualOperationType
  timestamp: number
  description: string
  stateBefore: Partial<SinglePlayerGameState>
  stateAfter: Partial<SinglePlayerGameState>
  payload: ManualOperationPayload
  canUndo: boolean
}

/** 手動操作資料 */
export type ManualOperationPayload =
  | AddStonesPayload
  | RemoveStonesPayload
  | AdjustScorePayload
  | TriggerEffectPayload
  | MoveCardPayload
  | CustomPayload

export interface AddStonesPayload {
  type: 'ADD_STONES'
  stoneType: StoneType
  amount: number
}

export interface RemoveStonesPayload {
  type: 'REMOVE_STONES'
  stoneType: StoneType
  amount: number
}

export interface AdjustScorePayload {
  type: 'ADJUST_SCORE'
  amount: number
  reason: string
}

export interface TriggerEffectPayload {
  type: 'TRIGGER_EFFECT'
  cardId: string
  effectIndex: number
}

export interface MoveCardPayload {
  type: 'MOVE_CARD'
  cardId: string
  from: CardLocation
  to: CardLocation
}

export interface CustomPayload {
  type: 'CUSTOM'
  data: Record<string, unknown>
}
```

---

## 實作階段

### Phase 1: 基礎設施（1-2 天）
- [ ] 建立 `src/types/manual.ts` 類型定義
- [ ] 擴充 `SinglePlayerGameState` 加入 `gameMode` 和 `manualOperations`
- [ ] 在 `useGameStore` 新增基本狀態和模式切換方法
- [ ] 建立 `GameModeToggle` 組件
- [ ] 整合到 `GameBoard.tsx`

### Phase 2: 石頭管理（1 天）
- [ ] 實作 `StoneManualControl` 組件
- [ ] 在 store 新增 `addStones` 和 `removeStones` 方法
- [ ] 實作操作記錄功能
- [ ] 測試石頭增減邏輯

### Phase 3: 分數調整（1 天）
- [ ] 實作 `ScoreManualControl` 組件
- [ ] 在 store 新增 `adjustScore` 方法
- [ ] 整合分數調整到遊戲狀態
- [ ] 測試分數調整邏輯

### Phase 4: 效果觸發（1-2 天）
- [ ] 實作 `EffectManualTrigger` 組件
- [ ] 在 store 新增 `triggerEffect` 方法
- [ ] 整合現有 Effect System（呼叫但不自動執行）
- [ ] 測試手動觸發效果

### Phase 5: 操作記錄系統（1-2 天）
- [ ] 實作 `OperationHistory` 組件
- [ ] 在 store 新增撤銷/重做邏輯
- [ ] 實作操作記錄匯出功能（JSON）
- [ ] 測試撤銷/重做功能

### Phase 6: UI/UX 優化（1 天）
- [ ] 優化手動操作面板樣式
- [ ] 加入操作提示和說明
- [ ] 加入快捷鍵支援（可選）
- [ ] 響應式設計調整

### Phase 7: 測試與文件（1 天）
- [ ] 撰寫單元測試
- [ ] 撰寫整合測試
- [ ] 更新 START.md
- [ ] 建立使用者手冊

---

## 測試計畫

### 1. 單元測試

```typescript
// src/stores/__tests__/useGameStore.manual.test.ts

describe('Manual Mode - Stone Management', () => {
  it('should add stones in manual mode', () => {
    // Test addStones
  })

  it('should remove stones in manual mode', () => {
    // Test removeStones
  })

  it('should not allow negative stones', () => {
    // Test validation
  })
})

describe('Manual Mode - Score Adjustment', () => {
  it('should adjust score with positive amount', () => {
    // Test adjustScore +
  })

  it('should adjust score with negative amount', () => {
    // Test adjustScore -
  })
})

describe('Manual Mode - Undo/Redo', () => {
  it('should undo last operation', () => {
    // Test undoOperation
  })

  it('should redo undone operation', () => {
    // Test redoOperation
  })

  it('should not undo beyond history', () => {
    // Test boundary
  })
})
```

### 2. 整合測試

```typescript
// src/components/game/__tests__/ManualControlPanel.integration.test.tsx

describe('ManualControlPanel Integration', () => {
  it('should render all control sections', () => {
    // Test component rendering
  })

  it('should perform stone addition operation', () => {
    // Test full operation flow
  })

  it('should record operation in history', () => {
    // Test history tracking
  })
})
```

### 3. E2E 測試（Playwright）

```typescript
// e2e/manual-mode.spec.ts

test('Manual Mode - Full Workflow', async ({ page }) => {
  await page.goto('http://localhost:5173/game')

  // Switch to manual mode
  await page.click('[data-testid="manual-mode-toggle"]')

  // Add stones
  await page.click('[data-testid="manual-control-btn"]')
  await page.selectOption('select[name="stoneType"]', 'ONE')
  await page.fill('input[name="amount"]', '5')
  await page.click('button:has-text("增加")')

  // Verify stones increased
  await expect(page.locator('[data-testid="stone-ONE"]')).toContainText('5')

  // Verify operation recorded
  await expect(page.locator('[data-testid="operation-history"]')).toContainText('增加 5 個 ONE 石頭')
})
```

---

## 附錄

### A. 檔案清單

**新增檔案**:
- `src/types/manual.ts`
- `src/components/game/ManualControlPanel.tsx`
- `src/components/game/StoneManualControl.tsx`
- `src/components/game/ScoreManualControl.tsx`
- `src/components/game/EffectManualTrigger.tsx`
- `src/components/game/OperationHistory.tsx`
- `src/components/game/GameModeToggle.tsx`
- `src/stores/__tests__/useGameStore.manual.test.ts`
- `src/components/game/__tests__/ManualControlPanel.integration.test.tsx`
- `e2e/manual-mode.spec.ts`

**修改檔案**:
- `src/types/game.ts` (加入 `gameMode` 和 `manualOperations`)
- `src/stores/useGameStore.ts` (擴充方法)
- `src/pages/GameBoard.tsx` (整合手動模式 UI)

### B. 相依性

**無新增依賴**，使用現有技術棧：
- React 18
- TypeScript
- Zustand (狀態管理)
- Tailwind CSS (樣式)
- Vitest (測試)
- Playwright (E2E)

### C. 效能考量

1. **操作記錄上限**: 限制 `manualOperations` 陣列最多 100 筆，超過則刪除最舊的
2. **狀態快照優化**: 只記錄必要的狀態變更，不複製整個 `gameState`
3. **撤銷/重做索引**: 使用索引而非陣列操作，提升效能

---

**文件版本**: 1.0.0
**最後更新**: 2025-12-30
**負責人**: Claude Code
**審核狀態**: 待審核
