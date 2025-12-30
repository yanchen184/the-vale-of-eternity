# 遊戲引擎規格書

> **The Vale of Eternity - 永恆之谷**
> 版本：MVP 1.0
> 最後更新：2024-12-30

---

## 1. 概述

### 1.1 引擎職責

遊戲引擎負責管理所有遊戲邏輯，包括：

- 遊戲狀態管理
- 階段流轉控制
- 玩家動作處理
- 效果觸發與解析
- 分數計算
- 勝利條件判定

### 1.2 設計原則

1. **純函數優先**：遊戲邏輯使用純函數，便於測試
2. **狀態不可變**：每次狀態變更產生新狀態物件
3. **單一資料源**：所有狀態集中於 Zustand Store
4. **事件驅動**：透過 Action 驅動狀態變更

---

## 2. 遊戲狀態機

### 2.1 遊戲階段 (GamePhase)

```typescript
enum GamePhase {
  SETUP = 'SETUP',           // 遊戲設定
  HUNTING = 'HUNTING',       // 狩獵階段
  ACTION = 'ACTION',         // 行動階段
  RESOLUTION = 'RESOLUTION', // 結算階段
  GAME_END = 'GAME_END',     // 遊戲結束
}
```

### 2.2 階段流轉圖

```
┌──────────────────────────────────────────────────────────────┐
│                        遊戲流程                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐                                                │
│   │  SETUP  │ ← 初始化遊戲                                   │
│   └────┬────┘                                                │
│        │                                                     │
│        ▼                                                     │
│   ┌─────────┐                                                │
│   │ HUNTING │ ← 回合開始：補充市場、選擇卡片                  │
│   └────┬────┘                                                │
│        │                                                     │
│        ▼                                                     │
│   ┌─────────┐                                                │
│   │ ACTION  │ ← 玩家行動：馴服、出售、使用能力                │
│   └────┬────┘                                                │
│        │                                                     │
│        ▼                                                     │
│   ┌────────────┐                                             │
│   │ RESOLUTION │ ← 回合結束：觸發效果、計分、獲得石頭          │
│   └─────┬──────┘                                             │
│         │                                                    │
│         ▼                                                    │
│   ┌──────────────┐                                           │
│   │ 檢查勝利條件  │                                           │
│   └──────┬───────┘                                           │
│          │                                                   │
│    ┌─────┴─────┐                                             │
│    │           │                                             │
│    ▼           ▼                                             │
│   未達成      達成                                            │
│    │           │                                             │
│    │      ┌────┴────┐                                        │
│    │      │ GAME_END │                                       │
│    │      └─────────┘                                        │
│    │                                                         │
│    └──────────► 返回 HUNTING                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. 資料結構設計

### 3.1 遊戲狀態 (GameState)

```typescript
interface MVPGameState {
  // === 遊戲識別 ===
  gameId: string;
  version: string;  // 'MVP-1.0.0'

  // === 遊戲進度 ===
  phase: GamePhase;
  round: number;  // 1-10
  turn: number;   // 當前階段內的回合數

  // === 玩家資訊 ===
  players: [PlayerState, PlayerState];
  currentPlayerIndex: 0 | 1;
  firstPlayerIndex: 0 | 1;  // 本回合先手玩家

  // === 卡片區域 ===
  deck: CardInstance[];        // 牌庫
  market: CardInstance[];      // 市場 (4張)
  discardPile: CardInstance[]; // 棄牌堆

  // === 回合狀態 ===
  huntingSelections: HuntingSelection[];  // 狩獵階段選擇紀錄
  actionsThisPhase: Action[];             // 本階段已執行動作

  // === 遊戲結果 ===
  isGameOver: boolean;
  winner: 0 | 1 | 'draw' | null;
  endReason: 'SCORE_REACHED' | 'ROUNDS_COMPLETED' | null;

  // === 時間戳 ===
  createdAt: number;
  updatedAt: number;
}
```

### 3.2 玩家狀態 (PlayerState)

```typescript
interface PlayerState {
  // === 玩家識別 ===
  id: string;
  name: string;
  index: 0 | 1;

