# 測試規格書

> **The Vale of Eternity - 永恆之谷**
> 版本：MVP 1.0
> 最後更新：2024-12-30

---

## 1. 測試策略

### 1.1 測試金字塔

```
          ╱╲
         ╱  ╲
        ╱ E2E╲         ← 5-10 個核心場景
       ╱──────╲
      ╱ 整合測試╲       ← 20-30 個測試
     ╱──────────╲
    ╱  單元測試   ╲     ← 50+ 個測試
   ╱──────────────╲
```

### 1.2 測試工具

| 類型 | 工具 | 說明 |
|------|------|------|
| 單元測試 | Vitest | React 元件與純函數測試 |
| 整合測試 | Vitest + React Testing Library | 元件互動測試 |
| E2E 測試 | Playwright | 端對端自動化測試 |
| 覆蓋率 | c8/istanbul | 程式碼覆蓋率報告 |

### 1.3 測試目標

| 指標 | 目標值 |
|------|--------|
| 單元測試覆蓋率 | >= 80% |
| 整合測試覆蓋率 | >= 60% |
| E2E 關鍵路徑 | 100% |
| 測試通過率 | 100% |

---

## 2. 單元測試計畫

### 2.1 遊戲引擎測試

#### 2.1.1 遊戲初始化

```typescript
// __tests__/engine/initGame.test.ts

describe('Game Initialization', () => {
  it('should create game with two players', () => {
    const state = initializeGame('Player 1', 'Player 2');

    expect(state.players).toHaveLength(2);
    expect(state.players[0].name).toBe('Player 1');
    expect(state.players[1].name).toBe('Player 2');
  });

  it('should start at round 1', () => {
    const state = initializeGame('P1', 'P2');

    expect(state.round).toBe(1);
  });

  it('should start in HUNTING phase', () => {
    const state = initializeGame('P1', 'P2');

    expect(state.phase).toBe(GamePhase.HUNTING);
  });

  it('should create deck with 40 cards', () => {
    const state = initializeGame('P1', 'P2');

    // 40 total - 4 in market = 36 in deck
    expect(state.deck.length + state.market.length).toBe(40);
  });

  it('should have 4 cards in market', () => {
    const state = initializeGame('P1', 'P2');

    expect(state.market).toHaveLength(4);
  });

  it('should give players 0 starting stones', () => {
    const state = initializeGame('P1', 'P2');

    expect(state.players[0].stones).toBe(0);
    expect(state.players[1].stones).toBe(0);
  });

  it('should set initial stone limit to 3', () => {
    const state = initializeGame('P1', 'P2');

    expect(state.players[0].stoneLimit).toBe(3);
    expect(state.players[1].stoneLimit).toBe(3);
  });

  it('should randomly select first player', () => {
    // 執行多次，確保有時是 0，有時是 1
    const results = new Set();
    for (let i = 0; i < 50; i++) {
      const state = initializeGame('P1', 'P2');
      results.add(state.firstPlayerIndex);
    }

    expect(results.size).toBe(2);
  });
});
```

#### 2.1.2 馴服費用計算

```typescript
// __tests__/engine/tameCost.test.ts

describe('Tame Cost Calculation', () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 2],
    [5, 3],
    [6, 3],
  ])('card cost %i should require %i stones to tame', (cardCost, tameCost) => {
    expect(getTameCost(cardCost)).toBe(tameCost);
  });
});
```

#### 2.1.3 市場選擇

