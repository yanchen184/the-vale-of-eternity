# UI/UX 規格書

> **The Vale of Eternity - 永恆之谷**
> 版本：MVP 1.0
> 最後更新：2024-12-30

---

## 1. 設計原則

### 1.1 MVP 設計目標

1. **功能優先**：確保所有遊戲功能可操作
2. **清晰易讀**：資訊層級分明，一目了然
3. **操作簡單**：最少點擊完成動作
4. **無動畫**：使用簡單 CSS transition 替代
5. **響應式**：支援 1280x720 以上解析度

### 1.2 視覺風格

- **主題色調**：深色背景 + 元素色彩
- **字體**：系統字體 (無自訂字體)
- **卡片風格**：圓角矩形 + 元素色邊框
- **間距**：使用 Tailwind CSS 預設間距

### 1.3 無障礙設計

- 色彩對比度符合 WCAG AA 標準
- 所有互動元素有 focus 狀態
- 使用語義化 HTML
- 添加適當的 aria-label

---

## 2. 畫面布局

### 2.1 主遊戲畫面 (GameBoard)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [遊戲資訊列] 回合 5/10 | 狩獵階段 | 玩家 1 的回合                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     對手區域 (Player 2)                        │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ 場地 (最多 12 張)                                        │  │  │
│  │  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐              │  │  │
│  │  │ │卡片│ │卡片│ │卡片│ │卡片│ │卡片│ │卡片│              │  │  │
│  │  │ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘              │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │  手牌: 3 張 | 石頭: ⬤⬤⬤ (3/5) | 分數: 35                   │  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                        市場區域                                │  │
│  │      ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │  │
│  │      │        │  │        │  │        │  │        │          │  │
│  │      │ 卡片 1 │  │ 卡片 2 │  │ 卡片 3 │  │ 卡片 4 │          │  │
│  │      │        │  │        │  │        │  │        │          │  │
│  │      │ [拿取] │  │ [拿取] │  │ [拿取] │  │ [拿取] │          │  │
│  │      │ [馴服] │  │ [馴服] │  │ [馴服] │  │ [馴服] │          │  │
│  │      └────────┘  └────────┘  └────────┘  └────────┘          │  │
│  │                    牌庫剩餘: 28 張                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     我方區域 (Player 1)                        │  │
│  │  石頭: ⬤⬤○○○ (2/5) | 分數: 42 | 手牌: 4 張                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ 場地 (最多 12 張)                                        │  │  │
│  │  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │  │  │
│  │  │ │卡片│ │卡片│ │卡片│ │卡片│ │卡片│ │卡片│ │卡片│       │  │  │
│  │  │ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘       │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ 手牌                                                     │  │  │
│  │  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │  │  │
│  │  │ │ 卡片 A │ │ 卡片 B │ │ 卡片 C │ │ 卡片 D │             │  │  │
│  │  │ │[馴服]  │ │[馴服]  │ │[馴服]  │ │[馴服]  │             │  │  │
│  │  │ │[出售]  │ │[出售]  │ │[出售]  │ │[出售]  │             │  │  │
│  │  │ └────────┘ └────────┘ └────────┘ └────────┘             │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [操作面板]                                                 [跳過]   │
│ 提示: 選擇市場中的一張卡片                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 區域尺寸建議

| 區域 | 高度比例 | 說明 |
|------|----------|------|
| 資訊列 | 5% | 固定高度 48px |
| 對手區域 | 25% | 場地 + 資訊 |
| 市場區域 | 25% | 4 張市場卡 |
| 我方區域 | 40% | 場地 + 手牌 |
| 操作面板 | 5% | 固定高度 48px |

---

## 3. 元件層級結構

### 3.1 元件樹

