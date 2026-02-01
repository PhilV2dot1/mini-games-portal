import { test, expect } from '@playwright/test';

test.describe('Portal Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('homepage loads with game cards', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
    // There should be multiple game cards/links
    const gameLinks = page.locator('a[href*="/games/"], a[href*="/blackjack"], a[href*="/rps"], a[href*="/tictactoe"]');
    await expect(gameLinks.first()).toBeVisible({ timeout: 5000 });
  });

  const gameRoutes = [
    { name: 'Blackjack', path: '/blackjack' },
    { name: 'Rock Paper Scissors', path: '/rps' },
    { name: 'Tic-Tac-Toe', path: '/tictactoe' },
    { name: 'Jackpot', path: '/jackpot' },
    { name: '2048', path: '/2048' },
    { name: 'Mastermind', path: '/mastermind' },
    { name: 'Solitaire', path: '/games/solitaire' },
    { name: 'Minesweeper', path: '/games/minesweeper' },
    { name: 'Snake', path: '/games/snake' },
    { name: 'Connect Five', path: '/games/connectfive' },
    { name: 'Yahtzee', path: '/games/yahtzee' },
    { name: 'Sudoku', path: '/games/sudoku' },
  ];

  for (const game of gameRoutes) {
    test(`navigates to ${game.name} game page`, async ({ page }) => {
      await page.goto(game.path);
      await page.waitForLoadState('networkidle');

      // Page should load without error (no 404)
      await expect(page).not.toHaveTitle(/404/i);

      // Should have a back link to portal
      const backLink = page.locator('a[href="/"]');
      await expect(backLink.first()).toBeVisible({ timeout: 5000 });
    });
  }

  test('navigates to spectate page', async ({ page }) => {
    await page.goto('/spectate');
    await page.waitForLoadState('networkidle');

    // Page loads without error
    await expect(page).not.toHaveTitle(/404/i);

    // Should show spectate heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Should have back link
    const backLink = page.locator('a[href="/"]');
    await expect(backLink.first()).toBeVisible({ timeout: 5000 });
  });

  test('navigates to leaderboard page', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveTitle(/404/i);
  });

  test('navigates to about page', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveTitle(/404/i);
  });

  test('back to portal link works from game pages', async ({ page }) => {
    await page.goto('/blackjack');
    await page.waitForLoadState('networkidle');

    const backLink = page.locator('a[href="/"]').first();
    await expect(backLink).toBeVisible({ timeout: 5000 });
    await backLink.click();

    await page.waitForURL('/');
  });
});
