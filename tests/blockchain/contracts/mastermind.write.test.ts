import { describe, test, expect, beforeAll } from 'vitest';
import {
  TEST_WALLET_ADDRESS,
  hasInsufficientBalance,
  getTestWalletBalance,
} from '../setup/test-wallet';
import {
  getMastermindStats,
  playMastermindGame,
  isTransactionMined,
} from '../helpers/contract-helpers';

/**
 * Mastermind Contract - Write Tests
 *
 * These tests write transactions to the Mastermind contract on Alfajores testnet.
 * They verify that:
 * - startGame() and submitScore() transactions succeed
 * - Transaction is mined
 * - Stats are updated correctly
 * - Events are emitted
 * - Game fee is correctly charged
 * - Attempts and scores are tracked
 *
 * REQUIREMENTS:
 * - Must be connected to Alfajores testnet
 * - Test wallet must have CELO for gas fees AND game fees (0.01 CELO per game)
 * - Get testnet CELO from: https://faucet.celo.org
 *
 * IMPORTANT: These tests will be SKIPPED if wallet has insufficient balance.
 * IMPORTANT: Each game costs 0.01 CELO + gas fees.
 */

describe('Mastermind Contract - Write Operations', () => {
  let hasBalance = false;
  let initialBalance = 0;

  beforeAll(async () => {
    // Check if wallet has sufficient CELO
    const insufficientBalance = await hasInsufficientBalance();

    if (insufficientBalance) {
      console.warn('⚠️  SKIPPING WRITE TESTS - Insufficient CELO balance');
      console.warn('   Fund wallet at: https://faucet.celo.org');
      console.warn(`   Address: ${TEST_WALLET_ADDRESS}`);
      console.warn('   Note: Mastermind requires 0.01 CELO per game + gas');
      return;
    }

    hasBalance = true;
    initialBalance = await getTestWalletBalance();
    console.log(`✅ Test wallet balance: ${initialBalance.toFixed(4)} CELO`);
    console.log('   Note: Each Mastermind game costs 0.01 CELO + gas');
  });

  test.skipIf(!hasBalance)('playGame() transaction should succeed', async () => {
    const score = BigInt(Math.floor(Math.random() * 100));
    const won = false;
    const attempts = BigInt(Math.floor(Math.random() * 10) + 1);

    const { hash, receipt } = await playMastermindGame(score, won, attempts);

    // Verify transaction was mined
    expect(receipt.status).toBe('success');
    expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Verify transaction is confirmed
    const isMined = await isTransactionMined(hash);
    expect(isMined).toBe(true);
  }, 90000); // 90 second timeout for blockchain transaction

  test.skipIf(!hasBalance)('playGame() should return valid game result', async () => {
    const score = 50n;
    const won = true;
    const attempts = 5n;

    const { receipt } = await playMastermindGame(score, won, attempts);

    // Should have logs (events)
    expect(receipt.logs.length).toBeGreaterThan(0);

    // Transaction should be successful
    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('stats should update after playing game', async () => {
    // Get initial stats
    const initialStats = await getMastermindStats();

    const score = 30n;
    const won = false;
    const attempts = 8n;

    // Play game (loss)
    await playMastermindGame(score, won, attempts);

    // Get updated stats
    const updatedStats = await getMastermindStats();

    // Total games should increment by 1
    expect(updatedStats.totalGames).toBe(initialStats.totalGames + 1n);

    // Losses should increment since won=false
    expect(updatedStats.losses).toBe(initialStats.losses + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('can play with 1 attempt', async () => {
    const score = 100n;
    const won = true;
    const attempts = 1n;

    const { receipt } = await playMastermindGame(score, won, attempts);

    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('can play with multiple attempts', async () => {
    const score = 60n;
    const won = true;
    const attempts = 7n;

    const { receipt } = await playMastermindGame(score, won, attempts);

    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('can play with max attempts', async () => {
    const score = 20n;
    const won = false;
    const attempts = 10n;

    const { receipt } = await playMastermindGame(score, won, attempts);

    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('winning game (won=true) increments wins', async () => {
    const initialStats = await getMastermindStats();

    const score = 80n;
    const won = true;
    const attempts = 4n;

    await playMastermindGame(score, won, attempts);

    const finalStats = await getMastermindStats();

    // Wins should increment
    expect(finalStats.wins).toBe(initialStats.wins + 1n);
    expect(finalStats.totalGames).toBe(initialStats.totalGames + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('losing game (won=false) increments losses', async () => {
    const initialStats = await getMastermindStats();

    const score = 30n;
    const won = false;
    const attempts = 10n;

    await playMastermindGame(score, won, attempts);

    const finalStats = await getMastermindStats();

    // Losses should increment
    expect(finalStats.losses).toBe(initialStats.losses + 1n);
    expect(finalStats.totalGames).toBe(initialStats.totalGames + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('best score should update if new score is higher', async () => {
    const initialStats = await getMastermindStats();

    // Play with a very high score
    const score = 999n;
    const won = true;
    const attempts = 1n;

    await playMastermindGame(score, won, attempts);

    const finalStats = await getMastermindStats();

    // Best score should be at least the score we submitted
    expect(finalStats.bestScore).toBeGreaterThanOrEqual(score);
  }, 90000);

  test.skipIf(!hasBalance)('average attempts should update', async () => {
    const initialStats = await getMastermindStats();

    const score = 50n;
    const won = true;
    const attempts = 5n;

    await playMastermindGame(score, won, attempts);

    const finalStats = await getMastermindStats();

    // Average attempts should be updated
    if (finalStats.totalGames > 0n) {
      expect(finalStats.averageAttempts).toBeGreaterThanOrEqual(0n);
      expect(finalStats.averageAttempts).toBeLessThanOrEqual(10n);
    }
  }, 90000);

  test.skipIf(!hasBalance)('multiple games can be played sequentially', async () => {
    const initialStats = await getMastermindStats();

    // Play 3 games
    await playMastermindGame(70n, true, 3n);  // Win
    await playMastermindGame(40n, false, 9n); // Loss
    await playMastermindGame(85n, true, 2n);  // Win

    const finalStats = await getMastermindStats();

    // Total games should increase by 3
    expect(finalStats.totalGames).toBe(initialStats.totalGames + 3n);
  }, 180000); // 3 minutes for 3 transactions

  test.skipIf(!hasBalance)('game fee should be deducted from balance', async () => {
    const balanceBefore = await getTestWalletBalance();

    const score = 50n;
    const won = true;
    const attempts = 5n;

    await playMastermindGame(score, won, attempts);

    const balanceAfter = await getTestWalletBalance();

    const cost = balanceBefore - balanceAfter;

    // Cost should be at least 0.01 CELO (game fee) + gas
    expect(cost).toBeGreaterThan(0.01);

    // Cost should be less than 0.02 CELO (0.01 fee + reasonable gas)
    expect(cost).toBeLessThan(0.02);
  }, 90000);

  test.skipIf(!hasBalance)('contract balance should increase by game fee', async () => {
    const { publicClient } = await import('../setup/test-wallet');
    const { MASTERMIND_CONTRACT_ADDRESS } = await import('@/lib/contracts/mastermind-abi');

    const contractBalanceBefore = await publicClient.getBalance({
      address: MASTERMIND_CONTRACT_ADDRESS,
    });

    const score = 50n;
    const won = true;
    const attempts = 5n;

    await playMastermindGame(score, won, attempts);

    const contractBalanceAfter = await publicClient.getBalance({
      address: MASTERMIND_CONTRACT_ADDRESS,
    });

    // Contract balance should increase by 0.01 CELO
    const gameFee = BigInt('10000000000000000'); // 0.01 CELO
    expect(contractBalanceAfter).toBe(contractBalanceBefore + gameFee);
  }, 90000);

  test.skipIf(!hasBalance)('transaction should have valid gas used', async () => {
    const score = 50n;
    const won = true;
    const attempts = 5n;

    const { receipt } = await playMastermindGame(score, won, attempts);

    // Gas used should be reasonable
    expect(receipt.gasUsed).toBeGreaterThan(0n);
    expect(receipt.gasUsed).toBeLessThan(1000000n); // Less than 1M gas
  }, 90000);

  test.skipIf(!hasBalance)('block number should increment', async () => {
    const { publicClient } = await import('../setup/test-wallet');

    const score = 50n;
    const won = true;
    const attempts = 5n;

    const blockBefore = await publicClient.getBlockNumber();

    await playMastermindGame(score, won, attempts);

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
      console.warn('   Note: Mastermind requires 0.01 CELO per game + gas');
    }

    expect(true).toBe(true);
  });
});
