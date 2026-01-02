# 單人遊戲測試流程規範 v1.0.0

本文件定義所有單人遊戲功能的標準化測試流程，使用 Chrome DevTools MCP 進行自動化測試。

## 測試環境設定

### 前置條件
1. 開發伺服器運行中：`npm run dev`
2. 瀏覽器訪問：`http://localhost:5176/the-vale-of-eternity/`
3. Chrome DevTools MCP 已啟用

### 通用測試步驟

#### 🎮 遊戲初始化流程
```
PROC_INIT_GAME:
  1. 訪問首頁 "/"
  2. 點擊 "單人遊戲" 按鈕
  3. 等待遊戲畫面載入
  4. 確認神器選擇介面顯示
```

#### 🎴 神器選擇流程
```
PROC_SELECT_ARTIFACT:
  1. 等待神器卡片顯示（6張）
  2. 點擊任一神器卡片
  3. 確認卡片被選中（有選中狀態）
  4. 點擊 "確認選擇" 按鈕
  5. 確認進入初始卡片選擇階段
```

#### 📋 初始卡片選擇流程
```
PROC_SELECT_INITIAL_CARDS:
  1. 等待市場顯示 4 張卡片
  2. 點擊第一張卡片（選中）
  3. 點擊第二張卡片（選中）
  4. 確認已選擇 2 張卡片
  5. 點擊 "確認選擇" 按鈕
  6. 確認進入 ACTION 階段
```

#### 🃏 打開手牌面板
```
PROC_OPEN_HAND:
  1. 點擊畫面下方的手牌區域
  2. 確認手牌面板展開
  3. 確認顯示所有手牌
```

---

## 核心功能測試

### TEST_01: 棲息地功能測試

**測試目標：** 驗證從手牌將卡片移動到棲息地的完整流程

**前置條件：** 遊戲已初始化並完成初始卡片選擇

#### 測試步驟

```yaml
test_id: TEST_01
test_name: "手牌棄置到棲息地"
category: "卡片操作"

steps:
  - step: 1
    action: "執行 PROC_INIT_GAME"
    verify: "遊戲初始化成功"

  - step: 2
    action: "執行 PROC_SELECT_ARTIFACT"
    verify: "神器選擇完成"

  - step: 3
    action: "執行 PROC_SELECT_INITIAL_CARDS"
    verify: "進入 ACTION 階段，手牌有 2 張卡"

  - step: 4
    action: "執行 PROC_OPEN_HAND"
    verify: "手牌面板顯示 2 張卡"

  - step: 5
    action: "記錄第一張卡片名稱（存為 CARD_NAME）"
    verify: "成功讀取卡片名稱"

  - step: 6
    action: "點擊第一張手牌"
    verify: "卡片被選中，顯示操作面板"

  - step: 7
    action: "確認操作面板包含『棲息地』按鈕"
    verify: "按鈕存在且可點擊"

  - step: 8
    action: "點擊『棲息地』按鈕"
    verify: "卡片從手牌消失"

  - step: 9
    action: "檢查手牌數量"
    verify: "手牌剩餘 1 張"

  - step: 10
    action: "檢查場上區域右側棲息地顯示"
    verify: "棲息地區域顯示『棲息地 1』標籤"

  - step: 11
    action: "檢查棲息地中的卡片名稱"
    verify: "卡片名稱 = CARD_NAME"

expected_result:
  - hand_count: 1
  - sanctuary_count: 1
  - card_location: "sanctuary"
```

---

### TEST_02: 棄牌堆功能測試

**測試目標：** 驗證從手牌棄置卡片到棄牌堆的完整流程

