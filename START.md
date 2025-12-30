# The Vale of Eternity - 永恆之谷

## 專案概述

《永恆之谷》是一款單人卡牌收集遊戲，玩家扮演召喚師收集 70 張神話生物來累積分數。本專案採用 **Stone Economy System**（石頭經濟系統）作為核心資源管理機制，提供策略性的卡片組合與分數最大化玩法。

### 版本資訊
- **當前版本**: MVP v1.1.0
- **更新日期**: 2025-12-30
- **遊戲模式**: 單人模式 + 多人線上模式 (2-4人)
- **卡片總數**: 70 張（5 個家族）

## 技術棧

- **前端框架**: React 18.3 + TypeScript
- **建構工具**: Vite 6
- **樣式**: Tailwind CSS 3.4
- **狀態管理**: Zustand 5
- **路由**: React Router 6
- **即時資料庫**: Firebase Realtime Database（僅用於數據存儲）
- **動畫**: GSAP
- **測試**: MCP Chrome DevTools, Playwright（規劃中）

## 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

瀏覽器訪問: http://localhost:5173/the-vale-of-eternity/

### 建構生產版本

```bash
npm run build
```

### 預覽生產版本

```bash
npm run preview
```

## 專案結構

```
src/
├── components/          # React 元件
│   ├── ui/             # 基礎 UI 元件 (Button, Modal, Input, Toast)
│   ├── game/           # 遊戲相關元件 (待開發)
│   └── lobby/          # 大廳相關元件 (待開發)
├── lib/                # 工具函數
│   ├── firebase.ts     # Firebase 初始化
│   └── utils.ts        # 通用工具
├── stores/             # Zustand 狀態管理
│   ├── useGameStore.ts # 遊戲狀態
│   ├── useLobbyStore.ts # 大廳狀態
│   └── useToastStore.ts # Toast 通知
├── types/              # TypeScript 類型定義
│   ├── game.ts         # 遊戲核心類型
│   ├── cards.ts        # 卡片類型
│   └── player.ts       # 玩家類型
├── data/               # 遊戲資料
│   ├── constants.ts    # 遊戲常數
│   └── cards/          # 卡片資料 (待建立)
├── services/           # Firebase 服務層
│   ├── auth.ts         # 認證服務
│   ├── database.ts     # 資料庫服務
│   └── game.ts         # 遊戲邏輯服務
├── pages/              # 頁面元件
│   ├── Home.tsx        # 首頁
│   ├── Lobby.tsx       # 遊戲大廳
│   ├── Game.tsx        # 遊戲頁面
│   └── Tutorial.tsx    # 教學頁面
├── hooks/              # 自訂 React Hooks (待開發)
├── App.tsx             # 應用主入口
├── main.tsx            # 應用進入點
└── index.css           # 全域樣式
```

## ✨ MVP v1.0 已完成功能

### 1. 卡片系統 (v3.0.0)
- ✅ **70 張基礎卡片** - 完整實現所有卡片資料
  - 🔥 Fire Family: 15 張
  - 💧 Water Family: 15 張
  - 🌳 Earth Family: 15 張
  - 🌸 Wind Family: 15 張
  - 🐉 Dragon Family: 10 張

- ✅ **Stone Economy System** - 石頭經濟系統
  - 7 種石頭類型：1️⃣ (1點), 3️⃣ (3點), 6️⃣ (6點), 💧 (水), 🔥 (火), 🌳 (土), 🌸 (風)
  - 38 種效果類型：EARN_STONES, DRAW_CARD, EXCHANGE_STONES, FREE_SUMMON...
  - 3 種觸發時機：⚡ ON_TAME（馴服時）, ∞ PERMANENT（永久）, ⌛ ON_SCORE（計分時）

### 2. 卡片圖庫頁面
- ✅ **70 張卡片圖片** - 所有卡片圖片已整合
- ✅ **卡片展示** - Grid 佈局展示所有卡片
- ✅ **元素篩選** - 按 Fire/Water/Earth/Wind/Dragon 篩選
- ✅ **卡片放大** - 點擊卡片查看完整資訊
- ✅ **響應式設計** - 支援各種螢幕尺寸

### 3. 遊戲流程設計
- ✅ **Game Flow Diagram** - 完整的 Mermaid 流程圖（見 GAME_FLOW.md）
- ✅ **單人模式** - 簡化版遊戲流程（輸入名字即可開始）
- ✅ **石頭管理** - 獲得、支付、交換、增值機制設計
- ✅ **計分系統** - 基礎分數 + 效果加成 + 石頭價值

