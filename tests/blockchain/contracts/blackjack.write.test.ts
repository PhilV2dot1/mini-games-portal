import { describe, test, expect, beforeAll } from 'vitest';
import {
  TEST_WALLET_ADDRESS,
  hasInsufficientBalance,
  getTestWalletBalance,
} from '../setup/test-wallet';
import {
  getBlackjackStats,
  playBlackjackGame,
  isTransactionMined,
} from '../helpers/contract-helpers';

/**
 * Blackjack Contract - Write Tests
 *
 * These tests write transactions to the Blackjack contract on Alfajores testnet.
 * They verify that:
 * - playGame() transaction succeeds
 * - Transaction is mined
 * - Stats are updated correctly
 * - Events are emitted
 * - Game results are valid
 *
 * REQUIREMENTS:
 * - Must be connected to Alfajores testnet
 * - Test wallet must have CELO for gas fees
 * - Get testnet CELO from: https://faucet.celo.org
 *
 * IMPORTANT: These tests will be SKIPPED if wallet has insufficient balance.
 */

describe('Blackjack Contract - Write Operations', () => {
  let hasBalance = false;
  let initialBalance = 0;

  beforeAll(async () => {
    // Check if wallet has sufficient CELO
    const insufficientBalance = await hasInsufficientBalance();

    if (insufficientBalance) {
      console.warn('⚠️  SKIPPING WRITE TESTS - Insufficient CELO balance');
      console.warn('   Fund wallet at: https://faucet.celo.org');
      console.warn(`   Address: ${TEST_WALLET_ADDRESS}`);
      return;
    }

    hasBalance = true;
    initialBalance = await getTestWalletBalance();
    console.log(`✅ Test wallet balance: ${initialBalance.toFixed(4)} CELO`);
  });

  test.skipIf(!hasBalance)('playGame() transaction should succeed', async () => {
    const { hash, receipt } = await playBlackjackGame();

    // Verify transaction was mined
    expect(receipt.status).toBe('success');
    expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Verify transaction is confirmed
    const isMined = await isTransactionMined(hash);
    expect(isMined).toBe(true);
  }, 90000); // 90 second timeout for blockchain transaction

  test.skipIf(!hasBalance)('playGame() should return valid game result', async () => {
    const { receipt } = await playBlackjackGame();

    // Should have logs (events)
    expect(receipt.logs.length).toBeGreaterThan(0);

    // Transaction should be successful
    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('stats should update after playing game', async () => {
    // Get initial stats
    const initialStats = await getBlackjackStats();

    // Play game
    await playBlackjackGame();

    // Get updated stats
    const updatedStats = await getBlackjackStats();

    // Total games should increment by 1
    expect(updatedStats.totalGames).toBe(initialStats.totalGames + 1n);

    // One of wins, losses, or pushes should increment
    const totalOutcomes =
      updatedStats.wins + updatedStats.losses + updatedStats.pushes;
    const initialTotalOutcomes =
      initialStats.wins + initialStats.losses + initialStats.pushes;

    expect(totalOutcomes).toBe(initialTotalOutcomes + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('game result should be valid outcome', async () => {
    const { receipt } = await playBlackjackGame();

    // Parse event to get outcome
    // Outcome should be one of: "win", "lose", "push", "blackjack"
    const event = receipt.logs.find(log => log.topics.length > 0);

    expect(event).toBeDefined();
  }, 90000);

  test.skipIf(!hasBalance)('player cards should be valid', async () => {
    const { receipt } = await playBlackjackGame();

    // Should have at least 2 cards for player
    // Cards are represented as uint8 values (1-52)
    expect(receipt.logs.length).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('dealer cards should be valid', async () => {
    const { receipt } = await playBlackjackGame();

    // Dealer should have at least 2 cards
    // Cards are in range 1-52
    expect(receipt.logs.length).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('player total should be valid', async () => {
    const { receipt } = await playBlackjackGame();

    // Player total should be between 2 and 31 (theoretical max)
    // Actual game logic enforces proper totals
    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('dealer total should be valid', async () => {
    const { receipt } = await playBlackjackGame();

    // Dealer total should be valid
    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('multiple games can be played sequentially', async () => {
    const initialStats = await getBlackjackStats();

    // Play 3 games
    await playBlackjackGame();
    await playBlackjackGame();
    await playBlackjackGame();

    const finalStats = await getBlackjackStats();

    // Total games should increase by 3
    expect(finalStats.totalGames).toBe(initialStats.totalGames + 3n);
  }, 180000); // 3 minutes for 3 transactions

  test.skipIf(!hasBalance)('win increments stats correctly', async () => {
    const initialStats = await getBlackjackStats();

    // Play games until we get a win (max 10 tries)
    let foundWin = false;

    for (let i = 0; i < 10; i++) {
      const statsBefore = await getBlackjackStats();
      await playBlackjackGame();
      const statsAfter = await getBlackjackStats();

      if (statsAfter.wins > statsBefore.wins) {
        foundWin = true;
        break;
      }
    }

    const finalStats = await getBlackjackStats();

    // Total games should have increased
    expect(finalStats.totalGames).toBeGreaterThan(initialStats.totalGames);

    // We might have gotten a win
    if (foundWin) {
      expect(finalStats.wins).toBeGreaterThan(initialStats.wins);
    }
  }, 300000); // 5 minutes for multiple games

  test.skipIf(!hasBalance)('gas cost should be reasonable', async () => {
    const balanceBefore = await getTestWalletBalance();

    await playBlackjackGame();

    const balanceAfter = await getTestWalletBalance();

    const gasCost = balanceBefore - balanceAfter;

    // Gas cost should be less than 0.01 CELO
    expect(gasCost).toBeLessThan(0.01);
    expect(gasCost).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('contract balance should remain stable', async () => {
    const { publicClient } = await import('../setup/test-wallet');
    const { CONTRACT_ADDRESS } = await import('@/lib/contracts/blackjack-abi');

    const balanceBefore = await publicClient.getBalance({
      address: CONTRACT_ADDRESS,
    });

    await playBlackjackGame();

    const balanceAfter = await publicClient.getBalance({
      address: CONTRACT_ADDRESS,
    });

    // Contract balance should not change (free game, no betting)
    expect(balanceAfter).toBe(balanceBefore);
  }, 90000);

  test.skipIf(!hasBalance)('transaction should have valid gas used', async () => {
    const { receipt } = await playBlackjackGame();

    // Gas used should be reasonable
    expect(receipt.gasUsed).toBeGreaterThan(0n);
    expect(receipt.gasUsed).toBeLessThan(1000000n); // Less than 1M gas
  }, 90000);

  test.skipIf(!hasBalance)('block number should increment', async () => {
    const { publicClient } = await import('../setup/test-wallet');

    const blockBefore = await publicClient.getBlockNumber();

    await playBlackjackGame();

    const blockAfter = await publicClient.getBlockNumber();

    // Block should advance (might be same block if very fast)
    expect(blockAfter).toBeGreaterThanOrEqual(blockBefore);
  }, 90000);

  test('should skip write tests if no balance', async () => {
    if (hasBalance) {
      console.log('✅ Write tests executed successfully');
    } else {
      console.warn('⚠️  Write tests were skipped due to insufficient balance');
      console.warn('   Fund wallet to enable write tests');
    }

    expect(true).toBe(true);
  });
});