```yaml
test_id: TEST_02
test_name: "手牌棄置到棄牌堆"
category: "卡片操作"

steps:
  - step: 1
    action: "執行 PROC_INIT_GAME"
    verify: "遊戲初始化成功"

  - step: 2
    action: "執行 PROC_SELECT_ARTIFACT"
    verify: "神器選擇完成"

  - step: 3
    action: "執行 PROC_SELECT_INITIAL_CARDS"
    verify: "進入 ACTION 階段，手牌有 2 張卡"

  - step: 4
    action: "執行 PROC_OPEN_HAND"
    verify: "手牌面板顯示 2 張卡"

  - step: 5
    action: "記錄第一張卡片名稱（存為 CARD_NAME）"
    verify: "成功讀取卡片名稱"

  - step: 6
    action: "點擊第一張手牌"
    verify: "卡片被選中，顯示操作面板"

  - step: 7
    action: "確認操作面板包含『棄置』按鈕"
    verify: "按鈕存在且可點擊"

  - step: 8
    action: "點擊『棄置』按鈕"
    verify: "卡片從手牌消失"

  - step: 9
    action: "檢查手牌數量"
    verify: "手牌剩餘 1 張"

  - step: 10
    action: "點擊左上角棄牌堆圖示"
    verify: "棄牌堆 Modal 顯示"

  - step: 11
    action: "檢查棄牌堆中的卡片"
    verify: "棄牌堆有 1 張卡，名稱 = CARD_NAME"

expected_result:
  - hand_count: 1
  - discard_count: 1
  - modal_shown: true
```

---

### TEST_03: 場上卡片回手測試

**測試目標：** 驗證從場上將卡片返回手牌的功能

```yaml
test_id: TEST_03
test_name: "場上卡片回手"
category: "卡片操作"

steps:
  - step: 1
    action: "執行 PROC_INIT_GAME + PROC_SELECT_ARTIFACT + PROC_SELECT_INITIAL_CARDS"
    verify: "進入 ACTION 階段"

  - step: 2
    action: "點擊手牌第一張卡片"
    verify: "卡片選中"

  - step: 3
    action: "點擊『召喚』按鈕"
    verify: "卡片移到場上"

  - step: 4
    action: "記錄場上卡片數量（存為 FIELD_COUNT_BEFORE）"
    verify: "FIELD_COUNT_BEFORE = 1"

  - step: 5
    action: "記錄手牌數量（存為 HAND_COUNT_BEFORE）"
    verify: "HAND_COUNT_BEFORE = 1"

  - step: 6
    action: "點擊場上的卡片"
    verify: "卡片被選中，顯示操作按鈕"

  - step: 7
    action: "確認有『回手』按鈕"
    verify: "按鈕存在"

  - step: 8
    action: "點擊『回手』按鈕"
    verify: "卡片從場上消失"

  - step: 9
    action: "檢查場上卡片數量"
    verify: "場上卡片 = 0"

  - step: 10
    action: "檢查手牌數量"
    verify: "手牌 = 2"

expected_result:
  - field_count: 0
  - hand_count: 2
```

---

### TEST_04: 從棄牌堆拿牌測試

**測試目標：** 驗證從棄牌堆將卡片拿回手牌的功能

```yaml
test_id: TEST_04
test_name: "從棄牌堆拿牌回手"
category: "卡片操作"

prerequisite:
  - discard_pile_count: ">= 1"

steps:
  - step: 1
    action: "執行 TEST_02 前 8 步"
    verify: "手牌有 1 張，棄牌堆有 1 張"

  - step: 2
    action: "點擊左上角棄牌堆圖示"
    verify: "棄牌堆 Modal 顯示"

  - step: 3
    action: "點擊棄牌堆中的卡片"
    verify: "卡片被選中，顯示『拿回手牌』按鈕"

  - step: 4
    action: "點擊『拿回手牌』按鈕"
    verify: "Modal 關閉，卡片回到手牌"

  - step: 5
    action: "檢查手牌數量"
    verify: "手牌 = 2"

  - step: 6
    action: "重新開啟棄牌堆 Modal"
    verify: "棄牌堆為空"

expected_result:
  - hand_count: 2
  - discard_count: 0
```

