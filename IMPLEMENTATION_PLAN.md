# Firebase 統一架構實施計劃

**目標**: 將單人模式遷移到 Firebase，實現單一代碼庫

**策略**: 漸進式遷移，確保每一步都可測試和回滾

---

## Phase 1: 擴展多人模式支援單人功能

### 1.1 閃電效果整合 ✅ 部分完成

**現狀**:
- ✅ effect-processor.ts 已支援 Imp (F002) 的 EARN_STONES
- ✅ effect-processor.ts 已支援 Ifrit (F007) 的 EARN_PER_ELEMENT
- ✅ LightningEffect.tsx 組件已實現
- ❌ MultiplayerGame.tsx 尚未整合閃電效果顯示

**待辦**:
1. 在 MultiplayerGame.tsx 加入 LightningEffect 組件
2. 監聽 effect-processor 的效果執行
3. 當 hasLightningEffect(cardId) 返回 true 時觸發動畫
4. 測試 Imp 和 Ifrit 的閃電效果

**預估代碼變更**:
```typescript
// MultiplayerGame.tsx
import { LightningEffect } from '@/components/game'
import { hasLightningEffect, getLightningEffectDescription } from '@/data/lightning-effect-cards'

// State
const [lightningEffect, setLightningEffect] = useState({
  isActive: false,
  cardName: '',
  cardNameTw: '',
  scoreChange: 0,
  reason: ''
})

// 在馴服卡牌時檢查閃電效果
if (hasLightningEffect(cardId)) {
  const card = getBaseCardById(cardId)
  const description = getLightningEffectDescription(...)
  setLightningEffect({
    isActive: true,
    ...description
  })
}

// 渲染
<LightningEffect
  {...lightningEffect}
  onEffectComplete={() => setLightningEffect({ isActive: false, ... })}
/>
```

---

### 1.2 神器系統整合 ❌ 未開始

**現狀**:
- ❌ multiplayer-game.ts 完全沒有神器系統
- ✅ single-player-engine.ts 有完整實現

**策略**: 將神器系統作為獨立模組加入 multiplayer-game.ts

**Firebase Schema 擴展**:
```typescript
interface GameRoom {
  // 現有欄位...
  artifacts?: {
    available: string[]  // 可用神器 ID 列表
    playerArtifacts: {
      [playerId: string]: {
        artifactId: string | null
        actionUsed: boolean
        instantExecuted: boolean
        permanentActive: boolean
      }
    }
  }
}
```

**待辦**:
1. 在 Firebase schema 加入神器欄位
2. 創建 artifact-processor.ts 處理神器效果
3. 在 multiplayer-game.ts 加入神器選擇邏輯
4. 在 MultiplayerGame.tsx 加入神器 UI (CompactArtifactSelector)
5. 實現 ACTION、INSTANT、PERMANENT 三種神器類型

**預估工作量**: 中等（約 500 行代碼）

---

### 1.3 分數歷史記錄 ❌ 未開始

**現狀**:
- ❌ 多人模式沒有分數歷史
- ✅ 單人模式有 ScoreHistory 組件

**策略**: 在 Firebase 記錄所有分數變化

**Firebase Schema 擴展**:
```typescript
interface PlayerState {
  // 現有欄位...
  scoreHistory?: Array<{
    round: number
    cardId: string
    cardName: string
    scoreChange: number
    timestamp: number
  }>
}
```

**待辦**:
1. 擴展 PlayerState schema
2. 在 score-calculator.ts 記錄每次分數變化
3. 在 MultiplayerGame.tsx 加入 ScoreHistory 組件
4. 測試歷史記錄的準確性

**預估工作量**: 小（約 100 行代碼）

---

## Phase 2: 單人模式遷移到 Firebase

### 2.1 創建單人模式 Firebase 適配器

**目標**: 讓單人模式可以使用 multiplayer-game.ts 的邏輯

**策略**: 創建一個「虛擬對手」玩家，實際上是 AI 或靜態數據

```typescript
// services/single-player-adapter.ts
export async function createSinglePlayerGame(playerName: string) {
  // 創建一個 Firebase 遊戲房間
  const gameId = await multiplayerGameService.createGame(playerName, 1) // maxPlayers = 1

  // 標記為單人模式
  await update(ref(database, `games/${gameId}`), {
    isSinglePlayer: true,
    aiOpponent: null // 單人模式沒有對手
  })

  return gameId
}
```

**待辦**:
1. 創建 single-player-adapter.ts
2. 在 SinglePlayerGame.tsx 使用 Firebase
3. 保留單人模式的所有功能（閃電、神器、分數歷史）
4. 測試遊戲流程完整性

---

### 2.2 逐步遷移 SinglePlayerGame.tsx

**步驟**:
1. ✅ Phase 1 完成後，multiplayer-game.ts 已支援所有單人功能
2. 在 SinglePlayerGame.tsx 建立 Firebase 連線
3. 使用 single-player-adapter.ts 創建遊戲
4. 逐一替換 useGameStore 為 Firebase 監聽
5. 保持 UI 完全不變

**風險控制**:
- 使用 feature flag 控制新舊系統切換
- 保留 useGameStore 作為 fallback
- 完整測試後才刪除舊代碼

---

## Phase 3: 清理與優化

### 3.1 移除 single-player-engine.ts

**前置條件**:
- ✅ Phase 2 完成
- ✅ 所有測試通過
- ✅ 用戶測試無問題

**步驟**:
1. 確認沒有任何地方引用 single-player-engine.ts
2. 移除檔案
3. 移除 useGameStore (Zustand)
4. 更新文檔

---

### 3.2 統一組件和類型

**待辦**:
1. 合併重複的類型定義
2. 統一卡牌實例格式
3. 優化 Firebase 查詢效能
4. 添加離線支援（如需要）

---

## 當前狀態

**Phase 0**: ✅ 完成
- 測試基準線已建立
- 代碼已備份

**Phase 1**: 🔄 進行中
- 1.1 閃電效果: 50% (核心邏輯完成，需整合 UI)
- 1.2 神器系統: 0%
- 1.3 分數歷史: 0%

**Phase 2**: ⏸️ 待開始

**Phase 3**: ⏸️ 待開始

---

## 下一步行動

### 立即執行 (今天)
1. ✅ 完成閃電效果 UI 整合
2. 開始實施神器系統到 multiplayer-game.ts
3. 測試閃電效果在多人模式中的表現

### 短期目標 (本週)
1. 完成 Phase 1 所有功能
2. 建立完整的多人模式功能測試
3. 準備 Phase 2 的遷移腳本

### 長期目標 (下週)
1. 完成 Phase 2 遷移
2. 執行 Phase 3 清理
3. 發布統一版本

---

## 風險評估

| 風險 | 影響 | 機率 | 應對策略 |
|------|------|------|----------|
| Firebase 效能問題 | 高 | 低 | 優化查詢，加入快取 |
| 神器系統整合複雜 | 中 | 中 | 分階段實施，充分測試 |
| 測試覆蓋不足 | 高 | 中 | 建立完整測試檢查表 |
| 用戶資料遺失 | 高 | 低 | 備份機制，漸進式遷移 |

---

## 成功指標

1. **功能完整性**: 單人模式所有功能在 Firebase 版本中正常運作
2. **效能**: 頁面載入時間 < 3 秒，操作延遲 < 100ms
3. **代碼簡化**: 刪除 4,347 行 single-player-engine.ts
4. **維護性**: 單一代碼庫，統一邏輯
5. **測試通過率**: 100%

---

**最後更新**: 2026-01-04 11:35
**負責人**: Claude + User
**預計完成**: 本週內
