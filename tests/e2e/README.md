# E2E 測試指南

## 測試檔案說明

### `multiplayer-hunting-phase.spec.ts`
完整的多人遊戲 Hunting Phase 測試，涵蓋：
- ✅ 建立遊戲房間
- ✅ 玩家加入房間
- ✅ 開始遊戲
- ✅ Snake Draft 選牌（Round 1 和 Round 2）
- ✅ 驗證進入 ACTION 階段
- ✅ 檢查無 console 錯誤

## 如何執行測試

### 1. 安裝依賴
```bash
npm install
```

確保 Playwright 已安裝：
```bash
npx playwright install
```

### 2. 啟動開發伺服器
```bash
npm run dev
```

### 3. 執行測試

#### 執行所有測試
```bash
npx playwright test tests/e2e/multiplayer-hunting-phase.spec.ts
```

#### 執行特定測試
```bash
# 完整流程測試
npx playwright test -g "完整流程"

# 快速測試
npx playwright test -g "快速測試"

# 邊界測試
npx playwright test -g "邊界測試"
```

#### 使用 UI 模式（推薦）
```bash
npx playwright test --ui
```

#### 顯示瀏覽器視窗（調試用）
```bash
npx playwright test --headed
```

#### 調試模式
```bash
npx playwright test --debug
```

### 4. 查看測試報告
```bash
npx playwright show-report
```

## 測試案例詳解

### 測試 1：完整流程測試
**目的**: 測試從建立房間到完成 Snake Draft 選牌的完整流程

**步驟**:
1. 玩家1 建立 2 人遊戲房間
2. 玩家2 使用房間代碼加入
3. 玩家1（房主）開始遊戲
4. Snake Draft Round 1:
   - 玩家1 選 "Lava Giant"
   - 玩家2 選 "Leviathan"
5. Snake Draft Round 2（反向）:
   - 玩家2 選 "Firefox"
   - 玩家1 選 "Pegasus"
6. 驗證進入 ACTION 階段
7. 檢查無錯誤

**預期結果**: 所有步驟成功，無 `undefined includes` 錯誤

### 測試 2：快速測試
**目的**: 快速驗證房間建立和加入功能

**步驟**:
1. 建立房間
2. 加入房間
3. 驗證人數

**預期結果**: 房間功能正常

### 測試 3：邊界測試
**目的**: 驗證錯誤處理機制

**步驟**:
1. 訪問多人遊戲頁面
2. 監聽 console 錯誤
3. 驗證無 `undefined includes` 錯誤

**預期結果**: 無運行時錯誤

## 輔助函數

### `createGameRoom(page, playerName, maxPlayers)`
建立新的遊戲房間
- **參數**:
  - `page`: Playwright Page 物件
  - `playerName`: 玩家名稱
  - `maxPlayers`: 最大玩家數（2, 3, 或 4）
- **返回**: 房間代碼（6 位數字）

### `joinGameRoom(page, roomCode, playerName)`
加入現有遊戲房間
- **參數**:
  - `page`: Playwright Page 物件
  - `roomCode`: 房間代碼
  - `playerName`: 玩家名稱

### `startGame(page)`
開始遊戲（房主專用）

### `selectMarketCard(page, cardName)`
從市場選擇卡片
- **參數**:
  - `cardName`: 卡片名稱（如 "Leviathan", "Firefox"）

### `verifyHandCount(page, expectedCount)`
驗證玩家手牌數量

### `isMyTurn(page)`
檢查是否輪到當前玩家
- **返回**: boolean

## 測試配置

### Playwright 設定建議
在 `playwright.config.ts` 中加入：

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // 多人遊戲測試不應並行
  timeout: 60000, // 60 秒超時
  expect: {
    timeout: 10000
  },
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5175',
    reuseExistingServer: true,
  },
})
```

## 常見問題

### Q: 測試失敗，顯示「房間代碼未找到」
**A**: 確認開發伺服器正在運行，且 Firebase 配置正確

### Q: 選卡動作沒有反應
**A**: 檢查 MarketArea 組件的點擊事件綁定，可能需要調整選擇器

### Q: 測試執行很慢
**A**:
- 減少 `waitForTimeout` 的時間
- 使用更精確的 `waitForSelector`
- 考慮使用 headless 模式

### Q: 如何調試特定步驟？
**A**:
```typescript
await page.pause() // 在需要暫停的地方加入此行
```

或使用：
```bash
npx playwright test --debug
```

## 持續整合（CI）

### GitHub Actions 範例
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run dev &
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 測試資料清理

測試完成後，Firebase 中可能會留下測試資料。建議：
1. 使用測試專用的 Firebase 項目
2. 定期清理測試資料
3. 在測試中加入清理邏輯

## 版本歷史

- **v1.0.0** (2025-12-31): 初始版本，涵蓋 Hunting Phase 完整流程
