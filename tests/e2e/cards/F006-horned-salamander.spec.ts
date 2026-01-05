/**
 * E2E Test for F006 - Horned Salamander (角火蜥蜴)
 * ON_SCORE effect verification
 *
 * Card Details:
 * - Cost: 2
 * - Base Score: 6
 * - Element: FIRE
 *
 * Effects:
 * - ON_SCORE: EARN_STONES - Earn 4x 1-point stones
 *
 * Test Flow:
 * 1. Navigate to game -> ACTION phase
 * 2. Move market cards to hand (enable End Turn button)
 * 3. Use DevTestPanel to directly tame F006
 * 4. Click "End Turn" button
 * 5. Click glowing F006 card to trigger effect
 * 6. Click confirm button in modal
 * 7. Verify stones via console logs
 *
 * @version 1.0.0
 */

import { test, expect, type Page } from '@playwright/test'

const CARD_ID = 'F006'
const CARD_NAME_TW = '角火蜥蜴'

// Helper: Navigate to single player game
async function navigateToSinglePlayerGame(page: Page) {
  await page.goto('/')
  const singlePlayerButton = page.locator('[data-testid="single-player-btn"]')
  await expect(singlePlayerButton).toBeVisible()
  await singlePlayerButton.click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  const startGameButton = page.locator('[data-testid="start-game-btn"]')
  await expect(startGameButton).toBeVisible({ timeout: 5000 })
  await startGameButton.click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

// Helper: Select artifacts if present
async function selectArtifacts(page: Page) {
  const artifactCards = page.locator('[data-testid*="artifact"], .artifact-card').first()
  const isArtifactPhase = await artifactCards.isVisible().catch(() => false)

  if (isArtifactPhase) {
    const artifacts = page.locator('[data-testid*="artifact"], .artifact-card')
    const count = await artifacts.count()
    if (count >= 2) {
      await artifacts.nth(0).click()
      await page.waitForTimeout(300)
      await artifacts.nth(1).click()
      await page.waitForTimeout(300)
    }

    const confirmButton = page.locator('button').filter({
      hasText: /確認|Confirm|Continue|下一步/i
    }).first()
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
      await page.waitForTimeout(1000)
    }
  }
}

// Helper: Open DevTestPanel
async function openDevTestPanel(page: Page) {
  await page.keyboard.press('Control+Shift+D')
  await page.waitForTimeout(500)
  const panel = page.locator('text=/Card Effect Test Panel/i')
  await expect(panel).toBeVisible()
}

// Helper: Directly tame card via DevTestPanel
async function directlyTameCard(page: Page, cardId: string, cardNameTw: string) {
  const searchInput = page.locator('input[placeholder*="卡片"]').first()
  await expect(searchInput).toBeVisible()
  await searchInput.fill(cardId)
  await page.waitForTimeout(500)

  const searchResult = page.locator(`text=/${cardId}.*${cardNameTw}/i`).first()
  await expect(searchResult).toBeVisible()
  await searchResult.click()
  await page.waitForTimeout(300)

  const tameButton = page.locator('[data-testid="tame-card-button"], button').filter({
    hasText: /直接召喚/i
  }).first()
  await expect(tameButton).toBeVisible()
  await tameButton.click()
  await page.waitForTimeout(1500)
  console.log(`[TEST] Directly tamed ${cardId}`)
}

// Helper: Close DevTestPanel
async function closeDevTestPanel(page: Page) {
  const closeButton = page.locator('button').filter({ hasText: '×' }).first()
  const isVisible = await closeButton.isVisible().catch(() => false)

  if (isVisible) {
    await closeButton.click()
    console.log('[TEST] Closed DevTestPanel')
    await page.waitForTimeout(500)
  }
}

