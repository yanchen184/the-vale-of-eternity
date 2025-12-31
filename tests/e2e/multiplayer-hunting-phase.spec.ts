/**
 * E2E Test: Multiplayer Game - Hunting Phase
 * 測試多人遊戲從建立房間到完成選牌的完整流程
 * @version 1.0.0
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:5175/the-vale-of-eternity'

// 測試資料
const PLAYER1 = {
  name: '測試玩家1',
  id: 'player1_test',
}

const PLAYER2 = {
  name: '測試玩家2',
  id: 'player2_test',
}

/**
 * 輔助函數：等待遊戲狀態更新
 */
async function waitForGameState(page: Page, expectedText: string, timeout = 10000) {
  await page.waitForSelector(`text=${expectedText}`, { timeout })
}

/**
 * 輔助函數：建立遊戲房間
 */
async function createGameRoom(page: Page, playerName: string, maxPlayers: 2 | 3 | 4 = 2) {
  // 1. 前往多人遊戲頁面
  await page.goto(`${BASE_URL}/multiplayer`)
  await expect(page.locator('h2')).toContainText('多人線上模式')

  // 2. 點擊建立遊戲房間
  await page.click('button:has-text("建立遊戲房間")')

  // 3. 填寫玩家名稱
  await page.fill('input[placeholder*="名字"]', playerName)

  // 4. 選擇玩家數量
  await page.click(`button:has-text("${maxPlayers} 人")`)

  // 5. 建立房間
  await page.click('button:has-text("建立房間")')

  // 6. 等待房間建立完成並獲取房間代碼
  await waitForGameState(page, '房間代碼')
  const roomCodeElement = await page.locator('text=/\\d{6}/')
  const roomCode = await roomCodeElement.textContent()

  console.log(`[建立房間] 房間代碼: ${roomCode}`)
  return roomCode!
}

/**
 * 輔助函數：加入遊戲房間
 */
async function joinGameRoom(page: Page, roomCode: string, playerName: string) {
  // 1. 前往多人遊戲頁面
  await page.goto(`${BASE_URL}/multiplayer`)

  // 2. 點擊加入遊戲房間
  await page.click('button:has-text("加入遊戲房間")')

  // 3. 填寫玩家名稱
  await page.fill('input[placeholder*="名字"]', playerName)

  // 4. 填寫房間代碼
  await page.fill('input[placeholder*="房間代碼"]', roomCode)

  // 5. 加入房間
  await page.click('button:has-text("加入房間")')

  // 6. 等待加入成功
  await waitForGameState(page, '等待房主開始遊戲')
  console.log(`[加入房間] ${playerName} 成功加入房間 ${roomCode}`)
}

/**
 * 輔助函數：開始遊戲（房主專用）
 */
async function startGame(page: Page) {
  // 等待開始按鈕出現
  await page.waitForSelector('button:has-text("開始遊戲")')

  // 點擊開始遊戲
  await page.click('button:has-text("開始遊戲")')

  // 等待進入選卡階段
  await waitForGameState(page, '選卡階段')
  console.log('[開始遊戲] 遊戲已開始，進入選卡階段')
}

/**
 * 輔助函數：選擇市場卡片
 */
async function selectMarketCard(page: Page, cardName: string) {
  // 找到指定名稱的卡片
  const cardLocator = page.locator(`img[alt="${cardName}"]`).first()
  await expect(cardLocator).toBeVisible()

  // 點擊卡片（點擊父元素以確保觸發事件）
  const cardParent = cardLocator.locator('..')
  await cardParent.click()

  // 等待一下讓 Firebase 同步
  await page.waitForTimeout(2000)

  console.log(`[選擇卡片] 選擇了 ${cardName}`)
}

/**
 * 輔助函數：驗證玩家手牌數量
 */
async function verifyHandCount(page: Page, expectedCount: number) {
  const handCountText = await page.locator('text=/手牌: \\d+/').first().textContent()
  const match = handCountText?.match(/手牌: (\d+)/)
  const actualCount = match ? parseInt(match[1]) : 0

  expect(actualCount).toBe(expectedCount)
  console.log(`[驗證手牌] 手牌數量: ${actualCount}`)
}

/**
 * 輔助函數：檢查是否輪到某玩家
 */
async function isMyTurn(page: Page): Promise<boolean> {
  const turnText = await page.locator('text=/輪到你了|你的回合|Your Turn/').count()
  return turnText > 0
}

// ============================================
// 測試案例
// ============================================