```
App
└── GamePage
    └── GameBoard
        ├── GameHeader
        │   ├── RoundIndicator
        │   ├── PhaseIndicator
        │   └── TurnIndicator
        │
        ├── OpponentArea
        │   ├── PlayerInfo
        │   │   ├── PlayerName
        │   │   ├── StoneCounter
        │   │   └── ScoreDisplay
        │   └── FieldArea
        │       └── CardSlot[] (12)
        │           └── CardDisplay
        │
        ├── MarketArea
        │   ├── MarketTitle
        │   ├── CardSlot[] (4)
        │   │   └── MarketCard
        │   │       ├── CardDisplay
        │   │       └── ActionButtons
        │   │           ├── TakeButton
        │   │           └── TameButton
        │   └── DeckInfo
        │
        ├── PlayerArea
        │   ├── PlayerInfo
        │   │   ├── PlayerName
        │   │   ├── StoneCounter
        │   │   └── ScoreDisplay
        │   ├── FieldArea
        │   │   └── CardSlot[] (12)
        │   │       └── CardDisplay
        │   └── HandArea
        │       └── HandCard[]
        │           ├── CardDisplay
        │           └── ActionButtons
        │               ├── TameButton
        │               └── SellButton
        │
        ├── ActionPanel
        │   ├── ActionHint
        │   └── PassButton
        │
        └── CardDetailModal
            ├── CardImage
            ├── CardInfo
            └── CloseButton
```

### 3.2 元件職責

| 元件 | 職責 | 狀態/Props |
|------|------|------------|
| `GameBoard` | 主遊戲版面容器 | 監聽遊戲狀態 |
| `GameHeader` | 顯示遊戲進度 | round, phase, currentPlayer |
| `OpponentArea` | 對手資訊與場地 | player, isRevealed |
| `MarketArea` | 市場卡片區 | cards, onTake, onTame |
| `PlayerArea` | 我方資訊與場地 | player, onAction |
| `ActionPanel` | 操作提示與按鈕 | hint, onPass |
| `CardDisplay` | 單張卡片顯示 | card, onClick |
| `CardDetailModal` | 卡片詳情彈窗 | card, onClose |

---

## 4. 卡片設計

### 4.1 卡片布局

```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │                     │ │
│ │       [圖片]        │ │  ← 佔高度 50%
│ │                     │ │
│ └─────────────────────┘ │
│ ┌───┐           ┌───┐  │
│ │ 3 │  火狐     │ 3 │  │  ← 費用 / 名稱 / 分數
│ └───┘           └───┘  │
│ ─────────────────────  │
│ 每張火卡 +1 分          │  ← 效果說明
│ ─────────────────────  │
│ [🔥] FIRE              │  ← 元素標籤
└─────────────────────────┘
```

### 4.2 卡片尺寸

| 位置 | 寬度 | 高度 | 比例 |
|------|------|------|------|
| 市場 | 120px | 168px | 5:7 |
| 手牌 | 100px | 140px | 5:7 |
| 場地 | 64px | 90px | 5:7 |
| 詳情 | 240px | 336px | 5:7 |

### 4.3 卡片狀態

```typescript
interface CardDisplayProps {
  card: CardInstance;
  size: 'small' | 'medium' | 'large';
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}
```

| 狀態 | 視覺效果 |
|------|----------|
| 預設 | 正常顯示 |
| 選中 | 邊框加粗 + 輕微放大 |
| 高亮 | 元素色光暈 |
| 禁用 | 降低透明度 + 灰階 |
| 懸停 | 輕微上移 + 陰影 |

### 4.4 卡片元素色彩

```css
/* 火 */
.card-fire {
  --card-color: #EF4444;
  border-color: var(--card-color);
  background: linear-gradient(135deg, rgba(239,68,68,0.1), transparent);
}

/* 水 */
.card-water {
  --card-color: #3B82F6;
  border-color: var(--card-color);
  background: linear-gradient(135deg, rgba(59,130,246,0.1), transparent);
}

/* 土 */
.card-earth {
  --card-color: #84CC16;
  border-color: var(--card-color);
  background: linear-gradient(135deg, rgba(132,204,22,0.1), transparent);
}

/* 風 */
.card-wind {
  --card-color: #A855F7;
  border-color: var(--card-color);
  background: linear-gradient(135deg, rgba(168,85,247,0.1), transparent);
}

/* 龍 */
.card-dragon {
  --card-color: #F59E0B;
  border-color: var(--card-color);
  background: linear-gradient(135deg, rgba(245,158,11,0.1), transparent);
}
```

