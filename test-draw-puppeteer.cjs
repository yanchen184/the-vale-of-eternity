// 使用 Puppeteer 自動化測試抽牌功能
const puppeteer = require('puppeteer');

(async () => {
  console.log('========================================');
  console.log('開始自動化測試：抽牌功能');
  console.log('========================================\n');

  const browser = await puppeteer.launch({
    headless: false, // 顯示瀏覽器
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    // Step 1: 打開遊戲
    console.log('[1] 打開遊戲頁面...');
    await page.goto('http://localhost:5173/the-vale-of-eternity/');
    await page.waitForTimeout(1000);

    // Step 2: 點擊單人遊戲
    console.log('[2] 點擊單人遊戲...');
    await page.click('button');
    await page.waitForTimeout(2000);

    // Step 3: 選擇神器
    console.log('[3] 選擇神器...');
    const artifacts = await page.$$('.cursor-pointer');
    if (artifacts.length > 0) {
      await artifacts[0].click();
      await page.waitForTimeout(500);
    }

    // 點擊確認
    await page.evaluate(() => {
      const confirmBtn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('確認'));
      if (confirmBtn) confirmBtn.click();
    });
    await page.waitForTimeout(2000);

    // Step 4: 選擇 2 張初始卡片
    console.log('[4] 選擇2張初始卡片...');
    const cards = await page.$$('[class*="card"]');
    if (cards.length >= 2) {
      await cards[0].click();
      await page.waitForTimeout(300);
      await cards[1].click();
      await page.waitForTimeout(500);
    }

    // 確認選擇
    await page.evaluate(() => {
      const confirmBtn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('確認'));
      if (confirmBtn) confirmBtn.click();
    });
    await page.waitForTimeout(2500);

    // Step 5: 檢查階段
    console.log('[5] 檢查當前階段...');
    const phase = await page.evaluate(() => {
      const phaseEl = document.querySelector('[class*="phase"]');
      return phaseEl ? phaseEl.textContent : '';
    });
    console.log('   當前階段:', phase);

    // 如果在抽牌階段，先抽牌
    if (phase.includes('抽牌') || phase.includes('DRAW')) {
      console.log('   在抽牌階段，先執行抽牌...');
      await page.evaluate(() => {
        const drawBtn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.includes('抽牌'));
        if (drawBtn) drawBtn.click();
      });
      await page.waitForTimeout(1500);
    }

    // Step 6: 查找抽牌按鈕
    console.log('[6] 查找抽牌按鈕...');
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map(b => b.textContent.trim())
        .filter(t => t);
    });
    console.log('   頁面所有按鈕:', buttons);

    const hasDrawBtn = await page.evaluate(() => {
      const drawBtn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('🃏') || b.textContent.includes('抽牌'));
      return drawBtn ? drawBtn.textContent.trim() : null;
    });

    if (!hasDrawBtn) {
      console.log('\n========================================');
      console.log('❌ 找不到抽牌按鈕！');
      console.log('========================================');
      console.log('\n可能原因:');
      console.log('1. 程式碼未正確載入（請確認 port 5173）');
      console.log('2. showDrawCard 條件不成立');
      console.log('3. GameLayout 未接收到 props');

      // 截圖
      await page.screenshot({ path: 'test-results/no-draw-button.png', fullPage: true });
      console.log('\n已截圖保存至: test-results/no-draw-button.png');

      await browser.close();
      process.exit(1);
    }

    console.log('   ✓ 找到抽牌按鈕:', hasDrawBtn);

    // Step 7: 記錄手牌數量
    console.log('[7] 記錄手牌數量...');
    const handBefore = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="fixed-hand-panel"] [class*="card"]').length;
    });
    console.log('   抽牌前手牌數:', handBefore);

    // Step 8: 點擊抽牌
    console.log('[8] 點擊抽牌按鈕...');
    await page.evaluate(() => {
      const drawBtn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('🃏') || b.textContent.includes('抽牌'));
      if (drawBtn) drawBtn.click();
    });
    await page.waitForTimeout(2000);

    // Step 9: 檢查結果
    console.log('[9] 檢查結果...');
    const handAfter = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="fixed-hand-panel"] [class*="card"]').length;
    });
    console.log('   抽牌後手牌數:', handAfter);

    const diff = handAfter - handBefore;
    console.log('   變化: +' + diff);

    // 結果
    console.log('\n========================================');
    if (diff === 1) {
      console.log('✅ 測試通過！');
      console.log('手牌正確增加 1 張');
      console.log('抽牌功能運作正常');
      console.log('========================================\n');
    } else {
      console.log('❌ 測試失敗！');
      console.log('期望: +1, 實際: +' + diff);
      console.log('========================================\n');

      // 檢查 Console 錯誤
      console.log('正在檢查 Console 錯誤...');
      const logs = await page.evaluate(() => {
        return window.__consoleLogs || [];
      });
      if (logs.length > 0) {
        console.log('Console 訊息:', logs);
      }

      // 截圖
      await page.screenshot({ path: 'test-results/draw-failed.png', fullPage: true });
      console.log('已截圖保存至: test-results/draw-failed.png\n');
    }

    // 等待 5 秒讓你看結果
    console.log('5 秒後關閉瀏覽器...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n測試執行錯誤:', error.message);
    await page.screenshot({ path: 'test-results/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
