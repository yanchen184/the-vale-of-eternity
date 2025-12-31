# 多人線上對戰測試指南

## 快速測試流程（使用 MCP Chrome DevTools）

### 步驟 1: 開啟兩個瀏覽器視窗

```javascript
// 開啟第一個視窗（玩家1 - 房主）
mcp__chrome-devtools__new_page({ url: "http://localhost:5183/the-vale-of-eternity/" })

// 開啟第二個視窗（玩家2）
mcp__chrome-devtools__new_page({ url: "http://localhost:5183/the-vale-of-eternity/" })
```

### 步驟 2: 玩家1 創建房間

```javascript
// 切換到第一個視窗
mcp__chrome-devtools__select_page({ pageIdx: 0, bringToFront: true })

// 拍攝快照確認頁面
mcp__chrome-devtools__take_snapshot()

// 點擊「創建遊戲」按鈕
mcp__chrome-devtools__click({ uid: "XX_11" }) // 找到「創建遊戲」按鈕的 uid

// 填寫玩家名稱
mcp__chrome-devtools__fill({ uid: "XX_21", value: "玩家1" })

// 點擊「創建」按鈕
mcp__chrome-devtools__click({ uid: "XX_30" })

// 等待進入大廳
mcp__chrome-devtools__wait_for({ text: "房間代碼", timeout: 5000 })

// 拍攝快照，記錄房間代碼
mcp__chrome-devtools__take_snapshot()
```

### 步驟 3: 玩家2 加入房間

```javascript
// 切換到第二個視窗
mcp__chrome-devtools__select_page({ pageIdx: 1, bringToFront: true })

// 拍攝快照確認頁面
mcp__chrome-devtools__take_snapshot()

// 點擊「加入遊戲」按鈕
mcp__chrome-devtools__click({ uid: "XX_12" }) // 找到「加入遊戲」按鈕的 uid

// 填寫玩家名稱
mcp__chrome-devtools__fill({ uid: "XX_21", value: "玩家2" })

// 填寫房間代碼（從步驟2的快照中獲取）
mcp__chrome-devtools__fill({ uid: "XX_23", value: "XXXXXX" })

// 點擊「加入」按鈕
mcp__chrome-devtools__click({ uid: "XX_25" })

// 等待進入大廳
mcp__chrome-devtools__wait_for({ text: "準備", timeout: 5000 })
```

### 步驟 4: 玩家2 準備

```javascript
// 點擊「準備」按鈕
mcp__chrome-devtools__click({ uid: "XX_XX" }) // 找到「準備」按鈕的 uid

// 等待房主看到玩家2已準備
```

### 步驟 5: 房主開始遊戲

```javascript
// 切換回玩家1視窗
mcp__chrome-devtools__select_page({ pageIdx: 0, bringToFront: true })

// 點擊「開始遊戲」按鈕
mcp__chrome-devtools__click({ uid: "XX_XX" }) // 找到「開始遊戲」按鈕的 uid

// 等待進入 Hunting Phase
mcp__chrome-devtools__wait_for({ text: "Hunting Phase", timeout: 5000 })
```

### 步驟 6: Hunting Phase - 選牌測試

```javascript
// 拍攝快照，查看市場卡片
mcp__chrome-devtools__take_snapshot()

// 玩家1 選擇第一張卡片
mcp__chrome-devtools__click({ uid: "XX_XX" }) // 找到市場第一張卡片的 uid

// 檢查 Console 是否有錯誤
mcp__chrome-devtools__list_console_messages({ types: ["error", "warn"] })

// 切換到玩家2視窗
mcp__chrome-devtools__select_page({ pageIdx: 1, bringToFront: true })

// 拍攝快照，確認市場更新
mcp__chrome-devtools__take_snapshot()

// 玩家2 選擇卡片
mcp__chrome-devtools__click({ uid: "XX_XX" })

// 檢查 Console
mcp__chrome-devtools__list_console_messages({ types: ["error", "warn"] })
```

### 步驟 7: 檢查錯誤

```javascript
// 在兩個視窗都執行
mcp__chrome-devtools__list_console_messages({ types: ["error", "warn"] })

// 查看完整的 Console 輸出
mcp__chrome-devtools__playwright_console_logs({ type: "all" })
```

---

## 手動測試流程（給用戶的指南）

### 開房測試

1. **開啟兩個瀏覽器視窗**
   - Chrome 正常視窗 + 無痕模式視窗
   - 或兩個不同的瀏覽器

