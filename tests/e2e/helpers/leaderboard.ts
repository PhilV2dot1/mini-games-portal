import { Page, expect } from '@playwright/test';

/**
 * Navigate to global leaderboard
 */
export async function navigateToLeaderboard(page: Page) {
  await page.goto('/leaderboard');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to game-specific leaderboard
 */
export async function navigateToGameLeaderboard(
  page: Page,
  gameId: 'blackjack' | 'rps' | 'tictactoe' | 'jackpot' | '2048' | 'mastermind'
) {
  await page.goto(`/leaderboard/${gameId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Get leaderboard entries
 */
export async function getLeaderboardEntries(page: Page): Promise<
  Array<{
    rank: number;
    username: string;
    points: number;
  }>
> {
  const rows = page.locator('[data-testid="leaderboard-row"]');
  const count = await rows.count();
  const entries = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);

    const rankText = await row
      .locator('[data-testid="player-rank"]')
      .textContent();
    const rank = parseInt(rankText?.replace(/[^0-9]/g, '') || '0', 10);

    const username = (await row
      .locator('[data-testid="player-username"]')
      .textContent()) || '';

    const pointsText = await row
      .locator('[data-testid="player-points"]')
      .textContent();
    const points = parseInt(pointsText?.replace(/[^0-9]/g, '') || '0', 10);

    entries.push({ rank, username, points });
  }

  return entries;
}

/**
 * Find user in leaderboard
 */
export async function findUserInLeaderboard(
  page: Page,
  username: string
): Promise<{ rank: number; points: number } | null> {
  const entries = await getLeaderboardEntries(page);
  const entry = entries.find((e) => e.username === username);

  if (!entry) return null;

  return { rank: entry.rank, points: entry.points };
}

/**
 * Click on user in leaderboard to view profile
 */
export async function clickUserInLeaderboard(page: Page, username: string) {
  const row = page.locator(
    `[data-testid="leaderboard-row"]:has-text("${username}")`
  );
  await row.click();

  // Wait for navigation to profile
  await page.waitForURL(/.*profile/);
}

/**
 * Switch to game-specific leaderboard
 */
export async function switchToGameLeaderboard(
  page: Page,
  gameId: 'blackjack' | 'rps' | 'tictactoe' | 'jackpot' | '2048' | 'mastermind'
) {
  await page.click(`[data-testid="game-filter-${gameId}"]`);
  await page.waitForLoadState('networkidle');
}

/**
 * Search for user in leaderboard
 */
export async function searchLeaderboard(page: Page, query: string) {
  const searchInput = page.locator('input[name="search"]');

  if (await searchInput.isVisible()) {
    await searchInput.fill(query);
    await page.waitForTimeout(1000); // Wait for search to filter
  }
}

/**
 * Verify leaderboard is ordered by rank
 */
export async function verifyLeaderboardOrder(page: Page) {
  const entries = await getLeaderboardEntries(page);

  for (let i = 0; i < entries.length - 1; i++) {
    expect(entries[i].rank).toBeLessThanOrEqual(entries[i + 1].rank);
  }
}

/**
 * Verify leaderboard shows correct data
 */
export async function verifyLeaderboardData(page: Page) {
  const entries = await getLeaderboardEntries(page);

  // Should have at least some entries
  expect(entries.length).toBeGreaterThan(0);

  // Each entry should have valid data
  for (const entry of entries) {
    expect(entry.rank).toBeGreaterThan(0);
    expect(entry.username).toBeTruthy();
    expect(entry.points).toBeGreaterThanOrEqual(0);
  }
}

/**
 * Get user's current rank
 */
export async function getUserRank(page: Page, username: string): Promise<number | null> {
  const entry = await findUserInLeaderboard(page, username);
  return entry?.rank || null;
}

/**
 * Verify user appears in top N
 */
export async function verifyUserInTopN(
  page: Page,
  username: string,
  n: number
) {
  const rank = await getUserRank(page, username);
  expect(rank).toBeTruthy();
  expect(rank).toBeLessThanOrEqual(n);
}

/**
 * Load more leaderboard entries (if pagination exists)
 */
export async function loadMoreEntries(page: Page) {
  const loadMoreButton = page.locator('button:has-text("Load More")');

  if (await loadMoreButton.isVisible()) {
    await loadMoreButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Verify theme colors are displayed for users
 */
export async function verifyThemeColorsDisplayed(page: Page) {
  const avatars = page.locator('[data-testid="player-avatar"]');
  const count = await avatars.count();

  // At least one avatar should have a theme color
  expect(count).toBeGreaterThan(0);

  // Check first avatar has a color class
  const firstAvatar = avatars.first();
  const classList = await firstAvatar.getAttribute('class');
  expect(classList).toBeTruthy();
}
