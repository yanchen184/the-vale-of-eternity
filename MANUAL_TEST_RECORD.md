# 手動測試記錄 - 遷移前基準線

**測試日期**: 2026-01-04
**測試人員**: Claude (自動化測試)
**版本**: v7.25.0 (single-player-engine), v4.14.0 (multiplayer-game)
**目的**: 建立遷移前功能基準線，確保 Firebase 統一後無功能損失

---

## 測試環境

- **開發伺服器**: Vite v6.4.1
- **瀏覽器**: Chromium (Playwright)
- **URL**: http://localhost:5173/the-vale-of-eternity/game
- **模式**: 單人模式（擴展模式啟用）

---

## 一、初始載入測試

### A. 頁面載入 ✅

**測試時間**: 2026-01-04 03:15:06

**預期結果**:
- 頁面正常載入
- 無 JavaScript 錯誤
- 所有組件版本號正確輸出

**實際結果**: ✅ 通過
- Vite 啟動時間: 194ms
- 所有組件成功載入
- 版本號輸出正確：
  - App.tsx: v3.4.0
  - SinglePlayerGame.tsx: v9.14.0
  - single-player-engine.ts: v7.25.0
  - MultiplayerGame.tsx: v6.13.0
  - multiplayer-game.ts: v4.14.0

**Console 輸出**:
```
[The Vale of Eternity] v1.1.2 - Multiplayer Mode Enabled
[SinglePlayerEngine] Initialized v7.19.0
[lib/single-player-engine.ts] v7.25.0 loaded - Resolution effects must be activated
```

**截圖**: `single_player_game_correct-2026-01-04T03-15-06-253Z.png`

---

### B. 遊戲初始化 ✅

**預期結果**:
- 自動進入神器選擇階段 (DRAW phase)
- 顯示 4 張神器卡牌
- 手牌包含 Imp (F002) - 測試用強制卡牌
- 市場顯示 Ifrit (F007) - 測試用強制卡牌
- 玩家資訊正確顯示

**實際結果**: ✅ 通過
```
[SinglePlayerEngine] [TEST] Forced Imp (F002) to initial hand for testing
[SinglePlayerEngine] [TEST] Forced F007 to market for testing
[GameStore] initGame returned: DRAW true
```

**觀察到的 UI 元素**:
- ✅ 神器選擇階段標題：「神器選擇階段」
- ✅ 副標題：「選擇一個神器，然後點選『確認選擇』」
- ✅ 4 張神器卡顯示（Ifrit, Girin, Boulder, Nessie）
- ✅ 手牌顯示：「我的手牌 (1 張)」
- ✅ Imp 卡牌正確顯示（火屬性，票數 1，有星標）
- ✅ 玩家資訊：「玩家 #1，回合 1，堡壘 +0，票數 1」
- ✅ 銀行系統顯示三種資源計數器
- ✅ 左側有「繼續上陣」、「隨機」選項
- ✅ 右上角按鈕：「查看分數」、「查看堡壘」、「查看歷史紀錄」、「離開遊戲」

---

## 二、閃電效果系統測試（單人模式獨有）

### E.1 Ifrit (F007) 閃電效果

**測試狀態**: 🔄 待測試

**前置條件**:
- Ifrit 在市場中（已確認存在）
- 需要馴服 Ifrit 來觸發效果

**預期行為**:
1. 馴服 Ifrit 時觸發閃電效果動畫
2. 立即對場上所有生物造成 2 點傷害
3. 顯示閃電視覺效果（LightningEffect 組件）
4. Console 輸出效果觸發訊息

**測試步驟**:
[ ] 1. 選擇神器並進入狩獵階段
[ ] 2. 從市場馴服 Ifrit (F007)
[ ] 3. 觀察閃電效果動畫
[ ] 4. 確認場上所有生物受到 2 點傷害
[ ] 5. 檢查 console 日誌

**實際結果**: _待測試_

---

