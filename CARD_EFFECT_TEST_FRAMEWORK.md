# 卡片效果測試框架設計
**版本**: 1.0.0
**日期**: 2026-01-04

## 🎯 目標

設計一個完整的卡片效果測試系統，允許開發者和測試人員輕鬆測試每張卡片的效果和神器功能。

## 📋 伊夫利特效果分析

### 卡片資訊
- **ID**: F007
- **名稱**: Ifrit (伊夫利特)
- **元素**: Fire
- **Cost**: 2
- **基礎分數**: 6
- **效果類型**: CONDITIONAL_AREA
- **觸發時機**: ON_TAME

### 效果描述
**英文**: "Earn 1 point for each card in your area."
**中文**: "你場上的每張卡立即獲得 1 分。"

### 實現狀態
✅ **已實現** (`isImplemented: true`)

### 效果處理邏輯
位置: `src/services/effect-processor.ts:413-443`

```typescript
private async processConditionalArea(effect: CardEffect, context: EffectContext) {
  // 1. 計算場上卡片數量（包括剛打出的這張）
  const fieldCardCount = currentPlayerState.field.length
  const pointsPerCard = effect.value || 1  // 每張卡 1 分

  // 2. 計算總分數
  const totalPoints = fieldCardCount * pointsPerCard

  // 3. 更新玩家分數
  const newScore = (player.score || 0) + totalPoints
  await update(playerRef, { score: newScore })
}
```

### 預期行為
- 場上有 3 張卡時打出伊夫利特 → 獲得 3 分（3 張卡 × 1 分）
- 場上有 5 張卡時打出伊夫利特 → 獲得 5 分（5 張卡 × 1 分）
- 場上有 0 張卡時打出伊夫利特 → 獲得 0 分（0 張卡 × 1 分）

⚠️ **注意**: `field.length` 包括伊夫利特本身，所以最少是 1 張卡

## 🛠️ 測試框架設計

### 1. 開發者測試面板 (DevTestPanel)

#### 功能需求
- **位置**: 僅在開發環境顯示（`import.meta.env.DEV`）
- **觸發**: 按下 `Ctrl+Shift+T` 開啟測試面板
- **UI**: 浮動視窗，可拖曳、最小化

#### 核心功能
1. **卡片快速召喚**
   - 搜尋卡片（按 ID 或名稱）
   - 一鍵召喚到場上（無需消耗石頭）
   - 批量召喚（預設場景）

2. **遊戲狀態控制**
   - 重置遊戲
   - 設定石頭數量
   - 設定分數
   - 清空場上/手牌

3. **效果觸發測試**
   - 手動觸發 ON_TAME 效果
   - 手動觸發 PERMANENT 效果
   - 查看效果執行日誌

4. **神器測試**
   - 快速獲得神器
   - 測試神器效果
   - 查看神器狀態

### 2. 測試場景預設 (Test Scenarios)

#### 伊夫利特測試場景

**場景 1: 空場測試**
```typescript
{
  name: "Ifrit - Empty Field",
  setup: {
    field: [],
    expectedScore: 1  // 只有伊夫利特自己
  }
}
```

**場景 2: 3 卡場測試**
```typescript
{
  name: "Ifrit - 3 Cards Field",
  setup: {
    field: ['F001', 'F002', 'F003'],  // 先放 3 張卡
    cardToPlay: 'F007',  // 再打伊夫利特
    expectedScore: 4  // 3 張已有卡 + 伊夫利特 = 4 分
  }
}
```

**場景 3: 滿場測試**
```typescript
{
  name: "Ifrit - Full Field (10 cards)",
  setup: {
    field: ['F001', 'F002', 'F003', 'F004', 'F005',
            'F006', 'F008', 'F009', 'F010'],  // 9 張卡
    cardToPlay: 'F007',  // 第 10 張
    expectedScore: 10  // 10 張卡 = 10 分
  }
}
```

### 3. 自動化測試輔助

#### Console 日誌系統
```typescript
console.log('[TEST] 🧪 Ifrit Effect Test')
console.log('[TEST] 📊 Field Cards:', fieldCardCount)
console.log('[TEST] 🎯 Expected Score:', expectedScore)
console.log('[TEST] ✅ Actual Score:', actualScore)
console.log('[TEST] 🏆 Result:', actualScore === expectedScore ? 'PASS' : 'FAIL')
```

#### 測試斷言工具
```typescript
testAssert({
  cardId: 'F007',
  effectType: EffectType.CONDITIONAL_AREA,
  fieldCards: ['F001', 'F002', 'F003'],
  expectedScoreChange: 4,
  actualScoreChange: 4,
  passed: true
})
```