---

## 5. 互動流程

### 5.1 狩獵階段互動

```
玩家看到市場 4 張卡片
         │
         ▼
    點擊卡片查看詳情
         │
         ▼
   ┌─────┴─────┐
   │           │
   ▼           ▼
 點擊拿取    點擊馴服
   │           │
   │      檢查石頭是否足夠
   │           │
   │      ┌────┴────┐
   │      │         │
   │      ▼         ▼
   │    足夠      不足
   │      │         │
   │      │    顯示提示
   │      │         │
   ▼      ▼         │
卡片移入對應區域      │
   │                │
   ▼                │
切換到對手選擇  ◄────┘
```

### 5.2 行動階段互動

```
玩家回合開始
    │
    ▼
顯示可用動作
    │
    ▼
┌───┴───┬───────┐
│       │       │
▼       ▼       ▼
點擊手牌  點擊跳過  無動作
│             │
▼             ▼
顯示動作選項  結束回合
│
├── 馴服 ──► 檢查石頭 ──► 執行/提示
│
└── 出售 ──► 確認 ──► 執行
```

### 5.3 卡片詳情查看

```typescript
// 點擊卡片觸發
function onCardClick(card: CardInstance) {
  // 短按：選中卡片
  // 長按/雙擊：顯示詳情 Modal

  setSelectedCard(card);
  setShowDetail(true);
}
```

---

## 6. 元件規格

### 6.1 GameHeader

```typescript
interface GameHeaderProps {
  round: number;           // 當前回合 (1-10)
  maxRounds: number;       // 最大回合 (10)
  phase: GamePhase;        // 當前階段
  currentPlayerName: string;  // 當前玩家名稱
  isMyTurn: boolean;       // 是否是我的回合
}
```

**視覺規格**：
- 高度：48px
- 背景：`bg-gray-900`
- 分隔線：`border-b border-gray-700`

**顯示內容**：
- 左側：回合計數 `回合 5/10`
- 中間：階段名稱 `狩獵階段` / `行動階段` / `結算階段`
- 右側：當前玩家 `玩家 1 的回合`

### 6.2 StoneCounter

```typescript
interface StoneCounterProps {
  current: number;    // 當前石頭數
  limit: number;      // 石頭上限
  size?: 'small' | 'medium';
}
```

**視覺規格**：
- 使用圓點表示石頭
- 實心圓 = 有石頭
- 空心圓 = 空槽位
- 顯示數字 `(2/5)`

**範例**：
```
⬤⬤○○○ (2/5)
```

### 6.3 ScoreDisplay

```typescript
interface ScoreDisplayProps {
  score: number;
  previousScore?: number;  // 用於顯示變化
  size?: 'small' | 'medium' | 'large';
}
```

**視覺規格**：
- 大字體顯示分數
- 分數變化時短暫閃爍
- 勝利條件標示 (60 分)

### 6.4 MarketCard

```typescript
interface MarketCardProps {
  card: CardInstance;
  canTake: boolean;       // 是否可拿取
  canTame: boolean;       // 是否可馴服
  tameCost: number;       // 馴服費用
  onTake: () => void;
  onTame: () => void;
  onViewDetail: () => void;
}
```

**視覺規格**：
- 卡片 + 兩個操作按鈕
- 按鈕禁用時顯示灰色
- 馴服按鈕顯示費用

### 6.5 HandCard

```typescript
interface HandCardProps {
  card: CardInstance;
  canTame: boolean;
  canSell: boolean;
  tameCost: number;
  sellValue: number;
  onTame: () => void;
  onSell: () => void;
  onViewDetail: () => void;
}
```