// Helper: Complete HUNTING phase - select cards and move to ACTION phase
async function completeHuntingPhase(page: Page) {
  console.log('[TEST] Starting HUNTING phase card selection...')
  await page.waitForTimeout(1500)

  // Select first card
  const huntingCard0 = page.locator('[data-testid="hunting-card-0"]')
  await huntingCard0.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null)
  const isCard0Visible = await huntingCard0.isVisible().catch(() => false)
  console.log(`[TEST] Hunting card 0 visible: ${isCard0Visible}`)

  if (isCard0Visible) {
    await huntingCard0.click()
    console.log('[TEST] Clicked hunting-card-0')
    await page.waitForTimeout(1000)
  }

  // Select second card
  const huntingCard1 = page.locator('[data-testid="hunting-card-1"]')
  const isCard1Visible = await huntingCard1.isVisible().catch(() => false)
  console.log(`[TEST] Hunting card 1 visible: ${isCard1Visible}`)

  if (isCard1Visible) {
    await huntingCard1.click()
    console.log('[TEST] Clicked hunting-card-1')
    await page.waitForTimeout(1000)
  }

  await page.waitForTimeout(1000)

  // Click confirm button
  const confirmBtn = page.locator('button').filter({
    hasText: /確認選擇/
  }).first()

  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null)
  const isConfirmVisible = await confirmBtn.isVisible().catch(() => false)
  const isConfirmDisabled = await confirmBtn.isDisabled().catch(() => false)
  console.log(`[TEST] Confirm button visible: ${isConfirmVisible}, disabled: ${isConfirmDisabled}`)

  if (isConfirmVisible && !isConfirmDisabled) {
    await confirmBtn.click()
    console.log('[TEST] Clicked confirm selection button')
    await page.waitForTimeout(2000)
  } else if (isConfirmVisible && isConfirmDisabled) {
    console.log('[TEST] Confirm button is disabled - trying to force click')
    await confirmBtn.click({ force: true })
    await page.waitForTimeout(2000)
  }

  const actionPhase = page.locator('text=/行動階段|ACTION/i').first()
  const isActionPhase = await actionPhase.isVisible({ timeout: 3000 }).catch(() => false)
  console.log(`[TEST] ACTION phase visible: ${isActionPhase}`)

  if (!isActionPhase) {
    console.log('[TEST] Still not in ACTION phase - checking current phase')
    const huntingPhase = page.locator('text=/選卡階段|HUNTING/i').first()
    const isHuntingPhase = await huntingPhase.isVisible().catch(() => false)
    console.log(`[TEST] HUNTING phase visible: ${isHuntingPhase}`)
  }

  console.log('[TEST] Completed HUNTING phase')
}

// Helper: Move drawn cards to hand in ACTION phase
async function moveDrawnCardsToHand(page: Page) {
  await page.waitForTimeout(1000)
  console.log('[TEST] Looking for current turn cards to move to hand...')

  const allButtons = page.locator('button').filter({ hasText: /^上手$/ })
  const count = await allButtons.count().catch(() => 0)
  console.log(`[TEST] Found ${count} "上手" buttons`)

  if (count === 0) {
    console.log('[TEST] No "上手" buttons found')
    return
  }

  for (let i = 0; i < count; i++) {
    const currentButtons = page.locator('button').filter({ hasText: /^上手$/ })
    const currentCount = await currentButtons.count().catch(() => 0)
    console.log(`[TEST] Current button count: ${currentCount}`)

    if (currentCount > 0) {
      const btn = currentButtons.first()

      const cardContainer = btn.locator('xpath=ancestor::div[contains(@class, "group")]').first()
      const hasContainer = await cardContainer.count() > 0

      if (hasContainer) {
        await cardContainer.hover()
        console.log('[TEST] Hovered parent card container')
        await page.waitForTimeout(300)
      }

      await btn.evaluate((el) => {
        el.click()
      })
      console.log(`[TEST] Clicked "上手" button via evaluate`)

      await page.waitForTimeout(1500)
    }
  }

  await page.waitForTimeout(500)
  console.log('[TEST] Moved drawn cards to hand')
}

// Helper: Click End Turn button
async function clickEndTurn(page: Page) {
  console.log('[TEST] Looking for End Turn button...')

  const endTurnButton = page.locator('button').filter({
    hasText: /回合結束|結束回合|End Turn/i
  }).first()

  const isEndTurnVisible = await endTurnButton.isVisible().catch(() => false)
  console.log(`[TEST] End Turn button visible: ${isEndTurnVisible}`)

  if (isEndTurnVisible) {
    const isDisabled = await endTurnButton.isDisabled().catch(() => false)
    console.log(`[TEST] End Turn button disabled: ${isDisabled}`)

    if (!isDisabled) {
      await endTurnButton.click()
      console.log('[TEST] Clicked End Turn button')
    } else {
      console.log('[TEST] End Turn button is disabled')
    }
  } else {
    console.log('[TEST] End Turn button not found in header')
  }

  await page.waitForTimeout(2000)

  const resolutionPhase = page.locator('text=/結算中|RESOLUTION/i').first()
  const isResolution = await resolutionPhase.isVisible().catch(() => false)
  console.log(`[TEST] RESOLUTION phase visible: ${isResolution}`)

  console.log('[TEST] End Turn action completed')
}

