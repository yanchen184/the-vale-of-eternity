# 測試基準線建立進度總結

**更新時間**: 2026-01-04 11:18
**狀態**: 進行中 🔄

---

## 📊 整體進度

```
Phase 0: 準備和基準測試
├── ✅ 備份現有代碼 (backup/single-player-engine-original)
├── ✅ 清理廢棄代碼 (game-engine.ts 已刪除)
├── 🔄 自動化測試執行中 (npm test)
├── ✅ 手動測試記錄文件已建立
├── ⏸️ 閃電效果測試 (待繼續)
├── ⏸️ 神器系統測試 (待繼續)
├── ⏸️ 多人模式測試 (待開始)
└── ⏸️ 效能基準測試 (待開始)
```

**完成度**: 30% (3/10)

---

## ✅ 已完成項目

### 1. 代碼備份與清理
- **備份分支**: `backup/single-player-engine-original`
- **刪除檔案**:
  - `src/lib/game-engine.ts` (1,500+ 行，MVP 雙人引擎)
  - `src/lib/__tests__/game-engine.test.ts` (506 行測試)
- **原因**: 這些是過時的 MVP 代碼，只在測試中使用，與當前系統無關

### 2. 測試文件建立
已建立完整的測試記錄架構：

#### TEST_BASELINE.md
- 120+ 單人模式測試用例
- 60+ 多人模式測試用例
- 效能基準測試指標
- 已知問題追蹤清單

#### MANUAL_TEST_RECORD.md
- **初始載入測試** ✅
  - Vite 啟動時間: 194ms
  - 所有組件版本正確載入
  - Console 無致命錯誤

- **遊戲初始化測試** ✅
  - 自動進入神器選擇階段 (DRAW phase)
  - Imp (F002) 強制加入手牌 (測試用)
  - Ifrit (F007) 強制加入市場 (測試用)
  - UI 元素全部正確顯示

### 3. 環境驗證
- ✅ Vite 開發伺服器正常運行
- ✅ Playwright 自動化測試工具可用
- ✅ 遊戲頁面正確渲染
- ✅ 版本號輸出正常

---

## 🔄 進行中項目

### 自動化測試執行
```bash
# 命令: npm test > test-baseline-before-migration.txt 2>&1
# 狀態: 運行中 (Background ID: c5ffa5)
# 預計: 收集所有單元測試和集成測試的基準結果
```

**為什麼要等待**:
- 這是遷移前的完整測試快照
- 確保沒有既存的測試失敗
- 為後續對比提供基準線

---

## ⏸️ 待測試項目

### 優先級 1: 單人模式獨有功能

#### 閃電效果系統
這是單人模式的關鍵特性，多人模式目前沒有實現：

1. **Ifrit (F007) 閃電效果**
   - 觸發時機: 馴服 Ifrit 時
   - 效果: 對所有場上生物造成 2 點傷害
   - 視覺: LightningEffect 組件動畫
   - 測試狀態: ⏸️ 需要先進入狩獵階段

2. **Imp (F002) 閃電效果**
   - 觸發時機: 打出 Imp 時
   - 效果: 立即獲得 1 個火石頭
   - 視覺: 閃電動畫 + 石頭飛行動畫
   - 測試狀態: ⏸️ 需要先進入行動階段

#### 神器系統完整測試
測試三種不同類型的神器：

1. **ACTION 類型 - 香爐**
   - 行動階段可使用
   - 顯示支付選項面板
   - 支付後執行效果

2. **INSTANT 類型 - 七里靴**
   - v9.14.0 關鍵修正: 直接執行，不顯示選項
   - 確認後立即抽牌
   - 不需要額外確認

3. **ACTION 類型 - 透特之書**
   - v7.25.0 關鍵修正: 石頭升級驗證邏輯
   - 測試升級路徑: 火→水→風→土
   - 測試不足石頭時的驗證

#### 結算階段強制確認
- v7.25.0 新增: 結算效果必須發動才能結束回合
- 測試 RECOVER_CARD 效果卡牌
- 驗證強制確認機制

#### 分數歷史記錄
- 單人模式獨有的 ScoreHistory 組件 (v1.0.0)
- 多人模式沒有此功能
- 需要記錄詳細的分數變化

### 優先級 2: 多人模式基準測試

需要測試的內容：
- Firebase 即時同步
- 多玩家大廳功能
- 回合制邏輯
- effect-processor.ts (v3.3.0) 效果處理

### 優先級 3: 效能基準測試

需要記錄的指標：
- 頁面載入時間
- 動畫流暢度 (FPS)
- 記憶體使用量
- Firebase 同步延遲 (多人模式)

---

## 🔍 關鍵發現

### 版本資訊
- **Single Player Engine**: v7.25.0
  - 最新修正: "Resolution effects must be activated"
  - 關鍵功能: 結算效果強制確認

- **Multiplayer Game**: v4.14.0
  - 最新修正: "Resolution phase implemented"
  - 關鍵功能: 使用 effect-processor.ts

- **SinglePlayerGame 組件**: v9.14.0
  - 最新修正: "Incense Burner payment selection"
  - 關鍵功能: 七里靴直接執行，不顯示選項

### 測試模式卡牌
為了方便測試閃電效果，代碼中強制加入：
- Imp (F002) → 手牌
- Ifrit (F007) → 市場

```typescript
[SinglePlayerEngine] [TEST] Forced Imp (F002) to initial hand for testing
[SinglePlayerEngine] [TEST] Forced F007 to market for testing
```

### 已知非致命問題
React Router v7 未來標誌警告：
- `v7_startTransition`
- `v7_relativeSplatPath`
- 不影響功能，可在遷移後處理

---

## 📋 下一步行動

### 立即待辦
1. ⏳ **等待自動化測試完成**
   - 監控 Background Bash ID: c5ffa5
   - 檢查 test-baseline-before-migration.txt
   - 確認所有測試通過

2. 🎮 **繼續手動測試**
   - 測試閃電效果 (Ifrit + Imp)
   - 測試神器系統 (香爐、七里靴、透特之書)
   - 測試結算階段強制確認
   - 測試分數歷史記錄

3. 📊 **建立多人模式檢查表**
   - 參照 TEST_BASELINE.md 的多人部分
   - 實際運行多人遊戲測試
   - 記錄 Firebase 同步狀況

4. ⚡ **效能基準測試**
   - 記錄載入時間
   - 測試動畫流暢度
   - 監控記憶體使用

### 長期計劃
完成 Phase 0 後，進入 Phase 1:
- 擴展 multiplayer-game.ts 支援單人模式
- 將閃電效果遷移到 effect-processor.ts
- 統一使用 Firebase 作為狀態管理

---

## 📝 重要備註

### 為什麼要建立詳細基準線？
1. **功能完整性**: 確保遷移後沒有任何功能損失
2. **效能對比**: 遷移後可以比較效能變化
3. **回歸測試**: 作為未來測試的參考標準
4. **風險管理**: 8,627 行代碼的大規模重構，必須謹慎

### 測試優先級說明
1. **單人模式獨有功能優先**: 因為這些是遷移的重點
2. **多人模式作為參考**: 了解目標架構
3. **效能數據作為輔助**: 驗證遷移不會降低效能

---

**測試記錄文件**:
- `TEST_BASELINE.md` - 完整測試用例清單
- `MANUAL_TEST_RECORD.md` - 手動測試執行記錄
- `test-baseline-before-migration.txt` - 自動化測試輸出（生成中）

**下次更新**: 自動化測試完成後