### 6.6 ActionPanel

```typescript
interface ActionPanelProps {
  phase: GamePhase;
  isMyTurn: boolean;
  hint: string;           // 操作提示文字
  canPass: boolean;
  onPass: () => void;
}
```

**提示文字範例**：
- 狩獵階段：「選擇市場中的一張卡片」
- 行動階段：「馴服卡片、出售卡片或跳過」
- 對手回合：「等待對手行動...」
- 結算階段：「正在計算分數...」

### 6.7 CardDetailModal

```typescript
interface CardDetailModalProps {
  card: CardInstance | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**視覺規格**：
- 居中顯示
- 半透明背景遮罩
- 大尺寸卡片 (240x336)
- 詳細效果說明
- 風味文字

---

## 7. 遊戲結束畫面

### 7.1 結果畫面布局

```
┌─────────────────────────────────────────────┐
│                                             │
│              🎉 遊戲結束 🎉                  │
│                                             │
│         ┌───────────────────────┐           │
│         │      🏆 勝利者 🏆      │           │
│         │                       │           │
│         │       玩家 1          │           │
│         │       分數: 65        │           │
│         └───────────────────────┘           │
│                                             │
│    ┌─────────────┐  ┌─────────────┐        │
│    │   玩家 1    │  │   玩家 2    │        │
│    │   65 分     │  │   52 分     │        │
│    │   8 張卡    │  │   6 張卡    │        │
│    └─────────────┘  └─────────────┘        │
│                                             │
│              [再玩一局]                      │
│                                             │
└─────────────────────────────────────────────┘
```

### 7.2 結果畫面元件

```typescript
interface GameResultProps {
  winner: 0 | 1 | 'draw';
  players: [PlayerState, PlayerState];
  endReason: 'SCORE_REACHED' | 'ROUNDS_COMPLETED';
  onPlayAgain: () => void;
}
```

---

## 8. 響應式設計

### 8.1 斷點定義

| 斷點 | 寬度 | 說明 |
|------|------|------|
| desktop | >= 1280px | 完整版面 |
| tablet | 768px - 1279px | 縮小卡片尺寸 |
| mobile | < 768px | 不支援 (顯示提示) |

### 8.2 桌面版 (1280px+)

- 完整顯示所有區域
- 卡片使用標準尺寸
- 水平排列市場卡片

### 8.3 平板版 (768px - 1279px)

- 縮小卡片尺寸 80%
- 減少間距
- 手牌可水平滾動

### 8.4 手機版 (< 768px)

- 顯示「請使用桌面瀏覽器」提示
- MVP 不支援手機版

---

## 9. 狀態指示

### 9.1 階段指示器

| 階段 | 顏色 | 圖示 |
|------|------|------|
| 狩獵 | 綠色 | 🎯 |
| 行動 | 藍色 | ⚡ |
| 結算 | 紫色 | 📊 |

### 9.2 玩家回合指示

```css
/* 我的回合 */
.my-turn {
  border-left: 4px solid #22C55E;
  background: rgba(34, 197, 94, 0.1);
}

/* 對手回合 */
.opponent-turn {
  opacity: 0.7;
}
```

### 9.3 分數變化指示

```css
/* 分數增加 */
.score-increase {
  color: #22C55E;
  animation: pulse 0.3s;
}

/* 分數減少 */
.score-decrease {
  color: #EF4444;
  animation: pulse 0.3s;
}
```

---

## 10. 無動畫替代方案

### 10.1 使用 CSS Transition

MVP 不使用複雜動畫，僅使用簡單 transition：

```css
/* 卡片懸停 */
.card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

/* 按鈕點擊 */
.button {
  transition: background-color 0.1s ease;
}

.button:active {
  transform: scale(0.98);
}
```

### 10.2 狀態切換

```css
/* 卡片選中 */
.card.selected {
  transform: scale(1.05);
  border-width: 3px;
}

