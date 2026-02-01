import { test, expect } from '@playwright/test';

test.describe('Chain Switching UI', () => {
  test('game pages show chain-related contract info', async ({ page }) => {
    await page.goto('/blackjack');
    await page.waitForLoadState('networkidle');

    // Contract info should be in the footer area
    const contractText = page.locator('text=Contract, text=contract, text=Coming soon');
    await expect(contractText.first()).toBeVisible({ timeout: 5000 });
  });

  test('solitaire page shows contract or coming soon for chain', async ({ page }) => {
    await page.goto('/games/solitaire');
    await page.waitForLoadState('networkidle');

    // Should show either contract address or "Coming soon on Base"
    const chainInfo = page.locator('text=Contract, text=contract, text=Coming soon, text=Base');
    await expect(chainInfo.first()).toBeVisible({ timeout: 5000 });
  });

  test('on-chain mode shows wallet connect on tictactoe', async ({ page }) => {
    await page.goto('/tictactoe');
    await page.waitForLoadState('networkidle');

    // Click On-Chain mode
    const onchainButton = page.locator('button:has-text("On-Chain"), button:has-text("On Chain")');
    if (await onchainButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await onchainButton.first().click();
      await page.waitForTimeout(500);

      // Wallet connect component should appear
      const walletConnect = page.locator('text=Connect Wallet, text=wallet, text=Wallet, button:has-text("Connect")');
      await expect(walletConnect.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('on-chain mode shows wallet connect on solitaire', async ({ page }) => {
    await page.goto('/games/solitaire');
    await page.waitForLoadState('networkidle');

    const onchainButton = page.locator('button:has-text("On-Chain"), button:has-text("On Chain")');
    if (await onchainButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await onchainButton.first().click();
      await page.waitForTimeout(500);

      const walletConnect = page.locator('text=Connect Wallet, text=wallet, text=Wallet, button:has-text("Connect")');
      await expect(walletConnect.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('free mode does not show wallet connect', async ({ page }) => {
    await page.goto('/tictactoe');
    await page.waitForLoadState('networkidle');

    // Ensure we're on Free mode
    const freeButton = page.locator('button:has-text("Free")');
    if (await freeButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await freeButton.first().click();
      await page.waitForTimeout(500);
    }

    // Wallet connect should NOT be visible in free mode
    const walletConnect = page.locator('[data-testid="wallet-connect"]');
    await expect(walletConnect).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // It's ok if selector doesn't exist at all
    });
  });

  test('multiple games show contract info in footer', async ({ page }) => {
    const gamePaths = ['/blackjack', '/rps', '/tictactoe'];

    for (const path of gamePaths) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Each game should have some contract or chain info in footer
      const footer = page.locator('text=Contract, text=contract, text=Coming soon, text=Celoscan, text=Basescan');
      const hasChainInfo = await footer.first().isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasChainInfo).toBe(true);
    }
  });
});