### E.2 Imp (F002) 閃電效果

**測試狀態**: 🔄 待測試

**前置條件**:
- Imp 在手牌中（已確認存在）
- 需要打出 Imp 來觸發效果

**預期行為**:
1. 打出 Imp 時觸發閃電效果
2. 立即獲得 1 個火屬性石頭
3. 顯示閃電視覺效果
4. 石頭飛行動畫播放

**測試步驟**:
[ ] 1. 選擇神器並進入行動階段
[ ] 2. 打出手牌中的 Imp
[ ] 3. 觀察閃電效果
[ ] 4. 確認獲得 1 個火石頭
[ ] 5. 檢查銀行資源更新

**實際結果**: _待測試_

---

## 三、神器系統測試

### F.1 香爐 (Incense Burner) - ACTION 類型

**測試狀態**: 🔄 待測試

**預期行為**:
1. 選擇後在行動階段可使用
2. 顯示選項面板（支付 1 火石或 1 水石）
3. 支付後獲得對應效果
4. 標記為「已使用」

**測試步驟**:
[ ] 1. 從神器選擇階段選擇「香爐」
[ ] 2. 確認選擇，進入下個階段
[ ] 3. 在行動階段點擊「使用神器」
[ ] 4. 選擇支付選項（火石或水石）
[ ] 5. 確認效果執行
[ ] 6. 驗證神器狀態變為「已使用」

**實際結果**: _待測試_

---

### F.2 七里靴 (Seven-League Boots) - INSTANT 類型

**測試狀態**: 🔄 待測試

**預期行為**:
1. 選擇後立即執行效果
2. 直接從市場抽取 1 張卡牌到手牌
3. 不需要額外確認
4. 效果執行後標記為「已執行」

**關鍵實現細節** (single-player-engine.ts:712):
```typescript
// v9.14.0: 七里靴直接執行效果，不顯示選項畫面
if (artifact.type === 'INSTANT') {
  const result = this.executeArtifactEffect()
  this.artifactState.instantExecuted = true
}
```

**測試步驟**:
[ ] 1. 從神器選擇階段選擇「七里靴」
[ ] 2. 確認選擇
[ ] 3. 觀察是否立即抽牌（不顯示選項面板）
[ ] 4. 驗證手牌數量 +1
[ ] 5. 驗證市場卡牌數量 -1

**實際結果**: _待測試_

---

### F.3 透特之書 (Book of Thoth) - ACTION 類型

**測試狀態**: 🔄 待測試

**預期行為**:
1. 在行動階段顯示「升級石頭」選項
2. 可選擇要升級的石頭類型
3. 1 火石 → 1 水石，或 1 水石 → 1 風石，或 1 風石 → 1 土石
4. 需要有對應的石頭才能升級
5. 升級後銀行資源正確更新

**關鍵驗證邏輯** (single-player-engine.ts:7.25.0):
```typescript
// v7.25.0: 修正透特之書石頭升級驗證邏輯
validateStoneUpgrade(selectedStones) {
  // 確保有足夠的石頭可以升級
  const { fire, water, wind } = selectedStones
  if (fire && this.bank.fire < fire) return false
  if (water && this.bank.water < water) return false
  if (wind && this.bank.wind < wind) return false
  return true
}
```

**測試步驟**:
[ ] 1. 獲得至少 1 個火石頭
[ ] 2. 選擇「透特之書」神器
[ ] 3. 在行動階段使用神器
[ ] 4. 選擇升級 1 火石 → 1 水石
[ ] 5. 驗證：火石 -1，水石 +1
[ ] 6. 嘗試在沒有石頭時升級（應該失敗）

**實際結果**: _待測試_

---

## 四、結算階段測試（Resolution Phase）

### G.1 RECOVER_CARD 效果（單人模式）

**測試狀態**: 🔄 待測試

**說明**: 單人模式使用 SCORE 階段，但效果類似多人的 RESOLUTION

