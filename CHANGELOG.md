# 更新日誌

## v1.1.0 (2025-12-30)

### 🔧 重大變更
- **移除 Firebase Authentication 依賴**
  - 改用本地存儲（LocalStorage）管理玩家 ID
  - 使用 UUID 自動生成唯一玩家 ID
  - 無需 Firebase Console 配置，開箱即用

### 📝 修改內容

#### `src/services/auth.ts` (v1.1.0)
- 移除 `firebase/auth` 依賴
- 新增 `LocalUser` 介面
- 新增 `getOrCreateUserId()` - 自動生成或取得本地用戶 ID
- 更新 `signInAnon()` - 回傳 LocalUser 而非 Firebase User
- 更新 `signOut()` - 清除本地存儲
- 更新 `getCurrentUser()` - 從本地存儲讀取

#### `src/lib/firebase.ts` (v1.1.0)
- 移除 `firebase/auth` 引用
- 移除 `getAuth` 和 `connectAuthEmulator`
- 僅保留 Realtime Database 功能

#### `src/data/constants.ts` (v1.1.0)
- 新增 `STORAGE_KEYS.USER_ID` 用於存儲用戶 ID
- 更新 `APP_VERSION` 至 1.1.0

### ✅ 測試結果
- ✅ 開發伺服器正常啟動 (http://localhost:5179)
- ✅ 無編譯錯誤
- ✅ TypeScript 類型檢查通過

### 🎯 行為變更
**之前**: 依賴 Firebase Authentication 匿名登入
- 需要在 Firebase Console 啟用 Anonymous Auth
- 發生 `auth/configuration-not-found` 錯誤

**現在**: 使用本地存儲
- 首次訪問自動生成 20 字元 UUID
- 存儲在 `localStorage['vale-user-id']`
- 刪除瀏覽器數據會重新生成新 ID

### 📋 使用方式
```typescript
// 登入（自動生成或取得 ID）
const user = await signInAnon()
console.log(user.uid) // 如: "a1b2c3d4e5f6g7h8i9j0"

// 登出（清除 ID）
signOut()

// 取得當前用戶
const currentUser = getCurrentUser()
```

### 🔄 向後兼容性
- ✅ `signInAnon()` 介面保持一致，只是回傳類型改變
- ✅ 所有呼叫 `signInAnon()` 的代碼無需修改
- ✅ Firebase Realtime Database 功能完全不受影響

---

## v1.0.0 (2025-12-30)
- 初始版本發布