```typescript
// __tests__/engine/marketSelection.test.ts

describe('Market Card Selection', () => {
  let initialState: MVPGameState;

  beforeEach(() => {
    initialState = initializeGame('P1', 'P2');
  });

  describe('Take Action', () => {
    it('should add card to player hand', () => {
      const cardId = initialState.market[0].instanceId;
      const newState = handleMarketSelection(initialState, 0, cardId, 'TAKE');

      expect(newState.players[0].hand).toHaveLength(1);
      expect(newState.players[0].hand[0].instanceId).toBe(cardId);
    });

    it('should remove card from market', () => {
      const cardId = initialState.market[0].instanceId;
      const newState = handleMarketSelection(initialState, 0, cardId, 'TAKE');

      expect(newState.market).toHaveLength(3);
      expect(newState.market.find(c => c.instanceId === cardId)).toBeUndefined();
    });

    it('should not cost any stones', () => {
      const cardId = initialState.market[0].instanceId;
      const newState = handleMarketSelection(initialState, 0, cardId, 'TAKE');

      expect(newState.players[0].stones).toBe(initialState.players[0].stones);
    });
  });

  describe('Tame Action', () => {
    it('should add card to player field', () => {
      // 給予足夠石頭
      const stateWithStones = {
        ...initialState,
        players: updatePlayer(initialState.players, 0, { stones: 3 }),
      };

      const cardId = stateWithStones.market[0].instanceId;
      const newState = handleMarketSelection(stateWithStones, 0, cardId, 'TAME');

      expect(newState.players[0].field.length).toBeGreaterThan(0);
    });

    it('should deduct stones', () => {
      const stateWithStones = {
        ...initialState,
        players: updatePlayer(initialState.players, 0, { stones: 3 }),
      };

      const card = stateWithStones.market[0];
      const expectedCost = getTameCost(card.cost);
      const newState = handleMarketSelection(stateWithStones, 0, card.instanceId, 'TAME');

      expect(newState.players[0].stones).toBe(3 - expectedCost);
    });

    it('should throw error if insufficient stones', () => {
      const cardId = initialState.market.find(c => c.cost > 0)?.instanceId;

      if (cardId) {
        expect(() => {
          handleMarketSelection(initialState, 0, cardId, 'TAME');
        }).toThrow('ERR_INSUFFICIENT_STONES');
      }
    });
  });
});
```

#### 2.1.4 分數計算

```typescript
// __tests__/engine/scoreCalculation.test.ts

describe('Score Calculation', () => {
  it('should calculate base score correctly', () => {
    const player = createTestPlayer({
      field: [
        createTestCard({ baseScore: 3 }),
        createTestCard({ baseScore: 5 }),
      ],
    });

    const score = calculateScore(createTestState({ players: [player, player] }), 0);

    expect(score).toBe(8);
  });

  it('should apply SCORE_PER_ELEMENT effect', () => {
    const player = createTestPlayer({
      field: [
        createTestCard({
          cardId: 'F003',
          element: Element.FIRE,
          baseScore: 3,
          effectType: EffectType.SCORE_PER_ELEMENT,
          effectValue: 1,
          effectTarget: Element.FIRE,
        }),
        createTestCard({
          element: Element.FIRE,
          baseScore: 2,
        }),
        createTestCard({
          element: Element.FIRE,
          baseScore: 2,
        }),
      ],
    });

    // Firefox (3) + 3 fire cards * 1 = 3 + 3 = 6
    // Plus two Imps (2 + 2) = 4
    // Total = 6 + 4 = 10
    const score = calculateScore(createTestState({ players: [player, player] }), 0);

    expect(score).toBe(10);
  });

  it('should apply SCORE_PER_DRAGON effect', () => {
    const player = createTestPlayer({
      field: [
        createTestCard({
          cardId: 'D001',
          element: Element.DRAGON,
          baseScore: 0,
          effectType: EffectType.SCORE_PER_DRAGON,
          effectValue: 2,
        }),
        createTestCard({
          element: Element.DRAGON,
          baseScore: 5,
        }),
      ],
    });

    // Dragon Egg (0) + 2 dragons * 2 = 0 + 4 = 4
    // Plus one dragon (5) = 5
    // Total = 4 + 5 = 9
    const score = calculateScore(createTestState({ players: [player, player] }), 0);

    expect(score).toBe(9);
  });
});
```

#### 2.1.5 勝利條件

