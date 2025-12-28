import { describe, test, expect, beforeAll } from 'vitest';
import {
  publicClient,
  testAccount,
  TEST_WALLET_ADDRESS,
  isConnectedToAlfajores,
} from '../setup/test-wallet';
import { getJackpotLeaderboard, isContractDeployed } from '../helpers/contract-helpers';
import { JACKPOT_CONTRACT_ADDRESS } from '@/lib/contracts/jackpot-abi';

/**
 * Jackpot Contract - Read Tests
 *
 * Tests de lecture du contrat Jackpot sur Alfajores testnet.
 * Note: Le contrat Jackpot est différent des autres - il n'a pas de stats
 * individuelles mais un système de leaderboard avec sessions et scores.
 */

describe('Jackpot Contract - Read Operations', () => {
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
    const isDeployed = await isContractDeployed(JACKPOT_CONTRACT_ADDRESS);
    expect(isDeployed).toBe(true);
  });

  test('getTopScores() should return array', async () => {
    const topScores = await getJackpotLeaderboard(10);

    expect(Array.isArray(topScores)).toBe(true);
  });

  test('leaderboard entries should have correct structure', async () => {
    const topScores = await getJackpotLeaderboard(5);

    if (topScores.length > 0) {
      const entry = topScores[0];

      expect(entry).toHaveProperty('fid');
      expect(entry).toHaveProperty('player');
      expect(entry).toHaveProperty('score');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('completed');
    }
  });

  test('leaderboard entries should have proper types', async () => {
    const topScores = await getJackpotLeaderboard(5);

    if (topScores.length > 0) {
      const entry = topScores[0];

      expect(typeof entry.fid).toBe('bigint');
      expect(typeof entry.player).toBe('string');
      expect(typeof entry.score).toBe('bigint');
      expect(typeof entry.timestamp).toBe('bigint');
      expect(typeof entry.completed).toBe('boolean');
    }
  });

  test('leaderboard entries should have valid addresses', async () => {
    const topScores = await getJackpotLeaderboard(5);

    if (topScores.length > 0) {
      for (const entry of topScores) {
        expect(entry.player).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    }
  });

  test('leaderboard should be sorted by score descending', async () => {
    const topScores = await getJackpotLeaderboard(10);

    if (topScores.length > 1) {
      for (let i = 0; i < topScores.length - 1; i++) {
        // Each score should be >= next score
        expect(topScores[i].score).toBeGreaterThanOrEqual(topScores[i + 1].score);
      }
    }
  });

  test('can fetch different leaderboard limits', async () => {
    const top5 = await getJackpotLeaderboard(5);
    const top10 = await getJackpotLeaderboard(10);

    expect(top5.length).toBeLessThanOrEqual(5);
    expect(top10.length).toBeLessThanOrEqual(10);
  });

  test('sessionCount should be non-negative', async () => {
    const count = await publicClient.readContract({
      address: JACKPOT_CONTRACT_ADDRESS,
      abi: [
        {
          inputs: [],
          name: 'sessionCount',
          outputs: [{ type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ] as const,
      functionName: 'sessionCount',
    });

    expect(typeof count).toBe('bigint');
    expect(count).toBeGreaterThanOrEqual(0n);
  });

  test('getLeaderboardSize should return valid size', async () => {
    const size = await publicClient.readContract({
      address: JACKPOT_CONTRACT_ADDRESS,
      abi: [
        {
          inputs: [],
          name: 'getLeaderboardSize',
          outputs: [{ type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ] as const,
      functionName: 'getLeaderboardSize',
    });

    expect(typeof size).toBe('bigint');
    expect(size).toBeGreaterThanOrEqual(0n);
  });

  test('can read leaderboard multiple times consistently', async () => {
    const leaderboard1 = await getJackpotLeaderboard(5);
    const leaderboard2 = await getJackpotLeaderboard(5);

    expect(leaderboard1.length).toBe(leaderboard2.length);

    if (leaderboard1.length > 0 && leaderboard2.length > 0) {
      expect(leaderboard1[0].fid).toBe(leaderboard2[0].fid);
      expect(leaderboard1[0].score).toBe(leaderboard2[0].score);
    }
  });

  test('contract bytecode should exist', async () => {
    const bytecode = await publicClient.getBytecode({
      address: JACKPOT_CONTRACT_ADDRESS,
    });

    expect(bytecode).toBeDefined();
    expect(bytecode).not.toBe('0x');
    expect(bytecode?.length).toBeGreaterThan(2);
  });

  test('completed sessions should be marked as completed', async () => {
    const topScores = await getJackpotLeaderboard(10);

    if (topScores.length > 0) {
      // Sessions with scores should be completed
      const sessionsWithScores = topScores.filter(s => s.score > 0n);

      for (const session of sessionsWithScores) {
        expect(session.completed).toBe(true);
      }
    }
  });

  test('scores should be non-negative', async () => {
    const topScores = await getJackpotLeaderboard(10);

    for (const entry of topScores) {
      expect(entry.score).toBeGreaterThanOrEqual(0n);
    }
  });

  test('timestamps should be in valid range', async () => {
    const topScores = await getJackpotLeaderboard(10);

    const now = BigInt(Math.floor(Date.now() / 1000));

    for (const entry of topScores) {
      if (entry.timestamp > 0n) {
        // Timestamp should be in the past
        expect(entry.timestamp).toBeLessThanOrEqual(now);

        // Timestamp should be after 2020 (reasonable sanity check)
        const year2020 = BigInt(1577836800); // Jan 1, 2020
        expect(entry.timestamp).toBeGreaterThan(year2020);
      }
    }
  });
});
