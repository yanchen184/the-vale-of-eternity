import { test, expect } from '@playwright/test';

test('在行動階段抽牌功能測試', async ({ page }) => {
  console.log('========================================');
  console.log('測試：行動階段抽牌功能');
  console.log('========================================');

  // Step 1: 打開遊戲頁面
  console.log('[1] 打開遊戲頁面');
  await page.goto('http://localhost:5173/the-vale-of-eternity/');
  await page.waitForLoadState('networkidle');

  // Step 2: 點擊單人遊戲
  console.log('[2] 點擊單人遊戲');
  await page.click('button:has-text("單人遊戲")');
  await page.waitForTimeout(1500);

  // Step 3: 選擇神器 - 使用 force 強制點擊
  console.log('[3] 選擇神器');
  const artifactCards = page.locator('[data-testid="artifact-selector"] .cursor-pointer');
  await artifactCards.first().click({ force: true });
  await page.waitForTimeout(500);
  await page.click('button:has-text("確認")');
  await page.waitForTimeout(1500);

  // Step 4: 選擇初始卡片
  console.log('[4] 選擇2張初始卡片');
  await page.waitForSelector('[data-testid^="market-card"], [data-testid^="hunting-card"]', { timeout: 5000 });
  const marketCards = page.locator('[data-testid^="market-card"], [data-testid^="hunting-card"]');
  const count = await marketCards.count();
  console.log(`找到 ${count} 張市場卡片`);

  await marketCards.nth(0).click({ force: true });
  await page.waitForTimeout(300);
  await marketCards.nth(1).click({ force: true });
  await page.waitForTimeout(500);
  await page.click('button:has-text("確認")');
  await page.waitForTimeout(2000);

  // Step 5: 檢查階段
  console.log('[5] 檢查當前階段');
  const phaseEl = page.locator('[class*="phase"], [class*="Phase"]').first();
  const phaseText = await phaseEl.textContent();
  console.log('當前階段:', phaseText);

  if (phaseText?.includes('抽牌') || phaseText?.includes('DRAW')) {
    console.log('在抽牌階段，先執行抽牌');
    await page.locator('button').filter({ hasText: /抽牌/ }).first().click();
    await page.waitForTimeout(1500);
  }

  // Step 6: 查找抽牌按鈕
  console.log('[6] 查找 ACTION 階段抽牌按鈕');
  const allButtonTexts = await page.$$eval('button', buttons =>
    buttons.map(b => b.textContent?.trim()).filter(t => t && t.length > 0)
  );
  console.log('頁面所有按鈕:', allButtonTexts);

  const drawButton = page.locator('button').filter({ hasText: /抽牌|🃏/ }).first();
  const exists = await drawButton.count() > 0;

  if (!exists) {
    console.error('❌ 找不到抽牌按鈕！');
    await page.screenshot({ path: 'test-results/no-draw-button.png', fullPage: true });
    throw new Error('找不到抽牌按鈕');
  }

  console.log('✓ 找到抽牌按鈕:', await drawButton.textContent());

  // Step 7: 記錄手牌數量
  console.log('[7] 記錄手牌數量');
  const handSelectors = [
    '[data-testid="fixed-hand-panel"] [class*="card"]',
    '[class*="FixedHandPanel"] [class*="card"]'
  ];

  let handCardsBefore = 0;
  for (const selector of handSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      handCardsBefore = count;
      console.log(`使用選擇器: ${selector}, 手牌數: ${handCardsBefore}`);
      break;
    }
  }

  // Step 8: 點擊抽牌
  console.log('[8] 點擊抽牌按鈕');
  await drawButton.click();
  await page.waitForTimeout(2000);

  // Step 9: 檢查結果
  console.log('[9] 檢查結果');
  let handCardsAfter = 0;
  for (const selector of handSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      handCardsAfter = count;
      break;
    }
  }

  const diff = handCardsAfter - handCardsBefore;
  console.log(`抽牌前: ${handCardsBefore}, 抽牌後: ${handCardsAfter}, 變化: +${diff}`);

  console.log('');
  if (diff === 1) {
    console.log('========================================');
    console.log('✅ 測試通過！抽牌功能正常');
    console.log('========================================');
  } else {
    console.log('========================================');
    console.log(`❌ 測試失敗！期望 +1，實際 +${diff}`);
    console.log('========================================');
    await page.screenshot({ path: 'test-results/draw-failed.png', fullPage: true });
  }

  expect(handCardsAfter).toBe(handCardsBefore + 1);
});
