/**
 * Shared Helper Functions for Card E2E Tests
 * Extracted from F002 test suite for reusability
 * @version 1.0.0
 */

import { expect, type Page } from '@playwright/test'

// ============================================
// Navigation & Setup Helpers
// ============================================

/**
 * Navigate to single player game and wait for initialization
 */
export async function navigateToSinglePlayerGame(page: Page) {
  await page.goto('/')

  // Find and click single player button
  const singlePlayerButton = page.locator('[data-testid="single-player-btn"]')

  await expect(singlePlayerButton).toBeVisible()
  await singlePlayerButton.click()

  // Wait for player setup page to load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Click "Start Game" button
  const startGameButton = page.locator('[data-testid="start-game-btn"]')
  await expect(startGameButton).toBeVisible({ timeout: 5000 })
  await startGameButton.click()

  // Wait for game to load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

/**
 * Select artifacts to proceed to hunting phase
 * Selects first 2 available artifacts
 */
export async function selectArtifacts(page: Page) {
  // Look for artifact selection UI
  const artifactCards = page.locator('[data-testid*="artifact"], .artifact-card').first()
  const isArtifactPhase = await artifactCards.isVisible().catch(() => false)

  if (isArtifactPhase) {
    // Select first 2 artifacts
    const artifacts = page.locator('[data-testid*="artifact"], .artifact-card')
    const count = await artifacts.count()

    if (count >= 2) {
      await artifacts.nth(0).click()
      await page.waitForTimeout(300)
      await artifacts.nth(1).click()
      await page.waitForTimeout(300)
    }

    // Click confirm button
    const confirmButton = page.locator('button:has-text("確認"), button:has-text("Confirm")')
    await confirmButton.click()
    await page.waitForTimeout(2000)
  }
}

/**
 * Complete hunting phase (draw and keep cards until ACTION phase)
 */
export async function completeHuntingPhase(page: Page) {
  let attempts = 0
  const MAX_ATTEMPTS = 20

  while (attempts < MAX_ATTEMPTS) {
    // Check current phase
    const phaseText = await page
      .locator('[data-testid="game-phase"]')
      .textContent()
      .catch(() => '')

    if (phaseText?.includes('ACTION') || phaseText?.includes('行動階段')) {
      console.log('[TEST] Successfully reached ACTION phase')
      return
    }

    // Draw a card
    const drawButton = page.locator('[data-testid="draw-card-btn"]')
    const isDrawVisible = await drawButton.isVisible().catch(() => false)

    if (isDrawVisible) {
      await drawButton.click()
      await page.waitForTimeout(1500)

      // Keep the card
      const keepButton = page.locator(
        '[data-testid="keep-card-btn"], button:has-text("保留"), button:has-text("Keep")'
      )
      const isKeepVisible = await keepButton.isVisible().catch(() => false)

      if (isKeepVisible) {
        await keepButton.click()
        await page.waitForTimeout(1500)
      }
    }

    attempts++
    await page.waitForTimeout(500)
  }

  throw new Error(`Failed to reach ACTION phase after ${MAX_ATTEMPTS} attempts`)
}

// ============================================
// DevTestPanel Helpers
// ============================================

/**
 * Open DevTestPanel (press backtick key)
 */
export async function openDevTestPanel(page: Page) {
  // Press backtick to open dev panel
  await page.keyboard.press('`')
  await page.waitForTimeout(500)

  // Verify dev panel is open
  const devPanel = page.locator('[data-testid="dev-test-panel"]').first()
  await expect(devPanel).toBeVisible({ timeout: 3000 })
}

/**
 * Search and select a card in DevTestPanel
 */
export async function searchCardInDevPanel(page: Page, cardId: string) {
  const searchInput = page.locator('[data-testid="dev-card-search"]')
  await expect(searchInput).toBeVisible()

  // Clear and type card ID
  await searchInput.clear()
  await searchInput.fill(cardId)
  await page.waitForTimeout(500)

  // Click the search result
  const searchResult = page.locator(`[data-testid="search-result-${cardId}"]`).first()
  await expect(searchResult).toBeVisible({ timeout: 3000 })
  await searchResult.click()
  await page.waitForTimeout(300)
}

/**
 * Directly tame card to field (triggers ON_TAME)
 */
export async function directlyTameCard(page: Page, cardId: string) {
  await searchCardInDevPanel(page, cardId)

  const tameButton = page.locator('[data-testid="dev-tame-card-btn"]')
  await expect(tameButton).toBeVisible()
  await tameButton.click()
  await page.waitForTimeout(1500)

  console.log(`[TEST] ✅ Directly tamed ${cardId} to field (ON_TAME triggered)`)
}

/**
 * Add card to hand (does NOT trigger ON_TAME)
 */
export async function addCardToHand(page: Page, cardId: string) {
  await searchCardInDevPanel(page, cardId)

  const addToHandButton = page.locator('[data-testid="dev-add-to-hand-btn"]')
  await expect(addToHandButton).toBeVisible()
  await addToHandButton.click()
  await page.waitForTimeout(1000)

  console.log(`[TEST] ✅ Added ${cardId} to hand (ON_TAME NOT triggered)`)
}

/**
 * Add stones via DevTestPanel
 */
export async function addStones(
  page: Page,
  stoneType: 'ONE' | 'THREE' | 'SIX' | 'FIRE' | 'WATER' | 'EARTH' | 'WIND',
  amount: number
) {
  const addStoneButton = page.locator(`[data-testid="dev-add-${stoneType.toLowerCase()}-stone"]`)
  await expect(addStoneButton).toBeVisible()

  for (let i = 0; i < amount; i++) {
    await addStoneButton.click()
    await page.waitForTimeout(200)
  }

  console.log(`[TEST] ✅ Added ${amount}x ${stoneType} stones via DevPanel`)
}

// ============================================
// Game State Helpers
// ============================================

/**
 * Get stone count from UI
 */
export async function getStoneCount(
  page: Page,
  stoneType: 'ONE' | 'THREE' | 'SIX' | 'FIRE' | 'WATER' | 'EARTH' | 'WIND'
): Promise<number> {
  const stoneDisplay = page.locator(`[data-testid="stone-${stoneType.toLowerCase()}"]`)
  const text = await stoneDisplay.textContent().catch(() => '0')
  const count = parseInt(text?.match(/\d+/)?.[0] || '0', 10)
  return count
}

/**
 * Count cards in field
 */
export async function getFieldCardCount(page: Page): Promise<number> {
  await page.waitForTimeout(500)
  const fieldCards = page.locator('[data-testid="field-card"]')
  const count = await fieldCards.count()
  console.log(`[TEST] Field has ${count} cards`)
  return count
}

/**
 * Count cards in hand
 */
export async function getHandCardCount(page: Page): Promise<number> {
  await page.waitForTimeout(500)
  const handCards = page.locator('[data-testid="hand-card"]')
  const count = await handCards.count()
  console.log(`[TEST] Hand has ${count} cards`)
  return count
}

/**
 * End turn
 */
export async function endTurn(page: Page) {
  const endTurnButton = page.locator('[data-testid="end-turn-btn"]')
  await expect(endTurnButton).toBeVisible()
  await expect(endTurnButton).toBeEnabled()
  await endTurnButton.click()
  await page.waitForTimeout(2000)
  console.log('[TEST] ✅ Turn ended')
}

/**
 * Verify card is in hand by name
 */
export async function verifyCardInHand(page: Page, cardName: string): Promise<boolean> {
  const cardInHand = page
    .locator('[data-testid="hand-card"]')
    .filter({ hasText: new RegExp(cardName, 'i') })
    .first()

  const isVisible = await cardInHand.isVisible().catch(() => false)
  console.log(`[TEST] Card "${cardName}" in hand: ${isVisible}`)
  return isVisible
}

// ============================================
// Setup Browser Console Logging
// ============================================

/**
 * Enable browser console logging for debugging
 */
export function setupBrowserConsoleLogging(page: Page) {
  page.on('console', (msg) => {
    const text = msg.text()
    if (
      text.includes('[MultiplayerGame]') ||
      text.includes('[EffectProcessor]') ||
      text.includes('[TEST]')
    ) {
      console.log(`[BROWSER] ${text}`)
    }
  })
}
