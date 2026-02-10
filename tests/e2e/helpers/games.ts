import { Page, expect } from '@playwright/test';

// All game IDs with their route mapping
type AllGameId =
  | 'blackjack' | 'rps' | 'tictactoe' | 'jackpot' | '2048' | 'mastermind'
  | 'snake' | 'minesweeper' | 'connect-five' | 'solitaire' | 'yahtzee' | 'sudoku';

const GAME_ROUTES: Record<AllGameId, string> = {
  blackjack: '/blackjack',
  rps: '/rps',
  tictactoe: '/tictactoe',
  jackpot: '/jackpot',
  '2048': '/2048',
  mastermind: '/mastermind',
  snake: '/games/snake',
  minesweeper: '/games/minesweeper',
  'connect-five': '/games/connect-five',
  solitaire: '/games/solitaire',
  yahtzee: '/games/yahtzee',
  sudoku: '/games/sudoku',
};

/**
 * Wait for the app loading screen (Farcaster SDK init) to disappear.
 * Uses a robust approach: wait for loading to be hidden OR for page content to appear.
 */
export async function waitForAppReady(page: Page) {
  // Wait until the loading indicator is gone (hidden or detached)
  // This handles both: page where loading shows then disappears, and page already loaded
  await page.waitForFunction(() => {
    const el = document.querySelector('body');
    if (!el) return false;
    // Check if loading screen text is NOT present or NOT visible
    const loadingText = document.body.innerText;
    return !loadingText.includes('Initializing Mini Games Portal');
  }, { timeout: 30000 });
}

/**
 * Navigate to a specific game
 */
export async function navigateToGame(page: Page, gameId: AllGameId) {
  await page.goto(GAME_ROUTES[gameId]);
  await page.waitForLoadState('domcontentloaded');
  await waitForAppReady(page);
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
 * Play Snake game (free mode) - start and let it run briefly
 */
export async function playSnakeFree(page: Page) {
  await navigateToGame(page, 'snake');

  // Click start game
  const startButton = page.locator('[data-testid="start-game"]');
  await startButton.click();

  // Wait for snake board to be visible
  await page.waitForSelector('[data-testid="snake-board"]', { timeout: 5000 });

  // Make a few moves via keyboard
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);

  // Wait for game to end naturally or timeout
  // Snake can die quickly if it runs into a wall
  await page.waitForTimeout(3000);
}

/**
 * Play Minesweeper game (free mode) - start and click some cells
 */
export async function playMinesweeperFree(page: Page) {
  await navigateToGame(page, 'minesweeper');

  // Select easy difficulty
  const easyButton = page.locator('[data-testid="difficulty-easy"]');
  if (await easyButton.isVisible()) {
    await easyButton.click();
  }

  // Click start game
  const startButton = page.locator('[data-testid="start-game"]');
  await startButton.click();

  // Wait for board to be visible
  await page.waitForSelector('[data-testid="minesweeper-board"]', { timeout: 5000 });

  // Click a few cells (center of easy board to increase odds of not hitting mine)
  const cells = page.locator('[data-testid="minesweeper-board"] button');
  const count = await cells.count();
  if (count > 0) {
    // Click the middle cell first (safer on easy boards)
    const middleIndex = Math.floor(count / 2);
    await cells.nth(middleIndex).click();
    await page.waitForTimeout(500);
  }
}

/**
 * Play Connect Five game (free mode) - start and drop a piece
 */
export async function playConnectFiveFree(page: Page) {
  await navigateToGame(page, 'connect-five');

  // Click start game
  const startButton = page.locator('[data-testid="start-game"]');
  await startButton.click();

  // Wait for board to be visible
  await page.waitForSelector('[data-testid="connectfive-board"]', { timeout: 5000 });

  // Drop a piece in column 3 (middle-ish)
  const col3 = page.locator('[data-testid="cf-column-3"]');
  if (await col3.isVisible()) {
    await col3.click();
    await page.waitForTimeout(1000); // Wait for AI response
  }

  // Drop another piece
  const col4 = page.locator('[data-testid="cf-column-4"]');
  if (await col4.isVisible()) {
    await col4.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Play Solitaire game (free mode) - start and click stock pile
 */
export async function playSolitaireFree(page: Page) {
  await navigateToGame(page, 'solitaire');

  // Click start game
  const startButton = page.locator('[data-testid="start-game"]');
  await startButton.click();

  // Wait for board to be visible
  await page.waitForSelector('[data-testid="solitaire-board"]', { timeout: 5000 });

  // Click stock pile a few times
  const stockPile = page.locator('[data-testid="stock-pile"]');
  if (await stockPile.isVisible()) {
    await stockPile.click();
    await page.waitForTimeout(500);
    await stockPile.click();
    await page.waitForTimeout(500);
    await stockPile.click();
  }
}

/**
 * Play Yahtzee game (free mode) - start, roll, select a category
 */
export async function playYahtzeeFree(page: Page) {
  await navigateToGame(page, 'yahtzee');

  // Click start game
  const startButton = page.locator('[data-testid="start-game"]');
  await startButton.click();

  // Wait for dice to be visible
  await page.waitForSelector('[data-testid="die-0"]', { timeout: 5000 });

  // Roll dice
  const rollButton = page.locator('[data-testid="roll-dice"]');
  await rollButton.click();
  await page.waitForTimeout(1500); // Wait for roll animation

  // Hold first die
  const die0 = page.locator('[data-testid="die-0"]');
  await die0.click();

  // Roll again
  if (await rollButton.isEnabled()) {
    await rollButton.click();
    await page.waitForTimeout(1500);
  }

  // Select "chance" category (always available, accepts any dice combo)
  const chanceCategory = page.locator('[data-category="chance"]');
  if (await chanceCategory.isVisible()) {
    await chanceCategory.click();
  }
}

/**
 * Play Sudoku game (free mode) - start, select a cell, enter a number
 */
export async function playSudokuFree(page: Page) {
  await navigateToGame(page, 'sudoku');

  // Click start game
  const startButton = page.locator('[data-testid="start-game"]');
  await startButton.click();

  // Wait for grid to be visible
  await page.waitForSelector('[data-testid="sudoku-grid"]', { timeout: 5000 });

  // Find and click an empty cell (try a few positions)
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = page.locator(`[data-testid="sudoku-cell-${row}-${col}"]`);
      const text = await cell.textContent();
      if (!text || text.trim() === '') {
        await cell.click();
        await page.waitForTimeout(300);

        // Enter a number via numpad
        const numpad1 = page.locator('[data-testid="numpad-1"]');
        if (await numpad1.isVisible()) {
          await numpad1.click();
        }
        return; // Done - we placed one number
      }
    }
  }
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
  gameType: AllGameId = 'blackjack'
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
      case 'snake':
        await playSnakeFree(page);
        break;
      case 'minesweeper':
        await playMinesweeperFree(page);
        break;
      case 'connect-five':
        await playConnectFiveFree(page);
        break;
      case 'solitaire':
        await playSolitaireFree(page);
        break;
      case 'yahtzee':
        await playYahtzeeFree(page);
        break;
      case 'sudoku':
        await playSudokuFree(page);
        break;
    }

    // Small delay between games
    await page.waitForTimeout(1000);
  }
}
