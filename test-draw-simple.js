// 簡單測試：抽牌功能
// 在遊戲頁面 Console 執行

(async function() {
  console.log('=== 測試開始 ===');

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 查找抽牌按鈕
  const buttons = Array.from(document.querySelectorAll('button'));
  console.log('所有按鈕:', buttons.map(b => b.textContent.trim()));

  const drawBtn = buttons.find(b => b.textContent.includes('抽牌'));

  if (!drawBtn) {
    console.error('找不到抽牌按鈕！');
    console.log('可能原因: 1) 不在ACTION階段 2) 頁面未更新');
    return;
  }

  console.log('找到抽牌按鈕:', drawBtn.textContent);

  // 記錄手牌數量
  const handBefore = document.querySelectorAll('[class*="hand"] .card, [class*="Hand"] .card').length;
  console.log('抽牌前手牌數:', handBefore);

  // 點擊抽牌
  drawBtn.click();
  await sleep(1500);

  // 檢查結果
  const handAfter = document.querySelectorAll('[class*="hand"] .card, [class*="Hand"] .card').length;
  console.log('抽牌後手牌數:', handAfter);
  console.log('變化:', handAfter - handBefore);

  if (handAfter === handBefore + 1) {
    console.log('%c✅ 測試通過！手牌正確增加1張', 'color: green; font-size: 16px; font-weight: bold');
  } else {
    console.log('%c❌ 測試失敗！手牌未增加', 'color: red; font-size: 16px; font-weight: bold');
    console.log('請檢查Console是否有錯誤');
  }
})();
