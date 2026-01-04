// 完整自動化測試：從主選單到測試抽牌
// 在遊戲主頁 Console 執行

(async function() {
  console.log('%c=== 完整自動化測試：抽牌功能 ===', 'color: #4ade80; font-size: 16px; font-weight: bold');

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const clickButton = async (text) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes(text));
    if (!btn) throw new Error('找不到按鈕: ' + text);
    console.log('點擊按鈕:', text);
    btn.click();
    await sleep(800);
  };

  try {
    // Step 1: 點擊單人遊戲
    console.log('%c[1] 進入單人遊戲', 'color: #60a5fa; font-weight: bold');
    await clickButton('單人遊戲');
    await sleep(1500);

    // Step 2: 選擇神器 - 使用更通用的方式
    console.log('%c[2] 選擇神器', 'color: #60a5fa; font-weight: bold');

    // 嘗試多種方式找到神器卡片
    let artifactCard = document.querySelector('[data-testid="artifact-selector"] .cursor-pointer');
    if (!artifactCard) {
      // 查找所有可點擊的卡片，選第一個
      const clickableCards = Array.from(document.querySelectorAll('.cursor-pointer'))
        .filter(el => el.textContent.length > 10);
      artifactCard = clickableCards[0];
    }

    if (!artifactCard) throw new Error('找不到神器卡片');

    console.log('點擊神器卡片');
    artifactCard.click();
    await sleep(500);
    await clickButton('確認');
    await sleep(1500);

    // Step 3: 選擇初始卡片
    console.log('%c[3] 選擇2張初始卡片', 'color: #60a5fa; font-weight: bold');

    // 查找市場卡片
    let marketCards = document.querySelectorAll('[data-testid="market-card"]');

    if (marketCards.length === 0) {
      // 嘗試其他選擇器
      marketCards = document.querySelectorAll('.card, [class*="Card"]');
      console.log('使用備用選擇器，找到', marketCards.length, '張卡片');
    }

    if (marketCards.length < 2) throw new Error('市場卡片不足2張');

    marketCards[0].click();
    await sleep(300);
    marketCards[1].click();
    await sleep(500);
    await clickButton('確認');
    await sleep(2000);

    // Step 4: 檢查並進入 ACTION 階段
    console.log('%c[4] 檢查當前階段', 'color: #60a5fa; font-weight: bold');

    const getPhase = () => {
      const phaseEl = document.querySelector('[class*="phase"], [class*="Phase"]');
      return phaseEl ? phaseEl.textContent : '未知';
    };

    let phase = getPhase();
    console.log('當前階段:', phase);

    // 如果是抽牌階段，需要先抽牌
    if (phase.includes('抽牌') || phase.includes('DRAW')) {
      console.log('在抽牌階段，先執行抽牌');
      const drawPhaseBtn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('抽牌') && !b.disabled);
      if (drawPhaseBtn) {
        drawPhaseBtn.click();
        await sleep(1500);
        phase = getPhase();
        console.log('抽牌後階段:', phase);
      }
    }

    // 確保在 ACTION 階段
    if (!phase.includes('行動') && !phase.includes('ACTION')) {
      throw new Error('未進入 ACTION 階段，當前: ' + phase);
    }

    console.log('✓ 已進入 ACTION 階段');

    // Step 5: 查找抽牌按鈕
    console.log('%c[5] 查找抽牌按鈕', 'color: #60a5fa; font-weight: bold');

    const allButtons = Array.from(document.querySelectorAll('button'));
    const buttonTexts = allButtons.map(b => b.textContent.trim()).filter(t => t.length > 0);
    console.log('頁面按鈕:', buttonTexts);

    const drawBtn = allButtons.find(b =>
      (b.textContent.includes('抽牌') || b.textContent.includes('🃏')) &&
      !b.disabled
    );

    if (!drawBtn) {
      console.error('%c❌ 找不到抽牌按鈕！', 'color: red; font-size: 14px; font-weight: bold');
      console.log('當前階段:', phase);
      console.log('可用按鈕:', buttonTexts);
      console.log('');
      console.log('可能原因:');
      console.log('1. 程式碼未正確載入 (請確認 port 是 5173)');
      console.log('2. 需要按 Ctrl+Shift+R 強制重新整理');
      console.log('3. showDrawCard 條件未滿足');
      return;
    }

    console.log('✓ 找到抽牌按鈕:', drawBtn.textContent.trim());

    // Step 6: 記錄手牌數量
    console.log('%c[6] 記錄手牌數量', 'color: #60a5fa; font-weight: bold');

    const countHand = () => {
      const selectors = [
        '[class*="FixedHandPanel"] .card',
        '[class*="hand"] .card',
        '[class*="Hand"] .card'
      ];
      for (const sel of selectors) {
        const cards = document.querySelectorAll(sel);
        if (cards.length > 0) {
          console.log('使用選擇器:', sel);
          return cards.length;
        }
      }
      return 0;
    };

    const handBefore = countHand();
    console.log('抽牌前手牌數:', handBefore);

    // Step 7: 點擊抽牌
    console.log('%c[7] 點擊抽牌按鈕', 'color: #60a5fa; font-weight: bold');
    drawBtn.click();
    await sleep(1500);

    // Step 8: 檢查結果
    console.log('%c[8] 檢查結果', 'color: #60a5fa; font-weight: bold');
    const handAfter = countHand();
    console.log('抽牌後手牌數:', handAfter);
    const diff = handAfter - handBefore;
    console.log('變化: +' + diff);

    // 最終結果
    console.log('');
    if (diff === 1) {
      console.log('%c========================================', 'color: #4ade80; font-size: 14px');
      console.log('%c✅ 測試通過！', 'color: #4ade80; font-size: 18px; font-weight: bold');
      console.log('%c手牌正確增加 1 張', 'color: #4ade80; font-size: 14px');
      console.log('%c抽牌功能運作正常', 'color: #4ade80; font-size: 14px');
      console.log('%c========================================', 'color: #4ade80; font-size: 14px');
    } else if (diff === 0) {
      console.log('%c========================================', 'color: red; font-size: 14px');
      console.log('%c❌ 測試失敗！', 'color: red; font-size: 18px; font-weight: bold');
      console.log('%c手牌數量未增加', 'color: red; font-size: 14px');
      console.log('%c========================================', 'color: red; font-size: 14px');
      console.log('');
      console.log('請檢查 Console 是否有錯誤訊息');
      console.log('可能原因:');
      console.log('1. drawCardInActionPhase() 執行失敗');
      console.log('2. Store 未更新');
      console.log('3. 牌庫已空');
      console.log('4. 手牌已滿');
    } else {
      console.log('%c⚠️ 意外結果: +' + diff, 'color: orange; font-size: 14px');
    }

  } catch (error) {
    console.error('%c測試執行錯誤:', 'color: red; font-size: 14px; font-weight: bold', error.message);
    console.error(error);
  }
})();
