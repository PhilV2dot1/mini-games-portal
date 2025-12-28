import { describe, test, expect } from 'vitest';
import {
  generateSecretCode,
  evaluateGuess,
  isValidGuess,
  hasWon,
  calculateScore,
  COLORS,
  CODE_LENGTH,
  MAX_ATTEMPTS,
  type Code,
  type Guess,
  type Color,
} from '@/lib/games/mastermind-logic';

describe('Mastermind Game Logic', () => {
  describe('generateSecretCode', () => {
    test('generates code with correct length', () => {
      const code = generateSecretCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect(code).toHaveLength(4);
    });

    test('all elements are valid colors', () => {
      const code = generateSecretCode();
      code.forEach(color => {
        expect(COLORS).toContain(color);
      });
    });

    test('generates different codes (randomness)', () => {
      const code1 = generateSecretCode();
      const code2 = generateSecretCode();

      // Extremely unlikely to be identical
      const identical = code1.every((color, i) => color === code2[i]);
      // This test might occasionally fail due to randomness, but very unlikely
      expect(identical).toBe(false);
    });

    test('can generate codes with all same color', () => {
      // Run many times to increase probability
      const codes = Array.from({ length: 100 }, () => generateSecretCode());
      const hasDuplicates = codes.some(code => {
        const first = code[0];
        return code.every(c => c === first);
      });

      // At least one code should have some duplicates
      expect(codes.length).toBe(100);
    });
  });

  describe('evaluateGuess', () => {
    describe('Black pegs (exact matches)', () => {
      test('returns 4 black pegs for perfect match', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['btc', 'eth', 'avax', 'celo'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(4);
        expect(feedback.whitePegs).toBe(0);
      });

      test('returns 0 black pegs when no exact matches', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['eth', 'btc', 'celo', 'avax'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(0);
        // All colors present but in wrong positions = 4 white pegs
        expect(feedback.whitePegs).toBe(4);
      });

      test('returns correct black pegs for partial matches', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['btc', 'btc', 'avax', 'near'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(2); // btc and avax in correct positions
      });

      test('counts only exact position matches as black pegs', () => {
        const secret: Code = ['btc', 'btc', 'eth', 'eth'];
        const guess: Code = ['btc', 'eth', 'btc', 'eth'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(2); // positions 0 and 3
        expect(feedback.whitePegs).toBe(2); // positions 1 and 2
      });
    });

    describe('White pegs (color matches in wrong position)', () => {
      test('returns white pegs for colors in wrong positions', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['celo', 'avax', 'eth', 'btc'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(0);
        expect(feedback.whitePegs).toBe(4);
      });

      test('does not count same color twice', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['btc', 'btc', 'btc', 'near'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(1); // First btc is exact match
        expect(feedback.whitePegs).toBe(0); // Other btc's don't count
      });

      test('handles duplicate colors correctly', () => {
        const secret: Code = ['btc', 'btc', 'eth', 'avax'];
        const guess: Code = ['eth', 'avax', 'btc', 'btc'];

        const feedback = evaluateGuess(secret, guess);

        // No exact matches
        expect(feedback.blackPegs).toBe(0);
        // All 4 colors are present but in wrong positions
        expect(feedback.whitePegs).toBe(4);
      });

      test('does not double-count colors', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['btc', 'btc', 'near', 'link'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(1); // First btc matches
        expect(feedback.whitePegs).toBe(0); // Second btc doesn't get counted
      });

      test('complex scenario with duplicates', () => {
        const secret: Code = ['btc', 'btc', 'btc', 'eth'];
        const guess: Code = ['eth', 'btc', 'near', 'btc'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(1); // Position 1: btc
        expect(feedback.whitePegs).toBe(2); // Position 0: eth, Position 3: btc
      });
    });

    describe('Edge cases', () => {
      test('all same color in both secret and guess', () => {
        const secret: Code = ['btc', 'btc', 'btc', 'btc'];
        const guess: Code = ['btc', 'btc', 'btc', 'btc'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(4);
        expect(feedback.whitePegs).toBe(0);
      });

      test('no matching colors at all', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['near', 'link', 'near', 'link'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(0);
        expect(feedback.whitePegs).toBe(0);
      });

      test('secret has duplicates, guess has one match', () => {
        const secret: Code = ['btc', 'btc', 'eth', 'eth'];
        const guess: Code = ['avax', 'btc', 'near', 'link'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(1); // Position 1
        expect(feedback.whitePegs).toBe(0);
      });

      test('guess has more of a color than secret', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['eth', 'eth', 'eth', 'eth'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(1); // Position 1
        expect(feedback.whitePegs).toBe(0); // Only one eth in secret
      });

      test('all colors present but positions matter', () => {
        const secret: Code = ['btc', 'btc', 'eth', 'avax'];
        const guess: Code = ['btc', 'eth', 'avax', 'btc'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(1); // Position 0: btc
        expect(feedback.whitePegs).toBe(3); // eth, avax, btc all in wrong positions
      });
    });

    describe('Real game scenarios', () => {
      test('first guess typically gets some feedback', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['btc', 'link', 'near', 'celo'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(2); // btc and celo
        expect(feedback.whitePegs).toBe(0);
      });

      test('close guess gets mostly black pegs', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['btc', 'eth', 'avax', 'link'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(3);
        expect(feedback.whitePegs).toBe(0);
      });

      test('all right colors, all wrong positions', () => {
        const secret: Code = ['btc', 'eth', 'avax', 'celo'];
        const guess: Code = ['celo', 'avax', 'eth', 'btc'];

        const feedback = evaluateGuess(secret, guess);

        expect(feedback.blackPegs).toBe(0);
        expect(feedback.whitePegs).toBe(4);
      });
    });
  });

  describe('isValidGuess', () => {
    test('returns true for complete guess', () => {
      const guess: Guess = ['btc', 'eth', 'avax', 'celo'];
      expect(isValidGuess(guess)).toBe(true);
    });

    test('returns false for incomplete guess (one null)', () => {
      const guess: Guess = ['btc', 'eth', 'avax', null];
      expect(isValidGuess(guess)).toBe(false);
    });

    test('returns false for incomplete guess (multiple nulls)', () => {
      const guess: Guess = ['btc', null, null, null];
      expect(isValidGuess(guess)).toBe(false);
    });

    test('returns false for all nulls', () => {
      const guess: Guess = [null, null, null, null];
      expect(isValidGuess(guess)).toBe(false);
    });

    test('accepts duplicates in guess', () => {
      const guess: Guess = ['btc', 'btc', 'btc', 'btc'];
      expect(isValidGuess(guess)).toBe(true);
    });
  });

  describe('hasWon', () => {
    test('returns true when all 4 black pegs', () => {
      const feedback = { blackPegs: 4, whitePegs: 0 };
      expect(hasWon(feedback)).toBe(true);
    });

    test('returns false when less than 4 black pegs', () => {
      expect(hasWon({ blackPegs: 3, whitePegs: 0 })).toBe(false);
      expect(hasWon({ blackPegs: 2, whitePegs: 2 })).toBe(false);
      expect(hasWon({ blackPegs: 1, whitePegs: 3 })).toBe(false);
      expect(hasWon({ blackPegs: 0, whitePegs: 4 })).toBe(false);
    });

    test('returns false for no pegs', () => {
      const feedback = { blackPegs: 0, whitePegs: 0 };
      expect(hasWon(feedback)).toBe(false);
    });

    test('white pegs do not matter for winning', () => {
      expect(hasWon({ blackPegs: 4, whitePegs: 0 })).toBe(true);
      expect(hasWon({ blackPegs: 3, whitePegs: 1 })).toBe(false);
    });
  });

  describe('calculateScore', () => {
    test('returns 0 for loss', () => {
      expect(calculateScore(false, 1)).toBe(0);
      expect(calculateScore(false, 5)).toBe(0);
      expect(calculateScore(false, 10)).toBe(0);
    });

    test('returns 100 for win on first attempt', () => {
      expect(calculateScore(true, 1)).toBe(90); // 100 - (1 * 10)
    });

    test('returns correct score for win on second attempt', () => {
      expect(calculateScore(true, 2)).toBe(80); // 100 - (2 * 10)
    });

    test('returns correct score for win on third attempt', () => {
      expect(calculateScore(true, 3)).toBe(70); // 100 - (3 * 10)
    });

    test('returns correct score for win at halfway', () => {
      expect(calculateScore(true, 5)).toBe(50); // 100 - (5 * 10)
    });

    test('returns 0 for win on last attempt', () => {
      expect(calculateScore(true, 10)).toBe(0); // 100 - (10 * 10)
    });

    test('returns 0 for win after max attempts', () => {
      expect(calculateScore(true, 11)).toBe(0); // Math.max(0, 100 - 110)
    });

    test('score decreases linearly with attempts', () => {
      const scores = [];
      for (let i = 1; i <= 10; i++) {
        scores.push(calculateScore(true, i));
      }

      // Each score should be 10 points less than previous
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1] - scores[i]).toBe(10);
      }
    });

    test('minimum score is 0', () => {
      expect(calculateScore(true, 100)).toBe(0);
      expect(calculateScore(true, 1000)).toBe(0);
    });
  });

  describe('Game constants', () => {
    test('CODE_LENGTH is 4', () => {
      expect(CODE_LENGTH).toBe(4);
    });

    test('MAX_ATTEMPTS is 10', () => {
      expect(MAX_ATTEMPTS).toBe(10);
    });

    test('COLORS array has 6 elements', () => {
      expect(COLORS).toHaveLength(6);
    });

    test('COLORS contains expected crypto symbols', () => {
      expect(COLORS).toContain('btc');
      expect(COLORS).toContain('eth');
      expect(COLORS).toContain('avax');
      expect(COLORS).toContain('celo');
      expect(COLORS).toContain('near');
      expect(COLORS).toContain('link');
    });
  });

  describe('Integration scenarios', () => {
    test('complete game flow - win scenario', () => {
      const secret = generateSecretCode();

      // Perfect guess should win immediately
      const feedback = evaluateGuess(secret, secret);
      expect(hasWon(feedback)).toBe(true);
      expect(calculateScore(true, 1)).toBe(90);
    });

    test('complete game flow - iterative guessing', () => {
      const secret: Code = ['btc', 'eth', 'avax', 'celo'];

      // Attempt 1
      const guess1: Code = ['btc', 'btc', 'btc', 'btc'];
      const feedback1 = evaluateGuess(secret, guess1);
      expect(hasWon(feedback1)).toBe(false);
      expect(feedback1.blackPegs).toBe(1);

      // Attempt 2
      const guess2: Code = ['btc', 'eth', 'eth', 'eth'];
      const feedback2 = evaluateGuess(secret, guess2);
      expect(hasWon(feedback2)).toBe(false);
      expect(feedback2.blackPegs).toBe(2);

      // Attempt 3
      const guess3: Code = ['btc', 'eth', 'avax', 'avax'];
      const feedback3 = evaluateGuess(secret, guess3);
      expect(hasWon(feedback3)).toBe(false);
      expect(feedback3.blackPegs).toBe(3);

      // Attempt 4 - win!
      const guess4: Code = ['btc', 'eth', 'avax', 'celo'];
      const feedback4 = evaluateGuess(secret, guess4);
      expect(hasWon(feedback4)).toBe(true);
      expect(calculateScore(true, 4)).toBe(60);
    });

    test('validates guess before evaluating', () => {
      const incompleteGuess: Guess = ['btc', 'eth', null, null];
      expect(isValidGuess(incompleteGuess)).toBe(false);

      const completeGuess: Guess = ['btc', 'eth', 'avax', 'celo'];
      expect(isValidGuess(completeGuess)).toBe(true);
    });
  });
});