```typescript
// __tests__/engine/victoryCondition.test.ts

describe('Victory Condition', () => {
  it('should end game when player reaches 60 points', () => {
    const state = createTestState({
      players: [
        createTestPlayer({ score: 60 }),
        createTestPlayer({ score: 45 }),
      ],
    });

    const result = checkVictoryCondition(state);

    expect(result.isGameOver).toBe(true);
    expect(result.winner).toBe(0);
    expect(result.endReason).toBe('SCORE_REACHED');
  });

  it('should end game after 10 rounds', () => {
    const state = createTestState({
      round: 10,
      players: [
        createTestPlayer({ score: 55 }),
        createTestPlayer({ score: 50 }),
      ],
    });

    const result = checkVictoryCondition(state);

    expect(result.isGameOver).toBe(true);
    expect(result.winner).toBe(0);
    expect(result.endReason).toBe('ROUNDS_COMPLETED');
  });

  it('should use field card count as tiebreaker', () => {
    const state = createTestState({
      round: 10,
      players: [
        createTestPlayer({ score: 50, field: [createTestCard(), createTestCard()] }),
        createTestPlayer({ score: 50, field: [createTestCard()] }),
      ],
    });

    const result = checkVictoryCondition(state);

    expect(result.winner).toBe(0);
  });

  it('should return draw if both score and field count are equal', () => {
    const state = createTestState({
      round: 10,
      players: [
        createTestPlayer({ score: 50, field: [createTestCard()] }),
        createTestPlayer({ score: 50, field: [createTestCard()] }),
      ],
    });

    const result = checkVictoryCondition(state);

    expect(result.winner).toBe('draw');
  });
});
```

### 2.2 效果系統測試

```typescript
// __tests__/engine/effects.test.ts

describe('Card Effects', () => {
  describe('GAIN_STONES', () => {
    it('should add stones when tamed', () => {
      const state = createTestStateWithStones(3);
      const salamander = getCardById('F004'); // +2 stones

      const result = triggerOnTameEffect(
        createCardInstance(salamander),
        state,
        0
      );

      expect(result.stonesGained).toBe(2);
    });

    it('should respect stone limit', () => {
      const state = createTestState({
        players: [
          createTestPlayer({ stones: 2, stoneLimit: 3 }),
          createTestPlayer({ stones: 0 }),
        ],
      });

      const salamander = getCardById('F004'); // +2 stones

      const result = triggerOnTameEffect(
        createCardInstance(salamander),
        state,
        0
      );

      expect(result.stonesGained).toBe(1); // 只能得到 1 顆
    });
  });

  describe('INCREASE_STONE_LIMIT', () => {
    it('should increase stone limit', () => {
      const state = createTestState();
      const hestia = getCardById('F001'); // +2 limit

      const result = triggerOnTameEffect(
        createCardInstance(hestia),
        state,
        0
      );

      expect(result.state.players[0].stoneLimit).toBe(5);
    });
  });

  describe('DRAW_FROM_DISCARD', () => {
    it('should draw card from discard pile', () => {
      const discardedCard = createTestCard({ cardId: 'TEST' });
      const state = createTestState({
        discardPile: [discardedCard],
      });

      const seaSpirit = getCardById('W004');

      const result = triggerOnTameEffect(
        createCardInstance(seaSpirit),
        state,
        0
      );

      expect(result.cardsDrawn).toHaveLength(1);
      expect(result.state.players[0].hand).toHaveLength(1);
      expect(result.state.discardPile).toHaveLength(0);
    });

    it('should do nothing if discard pile is empty', () => {
      const state = createTestState({ discardPile: [] });
      const seaSpirit = getCardById('W004');

      const result = triggerOnTameEffect(
        createCardInstance(seaSpirit),
        state,
        0
      );

      expect(result.cardsDrawn).toHaveLength(0);
    });
  });
});
```

### 2.3 卡片資料測試

```typescript
// __tests__/data/cards.test.ts

describe('Card Data', () => {
  it('should have exactly 20 cards', () => {
    expect(MVP_CARDS).toHaveLength(20);
  });

  it('should have 4 cards per element', () => {
    const byElement = groupBy(MVP_CARDS, 'element');

    expect(byElement[Element.FIRE]).toHaveLength(4);
    expect(byElement[Element.WATER]).toHaveLength(4);
    expect(byElement[Element.EARTH]).toHaveLength(4);
    expect(byElement[Element.WIND]).toHaveLength(4);
    expect(byElement[Element.DRAGON]).toHaveLength(4);
  });

  it('should have unique IDs', () => {
    const ids = MVP_CARDS.map(c => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have valid cost values (0-6)', () => {
    MVP_CARDS.forEach(card => {
      expect(card.cost).toBeGreaterThanOrEqual(0);
      expect(card.cost).toBeLessThanOrEqual(6);
    });
  });

  it('should have valid effect types', () => {
    const validEffectTypes = Object.values(EffectType);

    MVP_CARDS.forEach(card => {
      expect(validEffectTypes).toContain(card.effectType);
    });
  });

  it('should have Chinese names', () => {
    MVP_CARDS.forEach(card => {
      expect(card.nameTw).toBeTruthy();
      expect(card.nameTw.length).toBeGreaterThan(0);
    });
  });
});
```

