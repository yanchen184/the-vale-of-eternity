# 單人/多人模式統一遷移計畫

**版本**: v1.0.0
**日期**: 2026-01-04
**預估時程**: 3-4 週
**風險等級**: 🔴 HIGH（超級大改動）

---

## 📊 現狀分析

### 代碼規模
```
single-player-engine.ts:  4,347 行
multiplayer-game.ts:      3,825 行
effect-processor.ts:        455 行
─────────────────────────────────
總計:                     8,627 行代碼需要審查和合併
```

### 關鍵差異

| 功能 | 單人模式 | 多人模式 | 遷移策略 |
|-----|---------|---------|---------|
| **閃電效果** | ✅ 完整 | ❌ 無 | 遷移到多人 |
| **神器系統** | ✅ 獨立實現 | ✅ 獨立實現 | 統一邏輯 |
| **效果處理** | ❌ 內嵌 | ✅ effect-processor | 統一使用處理器 |
| **結算階段** | ✅ SCORE phase | ✅ RESOLUTION phase | 統一命名和邏輯 |
| **分數歷史** | ✅ scoreHistory | ❌ 無 | 加入多人 |
| **測試模式** | ✅ forceTestCards | ❌ 無 | 保留測試功能 |

---

## 🎯 遷移目標

### 最終架構
```
統一遊戲流程:
  1. 創建遊戲 (isSinglePlayer: boolean)
  2. Firebase 房間 (1 人 或 多人)
  3. 統一的遊戲邏輯 (multiplayer-game.ts)
  4. 共用的效果處理器 (effect-processor.ts)
  5. 共用的 UI 組件 (已完成 95%)
```

---

## 📋 階段 0：準備工作（預估 1-2 天）

### ✅ 任務清單

#### 1. **建立功能清單**
- [ ] 列出所有單人模式獨有功能（見附錄 A）
- [ ] 列出所有多人模式獨有功能（見附錄 B）
- [ ] 標記需要合併的重複功能

#### 2. **建立測試基準線**
```bash
# 執行現有測試套件並記錄結果
npm test > test-baseline-before.txt

# 單人模式手動測試檢查表
- [ ] 閃電效果 (Ifrit F007)
- [ ] 閃電效果 (Imp F002)
- [ ] 神器選擇流程
- [ ] 神器效果執行（所有神器）
- [ ] 結算階段回手效果
- [ ] 分數歷史記錄
- [ ] 區域加成切換
- [ ] 遊戲結束條件
```

#### 3. **備份現有代碼**
```bash
# 創建備份分支
git checkout -b backup/single-player-engine-original
git commit -m "backup: 保存原始單人引擎代碼"
git push origin backup/single-player-engine-original

# 返回主分支
git checkout master
```

#### 4. **文檔整理**
- [ ] 閱讀並理解 `single-player-engine.ts` 所有方法
- [ ] 閱讀並理解 `multiplayer-game.ts` 所有方法
- [ ] 建立方法對照表（見附錄 C）

---

## 📋 階段 1：擴展多人模式支援單人（預估 1 週）

### 目標
在 `multiplayer-game.ts` 中加入單人模式支援，但**不刪除**單人引擎。

### 任務

#### 1.1 **擴展 GameRoom 數據結構**

```typescript
// src/services/multiplayer-game.ts
export interface GameRoom {
  // ... 現有欄位 ...

  // 新增：單人模式支援
  isSinglePlayer: boolean  // 是否為單人模式

  // 新增：分數歷史（從單人遷移）
  scoreHistory?: Array<{
    timestamp: number
    playerId: string
    playerName: string
    action: string
    scoreChange: number
    totalScore: number
    reason: string
  }>

  // 新增：測試模式（從單人遷移）
  forceTestCards?: boolean  // 強制測試卡片出現
}
```

#### 1.2 **新增單人遊戲創建方法**