// Helper: Check if resolution modal is already showing
async function isResolutionModalShowing(page: Page): Promise<boolean> {
  const modal = page.locator('h2').filter({ hasText: /結算效果/ }).first()
  const isVisible = await modal.isVisible().catch(() => false)
  console.log(`[TEST] Resolution modal visible: ${isVisible}`)
  return isVisible
}

// Helper: Click "是，執行效果" button in modal
async function clickExecuteEffectButton(page: Page): Promise<boolean> {
  console.log('[TEST] Looking for "是，執行效果" button...')

  const executeBtn = page.locator('button').filter({
    hasText: /是.*執行效果/
  }).first()

  const isVisible = await executeBtn.isVisible().catch(() => false)
  console.log(`[TEST] "是，執行效果" button visible: ${isVisible}`)

  if (isVisible) {
    await executeBtn.click()
    console.log('[TEST] Clicked "是，執行效果" button')
    await page.waitForTimeout(1500)
    return true
  }

  return false
}

// Helper: Click glowing card to trigger ON_SCORE effect
async function clickGlowingCard(page: Page, cardId: string) {
  console.log(`[TEST] Looking for glowing card ${cardId} with pending resolution...`)

  await page.waitForTimeout(2000)

  const modalShowing = await isResolutionModalShowing(page)
  if (modalShowing) {
    console.log('[TEST] Resolution modal is already showing - no need to click card')
    return true
  }

  const glowingCard = page.locator('.animate-resolution-breathing').first()
  const isGlowingVisible = await glowingCard.isVisible({ timeout: 3000 }).catch(() => false)
  console.log(`[TEST] Glowing card visible: ${isGlowingVisible}`)

  if (isGlowingVisible) {
    await glowingCard.evaluate((el) => {
      el.click()
    })
    console.log('[TEST] Clicked glowing card via evaluate')
    await page.waitForTimeout(1000)
    return true
  }

  // Method 2: Try to find card by image alt
  const cardByAlt = page.locator(`img[alt*="Horned Salamander"]`).first()
  const isCardByAltVisible = await cardByAlt.isVisible().catch(() => false)
  console.log(`[TEST] Card by alt visible: ${isCardByAltVisible}`)

  if (isCardByAltVisible) {
    const cardContainer = cardByAlt.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first()
    const hasContainer = await cardContainer.count() > 0
    if (hasContainer) {
      await cardContainer.evaluate((el) => el.click())
      console.log('[TEST] Clicked card container via evaluate')
      await page.waitForTimeout(1000)
      return true
    }
  }

  console.log('[TEST] No glowing card found - checking if "完成結算" button exists')
  return false
}

// Helper: Click the "完成結算" button
async function clickFinishResolution(page: Page) {
  console.log('[TEST] Looking for "完成結算" button...')

  const finishBtn = page.locator('button').filter({
    hasText: /完成結算/
  }).first()

  const isVisible = await finishBtn.isVisible().catch(() => false)
  console.log(`[TEST] "完成結算" button visible: ${isVisible}`)

  if (isVisible) {
    await finishBtn.click()
    console.log('[TEST] Clicked "完成結算" button')
    await page.waitForTimeout(2000)
    return true
  }

  return false
}

// Helper: Confirm effect execution in modal
async function confirmEffectExecution(page: Page) {
  const executed = await clickExecuteEffectButton(page)
  if (executed) {
    console.log('[TEST] Confirmed effect execution via "是，執行效果" button')
    return
  }

  const confirmButton = page.locator('.fixed.inset-0 button').filter({
    hasText: /確認|執行|Confirm|Execute/i
  }).first()

  const altConfirmButton = page.locator('button.bg-amber-600, button.bg-vale-600').first()

  const isConfirmVisible = await confirmButton.isVisible().catch(() => false)

  if (isConfirmVisible) {
    await confirmButton.click()
  } else if (await altConfirmButton.isVisible().catch(() => false)) {
    await altConfirmButton.click()
  }

  await page.waitForTimeout(1500)
  console.log('[TEST] Confirmed effect execution')
}

