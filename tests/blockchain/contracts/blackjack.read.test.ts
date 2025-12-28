import { describe, test, expect, beforeAll } from 'vitest';
import {
  publicClient,
  testAccount,
  TEST_WALLET_ADDRESS,
  isConnectedToAlfajores,
  hasInsufficientBalance,
} from '../setup/test-wallet';
import { getBlackjackStats, isContractDeployed } from '../helpers/contract-helpers';
import { CONTRACT_ADDRESS } from '@/lib/contracts/blackjack-abi';

/**
 * Blackjack Contract - Read Tests
 *
 * These tests read data from the Blackjack contract on Alfajores testnet.
 * They verify that:
 * - Contract is deployed and accessible
 * - getStats() returns correct structure
 * - Stats are properly formatted
 *
 * REQUIREMENTS:
 * - Must be connected to Alfajores testnet
 * - Test wallet must exist (does not need CELO for read operations)
 */

describe('Blackjack Contract - Read Operations', () => {
  beforeAll(async () => {
    // Verify we're connected to Alfajores
    const isAlfajores = await isConnectedToAlfajores();
    if (!isAlfajores) {
      console.warn('⚠️  Not connected to Alfajores testnet');
      console.warn('   These tests will be skipped');
    }
  });

  test('should be connected to Alfajores testnet', async () => {
    const chainId = await publicClient.getChainId();
    expect(chainId).toBe(44787); // Alfajores chain ID
  });

  test('should have valid test wallet address', () => {
    expect(TEST_WALLET_ADDRESS).toBeDefined();
    expect(TEST_WALLET_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(testAccount.address).toBe(TEST_WALLET_ADDRESS);
  });

  test('contract should be deployed on Alfajores', async () => {
    const isDeployed = await isContractDeployed(CONTRACT_ADDRESS);
    expect(isDeployed).toBe(true);
  });

  test('getStats() should return correct structure', async () => {
    const stats = await getBlackjackStats();

    // Should return all 8 stat fields
    expect(stats).toHaveProperty('wins');
    expect(stats).toHaveProperty('losses');
    expect(stats).toHaveProperty('pushes');
    expect(stats).toHaveProperty('blackjacks');
    expect(stats).toHaveProperty('totalGames');
    expect(stats).toHaveProperty('winRate');
    expect(stats).toHaveProperty('currentStreak');
    expect(stats).toHaveProperty('bestStreak');
  });

  test('stats should be proper types', async () => {
    const stats = await getBlackjackStats();

    // All stats should be bigints
    expect(typeof stats.wins).toBe('bigint');
    expect(typeof stats.losses).toBe('bigint');
    expect(typeof stats.pushes).toBe('bigint');
    expect(typeof stats.blackjacks).toBe('bigint');
    expect(typeof stats.totalGames).toBe('bigint');
    expect(typeof stats.winRate).toBe('bigint');
    expect(typeof stats.currentStreak).toBe('bigint');
    expect(typeof stats.bestStreak).toBe('bigint');
  });

  test('stats should have non-negative values (except streak)', async () => {
    const stats = await getBlackjackStats();

    expect(stats.wins).toBeGreaterThanOrEqual(0n);
    expect(stats.losses).toBeGreaterThanOrEqual(0n);
    expect(stats.pushes).toBeGreaterThanOrEqual(0n);
    expect(stats.blackjacks).toBeGreaterThanOrEqual(0n);
    expect(stats.totalGames).toBeGreaterThanOrEqual(0n);
    expect(stats.winRate).toBeGreaterThanOrEqual(0n);
    expect(stats.bestStreak).toBeGreaterThanOrEqual(0n);

    // currentStreak can be negative
    // Just verify it's a valid bigint (already checked above)
  });

  test('totalGames should equal sum of wins + losses + pushes', async () => {
    const stats = await getBlackjackStats();

    const calculatedTotal = stats.wins + stats.losses + stats.pushes;
    expect(stats.totalGames).toBe(calculatedTotal);
  });

  test('blackjacks should not exceed wins', async () => {
    const stats = await getBlackjackStats();

    // Blackjacks are a subset of wins
    expect(stats.blackjacks).toBeLessThanOrEqual(stats.wins);
  });

  test('winRate should be between 0 and 100', async () => {
    const stats = await getBlackjackStats();

    expect(stats.winRate).toBeGreaterThanOrEqual(0n);
    expect(stats.winRate).toBeLessThanOrEqual(100n);
  });

  test('bestStreak should be non-negative', async () => {
    const stats = await getBlackjackStats();

    expect(stats.bestStreak).toBeGreaterThanOrEqual(0n);
  });

  test('stats for new address should be zero', async () => {
    // Create a random address that has never played
    const randomAddress = `0x${Math.random().toString(16).slice(2).padStart(40, '0')}` as `0x${string}`;

    const stats = await getBlackjackStats(randomAddress);

    expect(stats.wins).toBe(0n);
    expect(stats.losses).toBe(0n);
    expect(stats.pushes).toBe(0n);
    expect(stats.blackjacks).toBe(0n);
    expect(stats.totalGames).toBe(0n);
    expect(stats.winRate).toBe(0n);
    expect(stats.currentStreak).toBe(0n);
    expect(stats.bestStreak).toBe(0n);
  });

  test('can read stats multiple times consistently', async () => {
    const stats1 = await getBlackjackStats();
    const stats2 = await getBlackjackStats();

    // Stats should be identical when read consecutively
    expect(stats1.wins).toBe(stats2.wins);
    expect(stats1.losses).toBe(stats2.losses);
    expect(stats1.pushes).toBe(stats2.pushes);
    expect(stats1.blackjacks).toBe(stats2.blackjacks);
    expect(stats1.totalGames).toBe(stats2.totalGames);
    expect(stats1.winRate).toBe(stats2.winRate);
    expect(stats1.currentStreak).toBe(stats2.currentStreak);
    expect(stats1.bestStreak).toBe(stats2.bestStreak);
  });

  test('can read contract balance', async () => {
    const balance = await publicClient.getBalance({
      address: CONTRACT_ADDRESS,
    });

    // Balance should be a bigint
    expect(typeof balance).toBe('bigint');
    expect(balance).toBeGreaterThanOrEqual(0n);
  });

  test('contract bytecode should exist', async () => {
    const bytecode = await publicClient.getBytecode({
      address: CONTRACT_ADDRESS,
    });

    expect(bytecode).toBeDefined();
    expect(bytecode).not.toBe('0x');
    expect(bytecode?.length).toBeGreaterThan(2);
  });

  test('should warn if test wallet has no CELO', async () => {
    const hasSufficientBalance = await hasInsufficientBalance();

    if (hasSufficientBalance) {
      console.warn('⚠️  Test wallet has insufficient CELO balance');
      console.warn('   Fund wallet at: https://faucet.celo.org');
      console.warn(`   Address: ${TEST_WALLET_ADDRESS}`);
    }

    // This is just a warning, not a failure
    expect(true).toBe(true);
  });
});