---

### TEST_05: 區域指示物切換測試

**測試目標：** 驗證區域指示物（Area Bonus）的切換功能

```yaml
test_id: TEST_05
test_name: "區域指示物切換 (0→1→2→0)"
category: "遊戲機制"

steps:
  - step: 1
    action: "執行遊戲初始化至 ACTION 階段"
    verify: "進入 ACTION 階段"

  - step: 2
    action: "檢查當前區域指示物顯示"
    verify: "初始值 = 0"

  - step: 3
    action: "點擊區域指示物切換按鈕"
    verify: "區域指示物 = +1"

  - step: 4
    action: "再次點擊切換按鈕"
    verify: "區域指示物 = +2"

  - step: 5
    action: "第三次點擊切換按鈕"
    verify: "區域指示物 = 0（循環）"

  - step: 6
    action: "檢查場地格子數量變化"
    verify: "格子數隨 bonus 改變"

expected_result:
  - area_bonus_cycle: [0, 1, 2, 0]
  - field_size_updates: true
```

---

### TEST_06: 抽牌功能測試

**測試目標：** 驗證從牌庫抽牌的功能

```yaml
test_id: TEST_06
test_name: "從牌庫抽牌"
category: "基本操作"

steps:
  - step: 1
    action: "執行 PROC_INIT_GAME + PROC_SELECT_ARTIFACT + PROC_SELECT_INITIAL_CARDS"
    verify: "進入 ACTION 階段，手牌 2 張"

  - step: 2
    action: "點擊『跳過』按鈕"
    verify: "進入下一回合 DRAW 階段"

  - step: 3
    action: "檢查手牌數量（記錄為 HAND_BEFORE）"
    verify: "HAND_BEFORE = 2"

  - step: 4
    action: "點擊『抽牌』按鈕"
    verify: "抽到 1 張卡"

  - step: 5
    action: "檢查手牌數量"
    verify: "手牌 = HAND_BEFORE + 1 = 3"

  - step: 6
    action: "確認階段自動轉換為 ACTION"
    verify: "階段顯示為『行動階段』"

expected_result:
  - hand_count: 3
  - phase: "ACTION"
```

---

### TEST_07: 召喚卡片測試

**測試目標：** 驗證從手牌召喚卡片到場上的功能

```yaml
test_id: TEST_07
test_name: "召喚卡片到場上"
category: "基本操作"

steps:
  - step: 1
    action: "執行遊戲初始化至 ACTION 階段"
    verify: "手牌有 2 張卡"

  - step: 2
    action: "記錄第一張卡片的召喚費用（COST）"
    verify: "成功讀取費用"

  - step: 3
    action: "檢查當前石頭數量（STONES）"
    verify: "STONES >= COST"

  - step: 4
    action: "點擊第一張手牌"
    verify: "卡片被選中"

  - step: 5
    action: "確認『召喚』按鈕可用"
    verify: "按鈕不是 disabled"

  - step: 6
    action: "點擊『召喚』按鈕"
    verify: "卡片移到場上"

  - step: 7
    action: "檢查手牌數量"
    verify: "手牌 = 1"

  - step: 8
    action: "檢查場上卡片數量"
    verify: "場上 = 1"

  - step: 9
    action: "檢查石頭數量"
    verify: "石頭 = STONES - COST"

expected_result:
  - hand_count: 1
  - field_count: 1
  - stones_deducted: true
```

---

### TEST_08: 遊戲結束測試

**測試目標：** 驗證手動結束遊戲並計算分數

