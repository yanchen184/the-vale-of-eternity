# The Vale of Eternity - 永恆之谷

## MVP 1.0 規格文件索引

> 最後更新：2024-12-30

---

## 文件清單

| 文件 | 說明 | 大小 |
|------|------|------|
| [MVP_SPEC.md](./MVP_SPEC.md) | MVP 功能規格書 | 14 KB |
| [GAME_ENGINE_SPEC.md](./GAME_ENGINE_SPEC.md) | 遊戲引擎規格書 | 34 KB |
| [CARD_DATA_SPEC.md](./CARD_DATA_SPEC.md) | 卡片資料規格書 | 25 KB |
| [UI_SPEC.md](./UI_SPEC.md) | UI/UX 規格書 | 25 KB |
| [TEST_SPEC.md](./TEST_SPEC.md) | 測試規格書 | 34 KB |

---

## 快速導覽

### 1. MVP_SPEC.md - MVP 功能規格

定義 MVP 1.0 的功能範圍與驗收標準。

**主要內容**：
- MVP 目標與範圍
- 簡化遊戲規則（3 階段流程）
- 20 張 MVP 卡片清單
- 效果類型定義
- 驗收標準（功能/UI/技術）
- 開發里程碑

**閱讀對象**：產品經理、開發者、測試人員

---

### 2. GAME_ENGINE_SPEC.md - 遊戲引擎規格

定義遊戲核心邏輯與狀態管理。

**主要內容**：
- 遊戲狀態機設計
- 資料結構定義（GameState, PlayerState, CardInstance）
- 三階段詳細流程（狩獵、行動、結算）
- 效果系統設計
- API 介面設計
- 錯誤處理策略

**閱讀對象**：後端開發者、遊戲邏輯開發者

---

### 3. CARD_DATA_SPEC.md - 卡片資料規格

定義卡片資料結構與 20 張 MVP 卡片完整資料。

**主要內容**：
- 卡片模板資料結構
- 元素類型與效果類型定義
- 20 張卡片完整資料（含中英文名稱、效果說明）
- 效果系統處理流程
- 牌庫建構規則
- 元素視覺設計

**閱讀對象**：前端開發者、遊戲設計師

---

### 4. UI_SPEC.md - UI/UX 規格

定義遊戲介面設計與互動流程。

**主要內容**：
- 設計原則（功能優先、無動畫）
- 畫面布局（ASCII 示意圖）
- 元件層級結構
- 卡片設計規格
- 互動流程圖
- 元件規格（Props 定義）
- 響應式設計
- data-testid 對照表

**閱讀對象**：前端開發者、UI 設計師

---

### 5. TEST_SPEC.md - 測試規格

定義測試策略與測試案例。

**主要內容**：
- 測試金字塔策略
- 單元測試計畫（50+ 測試案例）
- 整合測試計畫（20-30 測試案例）
- E2E 測試案例（Playwright）
- 驗收測試清單
- 測試執行指令
- CI 整合設定

**閱讀對象**：QA 工程師、開發者

---

## MVP 1.0 核心規格摘要

### 遊戲設定

| 項目 | 規格 |
|------|------|
| 玩家數 | 2 人 |
| 卡片數 | 20 種 x 2 = 40 張 |
| 回合數 | 最多 10 回合 |
| 勝利條件 | 60 分或 10 回合結束 |
| 初始石頭 | 0 顆 |
| 石頭上限 | 3 顆（可增加） |

### 三階段流程

```
狩獵 → 行動 → 結算 → (狩獵 或 結束)
```

1. **狩獵階段**：從市場選擇卡片（拿取或馴服）
2. **行動階段**：馴服手牌、出售手牌或跳過
3. **結算階段**：計算分數、獲得石頭

### 20 張 MVP 卡片

| 家族 | 卡片 |
|------|------|
| 火 (4張) | Hestia, Imp, Firefox, Salamander |
| 水 (4張) | Kappa, Yuki Onna, Undine, Sea Spirit |
| 土 (4張) | Young Forest Spirit, Goblin, Forest Spirit, Gargoyle |
| 風 (4張) | Harpy, Pegasus, Sylph, Tengu |
| 龍 (4張) | Dragon Egg, Ember, Tidal, Boulder |

### 效果類型

| 類型 | 說明 |
|------|------|
| NONE | 無效果 |
| GAIN_STONES | 馴服時獲得石頭 |
| INCREASE_STONE_LIMIT | 增加石頭上限 |
| SCORE_PER_ELEMENT | 每張同元素卡加分 |
| SCORE_PER_DRAGON | 每張龍卡加分 |
| DRAW_FROM_DISCARD | 從棄牌堆抽牌 |

---

## 開發優先順序

### Phase 1：基礎架構 (2 天)
1. 建立 MVP 類型定義
2. 實作 20 張卡片資料
3. 建立遊戲引擎骨架
4. 實作基礎 UI 元件

### Phase 2：遊戲機制 (3 天)
1. 實作狩獵階段
2. 實作行動階段
3. 實作結算階段
4. 實作石頭系統

### Phase 3：效果系統 (2 天)
1. 實作即時效果
2. 實作永久效果
3. 實作計分效果

### Phase 4：遊戲流程 (2 天)
1. 實作回合流轉
2. 實作勝利判定
3. 實作遊戲結束畫面

### Phase 5：測試與修正 (1 天)
1. 功能測試
2. Bug 修正
3. 驗收確認

---

## 技術棧

- **前端框架**: React 18.3 + TypeScript
- **建構工具**: Vite 6
- **樣式**: Tailwind CSS 3.4
- **狀態管理**: Zustand 5
- **測試**: Vitest + Playwright

---

## 相關連結

- 專案首頁: https://yanchen184.github.io/the-vale-of-eternity/
- GitHub: https://github.com/yanchen184/the-vale-of-eternity
- 遊戲規則參考: 桌遊 The Vale of Eternity

---

> **Version**: MVP 1.0.0
> **Last Updated**: 2024-12-30
