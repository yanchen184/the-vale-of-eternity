// 手動測試腳本：在瀏覽器 Console 執行
// 複製整段程式碼，貼到遊戲頁面的 Console 執行

(async function testDrawCard() {
  console.log('%c========================================', 'color: #4ade80; font-size: 14px; font-weight: bold');
  console.log('%c測試：行動階段抽牌功能', 'color: #4ade80; font-size: 14px; font-weight: bold');
  console.log('%c========================================', 'color: #4ade80; font-size: 14px; font-weight: bold');

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    // Step 1: 檢查是否在遊戲頁面
    console.log('%c[Step 1] 檢查頁面狀態', 'color: #60a5fa; font-weight: bold');
    if (!window.location.href.includes('the-vale-of-eternity')) {
      throw new Error('請在遊戲頁面執行此測試！');
    }
    console.log('✓ 在遊戲頁面');

    // Step 2: 檢查抽牌按鈕是否存在
    console.log('%c[Step 2] 查找抽牌按鈕', 'color: #60a5fa; font-weight: bold');
    const allButtons = Array.from(document.querySelectorAll('button'));
    console.log('頁面上所有按鈕:', allButtons.map(b => b.textContent.trim()).join(', '));

    const drawBtn = allButtons.find(btn =>
      btn.textContent.includes('抽牌') ||
      btn.textContent.includes('🃏') ||
      btn.textContent.includes('Draw')
    );

    if (!drawBtn) {
      console.log('%c❌ 找不到抽牌按鈕！', 'color: #ef4444; font-weight: bold');
      console.log('可能原因:');
      console.log('1. 不在 ACTION 階段');
      console.log('2. 頁面快取未更新（請按 Ctrl+Shift+R 強制重新整理）');
      console.log('3. Dev server port 錯誤（確認是 localhost:5173）');

      // 檢查當前階段
      const phaseEl = document.querySelector('[class*="phase"], [class*="Phase"]');
      if (phaseEl) {
        console.log('當前階段:', phaseEl.textContent);
      }

      return;
    }

    console.log('✓ 找到抽牌按鈕:', drawBtn.textContent.trim());
    console.log('按鈕狀態:', drawBtn.disabled ? '禁用' : '可用');

    if (drawBtn.disabled) {
      console.log('%c❌ 抽牌按鈕被禁用', 'color: #ef4444; font-weight: bold');
      return;
    }

    // Step 3: 記錄手牌數量
    console.log('%c[Step 3] 記錄當前手牌數量', 'color: #60a5fa; font-weight: bold');

    // 嘗試多種選擇器
    const handSelectors = [
      '[class*="hand"] .card',
      '[class*="Hand"] .card',
      '[class*="FixedHandPanel"] .card',
      '[data-testid="hand-card"]'
    ];

    let handCards = [];
    for (const selector of handSelectors) {
      handCards = document.querySelectorAll(selector);
      if (handCards.length > 0) {
        console.log(`✓ 使用選擇器: ${selector}`);
        break;
      }
    }

    const handCountBefore = handCards.length;
    console.log('手牌數量（抽牌前）:', handCountBefore);

    if (handCountBefore === 0) {
      console.log('%c⚠️ 警告：目前手牌數量為 0', 'color: #f59e0b; font-weight: bold');
    }

    // Step 4: 點擊抽牌按鈕
    console.log('%c[Step 4] 點擊抽牌按鈕', 'color: #60a5fa; font-weight: bold');
    drawBtn.click();
    console.log('✓ 已點擊');

    // 等待狀態更新
    await sleep(1500);

    // Step 5: 檢查手牌數量
    console.log('%c[Step 5] 檢查手牌數量變化', 'color: #60a5fa; font-weight: bold');

    let handCardsAfter = [];
    for (const selector of handSelectors) {
      handCardsAfter = document.querySelectorAll(selector);
      if (handCardsAfter.length > 0) {
        break;
      }
    }

    const handCountAfter = handCardsAfter.length;
    console.log('手牌數量（抽牌後）:', handCountAfter);
    console.log('變化:', `${handCountBefore} → ${handCountAfter} (${handCountAfter > handCountBefore ? '+' : ''}${handCountAfter - handCountBefore})`);

    // Step 6: 驗證結果
    console.log('%c[Step 6] 驗證結果', 'color: #60a5fa; font-weight: bold');

    if (handCountAfter === handCountBefore + 1) {
      console.log('%c========================================', 'color: #4ade80; font-size: 14px; font-weight: bold');
      console.log('%c✅ 測試通過！', 'color: #4ade80; font-size: 16px; font-weight: bold');
      console.log('%c抽牌功能正常運作', 'color: #4ade80; font-size: 14px');
      console.log('%c手牌正確增加 1 張', 'color: #4ade80; font-size: 14px');
      console.log('%c========================================', 'color: #4ade80; font-size: 14px; font-weight: bold');
    } else if (handCountAfter === handCountBefore) {
      console.log('%c========================================', 'color: #ef4444; font-size: 14px; font-weight: bold');
      console.log('%c❌ 測試失敗！', 'color: #ef4444; font-size: 16px; font-weight: bold');
      console.log('%c手牌數量沒有變化', 'color: #ef4444; font-size: 14px');
      console.log('%c可能原因：', 'color: #ef4444; font-size: 14px');
      console.log('1. drawCardInActionPhase() 方法未正確執行');
      console.log('2. 牌庫已空');
      console.log('3. 手牌已滿');
      console.log('4. Store 更新失敗');
      console.log('%c========================================', 'color: #ef4444; font-size: 14px; font-weight: bold');

      // 檢查 Console 錯誤
      console.log('請檢查 Console 是否有錯誤訊息');
    } else {
      console.log('%c⚠️ 意外結果', 'color: #f59e0b; font-weight: bold');
      console.log('手牌數量變化異常:', handCountAfter - handCountBefore);
    }

    // Step 7: 檢查階段
    console.log('%c[Step 7] 檢查當前階段', 'color: #60a5fa; font-weight: bold');
    const phaseEl = document.querySelector('[class*="phase"], [class*="Phase"]');
    if (phaseEl) {
      const phase = phaseEl.textContent.trim();
      console.log('當前階段:', phase);
      if (phase.includes('行動') || phase.includes('ACTION')) {
        console.log('✓ 仍在 ACTION 階段（正確）');
      } else {
        console.log('⚠️ 階段已改變');
      }
    }

  } catch (error) {
    console.log('%c========================================', 'color: #ef4444; font-size: 14px; font-weight: bold');
    console.log('%c❌ 測試執行錯誤', 'color: #ef4444; font-size: 16px; font-weight: bold');
    console.log('%c' + error.message, 'color: #ef4444; font-size: 14px');
    console.log('%c========================================', 'color: #ef4444; font-size: 14px; font-weight: bold');
    console.error(error);
  }
})();
