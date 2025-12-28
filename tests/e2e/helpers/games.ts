import { Page, expect } from '@playwright/test';

/**
 * Navigate to a specific game
 */
export async function navigateToGame(
  page: Page,
  gameId: 'blackjack' | 'rps' | 'tictactoe' | 'jackpot' | '2048' | 'mastermind'
) {
  await page.goto(`/${gameId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Play a Blackjack game (free mode)
 */
export async function playBlackjackFree(page: Page) {
  await navigateToGame(page, 'blackjack');

  // Ensure in free mode
  const freeModeButton = page.locator('[data-testid="mode-free"]');
  if (await freeModeButton.isVisible()) {
    await freeModeButton.click();
  }

  // Start new game
  await page.click('button:has-text("New Game")');
  await page.waitForSelector('[data-testid="player-hand"]', { timeout: 5000 });

  // Stand immediately to finish quickly
  await page.click('button:has-text("Stand")');

  // Wait for result
  await page.waitForSelector('[data-testid="game-result"]', { timeout: 10000 });
}

/**
 * Play Rock Paper Scissors game (free mode)
 */
export async function playRockPaperScissorsFree(
  page: Page,
  choice: 'rock' | 'paper' | 'scissors' = 'rock'
) {
  await navigateToGame(page, 'rps');

  // Ensure in free mode
  const freeModeButton = page.locator('[data-testid="mode-free"]');
  if (await freeModeButton.isVisible()) {
    await freeModeButton.click();
  }

  // Make choice
  await page.click(`button[data-choice="${choice}"]`);

  // Wait for result
  await page.waitForSelector('[data-testid="game-result"]', { timeout: 10000 });
}

/**
 * Play Tic Tac Toe game (free mode)
 */
export async function playTicTacToeFree(page: Page) {
  await navigateToGame(page, 'tictactoe');

  // Ensure in free mode
  const freeModeButton = page.locator('[data-testid="mode-free"]');
  if (await freeModeButton.isVisible()) {
    await freeModeButton.click();
  }

  // Start new game
  await page.click('button:has-text("New Game")');

  // Make a move (click first available cell)
  await page.click('[data-testid="cell-0"]');

  // Wait a bit for AI to move and continue until game ends
  let gameEnded = false;
  let moves = 0;
  const maxMoves = 9;

  while (!gameEnded && moves < maxMoves) {
    // Check if game ended
    const resultVisible = await page
      .locator('[data-testid="game-result"]')
      .isVisible();
    if (resultVisible) {
      gameEnded = true;
      break;
    }

    // Try to click next available cell
    for (let i = 0; i < 9; i++) {
      const cell = page.locator(`[data-testid="cell-${i}"]`);
      const isEmpty = await cell.textContent().then((text) => !text || text.trim() === '');

      if (isEmpty) {
        await cell.click();
        moves++;
        await page.waitForTimeout(500); // Wait for AI move
        break;
      }
    }
  }

  // Wait for result
  await page.waitForSelector('[data-testid="game-result"]', { timeout: 10000 });
}

/**
 * Play 2048 game (free mode) - just start and make a few moves
 */
export async function play2048Free(page: Page) {
  await navigateToGame(page, '2048');

  // Ensure in free mode
  const freeModeButton = page.locator('[data-testid="mode-free"]');
  if (await freeModeButton.isVisible()) {
    await freeModeButton.click();
  }

  // Start new game if needed
  const newGameButton = page.locator('button:has-text("New Game")');
  if (await newGameButton.isVisible()) {
    await newGameButton.click();
  }

  // Make a few moves (use arrow keys)
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowRight');

  // Give up to record the session
  const giveUpButton = page.locator('button:has-text("Give Up")');
  if (await giveUpButton.isVisible()) {
    await giveUpButton.click();
    // Confirm if needed
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }
}

/**
 * Play Mastermind game (free mode) - make a random guess
 */
export async function playMastermindFree(page: Page) {
  await navigateToGame(page, 'mastermind');

  // Ensure in free mode
  const freeModeButton = page.locator('[data-testid="mode-free"]');
  if (await freeModeButton.isVisible()) {
    await freeModeButton.click();
  }

  // Start new game if needed
  const newGameButton = page.locator('button:has-text("New Game")');
  if (await newGameButton.isVisible()) {
    await newGameButton.click();
  }

  // Make a guess by clicking 4 color buttons
  const colors = ['btc', 'eth', 'avax', 'celo'];
  for (let i = 0; i < 4; i++) {
    const colorButton = page.locator(`[data-testid="color-${colors[i]}"]`);
    if (await colorButton.isVisible()) {
      await colorButton.click();
    }
  }

  // Submit guess
  const submitButton = page.locator('button:has-text("Submit Guess")');
  if (await submitButton.isVisible()) {
    await submitButton.click();
  }

  // Give up after one guess to record session
  const giveUpButton = page.locator('button:has-text("Give Up")');
  if (await giveUpButton.isVisible()) {
    await giveUpButton.click();
    // Confirm if needed
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }
}

/**
 * Play Jackpot game (free mode)
 */
export async function playJackpotFree(page: Page) {
  await navigateToGame(page, 'jackpot');

  // Ensure in free mode
  const freeModeButton = page.locator('[data-testid="mode-free"]');
  if (await freeModeButton.isVisible()) {
    await freeModeButton.click();
  }

  // Spin
  await page.click('button:has-text("Spin")');

  // Wait for result
  await page.waitForSelector('[data-testid="game-result"]', { timeout: 10000 });
}

/**
 * Get current points from header or profile
 */
export async function getCurrentPoints(page: Page): Promise<number> {
  const pointsText = await page
    .locator('[data-testid="total-points"]')
    .first()
    .textContent();

  if (!pointsText) return 0;

  // Extract number from text (e.g., "1,234 pts" -> 1234)
  const points = pointsText.replace(/[^0-9]/g, '');
  return parseInt(points, 10) || 0;
}

/**
 * Verify game result is displayed
 */
export async function verifyGameResultDisplayed(page: Page) {
  const result = page.locator('[data-testid="game-result"]');
  await expect(result).toBeVisible({ timeout: 10000 });
}

/**
 * Get game result (win/lose/draw/push)
 */
export async function getGameResult(page: Page): Promise<string> {
  const resultElement = page.locator('[data-testid="game-result"]');
  const resultText = await resultElement.textContent();

  if (!resultText) return 'unknown';

  const lowerResult = resultText.toLowerCase();
  if (lowerResult.includes('win') || lowerResult.includes('won')) return 'win';
  if (lowerResult.includes('lose') || lowerResult.includes('lost')) return 'lose';
  if (lowerResult.includes('draw') || lowerResult.includes('tie')) return 'draw';
  if (lowerResult.includes('push')) return 'push';

  return 'unknown';
}

/**
 * Play multiple games to earn a badge
 */
export async function playMultipleGames(
  page: Page,
  count: number,
  gameType: 'blackjack' | 'rps' | 'tictactoe' | 'jackpot' | '2048' | 'mastermind' = 'blackjack'
) {
  for (let i = 0; i < count; i++) {
    switch (gameType) {
      case 'blackjack':
        await playBlackjackFree(page);
        break;
      case 'rps':
        await playRockPaperScissorsFree(page);
        break;
      case 'tictactoe':
        await playTicTacToeFree(page);
        break;
      case 'jackpot':
        await playJackpotFree(page);
        break;
      case '2048':
        await play2048Free(page);
        break;
      case 'mastermind':
        await playMastermindFree(page);
        break;
    }

    // Small delay between games
    await page.waitForTimeout(1000);
  }
}