### 4. 技術文檔
- ✅ **CARD_EFFECTS_ANALYSIS.md** - 完整的 70 張卡片效果分析
- ✅ **CARD_SYSTEM_UPDATE_v3.md** - 卡片系統 v3.0.0 更新總結
- ✅ **GAME_FLOW.md** - 遊戲流程圖與階段說明
- ✅ **SDD.md** - 系統設計文檔

### 5. 測試報告
**測試工具**: MCP Chrome DevTools
**測試日期**: 2025-12-30
**測試範圍**: 卡片圖庫頁面

| 測試項目 | 結果 | 說明 |
|---------|------|------|
| 首頁載入 | ✅ PASS | 正常顯示 "The Vale of Eternity" |
| 導航到卡片圖庫 | ✅ PASS | "查看所有卡片" 按鈕功能正常 |
| 70 張卡片顯示 | ✅ PASS | Fire 15, Water 15, Earth 15, Wind 15, Dragon 10 |
| 卡片圖片載入 | ✅ PASS | 所有圖片正確顯示 |
| 卡片點擊放大 | ✅ PASS | Modal 彈窗正常運作 |
| Modal 關閉 | ✅ PASS | 點擊 X 按鈕正常關閉 |
| Console 錯誤 | ✅ PASS | 無錯誤訊息 |
| 響應式設計 | ✅ PASS | Grid 佈局自適應 |

**總體評估**: 🎉 **所有測試通過，卡片圖庫功能完整可用**

## 遊戲規則

### 五大家族
- 🔥 **Fire** - 石頭生成強，資源累積快
- 💧 **Water** - 抽牌能力強，手牌循環快
- 🌳 **Earth** - 高分數卡片，免費召喚機制
- 🌸 **Wind** - 費用降低，效果複製
- 🐉 **Dragon** - 高費高分，強力終結卡

### 遊戲流程（單人模式）
1. **初始化** - 輸入玩家名稱 → 建立 70 張牌庫 → 洗牌 → 抽 5 張手牌 → 設置 4 張市場卡
2. **主回合** - 抽 1 張卡 → 選擇行動（馴服生物 / 跳過 / 結束遊戲）
3. **馴服流程** - 選卡 → 檢查石頭 → 支付費用 → 放置場上 → 觸發效果
4. **計分階段** - 基礎分數 + ON_SCORE 效果 + PERMANENT 加成 + 剩餘石頭價值

### Stone Economy System
**核心概念**: 石頭是遊戲的主要資源，用於召喚卡片和計分

**石頭類型**:
- **數字石頭**: 1️⃣ (1點), 3️⃣ (3點), 6️⃣ (6點) - 通用貨幣
- **元素石頭**: 💧 (水), 🔥 (火), 🌳 (土), 🌸 (風) - 特殊價值

**石頭操作**:
- **Earn** - 從卡片效果獲得石頭
- **Discard** - 棄掉石頭換取分數
- **Exchange** - 轉換石頭類型（例：3 = 💧）
- **Increase Value** - 永久提升石頭價值（例：💧 價值 +1）

**關鍵卡片**:
- F002 Imp - 獲得 3 個 1 點石頭 + 可回收
- W001 Yuki Onna - 棄掉所有石頭換分數
- E014 Stone Golem - 所有石頭轉換為 6 點
- A008 Genie Exalted - 複製其他卡的即時效果

## 可用腳本

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建構生產版本 |
| `npm run preview` | 預覽生產版本 |
| `npm run lint` | ESLint 檢查 |
| `npm run test` | 執行單元測試 |
| `npm run test:e2e` | 執行 E2E 測試 |
| `npm run format` | Prettier 格式化 |

## 部署

專案已配置 GitHub Actions 自動部署到 GitHub Pages。

推送到 `main` 分支即自動部署:

```bash
git add .
git commit -m "feat: 功能描述"
git push origin main
```

## 📚 文檔資源