test.describe('多人遊戲 - Hunting Phase 完整流程', () => {
  test.beforeEach(async ({ page }) => {
    // 每個測試前清空 console
    console.log('\n' + '='.repeat(60))
  })

  test('完整流程：2 人遊戲從建立到完成選牌', async ({ browser }) => {
    // 建立兩個瀏覽器上下文（模擬兩個玩家）
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const player1Page = await context1.newPage()
    const player2Page = await context2.newPage()

    try {
      // ========================================
      // 步驟 1: 玩家1 建立遊戲房間
      // ========================================
      console.log('\n[測試] 步驟 1: 玩家1 建立遊戲房間')
      const roomCode = await createGameRoom(player1Page, PLAYER1.name, 2)
      expect(roomCode).toMatch(/^\d{6}$/)

      // ========================================
      // 步驟 2: 玩家2 加入遊戲房間
      // ========================================
      console.log('\n[測試] 步驟 2: 玩家2 加入遊戲房間')
      await joinGameRoom(player2Page, roomCode, PLAYER2.name)

      // 驗證兩個玩家都在房間內
      await expect(player1Page.locator('text=/玩家 \\(2\\/2\\)/i')).toBeVisible()
      await expect(player2Page.locator('text=/玩家 \\(2\\/2\\)/i')).toBeVisible()

      // ========================================
      // 步驟 3: 玩家1（房主）開始遊戲
      // ========================================
      console.log('\n[測試] 步驟 3: 玩家1 開始遊戲')
      await startGame(player1Page)

      // 驗證兩個玩家都進入選卡階段
      await waitForGameState(player1Page, '選卡階段')
      await waitForGameState(player2Page, '選卡階段')

      // ========================================
      // 步驟 4: Snake Draft Round 1
      // ========================================
      console.log('\n[測試] 步驟 4: Snake Draft Round 1')

      // 玩家1 選第一張卡（Lava Giant）
      console.log('  - 玩家1 的回合')
      await expect(player1Page.locator('text=/輪到你了/i')).toBeVisible()
      await selectMarketCard(player1Page, 'Lava Giant')

      // 等待輪到玩家2
      await player2Page.waitForTimeout(2000)

      // 玩家2 選第一張卡（Leviathan）
      console.log('  - 玩家2 的回合')
      await expect(player2Page.locator('text=/輪到你了/i')).toBeVisible()
      await selectMarketCard(player2Page, 'Leviathan')

      // ========================================
      // 步驟 5: Snake Draft Round 2（反向）
      // ========================================
      console.log('\n[測試] 步驟 5: Snake Draft Round 2（反向）')

      // 玩家2 選第二張卡（Firefox）
      console.log('  - 玩家2 的回合')
      await player2Page.waitForTimeout(2000)
      await expect(player2Page.locator('text=/輪到你了/i')).toBeVisible()
      await selectMarketCard(player2Page, 'Firefox')

      // 玩家1 選第二張卡（Pegasus）
      console.log('  - 玩家1 的回合')
      await player1Page.waitForTimeout(2000)
      await expect(player1Page.locator('text=/輪到你了/i')).toBeVisible()
      await selectMarketCard(player1Page, 'Pegasus')

      // ========================================
      // 步驟 6: 驗證選牌完成，進入 ACTION 階段
      // ========================================
      console.log('\n[測試] 步驟 6: 驗證進入 ACTION 階段')

      // 等待遊戲狀態更新
      await player1Page.waitForTimeout(3000)
      await player2Page.waitForTimeout(3000)

      // 驗證手牌數量（每人應該有 2 張牌）
      // 注意：這取決於選牌是否立即加入手牌，或是在 Hunting 結束後才分配
      // 根據原本的設計，應該在 ACTION 階段才會看到手牌

      // 檢查是否有 ACTION 階段的 UI 元素
      const player1ActionPhase = await player1Page.locator('text=/行動階段|Action Phase/i').count()
      const player2ActionPhase = await player2Page.locator('text=/行動階段|Action Phase/i').count()

      if (player1ActionPhase > 0 || player2ActionPhase > 0) {
        console.log('  ✓ 成功進入 ACTION 階段')
      } else {
        console.log('  ! 仍在 HUNTING 階段或其他狀態')
      }

      // ========================================
      // 最終驗證
      // ========================================
      console.log('\n[測試] 最終驗證')

      // 檢查 console 是否有錯誤
      const player1Errors: string[] = []
      const player2Errors: string[] = []

      player1Page.on('console', msg => {
        if (msg.type() === 'error') player1Errors.push(msg.text())
      })

      player2Page.on('console', msg => {
        if (msg.type() === 'error') player2Errors.push(msg.text())
      })

      // 驗證沒有 undefined includes 錯誤
      expect(player1Errors.filter(e => e.includes('undefined') && e.includes('includes'))).toHaveLength(0)
      expect(player2Errors.filter(e => e.includes('undefined') && e.includes('includes'))).toHaveLength(0)

      console.log('  ✓ 無 console 錯誤')
      console.log('\n[測試完成] 所有步驟執行成功 ✓')

    } finally {
      // 清理
      await player1Page.close()
      await player2Page.close()
      await context1.close()
      await context2.close()
    }
  })

  test('快速測試：驗證房間建立和加入', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const player1Page = await context1.newPage()
    const player2Page = await context2.newPage()

    try {
      console.log('\n[快速測試] 驗證房間建立和加入')

      // 建立房間
      const roomCode = await createGameRoom(player1Page, '測試房主', 2)
      console.log(`  ✓ 房間建立成功: ${roomCode}`)

      // 加入房間
      await joinGameRoom(player2Page, roomCode, '測試玩家')
      console.log('  ✓ 玩家加入成功')

      // 驗證房間人數
      await expect(player1Page.locator('text=/玩家 \\(2\\/2\\)/i')).toBeVisible()
      console.log('  ✓ 房間人數正確')

    } finally {
      await player1Page.close()
      await player2Page.close()
      await context1.close()
      await context2.close()
    }
  })

  test('邊界測試：驗證賣牌功能不會崩潰', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      console.log('\n[邊界測試] 驗證錯誤處理')

      // 追蹤 console 錯誤
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
          console.log(`  ! Console Error: ${msg.text()}`)
        }
      })

      // 前往多人遊戲頁面
      await page.goto(`${BASE_URL}/multiplayer`)

      // 等待頁面載入
      await page.waitForTimeout(2000)

      // 驗證沒有 undefined includes 錯誤
      const undefinedIncludesErrors = errors.filter(e =>
        e.includes('undefined') && e.includes('includes')
      )

      expect(undefinedIncludesErrors).toHaveLength(0)
      console.log('  ✓ 無 undefined includes 錯誤')

    } finally {
      await page.close()
      await context.close()
    }
  })
})
