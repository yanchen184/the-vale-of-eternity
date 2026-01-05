# F002 ON_TAME Effect Test - Root Cause Analysis & Solution

**Date**: 2026-01-05
**Status**: Root Cause Identified - Solution Designed
**Version**: v1.0.0

---

## 🔍 Root Cause Summary

**The DevTestPanel's "加入手牌" button does NOT trigger ON_TAME effects!**

### Why ON_TAME Effect Never Executed

1. **DevTestPanel只加入手牌，不觸發召喚**
   - `handleSummonCard()` 只創建卡片並設置 `location: 'HAND'`
   - **沒有調用** `multiplayerGameService.tameCard()`
   - **沒有觸發** `EffectProcessor.processOnTameEffects()`

2. **從手牌召喚的按鈕被禁用**
   - 測試在 HUNTING 階段（選卡階段）使用 DevTestPanel
   - DevTestPanel 會將遊戲狀態重置回 HUNTING
   - `canTameCard()` 檢查 `gameRoom?.status !== 'ACTION'` → 返回 false
   - 召喚按鈕顯示為"魔力不足"並被禁用

3. **即使強制點擊也無效**
   - `{ force: true }` 只是繞過 Playwright 的可見性檢查
   - 但 React 的 onClick handler 根本不會執行
   - 因為按鈕的 disabled 屬性會阻止事件觸發

---

## 📊 完整流程分析

### ❌ 當前測試流程（失敗）

```
1. 進入遊戲 → HUNTING 階段
2. 完成選卡 → ACTION 階段 ✅
3. 打開 DevTestPanel
4. 點擊"加入手牌" → 調用 handleSummonCard()
   └─ 創建卡片：location: 'HAND'
   └─ 添加到 Firebase: games/{gameId}/cards/{instanceId}
   └─ 更新手牌: games/{gameId}/players/{playerId}/hand
   └─ ❌ 遊戲狀態變回 HUNTING！
5. 嘗試點擊"召喚"按鈕
   └─ 檢查 canTameCard() → false (status !== 'ACTION')
   └─ 按鈕 disabled
   └─ ❌ handleTameCard() 永遠不會被調用
6. ❌ processOnTameEffects() 永遠不會執行
7. ❌ 石頭數量 = 0（沒有獲得 2x 1點石頭）
```

### ✅ 正確流程（應該如此）

```
1. 進入遊戲 → HUNTING 階段
2. 等待市場顯示卡片
3. 在市場中找到 F002（小惡魔）
4. 點擊 F002 卡片
5. 點擊"拿取"按鈕 → 卡片加入手牌
6. 確認選擇 → 進入 ACTION 階段
7. 點擊手牌中的 F002
8. 點擊"召喚"按鈕
   └─ 調用 handleTameCard(cardInstanceId)
   └─ 調用 multiplayerGameService.tameCard()
   └─ 調用 EffectProcessor.processOnTameEffects() ✅
   └─ 調用 EffectProcessor.processEarnStones() ✅
   └─ 更新 Firebase: players/{playerId}/stones ✅
9. ✅ 石頭數量 = 2（獲得 2x 1點石頭）
```

---

## 🎯 解決方案

### 方案 A：修改測試策略（推薦）

**從市場選擇 F002，而不是使用 DevTestPanel**

**優點**：
- ✅ 完整測試真實遊戲流程
- ✅ 確保 ON_TAME 效果被觸發
- ✅ 不需要修改任何代碼
- ✅ 符合實際玩家操作

**缺點**：
- ⚠️ 依賴隨機市場（F002 可能不在市場中）
- ⚠️ 需要多次重試才能測試特定卡片

**實現難點**：
```typescript
// 問題：如何確保 F002 出現在市場？
// 1. 重啟遊戲多次直到 F002 出現（不可靠）
// 2. 修改遊戲代碼添加"測試模式"強制特定卡片出現（侵入性）
// 3. 直接操作 Firebase 將 F002 加入市場（複雜）
```

---

### 方案 B：修復 DevTestPanel（推薦）

**在 DevTestPanel 添加"直接召喚到場上"按鈕**

#### 修改 1：DevTestPanel.tsx

```typescript
interface DevTestPanelProps {
  onClose: () => void
  onSummonCard?: (cardId: string) => void
  onTameCard?: (cardId: string) => void  // 新增：直接召喚到場上
  onResetGame?: () => void
  // ... 其他 props
}

// 在卡片詳情區域添加兩個按鈕
<div className="flex gap-2 mt-3">
  <button
    onClick={() => onSummonCard?.(selectedCard.id)}
    className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm"
  >
    🃏 加入手牌
  </button>
  <button
    onClick={() => onTameCard?.(selectedCard.id)}
    className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
  >
    ⚡ 直接召喚 (觸發效果)
  </button>
</div>
```

#### 修改 2：MultiplayerGame.tsx

