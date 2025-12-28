import { Page } from '@playwright/test';

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/');
  await page.click('text=Get Started');
  await page.waitForURL(/.*sign-up/);

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect after signup
  await page.waitForURL(/.*/, { timeout: 10000 });
}

/**
 * Sign in an existing user
 */
export async function signInWithEmail(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/');
  await page.click('text=Sign In');
  await page.waitForURL(/.*sign-in/);

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect after signin
  await page.waitForURL(/.*/, { timeout: 10000 });
}

/**
 * Sign out the current user
 */
export async function signOut(page: Page) {
  // Click on user menu
  await page.click('[data-testid="user-menu-button"]');

  // Click sign out
  await page.click('text=Sign Out');

  // Wait for redirect to home
  await page.waitForURL('/');
}

/**
 * Complete profile setup
 */
export async function completeProfileSetup(
  page: Page,
  options: {
    username?: string;
    displayName?: string;
    bio?: string;
    theme?: 'yellow' | 'blue' | 'green' | 'red' | 'purple' | 'pink';
    avatar?: 'default' | 'predefined';
  } = {}
) {
  const {
    username = `user${Date.now()}`,
    displayName,
    bio,
    theme = 'yellow',
    avatar = 'default',
  } = options;

  // Should be on profile setup page
  await page.waitForURL(/.*profile-setup/);

  // Fill username
  await page.fill('input[name="username"]', username);

  // Fill display name if provided
  if (displayName) {
    await page.fill('input[name="displayName"]', displayName);
  }

  // Fill bio if provided
  if (bio) {
    await page.fill('textarea[name="bio"]', bio);
  }

  // Select theme
  await page.click(`[data-testid="theme-${theme}"]`);

  // Select avatar type
  if (avatar === 'default') {
    await page.click('[data-testid="avatar-default"]');
  } else {
    await page.click('[data-testid="avatar-predefined"]');
    // Select first predefined avatar
    await page.click('[data-testid="predefined-avatar-0"]');
  }

  // Save profile
  await page.click('button:has-text("Save Profile")');

  // Wait for redirect
  await page.waitForURL(/.*/, { timeout: 10000 });

  return { username, displayName, bio, theme, avatar };
}

/**
 * Generate unique test email
 */
export function generateTestEmail(): string {
  return `test${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
}

/**
 * Generate unique test username
 */
export function generateTestUsername(): string {
  return `player${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
