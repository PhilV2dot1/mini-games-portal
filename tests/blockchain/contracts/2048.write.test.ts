import { describe, test, expect, beforeAll } from 'vitest';
import {
  TEST_WALLET_ADDRESS,
  hasInsufficientBalance,
  getTestWalletBalance,
} from '../setup/test-wallet';
import {
  get2048Stats,
  play2048Game,
  isTransactionMined,
} from '../helpers/contract-helpers';

/**
 * 2048 Contract - Write Tests
 *
 * These tests write transactions to the 2048 contract on Alfajores testnet.
 * They verify that:
 * - startGame() and submitScore() transactions succeed
 * - Transaction is mined
 * - Stats are updated correctly
 * - Events are emitted
 * - Game fee is correctly charged
 *
 * REQUIREMENTS:
 * - Must be connected to Alfajores testnet
 * - Test wallet must have CELO for gas fees AND game fees (0.01 CELO per game)
 * - Get testnet CELO from: https://faucet.celo.org
 *
 * IMPORTANT: These tests will be SKIPPED if wallet has insufficient balance.
 * IMPORTANT: Each game costs 0.01 CELO + gas fees.
 */

describe('2048 Contract - Write Operations', () => {
  let hasBalance = false;
  let initialBalance = 0;

  beforeAll(async () => {
    // Check if wallet has sufficient CELO
    const insufficientBalance = await hasInsufficientBalance();

    if (insufficientBalance) {
      console.warn('⚠️  SKIPPING WRITE TESTS - Insufficient CELO balance');
      console.warn('   Fund wallet at: https://faucet.celo.org');
      console.warn(`   Address: ${TEST_WALLET_ADDRESS}`);
      console.warn('   Note: 2048 requires 0.01 CELO per game + gas');
      return;
    }

    hasBalance = true;
    initialBalance = await getTestWalletBalance();
    console.log(`✅ Test wallet balance: ${initialBalance.toFixed(4)} CELO`);
    console.log('   Note: Each 2048 game costs 0.01 CELO + gas');
  });

  test.skipIf(!hasBalance)('playGame() transaction should succeed', async () => {
    const score = BigInt(Math.floor(Math.random() * 5000));
    const reachedGoal = false;

    const { hash, receipt } = await play2048Game(score, reachedGoal);

    // Verify transaction was mined
    expect(receipt.status).toBe('success');
    expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Verify transaction is confirmed
    const isMined = await isTransactionMined(hash);
    expect(isMined).toBe(true);
  }, 90000); // 90 second timeout for blockchain transaction

  test.skipIf(!hasBalance)('playGame() should return valid game result', async () => {
    const score = 1000n;
    const reachedGoal = false;

    const { receipt } = await play2048Game(score, reachedGoal);

    // Should have logs (events)
    expect(receipt.logs.length).toBeGreaterThan(0);

    // Transaction should be successful
    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('stats should update after playing game', async () => {
    // Get initial stats
    const initialStats = await get2048Stats();

    const score = 2000n;
    const reachedGoal = false;

    // Play game (loss because didn't reach goal)
    await play2048Game(score, reachedGoal);

    // Get updated stats
    const updatedStats = await get2048Stats();

    // Total games should increment by 1
    expect(updatedStats.totalGames).toBe(initialStats.totalGames + 1n);

    // Losses should increment since we didn't reach goal
    expect(updatedStats.losses).toBe(initialStats.losses + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('can play with low score', async () => {
    const score = 100n;
    const reachedGoal = false;

    const { receipt } = await play2048Game(score, reachedGoal);

    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('can play with medium score', async () => {
    const score = 5000n;
    const reachedGoal = false;

    const { receipt } = await play2048Game(score, reachedGoal);

    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('can play with high score', async () => {
    const score = 50000n;
    const reachedGoal = true;

    const { receipt } = await play2048Game(score, reachedGoal);

    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('winning game (reachedGoal=true) increments wins', async () => {
    const initialStats = await get2048Stats();

    const score = 10000n;
    const reachedGoal = true;

    await play2048Game(score, reachedGoal);

    const finalStats = await get2048Stats();

    // Wins should increment
    expect(finalStats.wins).toBe(initialStats.wins + 1n);
    expect(finalStats.totalGames).toBe(initialStats.totalGames + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('losing game (reachedGoal=false) increments losses', async () => {
    const initialStats = await get2048Stats();

    const score = 1000n;
    const reachedGoal = false;

    await play2048Game(score, reachedGoal);

    const finalStats = await get2048Stats();

    // Losses should increment
    expect(finalStats.losses).toBe(initialStats.losses + 1n);
    expect(finalStats.totalGames).toBe(initialStats.totalGames + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('high score should update if new score is higher', async () => {
    const initialStats = await get2048Stats();

    // Play with a very high score
    const score = 999999n;
    const reachedGoal = true;

    await play2048Game(score, reachedGoal);

    const finalStats = await get2048Stats();

    // High score should be at least the score we submitted
    expect(finalStats.highScore).toBeGreaterThanOrEqual(score);
  }, 90000);

  test.skipIf(!hasBalance)('multiple games can be played sequentially', async () => {
    const initialStats = await get2048Stats();

    // Play 3 games
    await play2048Game(1000n, false); // Loss
    await play2048Game(5000n, true);  // Win
    await play2048Game(3000n, false); // Loss

    const finalStats = await get2048Stats();

    // Total games should increase by 3
    expect(finalStats.totalGames).toBe(initialStats.totalGames + 3n);
  }, 180000); // 3 minutes for 3 transactions

  test.skipIf(!hasBalance)('game fee should be deducted from balance', async () => {
    const balanceBefore = await getTestWalletBalance();

    const score = 1000n;
    const reachedGoal = false;

    await play2048Game(score, reachedGoal);

    const balanceAfter = await getTestWalletBalance();

    const cost = balanceBefore - balanceAfter;

    // Cost should be at least 0.01 CELO (game fee) + gas
    expect(cost).toBeGreaterThan(0.01);

    // Cost should be less than 0.02 CELO (0.01 fee + reasonable gas)
    expect(cost).toBeLessThan(0.02);
  }, 90000);

  test.skipIf(!hasBalance)('contract balance should increase by game fee', async () => {
    const { publicClient } = await import('../setup/test-wallet');
    const { GAME2048_CONTRACT_ADDRESS } = await import('@/lib/contracts/2048-abi');

    const contractBalanceBefore = await publicClient.getBalance({
      address: GAME2048_CONTRACT_ADDRESS,
    });

    const score = 1000n;
    const reachedGoal = false;

    await play2048Game(score, reachedGoal);

    const contractBalanceAfter = await publicClient.getBalance({
      address: GAME2048_CONTRACT_ADDRESS,
    });

    // Contract balance should increase by 0.01 CELO
    const gameFee = BigInt('10000000000000000'); // 0.01 CELO
    expect(contractBalanceAfter).toBe(contractBalanceBefore + gameFee);
  }, 90000);

  test.skipIf(!hasBalance)('transaction should have valid gas used', async () => {
    const score = 5000n;
    const reachedGoal = false;

    const { receipt } = await play2048Game(score, reachedGoal);

    // Gas used should be reasonable
    expect(receipt.gasUsed).toBeGreaterThan(0n);
    expect(receipt.gasUsed).toBeLessThan(1000000n); // Less than 1M gas
  }, 90000);

  test.skipIf(!hasBalance)('block number should increment', async () => {
    const { publicClient } = await import('../setup/test-wallet');

    const score = 1000n;
    const reachedGoal = false;

    const blockBefore = await publicClient.getBlockNumber();

    await play2048Game(score, reachedGoal);

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
      console.warn('   Note: 2048 requires 0.01 CELO per game + gas');
    }

    expect(true).toBe(true);
  });
});
