import { test, expect } from '@playwright/test';

test.describe('PWA - Manifest', () => {
  test('manifest.webmanifest is accessible', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);
  });

  test('manifest has correct name', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    const manifest = await response.json();
    expect(manifest.name).toBe('Mini Games Portal');
    expect(manifest.short_name).toBe('MiniGames');
  });

  test('manifest has required icons', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    const manifest = await response.json();
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  test('manifest has correct start_url and display', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    const manifest = await response.json();
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
  });

  test('manifest theme_color is Celo yellow', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    const manifest = await response.json();
    expect(manifest.theme_color).toBe('#FCFF52');
  });

  test('manifest has shortcuts', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    const manifest = await response.json();
    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBeGreaterThan(0);
  });
});

test.describe('PWA - Icons', () => {
  test('icon-192.png exists', async ({ page }) => {
    const response = await page.goto('/icon-192.png');
    expect(response?.status()).toBe(200);
  });

  test('icon-512.png exists', async ({ page }) => {
    const response = await page.goto('/icon-512.png');
    expect(response?.status()).toBe(200);
  });

  test('apple-touch-icon.png exists', async ({ page }) => {
    const response = await page.goto('/apple-touch-icon.png');
    expect(response?.status()).toBe(200);
  });

  test('favicon-32.png exists', async ({ page }) => {
    const response = await page.goto('/favicon-32.png');
    expect(response?.status()).toBe(200);
  });
});

test.describe('PWA - Offline Page', () => {
  test('offline page loads', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.locator('h1')).toContainText(/offline/i);
  });

  test('offline page has try again button', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('offline page explains free-play works offline', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.locator('body')).toContainText(/free/i);
  });
});

test.describe('PWA - HTML Meta Tags', () => {
  test('manifest link is in page head', async ({ page }) => {
    await page.goto('/');
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);
  });

  test('apple-mobile-web-app-capable meta is set', async ({ page }) => {
    await page.goto('/');
    const meta = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(meta).toHaveCount(1);
  });

  test('theme-color meta is set', async ({ page }) => {
    await page.goto('/');
    const themeMeta = page.locator('meta[name="theme-color"]');
    const count = await themeMeta.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('apple touch icon link is in head', async ({ page }) => {
    await page.goto('/');
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveCount(1);
  });
});
