import { test, expect } from '@playwright/test';

test.describe('Spectate Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/spectate');
    await page.waitForLoadState('networkidle');
  });

  test('spectate page loads with title', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText(/Spectat/i);
  });

  test('spectate page has back to portal link', async ({ page }) => {
    const backLink = page.locator('a[href="/"]');
    await expect(backLink.first()).toBeVisible({ timeout: 5000 });
  });

  test('game filter buttons are displayed', async ({ page }) => {
    // Should show "All Games" filter and individual game filters
    const allGamesButton = page.locator('button:has-text("All Games"), button:has-text("Tous les Jeux")');
    await expect(allGamesButton.first()).toBeVisible({ timeout: 5000 });

    // At least some game filter buttons should be visible
    const gameButtons = page.locator('button:has-text("Tic-Tac-Toe"), button:has-text("Blackjack"), button:has-text("Solitaire")');
    await expect(gameButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test('game filter buttons are clickable', async ({ page }) => {
    const ticTacToeFilter = page.locator('button:has-text("Tic-Tac-Toe")');
    if (await ticTacToeFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await ticTacToeFilter.first().click();
      // Should highlight the selected filter
      await page.waitForTimeout(300);
    }

    // Click All Games to reset
    const allGamesButton = page.locator('button:has-text("All Games"), button:has-text("Tous les Jeux")');
    if (await allGamesButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await allGamesButton.first().click();
    }
  });

  test('shows empty state when no active games', async ({ page }) => {
    // When no games are active, should show an empty state message
    const emptyState = page.locator('text=No active games, text=Aucune partie, text=Check back, text=Revenez');

    // Give time for the API call to complete
    await page.waitForTimeout(2000);

    // Either shows rooms or empty state
    const rooms = page.locator('button:has-text("Watch"), button:has-text("Regarder")');
    const hasRooms = await rooms.first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasEmptyState = await emptyState.first().isVisible({ timeout: 2000 }).catch(() => false);

    // One of these should be true
    expect(hasRooms || hasEmptyState).toBe(true);
  });

  test('auto-refresh indicator is displayed', async ({ page }) => {
    const refreshText = page.locator('text=Auto-refresh, text=Actualisation');
    await expect(refreshText.first()).toBeVisible({ timeout: 5000 });
  });

  test('spectate page is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/spectate');
    await page.waitForLoadState('networkidle');

    // Page should still be usable
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Game filters should wrap on mobile
    const filterButtons = page.locator('button:has-text("All Games"), button:has-text("Tous les Jeux")');
    await expect(filterButtons.first()).toBeVisible({ timeout: 5000 });
  });
});