```yaml
test_id: TEST_08
test_name: "手動結束遊戲並計分"
category: "遊戲流程"

steps:
  - step: 1
    action: "執行遊戲初始化至 ACTION 階段"
    verify: "遊戲進行中"

  - step: 2
    action: "召喚 1-2 張卡片到場上"
    verify: "場上有卡片"

  - step: 3
    action: "點擊『結束遊戲』按鈕"
    verify: "顯示確認對話框"

  - step: 4
    action: "點擊確認"
    verify: "遊戲結束，顯示分數畫面"

  - step: 5
    action: "檢查分數畫面內容"
    verify: "包含：基礎分數、效果加成、石頭價值、總分"

  - step: 6
    action: "確認可以查看詳細分數分解"
    verify: "分數分解區塊存在"

expected_result:
  - game_ended: true
  - score_modal_shown: true
  - score_breakdown_available: true
```

---

## Chrome DevTools 測試腳本範例

### 範例：TEST_01 自動化腳本

```javascript
// TEST_01: 棲息地功能測試
async function test01_sanctuary() {
  console.log('=== TEST_01: 棲息地功能測試 ===');

  // Step 1-3: 遊戲初始化
  await initGame();
  await selectArtifact();
  await selectInitialCards();

  // Step 4: 打開手牌
  const handPanel = await page.waitForSelector('[data-testid="hand-panel"]');
  await handPanel.click();

  // Step 5: 記錄第一張卡片名稱
  const firstCard = await page.waitForSelector('[data-testid="hand-card-0"]');
  const cardName = await firstCard.evaluate(el =>
    el.querySelector('.card-name').textContent
  );
  console.log('Card name:', cardName);

  // Step 6: 點擊第一張卡片
  await firstCard.click();

  // Step 7: 確認操作面板
  const actionPanel = await page.waitForSelector('[data-testid="card-action-panel"]');
  const sanctuaryBtn = await actionPanel.querySelector('[data-testid="action-棲息地"]');
  assert(sanctuaryBtn, '棲息地按鈕不存在');

  // Step 8: 點擊棲息地按鈕
  await sanctuaryBtn.click();

  // Step 9: 檢查手牌數量
  const handCards = await page.querySelectorAll('[data-testid^="hand-card-"]');
  assert(handCards.length === 1, `手牌數量錯誤: ${handCards.length}`);

  // Step 10-11: 檢查棲息地
  const sanctuaryArea = await page.waitForSelector('[data-testid="sanctuary-area"]');
  const sanctuaryCount = await sanctuaryArea.evaluate(el =>
    el.querySelector('.sanctuary-count').textContent
  );
  assert(sanctuaryCount === '1', `棲息地數量錯誤: ${sanctuaryCount}`);

  const sanctuaryCard = await sanctuaryArea.querySelector('.card');
  const sanctuaryCardName = await sanctuaryCard.evaluate(el =>
    el.querySelector('.card-name').textContent
  );
  assert(sanctuaryCardName === cardName, '卡片名稱不符');

  console.log('✅ TEST_01 PASSED');
}
```

---

## 測試執行順序

建議按以下順序執行測試：

1. **基礎流程測試**
   - TEST_06: 抽牌功能
   - TEST_07: 召喚卡片

2. **卡片操作測試**
   - TEST_01: 棲息地功能
   - TEST_02: 棄牌堆功能
   - TEST_03: 場上卡片回手
   - TEST_04: 從棄牌堆拿牌

3. **進階機制測試**
   - TEST_05: 區域指示物切換

4. **遊戲流程測試**
   - TEST_08: 遊戲結束計分

---

## 測試報告格式

每次測試執行後，應生成以下格式的報告：

```yaml
test_run:
  date: "2026-01-02"
  version: "v7.5.1"
  environment: "localhost:5176"

results:
  - test_id: TEST_01
    status: PASS
    duration: "12.5s"
    errors: []

  - test_id: TEST_02
    status: FAIL
    duration: "8.3s"
    errors:
      - step: 10
        message: "棄牌堆 Modal 未顯示"
        screenshot: "error_test02_step10.png"

summary:
  total: 8
  passed: 7
  failed: 1
  success_rate: 87.5%
```

---

## 版本更新日誌

- v1.0.0 (2026-01-02): 初始版本，包含 8 個核心測試用例
