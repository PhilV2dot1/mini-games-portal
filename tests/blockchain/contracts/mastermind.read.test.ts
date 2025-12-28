import { describe, test, expect, beforeAll } from 'vitest';
import {
  publicClient,
  testAccount,
  TEST_WALLET_ADDRESS,
  isConnectedToAlfajores,
} from '../setup/test-wallet';
import { getMastermindStats, isContractDeployed } from '../helpers/contract-helpers';
import { MASTERMIND_CONTRACT_ADDRESS, MASTERMIND_GAME_FEE } from '@/lib/contracts/mastermind-abi';

/**
 * Mastermind Contract - Read Tests
 *
 * Tests de lecture du contrat Mastermind sur Alfajores testnet.
 * Note: Le contrat Mastermind requiert 0.01 CELO par partie et suit
 * le nombre de tentatives et le meilleur score.
 */

describe('Mastermind Contract - Read Operations', () => {
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
    const isDeployed = await isContractDeployed(MASTERMIND_CONTRACT_ADDRESS);
    expect(isDeployed).toBe(true);
  });

  test('GAME_FEE constant should be correct', () => {
    // 0.01 CELO = 10000000000000000 wei
    expect(MASTERMIND_GAME_FEE).toBe('10000000000000000');
  });

  test('can read GAME_FEE from contract', async () => {
    const fee = await publicClient.readContract({
      address: MASTERMIND_CONTRACT_ADDRESS,
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

    expect(fee).toBe(BigInt(MASTERMIND_GAME_FEE));
  });

  test('getStats() should return correct structure', async () => {
    const stats = await getMastermindStats();

    expect(stats).toHaveProperty('wins');
    expect(stats).toHaveProperty('losses');
    expect(stats).toHaveProperty('totalGames');
    expect(stats).toHaveProperty('averageAttempts');
    expect(stats).toHaveProperty('bestScore');
  });

  test('stats should be proper types', async () => {
    const stats = await getMastermindStats();

    expect(typeof stats.wins).toBe('bigint');
    expect(typeof stats.losses).toBe('bigint');
    expect(typeof stats.totalGames).toBe('bigint');
    expect(typeof stats.averageAttempts).toBe('bigint');
    expect(typeof stats.bestScore).toBe('bigint');
  });

  test('stats should have non-negative values', async () => {
    const stats = await getMastermindStats();

    expect(stats.wins).toBeGreaterThanOrEqual(0n);
    expect(stats.losses).toBeGreaterThanOrEqual(0n);
    expect(stats.totalGames).toBeGreaterThanOrEqual(0n);
    expect(stats.averageAttempts).toBeGreaterThanOrEqual(0n);
    expect(stats.bestScore).toBeGreaterThanOrEqual(0n);
  });

  test('totalGames should equal sum of wins + losses', async () => {
    const stats = await getMastermindStats();

    const calculatedTotal = stats.wins + stats.losses;
    expect(stats.totalGames).toBe(calculatedTotal);
  });

  test('stats for new address should be zero', async () => {
    const randomAddress = `0x${Math.random().toString(16).slice(2).padStart(40, '0')}` as `0x${string}`;

    const stats = await getMastermindStats(randomAddress);

    expect(stats.wins).toBe(0n);
    expect(stats.losses).toBe(0n);
    expect(stats.totalGames).toBe(0n);
    expect(stats.averageAttempts).toBe(0n);
    expect(stats.bestScore).toBe(0n);
  });

  test('can read stats multiple times consistently', async () => {
    const stats1 = await getMastermindStats();
    const stats2 = await getMastermindStats();

    expect(stats1.wins).toBe(stats2.wins);
    expect(stats1.losses).toBe(stats2.losses);
    expect(stats1.totalGames).toBe(stats2.totalGames);
    expect(stats1.averageAttempts).toBe(stats2.averageAttempts);
    expect(stats1.bestScore).toBe(stats2.bestScore);
  });

  test('hasActiveGame should return valid structure', async () => {
    const result = await publicClient.readContract({
      address: MASTERMIND_CONTRACT_ADDRESS,
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
      address: MASTERMIND_CONTRACT_ADDRESS,
    });

    expect(bytecode).toBeDefined();
    expect(bytecode).not.toBe('0x');
    expect(bytecode?.length).toBeGreaterThan(2);
  });

  test('average attempts should be reasonable', async () => {
    const stats = await getMastermindStats();

    if (stats.totalGames > 0n) {
      // Average attempts should be between 1 and 10 (max attempts in Mastermind)
      expect(stats.averageAttempts).toBeGreaterThanOrEqual(0n);
      expect(stats.averageAttempts).toBeLessThanOrEqual(10n);
    }
  });

  test('best score should be reasonable', async () => {
    const stats = await getMastermindStats();

    if (stats.wins > 0n) {
      // Best score should be positive if there are wins
      expect(stats.bestScore).toBeGreaterThan(0n);

      // Best score should be less than 1000 (reasonable max)
      expect(stats.bestScore).toBeLessThan(1000n);
    }
  });

  test('wins should not exceed total games', async () => {
    const stats = await getMastermindStats();

    expect(stats.wins).toBeLessThanOrEqual(stats.totalGames);
  });

  test('losses should not exceed total games', async () => {
    const stats = await getMastermindStats();

    expect(stats.losses).toBeLessThanOrEqual(stats.totalGames);
  });

  test('if no games played, average attempts should be 0', async () => {
    const randomAddress = `0x${Math.random().toString(16).slice(2).padStart(40, '0')}` as `0x${string}`;

    const stats = await getMastermindStats(randomAddress);

    if (stats.totalGames === 0n) {
      expect(stats.averageAttempts).toBe(0n);
    }
  });
});
