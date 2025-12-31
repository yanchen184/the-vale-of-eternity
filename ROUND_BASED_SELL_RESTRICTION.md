# 回合制卡牌出售限制功能

## 功能概述
實現回合制卡牌出售限制機制，讓玩家只能出售當前回合獲得的卡片，無法出售前面回合獲得的卡片。

## 版本資訊
- **MultiplayerGame.tsx**: v5.6.0
- **PlayerHand.tsx**: v2.2.0
- **multiplayer-game.ts**: (backend service)

## 實現細節

### 1. 後端資料結構 (multiplayer-game.ts)

#### 新增欄位
在 `CardInstanceData` 介面新增 `acquiredInRound` 欄位：

```typescript
export interface CardInstanceData extends Omit<CardInstance, 'effects'> {
  cardId: string
  instanceId: string
  location: CardLocation
  ownerId: string | null
  selectedBy?: string | null
  confirmedBy?: string | null
  /** Round number when this card was acquired by current owner (for sell restriction) */
  acquiredInRound?: number  // 新增欄位
}
```

#### 設定獲得回合數
在 `distributeConfirmedCards` 函式中，當卡片分配給玩家時設定 `acquiredInRound`：

```typescript
// Line 897 in multiplayer-game.ts
await update(ref(database, `games/${gameId}/cards/${cardId}`), {
  location: CardLocation.HAND,
  ownerId: playerId,
  selectedBy: null,
  confirmedBy: null,
  acquiredInRound: game.currentRound, // 記錄獲得卡片的回合數
})
```

#### 後端驗證
在 `sellCard` 函式中檢查卡片是否可以出售：

```typescript
// Lines 1128-1131 in multiplayer-game.ts
const card: CardInstanceData = cardSnapshot.val()

// Check if card can be sold (only cards acquired in current round)
if (card.acquiredInRound !== game.currentRound) {
  throw new Error('只能賣出本回合獲得的卡片')
}
```

### 2. 前端邏輯 (PlayerHand.tsx)

#### 新增 Props
在 `PlayerHandProps` 介面新增 `currentRound` 屬性：

```typescript
export interface PlayerHandProps {
  // ... 其他屬性
  /** Current round number (for sell restriction) */
  currentRound?: number
  className?: string
}
```

#### 卡片可售狀態檢查
新增 `canSellCard` 函式來判斷卡片是否可以出售：

```typescript
// Lines 355-361 in PlayerHand.tsx
const canSellCard = useCallback((card: CardInstance) => {
  // If no currentRound is provided, allow selling all cards (backward compatibility)
  if (currentRound === undefined) return true
  // @ts-expect-error - acquiredInRound is added at runtime from Firebase
  return card.acquiredInRound === currentRound
}, [currentRound])
```

#### 條件性顯示賣出按鈕
在 `HandCardItem` 組件中，只有當 `canSell` 為 true 時才顯示賣出按鈕：

```typescript
// Line 312 in PlayerHand.tsx
<Card
  card={card}
  index={index}
  isSelected={isSelected}
  showActions={showActions && isHovered}
  onTame={onTame}
  onSell={canSell ? onSell : undefined}  // 條件性傳遞 onSell
  onClick={onSelect}
  canTame={canTame}
  className={...}
/>
```

### 3. 資料流傳遞 (MultiplayerGame.tsx)

#### ActionPhaseUI Props
新增 `currentRound` 到 `ActionPhaseUIProps`：

```typescript
interface ActionPhaseUIProps {
  // ... 其他屬性
  currentRound: number  // 新增
  isYourTurn: boolean
  // ...
}
```

#### 傳遞 currentRound
從 `gameRoom.currentRound` 傳遞到 `PlayerHand`：

```typescript
// Lines 323-333 in MultiplayerGame.tsx
<PlayerHand
  cards={handCards}
  maxHandSize={10}
  showActions={isYourTurn && !resolutionMode}
  enableDrag={isYourTurn && !resolutionMode}
  onCardPlay={onCardPlay}
  onCardSell={onCardSell}
  canTameCard={canTameCard}
  currentRound={currentRound}  // 傳遞當前回合數
  className="rounded-xl border border-purple-900/30"
/>
```

## 用戶體驗

### 第一回合
- 玩家獲得卡片後，所有手牌都可以出售
- `acquiredInRound: 1`

### 第二回合及之後
- 玩家新獲得的卡片（`acquiredInRound: 2`）可以出售
- 前一回合的卡片（`acquiredInRound: 1`）無法出售
- 賣出按鈕不會顯示在舊卡片上

### 錯誤處理
- 前端：不顯示賣出按鈕（UI層面限制）
- 後端：如果嘗試賣出舊卡片，拋出錯誤「只能賣出本回合獲得的卡片」

## 向後兼容性
- 如果 `currentRound` 未傳遞給 `PlayerHand`，則允許出售所有卡片
- 對於舊遊戲房間或未設定 `acquiredInRound` 的卡片，系統會正常運作

## 測試建議

1. **第一回合測試**
   - 確認所有新獲得的卡片都可以出售
   - 確認賣出後正確獲得金幣

2. **第二回合測試**
   - 確認第一回合的卡片無法出售（無賣出按鈕）
   - 確認第二回合新獲得的卡片可以出售
   - 嘗試透過 console 強制賣出舊卡片，確認後端驗證有效

3. **多回合測試**
   - 確認每回合只能賣出當前回合獲得的卡片
   - 確認舊卡片累積在手牌中但無法出售

## 相關檔案
- `src/services/multiplayer-game.ts` - 後端邏輯和 Firebase 操作
- `src/components/game/PlayerHand.tsx` - 手牌顯示組件
- `src/pages/MultiplayerGame.tsx` - 主遊戲介面
