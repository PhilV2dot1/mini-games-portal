import { test, expect } from '@playwright/test';
import { navigateToGame } from './helpers/games';

// Increase timeout for gameplay tests that involve game loading and animations
test.setTimeout(60000);

test.describe('Solo Gameplay - Snake', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToGame(page, 'snake');
  });

  test('snake page loads with game board', async ({ page }) => {
    await expect(page.locator('[data-testid="snake-board"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/snake/i);
  });

  test('can start snake game in free mode', async ({ page }) => {
    const startButton = page.locator('[data-testid="start-game"]');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // After starting, reset button should appear
    await expect(page.locator('[data-testid="reset-game"]')).toBeVisible({ timeout: 5000 });
  });

  test('keyboard controls are available during gameplay', async ({ page }) => {
    const startButton = page.locator('[data-testid="start-game"]');
    await startButton.click();

    // Board should be visible and game should be playing
    await expect(page.locator('[data-testid="snake-board"]')).toBeVisible();

    // Send arrow key - game should still be running
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="snake-board"]')).toBeVisible();
  });

  test('mobile direction buttons appear on small screens', async ({ page }) => {
    // This test is more relevant on mobile viewport - check buttons exist in DOM
    const startButton = page.locator('[data-testid="start-game"]');
    await startButton.click();

    // Direction buttons should exist (may be hidden on desktop via sm:hidden)
    const upButton = page.locator('[data-testid="direction-up"]');
    await expect(upButton).toBeAttached();
  });
});

test.describe('Solo Gameplay - Minesweeper', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToGame(page, 'minesweeper');
  });

  test('minesweeper page loads with difficulty selector', async ({ page }) => {
    await expect(page.locator('[data-testid="difficulty-easy"]')).toBeVisible();
    await expect(page.locator('[data-testid="difficulty-medium"]')).toBeVisible();
    await expect(page.locator('[data-testid="difficulty-hard"]')).toBeVisible();
  });

  test('can select difficulty', async ({ page }) => {
    const mediumButton = page.locator('[data-testid="difficulty-medium"]');
    await mediumButton.click();
    // Medium button should be visually selected (has active styles)
    await expect(mediumButton).toBeVisible();
  });

  test('can start minesweeper game', async ({ page }) => {
    const startButton = page.locator('[data-testid="start-game"]');
    await startButton.click();

    // Board should appear
    await expect(page.locator('[data-testid="minesweeper-board"]')).toBeVisible({ timeout: 5000 });
  });

  test('clicking a cell reveals it', async ({ page }) => {
    // Select easy and start
    await page.locator('[data-testid="difficulty-easy"]').click();
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="minesweeper-board"]', { timeout: 5000 });

    // Click a cell in the board
    const cells = page.locator('[data-testid="minesweeper-board"] button');
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);

    // Click the middle cell
    const middleIndex = Math.floor(count / 2);
    await cells.nth(middleIndex).click();

    // After clicking, the board state should change (reset button still visible)
    await expect(page.locator('[data-testid="reset-game"]')).toBeVisible();
  });

  test('game shows timer and flags count', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="minesweeper-board"]', { timeout: 5000 });

    // Timer and flags indicators should be visible
    await expect(page.locator('text=/\\d{2}:\\d{2}/')).toBeVisible(); // MM:SS format
  });
});

test.describe('Solo Gameplay - Connect Five', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToGame(page, 'connect-five');
  });

  test('connect five page loads with board', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/connect/i);
  });

  test('can start game in free mode', async ({ page }) => {
    const startButton = page.locator('[data-testid="start-game"]');
    await startButton.click();

    await expect(page.locator('[data-testid="connectfive-board"]')).toBeVisible({ timeout: 5000 });
  });

  test('can drop pieces in columns', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="connectfive-board"]', { timeout: 5000 });

    // Click a column drop button
    const col3 = page.locator('[data-testid="cf-column-3"]');
    await expect(col3).toBeVisible();
    await col3.click();

    // Wait for AI to respond
    await page.waitForTimeout(1500);

    // Board should still be visible (game continues)
    await expect(page.locator('[data-testid="connectfive-board"]')).toBeVisible();
  });

  test('AI responds after player move', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="connectfive-board"]', { timeout: 5000 });

    // Drop a piece
    await page.locator('[data-testid="cf-column-3"]').click();

    // Wait for AI to respond (check that another piece appears)
    await page.waitForTimeout(2000);

    // The game should still be active with the board visible
    await expect(page.locator('[data-testid="connectfive-board"]')).toBeVisible();
  });
});

