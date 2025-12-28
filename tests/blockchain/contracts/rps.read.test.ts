import { describe, test, expect, beforeAll } from 'vitest';
import {
  publicClient,
  testAccount,
  TEST_WALLET_ADDRESS,
  isConnectedToAlfajores,
} from '../setup/test-wallet';
import { getRPSStats, isContractDeployed } from '../helpers/contract-helpers';
import { RPS_CONTRACT_ADDRESS } from '@/lib/contracts/rps-abi';

/**
 * Rock Paper Scissors Contract - Read Tests
 *
 * Tests de lecture du contrat RPS sur Alfajores testnet.
 */

describe('RPS Contract - Read Operations', () => {
  beforeAll(async () => {
    const isAlfajores = await isConnectedToAlfajores();
    if (!isAlfajores) {
      console.warn('⚠️  Not connected to Alfajores testnet');
    }
  });

  test('should be connected to Alfajores testnet', async () => {
    const chainId = await publicClient.getChainId();
    expect(chainId).toBe(44787);
  });

  test('should have valid test wallet address', () => {
    expect(TEST_WALLET_ADDRESS).toBeDefined();
    expect(TEST_WALLET_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(testAccount.address).toBe(TEST_WALLET_ADDRESS);
  });

  test('contract should be deployed on Alfajores', async () => {
    const isDeployed = await isContractDeployed(RPS_CONTRACT_ADDRESS);
    expect(isDeployed).toBe(true);
  });

  test('getStats() should return correct structure', async () => {
    const stats = await getRPSStats();

    expect(stats).toHaveProperty('wins');
    expect(stats).toHaveProperty('losses');
    expect(stats).toHaveProperty('draws');
    expect(stats).toHaveProperty('totalGames');
    expect(stats).toHaveProperty('winRate');
    expect(stats).toHaveProperty('currentStreak');
    expect(stats).toHaveProperty('bestStreak');
  });

  test('stats should be proper types', async () => {
    const stats = await getRPSStats();

    expect(typeof stats.wins).toBe('bigint');
    expect(typeof stats.losses).toBe('bigint');
    expect(typeof stats.draws).toBe('bigint');
    expect(typeof stats.totalGames).toBe('bigint');
    expect(typeof stats.winRate).toBe('bigint');
    expect(typeof stats.currentStreak).toBe('bigint');
    expect(typeof stats.bestStreak).toBe('bigint');
  });

  test('stats should have non-negative values (except streak)', async () => {
    const stats = await getRPSStats();

    expect(stats.wins).toBeGreaterThanOrEqual(0n);
    expect(stats.losses).toBeGreaterThanOrEqual(0n);
    expect(stats.draws).toBeGreaterThanOrEqual(0n);
    expect(stats.totalGames).toBeGreaterThanOrEqual(0n);
    expect(stats.winRate).toBeGreaterThanOrEqual(0n);
    expect(stats.bestStreak).toBeGreaterThanOrEqual(0n);
  });

  test('totalGames should equal sum of wins + losses + draws', async () => {
    const stats = await getRPSStats();

    const calculatedTotal = stats.wins + stats.losses + stats.draws;
    expect(stats.totalGames).toBe(calculatedTotal);
  });

  test('winRate should be between 0 and 100', async () => {
    const stats = await getRPSStats();

    expect(stats.winRate).toBeGreaterThanOrEqual(0n);
    expect(stats.winRate).toBeLessThanOrEqual(100n);
  });

  test('bestStreak should be non-negative', async () => {
    const stats = await getRPSStats();

    expect(stats.bestStreak).toBeGreaterThanOrEqual(0n);
  });

  test('stats for new address should be zero', async () => {
    const randomAddress = `0x${Math.random().toString(16).slice(2).padStart(40, '0')}` as `0x${string}`;

    const stats = await getRPSStats(randomAddress);

    expect(stats.wins).toBe(0n);
    expect(stats.losses).toBe(0n);
    expect(stats.draws).toBe(0n);
    expect(stats.totalGames).toBe(0n);
    expect(stats.winRate).toBe(0n);
    expect(stats.currentStreak).toBe(0n);
    expect(stats.bestStreak).toBe(0n);
  });

  test('can read stats multiple times consistently', async () => {
    const stats1 = await getRPSStats();
    const stats2 = await getRPSStats();

    expect(stats1.wins).toBe(stats2.wins);
    expect(stats1.losses).toBe(stats2.losses);
    expect(stats1.draws).toBe(stats2.draws);
    expect(stats1.totalGames).toBe(stats2.totalGames);
    expect(stats1.winRate).toBe(stats2.winRate);
    expect(stats1.currentStreak).toBe(stats2.currentStreak);
    expect(stats1.bestStreak).toBe(stats2.bestStreak);
  });

  test('contract bytecode should exist', async () => {
    const bytecode = await publicClient.getBytecode({
      address: RPS_CONTRACT_ADDRESS,
    });

    expect(bytecode).toBeDefined();
    expect(bytecode).not.toBe('0x');
    expect(bytecode?.length).toBeGreaterThan(2);
  });
});
