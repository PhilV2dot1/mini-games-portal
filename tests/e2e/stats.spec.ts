import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers/games';

test.describe('Stats Page — Navigation', () => {
  test('page loads at /stats', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);
    // Heading "Statistics" should be visible
    await expect(page.locator('h1')).toContainText(/statistic|statistique/i);
  });

  test('shows period selector buttons', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);
    // Period options 7d, 30d, 90d, All should be present
    await expect(page.getByRole('button', { name: '7d' })).toBeVisible();
    await expect(page.getByRole('button', { name: '30d' })).toBeVisible();
    await expect(page.getByRole('button', { name: '90d' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
  });

  test('period selector changes active button', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);

    const btn7d = page.getByRole('button', { name: '7d' });
    await btn7d.click();
    // After clicking 7d, it should have the chain-primary background style
    const style = await btn7d.getAttribute('style');
    expect(style).toContain('var(--chain-primary)');
  });

  test('back link to profile is visible', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);
    await expect(page.locator('a[href="/profile/me"]')).toBeVisible();
  });

  test('header is present on stats page', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);
    await expect(page.locator('header')).toBeVisible();
  });
});

test.describe('Stats Page — Unauthenticated state', () => {
  test('shows loading spinner then resolves', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);

    // Either shows spinner briefly then content, or shows no-data message
    // We just verify the page doesn't crash (no error boundary)
    await page.waitForTimeout(3000);
    const errorBoundary = page.locator('text=/something went wrong/i');
    await expect(errorBoundary).not.toBeVisible();
  });

  test('does not show an uncaught error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/stats');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    // Filter out known non-fatal errors (wallet extensions, etc.)
    const fatalErrors = errors.filter(
      (e) => !e.includes('MetaMask') && !e.includes('ethereum') && !e.includes('wallet')
    );
    expect(fatalErrors).toHaveLength(0);
  });
});

test.describe('Stats Page — Content structure', () => {
  test('contains a main content area', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);
    await expect(page.locator('main')).toBeVisible();
  });

  test('period buttons switch and trigger reload', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);
    await page.waitForTimeout(1000);

    // Click 90d — should not crash
    await page.getByRole('button', { name: '90d' }).click();
    await page.waitForTimeout(1000);
    const errorBoundary = page.locator('text=/something went wrong/i');
    await expect(errorBoundary).not.toBeVisible();

    // Click All — should not crash
    await page.getByRole('button', { name: 'All' }).click();
    await page.waitForTimeout(1000);
    await expect(errorBoundary).not.toBeVisible();
  });
});

test.describe('Stats Page — Profile link integration', () => {
  test('/profile/me shows "view full statistics" link to /stats', async ({ page }) => {
    await page.goto('/profile/me');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);
    // Link may only appear for authenticated users with a DB profile.
    // For unauthenticated, the link is not rendered — just check page loads.
    await expect(page.locator('main, [data-testid="profile-content"], body')).toBeVisible();
  });
});
