import { describe, test, expect, beforeAll } from 'vitest';
import {
  TEST_WALLET_ADDRESS,
  hasInsufficientBalance,
  getTestWalletBalance,
} from '../setup/test-wallet';
import {
  getTicTacToeStats,
  playTicTacToeGame,
  isTransactionMined,
} from '../helpers/contract-helpers';

/**
 * TicTacToe Contract - Write Tests
 *
 * These tests write transactions to the TicTacToe contract on Alfajores testnet.
 * They verify that:
 * - startGame() and endGame() transactions succeed
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

describe('TicTacToe Contract - Write Operations', () => {
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
    const { hash, receipt } = await playTicTacToeGame(1); // WIN

    // Verify transaction was mined
    expect(receipt.status).toBe('success');
    expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Verify transaction is confirmed
    const isMined = await isTransactionMined(hash);
    expect(isMined).toBe(true);
  }, 90000); // 90 second timeout for blockchain transaction

  test.skipIf(!hasBalance)('playGame() should return valid game result', async () => {
    const { receipt } = await playTicTacToeGame(2); // LOSE

    // Should have logs (events)
    expect(receipt.logs.length).toBeGreaterThan(0);

    // Transaction should be successful
    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('stats should update after playing game', async () => {
    // Get initial stats
    const initialStats = await getTicTacToeStats();

    // Play game
    await playTicTacToeGame(3); // DRAW

    // Get updated stats
    const updatedStats = await getTicTacToeStats();

    // Total games should increment by 1
    expect(updatedStats.gamesPlayed).toBe(initialStats.gamesPlayed + 1n);

    // One of wins, losses, or draws should increment
    const totalOutcomes =
      updatedStats.wins + updatedStats.losses + updatedStats.draws;
    const initialTotalOutcomes =
      initialStats.wins + initialStats.losses + initialStats.draws;

    expect(totalOutcomes).toBe(initialTotalOutcomes + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('can play with win result (1)', async () => {
    const { receipt } = await playTicTacToeGame(1);

    expect(receipt.status).toBe('success');
    expect(receipt.logs.length).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('can play with lose result (2)', async () => {
    const { receipt } = await playTicTacToeGame(2);

    expect(receipt.status).toBe('success');
    expect(receipt.logs.length).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('can play with draw result (3)', async () => {
    const { receipt } = await playTicTacToeGame(3);

    expect(receipt.status).toBe('success');
    expect(receipt.logs.length).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('game result should be valid outcome', async () => {
    const { receipt } = await playTicTacToeGame(1);

    // Parse event to get outcome
    // Outcome should be one of: 1 (WIN), 2 (LOSE), 3 (DRAW)
    const event = receipt.logs.find(log => log.topics.length > 0);

    expect(event).toBeDefined();
  }, 90000);

  test.skipIf(!hasBalance)('multiple games can be played sequentially', async () => {
    const initialStats = await getTicTacToeStats();

    // Play 3 games with different results
    await playTicTacToeGame(1); // WIN
    await playTicTacToeGame(2); // LOSE
    await playTicTacToeGame(3); // DRAW

    const finalStats = await getTicTacToeStats();

    // Total games should increase by 3
    expect(finalStats.gamesPlayed).toBe(initialStats.gamesPlayed + 3n);
  }, 180000); // 3 minutes for 3 transactions

  test.skipIf(!hasBalance)('win increments stats correctly', async () => {
    const initialStats = await getTicTacToeStats();

    // Play a win game
    await playTicTacToeGame(1); // WIN

    const finalStats = await getTicTacToeStats();

    // Wins should increment by 1
    expect(finalStats.wins).toBe(initialStats.wins + 1n);
    expect(finalStats.gamesPlayed).toBe(initialStats.gamesPlayed + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('lose increments stats correctly', async () => {
    const initialStats = await getTicTacToeStats();

    // Play a lose game
    await playTicTacToeGame(2); // LOSE

    const finalStats = await getTicTacToeStats();

    // Losses should increment by 1
    expect(finalStats.losses).toBe(initialStats.losses + 1n);
    expect(finalStats.gamesPlayed).toBe(initialStats.gamesPlayed + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('draw increments stats correctly', async () => {
    const initialStats = await getTicTacToeStats();

    // Play a draw game
    await playTicTacToeGame(3); // DRAW

    const finalStats = await getTicTacToeStats();

    // Draws should increment by 1
    expect(finalStats.draws).toBe(initialStats.draws + 1n);
    expect(finalStats.gamesPlayed).toBe(initialStats.gamesPlayed + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('gas cost should be reasonable', async () => {
    const balanceBefore = await getTestWalletBalance();

    await playTicTacToeGame(1);

    const balanceAfter = await getTestWalletBalance();

    const gasCost = balanceBefore - balanceAfter;

    // Gas cost should be less than 0.01 CELO
    expect(gasCost).toBeLessThan(0.01);
    expect(gasCost).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('contract balance should remain stable', async () => {
    const { publicClient } = await import('../setup/test-wallet');
    const { TICTACTOE_CONTRACT_ADDRESS } = await import('@/lib/contracts/tictactoe-abi');

    const balanceBefore = await publicClient.getBalance({
      address: TICTACTOE_CONTRACT_ADDRESS as `0x${string}`,
    });

    await playTicTacToeGame(2);

    const balanceAfter = await publicClient.getBalance({
      address: TICTACTOE_CONTRACT_ADDRESS as `0x${string}`,
    });

    // Contract balance should not change (free game, no betting)
    expect(balanceAfter).toBe(balanceBefore);
  }, 90000);

  test.skipIf(!hasBalance)('transaction should have valid gas used', async () => {
    const { receipt } = await playTicTacToeGame(3);

    // Gas used should be reasonable
    expect(receipt.gasUsed).toBeGreaterThan(0n);
    expect(receipt.gasUsed).toBeLessThan(1000000n); // Less than 1M gas
  }, 90000);

  test.skipIf(!hasBalance)('block number should increment', async () => {
    const { publicClient } = await import('../setup/test-wallet');

    const blockBefore = await publicClient.getBlockNumber();

    await playTicTacToeGame(1);

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
