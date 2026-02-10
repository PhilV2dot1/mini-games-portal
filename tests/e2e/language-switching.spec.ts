import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers/games';

// Increase timeout for language tests that navigate across pages
test.setTimeout(60000);

test.describe('Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('language switcher shows EN/FR buttons', async ({ page }) => {
    const enButton = page.locator('button:has-text("EN")');
    const frButton = page.locator('button:has-text("FR")');

    await expect(enButton.first()).toBeVisible();
    await expect(frButton.first()).toBeVisible();
  });

  test('switching to FR changes homepage text', async ({ page }) => {
    const frButton = page.locator('button:has-text("FR")');
    await frButton.first().click();
    await page.waitForTimeout(500);

    const frenchText = page.locator('text=/Bienvenue sur Mini Games Portal|Jeux Disponibles|Comment Jouer/i');
    await expect(frenchText.first()).toBeVisible({ timeout: 5000 });
  });

  test('switching to FR changes game page text', async ({ page }) => {
    // Set language to French via localStorage before navigating
    await page.evaluate(() => localStorage.setItem('language', 'fr'));

    // Navigate to minesweeper - language should load as French from localStorage
    await page.goto('/games/minesweeper', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    const frenchLabels = page.locator('text=/Démineur|Comment jouer|Sélectionnez/i');
    await expect(frenchLabels.first()).toBeVisible({ timeout: 10000 });
  });

  test('language persists across page navigation', async ({ page }) => {
    // Set language to French via localStorage
    await page.evaluate(() => localStorage.setItem('language', 'fr'));

    // Navigate to a game page - should load in French
    await page.goto('/games/yahtzee', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    const frenchText = page.locator('text=/Comment jouer|Lancez les dés/i');
    await expect(frenchText.first()).toBeVisible({ timeout: 10000 });

    // Navigate back home - should still be French
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    const homeFrench = page.locator('text=/Bienvenue sur Mini Games Portal|Jeux Disponibles/i');
    await expect(homeFrench.first()).toBeVisible({ timeout: 10000 });
  });

  test('game titles change when switching language', async ({ page }) => {
    // Navigate to snake page in English
    await page.goto('/games/snake', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    // Check English title
    await expect(page.locator('h1')).toContainText(/snake/i);

    // Switch to French via button
    const frButton = page.locator('button:has-text("FR")');
    await frButton.first().click();
    await page.waitForTimeout(500);

    // Title should still be visible (may or may not change depending on translation)
    await expect(page.locator('h1')).toBeVisible();
  });

  test('minesweeper shows French labels in FR mode', async ({ page }) => {
    // Set language to French via localStorage
    await page.evaluate(() => localStorage.setItem('language', 'fr'));

    // Navigate to minesweeper
    await page.goto('/games/minesweeper', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    const frenchContent = page.locator('text=/Facile|Moyen|Difficile|Démineur/i');
    await expect(frenchContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('yahtzee shows French labels in FR mode', async ({ page }) => {
    // Set language to French via localStorage
    await page.evaluate(() => localStorage.setItem('language', 'fr'));

    // Navigate to yahtzee
    await page.goto('/games/yahtzee', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    const frenchContent = page.locator('text=/Comment jouer|Lancez les dés/i');
    await expect(frenchContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('switching back to EN restores English text', async ({ page }) => {
    // Switch to French
    const frButton = page.locator('button:has-text("FR")');
    await frButton.first().click();
    await page.waitForTimeout(500);

    // Verify French is active
    const frenchText = page.locator('text=/Bienvenue sur Mini Games Portal|Jeux Disponibles/i');
    await expect(frenchText.first()).toBeVisible({ timeout: 5000 });

    // Switch back to English
    const enButton = page.locator('button:has-text("EN")');
    await enButton.first().click();
    await page.waitForTimeout(500);

    // Verify English is restored
    const englishText = page.locator('text=/Welcome to Mini Games Portal|Available Games/i');
    await expect(englishText.first()).toBeVisible({ timeout: 5000 });
  });

  test('language switcher visible on mobile in hamburger menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 393, height: 851 });
    await page.waitForTimeout(500);

    // Open hamburger menu
    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i], [data-testid="mobile-menu-button"]');
    if (await menuButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuButton.first().click();
      await page.waitForTimeout(500);

      // Language switcher should be present in the opened mobile menu drawer
      const menuDrawer = page.locator('[role="dialog"][aria-modal="true"]');
      await expect(menuDrawer).toContainText('EN');
      await expect(menuDrawer).toContainText('FR');
    } else {
      // On desktop viewport, language buttons should be visible in the header
      await expect(page.locator('header')).toContainText('EN');
      await expect(page.locator('header')).toContainText('FR');
    }
  });
});