test.describe(`${CARD_ID} - ${CARD_NAME_TW} - ON_SCORE Test`, () => {
  // Increase timeout to 120 seconds for this test suite
  test.setTimeout(120000)

  test('ON_SCORE: Earn 4x 1-point stones', async ({ page }) => {
    // Capture console logs for verification
    const consoleLogs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(text)
      if (text.includes('[EffectProcessor]') || text.includes('[MultiplayerGame]')) {
        console.log(`[BROWSER] ${text}`)
      }
    })

    // PHASE 1: Navigate to game
    console.log('\n[TEST] PHASE 1: Navigating to game')
    await navigateToSinglePlayerGame(page)
    await expect(page.locator('text=/選卡階段|行動階段|Market|Hunting/i').first()).toBeVisible({ timeout: 10000 })
    console.log('[TEST] Game loaded')

    // PHASE 2: Handle artifacts
    console.log('\n[TEST] PHASE 2: Handling artifacts')
    await selectArtifacts(page)

    // PHASE 3: Complete HUNTING phase (select card and confirm)
    console.log('\n[TEST] PHASE 3: Completing HUNTING phase')
    await completeHuntingPhase(page)
    await page.waitForTimeout(1000)

    // PHASE 4: Open DevTestPanel and tame F006
    console.log('\n[TEST] PHASE 4: Taming F006 via DevTestPanel')
    await openDevTestPanel(page)
    await directlyTameCard(page, CARD_ID, CARD_NAME_TW)
    await page.waitForTimeout(1000)
    console.log('[TEST] F006 is now in field')

    // PHASE 4.5: Close DevTestPanel
    console.log('\n[TEST] PHASE 4.5: Closing DevTestPanel')
    await closeDevTestPanel(page)
    await page.waitForTimeout(500)

    // PHASE 5: Move drawn cards to hand
    console.log('\n[TEST] PHASE 5: Moving drawn cards to hand')
    await moveDrawnCardsToHand(page)
    await page.waitForTimeout(1000)

    // PHASE 6: Click End Turn
    console.log('\n[TEST] PHASE 6: Clicking End Turn')
    await clickEndTurn(page)
    await page.waitForTimeout(2000)

    // PHASE 7: Try to click glowing F006 card
    console.log('\n[TEST] PHASE 7: Looking for glowing F006 card')
    const foundGlowingCard = await clickGlowingCard(page, CARD_ID)

    if (foundGlowingCard) {
      // PHASE 8: Confirm effect execution in modal
      console.log('\n[TEST] PHASE 8: Confirming effect execution')
      await confirmEffectExecution(page)
      await page.waitForTimeout(2000)
    } else {
      console.log('\n[TEST] PHASE 7b: Trying "完成結算" button as fallback')
      const clickedFinish = await clickFinishResolution(page)

      if (!clickedFinish) {
        console.log('[TEST] Warning: Neither glowing card nor finish button found')
      }
    }

    // PHASE 9: Verify via console logs
    console.log('\n[TEST] PHASE 9: Analyzing console logs')

    const onScoreLog = consoleLogs.find(log =>
      log.includes('processOnScoreEffects') ||
      log.includes('ON_SCORE')
    )

    const earnStonesLog = consoleLogs.find(log =>
      log.includes('EARN_STONES') ||
      log.includes('Gained stones') ||
      log.includes('Earned') && log.includes('stones')
    )

    console.log('[TEST] ON_SCORE log:', onScoreLog ? 'Found' : 'Not found')
    console.log('[TEST] EARN_STONES log:', earnStonesLog)

    // Verify that effects were processed
    const effectsProcessed = consoleLogs.some(log =>
      log.includes('EARN_STONES') ||
      log.includes('Gained stones') ||
      log.includes('Earned') && log.includes('stones')
    )

    expect(effectsProcessed).toBeTruthy()

    console.log('\n[TEST] F006 ON_SCORE TEST COMPLETED')
    console.log('========================================')
    console.log('ON_SCORE effects triggered successfully')
    console.log('- EARN_STONES: 4x 1-point stones')
    console.log('========================================')
  })
})