```typescript
/**
 * 創建單人遊戲（本質上是 1 人的多人房間）
 */
export async function createSinglePlayerGame(
  playerName: string,
  expansionMode: boolean = true,
  forceTestCards: boolean = false
): Promise<string> {
  const gameId = generateId()
  const playerId = generateId()

  // 創建單人房間
  const gameRoom: GameRoom = {
    gameId,
    roomCode: 'SINGLE', // 單人模式不需要房間代碼
    maxPlayers: 1,
    isSinglePlayer: true,
    isExpansionMode: expansionMode,
    forceTestCards,
    status: 'HUNTING',
    // ... 其他初始化
  }

  // 寫入 Firebase
  await set(ref(database, `games/${gameId}`), gameRoom)

  return gameId
}
```

#### 1.3 **遷移閃電效果系統**

```typescript
// 在 multiplayer-game.ts 中加入
import { hasLightningEffect, getLightningEffectDescription } from '@/data/lightning-effect-cards'

/**
 * 處理閃電效果卡片（Ifrit, Imp）
 */
async function handleLightningEffect(
  gameId: string,
  playerId: string,
  cardInstanceId: string,
  effectValue: number,
  effectType: 'score' | 'stones'
) {
  const gameRef = ref(database, `games/${gameId}`)
  const cardData = await getCardData(gameId, cardInstanceId)

  if (!hasLightningEffect(cardData.cardId)) return

  const description = getLightningEffectDescription(
    cardData.cardId,
    cardData.name,
    cardData.nameTw,
    effectValue
  )

  // 觸發閃電效果 UI
  await update(gameRef, {
    [`lightningEffect`]: {
      cardName: description.cardName,
      cardNameTw: description.cardNameTw,
      reason: description.reason,
      scoreChange: effectType === 'score' ? effectValue : 0,
      showScoreModal: effectType === 'score',
      timestamp: Date.now(),
    }
  })
}
```

#### 1.4 **統一神器效果執行**

**策略**：保留兩邊現有實現，先確保功能不變。

- [ ] 標記單人引擎中的神器邏輯（保留不動）
- [ ] 檢查多人引擎中的神器邏輯（保留不動）
- [ ] 下階段再統一

---

## 📋 階段 2：漸進式遷移（預估 2 週）

### 策略
**雙軌並行**：保留單人引擎，逐步將功能遷移到多人引擎，並持續測試。

### 2.1 **單一功能遷移流程**（範例：閃電效果）

```
1. 在多人引擎加入功能 → 測試多人模式
2. 修改單人模式使用多人引擎 → 測試單人模式
3. 確認兩邊都正常 → 從單人引擎移除此功能
4. 重複下一個功能
```

### 2.2 **功能遷移優先順序**

| 優先級 | 功能 | 複雜度 | 風險 |
|-------|-----|-------|-----|
| P0 (必須) | 閃電效果 | 低 | 低 |
| P0 | 分數歷史 | 低 | 低 |
| P1 (重要) | 神器效果統一 | **高** | **高** |
| P1 | 結算階段統一 | 中 | 中 |
| P2 (加分) | 測試模式 | 低 | 低 |

### 2.3 **測試策略**

每完成一個功能遷移，執行：

```bash
# 1. 單元測試
npm test

# 2. E2E 測試
npm run test:e2e

# 3. 手動測試檢查表
- [ ] 單人模式：所有功能正常
- [ ] 多人模式：所有功能正常
- [ ] 效能：無明顯延遲
- [ ] Firebase：數據結構正確
```

---

## 📋 階段 3：最終清理（預估 3-5 天）

### 目標
刪除舊的單人引擎，完全統一。

### 3.1 **清理清單**

```bash
# 刪除的檔案
src/lib/single-player-engine.ts (4,347 行)
src/stores/useGameStore.ts
src/lib/game-engine.ts (廢棄的 MVP 引擎)
src/lib/__tests__/game-engine.test.ts

# 保留的檔案
src/services/multiplayer-game.ts (統一引擎)
src/services/effect-processor.ts (統一效果處理)
src/data/lightning-effect-cards.ts (共用)
```

### 3.2 **重構 SinglePlayerGame.tsx**