| 文件 | 說明 | 檔案位置 |
|------|------|---------|
| **GAME_FLOW.md** | 遊戲流程 Mermaid 圖 + 階段詳解 | 專案根目錄 |
| **CARD_EFFECTS_ANALYSIS.md** | 70 張卡片完整效果分析 | 專案根目錄 |
| **CARD_SYSTEM_UPDATE_v3.md** | 卡片系統 v3.0.0 更新總結 | 專案根目錄 |
| **SDD.md** | 系統設計文檔（System Design Document） | 專案根目錄 |
| **types/cards.ts** | 卡片類型定義（StoneType, EffectType, CardEffect） | src/types/ |
| **data/cards/** | 5 個家族卡片資料檔案 | src/data/cards/ |

## 版本歷史

### MVP v1.1.0 (2025-12-30) - 多人模式實現
✅ **新增功能**:
- [x] **多人線上模式** - 支援 2-4 人即時對戰
- [x] **Firebase Realtime Database** - 遊戲狀態同步
- [x] **Snake Draft 選卡機制** - Hunting Phase (6 張市場)
- [x] **Action Phase 完整實現** - Tame / Sell / Pass
- [x] **ON_TAME 效果處理** - 即時效果系統
- [x] **石頭經濟系統** - 獲得、支付、交換機制
- [x] **PERMANENT 效果系統** - 永久被動效果
- [x] **計分系統** - ON_SCORE + 石頭價值計算
- [x] **多人大廳 UI** - 建立/加入房間介面

**核心服務** (src/services/):
- `multiplayer-game.ts` (v3.1.0) - 房間管理、遊戲流程
- `effect-processor.ts` (v3.1.0) - 效果處理引擎
- `score-calculator.ts` (v3.1.0) - 計分系統

### MVP v1.0.0 (2025-12-30)
✅ **已完成**:
- [x] 專案初始化與基礎建設
- [x] 70 張卡片資料完整實現（v3.0.0）
- [x] Stone Economy System 設計
- [x] 卡片圖片整合（70 張 WebP 格式）
- [x] 卡片圖庫頁面（Grid 佈局、篩選、放大）
- [x] 遊戲流程 Mermaid 圖
- [x] 單人模式設計
- [x] MCP Chrome DevTools 測試通過
- [x] 技術文檔建立（4 個 Markdown 文檔）

⏳ **規劃中**:
- [ ] 遊戲房間 UI（場上、手牌、市場顯示）
- [ ] 即時動畫效果（GSAP）
- [ ] 音效系統
- [ ] Playwright E2E 測試
- [ ] 更多效果類型實現（38 種中的進階效果）

## 已知限制

### MVP v1.0 階段限制
1. **遊戲邏輯未實現** - 目前僅有卡片資料與圖庫展示，實際遊戲邏輯待開發
2. **單人模式** - 目前設計為單人模式，多人對戰功能規劃中
3. **無 AI 對手** - 單人模式暫無 AI 互動
4. **無音效/動畫** - 基礎功能優先，音效與動畫待後續加入
5. **Firebase Auth 未啟用** - 簡化版本採用名字輸入即可開始

### 技術債務
- [ ] 測試檔案尚未更新（使用舊的 EffectType 名稱）
- [ ] effect-system.ts 需要實現 38 種效果處理邏輯
- [ ] game-utils.ts 需要實現石頭經濟系統邏輯
- [ ] UI 元件需要顯示新的多效果資訊

## 下一步計劃

### 短期（MVP v1.1）
1. **實現核心遊戲邏輯**
   - 石頭經濟系統（獲得、支付、交換、增值）
   - 38 種效果類型處理
   - 卡片馴服流程
   - 計分系統

2. **開發遊戲 UI**
   - 手牌區域
   - 場上區域
   - 市場區域
   - 石頭池顯示
   - 遊戲狀態面板

3. **測試與優化**
   - 更新測試檔案
   - E2E 測試所有卡片效果
   - 效能優化

### 中期（MVP v2.0）
1. UI/UX 優化（動畫、音效）
2. 成就系統
3. 卡片收集進度追蹤
4. 排行榜系統

### 長期（Full Game）
1. 多人遊戲支援
2. AI 對手
3. 擴充卡包（28 張規劃中）
4. 賽季系統
5. 社交功能

## Firebase 配置

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBVkl66EYpcIaSM46XhQZB_yWwVVd8dUhw",
  authDomain: "the-vale-of-eternity.firebaseapp.com",
  databaseURL: "https://the-vale-of-eternity-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-vale-of-eternity",
  storageBucket: "the-vale-of-eternity.firebasestorage.app",
  messagingSenderId: "465091637532",
  appId: "1:465091637532:web:e9ffb9e91532d6ea06cad9",
  measurementId: "G-8W75K5SH0Y"
}
```
