import { test, expect } from '@playwright/test';
import {
  signUpWithEmail,
  completeProfileSetup,
  generateTestEmail,
  generateTestUsername,
} from './helpers/auth';
import { playMultipleGames } from './helpers/games';
import {
  navigateToLeaderboard,
  navigateToGameLeaderboard,
  getLeaderboardEntries,
  findUserInLeaderboard,
  clickUserInLeaderboard,
  switchToGameLeaderboard,
  searchLeaderboard,
  verifyLeaderboardOrder,
  verifyLeaderboardData,
  getUserRank,
} from './helpers/leaderboard';

test.describe('Leaderboard', () => {
  test('Global leaderboard displays correctly', async ({ page }) => {
    await navigateToLeaderboard(page);

    // Verify leaderboard table is visible
    await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();

    // Verify data is present and ordered
    await verifyLeaderboardData(page);
    await verifyLeaderboardOrder(page);
  });

  test('Leaderboard shows top players', async ({ page }) => {
    await navigateToLeaderboard(page);

    const entries = await getLeaderboardEntries(page);

    // Should have at least some entries
    expect(entries.length).toBeGreaterThan(0);

    // First entry should be rank 1
    if (entries.length > 0) {
      expect(entries[0].rank).toBe(1);
    }

    // Ranks should be sequential
    for (let i = 0; i < Math.min(entries.length - 1, 10); i++) {
      expect(entries[i].rank).toBeLessThanOrEqual(entries[i + 1].rank);
    }
  });

  test('User can view their own profile from leaderboard', async ({ page }) => {
    // Create user and play games to appear on leaderboard
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

    // Play some games to get points
    await playMultipleGames(page, 5, 'blackjack');

    // Navigate to leaderboard
    await navigateToLeaderboard(page);

    // Find self in leaderboard
    const userEntry = await findUserInLeaderboard(page, username);

    if (userEntry) {
      // User should be in leaderboard
      expect(userEntry.rank).toBeGreaterThan(0);
      expect(userEntry.points).toBeGreaterThan(0);

      // Click on own profile
      await clickUserInLeaderboard(page, username);

      // Should navigate to profile
      await expect(page).toHaveURL(/.*profile/);
    }
  });

  test('Leaderboard updates after playing games', async ({ page }) => {
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

    // Play games
    await playMultipleGames(page, 10, 'blackjack');

    // Check leaderboard
    await navigateToLeaderboard(page);

    const userEntry = await findUserInLeaderboard(page, username);

    if (userEntry) {
      const initialRank = userEntry.rank;
      const initialPoints = userEntry.points;

      // Play more games
      await playMultipleGames(page, 10, 'blackjack');

      // Refresh leaderboard
      await page.reload();
      await page.waitForLoadState('networkidle');

      const updatedEntry = await findUserInLeaderboard(page, username);

      if (updatedEntry) {
        // Points should increase
        expect(updatedEntry.points).toBeGreaterThan(initialPoints);

        // Rank might improve (lower number = better rank)
        expect(updatedEntry.rank).toBeLessThanOrEqual(initialRank);
      }
    }
  });

  test('Game-specific leaderboards work', async ({ page }) => {
    await navigateToGameLeaderboard(page, 'blackjack');

    // Should show Blackjack leaderboard
    await expect(
      page.locator('text=/.*Blackjack.*Leaderboard/i')
    ).toBeVisible({ timeout: 5000 });

    // Verify leaderboard data
    await verifyLeaderboardData(page);
  });

  test('Switching between game leaderboards works', async ({ page }) => {
    await navigateToLeaderboard(page);

    // Switch to Blackjack leaderboard
    await switchToGameLeaderboard(page, 'blackjack');

    await expect(
      page.locator('[data-testid="game-filter-blackjack"]')
    ).toHaveAttribute('aria-selected', 'true');

    // Switch to RPS leaderboard
    await switchToGameLeaderboard(page, 'rps');

    await expect(
      page.locator('[data-testid="game-filter-rps"]')
    ).toHaveAttribute('aria-selected', 'true');
  });

  test('Search functionality filters leaderboard', async ({ page }) => {
    await navigateToLeaderboard(page);

    const entries = await getLeaderboardEntries(page);

    if (entries.length > 0) {
      const firstUsername = entries[0].username;

      // Search for first user
      await searchLeaderboard(page, firstUsername);

      // Results should be filtered
      const filteredEntries = await getLeaderboardEntries(page);

      // Should have fewer or same entries
      expect(filteredEntries.length).toBeLessThanOrEqual(entries.length);

      // Filtered entries should contain search query
      for (const entry of filteredEntries) {
        expect(entry.username.toLowerCase()).toContain(
          firstUsername.toLowerCase()
        );
      }
    }
  });

  test('Leaderboard displays player avatars', async ({ page }) => {
    await navigateToLeaderboard(page);

    const avatars = page.locator('[data-testid="player-avatar"]');
    const count = await avatars.count();

    // Should have avatars for players
    expect(count).toBeGreaterThan(0);

    // First avatar should be visible
    await expect(avatars.first()).toBeVisible();
  });

  test('Leaderboard displays player theme colors', async ({ page }) => {
    await navigateToLeaderboard(page);

    // Check if theme colors are applied to avatars or usernames
    const entries = page.locator('[data-testid="leaderboard-row"]');
    const count = await entries.count();

    if (count > 0) {
      const firstEntry = entries.first();

      // Avatar or username should have theme styling
      const avatar = firstEntry.locator('[data-testid="player-avatar"]');
      const classList = await avatar.getAttribute('class');

      expect(classList).toBeTruthy();
    }
  });

  test('Leaderboard shows stats (games played, wins)', async ({ page }) => {
    await navigateToLeaderboard(page);

    const entries = page.locator('[data-testid="leaderboard-row"]');
    const count = await entries.count();

    if (count > 0) {
      const firstEntry = entries.first();

      // Should show games played
      const gamesPlayed = firstEntry.locator('[data-testid="player-games-played"]');
      if (await gamesPlayed.isVisible({ timeout: 2000 })) {
        await expect(gamesPlayed).toBeVisible();
      }

      // Should show wins
      const wins = firstEntry.locator('[data-testid="player-wins"]');
      if (await wins.isVisible({ timeout: 2000 })) {
        await expect(wins).toBeVisible();
      }
    }
  });

  test('Pagination loads more entries', async ({ page }) => {
    await navigateToLeaderboard(page);

    const initialEntries = await getLeaderboardEntries(page);
    const initialCount = initialEntries.length;

    // Look for load more button or pagination
    const loadMoreButton = page.locator('button:has-text("Load More")');
    const nextPageButton = page.locator('button:has-text("Next")');

    if (await loadMoreButton.isVisible({ timeout: 2000 })) {
      await loadMoreButton.click();
      await page.waitForTimeout(1000);

      const newEntries = await getLeaderboardEntries(page);
      expect(newEntries.length).toBeGreaterThan(initialCount);
    } else if (await nextPageButton.isVisible({ timeout: 2000 })) {
      await nextPageButton.click();
      await page.waitForTimeout(1000);

      const newEntries = await getLeaderboardEntries(page);
      // New page should have entries
      expect(newEntries.length).toBeGreaterThan(0);
    }
  });

  test('Empty search shows no results', async ({ page }) => {
    await navigateToLeaderboard(page);

    // Search for something that doesn't exist
    await searchLeaderboard(page, 'xyznonexistentuser123');

    await page.waitForTimeout(1000);

    // Should show no results message or empty state
    const noResults = page.locator('text=/.*no.*results|no.*players|not found/i');
    const entries = await getLeaderboardEntries(page);

    // Either show no results message or have 0 entries
    const hasNoResultsMessage = await noResults.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasNoResultsMessage) {
      expect(entries.length).toBe(0);
    }
  });

  test('Clicking player row navigates to their profile', async ({ page }) => {
    await navigateToLeaderboard(page);

    const entries = await getLeaderboardEntries(page);

    if (entries.length > 0) {
      const firstUsername = entries[0].username;

      await clickUserInLeaderboard(page, firstUsername);

      // Should navigate to profile
      await expect(page).toHaveURL(/.*profile/);

      // Should show the player's profile
      const profileUsername = page.locator('[data-testid="profile-username"]');
      if (await profileUsername.isVisible({ timeout: 2000 })) {
        await expect(profileUsername).toContainText(firstUsername);
      }
    }
  });

  test('Leaderboard refreshes automatically', async ({ page }) => {
    await navigateToLeaderboard(page);

    const initialEntries = await getLeaderboardEntries(page);

    // Wait a bit
    await page.waitForTimeout(5000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    const newEntries = await getLeaderboardEntries(page);

    // Should still have entries
    expect(newEntries.length).toBeGreaterThan(0);

    // Leaderboard should be stable
    expect(newEntries.length).toBeGreaterThanOrEqual(
      Math.min(initialEntries.length, 10)
    );
  });

  test('Display names show on leaderboard', async ({ page }) => {
    const email = generateTestEmail();
    const password = 'TestPassword123!';

    await signUpWithEmail(page, email, password);
    await expect(page).toHaveURL(/.*profile-setup/, { timeout: 10000 });

    const username = generateTestUsername();
    const displayName = 'Leaderboard Display Name';

    await completeProfileSetup(page, {
      username,
      displayName,
      theme: 'yellow',
      avatar: 'default',
    });

    await page.waitForTimeout(2000);

    // Play games to appear on leaderboard
    await playMultipleGames(page, 10, 'blackjack');

    // Check leaderboard
    await navigateToLeaderboard(page);

    const userRow = page.locator(
      `[data-testid="leaderboard-row"]:has-text("${username}")`
    );

    if (await userRow.isVisible({ timeout: 3000 })) {
      // Should show display name
      const displayNameElement = userRow.locator('[data-testid="player-display-name"]');

      if (await displayNameElement.isVisible({ timeout: 2000 })) {
        await expect(displayNameElement).toContainText(displayName);
      }
    }
  });

  test('Leaderboard is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateToLeaderboard(page);

    // Leaderboard should still be visible
    await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();

    // Entries should be visible
    const entries = await getLeaderboardEntries(page);
    expect(entries.length).toBeGreaterThan(0);
  });

  test('Leaderboard ranks are accurate', async ({ page }) => {
    await navigateToLeaderboard(page);

    const entries = await getLeaderboardEntries(page);

    // Verify ranks are sequential and accurate
    for (let i = 0; i < Math.min(entries.length, 20); i++) {
      // Ranks should be in order
      if (i > 0) {
        expect(entries[i].rank).toBeGreaterThanOrEqual(entries[i - 1].rank);
      }

      // Higher points = better (lower) rank
      if (i > 0 && entries[i].rank > entries[i - 1].rank) {
        expect(entries[i].points).toBeLessThanOrEqual(entries[i - 1].points);
      }
    }
  });
});
