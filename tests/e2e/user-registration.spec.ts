import { test, expect } from '@playwright/test';
import {
  signUpWithEmail,
  completeProfileSetup,
  generateTestEmail,
  generateTestUsername,
} from './helpers/auth';
import {
  playBlackjackFree,
  getCurrentPoints,
  verifyGameResultDisplayed,
} from './helpers/games';
import { navigateToMyProfile, getProfileStats } from './helpers/profile';

test.describe('User Registration Flow', () => {
  test('New user can sign up, complete profile, and play first game', async ({
    page,
  }) => {
    // Step 1: Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Celo Games Portal/i);

    // Step 2: Sign up with new account
    const email = generateTestEmail();
    const password = 'TestPassword123!';

    await signUpWithEmail(page, email, password);

    // Step 3: Should be redirected to profile setup
    await expect(page).toHaveURL(/.*profile-setup/, { timeout: 10000 });

    // Step 4: Complete profile
    const username = generateTestUsername();
    const profileData = await completeProfileSetup(page, {
      username,
      displayName: 'Test Player',
      bio: 'Just testing the platform!',
      theme: 'yellow',
      avatar: 'default',
    });

    // Step 5: Should be redirected after profile setup
    await page.waitForTimeout(2000);

    // Verify we're no longer on profile-setup page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('profile-setup');

    // Step 6: Navigate to Blackjack
    await page.goto('/blackjack');
    await expect(page).toHaveURL(/.*blackjack/);

    // Step 7: Play a game in free mode
    const pointsBefore = await getCurrentPoints(page);

    await playBlackjackFree(page);

    // Step 8: Verify result is displayed
    await verifyGameResultDisplayed(page);

    // Step 9: Verify points were awarded
    const pointsAfter = await getCurrentPoints(page);
    expect(pointsAfter).toBeGreaterThan(pointsBefore);

    // Step 10: Navigate to profile and verify stats
    await navigateToMyProfile(page);

    const stats = await getProfileStats(page);
    expect(stats.gamesPlayed).toBeGreaterThanOrEqual(1);
    expect(stats.totalPoints).toBeGreaterThan(0);

    // Verify profile data is displayed
    await expect(
      page.locator('[data-testid="profile-display-name"]')
    ).toContainText('Test Player');
  });

  test('User can sign up with minimal profile info', async ({ page }) => {
    // Sign up
    const email = generateTestEmail();
    const password = 'TestPassword123!';

    await signUpWithEmail(page, email, password);

    // Wait for profile setup
    await expect(page).toHaveURL(/.*profile-setup/, { timeout: 10000 });

    // Complete with minimal info (just username)
    const username = generateTestUsername();
    await completeProfileSetup(page, {
      username,
      theme: 'blue',
      avatar: 'default',
    });

    // Should complete successfully
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('profile-setup');

    // Verify can play games
    await page.goto('/rps');
    await page.waitForLoadState('networkidle');

    // Should be able to play
    const rockButton = page.locator('button[data-choice="rock"]');
    await expect(rockButton).toBeVisible();
  });

  test('Username validation works during signup', async ({ page }) => {
    const email = generateTestEmail();
    const password = 'TestPassword123!';

    await signUpWithEmail(page, email, password);

    await expect(page).toHaveURL(/.*profile-setup/, { timeout: 10000 });

    // Try invalid username (too short)
    await page.fill('input[name="username"]', 'ab');
    await page.click('button:has-text("Save Profile")');

    // Should show error
    await expect(page.locator('text=/.*3.*characters/i')).toBeVisible({
      timeout: 5000,
    });

    // Try invalid username (special characters)
    await page.fill('input[name="username"]', 'user@123');
    await page.click('button:has-text("Save Profile")');

    // Should show error
    await expect(
      page.locator('text=/.*alphanumeric|invalid/i')
    ).toBeVisible({ timeout: 5000 });

    // Use valid username
    const validUsername = generateTestUsername();
    await page.fill('input[name="username"]', validUsername);
    await page.click('[data-testid="theme-yellow"]');
    await page.click('[data-testid="avatar-default"]');
    await page.click('button:has-text("Save Profile")');

    // Should succeed
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('profile-setup');
  });

  test('User can select different themes during signup', async ({ page }) => {
    const email = generateTestEmail();
    const password = 'TestPassword123!';

    await signUpWithEmail(page, email, password);

    await expect(page).toHaveURL(/.*profile-setup/, { timeout: 10000 });

    // Select each theme to verify they're clickable
    const themes = ['yellow', 'blue', 'green', 'red', 'purple', 'pink'];

    for (const theme of themes) {
      const themeButton = page.locator(`[data-testid="theme-${theme}"]`);
      await expect(themeButton).toBeVisible();
      await themeButton.click();
      await page.waitForTimeout(300);
    }

    // Complete profile with purple theme
    const username = generateTestUsername();
    await page.fill('input[name="username"]', username);
    await page.click('[data-testid="theme-purple"]');
    await page.click('[data-testid="avatar-default"]');
    await page.click('button:has-text("Save Profile")');

    // Should succeed
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('profile-setup');
  });

  test('User can select predefined avatar during signup', async ({ page }) => {
    const email = generateTestEmail();
    const password = 'TestPassword123!';

    await signUpWithEmail(page, email, password);

    await expect(page).toHaveURL(/.*profile-setup/, { timeout: 10000 });

    const username = generateTestUsername();
    await page.fill('input[name="username"]', username);
    await page.click('[data-testid="theme-yellow"]');

    // Select predefined avatar
    await page.click('[data-testid="avatar-predefined"]');

    // Should show predefined avatar options
    const firstAvatar = page.locator('[data-testid="predefined-avatar-0"]');
    await expect(firstAvatar).toBeVisible({ timeout: 5000 });

    await firstAvatar.click();
    await page.click('button:has-text("Save Profile")');

    // Should succeed
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('profile-setup');
  });

  test('Bio character counter works', async ({ page }) => {
    const email = generateTestEmail();
    const password = 'TestPassword123!';

    await signUpWithEmail(page, email, password);

    await expect(page).toHaveURL(/.*profile-setup/, { timeout: 10000 });

    // Type in bio
    const bioText = 'This is my bio!';
    await page.fill('textarea[name="bio"]', bioText);

    // Should show character count
    const charCounter = page.locator('[data-testid="bio-char-count"]');
    if (await charCounter.isVisible()) {
      const counterText = await charCounter.textContent();
      expect(counterText).toContain(`${bioText.length}`);
    }

    // Complete profile
    const username = generateTestUsername();
    await page.fill('input[name="username"]', username);
    await page.click('[data-testid="theme-yellow"]');
    await page.click('[data-testid="avatar-default"]');
    await page.click('button:has-text("Save Profile")');

    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('profile-setup');
  });

  test('New user starts with 0 points', async ({ page }) => {
    const email = generateTestEmail();
    const password = 'TestPassword123!';

    await signUpWithEmail(page, email, password);

    await expect(page).toHaveURL(/.*profile-setup/, { timeout: 10000 });

    const username = generateTestUsername();
    await completeProfileSetup(page, {
      username,
      theme: 'yellow',
      avatar: 'default',
    });

    await page.waitForTimeout(2000);

    // Navigate to profile
    await navigateToMyProfile(page);

    // Should have 0 points and 0 games
    const stats = await getProfileStats(page);
    expect(stats.totalPoints).toBe(0);
    expect(stats.gamesPlayed).toBe(0);
    expect(stats.wins).toBe(0);
  });

  test('Playing multiple games increases stats', async ({ page }) => {
    const email = generateTestEmail();
    const password = 'TestPassword123!';

    await signUpWithEmail(page, email, password);

    await expect(page).toHaveURL(/.*profile-setup/, { timeout: 10000 });

    const username = generateTestUsername();
    await completeProfileSetup(page, {
      username,
      theme: 'yellow',
      avatar: 'default',
    });

    await page.waitForTimeout(2000);

    // Play 3 games
    for (let i = 0; i < 3; i++) {
      await playBlackjackFree(page);
      await page.waitForTimeout(1000);
    }

    // Check stats
    await navigateToMyProfile(page);

    const stats = await getProfileStats(page);
    expect(stats.gamesPlayed).toBe(3);
    expect(stats.totalPoints).toBeGreaterThan(0);
  });
});
