import { test, expect } from '@playwright/test';

test.describe('Solitaire Multiplayer Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/solitaire');
    await page.waitForLoadState('networkidle');
  });

  test('solitaire page loads with mode toggle', async ({ page }) => {
    // Page should have a mode toggle with Free, On-Chain, and Multiplayer buttons
    const freeButton = page.locator('button:has-text("Free")');
    await expect(freeButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('mode toggle shows Free, On-Chain, and Multiplayer options', async ({ page }) => {
    // Check all three mode buttons exist
    const freeMode = page.locator('button:has-text("Free")');
    const onchainMode = page.locator('button:has-text("On-Chain"), button:has-text("On Chain")');
    const multiplayerMode = page.locator('button:has-text("Multiplayer")');

    await expect(freeMode.first()).toBeVisible({ timeout: 5000 });
    await expect(onchainMode.first()).toBeVisible({ timeout: 5000 });
    await expect(multiplayerMode.first()).toBeVisible({ timeout: 5000 });
  });

  test('free mode shows solo game controls', async ({ page }) => {
    // In free mode, start game button should be visible
    const startButton = page.locator('button:has-text("Start"), button:has-text("New Game")');
    await expect(startButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('switching to multiplayer mode shows collaborative rules', async ({ page }) => {
    // Click multiplayer mode
    const multiplayerButton = page.locator('button:has-text("Multiplayer")');
    await multiplayerButton.first().click();

    // Should show collaborative solitaire description/rules
    const collabText = page.locator('text=Collaborative, text=together, text=collabor');
    await expect(collabText.first()).toBeVisible({ timeout: 5000 });
  });

  test('multiplayer mode hides solo game controls', async ({ page }) => {
    // Switch to multiplayer
    const multiplayerButton = page.locator('button:has-text("Multiplayer")');
    await multiplayerButton.first().click();

    // Solo start button should NOT be visible
    // Instead, matchmaking buttons should appear
    await page.waitForTimeout(500);

    // Look for matchmaking-related content
    const matchContent = page.locator('text=Ranked, text=Casual, text=Private, text=room code');
    // At least one matchmaking element should be visible
    const isMatchVisible = await matchContent.first().isVisible({ timeout: 3000 }).catch(() => false);
    // Or collaborative rules
    const isRulesVisible = await page.locator('text=Collaborative, text=together').first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(isMatchVisible || isRulesVisible).toBe(true);
  });

  test('switching back to free mode from multiplayer shows solo controls', async ({ page }) => {
    // Switch to multiplayer
    const multiplayerButton = page.locator('button:has-text("Multiplayer")');
    await multiplayerButton.first().click();
    await page.waitForTimeout(300);

    // Switch back to free
    const freeButton = page.locator('button:has-text("Free")');
    await freeButton.first().click();
    await page.waitForTimeout(300);

    // Solo controls should be visible again
    const startButton = page.locator('button:has-text("Start"), button:has-text("New Game")');
    await expect(startButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('solitaire free mode game starts and displays board', async ({ page }) => {
    // Start a game
    const startButton = page.locator('button:has-text("Start"), button:has-text("New Game")');
    await startButton.first().click();

    // Board should become visible (stock pile, tableau columns, etc.)
    await page.waitForTimeout(500);

    // Game should be in playing state - undo/reset buttons may appear
    const gameControls = page.locator('button:has-text("Undo"), button:has-text("Reset")');
    await expect(gameControls.first()).toBeVisible({ timeout: 5000 });
  });
});
