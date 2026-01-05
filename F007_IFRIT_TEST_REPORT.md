# F007 - Ifrit (伊夫利特) 測試報告

## 卡片資訊
- **ID**: F007
- **名稱**: Ifrit / 伊夫利特
- **元素**: FIRE
- **費用**: 2
- **基礎分數**: 6

## 效果
**ON_TAME: CONDITIONAL_AREA**
- 描述：你場上的每張卡獲得 1 分
- 描述（英文）：Earn 1 point for each card in your area
- 實現狀態：✅ 已實現

## 測試結果

### 測試版本
- **v1.0.0** - Console-based verification (test-f007-console.txt)

### 測試執行時間
- 2026-01-04 23:19:42 UTC
- 執行時長：17.6s
- 測試框架：Playwright E2E

### 測試場景
1. **PHASE 1**: 導航到單人遊戲 ✅
2. **PHASE 2**: 處理聖物選擇階段 ✅
3. **PHASE 3**: 選擇市場卡片進入行動階段 ✅
4. **PHASE 4**: 使用 DevTestPanel 召喚 2x F002 (Imp) 建立場上卡片 ✅
5. **PHASE 5**: 召喚 F007 (Ifrit) 並驗證效果 ✅

### 效果驗證

**預期行為**:
- F007 ON_TAME 觸發時，計算場上所有卡片數量（包括 F007 自己）
- 每張卡片獲得 1 分

**實際結果**:
```
場上卡片數量：3 (2x F002 + 1x F007) ✅
分數變化：+3 (3 cards × 1 point) ✅
效果執行：成功 ✅
```

**Console Log 證據**:
```
[EffectProcessor] CONDITIONAL_AREA (default): field has 3 cards
[EffectProcessor] CONDITIONAL_AREA: 3 all cards x 1 points = 3 total points
[EffectProcessor] CONDITIONAL_AREA: updated score 1 -> 4 (+3)
[EffectProcessor] ✅ Firebase updated successfully
```

### 測試通過狀態
✅ **PASSED** - F007 ON_TAME 效果完全符合預期

## 修正內容

### 1. 卡片定義修正 (src/data/cards/fire-cards.ts:180-189)

**修正前 (v3.5.0)**:
```typescript
effects: [
  {
    type: EffectType.CONDITIONAL_AREA,
    trigger: EffectTrigger.ON_TAME,
    stones: [{ type: StoneType.ONE, amount: 1 }], // ❌ 錯誤：給石頭
    description: 'Earn 1 for each card in your area.',
    descriptionTw: '你場上的每張卡獲得 1 個 1 點石頭。', // ❌ 錯誤描述
    isImplemented: true,
  },
]
```

**修正後 (v3.6.0)**:
```typescript
effects: [
  {
    type: EffectType.CONDITIONAL_AREA,
    trigger: EffectTrigger.ON_TAME,
    value: 1, // ✅ 正確：給分數
    description: 'Earn 1 point for each card in your area.',
    descriptionTw: '你場上的每張卡獲得 1 分。', // ✅ 正確描述
    isImplemented: true,
  },
]
```

**修正原因**：
- 用戶明確指出：「F007 應該給的是分數」
- 用戶提供正確效果：「你場上的每張卡獲得1分」

### 2. 效果處理器安全性增強 (src/services/effect-processor.ts:559-563)

**新增安全檢查**:
```typescript
private async processConditionalArea(...) {
  const { gameId, playerId, currentPlayerState, gameCards, cardInstanceId } = context

  // ✅ 新增：確保 currentPlayerState 存在
  if (!currentPlayerState) {
    console.error(`[EffectProcessor] ERROR: currentPlayerState is undefined`)
    return { success: false, error: 'Player state not found' }
  }

  // ... rest of function
}
```

**修正原因**：
- 測試過程中發現 `currentPlayerState` 可能為 `undefined`
- 防止 `TypeError: Cannot read properties of undefined (reading 'field')`

## 測試檔案

### tests/e2e/cards/F007-ifrit-console.spec.ts
- **測試方法**: Console log 驗證（繞過 UI selector 問題）
- **驗證內容**:
  - 解析 EffectProcessor 的 console log
  - 提取場上卡片數量和分數變化
  - 驗證數值是否符合預期
- **優點**:
  - 直接驗證核心邏輯
  - 不依賴 UI selector
  - 執行速度快（17.6s）

## 已知問題

### UI Selector 問題
**問題描述**:
- `[data-testid^="field-card-"]` selector 回傳 0 卡片（實際有 3 張）
- `[data-testid^="score-bar-player-"]` selector 無法讀取分數（實際分數正確更新）

**影響範圍**:
- 僅影響 UI 驗證
- 核心效果處理邏輯完全正常

**解決方案**:
- 採用 console log 驗證方式
- 未來需要修正 selector 或調整 DOM 結構

## 下一步

### 待測試卡片 (13張)
- F001 - Hestia (赫斯提亞)
- F003 - Succubus (魅魔)
- F004 - Firefox (火狐)
- F005 - Salamander (火蜥蜴)
- F006 - Horned Salamander (角火蜥蜴)
- F008 - Incubus (夢魔)
- F009 - Burning Skull (燃燒骷髏)
- F010 - Lava Giant (熔岩巨人)
- F011 - Phoenix (鳳凰)
- F012 - Agni (阿耆尼)
- F013 - Asmodeus (阿斯莫德)
- F014 - Balog (巴洛格)
- F015 - Surtr (蘇爾特爾)

### 測試進度
- ✅ F002 (Imp) - ON_TAME + ON_SCORE 完整測試
- ✅ F007 (Ifrit) - ON_TAME 測試
- ⏳ 其餘 13 張火屬性卡片
- ⏳ 70 張其他元素卡片

## 版本記錄
- **v3.6.0** - 修正 F007 卡片定義（stones → value: 1）
- **v1.0.0** - F007 測試通過（console 驗證方式）
