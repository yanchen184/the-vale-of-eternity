# 手動模式 V2.0 設計文件

## 概述
基於用戶反饋,將手動控制面板升級為更直覺、更有實體感的操作方式。

## 設計目標
1. **石頭拿取系統**: 從「數字調整」改為「視覺化拿取」
2. **分數軌道視覺化**: 使用漩渦形分數軌道,玩家用顏色圓柱體標記位置

## V2.0 新增功能

### 1. 石頭拿取面板 (StonePickupPanel)

#### 設計理念
- 顯示石頭圖片(stone-1.png, stone-3.png, stone-6.png)
- 每種石頭顯示當前「可拿取數量」
- 點擊石頭圖片 → 拿取一個到玩家石頭池
- 提供「放回」功能

#### UI 結構
```tsx
<section className="石頭拿取區">
  <h3>💎 石頭銀行</h3>
  <p>點擊石頭圖片即可拿取</p>

  <div className="石頭展示區 grid-3">
    {/* 1點石頭 */}
    <div className="石頭卡片">
      <img src="/assets/stones/stone-1.png" />
      <div>可拿取: {bankStones.ONE} 個</div>
      <Button onClick={() => pickupStone('ONE')}>拿取</Button>
      <Button onClick={() => returnStone('ONE')}>放回</Button>
    </div>

    {/* 3點石頭 */}
    <div className="石頭卡片">
      <img src="/assets/stones/stone-3.png" />
      <div>可拿取: {bankStones.THREE} 個</div>
      <Button onClick={() => pickupStone('THREE')}>拿取</Button>
      <Button onClick={() => returnStone('THREE')}>放回</Button>
    </div>

    {/* 6點石頭 */}
    <div className="石頭卡片">
      <img src="/assets/stones/stone-6.png" />
      <div>可拿取: {bankStones.SIX} 個</div>
      <Button onClick={() => pickupStone('SIX')}>拿取</Button>
      <Button onClick={() => returnStone('SIX')}>放回</Button>
    </div>
  </div>

  <div className="玩家石頭顯示">
    <h4>你的石頭</h4>
    <div>1點: {playerStones.ONE} 個</div>
    <div>3點: {playerStones.THREE} 個</div>
    <div>6點: {playerStones.SIX} 個</div>
    <div>總值: {calculateTotal(playerStones)}</div>
  </div>
</section>
```

### 2. 分數軌道視覺化 (ScoreTrackVisual)

#### 設計理念
- 漩渦形分數軌道 (0-100分)
- 每位玩家用自己顏色的圓柱體標記
- 玩家1起始於1分,玩家2起始於2分
- 點擊分數格子可直接跳到該分數

#### 軌道設計
```
漩渦形狀範例:
         [90][91][92]
      [89]         [93]
   [88]               [94]
[87]                     [95]
[86]                     [96]
   [85]               [97]
      [84][83]...[98]
         [10][11][99]
      [9]         [100]
   [8]      [12]
[7] [6] [5] [4] [3] [2] [1] [0]
```

#### UI 結構
```tsx
<section className="分數軌道">
  <h3>🎯 分數軌道</h3>

  <div className="軌道容器">
    <svg viewBox="0 0 800 800">
      {/* 漩渦路徑 */}
      {spiralPath.map((point, index) => (
        <g key={index}>
          {/* 分數格子 */}
          <circle
            cx={point.x}
            cy={point.y}
            r="20"
            fill="#1e293b"
            stroke="#475569"
            onClick={() => moveToScore(index)}
          />
          <text x={point.x} y={point.y} textAnchor="middle">
            {index}
          </text>

          {/* 玩家標記 */}
          {players.filter(p => p.score === index).map(player => (
            <circle
              cx={point.x}
              cy={point.y + 25}
              r="10"
              fill={player.color}
              key={player.id}
            />
          ))}
        </g>
      ))}
    </svg>
  </div>

  <div className="手動調整">
    <Button onClick={() => adjustScore(+1)}>+1分</Button>
    <Button onClick={() => adjustScore(-1)}>-1分</Button>
    <Button onClick={() => adjustScore(+5)}>+5分</Button>
    <Button onClick={() => adjustScore(-5)}>-5分</Button>
  </div>
</section>
```

### 3. 狀態管理更新

#### GameState 擴展
```typescript
interface SinglePlayerGameState {
  // ... 現有欄位 ...

  // V2.0 新增
  stoneBankPool: StonePool  // 石頭銀行(可拿取的石頭)
  scoreTrackPosition: {     // 分數軌道位置
    player: number          // 玩家當前分數位置
    opponent?: number       // 對手分數位置(多人模式)
  }
}
```

#### Store Methods 新增
```typescript
interface GameStore {
  // ... 現有方法 ...

  // V2.0 新增
  pickupStone: (type: StoneType) => void       // 從銀行拿取石頭
  returnStone: (type: StoneType) => void       // 放回石頭到銀行
  moveToScore: (targetScore: number) => void   // 直接移動到指定分數
  initializStoneBank: (initial: StonePool) => void  // 初始化石頭銀行
}
```

## 實現步驟

### Phase 1: 石頭拿取系統
1. 創建 `StonePickupPanel.tsx`
2. 在 gameState 添加 `stoneBankPool`
3. 實現 `pickupStone` 和 `returnStone` 方法
4. 替換現有的 `StoneManualControl`

### Phase 2: 分數軌道視覺化
1. 創建 `ScoreTrackVisual.tsx`
2. 計算漩渦軌道座標路徑
3. 實現 SVG 渲染
4. 添加玩家標記顯示
5. 實現點擊跳轉功能

### Phase 3: 整合與優化
1. 更新 `ManualControlPanel` 整合新組件
2. 測試所有功能
3. 優化視覺效果和動畫

## 注意事項

1. **石頭銀行初始值**: 需要定義初始石頭數量(例如: ONE=20, THREE=15, SIX=10)
2. **分數軌道範圍**: 目前設計為 0-100 分,可根據實際需求調整
3. **多人模式支持**: 分數軌道設計已考慮多玩家,但當前為單人模式
4. **撤銷功能**: 石頭拿取和分數調整都需要記錄到 `manualOperations`

## 視覺風格

### 石頭拿取區
- 深色背景 (slate-800)
- 石頭圖片懸停放大效果
- 拿取/放回按鈕顏色區分

### 分數軌道
- SVG 動畫漩渦
- 玩家顏色:
  - 玩家1: 藍色 (#3b82f6)
  - 玩家2: 紅色 (#ef4444)
  - 玩家3: 綠色 (#10b981)
  - 玩家4: 黃色 (#f59e0b)

## 版本歷史
- **v1.0.0**: 基礎手動控制(數字調整)
- **v2.0.0**: 視覺化拿取 + 分數軌道
