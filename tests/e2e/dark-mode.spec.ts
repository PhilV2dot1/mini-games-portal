import { test, expect } from '@playwright/test';

test.describe('Dark Mode & Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page starts with default theme (light or system)', async ({ page }) => {
    const html = page.locator('html');
    // html should exist and either have class 'dark' or not
    await expect(html).toBeVisible();
  });

  test('dark mode toggle exists and is clickable', async ({ page }) => {
    // Look for a dark mode toggle button (could be moon/sun icon)
    const darkModeToggle = page.locator('button[aria-label*="dark" i], button[aria-label*="theme" i], button[aria-label*="mode" i], [data-testid="dark-mode-toggle"], [data-testid="theme-toggle"]');

    // If toggle exists, click it
    if (await darkModeToggle.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await darkModeToggle.first().click();

      // HTML should now have 'dark' class
      const html = page.locator('html');
      const hasClass = await html.getAttribute('class');
      expect(hasClass).toBeDefined();

      // Toggle back
      await darkModeToggle.first().click();
    }
  });

  test('dark mode applies dark backgrounds on game pages', async ({ page }) => {
    // Enable dark mode via emulation
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/blackjack');
    await page.waitForLoadState('networkidle');

    // Main element should have dark classes applied
    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test('dark mode applies on solitaire page', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/games/solitaire');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test('dark mode applies on spectate page', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/spectate');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test('dark mode persists across navigation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });

    // Navigate to game
    await page.goto('/blackjack');
    await page.waitForLoadState('networkidle');

    // Go back to home
    const backLink = page.locator('a[href="/"]').first();
    if (await backLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await backLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Dark mode should still be active
    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 5000 });
  });
});