---

## 3. 整合測試計畫

### 3.1 遊戲流程整合測試

```typescript
// __tests__/integration/gameFlow.test.ts

describe('Game Flow Integration', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
    engine.initGame('Player 1', 'Player 2');
  });

  describe('Hunting Phase', () => {
    it('should allow players to select market cards in order', () => {
      const state = engine.getState();
      const firstPlayer = state.firstPlayerIndex;
      const secondPlayer = firstPlayer === 0 ? 1 : 0;

      // 第一位玩家選擇
      const card1 = state.market[0].instanceId;
      engine.selectMarketCard(firstPlayer, card1, 'TAKE');

      // 驗證第一位玩家得到卡片
      expect(engine.getState().players[firstPlayer].hand).toHaveLength(1);

      // 第二位玩家選擇
      const card2 = engine.getState().market[0].instanceId;
      engine.selectMarketCard(secondPlayer, card2, 'TAKE');

      // 驗證第二位玩家得到卡片
      expect(engine.getState().players[secondPlayer].hand).toHaveLength(1);
    });

    it('should transition to ACTION phase after selections', () => {
      const state = engine.getState();

      // 雙方都選擇卡片
      engine.selectMarketCard(0, state.market[0].instanceId, 'TAKE');
      engine.selectMarketCard(1, engine.getState().market[0].instanceId, 'TAKE');

      engine.endHuntingPhase();

      expect(engine.getState().phase).toBe(GamePhase.ACTION);
    });
  });

  describe('Action Phase', () => {
    beforeEach(() => {
      // 進入行動階段
      const state = engine.getState();
      engine.selectMarketCard(0, state.market[0].instanceId, 'TAKE');
      engine.selectMarketCard(1, engine.getState().market[0].instanceId, 'TAKE');
      engine.endHuntingPhase();
    });

    it('should allow taming cards from hand', () => {
      // 給玩家石頭
      engine['state'] = {
        ...engine.getState(),
        players: updatePlayer(engine.getState().players, 0, { stones: 3 }),
      };

      const handCard = engine.getState().players[0].hand[0];

      if (handCard) {
        engine.tameFromHand(handCard.instanceId);

        const newState = engine.getState();
        expect(newState.players[0].field).toHaveLength(1);
        expect(newState.players[0].hand).toHaveLength(0);
      }
    });

    it('should allow selling cards', () => {
      const handCard = engine.getState().players[0].hand[0];

      if (handCard) {
        engine.sellCard(handCard.instanceId);

        const newState = engine.getState();
        expect(newState.players[0].hand).toHaveLength(0);
        expect(newState.discardPile).toHaveLength(1);
        expect(newState.players[0].stones).toBe(handCard.cost);
      }
    });

    it('should transition to RESOLUTION when both pass', () => {
      engine.pass(); // Player 1 passes
      engine.pass(); // Player 2 passes

      expect(engine.getState().phase).toBe(GamePhase.RESOLUTION);
    });
  });

  describe('Resolution Phase', () => {
    it('should calculate scores correctly', () => {
      // 設置測試狀態
      engine['state'] = createTestState({
        phase: GamePhase.RESOLUTION,
        players: [
          createTestPlayer({
            field: [
              createTestCard({ baseScore: 5 }),
              createTestCard({ baseScore: 3 }),
            ],
          }),
          createTestPlayer({
            field: [createTestCard({ baseScore: 4 })],
          }),
        ],
      });

      engine.endResolutionPhase();

      const state = engine.getState();
      expect(state.players[0].score).toBe(8);
      expect(state.players[1].score).toBe(4);
    });

    it('should give each player 1 stone', () => {
      engine['state'] = createTestState({
        phase: GamePhase.RESOLUTION,
        round: 1,
        players: [
          createTestPlayer({ stones: 0 }),
          createTestPlayer({ stones: 1 }),
        ],
      });

      engine.endResolutionPhase();

      const state = engine.getState();
      expect(state.players[0].stones).toBe(1);
      expect(state.players[1].stones).toBe(2);
    });
  });

  describe('Full Game Flow', () => {
    it('should complete a game in 10 rounds', () => {
      for (let round = 1; round <= 10; round++) {
        // 狩獵階段
        const marketCard1 = engine.getState().market[0]?.instanceId;
        const marketCard2 = engine.getState().market[1]?.instanceId;

        if (marketCard1) engine.selectMarketCard(0, marketCard1, 'TAKE');
        if (marketCard2) engine.selectMarketCard(1, marketCard2, 'TAKE');
        engine.endHuntingPhase();

        // 行動階段
        engine.pass();
        engine.pass();

        // 結算階段
        engine.endResolutionPhase();

        if (engine.getState().isGameOver) break;
      }

      expect(engine.getState().isGameOver).toBe(true);
      expect(engine.getState().winner).not.toBeNull();
    });
  });
});
```