  // === 資源 ===
  stones: number;      // 當前石頭數
  stoneLimit: number;  // 石頭上限 (初始 3)

  // === 分數 ===
  score: number;       // 當前總分
  roundScore: number;  // 本回合得分

  // === 卡片區域 ===
  hand: CardInstance[];   // 手牌
  field: CardInstance[];  // 場地 (最多 12 張)

  // === 狀態標記 ===
  hasActedThisPhase: boolean;  // 本階段是否已行動
  hasPassed: boolean;          // 是否已跳過
}
```

### 3.3 卡片實例 (CardInstance)

```typescript
interface CardInstance {
  // === 識別資訊 ===
  instanceId: string;    // 唯一實例 ID
  cardId: string;        // 卡片模板 ID (如 'F001')

  // === 卡片資料 (來自模板) ===
  name: string;
  nameTw: string;
  element: Element;
  cost: number;
  baseScore: number;
  effectType: EffectType;
  effectValue?: number;
  effectTarget?: Element | 'DRAGON';

  // === 實例狀態 ===
  ownerId: string | null;      // 所屬玩家 ID
  location: CardLocation;       // 當前位置
  isRevealed: boolean;         // 是否已翻開

  // === 修正值 ===
  scoreModifier: number;       // 分數修正
  hasUsedAbility: boolean;     // 本回合是否已使用能力
}

enum CardLocation {
  DECK = 'DECK',
  MARKET = 'MARKET',
  HAND = 'HAND',
  FIELD = 'FIELD',
  DISCARD = 'DISCARD',
}
```

### 3.4 動作 (Action)

```typescript
interface Action {
  type: ActionType;
  playerId: string;
  timestamp: number;
  payload: ActionPayload;
}

enum ActionType {
  // 狩獵階段
  SELECT_MARKET_CARD = 'SELECT_MARKET_CARD',  // 選擇市場卡片
  TAME_FROM_MARKET = 'TAME_FROM_MARKET',      // 從市場直接馴服

  // 行動階段
  TAME_FROM_HAND = 'TAME_FROM_HAND',   // 從手牌馴服
  SELL_CARD = 'SELL_CARD',              // 出售手牌
  PASS = 'PASS',                        // 跳過

  // 系統動作
  END_PHASE = 'END_PHASE',              // 結束階段
  END_ROUND = 'END_ROUND',              // 結束回合
}

type ActionPayload = {
  cardInstanceId?: string;
  targetCardId?: string;
  value?: number;
};

