import { chromium } from '@playwright/test';

(async () => {
  console.log('========================================');
  console.log('開始自動化測試：抽牌功能');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Step 1
    console.log('[1] 打開遊戲頁面...');
    await page.goto('http://localhost:5173/the-vale-of-eternity/');
    await page.waitForTimeout(1000);

    // Step 2
    console.log('[2] 點擊單人遊戲...');
    await page.click('button');
    await page.waitForTimeout(2000);

    // Step 3
    console.log('[3] 選擇神器...');
    const artifact = page.locator('.cursor-pointer').first();
    await artifact.click({ force: true });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('確認'))?.click();
    });
    await page.waitForTimeout(2000);

    // Step 4
    console.log('[4] 選擇2張初始卡片...');
    const cards = page.locator('[class*="card"]');
    await cards.nth(0).click({ force: true });
    await page.waitForTimeout(300);
    await cards.nth(1).click({ force: true });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('確認'))?.click();
    });
    await page.waitForTimeout(2500);

    // Step 5
    console.log('[5] 檢查階段...');
    const phase = await page.locator('[class*="phase"]').first().textContent();
    console.log('   當前階段:', phase);

    if (phase?.includes('抽牌')) {
      console.log('   執行抽牌進入 ACTION...');
      await page.evaluate(() => {
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('抽牌'))?.click();
      });
      await page.waitForTimeout(1500);
    }

    // Step 6
    console.log('[6] 查找抽牌按鈕...');
    const allButtons = await page.$$eval('button', btns => btns.map(b => b.textContent?.trim()).filter(t => t));
    console.log('   所有按鈕:', allButtons);

    const drawBtnText = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('🃏') || b.textContent.includes('抽牌'));
      return btn ? btn.textContent.trim() : null;
    });

    if (!drawBtnText) {
      console.log('\n❌ 找不到抽牌按鈕！');
      await page.screenshot({ path: 'no-draw-btn.png' });
      await browser.close();
      return;
    }

    console.log('   ✓ 找到:', drawBtnText);

    // Step 7
    console.log('[7] 記錄手牌數量...');
    const handBefore = await page.locator('[data-testid="fixed-hand-panel"] [class*="card"]').count();
    console.log('   抽牌前:', handBefore);

    // Step 8
    console.log('[8] 點擊抽牌...');
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('🃏') || b.textContent.includes('抽牌'))?.click();
    });
    await page.waitForTimeout(2000);

    // Step 9
    console.log('[9] 檢查結果...');
    const handAfter = await page.locator('[data-testid="fixed-hand-panel"] [class*="card"]').count();
    console.log('   抽牌後:', handAfter);

    const diff = handAfter - handBefore;
    console.log('\n========================================');
    if (diff === 1) {
      console.log('✅ 測試通過！抽牌功能正常！');
    } else {
      console.log(`❌ 測試失敗！期望 +1，實際 +${diff}`);
      await page.screenshot({ path: 'draw-failed.png' });
    }
    console.log('========================================\n');

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n測試錯誤:', error.message);
    await page.screenshot({ path: 'error.png' });
  } finally {
    await browser.close();
  }
})();
