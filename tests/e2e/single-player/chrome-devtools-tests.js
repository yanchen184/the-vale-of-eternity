/**
 * Single Player E2E Tests using Chrome DevTools
 * Version: 1.0.0
 *
 * 使用方式：
 * 1. 確保開發伺服器運行：npm run dev
 * 2. 在瀏覽器訪問測試頁面
 * 3. 在 Console 中執行測試腳本
 *
 * 快速執行所有測試：
 * runAllTests()
 *
 * 執行單一測試：
 * test01_sanctuary()
 */

// ============================================
// 工具函數
// ============================================

const TestUtils = {
  /**
   * 等待元素出現
   */
  async waitForSelector(selector, timeout = 5000) {
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector)
      if (element) return element
      await this.sleep(100)
    }
    throw new Error(`Timeout waiting for selector: ${selector}`)
  },

  /**
   * 等待多個元素出現
   */
  async waitForSelectorAll(selector, minCount = 1, timeout = 5000) {
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      const elements = document.querySelectorAll(selector)
      if (elements.length >= minCount) return elements
      await this.sleep(100)
    }
    throw new Error(`Timeout waiting for ${minCount} elements: ${selector}`)
  },

  /**
   * 點擊元素
   */
  async click(selector) {
    const element = await this.waitForSelector(selector)
    element.click()
    await this.sleep(300) // 等待動畫/狀態更新
    return element
  },

  /**
   * 獲取文字內容
   */
  async getText(selector) {
    const element = await this.waitForSelector(selector)
    return element.textContent.trim()
  },

  /**
   * 檢查元素是否存在
   */
  exists(selector) {
    return document.querySelector(selector) !== null
  },

  /**
   * 計數元素
   */
  count(selector) {
    return document.querySelectorAll(selector).length
  },

  /**
   * 延遲
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  /**
   * 斷言
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`❌ Assertion failed: ${message}`)
    }
  },

  /**
   * 記錄步驟
   */
  log(step, message) {
    console.log(`%c[Step ${step}] ${message}`, 'color: #3b82f6; font-weight: bold')
  },

  /**
   * 記錄成功
   */
  success(message) {
    console.log(`%c✅ ${message}`, 'color: #10b981; font-weight: bold')
  },

  /**
   * 記錄錯誤
   */
  error(message) {
    console.error(`%c❌ ${message}`, 'color: #ef4444; font-weight: bold')
  }
}

// ============================================
// 通用流程
// ============================================

/**
 * PROC_INIT_GAME: 遊戲初始化
 */
async function procInitGame() {
  TestUtils.log('PROC', '遊戲初始化')

  // 檢查是否已在遊戲頁面
  if (window.location.pathname.includes('/single-player')) {
    TestUtils.log('PROC', '已在遊戲頁面')
    return
  }

  // 訪問首頁
  if (!window.location.pathname.includes('/the-vale-of-eternity')) {
    window.location.href = '/the-vale-of-eternity/'
    await TestUtils.sleep(1000)
  }

  // 點擊單人遊戲按鈕
  await TestUtils.click('a[href*="single-player"]')
  await TestUtils.sleep(1000)

  TestUtils.success('遊戲初始化完成')
}

/**
 * PROC_SELECT_ARTIFACT: 選擇神器
 */
async function procSelectArtifact() {
  TestUtils.log('PROC', '選擇神器')

  // 等待神器卡片出現（至少 6 張）
  const artifacts = await TestUtils.waitForSelectorAll('.card', 6, 10000)
  TestUtils.assert(artifacts.length >= 6, `神器數量不足: ${artifacts.length}`)

  // 點擊第一張神器
  artifacts[0].click()
  await TestUtils.sleep(500)

  // 點擊確認按鈕
  await TestUtils.click('button:contains("確認選擇"), button:contains("確認")')
  await TestUtils.sleep(1000)

  TestUtils.success('神器選擇完成')
}

/**
 * PROC_SELECT_INITIAL_CARDS: 選擇初始卡片
 */