### 3.2 UI 元件整合測試

```typescript
// __tests__/integration/components.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';

describe('GameBoard Integration', () => {
  it('should render all main areas', () => {
    render(<GameBoard />);

    expect(screen.getByTestId('game-board')).toBeInTheDocument();
    expect(screen.getByTestId('market-area')).toBeInTheDocument();
    expect(screen.getByTestId('player-area')).toBeInTheDocument();
    expect(screen.getByTestId('opponent-area')).toBeInTheDocument();
  });

  it('should display correct round number', () => {
    render(<GameBoard />);

    expect(screen.getByTestId('round-indicator')).toHaveTextContent('1/10');
  });

  it('should display market cards', () => {
    render(<GameBoard />);

    const marketCards = screen.getAllByTestId(/^market-card-/);
    expect(marketCards).toHaveLength(4);
  });

  it('should allow clicking take button', async () => {
    render(<GameBoard />);

    const takeButton = screen.getAllByTestId(/^take-button-/)[0];
    fireEvent.click(takeButton);

    // 驗證卡片移動到手牌
    await waitFor(() => {
      expect(screen.getByTestId('hand-area').children.length).toBeGreaterThan(0);
    });
  });
});

describe('CardDisplay Integration', () => {
  it('should show card detail on click', () => {
    const card = createTestCard();
    render(<CardDisplay card={card} onClick={() => {}} />);

    fireEvent.click(screen.getByTestId('card'));

    // Modal 應該出現
    expect(screen.getByTestId('card-detail-modal')).toBeInTheDocument();
  });

  it('should display element color correctly', () => {
    const fireCard = createTestCard({ element: Element.FIRE });
    render(<CardDisplay card={fireCard} />);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border-red-500');
  });
});
```

---

## 4. E2E 測試案例

### 4.1 測試環境設定

```typescript
// e2e/setup.ts

import { test as base } from '@playwright/test';

export const test = base.extend<{
  gamePage: Page;
}>({
  gamePage: async ({ page }, use) => {
    await page.goto('/the-vale-of-eternity/');
    await use(page);
  },
});
```

### 4.2 遊戲啟動測試

```typescript
// e2e/gameStart.spec.ts

import { test, expect } from './setup';

test.describe('Game Start', () => {
  test('should display game board after start', async ({ gamePage }) => {
    // 假設有開始遊戲按鈕
    await gamePage.click('[data-testid="start-game-button"]');

    await expect(gamePage.locator('[data-testid="game-board"]')).toBeVisible();
    await expect(gamePage.locator('[data-testid="market-area"]')).toBeVisible();
  });

  test('should show 4 market cards', async ({ gamePage }) => {
    await gamePage.click('[data-testid="start-game-button"]');

    const marketCards = gamePage.locator('[data-testid^="market-card-"]');
    await expect(marketCards).toHaveCount(4);
  });

  test('should display round 1/10', async ({ gamePage }) => {
    await gamePage.click('[data-testid="start-game-button"]');

    await expect(gamePage.locator('[data-testid="round-indicator"]'))
      .toContainText('1/10');
  });

  test('should display hunting phase', async ({ gamePage }) => {
    await gamePage.click('[data-testid="start-game-button"]');

    await expect(gamePage.locator('[data-testid="phase-indicator"]'))
      .toContainText('狩獵');
  });
});
```