**預期行為**:
1. 有 RECOVER_CARD 效果的卡牌在結算階段可以返回手牌
2. 必須確認發動效果才能結束回合
3. 顯示「結算效果確認」對話框
4. 選擇要發動的卡牌效果

**關鍵實現** (single-player-engine.ts:7.25.0):
```typescript
// v7.25.0: 結算效果必須發動才能結束回合
if (hasResolutionEffects && !allEffectsActivated) {
  throw new Error('Must activate all resolution effects before ending turn')
}
```

**測試步驟**:
[ ] 1. 打出有 RECOVER_CARD 效果的卡牌到場上
[ ] 2. 進入結算階段
[ ] 3. 嘗試不發動效果直接結束回合（應該失敗）
[ ] 4. 發動效果，將卡牌返回手牌
[ ] 5. 確認效果執行後可以結束回合

**實際結果**: _待測試_

---

### G.2 結算階段強制確認（v7.25.0 新增）

**測試狀態**: 🔄 待測試

**預期行為**:
- 結算階段如有可發動效果，必須處理後才能進入下回合
- 防止玩家誤操作跳過重要效果

**測試步驟**:
[ ] 1. 場上有 RECOVER_CARD 效果卡牌
[ ] 2. 進入結算階段
[ ] 3. 點擊「結束回合」（應該顯示錯誤或警告）
[ ] 4. 發動至少一個效果
[ ] 5. 再次點擊「結束回合」（應該成功）

**實際結果**: _待測試_

---

## 五、分數歷史記錄（單人模式獨有功能）

### H.2 Score History 追蹤

**測試狀態**: 🔄 待測試

**說明**: 單人模式有詳細的分數變化歷史記錄，多人模式沒有此功能

**預期行為**:
1. 點擊「查看歷史紀錄」按鈕
2. 顯示 ScoreHistory 組件
3. 列出所有回合的分數變化
4. 包含：回合數、卡牌名稱、分數變化、總分

**組件版本**: ScoreHistory.tsx v1.0.0

**測試步驟**:
[ ] 1. 玩幾個回合，累積分數變化
[ ] 2. 點擊右上角「查看歷史紀錄」
[ ] 3. 確認顯示完整的分數歷史
[ ] 4. 驗證每一筆記錄的準確性

**實際結果**: _待測試_

---

## 六、多人模式基準測試

### M.1 多人遊戲基本流程

**測試狀態**: ⏸️ 待開始（先完成單人測試）

**測試 URL**: http://localhost:5173/the-vale-of-eternity/multiplayer

**預期功能**:
- Firebase 即時同步
- 多玩家大廳
- 回合制遊戲邏輯
- 效果處理器 (effect-processor.ts v3.3.0)

---

## 測試進度總結

### 已完成
- ✅ 頁面載入測試
- ✅ 遊戲初始化測試
- ✅ Console 日誌檢查
- ✅ UI 元素驗證

### 待測試（優先級高）
- 🔄 閃電效果系統（Ifrit, Imp）
- 🔄 神器系統（香爐、七里靴、透特之書）
- 🔄 結算階段強制確認
- 🔄 分數歷史記錄

### 待測試（次要）
- ⏸️ 多人模式完整流程
- ⏸️ 效能基準測試

---

## 已知問題

1. **React Router 警告** (非致命):
   - `v7_startTransition` future flag
   - `v7_relativeSplatPath` future flag
   - 不影響功能，可在遷移後統一處理

2. **測試模式強制卡牌**:
   - Imp (F002) 強制加入手牌
   - Ifrit (F007) 強制加入市場
   - 這是為了方便測試閃電效果

---

## 下一步行動

1. **繼續手動測試**: 測試閃電效果、神器系統
2. **檢查自動化測試結果**: npm test 輸出
3. **記錄效能數據**: 載入時間、動畫流暢度
4. **建立多人模式測試檢查表**

---

**備註**: 此文件將持續更新，直到所有測試項目完成。
