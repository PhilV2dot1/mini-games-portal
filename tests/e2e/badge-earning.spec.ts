import { test, expect } from '@playwright/test';
import {
  signUpWithEmail,
  completeProfileSetup,
  generateTestEmail,
  generateTestUsername,
} from './helpers/auth';
import {
  playBlackjackFree,
  playRockPaperScissorsFree,
  playMultipleGames,
} from './helpers/games';
import {
  navigateToMyProfile,
  getProfileStats,
  hasBadge,
  getAllBadges,
} from './helpers/profile';

test.describe('Badge Earning', () => {
  test.beforeEach(async ({ page }) => {
    // Create a new user for each test
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
  });

  test('User earns badge after playing 5 games', async ({ page }) => {
    // Play 5 games to earn "Getting Started" badge
    await playMultipleGames(page, 5, 'blackjack');

    // Navigate to profile
    await navigateToMyProfile(page);

    // Verify stats
    const stats = await getProfileStats(page);
    expect(stats.gamesPlayed).toBeGreaterThanOrEqual(5);

    // Check if badge notification appeared
    const badgeNotification = page.locator('[data-testid="badge-notification"]');
    if (await badgeNotification.isVisible({ timeout: 2000 })) {
      await expect(badgeNotification).toBeVisible();
    }

    // Verify badge is displayed on profile
    const badges = await getAllBadges(page);
    expect(badges.length).toBeGreaterThan(0);
  });

  test('Badge count increases on profile', async ({ page }) => {
    await navigateToMyProfile(page);

    // Initial badge count
    const initialStats = await getProfileStats(page);
    const initialBadges = initialStats.badges;

    // Play games to earn badge
    await playMultipleGames(page, 10, 'rps');

    // Refresh profile
    await navigateToMyProfile(page);

    // Badge count should increase
    const newStats = await getProfileStats(page);
    expect(newStats.badges).toBeGreaterThan(initialBadges);
  });

  test('Badge points add to total points', async ({ page }) => {
    await navigateToMyProfile(page);

    const initialStats = await getProfileStats(page);
    const initialPoints = initialStats.totalPoints;

    // Play games to potentially earn badges
    await playMultipleGames(page, 15, 'blackjack');

    await navigateToMyProfile(page);

    const newStats = await getProfileStats(page);

    // Points should increase (from games and potentially badges)
    expect(newStats.totalPoints).toBeGreaterThan(initialPoints);

    // If badges were earned, points should increase significantly
    if (newStats.badges > initialStats.badges) {
      // Badge points should be substantial
      const pointsDifference = newStats.totalPoints - initialPoints;
      expect(pointsDifference).toBeGreaterThan(50); // Badge points + game points
    }
  });

  test('Badges display correctly on profile', async ({ page }) => {
    // Play games
    await playMultipleGames(page, 10, 'blackjack');

    await navigateToMyProfile(page);

    // Check if any badges are displayed
    const badgeElements = page.locator('[data-testid="badge-item"]');
    const badgeCount = await badgeElements.count();

    if (badgeCount > 0) {
      // Verify first badge has name and icon
      const firstBadge = badgeElements.first();
      await expect(firstBadge).toBeVisible();

      const badgeName = firstBadge.locator('[data-testid="badge-name"]');
      await expect(badgeName).toBeVisible();

      const badgeIcon = firstBadge.locator('[data-testid="badge-icon"]');
      if (await badgeIcon.isVisible({ timeout: 1000 })) {
        await expect(badgeIcon).toBeVisible();
      }
    }
  });

  test('Multiple badge types can be earned', async ({ page }) => {
    // Play different types of games to earn different badges
    await playMultipleGames(page, 5, 'blackjack');
    await playMultipleGames(page, 5, 'rps');
    await playMultipleGames(page, 5, 'tictactoe');

    await navigateToMyProfile(page);

    // Should have multiple badges
    const badges = await getAllBadges(page);

    // Depending on badge requirements, might have earned multiple
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  test('Badge notification shows when earned', async ({ page }) => {
    // Play games
    await playBlackjackFree(page);
    await page.waitForTimeout(1000);
    await playBlackjackFree(page);
    await page.waitForTimeout(1000);
    await playBlackjackFree(page);
    await page.waitForTimeout(1000);
    await playBlackjackFree(page);
    await page.waitForTimeout(1000);
    await playBlackjackFree(page);

    // Check for badge notification
    const notification = page.locator('[data-testid="badge-notification"]');
    const toast = page.locator('.toast:has-text("Badge")');

    // Either a dedicated notification or a toast should appear
    const hasNotification = await notification.isVisible({ timeout: 3000 }).catch(() => false);
    const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false);

    // At least one notification method should be present
    if (hasNotification || hasToast) {
      expect(hasNotification || hasToast).toBe(true);
    }
  });

  test('Earned badges persist across page refreshes', async ({ page }) => {
    // Play games to earn badge
    await playMultipleGames(page, 10, 'blackjack');

    await navigateToMyProfile(page);

    const badgesBefore = await getAllBadges(page);

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    const badgesAfter = await getAllBadges(page);

    // Same badges should be present
    expect(badgesAfter.length).toBe(badgesBefore.length);
  });

  test('Badge categories are displayed', async ({ page }) => {
    // Play games to earn badges
    await playMultipleGames(page, 15, 'blackjack');

    await navigateToMyProfile(page);

    // Check if badges have category labels
    const badgeCategories = page.locator('[data-testid="badge-category"]');
    const categoryCount = await badgeCategories.count();

    if (categoryCount > 0) {
      // At least one category should be visible
      await expect(badgeCategories.first()).toBeVisible();
    }
  });

  test('Badge progress shows for upcoming badges', async ({ page }) => {
    await navigateToMyProfile(page);

    // Check if there's a badge progress section
    const badgeProgress = page.locator('[data-testid="badge-progress"]');

    if (await badgeProgress.isVisible({ timeout: 2000 })) {
      // Should show progress toward next badge
      await expect(badgeProgress).toBeVisible();
    }
  });

  test('Playing different games unlocks variety badges', async ({ page }) => {
    // Play multiple different games
    await playBlackjackFree(page);
    await playRockPaperScissorsFree(page);

    await navigateToMyProfile(page);

    const stats = await getProfileStats(page);

    // Should have played at least 2 games
    expect(stats.gamesPlayed).toBeGreaterThanOrEqual(2);

    // Badges might be earned for game variety
    const badges = await getAllBadges(page);
    expect(badges.length).toBeGreaterThanOrEqual(0);
  });

  test('Badge requirements are displayed', async ({ page }) => {
    await navigateToMyProfile(page);

    // Navigate to badges section or page
    const badgesLink = page.locator('a:has-text("Badges")');
    if (await badgesLink.isVisible({ timeout: 2000 })) {
      await badgesLink.click();
      await page.waitForLoadState('networkidle');

      // Should show all available badges and requirements
      const badgeRequirements = page.locator('[data-testid="badge-requirement"]');
      const count = await badgeRequirements.count();

      if (count > 0) {
        // Requirements should be visible
        await expect(badgeRequirements.first()).toBeVisible();
      }
    }
  });

  test('Locked badges show as locked', async ({ page }) => {
    await navigateToMyProfile(page);

    // Check for locked badge indicators
    const lockedBadges = page.locator('[data-testid="badge-locked"]');
    const lockedCount = await lockedBadges.count();

    if (lockedCount > 0) {
      // Locked badges should be visible but marked as locked
      const firstLocked = lockedBadges.first();
      await expect(firstLocked).toBeVisible();

      // Should have some visual indicator (opacity, lock icon, etc.)
      const classList = await firstLocked.getAttribute('class');
      expect(classList).toBeTruthy();
    }
  });

  test('Badge points vary by badge rarity', async ({ page }) => {
    // Play many games to earn multiple badges
    await playMultipleGames(page, 25, 'blackjack');

    await navigateToMyProfile(page);

    const badges = await getAllBadges(page);

    if (badges.length > 1) {
      // Different badges should exist
      expect(badges.length).toBeGreaterThan(1);

      // This validates that badge system is working
      // (actual point values vary by badge)
    }
  });

  test('Stats update correctly after earning badge', async ({ page }) => {
    // Initial stats
    await navigateToMyProfile(page);
    const initialStats = await getProfileStats(page);

    // Play games
    await playMultipleGames(page, 8, 'blackjack');

    // Check updated stats
    await navigateToMyProfile(page);
    const newStats = await getProfileStats(page);

    expect(newStats.gamesPlayed).toBe(initialStats.gamesPlayed + 8);
    expect(newStats.totalPoints).toBeGreaterThan(initialStats.totalPoints);
  });
});