## 🎨 UI 設計

### 測試面板佈局
```
┌─────────────────────────────────────┐
│  🧪 Card Effect Test Panel      [×] │
├─────────────────────────────────────┤
│  Card Search: [___________] 🔍      │
│  ┌───────────────────────────────┐  │
│  │ F007 - Ifrit (伊夫利特)       │  │
│  │ Effect: +1 score per card     │  │
│  │ [Summon] [Test Effect]        │  │
│  └───────────────────────────────┘  │
│                                     │
│  Current Field: 3 cards             │
│  Expected Score: +3                 │
│                                     │
│  [Reset Game] [Clear Field]         │
│                                     │
│  📋 Test Scenarios:                 │
│  • Empty Field Test                 │
│  • 3 Cards Field Test               │
│  • Full Field Test                  │
│                                     │
│  📊 Last Test Result:               │
│  ✅ PASS - Score: 3 (Expected: 3)  │
└─────────────────────────────────────┘
```

## 📝 測試流程

### 手動測試（使用 Chrome DevTools）

#### 單人模式測試步驟
1. 啟動開發伺服器：`npm run dev`
2. 開啟瀏覽器並打開 DevTools（F12）
3. 進入單人模式遊戲
4. 按 `Ctrl+Shift+T` 開啟測試面板
5. 執行測試場景：
   - 選擇 "Ifrit - 3 Cards Field Test"
   - 點擊 "Run Test"
   - 觀察 Console 日誌和分數變化
6. 驗證結果：
   - 查看 DevTools Console 的測試日誌
   - 確認分數是否正確增加
   - 截圖記錄測試結果

#### 多人模式測試步驟
1. 開啟兩個瀏覽器視窗（或使用無痕模式）
2. 兩個視窗都開啟 DevTools
3. 創建多人遊戲房間
4. 雙方加入遊戲
5. 使用測試面板在一方場上放置卡片
6. 打出伊夫利特
7. 雙方同時驗證：
   - 分數更新是否同步
   - 效果動畫是否正確顯示
   - Firebase 資料是否正確

### 自動化測試（Playwright）

```typescript
// tests/e2e/ifrit-effect.spec.ts
test('Ifrit effect - 3 cards field', async ({ page }) => {
  // 1. 開啟遊戲
  await page.goto('http://localhost:5173')

  // 2. 進入單人模式
  await page.click('[data-testid="single-player-button"]')

  // 3. 開啟測試面板
  await page.keyboard.press('Control+Shift+T')

  // 4. 執行測試場景
  await page.click('[data-testid="scenario-ifrit-3cards"]')

  // 5. 驗證結果
  const score = await page.textContent('[data-testid="player-score"]')
  expect(score).toBe('4')
})
```

## 🔍 測試檢查清單

### 伊夫利特效果測試清單
- [ ] 空場測試（預期: +1 分）
- [ ] 1 張卡測試（預期: +2 分）
- [ ] 3 張卡測試（預期: +4 分）
- [ ] 5 張卡測試（預期: +6 分）
- [ ] 10 張卡測試（預期: +11 分）
- [ ] 單人模式測試
- [ ] 多人模式測試
- [ ] Firebase 同步測試
- [ ] 效果動畫測試
- [ ] Console 日誌驗證

### 通用卡片效果測試清單
- [ ] ON_TAME 效果觸發
- [ ] PERMANENT 效果持續
- [ ] ON_SCORE 效果計分
- [ ] 多個效果疊加
- [ ] 效果取消/重置
- [ ] 錯誤處理

## 📦 實現計劃

### Phase 1: 核心測試工具
1. 創建 `DevTestPanel.tsx` 組件
2. 實現快速召喚功能
3. 實現遊戲狀態控制

### Phase 2: 測試場景系統
1. 創建 `test-scenarios.ts` 配置文件
2. 實現場景載入功能
3. 實現測試斷言工具

### Phase 3: UI 優化
1. 設計測試面板 UI
2. 實現拖曳和最小化
3. 添加測試結果視覺化

### Phase 4: 自動化整合
1. 創建 Playwright 測試腳本
2. 整合 CI/CD
3. 生成測試報告

## 🎯 成功標準

測試框架完成後應能：
1. ✅ 在 1 分鐘內測試任何卡片效果
2. ✅ 自動記錄測試日誌
3. ✅ 提供清晰的通過/失敗結果
4. ✅ 支援單人和多人模式
5. ✅ 可擴展到所有卡片和神器

---

**版本歷史**:
- v1.0.0 (2026-01-04): 初始設計文件