async function procSelectInitialCards() {
  TestUtils.log('PROC', '選擇初始卡片')

  // 等待市場卡片出現（4 張）
  await TestUtils.sleep(1000)
  const marketCards = await TestUtils.waitForSelectorAll('.card', 2, 10000)

  // 點擊前兩張卡片
  marketCards[0].click()
  await TestUtils.sleep(300)
  marketCards[1].click()
  await TestUtils.sleep(300)

  // 點擊確認按鈕
  await TestUtils.click('button:contains("確認選擇"), button:contains("確認")')
  await TestUtils.sleep(1000)

  TestUtils.success('初始卡片選擇完成')
}

/**
 * PROC_OPEN_HAND: 打開手牌面板
 */
async function procOpenHand() {
  TestUtils.log('PROC', '打開手牌面板')

  // 查找手牌區域（FixedHandPanel）
  const handPanel = await TestUtils.waitForSelector('.fixed.bottom-0, [class*="hand"]')

  // 如果手牌已經展開，直接返回
  if (handPanel.classList.contains('expanded')) {
    TestUtils.log('PROC', '手牌已展開')
    return
  }

  // 點擊展開手牌
  handPanel.click()
  await TestUtils.sleep(500)

  TestUtils.success('手牌面板已打開')
}

// ============================================
// 測試用例
// ============================================

/**
 * TEST_01: 棲息地功能測試
 */
async function test01_sanctuary() {
  console.log('\n%c=== TEST_01: 棲息地功能測試 ===', 'color: #f59e0b; font-size: 16px; font-weight: bold')

  try {
    // Step 1-3: 初始化遊戲
    TestUtils.log(1, '初始化遊戲')
    await procInitGame()
    await procSelectArtifact()
    await procSelectInitialCards()

    // Step 4: 打開手牌
    TestUtils.log(4, '打開手牌面板')
    await procOpenHand()

    // Step 5: 記錄第一張卡片名稱
    TestUtils.log(5, '記錄第一張卡片')
    const handCards = await TestUtils.waitForSelectorAll('.card', 1)
    const firstCard = handCards[0]
    const cardName = firstCard.querySelector('.text-sm, .card-name, h3, h4')?.textContent || 'Unknown'
    TestUtils.log(5, `卡片名稱: ${cardName}`)

    // Step 6: 點擊第一張手牌
    TestUtils.log(6, '點擊手牌')
    firstCard.click()
    await TestUtils.sleep(500)

    // Step 7: 確認操作面板有棲息地按鈕
    TestUtils.log(7, '檢查棲息地按鈕')
    const actionPanel = await TestUtils.waitForSelector('[data-testid="card-action-panel"]', 3000)
    const sanctuaryBtn = Array.from(actionPanel.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('棲息地'))
    TestUtils.assert(sanctuaryBtn, '找不到棲息地按鈕')

    // Step 8: 點擊棲息地按鈕
    TestUtils.log(8, '點擊棲息地按鈕')
    const handCountBefore = TestUtils.count('.card')
    sanctuaryBtn.click()
    await TestUtils.sleep(1000)

    // Step 9: 檢查手牌數量
    TestUtils.log(9, '檢查手牌數量')
    const handCountAfter = TestUtils.count('[class*="hand"] .card')
    TestUtils.assert(handCountAfter === handCountBefore - 1,
      `手牌數量錯誤: ${handCountBefore} -> ${handCountAfter}`)

    // Step 10-11: 檢查棲息地
    TestUtils.log(10, '檢查棲息地區域')
    await TestUtils.sleep(500)

    // 查找棲息地標籤
    const sanctuaryLabel = await TestUtils.waitForSelector('*:contains("棲息地")', 5000)
    TestUtils.assert(sanctuaryLabel, '找不到棲息地標籤')

    // 檢查棲息地數量
    const sanctuaryCountText = document.querySelector('.bg-amber-500\\/20')?.textContent || '0'
    TestUtils.log(11, `棲息地卡片數量: ${sanctuaryCountText}`)
    TestUtils.assert(sanctuaryCountText.includes('1'), '棲息地卡片數量錯誤')

    TestUtils.success('TEST_01 PASSED - 棲息地功能正常')
    return { status: 'PASS', testId: 'TEST_01' }

  } catch (error) {
    TestUtils.error(`TEST_01 FAILED: ${error.message}`)
    console.error(error)
    return { status: 'FAIL', testId: 'TEST_01', error: error.message }
  }
}

