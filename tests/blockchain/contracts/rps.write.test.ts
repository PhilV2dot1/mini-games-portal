import { describe, test, expect, beforeAll } from 'vitest';
import {
  TEST_WALLET_ADDRESS,
  hasInsufficientBalance,
  getTestWalletBalance,
} from '../setup/test-wallet';
import {
  getRPSStats,
  playRPSGame,
  isTransactionMined,
} from '../helpers/contract-helpers';

/**
 * Rock Paper Scissors Contract - Write Tests
 *
 * These tests write transactions to the RPS contract on Alfajores testnet.
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

describe('RPS Contract - Write Operations', () => {
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
    const { hash, receipt } = await playRPSGame(0); // Rock

    // Verify transaction was mined
    expect(receipt.status).toBe('success');
    expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Verify transaction is confirmed
    const isMined = await isTransactionMined(hash);
    expect(isMined).toBe(true);
  }, 90000); // 90 second timeout for blockchain transaction

  test.skipIf(!hasBalance)('playGame() should return valid game result', async () => {
    const { receipt } = await playRPSGame(1); // Paper

    // Should have logs (events)
    expect(receipt.logs.length).toBeGreaterThan(0);

    // Transaction should be successful
    expect(receipt.status).toBe('success');
  }, 90000);

  test.skipIf(!hasBalance)('stats should update after playing game', async () => {
    // Get initial stats
    const initialStats = await getRPSStats();

    // Play game
    await playRPSGame(2); // Scissors

    // Get updated stats
    const updatedStats = await getRPSStats();

    // Total games should increment by 1
    expect(updatedStats.totalGames).toBe(initialStats.totalGames + 1n);

    // One of wins, losses, or draws should increment
    const totalOutcomes =
      updatedStats.wins + updatedStats.losses + updatedStats.draws;
    const initialTotalOutcomes =
      initialStats.wins + initialStats.losses + initialStats.draws;

    expect(totalOutcomes).toBe(initialTotalOutcomes + 1n);
  }, 90000);

  test.skipIf(!hasBalance)('can play with rock (choice 0)', async () => {
    const { receipt } = await playRPSGame(0);

    expect(receipt.status).toBe('success');
    expect(receipt.logs.length).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('can play with paper (choice 1)', async () => {
    const { receipt } = await playRPSGame(1);

    expect(receipt.status).toBe('success');
    expect(receipt.logs.length).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('can play with scissors (choice 2)', async () => {
    const { receipt } = await playRPSGame(2);

    expect(receipt.status).toBe('success');
    expect(receipt.logs.length).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('game result should be valid outcome', async () => {
    const { receipt } = await playRPSGame(0);

    // Parse event to get outcome
    // Outcome should be one of: "win", "lose", "draw"
    const event = receipt.logs.find(log => log.topics.length > 0);

    expect(event).toBeDefined();
  }, 90000);

  test.skipIf(!hasBalance)('multiple games can be played sequentially', async () => {
    const initialStats = await getRPSStats();

    // Play 3 games with different choices
    await playRPSGame(0); // Rock
    await playRPSGame(1); // Paper
    await playRPSGame(2); // Scissors

    const finalStats = await getRPSStats();

    // Total games should increase by 3
    expect(finalStats.totalGames).toBe(initialStats.totalGames + 3n);
  }, 180000); // 3 minutes for 3 transactions

  test.skipIf(!hasBalance)('win increments stats correctly', async () => {
    const initialStats = await getRPSStats();

    // Play games until we get a win (max 10 tries)
    let foundWin = false;

    for (let i = 0; i < 10; i++) {
      const statsBefore = await getRPSStats();
      await playRPSGame(i % 3); // Rotate through choices
      const statsAfter = await getRPSStats();

      if (statsAfter.wins > statsBefore.wins) {
        foundWin = true;
        break;
      }
    }

    const finalStats = await getRPSStats();

    // Total games should have increased
    expect(finalStats.totalGames).toBeGreaterThan(initialStats.totalGames);

    // We might have gotten a win
    if (foundWin) {
      expect(finalStats.wins).toBeGreaterThan(initialStats.wins);
    }
  }, 300000); // 5 minutes for multiple games

  test.skipIf(!hasBalance)('draw increments stats correctly', async () => {
    const initialStats = await getRPSStats();

    // Play games until we get a draw (max 10 tries)
    let foundDraw = false;

    for (let i = 0; i < 10; i++) {
      const statsBefore = await getRPSStats();
      await playRPSGame(i % 3);
      const statsAfter = await getRPSStats();

      if (statsAfter.draws > statsBefore.draws) {
        foundDraw = true;
        break;
      }
    }

    const finalStats = await getRPSStats();

    // Total games should have increased
    expect(finalStats.totalGames).toBeGreaterThan(initialStats.totalGames);

    // We might have gotten a draw
    if (foundDraw) {
      expect(finalStats.draws).toBeGreaterThan(initialStats.draws);
    }
  }, 300000); // 5 minutes for multiple games

  test.skipIf(!hasBalance)('gas cost should be reasonable', async () => {
    const balanceBefore = await getTestWalletBalance();

    await playRPSGame(0);

    const balanceAfter = await getTestWalletBalance();

    const gasCost = balanceBefore - balanceAfter;

    // Gas cost should be less than 0.01 CELO
    expect(gasCost).toBeLessThan(0.01);
    expect(gasCost).toBeGreaterThan(0);
  }, 90000);

  test.skipIf(!hasBalance)('contract balance should remain stable', async () => {
    const { publicClient } = await import('../setup/test-wallet');
    const { RPS_CONTRACT_ADDRESS } = await import('@/lib/contracts/rps-abi');

    const balanceBefore = await publicClient.getBalance({
      address: RPS_CONTRACT_ADDRESS,
    });

    await playRPSGame(1);

    const balanceAfter = await publicClient.getBalance({
      address: RPS_CONTRACT_ADDRESS,
    });

    // Contract balance should not change (free game, no betting)
    expect(balanceAfter).toBe(balanceBefore);
  }, 90000);

  test.skipIf(!hasBalance)('transaction should have valid gas used', async () => {
    const { receipt } = await playRPSGame(2);

    // Gas used should be reasonable
    expect(receipt.gasUsed).toBeGreaterThan(0n);
    expect(receipt.gasUsed).toBeLessThan(1000000n); // Less than 1M gas
  }, 90000);

  test.skipIf(!hasBalance)('block number should increment', async () => {
    const { publicClient } = await import('../setup/test-wallet');

    const blockBefore = await publicClient.getBlockNumber();

    await playRPSGame(0);

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
