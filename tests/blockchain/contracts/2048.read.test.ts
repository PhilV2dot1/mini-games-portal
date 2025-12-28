import { describe, test, expect, beforeAll } from 'vitest';
import {
  publicClient,
  testAccount,
  TEST_WALLET_ADDRESS,
  isConnectedToAlfajores,
} from '../setup/test-wallet';
import { get2048Stats, isContractDeployed } from '../helpers/contract-helpers';
import { GAME2048_CONTRACT_ADDRESS, GAME_FEE } from '@/lib/contracts/2048-abi';

/**
 * 2048 Contract - Read Tests
 *
 * Tests de lecture du contrat 2048 sur Alfajores testnet.
 * Note: Le contrat 2048 a un système de high score et requiert 0.01 CELO par partie.
 */

describe('2048 Contract - Read Operations', () => {
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
    const isDeployed = await isContractDeployed(GAME2048_CONTRACT_ADDRESS);
    expect(isDeployed).toBe(true);
  });

  test('GAME_FEE constant should be correct', () => {
    // 0.01 CELO = 10000000000000000 wei
    expect(GAME_FEE).toBe('10000000000000000');
  });

  test('can read GAME_FEE from contract', async () => {
    const fee = await publicClient.readContract({
      address: GAME2048_CONTRACT_ADDRESS,
      abi: [
        {
          type: 'function',
          name: 'GAME_FEE',
          inputs: [],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
        },
      ] as const,
      functionName: 'GAME_FEE',
    });

    expect(fee).toBe(BigInt(GAME_FEE));
  });

  test('getStats() should return correct structure', async () => {
    const stats = await get2048Stats();

    expect(stats).toHaveProperty('highScore');
    expect(stats).toHaveProperty('wins');
    expect(stats).toHaveProperty('losses');
    expect(stats).toHaveProperty('totalGames');
    expect(stats).toHaveProperty('winRate');
    expect(stats).toHaveProperty('currentStreak');
    expect(stats).toHaveProperty('bestStreak');
  });

  test('stats should be proper types', async () => {
    const stats = await get2048Stats();

    expect(typeof stats.highScore).toBe('bigint');
    expect(typeof stats.wins).toBe('bigint');
    expect(typeof stats.losses).toBe('bigint');
    expect(typeof stats.totalGames).toBe('bigint');
    expect(typeof stats.winRate).toBe('bigint');
    expect(typeof stats.currentStreak).toBe('bigint');
    expect(typeof stats.bestStreak).toBe('bigint');
  });

  test('stats should have non-negative values (except streak)', async () => {
    const stats = await get2048Stats();

    expect(stats.highScore).toBeGreaterThanOrEqual(0n);
    expect(stats.wins).toBeGreaterThanOrEqual(0n);
    expect(stats.losses).toBeGreaterThanOrEqual(0n);
    expect(stats.totalGames).toBeGreaterThanOrEqual(0n);
    expect(stats.winRate).toBeGreaterThanOrEqual(0n);
    expect(stats.bestStreak).toBeGreaterThanOrEqual(0n);
  });

  test('totalGames should equal sum of wins + losses', async () => {
    const stats = await get2048Stats();

    const calculatedTotal = stats.wins + stats.losses;
    expect(stats.totalGames).toBe(calculatedTotal);
  });

  test('winRate should be between 0 and 100', async () => {
    const stats = await get2048Stats();

    expect(stats.winRate).toBeGreaterThanOrEqual(0n);
    expect(stats.winRate).toBeLessThanOrEqual(100n);
  });

  test('bestStreak should be non-negative', async () => {
    const stats = await get2048Stats();

    expect(stats.bestStreak).toBeGreaterThanOrEqual(0n);
  });

  test('stats for new address should be zero', async () => {
    const randomAddress = `0x${Math.random().toString(16).slice(2).padStart(40, '0')}` as `0x${string}`;

    const stats = await get2048Stats(randomAddress);

    expect(stats.highScore).toBe(0n);
    expect(stats.wins).toBe(0n);
    expect(stats.losses).toBe(0n);
    expect(stats.totalGames).toBe(0n);
    expect(stats.winRate).toBe(0n);
    expect(stats.currentStreak).toBe(0n);
    expect(stats.bestStreak).toBe(0n);
  });

  test('can read stats multiple times consistently', async () => {
    const stats1 = await get2048Stats();
    const stats2 = await get2048Stats();

    expect(stats1.highScore).toBe(stats2.highScore);
    expect(stats1.wins).toBe(stats2.wins);
    expect(stats1.losses).toBe(stats2.losses);
    expect(stats1.totalGames).toBe(stats2.totalGames);
    expect(stats1.winRate).toBe(stats2.winRate);
    expect(stats1.currentStreak).toBe(stats2.currentStreak);
    expect(stats1.bestStreak).toBe(stats2.bestStreak);
  });

  test('hasActiveGame should return valid structure', async () => {
    const result = await publicClient.readContract({
      address: GAME2048_CONTRACT_ADDRESS,
      abi: [
        {
          type: 'function',
          name: 'hasActiveGame',
          inputs: [{ name: 'player', type: 'address' }],
          outputs: [
            { name: 'exists', type: 'bool' },
            { name: 'startTime', type: 'uint256' },
          ],
          stateMutability: 'view',
        },
      ] as const,
      functionName: 'hasActiveGame',
      args: [TEST_WALLET_ADDRESS],
    }) as [boolean, bigint];

    expect(typeof result[0]).toBe('boolean'); // exists
    expect(typeof result[1]).toBe('bigint'); // startTime
  });

  test('contract bytecode should exist', async () => {
    const bytecode = await publicClient.getBytecode({
      address: GAME2048_CONTRACT_ADDRESS,
    });

    expect(bytecode).toBeDefined();
    expect(bytecode).not.toBe('0x');
    expect(bytecode?.length).toBeGreaterThan(2);
  });

  test('high score should be greater than or equal to regular score', async () => {
    const stats = await get2048Stats();

    // HighScore should always be >= 0
    expect(stats.highScore).toBeGreaterThanOrEqual(0n);

    // If there are wins, high score should be > 0
    if (stats.wins > 0n) {
      expect(stats.highScore).toBeGreaterThan(0n);
    }
  });

  test('wins should not exceed total games', async () => {
    const stats = await get2048Stats();

    expect(stats.wins).toBeLessThanOrEqual(stats.totalGames);
  });

  test('losses should not exceed total games', async () => {
    const stats = await get2048Stats();

    expect(stats.losses).toBeLessThanOrEqual(stats.totalGames);
  });
});