/**
 * TEST_02: 棄牌堆功能測試
 */
async function test02_discard() {
  console.log('\n%c=== TEST_02: 棄牌堆功能測試 ===', 'color: #f59e0b; font-size: 16px; font-weight: bold')

  try {
    // Step 1-3: 初始化遊戲
    TestUtils.log(1, '初始化遊戲')
    await procInitGame()
    await procSelectArtifact()
    await procSelectInitialCards()

    // Step 4: 打開手牌
    TestUtils.log(4, '打開手牌面板')
    await procOpenHand()

    // Step 5: 記錄第一張卡片名稱
    TestUtils.log(5, '記錄第一張卡片')
    const handCards = await TestUtils.waitForSelectorAll('.card', 1)
    const firstCard = handCards[0]
    const cardName = firstCard.querySelector('.text-sm, .card-name, h3, h4')?.textContent || 'Unknown'
    TestUtils.log(5, `卡片名稱: ${cardName}`)

    // Step 6: 點擊第一張手牌
    TestUtils.log(6, '點擊手牌')
    firstCard.click()
    await TestUtils.sleep(500)

    // Step 7: 確認操作面板有棄置按鈕
    TestUtils.log(7, '檢查棄置按鈕')
    const actionPanel = await TestUtils.waitForSelector('[data-testid="card-action-panel"]', 3000)
    const discardBtn = Array.from(actionPanel.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('棄置'))
    TestUtils.assert(discardBtn, '找不到棄置按鈕')

    // Step 8: 點擊棄置按鈕
    TestUtils.log(8, '點擊棄置按鈕')
    const handCountBefore = TestUtils.count('.card')
    discardBtn.click()
    await TestUtils.sleep(1000)

    // Step 9: 檢查手牌數量
    TestUtils.log(9, '檢查手牌數量')
    const handCountAfter = TestUtils.count('[class*="hand"] .card')
    TestUtils.assert(handCountAfter === handCountBefore - 1,
      `手牌數量錯誤: ${handCountBefore} -> ${handCountAfter}`)

    // Step 10: 點擊棄牌堆圖示
    TestUtils.log(10, '打開棄牌堆 Modal')
    const discardIcon = await TestUtils.waitForSelector('button:contains("棄牌"), [class*="discard"]', 5000)
    discardIcon.click()
    await TestUtils.sleep(500)

    // Step 11: 檢查棄牌堆內容
    TestUtils.log(11, '檢查棄牌堆卡片')
    const modalCards = await TestUtils.waitForSelectorAll('.modal .card, [role="dialog"] .card', 1)
    TestUtils.assert(modalCards.length >= 1, '棄牌堆應該有 1 張卡')

    TestUtils.success('TEST_02 PASSED - 棄牌堆功能正常')
    return { status: 'PASS', testId: 'TEST_02' }

  } catch (error) {
    TestUtils.error(`TEST_02 FAILED: ${error.message}`)
    console.error(error)
    return { status: 'FAIL', testId: 'TEST_02', error: error.message }
  }
}

/**
 * TEST_03: 場上卡片回手測試
 */
