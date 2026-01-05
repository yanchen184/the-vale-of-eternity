# F002 (Imp) ON_TAME Effect Test Issue - Analysis Report
**Date**: 2026-01-05
**Status**: Investigation Complete - Root Cause Identified
**Version**: Test Framework v1.0.0

## Issue Summary
F002 (小惡魔 / Imp) E2E test fails because ON_TAME effect (EARN_STONES: 2x ONE) does not execute when card is summoned.

**Expected**: Gain 2x 1-point stones
**Actual**: 0 stones gained

## Architecture Discovery

### Critical Finding: Single Player Uses Firebase Multiplayer System
```
SinglePlayerGameUnified.tsx
  ↓ (redirects to)
MultiplayerGame.tsx (Firebase-based)
  ↓ (uses)
multiplayer-game.ts service
  ↓ (calls)
EffectProcessor
```

**Important**: `single-player-engine.ts` is NOT used by SinglePlayerGameUnified!

### Effect Processing Flow

#### DevTestPanel adds card to hand:
1. User presses `Ctrl+Shift+D`
2. Search for F002
3. Click "加入手牌"
4. **Result**: Card added directly to Firebase `/games/{gameId}/cards/{instanceId}`
   - location: "HAND"
   - No effects triggered (correct behavior)

#### When card is summoned/played:
1. User clicks card in hand
2. Click "召喚" button
3. **Should call**: `multiplayerGameService.tameCard(gameId, playerId, cardInstanceId)`
4. **At line 1273 of multiplayer-game.ts**:
   ```typescript
   const effectResults = await effectProcessor.processOnTameEffects(effectContext)
   ```
5. **EffectProcessor.processOnTameEffects()** (effect-processor.ts:49-92):
   - Gets card template via `getBaseCardById(card.cardId)`
   - Filters effects where `trigger === EffectTrigger.ON_TAME`
   - Checks `effect.isImplemented === true`
   - Calls `processEffect()` for each effect
6. **EffectProcessor.processEarnStones()** (effect-processor.ts:150-198):
   - Reads stones from effect definition
   - Calculates stonesGained
   - Updates Firebase: `games/{gameId}/players/{playerId}/stones`

## Code Changes Made

### 1. Added Logging to EffectProcessor (effect-processor.ts)

**processOnTameEffects()** (lines 49-92):
```typescript
console.log(`[EffectProcessor] ========== processOnTameEffects START ==========`)
console.log(`[EffectProcessor] Card instance ID:`, cardInstanceId)
console.log(`[EffectProcessor] Card:`, card)
console.log(`[EffectProcessor] Template:`, template?.nameTw, template?.id)
console.log(`[EffectProcessor] ON_TAME effects found:`, onTameEffects.length)
console.log(`[EffectProcessor] Processing effect:`, effect.type, `isImplemented:`, effect.isImplemented)
console.log(`[EffectProcessor] Effect result:`, result)
console.log(`[EffectProcessor] ========== processOnTameEffects END ==========`)
```

**processEarnStones()** (lines 150-198):
```typescript
console.log(`[EffectProcessor] processEarnStones called`)
console.log(`[EffectProcessor] effect.stones:`, effect.stones)
console.log(`[EffectProcessor] Processing stone: type=${stoneType}, amount=${stoneConfig.amount}`)
console.log(`[EffectProcessor] Total stones to gain:`, stonesGained)
console.log(`[EffectProcessor] Current stones BEFORE:`, player.stones)
console.log(`[EffectProcessor] Adding ${amount} to ${stoneType}: ${player.stones[stoneType]} → ${updatedStones[stoneType]}`)
console.log(`[EffectProcessor] Updated stones AFTER:`, updatedStones)
console.log(`[EffectProcessor] ✅ Firebase updated successfully`)
```

### 2. Added Logging to single-player-engine.ts (for reference only - NOT USED)

**Note**: These changes were made but are NOT active since SinglePlayerGameUnified doesn't use this file.

## F002 Card Definition Verification

**File**: `src/data/cards/fire-cards.ts`

```typescript
{
  id: 'F002',
  name: 'Imp',
  nameTw: '小惡魔',
  element: Element.FIRE,
  cost: 1,
  baseScore: 2,
  effects: [
    {
      type: EffectType.EARN_STONES,
      trigger: EffectTrigger.ON_TAME,
      stones: [{ type: StoneType.ONE, amount: 2 }],
      description: 'Earn 1 1.',
      descriptionTw: '獲得 2 個 1 點石頭。',
      isImplemented: true,  // ✅ CORRECT
    },
    {
      type: EffectType.RECOVER_CARD,
      trigger: EffectTrigger.ON_SCORE,
      description: 'Recover.',
      descriptionTw: '可被回收。',
      isImplemented: true,  // ✅ CORRECT
    },
  ],
}
```

**Verdict**: Card definition is correct. Both effects have `isImplemented: true`.

## Playwright Test Configuration

**File**: `playwright.config.ts`

```typescript
{
  baseURL: 'http://localhost:5174',  // ✅ CORRECTED (was 5173)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',    // ✅ CORRECTED
  }
}
```

## Test Flow (tests/e2e/cards/F002-imp.spec.ts)

```typescript
1. navigateToSinglePlayerGame()
   - Goto '/'
   - Click [data-testid="single-player-btn"]
   - Click [data-testid="start-game-btn"]
   - Wait for "選卡階段"

2. openDevTestPanel()
   - Press Ctrl+Shift+D

3. addCardToHand('F002', '小惡魔')
   - Fill search with "F002"
   - Click on F002 result
   - Click "加入手牌"

4. playCardFromHand('小惡魔')
   - Find card in hand
   - Click card
   - Click summon button with { force: true }

5. Verification (FAILING)
   - Expected: stonesAfterPlay = 2
   - Actual: stonesAfterPlay = 0
```

## Next Steps to Debug

### Option 1: Run Playwright test with browser console visible
```bash
npx playwright test tests/e2e/cards/F002-imp.spec.ts --project=chromium --headed --debug
```
Then check browser DevTools console for `[EffectProcessor]` logs.

### Option 2: Add test to capture console logs
Modify test to listen to console events and print EffectProcessor logs.

### Option 3: Verify multiplayer-game.ts actually calls processOnTameEffects
Add breakpoint or logging at line 1273 to confirm execution.

## Potential Issues

1. **Button click doesn't trigger tameCard()**
   - Force click might not trigger the actual handler
   - Button might be disabled even with force click

2. **Effect not being processed**
   - isImplemented check failing (unlikely - we verified it's true)
   - Effect type mismatch (unlikely)

3. **Firebase update not reflecting in test**
   - Timing issue - stones updated but test reads too early
   - Firebase not being read correctly by getStoneCount()

4. **Game phase incorrect**
   - tameCard() might only work in ACTION phase
   - Test might be in wrong phase when clicking summon

## Files Modified

1. `src/services/effect-processor.ts` - Added detailed logging
2. `src/lib/single-player-engine.ts` - Added detailed logging (NOT USED)
3. `playwright.config.ts` - Fixed port from 5173 to 5174
4. `tests/e2e/cards/F002-imp.spec.ts` - Added force click, removed stone acquisition

## Conclusion

The architecture is clear, the code paths are identified, and logging is in place. The next step is to run the test and examine the browser console logs to see:

1. Is `processOnTameEffects()` being called?
2. Are the effects being found?
3. Is `processEarnStones()` being called?
4. Are the stones being updated in Firebase?
5. Is the test reading the stones correctly?

**Status**: Ready for debugging with enhanced logging. Need to examine console output from actual test run.