### 4.3 狩獵階段測試

```typescript
// e2e/huntingPhase.spec.ts

import { test, expect } from './setup';

test.describe('Hunting Phase', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.click('[data-testid="start-game-button"]');
  });

  test('should allow taking a market card', async ({ gamePage }) => {
    // 點擊第一張市場卡的拿取按鈕
    await gamePage.click('[data-testid="take-button-0"]');

    // 驗證手牌區域有卡片
    const handCards = gamePage.locator('[data-testid^="hand-card-"]');
    await expect(handCards).toHaveCount(1);

    // 驗證市場只剩 3 張
    const marketCards = gamePage.locator('[data-testid^="market-card-"]');
    await expect(marketCards).toHaveCount(3);
  });

  test('should allow taming a market card with enough stones', async ({ gamePage }) => {
    // 假設有一張 0 費卡可以免費馴服
    // 或測試需要先設置玩家有足夠石頭

    const tameButton = gamePage.locator('[data-testid^="tame-button-"]').first();
    await tameButton.click();

    // 驗證場上有卡片
    const fieldCards = gamePage.locator('[data-testid="player-area"] [data-testid^="field-card-"]');
    await expect(fieldCards.first()).toBeVisible();
  });

  test('should show insufficient stones message when trying to tame without stones', async ({ gamePage }) => {
    // 找一張高費用卡
    // 點擊馴服按鈕
    // 應該顯示石頭不足的提示

    const tameButtons = gamePage.locator('[data-testid^="tame-button-"]');
    await tameButtons.last().click();

    // 如果石頭不足，應該顯示錯誤提示
    // (具體實現取決於 UI 設計)
  });
});
```

### 4.4 行動階段測試

```typescript
// e2e/actionPhase.spec.ts

import { test, expect } from './setup';

test.describe('Action Phase', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.click('[data-testid="start-game-button"]');

    // 完成狩獵階段
    await gamePage.click('[data-testid="take-button-0"]'); // P1
    await gamePage.click('[data-testid="take-button-0"]'); // P2

    // 等待進入行動階段
    await expect(gamePage.locator('[data-testid="phase-indicator"]'))
      .toContainText('行動');
  });

  test('should allow selling a hand card', async ({ gamePage }) => {
    const handCard = gamePage.locator('[data-testid^="hand-card-"]').first();
    await handCard.click();

    const sellButton = gamePage.locator('[data-testid^="sell-button-"]').first();
    await sellButton.click();

    // 手牌應該減少
    const handCards = gamePage.locator('[data-testid^="hand-card-"]');
    await expect(handCards).toHaveCount(0);
  });

  test('should transition to resolution after both pass', async ({ gamePage }) => {
    await gamePage.click('[data-testid="pass-button"]'); // P1
    await gamePage.click('[data-testid="pass-button"]'); // P2

    await expect(gamePage.locator('[data-testid="phase-indicator"]'))
      .toContainText('結算');
  });
});
```

### 4.5 完整遊戲流程測試

