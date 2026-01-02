# 場上格數限制測試

## 測試案例

### 版本：v7.6.0

### 測試邏輯
- 公式：`maxFieldSize = min(round + areaBonus, 12)`
- 回合 1 + 區域加成 0 → 最大 1 格
- 回合 1 + 區域加成 2 → 最大 3 格
- 回合 5 + 區域加成 1 → 最大 6 格
- 回合 12 + 區域加成 2 → 最大 12 格（上限）

### 測試方法
1. 啟動單人遊戲
2. 在第一回合嘗試馴服多張卡片
3. 驗證場上只能有 1 張卡片（如果 areaBonus = 0）
4. 使用 `setAreaBonus(2)` 設置區域加成
5. 驗證場上可以有 3 張卡片

### 預期行為
- `tameCreature()` 在超過限制時拋出 `ERR_FIELD_FULL` 錯誤
- `canTameCard()` 在超過限制時返回 `false`
- 錯誤訊息包含當前回合數和最大格數

### 測試結果
✅ 建置成功
✅ `getMaxFieldSize()` 方法實現
✅ `tameCreature()` 使用動態限制
✅ `canTameCard()` 使用動態限制

### 後續驗證
需要在遊戲中實際測試：
1. 開始單人遊戲
2. 第一回合嘗試馴服第二張卡片
3. 應該顯示錯誤訊息：「Field is full (maximum 1 cards for round 1)」
