/**
 * E2E Test for F010 - Lava Giant (熔岩巨人)
 * Console log verification
 *
 * Card Details:
 * - Cost: 3
 * - Base Score: 8
 * - Element: FIRE
 *
 * Effects:
 * - ON_TAME: EARN_PER_ELEMENT - Earn 2 points for each Fire card in your area
 *
 * @version 1.0.0
 */

import { test, expect, type Page } from '@playwright/test'

const CARD_ID = 'F010'
const CARD_NAME_TW = '熔岩巨人'

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

// Helper: Directly tame card
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

test.describe(`${CARD_ID} - ${CARD_NAME_TW} - ON_TAME Test`, () => {
  test('ON_TAME: Earn 2 points per Fire card', async ({ page }) => {
    // Capture console logs for verification
    const consoleLogs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(text)
      if (text.includes('[EffectProcessor]') || text.includes('[MultiplayerGame]')) {
        console.log(`[BROWSER] ${text}`)
      }
    })

    // PHASE 1: Navigate
    console.log('\n[TEST] PHASE 1: Navigating to game')
    await navigateToSinglePlayerGame(page)
    await expect(page.locator('text=/選卡階段|行動階段|Market|Hunting/i').first()).toBeVisible({ timeout: 10000 })
    console.log('[TEST] Game loaded')

    // PHASE 2: Artifacts
    console.log('\n[TEST] PHASE 2: Handling artifacts')
    await selectArtifacts(page)

    // PHASE 3: Select market cards
    console.log('\n[TEST] PHASE 3: Selecting market cards')
    await page.waitForTimeout(1000)
    const marketCards = page.locator('[data-testid*="market-card"], .market-card, .card-container').first()
    const isMarketVisible = await marketCards.isVisible().catch(() => false)

    if (isMarketVisible) {
      await page.locator('[data-testid*="market-card"], .market-card, .card-container').nth(0).click()
      await page.waitForTimeout(300)
      await page.locator('[data-testid*="market-card"], .market-card, .card-container').nth(1).click()
      await page.waitForTimeout(300)

      const confirmButton = page.locator('button').filter({
        hasText: /確認|Confirm|開始行動|Start Action/i
      }).first()
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
        await page.waitForTimeout(1000)
      }
    }
    console.log('[TEST] Reached ACTION phase')

    // PHASE 4: Setup field with Fire cards
    console.log('\n[TEST] PHASE 4: Setting up field with Fire element cards')
    await openDevTestPanel(page)

    // Tame F002 (FIRE) - first fire card
    await directlyTameCard(page, 'F002', '小惡魔')
    await page.waitForTimeout(1000)

    // Tame another F002 (FIRE) - second fire card
    await directlyTameCard(page, 'F002', '小惡魔')
    await page.waitForTimeout(1000)

    console.log('[TEST] Field setup complete: 2x F002 (FIRE)')

    // PHASE 5: Tame F010 and verify effect
    console.log('\n[TEST] PHASE 5: Taming F010 (Lava Giant)')
    await directlyTameCard(page, CARD_ID, CARD_NAME_TW)
    await page.waitForTimeout(2000)

    // PHASE 6: Verify via console logs
    console.log('\n[TEST] PHASE 6: Analyzing console logs')

    // Look for the effect processor logs
    // Expected: Field has 3 Fire cards (2x F002 + 1x F010)
    // F002: FIRE (✅ counts)
    // F002: FIRE (✅ counts)
    // F010: FIRE (✅ counts)
    // Expected score gain: 3 Fire cards × 2 points = 6 points

    const earnPerElementLog = consoleLogs.find(log =>
      log.includes('EARN_PER_ELEMENT') &&
      (log.includes('FIRE') || log.includes('cards'))
    )
    const scoreUpdateLog = consoleLogs.find(log =>
      log.includes('EARN_PER_ELEMENT') &&
      log.includes('updated score') &&
      log.includes('+')
    )

    console.log('[TEST] Earn per element log:', earnPerElementLog)
    console.log('[TEST] Score update log:', scoreUpdateLog)

    // Verify logs exist
    expect(earnPerElementLog).toBeTruthy()
    expect(scoreUpdateLog).toBeTruthy()

    // Parse the score change from log
    // Expected format: "EARN_PER_ELEMENT: updated score X -> Y (+Z)"
    const scoreMatch = scoreUpdateLog?.match(/\+(\d+)\)/)
    const scoreChange = scoreMatch ? parseInt(scoreMatch[1]) : 0

    console.log(`[TEST] Score change: ${scoreChange}`)

    // Verify: F010 should give 2 points × 3 Fire cards = 6 points
    expect(scoreChange).toBe(6)

    console.log('\n[TEST] ✅ F010 ON_TAME TEST PASSED')
    console.log('========================================')
    console.log(`ON_TAME: Earned ${scoreChange} points for 3 Fire cards ✅`)
    console.log('Expected: 3 Fire cards × 2 points = 6 points')
    console.log('========================================')
  })
})
