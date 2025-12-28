import { Page, expect } from '@playwright/test';

/**
 * Navigate to own profile
 */
export async function navigateToMyProfile(page: Page) {
  await page.goto('/profile/me');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to user profile by username
 */
export async function navigateToUserProfile(page: Page, username: string) {
  await page.goto(`/profile/${username}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Edit profile
 */
export async function editProfile(
  page: Page,
  options: {
    displayName?: string;
    bio?: string;
    theme?: 'yellow' | 'blue' | 'green' | 'red' | 'purple' | 'pink';
    twitter?: string;
    farcaster?: string;
    discord?: string;
  }
) {
  // Should be on profile page
  await page.click('text=Edit Profile');
  await page.waitForSelector('input[name="displayName"]', { timeout: 5000 });

  // Update display name
  if (options.displayName !== undefined) {
    await page.fill('input[name="displayName"]', options.displayName);
  }

  // Update bio
  if (options.bio !== undefined) {
    await page.fill('textarea[name="bio"]', options.bio);
  }

  // Update theme
  if (options.theme) {
    await page.click(`[data-testid="theme-${options.theme}"]`);
  }

  // Update social links
  if (options.twitter !== undefined) {
    await page.fill('input[name="twitter"]', options.twitter);
  }

  if (options.farcaster !== undefined) {
    await page.fill('input[name="farcaster"]', options.farcaster);
  }

  if (options.discord !== undefined) {
    await page.fill('input[name="discord"]', options.discord);
  }

  // Save changes
  await page.click('button:has-text("Save Changes")');

  // Wait for save to complete
  await page.waitForTimeout(2000);
}

/**
 * Get profile stats
 */
export async function getProfileStats(page: Page): Promise<{
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  badges: number;
}> {
  // Extract total points
  const pointsText = await page
    .locator('[data-testid="profile-total-points"]')
    .textContent();
  const totalPoints = parseInt(pointsText?.replace(/[^0-9]/g, '') || '0', 10);

  // Extract games played
  const gamesPlayedText = await page
    .locator('[data-testid="profile-games-played"]')
    .textContent();
  const gamesPlayed = parseInt(
    gamesPlayedText?.replace(/[^0-9]/g, '') || '0',
    10
  );

  // Extract wins
  const winsText = await page
    .locator('[data-testid="profile-wins"]')
    .textContent();
  const wins = parseInt(winsText?.replace(/[^0-9]/g, '') || '0', 10);

  // Count badges
  const badgeElements = page.locator('[data-testid="badge-item"]');
  const badges = await badgeElements.count();

  return { totalPoints, gamesPlayed, wins, badges };
}

/**
 * Check if badge is displayed on profile
 */
export async function hasBadge(page: Page, badgeName: string): Promise<boolean> {
  const badge = page.locator(`[data-testid="badge-item"]:has-text("${badgeName}")`);
  return await badge.isVisible();
}

/**
 * Get all badge names on profile
 */
export async function getAllBadges(page: Page): Promise<string[]> {
  const badgeElements = page.locator('[data-testid="badge-name"]');
  const count = await badgeElements.count();
  const badges: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await badgeElements.nth(i).textContent();
    if (text) badges.push(text.trim());
  }

  return badges;
}

/**
 * Verify profile privacy setting
 */
export async function verifyProfilePrivacy(
  page: Page,
  isPrivate: boolean
) {
  const privacyToggle = page.locator('[data-testid="privacy-toggle"]');
  const isChecked = await privacyToggle.isChecked();

  expect(isChecked).toBe(isPrivate);
}

/**
 * Toggle profile privacy
 */
export async function toggleProfilePrivacy(page: Page) {
  await page.click('text=Edit Profile');
  await page.waitForSelector('[data-testid="privacy-toggle"]', { timeout: 5000 });

  await page.click('[data-testid="privacy-toggle"]');

  await page.click('button:has-text("Save Changes")');
  await page.waitForTimeout(2000);
}

/**
 * Get profile completeness percentage
 */
export async function getProfileCompleteness(page: Page): Promise<number> {
  const completenessText = await page
    .locator('[data-testid="profile-completeness"]')
    .textContent();

  if (!completenessText) return 0;

  // Extract percentage (e.g., "75%" -> 75)
  const percentage = parseInt(completenessText.replace(/[^0-9]/g, ''), 10);
  return percentage || 0;
}

/**
 * Upload custom avatar (if unlocked)
 */
export async function uploadCustomAvatar(
  page: Page,
  imagePath: string
) {
  await page.click('text=Edit Profile');
  await page.waitForSelector('[data-testid="avatar-upload"]', { timeout: 5000 });

  // Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(imagePath);

  // Wait for upload to complete
  await page.waitForTimeout(2000);

  await page.click('button:has-text("Save Changes")');
  await page.waitForTimeout(2000);
}

/**
 * Verify display name is shown
 */
export async function verifyDisplayName(page: Page, displayName: string) {
  const element = page.locator('[data-testid="profile-display-name"]');
  await expect(element).toHaveText(displayName);
}

/**
 * Verify bio is shown
 */
export async function verifyBio(page: Page, bio: string) {
  const element = page.locator('[data-testid="profile-bio"]');
  await expect(element).toHaveText(bio);
}

/**
 * Verify theme color is applied
 */
export async function verifyThemeColor(
  page: Page,
  theme: 'yellow' | 'blue' | 'green' | 'red' | 'purple' | 'pink'
) {
  // Check if profile card has the theme class or color
  const profileCard = page.locator('[data-testid="profile-card"]');
  const classList = await profileCard.getAttribute('class');

  expect(classList).toContain(theme);
}