```typescript
// e2e/fullGame.spec.ts

import { test, expect } from './setup';

test.describe('Full Game Flow', () => {
  test('should complete a full game and show winner', async ({ gamePage }) => {
    await gamePage.click('[data-testid="start-game-button"]');

    // 模擬 10 回合
    for (let round = 1; round <= 10; round++) {
      // 狩獵階段：雙方各選一張卡
      const takeButtons = gamePage.locator('[data-testid^="take-button-"]');

      if (await takeButtons.count() > 0) {
        await takeButtons.first().click();
      }
      if (await takeButtons.count() > 0) {
        await takeButtons.first().click();
      }

      // 行動階段：雙方跳過
      await gamePage.click('[data-testid="pass-button"]');
      await gamePage.click('[data-testid="pass-button"]');

      // 檢查遊戲是否結束
      const gameResult = gamePage.locator('[data-testid="game-result"]');
      if (await gameResult.isVisible()) {
        break;
      }
    }

    // 驗證遊戲結束畫面
    await expect(gamePage.locator('[data-testid="game-result"]')).toBeVisible();

    // 驗證有勝者或平局
    const winnerText = gamePage.locator('[data-testid="game-result"]');
    await expect(winnerText).toContainText(/勝利|平局/);
  });

  test('should allow playing again after game ends', async ({ gamePage }) => {
    // ... 完成一局遊戲 ...

    await gamePage.click('[data-testid="play-again-button"]');

    // 驗證新遊戲開始
    await expect(gamePage.locator('[data-testid="round-indicator"]'))
      .toContainText('1/10');
  });
});
```

### 4.6 卡片效果測試

```typescript
// e2e/cardEffects.spec.ts

import { test, expect } from './setup';

test.describe('Card Effects', () => {
  test('GAIN_STONES: Salamander should give 2 stones when tamed', async ({ gamePage }) => {
    // 需要特定的測試場景設置
    // 或使用測試用 API 來設置遊戲狀態

    // 假設場上有 Salamander (F004) 且玩家有足夠石頭馴服
    // ...

    const stonesBefore = await gamePage.locator('[data-testid="stone-counter"]').textContent();

    // 馴服 Salamander
    await gamePage.click('[data-testid="tame-button-F004"]');

    const stonesAfter = await gamePage.locator('[data-testid="stone-counter"]').textContent();

    // 驗證石頭增加了 2 (減去馴服費用後)
    // ...
  });

  test('SCORE_PER_ELEMENT: Firefox should give bonus score per fire card', async ({ gamePage }) => {
    // 設置測試場景：場上有多張火卡 + Firefox

    // 進入結算階段後檢查分數計算是否正確
    // ...
  });
});
```

---

## 5. 驗收測試清單

### 5.1 功能驗收

| 編號 | 測試項目 | 預期結果 | 通過 |
|------|----------|----------|------|
| AC-01 | 遊戲初始化 | 2 位玩家正確初始化，石頭為 0，上限為 3 | [ ] |
| AC-02 | 市場顯示 | 顯示 4 張市場卡片 | [ ] |
| AC-03 | 拿取卡片 | 點擊拿取後卡片移入手牌 | [ ] |
| AC-04 | 馴服卡片(市場) | 支付石頭後卡片進入場地 | [ ] |
| AC-05 | 馴服卡片(手牌) | 支付石頭後卡片進入場地 | [ ] |
| AC-06 | 出售卡片 | 棄掉卡片並獲得等值石頭 | [ ] |
| AC-07 | 石頭不足提示 | 石頭不足時顯示提示 | [ ] |
| AC-08 | 階段轉換 | 正確在三階段間流轉 | [ ] |
| AC-09 | 回合遞增 | 每回合結束後回合數 +1 | [ ] |
| AC-10 | 分數計算 | 基礎分數正確累加 | [ ] |
| AC-11 | 計分效果 | SCORE_PER_ELEMENT 正確計算 | [ ] |
| AC-12 | 永久效果 | INCREASE_STONE_LIMIT 正確生效 | [ ] |
| AC-13 | 即時效果 | GAIN_STONES 馴服時正確觸發 | [ ] |
| AC-14 | 60 分勝利 | 達到 60 分時遊戲結束 | [ ] |
| AC-15 | 10 回合結束 | 完成 10 回合時遊戲結束 | [ ] |
| AC-16 | 勝負判定 | 正確判定勝者 | [ ] |
| AC-17 | 平局判定 | 分數相同時比較場上卡片數 | [ ] |
| AC-18 | 重新開始 | 點擊再玩一局能開始新遊戲 | [ ] |

### 5.2 UI 驗收

