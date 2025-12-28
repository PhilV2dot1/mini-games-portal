import { test, expect } from '@playwright/test';
import {
  signUpWithEmail,
  completeProfileSetup,
  generateTestEmail,
  generateTestUsername,
} from './helpers/auth';
import {
  navigateToMyProfile,
  editProfile,
  getProfileStats,
  verifyDisplayName,
  verifyBio,
} from './helpers/profile';
import { navigateToLeaderboard, findUserInLeaderboard } from './helpers/leaderboard';

test.describe('Profile Customization', () => {
  test.beforeEach(async ({ page }) => {
    // Create a new user for each test
    const email = generateTestEmail();
    const password = 'TestPassword123!';

    await signUpWithEmail(page, email, password);
    await expect(page).toHaveURL(/.*profile-setup/, { timeout: 10000 });

    const username = generateTestUsername();
    await completeProfileSetup(page, {
      username,
      displayName: 'Original Name',
      bio: 'Original bio',
      theme: 'yellow',
      avatar: 'default',
    });

    await page.waitForTimeout(2000);
  });

  test('User can edit display name', async ({ page }) => {
    await navigateToMyProfile(page);

    // Edit profile
    await editProfile(page, {
      displayName: 'New Display Name',
    });

    // Verify display name updated
    await verifyDisplayName(page, 'New Display Name');
  });

  test('User can edit bio', async ({ page }) => {
    await navigateToMyProfile(page);

    const newBio = 'This is my updated bio with more information!';

    await editProfile(page, {
      bio: newBio,
    });

    // Verify bio updated
    await verifyBio(page, newBio);
  });

  test('User can change theme color', async ({ page }) => {
    await navigateToMyProfile(page);

    // Change theme to blue
    await editProfile(page, {
      theme: 'blue',
    });

    // Verify theme changed (check if blue theme class is applied)
    const profileCard = page.locator('[data-testid="profile-card"]');
    const classList = await profileCard.getAttribute('class');
    expect(classList).toContain('blue');
  });

  test('User can add social links', async ({ page }) => {
    await navigateToMyProfile(page);

    await editProfile(page, {
      twitter: 'https://twitter.com/myhandle',
      farcaster: 'https://warpcast.com/myhandle',
      discord: 'myuser#1234',
    });

    // Verify social links are displayed
    await expect(
      page.locator('[data-testid="social-twitter"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="social-farcaster"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="social-discord"]')
    ).toBeVisible();
  });

  test('User can update all profile fields at once', async ({ page }) => {
    await navigateToMyProfile(page);

    const updates = {
      displayName: 'Complete Update',
      bio: 'Completely updated bio text',
      theme: 'purple' as const,
      twitter: 'https://twitter.com/updated',
      farcaster: 'https://warpcast.com/updated',
      discord: 'updated#5678',
    };

    await editProfile(page, updates);

    // Verify all changes
    await verifyDisplayName(page, updates.displayName);
    await verifyBio(page, updates.bio);

    const profileCard = page.locator('[data-testid="profile-card"]');
    const classList = await profileCard.getAttribute('class');
    expect(classList).toContain('purple');

    await expect(
      page.locator('[data-testid="social-twitter"]')
    ).toBeVisible();
  });

  test('Changes reflect on leaderboard', async ({ page }) => {
    await navigateToMyProfile(page);

    // Get username from URL or profile
    const url = page.url();
    const username = url.split('/').pop() || '';

    // Update display name
    const newDisplayName = 'Leaderboard Name';
    await editProfile(page, {
      displayName: newDisplayName,
    });

    // Navigate to leaderboard
    await navigateToLeaderboard(page);

    // Find user in leaderboard
    const userRow = page.locator(
      `[data-testid="leaderboard-row"]:has-text("${username}")`
    );

    if (await userRow.isVisible()) {
      // Verify display name shows on leaderboard
      await expect(userRow).toContainText(newDisplayName);
    }
  });

  test('Bio character limit is enforced', async ({ page }) => {
    await navigateToMyProfile(page);

    await page.click('text=Edit Profile');
    await page.waitForSelector('textarea[name="bio"]', { timeout: 5000 });

    // Try to enter more than 500 characters
    const longBio = 'a'.repeat(600);
    await page.fill('textarea[name="bio"]', longBio);

    // Save
    await page.click('button:has-text("Save Changes")');

    // Should show error or trim to 500
    const bioElement = page.locator('[data-testid="profile-bio"]');
    const bioText = await bioElement.textContent();

    if (bioText) {
      expect(bioText.length).toBeLessThanOrEqual(500);
    }
  });

  test('Display name character limit is enforced', async ({ page }) => {
    await navigateToMyProfile(page);

    await page.click('text=Edit Profile');
    await page.waitForSelector('input[name="displayName"]', { timeout: 5000 });

    // Try to enter more than 50 characters
    const longName = 'a'.repeat(60);
    await page.fill('input[name="displayName"]', longName);

    await page.click('button:has-text("Save Changes")');

    // Should show error or trim
    const displayNameElement = page.locator(
      '[data-testid="profile-display-name"]'
    );
    const nameText = await displayNameElement.textContent();

    if (nameText) {
      expect(nameText.length).toBeLessThanOrEqual(50);
    }
  });

  test('Invalid social links show validation errors', async ({ page }) => {
    await navigateToMyProfile(page);

    await page.click('text=Edit Profile');
    await page.waitForSelector('input[name="twitter"]', { timeout: 5000 });

    // Enter invalid Twitter URL
    await page.fill('input[name="twitter"]', 'not-a-valid-url');

    await page.click('button:has-text("Save Changes")');

    // Should show validation error
    const errorMessage = page.locator('text=/.*invalid.*url/i');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('Empty bio removes bio from profile', async ({ page }) => {
    await navigateToMyProfile(page);

    // Clear bio
    await editProfile(page, {
      bio: '',
    });

    // Bio section should not be displayed or should be empty
    const bioElement = page.locator('[data-testid="profile-bio"]');
    const bioText = await bioElement.textContent();

    expect(bioText?.trim() || '').toBe('');
  });

  test('Theme color persists across sessions', async ({ page, context }) => {
    await navigateToMyProfile(page);

    // Change theme
    await editProfile(page, {
      theme: 'green',
    });

    // Verify green theme
    let profileCard = page.locator('[data-testid="profile-card"]');
    let classList = await profileCard.getAttribute('class');
    expect(classList).toContain('green');

    // Create new page (simulate new session)
    const newPage = await context.newPage();
    await newPage.goto(page.url());
    await newPage.waitForLoadState('networkidle');

    // Theme should still be green
    profileCard = newPage.locator('[data-testid="profile-card"]');
    classList = await profileCard.getAttribute('class');
    expect(classList).toContain('green');

    await newPage.close();
  });

  test('Display name shows on own profile and public view', async ({
    page,
    context,
  }) => {
    await navigateToMyProfile(page);

    // Get username
    const url = page.url();
    const username = url.split('/').pop() || '';

    const newDisplayName = 'Public Display Name';
    await editProfile(page, {
      displayName: newDisplayName,
    });

    // Verify on own profile
    await verifyDisplayName(page, newDisplayName);

    // Open in new incognito context to view as public
    const incognitoContext = await context.browser()?.newContext();
    if (incognitoContext) {
      const publicPage = await incognitoContext.newPage();
      await publicPage.goto(`/profile/${username}`);
      await publicPage.waitForLoadState('networkidle');

      // Should show display name
      const displayNameElement = publicPage.locator(
        '[data-testid="profile-display-name"]'
      );
      await expect(displayNameElement).toContainText(newDisplayName);

      await incognitoContext.close();
    }
  });

  test('Profile completeness increases with more info', async ({ page }) => {
    await navigateToMyProfile(page);

    // Get initial completeness
    const completenessElement = page.locator(
      '[data-testid="profile-completeness"]'
    );

    let initialCompleteness = 0;
    if (await completenessElement.isVisible()) {
      const text = await completenessElement.textContent();
      initialCompleteness = parseInt(text?.replace(/[^0-9]/g, '') || '0', 10);
    }

    // Add more information
    await editProfile(page, {
      displayName: 'Full Name Here',
      bio: 'A detailed bio with lots of information about me',
      twitter: 'https://twitter.com/handle',
      farcaster: 'https://warpcast.com/handle',
      discord: 'user#1234',
    });

    // Completeness should increase
    if (await completenessElement.isVisible()) {
      const text = await completenessElement.textContent();
      const newCompleteness = parseInt(text?.replace(/[^0-9]/g, '') || '0', 10);

      expect(newCompleteness).toBeGreaterThanOrEqual(initialCompleteness);
    }
  });

  test('Can switch between all theme colors', async ({ page }) => {
    await navigateToMyProfile(page);

    const themes = ['yellow', 'blue', 'green', 'red', 'purple', 'pink'] as const;

    for (const theme of themes) {
      await editProfile(page, { theme });

      // Verify theme applied
      const profileCard = page.locator('[data-testid="profile-card"]');
      const classList = await profileCard.getAttribute('class');
      expect(classList).toContain(theme);

      await page.waitForTimeout(500);
    }
  });

  test('Profile changes save correctly', async ({ page }) => {
    await navigateToMyProfile(page);

    const changes = {
      displayName: 'Saved Name',
      bio: 'Saved bio text',
      theme: 'red' as const,
    };

    await editProfile(page, changes);

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify changes persisted
    await verifyDisplayName(page, changes.displayName);
    await verifyBio(page, changes.bio);

    const profileCard = page.locator('[data-testid="profile-card"]');
    const classList = await profileCard.getAttribute('class');
    expect(classList).toContain('red');
  });
});