/* 區域高亮 */
.area.highlighted {
  box-shadow: 0 0 0 2px var(--highlight-color);
}
```

---

## 11. Tailwind CSS 類別對照

### 11.1 常用元件類別

```typescript
const UI_CLASSES = {
  // 容器
  gameBoard: 'min-h-screen bg-gray-950 text-gray-100 p-4',
  areaContainer: 'bg-gray-900 rounded-lg p-4 border border-gray-800',

  // 卡片
  cardBase: 'rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-150',
  cardSmall: 'w-16 h-[90px]',
  cardMedium: 'w-[100px] h-[140px]',
  cardLarge: 'w-[120px] h-[168px]',

  // 按鈕
  buttonPrimary: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors',
  buttonSecondary: 'px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors',
  buttonDisabled: 'px-4 py-2 bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed',

  // 文字
  heading: 'text-xl font-bold',
  subheading: 'text-lg font-semibold',
  body: 'text-sm text-gray-300',
  caption: 'text-xs text-gray-500',
};
```

### 11.2 元素顏色類別

```typescript
const ELEMENT_CLASSES = {
  FIRE: {
    border: 'border-red-500',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
  },
  WATER: {
    border: 'border-blue-500',
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
  },
  EARTH: {
    border: 'border-lime-500',
    bg: 'bg-lime-500/20',
    text: 'text-lime-400',
  },
  WIND: {
    border: 'border-purple-500',
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
  },
  DRAGON: {
    border: 'border-amber-500',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
  },
};
```

---

## 12. data-testid 對照表

為了方便測試，所有互動元素需要添加 `data-testid`：

| 元素 | data-testid | 說明 |
|------|-------------|------|
| 遊戲版面 | `game-board` | 主遊戲容器 |
| 回合指示 | `round-indicator` | 顯示回合數 |
| 階段指示 | `phase-indicator` | 顯示階段名稱 |
| 市場區域 | `market-area` | 市場容器 |
| 市場卡片 | `market-card-{index}` | 單張市場卡 |
| 拿取按鈕 | `take-button-{cardId}` | 拿取卡片按鈕 |
| 馴服按鈕 | `tame-button-{cardId}` | 馴服卡片按鈕 |
| 我方區域 | `player-area` | 玩家區域 |
| 對手區域 | `opponent-area` | 對手區域 |
| 手牌區 | `hand-area` | 手牌容器 |
| 手牌卡片 | `hand-card-{index}` | 單張手牌 |
| 場地區 | `field-area` | 場地容器 |
| 場地卡片 | `field-card-{index}` | 單張場地卡 |
| 石頭計數 | `stone-counter` | 石頭顯示 |
| 分數顯示 | `score-display` | 分數顯示 |
| 跳過按鈕 | `pass-button` | 跳過回合按鈕 |
| 出售按鈕 | `sell-button-{cardId}` | 出售卡片按鈕 |
| 卡片詳情 | `card-detail-modal` | 卡片詳情彈窗 |
| 遊戲結果 | `game-result` | 遊戲結束畫面 |
| 再玩一局 | `play-again-button` | 重新開始按鈕 |

---

## 附錄 A：Figma 設計稿連結

*(MVP 階段不提供 Figma 設計稿，以本文件規格為準)*

---

## 附錄 B：圖示資源

MVP 使用 Emoji 作為圖示，無需額外圖示庫：

| 用途 | Emoji |
|------|-------|
| 火元素 | 🔥 |
| 水元素 | 💧 |
| 土元素 | 🌿 |
| 風元素 | 💨 |
| 龍元素 | 🐉 |
| 石頭 | ⬤ (實心) / ○ (空心) |
| 勝利 | 🏆 |
| 回合 | 🔄 |

---

> **文件結束**
> 如有疑問請參考其他規格文件或聯繫開發團隊。