| 編號 | 測試項目 | 預期結果 | 通過 |
|------|----------|----------|------|
| UI-01 | 版面布局 | 所有區域正確顯示 | [ ] |
| UI-02 | 回合顯示 | 顯示當前回合數 | [ ] |
| UI-03 | 階段顯示 | 顯示當前階段名稱 | [ ] |
| UI-04 | 石頭顯示 | 正確顯示石頭數/上限 | [ ] |
| UI-05 | 分數顯示 | 正確顯示雙方分數 | [ ] |
| UI-06 | 卡片元素色 | 卡片邊框顯示元素顏色 | [ ] |
| UI-07 | 卡片詳情 | 點擊卡片顯示詳情 | [ ] |
| UI-08 | 按鈕狀態 | 禁用時顯示灰色 | [ ] |
| UI-09 | 操作提示 | 顯示當前可執行動作 | [ ] |
| UI-10 | 結果畫面 | 遊戲結束時顯示結果 | [ ] |

### 5.3 技術驗收

| 編號 | 測試項目 | 預期結果 | 通過 |
|------|----------|----------|------|
| TEC-01 | Console 無錯誤 | 遊戲過程無 JS 錯誤 | [ ] |
| TEC-02 | TypeScript | 編譯無錯誤 | [ ] |
| TEC-03 | ESLint | 無 lint 錯誤 | [ ] |
| TEC-04 | 版本號輸出 | Console 輸出 MVP 1.0.0 | [ ] |
| TEC-05 | 響應式(1280px) | 1280x720 正常顯示 | [ ] |
| TEC-06 | 響應式(1920px) | 1920x1080 正常顯示 | [ ] |
| TEC-07 | 單元測試通過 | 所有單元測試通過 | [ ] |
| TEC-08 | E2E 測試通過 | 所有 E2E 測試通過 | [ ] |

---

## 6. 測試執行

### 6.1 執行指令

```bash
# 單元測試
npm run test

# 單元測試 (監聽模式)
npm run test:watch

# 測試覆蓋率
npm run test:coverage

# E2E 測試
npm run test:e2e

# E2E 測試 (有頭模式，便於除錯)
npm run test:e2e:headed

# 全部測試
npm run test:all
```

### 6.2 package.json 腳本

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### 6.3 CI 整合

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci

      - name: Run Unit Tests
        run: npm run test:coverage

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E Tests
        run: npm run test:e2e

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 附錄 A：測試工具函數

```typescript
// __tests__/utils/testHelpers.ts

import { v4 as uuid } from 'uuid';

export function createTestState(overrides: Partial<MVPGameState> = {}): MVPGameState {
  return {
    gameId: uuid(),
    version: 'MVP-1.0.0',
    phase: GamePhase.HUNTING,
    round: 1,
    turn: 1,
    players: [createTestPlayer(), createTestPlayer()],
    currentPlayerIndex: 0,
    firstPlayerIndex: 0,
    deck: [],
    market: [],
    discardPile: [],
    huntingSelections: [],
    actionsThisPhase: [],
    isGameOver: false,
    winner: null,
    endReason: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createTestPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: uuid(),
    name: 'Test Player',
    index: 0,
    stones: 0,
    stoneLimit: 3,
    score: 0,
    roundScore: 0,
    hand: [],
    field: [],
    hasActedThisPhase: false,
    hasPassed: false,
    ...overrides,
  };
}

export function createTestCard(overrides: Partial<CardInstance> = {}): CardInstance {
  return {
    instanceId: uuid(),
    cardId: 'TEST',
    name: 'Test Card',
    nameTw: '測試卡',
    element: Element.FIRE,
    cost: 1,
    baseScore: 2,
    effectType: EffectType.NONE,
    effectTrigger: EffectTrigger.NONE,
    ownerId: null,
    location: CardLocation.DECK,
    isRevealed: false,
    scoreModifier: 0,
    hasUsedAbility: false,
    ...overrides,
  };
}

export function createCardInstance(template: CardTemplate): CardInstance {
  return {
    instanceId: uuid(),
    cardId: template.id,
    ...template,
    ownerId: null,
    location: CardLocation.DECK,
    isRevealed: false,
    scoreModifier: 0,
    hasUsedAbility: false,
  };
}
```

---

## 附錄 B：Playwright 設定

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

> **文件結束**
> 如有疑問請參考其他規格文件或聯繫開發團隊。