2. **視窗1（房主）**
   - 進入首頁
   - 點擊「創建遊戲」
   - 輸入名稱：玩家1
   - 選擇：2人
   - 點擊「創建」
   - **記下房間代碼**

3. **視窗2（玩家2）**
   - 進入首頁
   - 點擊「加入遊戲」
   - 輸入名稱：玩家2
   - 輸入房間代碼
   - 點擊「加入」
   - 點擊「準備」

4. **視窗1（房主）**
   - 確認看到玩家2已準備
   - 點擊「開始遊戲」

### Hunting Phase 測試

5. **視窗1（玩家1 的回合）**
   - 確認顯示「Your Turn」
   - 點擊市場上的一張卡片
   - **查看 Console 是否有錯誤或 warning**
   - 確認卡片進入手牌

6. **視窗2（玩家2 的回合）**
   - 確認市場更新（少一張卡）
   - 確認顯示「Your Turn」
   - 點擊市場上的一張卡片
   - **查看 Console 是否有錯誤或 warning**
   - 確認卡片進入手牌

7. **重複選牌**
   - 玩家1 選第2張
   - 玩家2 選第2張
   - 玩家2 選第3張（蛇形順序）
   - 玩家1 選第3張
   - 玩家1 選第4張
   - 玩家2 選第4張

### Action Phase 測試

8. **玩家1 測試**
   - 確認進入 Action Phase
   - 嘗試從手牌打出一張卡片
   - 確認石頭扣除正確
   - 確認卡片進入場上

9. **玩家2 測試**
   - 輪到玩家2
   - 測試打出卡片
   - 測試 Pass

---

## 常見錯誤檢查點

### 1. 選牌錯誤
- **錯誤**: `Cannot read properties of undefined (reading 'player_xxx')`
- **檢查**: Console 是否有 `[MultiplayerGame] cards is not available` 或 `Card not found`
- **位置**: MultiplayerGame.tsx:485-494

### 2. 手牌未更新
- **症狀**: 選牌後手牌數量沒有增加
- **檢查**: Firebase Database → games/{gameId}/players/{playerId}/hand 陣列
- **修復**: multiplayer-game.ts:420-428

### 3. 市場卡片數量錯誤
- **規則**: 2人4張, 3人6張, 4人8張
- **檢查**: 市場顯示的卡片數量
- **位置**: multiplayer-game.ts:325

### 4. 卡片圖片未顯示
- **檢查**: Card 組件是否正確使用
- **位置**: MultiplayerGame.tsx:330-354

---

## Console 訊息參考

### 正常流程
```
[services/multiplayer-game.ts] v3.1.0 loaded
[MultiplayerGame] Created room XXXXXX (game_xxx)
[MultiplayerGame] Setting up Firebase listeners
[MultiplayerGame] Game update: WAITING
[MultiplayerGame] Game update: HUNTING
[MultiplayerGame] Game game_xxx started with 2 players
```

### 錯誤訊息
```
[MultiplayerGame] cards is not available: undefined
[MultiplayerGame] Card not found: card_xxx
Cannot read properties of undefined (reading 'player_xxx')
```

---

## 版本資訊

- MultiplayerGame.tsx: v3.1.0
- multiplayer-game.ts: v3.1.0
- effect-processor.ts: v3.1.0
- score-calculator.ts: v3.1.0

---

## 修復記錄

### 2024-12-31
1. ✅ PlayerList null safety (MultiplayerGame.tsx:199-200)
2. ✅ Join game dialog error handling (Home.tsx:178-210)
3. ✅ Card images in market (MultiplayerGame.tsx:330-354)
4. ✅ Market size formula (multiplayer-game.ts:325)
5. ✅ Player hand update after selection (multiplayer-game.ts:420-428)
6. ✅ Cards object null safety (MultiplayerGame.tsx:485-494)
7. ✅ Score calculator null safety (score-calculator.ts:272-277)
8. ✅ **Hunting Phase selections initialization** (multiplayer-game.ts:391-394)
   - **錯誤**: `Cannot read properties of undefined (reading 'player_xxx')`
   - **原因**: Firebase transaction 中 `game.huntingPhase.selections` 可能為 undefined
   - **修復**: 在訪問前初始化 selections 物件
9. ✅ **Sell card stone calculation** (multiplayer-game.ts:629)
   - **錯誤**: 賣卡時石頭計算錯誤（`undefined += number` 導致 NaN）
   - **原因**: 玩家石頭池中可能沒有 ONE 類型石頭，直接 += 會導致 undefined
   - **修復**: 使用 `(updatedStones.ONE || 0) + stonesGained` 確保初始值為 0