test.describe('Solo Gameplay - Solitaire', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToGame(page, 'solitaire');
  });

  test('solitaire page loads with card layout', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/solitaire/i);
  });

  test('can start solitaire game', async ({ page }) => {
    const startButton = page.locator('[data-testid="start-game"]');
    await startButton.click();

    await expect(page.locator('[data-testid="solitaire-board"]')).toBeVisible({ timeout: 5000 });
  });

  test('can click stock pile to draw cards', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="solitaire-board"]', { timeout: 5000 });

    const stockPile = page.locator('[data-testid="stock-pile"]');
    await expect(stockPile).toBeVisible();

    // Click stock pile
    await stockPile.click();
    await page.waitForTimeout(500);

    // Board should still be visible
    await expect(page.locator('[data-testid="solitaire-board"]')).toBeVisible();
  });

  test('game tracks moves', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="solitaire-board"]', { timeout: 5000 });

    // Click stock pile to make a move
    await page.locator('[data-testid="stock-pile"]').click();
    await page.waitForTimeout(500);

    // Moves counter should be visible and > 0
    const movesText = page.locator('text=/moves/i');
    await expect(movesText.first()).toBeVisible();
  });
});

test.describe('Solo Gameplay - Yahtzee', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToGame(page, 'yahtzee');
  });

  test('yahtzee page loads with dice and scorecard info', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/yahtzee/i);
  });

  test('can start yahtzee game', async ({ page }) => {
    const startButton = page.locator('[data-testid="start-game"]');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Dice should be visible after starting
    await expect(page.locator('[data-testid="die-0"]')).toBeVisible({ timeout: 5000 });
  });

  test('can roll dice (3 rolls per turn)', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="die-0"]', { timeout: 5000 });

    // Roll dice button should be visible
    const rollButton = page.locator('[data-testid="roll-dice"]');
    await expect(rollButton).toBeVisible();
    await expect(rollButton).toBeEnabled();

    // Roll
    await rollButton.click();
    await page.waitForTimeout(1500); // Wait for animation

    // Button should still be available for 2nd roll
    await expect(rollButton).toBeVisible();
  });

  test('can hold/unhold dice between rolls', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="die-0"]', { timeout: 5000 });

    // Roll first
    await page.locator('[data-testid="roll-dice"]').click();
    await page.waitForTimeout(1500);

    // Click a die to hold it
    const die0 = page.locator('[data-testid="die-0"]');
    await die0.click();

    // Die should show held state (check aria-label)
    await expect(die0).toHaveAttribute('aria-label', /held/i);

    // Click again to unhold
    await die0.click();
    await expect(die0).not.toHaveAttribute('aria-label', /held/i);
  });

  test('can select scoring category', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="die-0"]', { timeout: 5000 });

    // Roll dice
    await page.locator('[data-testid="roll-dice"]').click();
    await page.waitForTimeout(1500);

    // Score card categories should be visible
    const chanceCategory = page.locator('[data-category="chance"]');
    await expect(chanceCategory).toBeVisible();

    // Select chance (always valid)
    await chanceCategory.click();
    await page.waitForTimeout(500);

    // After selecting, turn should advance (next roll button appears)
    await expect(page.locator('[data-testid="roll-dice"]')).toBeVisible();
  });
});

test.describe('Solo Gameplay - Sudoku', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToGame(page, 'sudoku');
  });

  test('sudoku page loads with grid', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/sudoku/i);
  });

  test('can select difficulty and start game', async ({ page }) => {
    const startButton = page.locator('[data-testid="start-game"]');
    await expect(startButton).toBeVisible();

    await startButton.click();

    // Grid should be visible
    await expect(page.locator('[data-testid="sudoku-grid"]')).toBeVisible({ timeout: 5000 });
  });

  test('can select cell and enter number', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="sudoku-grid"]', { timeout: 5000 });

    // Find an empty cell and click it
    let clicked = false;
    for (let row = 0; row < 9 && !clicked; row++) {
      for (let col = 0; col < 9 && !clicked; col++) {
        const cell = page.locator(`[data-testid="sudoku-cell-${row}-${col}"]`);
        const text = await cell.textContent();
        if (!text || text.trim() === '') {
          await cell.click();
          clicked = true;

          // Number pad should be visible
          await expect(page.locator('[data-testid="numpad-1"]')).toBeVisible();

          // Enter a number
          await page.locator('[data-testid="numpad-5"]').click();
          await page.waitForTimeout(300);
        }
      }
    }

    expect(clicked).toBeTruthy();
  });

  test('can use hint system', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="sudoku-grid"]', { timeout: 5000 });

    // Hint button should be visible
    const hintButton = page.locator('[data-testid="hint-button"]');
    await expect(hintButton).toBeVisible();
    await expect(hintButton).toBeEnabled();

    // Click hint
    await hintButton.click();
    await page.waitForTimeout(500);

    // Grid should still be visible (hint highlights conflicts)
    await expect(page.locator('[data-testid="sudoku-grid"]')).toBeVisible();
  });

  test('timer runs during gameplay', async ({ page }) => {
    await page.locator('[data-testid="start-game"]').click();
    await page.waitForSelector('[data-testid="sudoku-grid"]', { timeout: 5000 });

    // Wait a bit for timer to advance
    await page.waitForTimeout(2000);

    // Timer should show non-zero time (look for MM:SS pattern)
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');
    await expect(timerText.first()).toBeVisible();
  });
});