async function test03_returnToHand() {
  console.log('\n%c=== TEST_03: 場上卡片回手測試 ===', 'color: #f59e0b; font-size: 16px; font-weight: bold')

  try {
    TestUtils.log(1, '初始化遊戲')
    await procInitGame()
    await procSelectArtifact()
    await procSelectInitialCards()

    // Step 2-3: 召喚卡片到場上
    TestUtils.log(2, '召喚卡片到場上')
    await procOpenHand()
    const handCards = await TestUtils.waitForSelectorAll('.card', 1)
    handCards[0].click()
    await TestUtils.sleep(500)

    const tameBtn = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('召喚'))

    if (tameBtn && !tameBtn.disabled) {
      tameBtn.click()
      await TestUtils.sleep(1000)
    } else {
      throw new Error('無法召喚卡片（按鈕不存在或已禁用）')
    }

    // Step 4-5: 記錄場上和手牌數量
    TestUtils.log(4, '記錄場上卡片數量')
    const fieldCountBefore = TestUtils.count('[class*="field"] .card, [class*="Field"] .card')
    const handCountBefore = TestUtils.count('[class*="hand"] .card')
    TestUtils.log(4, `場上: ${fieldCountBefore}, 手牌: ${handCountBefore}`)

    // Step 6-7: 點擊場上卡片，確認有回手按鈕
    TestUtils.log(6, '點擊場上卡片')
    const fieldCards = await TestUtils.waitForSelectorAll('[class*="field"] .card, [class*="Field"] .card', 1)
    fieldCards[0].click()
    await TestUtils.sleep(500)

    TestUtils.log(7, '檢查回手按鈕')
    const returnBtn = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('回手'))
    TestUtils.assert(returnBtn, '找不到回手按鈕')

    // Step 8: 點擊回手按鈕
    TestUtils.log(8, '點擊回手按鈕')
    returnBtn.click()
    await TestUtils.sleep(1000)

    // Step 9-10: 檢查場上和手牌數量
    TestUtils.log(9, '檢查場上卡片數量')
    const fieldCountAfter = TestUtils.count('[class*="field"] .card, [class*="Field"] .card')
    TestUtils.assert(fieldCountAfter === fieldCountBefore - 1,
      `場上卡片數量錯誤: ${fieldCountBefore} -> ${fieldCountAfter}`)

    TestUtils.log(10, '檢查手牌數量')
    const handCountAfter = TestUtils.count('[class*="hand"] .card')
    TestUtils.assert(handCountAfter === handCountBefore + 1,
      `手牌數量錯誤: ${handCountBefore} -> ${handCountAfter}`)

    TestUtils.success('TEST_03 PASSED - 場上卡片回手功能正常')
    return { status: 'PASS', testId: 'TEST_03' }

  } catch (error) {
    TestUtils.error(`TEST_03 FAILED: ${error.message}`)
    console.error(error)
    return { status: 'FAIL', testId: 'TEST_03', error: error.message }
  }
}

/**
 * TEST_06: 在行動階段抽牌測試
 */
async function test06_drawInActionPhase() {
  console.log('\n%c=== TEST_06: 在行動階段抽牌測試 ===', 'color: #f59e0b; font-size: 16px; font-weight: bold')

  try {
    // Step 1: 初始化遊戲
    TestUtils.log(1, '初始化遊戲')
    await procInitGame()
    await procSelectArtifact()
    await procSelectInitialCards()

    // Step 2: 確認進入 ACTION 階段
    TestUtils.log(2, '確認當前階段為 ACTION')
    await TestUtils.sleep(1000)
    const phaseText = await TestUtils.getText('[class*="phase"], [class*="Phase"]')
    TestUtils.log(2, `當前階段: ${phaseText}`)
    TestUtils.assert(phaseText.includes('行動') || phaseText.includes('ACTION'),
      `階段錯誤: ${phaseText}`)

    // Step 3: 記錄當前手牌數量
    TestUtils.log(3, '記錄當前手牌數量')
    await procOpenHand()
    const handCountBefore = TestUtils.count('[class*="hand"] .card')
    TestUtils.log(3, `手牌數量: ${handCountBefore}`)

    // Step 4: 查找並點擊「抽牌」按鈕
    TestUtils.log(4, '查找抽牌按鈕')
    const drawBtn = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('抽牌') || btn.textContent.includes('Draw'))

    TestUtils.assert(drawBtn, '找不到抽牌按鈕')
    TestUtils.assert(!drawBtn.disabled, '抽牌按鈕被禁用')

    // Step 5: 點擊抽牌
    TestUtils.log(5, '點擊抽牌按鈕')
    drawBtn.click()
    await TestUtils.sleep(1500) // 等待抽牌動畫

    // Step 6: 檢查手牌是否增加
    TestUtils.log(6, '檢查手牌數量變化')
    const handCountAfter = TestUtils.count('[class*="hand"] .card')
    TestUtils.log(6, `手牌數量變化: ${handCountBefore} → ${handCountAfter}`)
    TestUtils.assert(handCountAfter === handCountBefore + 1,
      `手牌數量錯誤: 期望 ${handCountBefore + 1}，實際 ${handCountAfter}`)

    // Step 7: 確認仍在 ACTION 階段（不應自動跳過）
    TestUtils.log(7, '確認仍在 ACTION 階段')
    const phaseTextAfter = await TestUtils.getText('[class*="phase"], [class*="Phase"]')
    TestUtils.log(7, `抽牌後階段: ${phaseTextAfter}`)
    TestUtils.assert(phaseTextAfter.includes('行動') || phaseTextAfter.includes('ACTION'),
      `階段不正確: ${phaseTextAfter}`)

    TestUtils.success('TEST_06 PASSED - 行動階段抽牌功能正常')
    return { status: 'PASS', testId: 'TEST_06' }

  } catch (error) {
    TestUtils.error(`TEST_06 FAILED: ${error.message}`)
    console.error(error)
    return { status: 'FAIL', testId: 'TEST_06', error: error.message }
  }
}

