import { describe, test, expect } from 'vitest';
import {
  createShuffledDeck,
  convertToCard,
  determineWinner,
  type Card,
  type Outcome,
} from '@/lib/games/blackjack-cards';

describe('Blackjack Card Logic', () => {
  describe('createShuffledDeck', () => {
    test('creates deck with 52 cards', () => {
      const deck = createShuffledDeck();
      expect(deck).toHaveLength(52);
    });

    test('deck contains all four suits', () => {
      const deck = createShuffledDeck();
      const suits = deck.map(card => card.suit);
      expect(suits).toContain('♠');
      expect(suits).toContain('♥');
      expect(suits).toContain('♦');
      expect(suits).toContain('♣');
    });

    test('deck contains all values from 1 to 13', () => {
      const deck = createShuffledDeck();
      const values = deck.map(card => card.value);
      for (let i = 1; i <= 13; i++) {
        expect(values).toContain(i);
      }
    });

    test('each suit has 13 cards', () => {
      const deck = createShuffledDeck();
      const suitCounts = {
        '♠': 0,
        '♥': 0,
        '♦': 0,
        '♣': 0,
      };

      deck.forEach(card => {
        suitCounts[card.suit]++;
      });

      expect(suitCounts['♠']).toBe(13);
      expect(suitCounts['♥']).toBe(13);
      expect(suitCounts['♦']).toBe(13);
      expect(suitCounts['♣']).toBe(13);
    });

    test('shuffles cards (decks are not identical)', () => {
      const deck1 = createShuffledDeck();
      const deck2 = createShuffledDeck();

      // It's extremely unlikely that two shuffled decks are identical
      // Check if at least one card is in a different position
      const isDifferent = deck1.some((card, index) =>
        card.value !== deck2[index].value || card.suit !== deck2[index].suit
      );

      expect(isDifferent).toBe(true);
    });

    test('all cards have correct display values', () => {
      const deck = createShuffledDeck();
      const validDisplays = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

      deck.forEach(card => {
        expect(validDisplays).toContain(card.display);
      });
    });
  });

  describe('convertToCard', () => {
    test('converts value 1 to Ace of Spades', () => {
      const card = convertToCard(1);
      expect(card.value).toBe(1);
      expect(card.suit).toBe('♠');
      expect(card.display).toBe('A');
    });

    test('converts value 13 to King of Spades', () => {
      const card = convertToCard(13);
      expect(card.value).toBe(13);
      expect(card.suit).toBe('♠');
      expect(card.display).toBe('K');
    });

    test('converts value 14 to Ace of Hearts', () => {
      const card = convertToCard(14);
      expect(card.value).toBe(1);
      expect(card.suit).toBe('♥');
      expect(card.display).toBe('A');
    });

    test('converts value 27 to Ace of Diamonds', () => {
      const card = convertToCard(27);
      expect(card.value).toBe(1);
      expect(card.suit).toBe('♦');
      expect(card.display).toBe('A');
    });

    test('converts value 40 to Ace of Clubs', () => {
      const card = convertToCard(40);
      expect(card.value).toBe(1);
      expect(card.suit).toBe('♣');
      expect(card.display).toBe('A');
    });

    test('converts value 52 to King of Clubs', () => {
      const card = convertToCard(52);
      expect(card.value).toBe(13);
      expect(card.suit).toBe('♣');
      expect(card.display).toBe('K');
    });

    test('handles all 52 card values correctly', () => {
      for (let i = 1; i <= 52; i++) {
        const card = convertToCard(i);
        expect(card.value).toBeGreaterThanOrEqual(1);
        expect(card.value).toBeLessThanOrEqual(13);
        expect(['♠', '♥', '♦', '♣']).toContain(card.suit);
        expect(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']).toContain(card.display);
      }
    });

    test('value matches display for number cards', () => {
      const card5 = convertToCard(5);
      expect(card5.value).toBe(5);
      expect(card5.display).toBe('5');

      const card10 = convertToCard(10);
      expect(card10.value).toBe(10);
      expect(card10.display).toBe('10');
    });
  });

  describe('determineWinner', () => {
    describe('Player bust (> 21)', () => {
      test('player busts with 22, dealer has 18 - player loses', () => {
        expect(determineWinner(22, 18, false)).toBe('lose');
      });

      test('player busts with 25, dealer has 20 - player loses', () => {
        expect(determineWinner(25, 20, false)).toBe('lose');
      });

      test('player busts, dealer also busts - player still loses', () => {
        expect(determineWinner(22, 23, false)).toBe('lose');
      });
    });

    describe('Blackjack (21 with 2 cards)', () => {
      test('player has blackjack (21, 2 cards), dealer has 20 - blackjack', () => {
        expect(determineWinner(21, 20, true)).toBe('blackjack');
      });

      test('player has blackjack, dealer has 21 (not blackjack) - push', () => {
        expect(determineWinner(21, 21, true)).toBe('push');
      });

      test('player has blackjack, dealer has 18 - blackjack', () => {
        expect(determineWinner(21, 18, true)).toBe('blackjack');
      });

      test('player has 21 with more than 2 cards - not blackjack', () => {
        // isTwoCards = false means it's not a natural blackjack
        expect(determineWinner(21, 20, false)).toBe('win');
      });
    });

    describe('Dealer bust', () => {
      test('dealer busts with 22, player has 18 - player wins', () => {
        expect(determineWinner(18, 22, false)).toBe('win');
      });

      test('dealer busts with 25, player has 15 - player wins', () => {
        expect(determineWinner(15, 25, false)).toBe('win');
      });
    });

    describe('Player wins with higher total', () => {
      test('player has 20, dealer has 18 - player wins', () => {
        expect(determineWinner(20, 18, false)).toBe('win');
      });

      test('player has 19, dealer has 17 - player wins', () => {
        expect(determineWinner(19, 17, false)).toBe('win');
      });

      test('player has 21, dealer has 20 - player wins', () => {
        expect(determineWinner(21, 20, false)).toBe('win');
      });
    });

    describe('Dealer wins with higher total', () => {
      test('player has 18, dealer has 20 - player loses', () => {
        expect(determineWinner(18, 20, false)).toBe('lose');
      });

      test('player has 15, dealer has 19 - player loses', () => {
        expect(determineWinner(15, 19, false)).toBe('lose');
      });

      test('player has 17, dealer has 21 - player loses', () => {
        expect(determineWinner(17, 21, false)).toBe('lose');
      });
    });

    describe('Push (tie)', () => {
      test('player has 18, dealer has 18 - push', () => {
        expect(determineWinner(18, 18, false)).toBe('push');
      });

      test('player has 20, dealer has 20 - push', () => {
        expect(determineWinner(20, 20, false)).toBe('push');
      });

      test('player has 17, dealer has 17 - push', () => {
        expect(determineWinner(17, 17, false)).toBe('push');
      });

      test('both have 21 (not blackjack) - push', () => {
        expect(determineWinner(21, 21, false)).toBe('push');
      });
    });

    describe('Edge cases', () => {
      test('player has exactly 21 (not blackjack), dealer busts - win', () => {
        expect(determineWinner(21, 22, false)).toBe('win');
      });

      test('player has minimum winning hand 12, dealer has 11 - win', () => {
        expect(determineWinner(12, 11, false)).toBe('win');
      });

      test('player has 1, dealer has 1 - push', () => {
        expect(determineWinner(1, 1, false)).toBe('push');
      });
    });
  });
});
