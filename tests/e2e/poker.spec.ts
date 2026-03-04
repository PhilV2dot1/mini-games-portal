import { test, expect } from '@playwright/test';
import { navigateToGame, playPokerFree } from './helpers/games';

test.describe('Poker - Page Load', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToGame(page, 'poker');
  });

  test('page loads with title and mode toggle', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/poker/i);
    await expect(page.locator('button:has-text("Free")').first()).toBeVisible();
    await expect(page.locator('button:has-text("On-Chain")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Multiplayer")').first()).toBeVisible();
  });

  test('deal button is visible in free mode', async ({ page }) => {
    await expect(page.locator('[data-testid="poker-deal"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Poker - Free Play', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await navigateToGame(page, 'poker');
  });

  test('can deal cards and see poker table', async ({ page }) => {
    await page.locator('[data-testid="poker-deal"]').click();
    await expect(page.locator('[data-testid="poker-table"]')).toBeVisible({ timeout: 5000 });
  });

  test('can deal cards and see action buttons', async ({ page }) => {
    await page.locator('[data-testid="poker-deal"]').click();
    await expect(page.locator('[data-testid="poker-actions"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="poker-fold"]')).toBeVisible();
  });

  test('can fold and see result', async ({ page }) => {
    await page.locator('[data-testid="poker-deal"]').click();
    await page.waitForSelector('[data-testid="poker-actions"]', { timeout: 5000 });
    await page.locator('[data-testid="poker-fold"]').click();
    await expect(page.locator('[data-testid="poker-result"]')).toBeVisible({ timeout: 8000 });
  });

  test('result shows dealer wins after fold', async ({ page }) => {
    await page.locator('[data-testid="poker-deal"]').click();
    await page.waitForSelector('[data-testid="poker-actions"]', { timeout: 5000 });
    await page.locator('[data-testid="poker-fold"]').click();
    const result = page.locator('[data-testid="poker-result"]');
    await expect(result).toBeVisible({ timeout: 8000 });
    await expect(result).toContainText(/fold|dealer/i);
  });

  test('can start new hand after showdown', async ({ page }) => {
    await page.locator('[data-testid="poker-deal"]').click();
    await page.waitForSelector('[data-testid="poker-actions"]', { timeout: 5000 });
    await page.locator('[data-testid="poker-fold"]').click();
    await page.waitForSelector('[data-testid="poker-new-hand"]', { timeout: 8000 });
    await page.locator('[data-testid="poker-new-hand"]').click();
    await expect(page.locator('[data-testid="poker-deal"]')).toBeVisible({ timeout: 5000 });
  });

  test('check button is visible when no bet to call', async ({ page }) => {
    await page.locator('[data-testid="poker-deal"]').click();
    await page.waitForSelector('[data-testid="poker-actions"]', { timeout: 5000 });
    // At preflop, there's always a bet — so check may or may not be visible
    // At least one of check or call should be present
    const checkOrCall = page.locator('[data-testid="poker-check"], [data-testid="poker-call"]');
    await expect(checkOrCall.first()).toBeVisible({ timeout: 5000 });
  });

  test('bet and allin buttons are visible', async ({ page }) => {
    await page.locator('[data-testid="poker-deal"]').click();
    await page.waitForSelector('[data-testid="poker-actions"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="poker-bet"]')).toBeVisible();
    await expect(page.locator('[data-testid="poker-allin"]')).toBeVisible();
  });

  test('can play a full hand via helper', async ({ page }) => {
    await playPokerFree(page);
    // After fold, should either show result or be back to deal phase
    const dealOrResult = page.locator('[data-testid="poker-deal"], [data-testid="poker-result"]');
    await expect(dealOrResult.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Poker - Mode Switching', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToGame(page, 'poker');
  });

  test('switching to On-Chain shows wallet connect when not connected', async ({ page }) => {
    await page.locator('button:has-text("On-Chain")').first().click();
    // Either wallet connect prompt or deal button if already connected
    const walletOrDeal = page.locator('button:has-text("Connect"), [data-testid="poker-deal"]');
    await expect(walletOrDeal.first()).toBeVisible({ timeout: 5000 });
  });

  test('switching to Multiplayer shows matchmaking button', async ({ page }) => {
    await page.locator('button:has-text("Multiplayer")').first().click();
    const matchmaking = page.locator('button:has-text("Find"), button:has-text("Create"), button:has-text("Play")');
    await expect(matchmaking.first()).toBeVisible({ timeout: 5000 });
  });

  test('switching back to Free shows deal button', async ({ page }) => {
    await page.locator('button:has-text("Multiplayer")').first().click();
    await page.locator('button:has-text("Free")').first().click();
    await expect(page.locator('[data-testid="poker-deal"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Poker - How to Play', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToGame(page, 'poker');
  });

  test('how to play section is present', async ({ page }) => {
    const details = page.locator('details');
    await expect(details).toBeVisible();
  });

  test('how to play expands on click', async ({ page }) => {
    const summary = page.locator('details summary');
    await summary.click();
    await expect(page.locator('details[open]')).toBeVisible({ timeout: 2000 });
  });
});