/**
 * 執行所有測試
 */
async function runAllTests() {
  console.clear()
  console.log('%c╔══════════════════════════════════════╗', 'color: #3b82f6; font-size: 18px')
  console.log('%c║  單人遊戲 E2E 測試套件 v1.0.0       ║', 'color: #3b82f6; font-size: 18px')
  console.log('%c╚══════════════════════════════════════╝', 'color: #3b82f6; font-size: 18px')

  const results = []
  const startTime = Date.now()

  // 執行測試
  // results.push(await test01_sanctuary())
  // results.push(await test02_discard())
  // results.push(await test03_returnToHand())
  results.push(await test06_drawInActionPhase())

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)

  // 統計結果
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const total = results.length

  // 輸出報告
  console.log('\n%c╔══════════════════════════════════════╗', 'color: #10b981; font-size: 16px')
  console.log(`%c║  測試報告                              ║`, 'color: #10b981; font-size: 16px')
  console.log('%c╚══════════════════════════════════════╝', 'color: #10b981; font-size: 16px')
  console.log(`總測試數: ${total}`)
  console.log(`%c通過: ${passed}`, 'color: #10b981')
  console.log(`%c失敗: ${failed}`, 'color: #ef4444')
  console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`)
  console.log(`執行時間: ${duration}s`)

  return results
}

// ============================================
// 輔助函數：修復 querySelector 的 :contains 支援
// ============================================

// 擴展 Element 原型以支援 :contains
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector ||
                              Element.prototype.webkitMatchesSelector;
}

// 手動實現 :contains 選擇器
document.querySelector = new Proxy(document.querySelector, {
  apply(target, thisArg, args) {
    let selector = args[0]
    if (selector.includes(':contains')) {
      const match = selector.match(/:contains\("([^"]+)"\)|:contains\('([^']+)'\)/)
      if (match) {
        const text = match[1] || match[2]
        const baseSelector = selector.replace(/:contains\([^)]+\)/, '').trim() || '*'
        const elements = document.querySelectorAll(baseSelector)
        for (const el of elements) {
          if (el.textContent.includes(text)) {
            return el
          }
        }
        return null
      }
    }
    return target.apply(thisArg, args)
  }
})

// ============================================
// 導出全域函數
// ============================================

console.log('%c✨ 測試工具已載入', 'color: #10b981; font-size: 14px; font-weight: bold')
console.log('%c執行所有測試: runAllTests()', 'color: #3b82f6')
console.log('%c執行單一測試: test01_sanctuary(), test02_discard(), test03_returnToHand()', 'color: #3b82f6')
