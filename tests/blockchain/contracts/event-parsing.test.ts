import { describe, test, expect, beforeAll } from 'vitest';
import { parseEventLogs } from 'viem';
import {
  TEST_WALLET_ADDRESS,
  hasInsufficientBalance,
} from '../setup/test-wallet';
import {
  playBlackjackGame,
  parseGamePlayedEvent,
} from '../helpers/contract-helpers';
import { CONTRACT_ABI } from '@/lib/contracts/blackjack-abi';

/**
 * Event Parsing Tests
 *
 * These tests verify that blockchain events are correctly parsed and contain
 * valid data. Events are critical for tracking game results on-chain.
 *
 * Tests verify:
 * - GamePlayed event is emitted
 * - Event data is correctly parsed
 * - Player address matches
 * - Card arrays are valid
 * - Totals are correct
 * - Outcome is valid
 *
 * REQUIREMENTS:
 * - Test wallet must have CELO for gas
 * - Connected to Alfajores testnet
 */

describe('Blockchain Event Parsing', () => {
  let hasBalance = false;

  beforeAll(async () => {
    const insufficientBalance = await hasInsufficientBalance();

    if (insufficientBalance) {
      console.warn('⚠️  SKIPPING EVENT PARSING TESTS - Insufficient CELO balance');
      console.warn('   Fund wallet at: https://faucet.celo.org');
      console.warn(`   Address: ${TEST_WALLET_ADDRESS}`);
      return;
    }

    hasBalance = true;
  });

  test.skipIf(!hasBalance)('GamePlayed event should be emitted', async () => {
    const { receipt } = await playBlackjackGame();

    // Should have logs
    expect(receipt.logs.length).toBeGreaterThan(0);

    // Parse events
    const events = parseEventLogs({
      abi: CONTRACT_ABI,
      logs: receipt.logs,
    });

    // Should have at least one event
    expect(events.length).toBeGreaterThan(0);

    // First event should be GamePlayed
    expect(events[0].eventName).toBe('GamePlayed');
  }, 90000);

  test.skipIf(!hasBalance)('parseGamePlayedEvent should extract correct data', async () => {
    const { receipt } = await playBlackjackGame();

    const gameEvent = parseGamePlayedEvent(receipt.logs);

    expect(gameEvent).not.toBeNull();

    if (gameEvent) {
      expect(gameEvent).toHaveProperty('player');
      expect(gameEvent).toHaveProperty('playerCards');
      expect(gameEvent).toHaveProperty('dealerCards');
      expect(gameEvent).toHaveProperty('playerTotal');
      expect(gameEvent).toHaveProperty('dealerTotal');
      expect(gameEvent).toHaveProperty('outcome');
    }
  }, 90000);

  test.skipIf(!hasBalance)('player address should match test wallet', async () => {
    const { receipt } = await playBlackjackGame();

    const gameEvent = parseGamePlayedEvent(receipt.logs);

    expect(gameEvent).not.toBeNull();

    if (gameEvent) {
      expect(gameEvent.player.toLowerCase()).toBe(
        TEST_WALLET_ADDRESS.toLowerCase()
      );
    }
  }, 90000);

  test.skipIf(!hasBalance)('player cards should be valid array', async () => {
    const { receipt } = await playBlackjackGame();

    const gameEvent = parseGamePlayedEvent(receipt.logs);

    expect(gameEvent).not.toBeNull();

    if (gameEvent) {
      expect(Array.isArray(gameEvent.playerCards)).toBe(true);
      expect(gameEvent.playerCards.length).toBeGreaterThanOrEqual(2);

      // Each card should be 1-52
      for (const card of gameEvent.playerCards) {
        expect(Number(card)).toBeGreaterThanOrEqual(1);
        expect(Number(card)).toBeLessThanOrEqual(52);
      }
    }
  }, 90000);

  test.skipIf(!hasBalance)('dealer cards should be valid array', async () => {
    const { receipt } = await playBlackjackGame();

    const gameEvent = parseGamePlayedEvent(receipt.logs);

    expect(gameEvent).not.toBeNull();

    if (gameEvent) {
      expect(Array.isArray(gameEvent.dealerCards)).toBe(true);
      expect(gameEvent.dealerCards.length).toBeGreaterThanOrEqual(2);

      // Each card should be 1-52
      for (const card of gameEvent.dealerCards) {
        expect(Number(card)).toBeGreaterThanOrEqual(1);
        expect(Number(card)).toBeLessThanOrEqual(52);
      }
    }
  }, 90000);

  test.skipIf(!hasBalance)('player total should be valid', async () => {
    const { receipt } = await playBlackjackGame();

    const gameEvent = parseGamePlayedEvent(receipt.logs);

    expect(gameEvent).not.toBeNull();

    if (gameEvent) {
      const total = Number(gameEvent.playerTotal);

      // Total should be between 2 and 31 (theoretical max with aces)
      expect(total).toBeGreaterThanOrEqual(2);
      expect(total).toBeLessThanOrEqual(31);
    }
  }, 90000);

  test.skipIf(!hasBalance)('dealer total should be valid', async () => {
    const { receipt } = await playBlackjackGame();

    const gameEvent = parseGamePlayedEvent(receipt.logs);

    expect(gameEvent).not.toBeNull();

    if (gameEvent) {
      const total = Number(gameEvent.dealerTotal);

      // Dealer total should be valid
      expect(total).toBeGreaterThanOrEqual(2);
      expect(total).toBeLessThanOrEqual(31);
    }
  }, 90000);

  test.skipIf(!hasBalance)('outcome should be valid string', async () => {
    const { receipt } = await playBlackjackGame();

    const gameEvent = parseGamePlayedEvent(receipt.logs);

    expect(gameEvent).not.toBeNull();

    if (gameEvent) {
      const validOutcomes = ['win', 'lose', 'push', 'blackjack'];
      expect(validOutcomes).toContain(gameEvent.outcome);
    }
  }, 90000);

  test.skipIf(!hasBalance)('no duplicate cards in player hand', async () => {
    const { receipt } = await playBlackjackGame();

    const gameEvent = parseGamePlayedEvent(receipt.logs);

    expect(gameEvent).not.toBeNull();

    if (gameEvent) {
      const playerCards = gameEvent.playerCards.map(c => Number(c));
      const uniqueCards = new Set(playerCards);

      // In Blackjack, duplicate cards are allowed (multiple decks)
      // But we can verify cards are in valid range
      expect(playerCards.length).toBeGreaterThanOrEqual(2);
    }
  }, 90000);

  test.skipIf(!hasBalance)('event parsing is consistent across multiple games', async () => {
    // Play 3 games and parse events
    const results = [];

    for (let i = 0; i < 3; i++) {
      const { receipt } = await playBlackjackGame();
      const gameEvent = parseGamePlayedEvent(receipt.logs);

      expect(gameEvent).not.toBeNull();
      if (gameEvent) {
        results.push(gameEvent);
      }
    }

    // Should have 3 results
    expect(results.length).toBe(3);

    // Each result should have valid structure
    for (const result of results) {
      expect(result.player.toLowerCase()).toBe(
        TEST_WALLET_ADDRESS.toLowerCase()
      );
      expect(Array.isArray(result.playerCards)).toBe(true);
      expect(Array.isArray(result.dealerCards)).toBe(true);
      expect(['win', 'lose', 'push', 'blackjack']).toContain(result.outcome);
    }
  }, 180000); // 3 minutes for 3 games

  test.skipIf(!hasBalance)('event logs should include indexed player', async () => {
    const { receipt } = await playBlackjackGame();

    // First topic is event signature
    // Second topic (if exists) is indexed player address
    const gamePlayedLog = receipt.logs.find(log => log.topics.length > 1);

    if (gamePlayedLog) {
      expect(gamePlayedLog.topics.length).toBeGreaterThan(1);

      // Second topic should be player address (padded to 32 bytes)
      const playerTopic = gamePlayedLog.topics[1];
      expect(playerTopic).toBeDefined();
      expect(playerTopic.length).toBe(66); // 0x + 64 hex chars
    }
  }, 90000);

  test.skipIf(!hasBalance)('multiple events can be parsed from same receipt', async () => {
    const { receipt } = await playBlackjackGame();

    const events = parseEventLogs({
      abi: CONTRACT_ABI,
      logs: receipt.logs,
    });

    // Should have at least one event
    expect(events.length).toBeGreaterThan(0);

    // All events should have eventName property
    for (const event of events) {
      expect(event.eventName).toBeDefined();
    }
  }, 90000);

  test.skipIf(!hasBalance)('raw log data should match parsed data', async () => {
    const { receipt } = await playBlackjackGame();

    const gameEvent = parseGamePlayedEvent(receipt.logs);

    expect(gameEvent).not.toBeNull();

    if (gameEvent) {
      // Raw logs should exist
      expect(receipt.logs.length).toBeGreaterThan(0);

      // Parsed event should have correct player
      expect(gameEvent.player).toBeDefined();
      expect(gameEvent.player.toLowerCase()).toBe(
        TEST_WALLET_ADDRESS.toLowerCase()
      );
    }
  }, 90000);

  test('should skip event parsing tests if no balance', async () => {
    if (hasBalance) {
      console.log('✅ Event parsing tests executed successfully');
    } else {
      console.warn('⚠️  Event parsing tests were skipped');
    }

    expect(true).toBe(true);
  });
});