```typescript
// 從 1,600 行縮減到 < 200 行
export default function SinglePlayerGame() {
  const [gameId, setGameId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const playerName = localStorage.getItem('playerName') || 'Player'
      const id = await multiplayerGameService.createSinglePlayerGame(playerName, true)
      setGameId(id)
    }
    init()
  }, [])

  if (!gameId) return <LoadingScreen />

  // 直接使用 MultiplayerGame！
  return <MultiplayerGame gameId={gameId} isSinglePlayer={true} />
}
```

### 3.3 **最終測試**

```bash
# 完整回歸測試
npm run test:all

# 效能測試
npm run test:performance

# 手動測試（1-2 小時完整測試）
- [ ] 單人遊戲完整流程（開始→結束）
- [ ] 多人遊戲完整流程（2-4 人）
- [ ] 所有神器效果
- [ ] 所有卡片效果
- [ ] 閃電效果
- [ ] 結算階段
```

---

## 🚨 風險控管

### 高風險區域

1. **神器系統** - 兩邊實現完全不同
   - **緩解策略**：分階段遷移，每個神器單獨測試

2. **效果處理** - 單人內嵌，多人使用處理器
   - **緩解策略**：先將單人改用處理器，確認正常再統一

3. **狀態同步** - Zustand vs Firebase
   - **緩解策略**：保持雙軌運行，直到完全確定多人版本正常

### 回退計畫

如果遷移失敗：

```bash
# 回退到備份分支
git checkout backup/single-player-engine-original

# 或使用 git revert
git revert <commit-hash>
```

---

## 📈 成功指標

### 必須達成（Go/No-Go）
- [ ] 所有單人功能在新架構中正常運作
- [ ] 所有多人功能未受影響
- [ ] 無效能退化（< 10% 延遲增加）
- [ ] 測試覆蓋率 > 80%

### 加分項目
- [ ] 代碼行數減少 > 2,000 行
- [ ] 維護複雜度降低
- [ ] Firebase 用量在免費額度內

---

## 📚 附錄

### 附錄 A：單人模式獨有功能清單

1. **閃電效果系統**
   - `ifritEffectTriggered` 狀態
   - `LightningEffect` 組件整合
   - 自動觸發分數彈窗

2. **分數歷史**
   - `scoreHistory` 陣列
   - 每次分數變化的詳細記錄

3. **測試模式**
   - `forceTestCardsInMarket` 參數
   - 強制 Ifrit, Imp 出現

4. **區域加成**
   - `areaBonus` 切換 (0→1→2)
   - 動態場地欄位數量

5. **即時加成分數**
   - `instantBonusScore` (Ifrit 用)

### 附錄 B：多人模式獨有功能清單

1. **房間系統**
   - 房間代碼
   - 等待室
   - 玩家加入/離開

2. **回合制邏輯**
   - 當前玩家追蹤
   - Pass 機制
   - 回合順序管理

3. **動作日誌**
   - `actionLog` 陣列
   - 即時動作廣播

4. **音效系統**
   - 其他玩家動作音效同步
   - 階段轉換音效

### 附錄 C：方法對照表

| 功能 | 單人方法 | 多人方法 | 狀態 |
|-----|---------|---------|-----|
| 抽牌 | `drawCard()` | `drawCardFromDeck()` | ✅ 相似 |
| 馴服 | `tameCreature()` | `tameCard()` | ✅ 相似 |
| 賣卡 | `sellCurrentCard()` | `sellCard()` | ✅ 相似 |
| 選神器 | `selectArtifact()` | `selectArtifact()` | ✅ 相同 |
| 執行神器 | `executeArtifactEffect()` | 各神器獨立方法 | ⚠️ 不同 |
| 結算 | `completeSettlement()` | `finishResolution()` | ⚠️ 不同 |

---

## 📝 變更日誌

- **2026-01-04**: 初版計畫建立
- **待更新**: 各階段完成時間

---

## ✅ 核准簽名

**技術負責人**: ___________
**QA 負責人**: ___________
**日期**: ___________

**重要提醒**: 此為超級大改動，請務必：
1. ✅ 完整閱讀此文檔
2. ✅ 建立備份分支
3. ✅ 每天提交進度
4. ✅ 持續測試
5. ✅ 隨時可回退