interface HuntingSelection {
  playerIndex: 0 | 1;
  cardInstanceId: string;
  action: 'TAKE' | 'TAME';
  stoneCost: number;
}
```

---

## 4. 階段詳細流程

### 4.1 設定階段 (SETUP)

```typescript
function initializeGame(player1Name: string, player2Name: string): MVPGameState {
  // 1. 建立玩家
  const players: [PlayerState, PlayerState] = [
    createPlayer(player1Name, 0),
    createPlayer(player2Name, 1),
  ];

  // 2. 建立牌庫 (20張卡片各2份 = 40張)
  const deck = createDeck();
  shuffleDeck(deck);

  // 3. 建立市場 (抽4張)
  const market = drawCards(deck, 4);

  // 4. 隨機決定先手
  const firstPlayerIndex = Math.random() < 0.5 ? 0 : 1;

  // 5. 返回初始狀態
  return {
    gameId: generateId(),
    version: 'MVP-1.0.0',
    phase: GamePhase.HUNTING,
    round: 1,
    turn: 1,
    players,
    currentPlayerIndex: firstPlayerIndex,
    firstPlayerIndex,
    deck,
    market,
    discardPile: [],
    huntingSelections: [],
    actionsThisPhase: [],
    isGameOver: false,
    winner: null,
    endReason: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
```

### 4.2 狩獵階段 (HUNTING)

#### 4.2.1 階段流程

```
狩獵階段開始
    │
    ▼
補充市場至 4 張
    │
    ▼
決定選擇順序（分數低者優先）
    │
    ▼
┌──────────────────────┐
│ 玩家 A 選擇卡片       │
│ - 免費拿取 → 加入手牌 │
│ - 馴服 → 直接進場     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 玩家 B 選擇卡片       │
└──────────┬───────────┘
           │
           ▼
所有玩家選擇完成
    │
    ▼
進入行動階段
```

#### 4.2.2 選擇順序規則

```typescript
function determineHuntingOrder(state: MVPGameState): [0 | 1, 0 | 1] {
  const [p1, p2] = state.players;

  // 分數低者優先
  if (p1.score < p2.score) {
    return [0, 1];
  } else if (p2.score < p1.score) {
    return [1, 0];
  } else {
    // 分數相同時，上一回合的後手者優先
    const lastFirst = state.firstPlayerIndex;
    return lastFirst === 0 ? [1, 0] : [0, 1];
  }
}
```

#### 4.2.3 選擇卡片動作

```typescript
function handleMarketSelection(
  state: MVPGameState,
  playerIndex: 0 | 1,
  cardInstanceId: string,
  action: 'TAKE' | 'TAME'
): MVPGameState {
  const card = state.market.find(c => c.instanceId === cardInstanceId);
  const player = state.players[playerIndex];

  if (action === 'TAKE') {
    // 免費拿取 → 加入手牌
    return {
      ...state,
      market: state.market.filter(c => c.instanceId !== cardInstanceId),
      players: updatePlayer(state.players, playerIndex, {
        hand: [...player.hand, { ...card, location: 'HAND', ownerId: player.id }],
      }),
      huntingSelections: [
        ...state.huntingSelections,
        { playerIndex, cardInstanceId, action: 'TAKE', stoneCost: 0 },
      ],
    };
  } else {
    // 馴服 → 支付石頭，直接進場
    const cost = getTameCost(card.cost);

    if (player.stones < cost) {
      throw new Error('ERR_INSUFFICIENT_STONES');
    }

    const newCard = { ...card, location: 'FIELD', ownerId: player.id };

    // 觸發即時效果
    const effectResult = triggerOnTameEffect(newCard, state, playerIndex);

    return {
      ...effectResult.state,
      market: state.market.filter(c => c.instanceId !== cardInstanceId),
      players: updatePlayer(effectResult.state.players, playerIndex, {
        field: [...player.field, newCard],
        stones: player.stones - cost + effectResult.stonesGained,
      }),
      huntingSelections: [
        ...state.huntingSelections,
        { playerIndex, cardInstanceId, action: 'TAME', stoneCost: cost },
      ],
    };
  }
}
```

### 4.3 行動階段 (ACTION)

#### 4.3.1 階段流程

```
行動階段開始
    │
    ▼
設定當前玩家（先手玩家）
    │
    ▼
┌─────────────────────────────┐
│ 當前玩家執行動作             │
│ ┌─────────────────────────┐ │
│ │ 可用動作：               │ │
│ │ - 馴服（手牌 → 場地）    │ │
│ │ - 出售（手牌 → 棄牌堆）  │ │
│ │ - 跳過                   │ │
│ └─────────────────────────┘ │
└──────────────┬──────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
  執行動作              跳過
    │                     │
    └──────────┬──────────┘
               │
               ▼
        切換到對手
               │
               ▼
    ┌──────────────────────┐
    │ 雙方都跳過？           │
    └──────────┬───────────┘
          │         │
          ▼         ▼
         是        否
          │         │
          ▼         └──► 返回動作迴圈
    進入結算階段
```

#### 4.3.2 馴服卡片

```typescript
function handleTameFromHand(
  state: MVPGameState,
  playerIndex: 0 | 1,
  cardInstanceId: string
): MVPGameState {
  const player = state.players[playerIndex];
  const card = player.hand.find(c => c.instanceId === cardInstanceId);

  // 驗證
  if (!card) throw new Error('ERR_CARD_NOT_FOUND');
  if (player.field.length >= 12) throw new Error('ERR_FIELD_FULL');

  const cost = getTameCost(card.cost);
  if (player.stones < cost) throw new Error('ERR_INSUFFICIENT_STONES');

  // 更新卡片位置
  const newCard: CardInstance = {
    ...card,
    location: 'FIELD',
  };

  // 觸發即時效果
  const effectResult = triggerOnTameEffect(newCard, state, playerIndex);

  // 更新狀態
  return {
    ...effectResult.state,
    players: updatePlayer(effectResult.state.players, playerIndex, {
      hand: player.hand.filter(c => c.instanceId !== cardInstanceId),
      field: [...player.field, newCard],
      stones: player.stones - cost + effectResult.stonesGained,
    }),
    actionsThisPhase: [
      ...state.actionsThisPhase,
      {
        type: ActionType.TAME_FROM_HAND,
        playerId: player.id,
        timestamp: Date.now(),
        payload: { cardInstanceId },
      },
    ],
  };
}
```

#### 4.3.3 出售卡片

```typescript
function handleSellCard(
  state: MVPGameState,
  playerIndex: 0 | 1,
  cardInstanceId: string
): MVPGameState {
  const player = state.players[playerIndex];
  const card = player.hand.find(c => c.instanceId === cardInstanceId);

  if (!card) throw new Error('ERR_CARD_NOT_FOUND');

  // 獲得等同費用的石頭（但不超過上限）
  const stonesGained = Math.min(
    card.cost,
    player.stoneLimit - player.stones
  );

  return {
    ...state,
    players: updatePlayer(state.players, playerIndex, {
      hand: player.hand.filter(c => c.instanceId !== cardInstanceId),
      stones: player.stones + stonesGained,
    }),
    discardPile: [
      ...state.discardPile,
      { ...card, location: 'DISCARD', ownerId: null },
    ],
    actionsThisPhase: [
      ...state.actionsThisPhase,
      {
        type: ActionType.SELL_CARD,
        playerId: player.id,
        timestamp: Date.now(),
        payload: { cardInstanceId, value: stonesGained },
      },
    ],
  };
}
```

### 4.4 結算階段 (RESOLUTION)

#### 4.4.1 階段流程

```
結算階段開始
    │
    ▼
觸發「回合結束」效果（如有）
    │
    ▼
計算雙方分數
    │
    ▼
雙方獲得 1 顆石頭
    │
    ▼
更新石頭上限效果
    │
    ▼
重置回合狀態
    │
    ▼
┌──────────────────────┐
│ 檢查勝利條件          │
│ - 任一方達 60 分？    │
│ - 已完成 10 回合？    │
└──────────┬───────────┘
      │         │
      ▼         ▼
    達成      未達成
      │         │
      ▼         ▼
  GAME_END   HUNTING
```

#### 4.4.2 分數計算

```typescript
function calculateScore(state: MVPGameState, playerIndex: 0 | 1): number {
  const player = state.players[playerIndex];
  let totalScore = 0;

  // 計算每張場上卡片的分數
  for (const card of player.field) {
    // 基礎分數
    let cardScore = card.baseScore;

    // 計分效果
    switch (card.effectType) {
      case EffectType.SCORE_PER_ELEMENT:
        // 每張同元素卡 +N 分
        const sameElementCount = player.field.filter(
          c => c.element === card.effectTarget
        ).length;
        cardScore += sameElementCount * (card.effectValue || 1);
        break;

      case EffectType.SCORE_PER_DRAGON:
        // 每張龍卡 +N 分
        const dragonCount = player.field.filter(
          c => c.element === Element.DRAGON
        ).length;
        cardScore += dragonCount * (card.effectValue || 2);
        break;
    }

    // 加上修正值
    cardScore += card.scoreModifier;

    totalScore += cardScore;
  }

  return totalScore;
}
```

#### 4.4.3 勝利條件檢查

```typescript
function checkVictoryCondition(state: MVPGameState): {
  isGameOver: boolean;
  winner: 0 | 1 | 'draw' | null;
  endReason: 'SCORE_REACHED' | 'ROUNDS_COMPLETED' | null;
} {
  const [p1, p2] = state.players;

  // 檢查是否達到 60 分
  const p1Reached = p1.score >= 60;
  const p2Reached = p2.score >= 60;

  if (p1Reached || p2Reached) {
    if (p1Reached && p2Reached) {
      // 雙方同時達標，比較分數
      if (p1.score > p2.score) {
        return { isGameOver: true, winner: 0, endReason: 'SCORE_REACHED' };
      } else if (p2.score > p1.score) {
        return { isGameOver: true, winner: 1, endReason: 'SCORE_REACHED' };
      } else {
        // 分數相同，比較場上卡片數
        if (p1.field.length > p2.field.length) {
          return { isGameOver: true, winner: 0, endReason: 'SCORE_REACHED' };
        } else if (p2.field.length > p1.field.length) {
          return { isGameOver: true, winner: 1, endReason: 'SCORE_REACHED' };
        } else {
          return { isGameOver: true, winner: 'draw', endReason: 'SCORE_REACHED' };
        }
      }
    } else {
      return {
        isGameOver: true,
        winner: p1Reached ? 0 : 1,
        endReason: 'SCORE_REACHED',
      };
    }
  }

  // 檢查是否已完成 10 回合
  if (state.round >= 10) {
    if (p1.score > p2.score) {
      return { isGameOver: true, winner: 0, endReason: 'ROUNDS_COMPLETED' };
    } else if (p2.score > p1.score) {
      return { isGameOver: true, winner: 1, endReason: 'ROUNDS_COMPLETED' };
    } else {
      if (p1.field.length > p2.field.length) {
        return { isGameOver: true, winner: 0, endReason: 'ROUNDS_COMPLETED' };
      } else if (p2.field.length > p1.field.length) {
        return { isGameOver: true, winner: 1, endReason: 'ROUNDS_COMPLETED' };
      } else {
        return { isGameOver: true, winner: 'draw', endReason: 'ROUNDS_COMPLETED' };
      }
    }
  }

  return { isGameOver: false, winner: null, endReason: null };
}
```

---

## 5. 效果系統

### 5.1 效果類型

```typescript
enum EffectType {
  NONE = 'NONE',

  // 即時效果 (馴服時觸發)
  GAIN_STONES = 'GAIN_STONES',
  DRAW_FROM_DISCARD = 'DRAW_FROM_DISCARD',

  // 永久效果 (持續生效)
  INCREASE_STONE_LIMIT = 'INCREASE_STONE_LIMIT',

  // 計分效果 (結算時計算)
  SCORE_PER_ELEMENT = 'SCORE_PER_ELEMENT',
  SCORE_PER_DRAGON = 'SCORE_PER_DRAGON',
}

enum EffectTrigger {
  ON_TAME = 'ON_TAME',       // 馴服時
  PERMANENT = 'PERMANENT',   // 永久
  ON_SCORE = 'ON_SCORE',     // 計分時
}
```

### 5.2 效果解析器

```typescript
interface EffectResult {
  state: MVPGameState;
  stonesGained: number;
  cardsDrawn: CardInstance[];
  message?: string;
}

function triggerOnTameEffect(
  card: CardInstance,
  state: MVPGameState,
  playerIndex: 0 | 1
): EffectResult {
  const player = state.players[playerIndex];
  let result: EffectResult = {
    state,
    stonesGained: 0,
    cardsDrawn: [],
  };

  switch (card.effectType) {
    case EffectType.GAIN_STONES:
      // 獲得石頭
      const gained = Math.min(
        card.effectValue || 1,
        player.stoneLimit - player.stones
      );
      result.stonesGained = gained;
      result.message = `獲得 ${gained} 顆石頭`;
      break;

    case EffectType.DRAW_FROM_DISCARD:
      // 從棄牌堆抽牌
      if (state.discardPile.length > 0) {
        const drawn = state.discardPile[state.discardPile.length - 1];
        result.cardsDrawn = [drawn];
        result.state = {
          ...state,
          discardPile: state.discardPile.slice(0, -1),
          players: updatePlayer(state.players, playerIndex, {
            hand: [...player.hand, { ...drawn, location: 'HAND', ownerId: player.id }],
          }),
        };
        result.message = `從棄牌堆抽取 ${drawn.nameTw}`;
      }
      break;

    case EffectType.INCREASE_STONE_LIMIT:
      // 增加石頭上限（永久效果，馴服時立即生效）
      result.state = {
        ...state,
        players: updatePlayer(state.players, playerIndex, {
          stoneLimit: player.stoneLimit + (card.effectValue || 2),
        }),
      };
      result.message = `石頭上限 +${card.effectValue || 2}`;
      break;
  }

  return result;
}
```

### 5.3 永久效果處理

```typescript
function applyPermanentEffects(state: MVPGameState): MVPGameState {
  let newState = { ...state };

  for (let i = 0; i < 2; i++) {
    const player = newState.players[i as 0 | 1];
    let stoneLimit = 3; // 基礎上限

    // 計算所有永久效果
    for (const card of player.field) {
      if (card.effectType === EffectType.INCREASE_STONE_LIMIT) {
        stoneLimit += card.effectValue || 2;
      }
    }

    newState = {
      ...newState,
      players: updatePlayer(newState.players, i as 0 | 1, {
        stoneLimit,
      }),
    };
  }

  return newState;
}
```

---

## 6. 馴服費用表

```typescript
function getTameCost(cardCost: number): number {
  const costTable: Record<number, number> = {
    0: 0,
    1: 1,
    2: 1,
    3: 2,
    4: 2,
    5: 3,
    6: 3,
  };

  return costTable[Math.min(cardCost, 6)] ?? 3;
}
```

---

## 7. API 介面設計

### 7.1 遊戲引擎類別

```typescript
class GameEngine {
  private state: MVPGameState;

  constructor() {
    this.state = this.getInitialState();
  }

  // === 遊戲生命週期 ===

  initGame(player1Name: string, player2Name: string): void;
  resetGame(): void;

  // === 狀態查詢 ===

  getState(): MVPGameState;
  getCurrentPlayer(): PlayerState;
  getValidActions(): ActionType[];
  canTameCard(cardInstanceId: string): boolean;
  canSellCard(cardInstanceId: string): boolean;

  // === 動作執行 ===

  selectMarketCard(playerIndex: 0 | 1, cardInstanceId: string, action: 'TAKE' | 'TAME'): void;
  tameFromHand(cardInstanceId: string): void;
  sellCard(cardInstanceId: string): void;
  pass(): void;

  // === 階段控制 ===

  endHuntingPhase(): void;
  endActionPhase(): void;
  endResolutionPhase(): void;

  // === 事件訂閱 ===

  onStateChange(callback: (state: MVPGameState) => void): () => void;
  onPhaseChange(callback: (phase: GamePhase) => void): () => void;
  onGameEnd(callback: (result: GameResult) => void): () => void;
}
```

### 7.2 Zustand Store 介面

```typescript
interface GameStore {
  // 狀態
  state: MVPGameState | null;
  engine: GameEngine | null;

  // 初始化
  initGame: (player1Name: string, player2Name: string) => void;
  resetGame: () => void;

  // 動作
  selectMarketCard: (cardId: string, action: 'TAKE' | 'TAME') => void;
  tameCard: (cardId: string) => void;
  sellCard: (cardId: string) => void;
  pass: () => void;

  // 查詢
  getCurrentPlayer: () => PlayerState | null;
  getOpponent: () => PlayerState | null;
  getValidActions: () => ActionType[];
}
```

---

## 8. 錯誤處理

### 8.1 錯誤代碼

```typescript
enum GameError {
  // 資源錯誤
  ERR_INSUFFICIENT_STONES = 'ERR_INSUFFICIENT_STONES',

  // 容量錯誤
  ERR_FIELD_FULL = 'ERR_FIELD_FULL',
  ERR_HAND_FULL = 'ERR_HAND_FULL',

  // 階段錯誤
  ERR_INVALID_PHASE = 'ERR_INVALID_PHASE',
  ERR_NOT_YOUR_TURN = 'ERR_NOT_YOUR_TURN',

  // 卡片錯誤
  ERR_CARD_NOT_FOUND = 'ERR_CARD_NOT_FOUND',
  ERR_CARD_NOT_IN_HAND = 'ERR_CARD_NOT_IN_HAND',
  ERR_CARD_NOT_IN_MARKET = 'ERR_CARD_NOT_IN_MARKET',

  // 遊戲狀態錯誤
  ERR_GAME_NOT_STARTED = 'ERR_GAME_NOT_STARTED',
  ERR_GAME_ALREADY_ENDED = 'ERR_GAME_ALREADY_ENDED',
}
```

### 8.2 錯誤處理策略

```typescript
function handleAction(action: Action, state: MVPGameState): MVPGameState | GameError {
  try {
    // 驗證階段
    if (!isValidPhase(action, state.phase)) {
      return GameError.ERR_INVALID_PHASE;
    }

    // 驗證玩家
    if (!isCurrentPlayer(action.playerId, state)) {
      return GameError.ERR_NOT_YOUR_TURN;
    }

    // 執行動作
    return executeAction(action, state);
  } catch (error) {
    console.error('[GameEngine] Action failed:', error);
    return error as GameError;
  }
}
```

---

## 9. 測試介面

### 9.1 測試用輔助函數

```typescript
// 快速建立測試狀態
function createTestState(overrides?: Partial<MVPGameState>): MVPGameState;

// 模擬多個動作
function simulateActions(state: MVPGameState, actions: Action[]): MVPGameState;

// 快速推進到指定回合
function advanceToRound(state: MVPGameState, targetRound: number): MVPGameState;

// 設定特定玩家的分數
function setPlayerScore(state: MVPGameState, playerIndex: 0 | 1, score: number): MVPGameState;

// 給予特定卡片
function giveCardToPlayer(state: MVPGameState, playerIndex: 0 | 1, cardId: string, location: 'HAND' | 'FIELD'): MVPGameState;
```

---

## 附錄：完整狀態機圖

```
                    ┌─────────────────────────────────────┐
                    │              SETUP                   │
                    │  - 初始化玩家                        │
                    │  - 建立牌庫 (40張)                   │
                    │  - 抽取市場 (4張)                    │
                    │  - 決定先手                          │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              HUNTING                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 1. 補充市場至 4 張                                               │    │
│  │ 2. 決定選擇順序（分數低者優先）                                   │    │
│  │ 3. 玩家輪流選擇卡片                                              │    │
│  │    - TAKE: 免費拿取 → 加入手牌                                   │    │
│  │    - TAME: 支付石頭 → 進入場地                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                               ACTION                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 玩家輪流行動：                                                   │    │
│  │ - TAME_FROM_HAND: 馴服手牌 (支付石頭)                           │    │
│  │ - SELL_CARD: 出售手牌 (獲得石頭)                                │    │
│  │ - PASS: 跳過                                                     │    │
│  │                                                                  │    │
│  │ 結束條件：雙方都 PASS                                           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            RESOLUTION                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 1. 觸發回合結束效果                                              │    │
│  │ 2. 計算分數                                                      │    │
│  │    - 基礎分數                                                    │    │
│  │    - 計分效果 (SCORE_PER_ELEMENT, SCORE_PER_DRAGON)              │    │
│  │ 3. 獲得 1 顆石頭 (不超過上限)                                    │    │
│  │ 4. 重置回合狀態                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
                           ┌──────────────────┐
                           │  檢查勝利條件     │
                           │  - 分數 >= 60?   │
                           │  - 回合 >= 10?   │
                           └────────┬─────────┘
                                    │
                      ┌─────────────┴─────────────┐
                      │                           │
                      ▼                           ▼
               未達成勝利條件               達成勝利條件
                      │                           │
                      ▼                           ▼
              返回 HUNTING              ┌─────────────────┐
                                       │    GAME_END      │
                                       │ - 宣布勝者       │
                                       │ - 顯示結果       │
                                       └─────────────────┘
```

---

> **文件結束**
> 如有疑問請參考其他規格文件或聯繫開發團隊。