```typescript
// 新增：直接召喚卡片到場上並觸發 ON_TAME 效果
const handleDevTameCard = useCallback(async (cardId: string) => {
  if (!import.meta.env.DEV) return
  if (!gameId || !playerId) return

  const cardTemplate = getCardById(cardId)
  if (!cardTemplate) {
    console.error('[MultiplayerGame] Card not found:', cardId)
    return
  }

  try {
    // 1. 創建卡片實例
    const uniqueInstanceId = `${cardId}_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const cardData = {
      instanceId: uniqueInstanceId,
      cardId: cardTemplate.id,
      name: cardTemplate.name,
      nameTw: cardTemplate.nameTw,
      element: cardTemplate.element,
      cost: cardTemplate.cost,
      baseScore: cardTemplate.baseScore,
      ownerId: playerId,
      location: 'HAND' as const,  // 先加入手牌
      isRevealed: true,
      scoreModifier: 0,
      hasUsedAbility: false,
    } as CardInstanceData

    // 2. 添加到 Firebase
    const updates: Record<string, any> = {}
    updates[`games/${gameId}/cards/${uniqueInstanceId}`] = cardData

    const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
    const playerSnapshot = await get(playerRef)
    const playerData = playerSnapshot.val()
    const currentHand = playerData.hand || []

    updates[`games/${gameId}/players/${playerId}/hand`] = [...currentHand, uniqueInstanceId]
    await update(ref(database), updates)

    console.log('[MultiplayerGame] Card added to hand, now taming...')

    // 3. 立即召喚（觸發 ON_TAME）
    await multiplayerGameService.tameCard(gameId, playerId, uniqueInstanceId)

    console.log('[MultiplayerGame] ✅ Card tamed with ON_TAME effects triggered')
  } catch (err) {
    console.error('[MultiplayerGame] Failed to dev-tame card:', err)
  }
}, [gameId, playerId])

// 在 DevTestPanel 組件中傳入
<DevTestPanel
  onClose={() => setDevTestPanelOpen(false)}
  onSummonCard={handleSummonCard}
  onTameCard={handleDevTameCard}  // 新增
  // ... 其他 props
/>
```

**優點**：
- ✅ 完整測試 ON_TAME 效果
- ✅ 可以測試任何卡片
- ✅ 不依賴隨機市場
- ✅ 保持遊戲狀態不變（仍在 ACTION 階段）

**缺點**：
- ⚠️ 需要修改兩個文件
- ⚠️ 增加了開發模式的複雜度

---

### 方案 C：使用 Chrome DevTools MCP 直接操作 Firebase

**通過瀏覽器 console 直接調用 Firebase API**

```javascript
// 在瀏覽器 console 執行
const { ref, update } = await import('firebase/database');
const { database } = await import('@/lib/firebase');

// 直接調用 tameCard
await multiplayerGameService.tameCard(
  'game_id',
  'player_id',
  'card_instance_id'
);
```

**優點**：
- ✅ 不需要修改代碼
- ✅ 完全控制測試流程

**缺點**：
- ❌ 無法自動化
- ❌ 需要手動執行每次測試
- ❌ 不適合 CI/CD

---

## ✅ 推薦方案：方案 B

修復 DevTestPanel，添加"直接召喚"功能。

**理由**：
1. 完整測試 ON_TAME 效果
2. 可重複使用於所有 70 張卡片測試
3. 不依賴隨機市場
4. 保持測試自動化
5. 開發者友好（未來測試其他效果也能用）

---

## 📝 下一步行動

1. ✅ 識別根本原因：DevTestPanel 不觸發 ON_TAME
2. ⏭️ 實現方案 B：修改 DevTestPanel 和 MultiplayerGame
3. ⏭️ 更新 E2E 測試使用新的"直接召喚"按鈕
4. ⏭️ 驗證 F002 測試通過
5. ⏭️ 擴展到其餘火屬性卡片
6. ⏭️ 擴展到所有 70 張卡片

---

## 🎓 學到的教訓

1. **DevTestPanel 的真正用途**
   - ✅ 添加卡片到手牌（供手動測試）
   - ✅ 添加石頭
   - ✅ 清空場地
   - ❌ **不是**用來自動化測試卡片效果

2. **ON_TAME 效果只在真正召喚時觸發**
   - 必須調用 `multiplayerGameService.tameCard()`
   - 直接操作 Firebase 添加卡片不會觸發效果

3. **E2E 測試需要模擬真實流程**
   - 不能依賴捷徑或 hack
   - 需要測試完整的用戶操作路徑

---

## 附錄：調試日誌分析

### 成功的日誌（應該看到）
```
[EffectProcessor] ========== processOnTameEffects START ==========
[EffectProcessor] Card instance ID: F002_test_xxx
[EffectProcessor] Template: 小惡魔 F002
[EffectProcessor] ON_TAME effects found: 1
[EffectProcessor] Processing effect: EARN_STONES isImplemented: true
[EffectProcessor] processEarnStones called
[EffectProcessor] Total stones to gain: {ONE: 2}
[EffectProcessor] Current stones BEFORE: {ONE: 0, THREE: 0, ...}
[EffectProcessor] Updated stones AFTER: {ONE: 2, THREE: 0, ...}
[EffectProcessor] ✅ Firebase updated successfully
[EffectProcessor] ========== processOnTameEffects END ==========
```

### 當前的日誌（失敗）
```
[MultiplayerGame] Summoning card to hand via Firebase: {...}
[MultiplayerGame] Card added to hand: F002
[TEST] Played card: 小惡魔
[TEST] Stones after play: 0
❌ NO [EffectProcessor] logs at all!
```

**原因**: `handleTameCard()` 從未被調用，所以 EffectProcessor 完全沒有執行。

---

**結論**: 需要修復 DevTestPanel 以支持測試卡片效果，或者改用從市場選卡的測試策略。推薦實現方案 B。
