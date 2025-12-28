import { describe, test, expect } from 'vitest';
import { calculateGamePoints, getStreakBonus } from '@/lib/utils/points';
import type { GameMode } from '@/lib/types';

describe('Points Calculation', () => {
  describe('calculateGamePoints', () => {
    describe('Free mode points', () => {
      test('awards 10 points for a game with no win (draw)', () => {
        expect(calculateGamePoints('free', 'draw')).toBe(10);
      });

      test('awards 10 points for a game with loss', () => {
        expect(calculateGamePoints('free', 'lose')).toBe(10);
      });

      test('awards 35 points for a win (10 base + 25 win bonus)', () => {
        expect(calculateGamePoints('free', 'win')).toBe(35);
      });

      test('awards 10 points for a push', () => {
        expect(calculateGamePoints('free', 'push')).toBe(10);
      });
    });

    describe('On-chain mode points', () => {
      test('awards 25 points for a game with no win (draw)', () => {
        expect(calculateGamePoints('onchain', 'draw')).toBe(25);
      });

      test('awards 25 points for a game with loss', () => {
        expect(calculateGamePoints('onchain', 'lose')).toBe(25);
      });

      test('awards 100 points for a win (25 base + 75 win bonus)', () => {
        expect(calculateGamePoints('onchain', 'win')).toBe(100);
      });

      test('awards 25 points for a push', () => {
        expect(calculateGamePoints('onchain', 'push')).toBe(25);
      });
    });

    describe('Streak bonuses', () => {
      test('awards no bonus with 0 streak', () => {
        expect(calculateGamePoints('free', 'win', 0)).toBe(35);
      });

      test('awards 10% bonus with 1 streak bonus (3-win streak)', () => {
        // Base: 35, With 10% bonus: 35 * 1.1 = 38.5, floored to 38
        expect(calculateGamePoints('free', 'win', 1)).toBe(38);
      });

      test('awards 20% bonus with 2 streak bonuses (6-win streak)', () => {
        // Base: 35, With 20% bonus: 35 * 1.2 = 42
        expect(calculateGamePoints('free', 'win', 2)).toBe(42);
      });

      test('awards 30% bonus with 3 streak bonuses (9-win streak)', () => {
        // Base: 35, With 30% bonus: 35 * 1.3 = 45.5, floored to 45
        expect(calculateGamePoints('free', 'win', 3)).toBe(45);
      });

      test('awards 50% bonus with 5 streak bonuses (15-win streak)', () => {
        // Base: 35, With 50% bonus: 35 * 1.5 = 52.5, floored to 52
        expect(calculateGamePoints('free', 'win', 5)).toBe(52);
      });

      test('awards 100% bonus with 10 streak bonuses (30-win streak)', () => {
        // Base: 35, With 100% bonus: 35 * 2 = 70
        expect(calculateGamePoints('free', 'win', 10)).toBe(70);
      });
    });

    describe('Streak bonuses on-chain', () => {
      test('awards 10% bonus on on-chain win with 1 streak bonus', () => {
        // Base: 100, With 10% bonus: 100 * 1.1 = 110
        expect(calculateGamePoints('onchain', 'win', 1)).toBe(110);
      });

      test('awards 20% bonus on on-chain win with 2 streak bonuses', () => {
        // Base: 100, With 20% bonus: 100 * 1.2 = 120
        expect(calculateGamePoints('onchain', 'win', 2)).toBe(120);
      });

      test('awards 50% bonus on on-chain win with 5 streak bonuses', () => {
        // Base: 100, With 50% bonus: 100 * 1.5 = 150
        expect(calculateGamePoints('onchain', 'win', 5)).toBe(150);
      });
    });

    describe('Streak bonuses on non-win results', () => {
      test('applies streak bonus even on loss', () => {
        // Free mode loss: 10 points, with 10% bonus: 10 * 1.1 = 11
        expect(calculateGamePoints('free', 'lose', 1)).toBe(11);
      });

      test('applies streak bonus even on draw', () => {
        // Free mode draw: 10 points, with 20% bonus: 10 * 1.2 = 12
        expect(calculateGamePoints('free', 'draw', 2)).toBe(12);
      });

      test('applies streak bonus even on push', () => {
        // On-chain push: 25 points, with 10% bonus: 25 * 1.1 = 27.5, floored to 27
        expect(calculateGamePoints('onchain', 'push', 1)).toBe(27);
      });
    });

    describe('Edge cases', () => {
      test('handles negative streak bonus (treated as 0)', () => {
        expect(calculateGamePoints('free', 'win', -1)).toBe(31); // 35 * 0.9 = 31.5 floored to 31
      });

      test('handles very high streak bonus', () => {
        // Base: 35, With 1000% bonus: 35 * 11 = 385
        expect(calculateGamePoints('free', 'win', 100)).toBe(385);
      });

      test('floors decimal results', () => {
        // Free win with 1 streak: 35 * 1.1 = 38.5 → 38
        expect(calculateGamePoints('free', 'win', 1)).toBe(38);
      });
    });
  });

  describe('getStreakBonus', () => {
    test('returns 0 for streak of 0', () => {
      expect(getStreakBonus(0)).toBe(0);
    });

    test('returns 0 for streak of 1', () => {
      expect(getStreakBonus(1)).toBe(0);
    });

    test('returns 0 for streak of 2', () => {
      expect(getStreakBonus(2)).toBe(0);
    });

    test('returns 1 for streak of 3 (first bonus threshold)', () => {
      expect(getStreakBonus(3)).toBe(1);
    });

    test('returns 1 for streak of 4', () => {
      expect(getStreakBonus(4)).toBe(1);
    });

    test('returns 1 for streak of 5', () => {
      expect(getStreakBonus(5)).toBe(1);
    });

    test('returns 2 for streak of 6 (second bonus threshold)', () => {
      expect(getStreakBonus(6)).toBe(2);
    });

    test('returns 3 for streak of 9', () => {
      expect(getStreakBonus(9)).toBe(3);
    });

    test('returns 5 for streak of 15', () => {
      expect(getStreakBonus(15)).toBe(5);
    });

    test('returns 10 for streak of 30', () => {
      expect(getStreakBonus(30)).toBe(10);
    });

    test('returns 33 for streak of 100', () => {
      expect(getStreakBonus(100)).toBe(33);
    });

    test('handles negative streak', () => {
      expect(getStreakBonus(-5)).toBe(-2); // floor(-5/3) = Math.floor(-1.666...) = -2
    });
  });

  describe('Integration: calculateGamePoints with getStreakBonus', () => {
    test('correctly calculates points for 3-win streak', () => {
      const streakBonus = getStreakBonus(3);
      expect(streakBonus).toBe(1);
      expect(calculateGamePoints('free', 'win', streakBonus)).toBe(38);
    });

    test('correctly calculates points for 6-win streak', () => {
      const streakBonus = getStreakBonus(6);
      expect(streakBonus).toBe(2);
      expect(calculateGamePoints('free', 'win', streakBonus)).toBe(42);
    });

    test('correctly calculates points for 9-win streak', () => {
      const streakBonus = getStreakBonus(9);
      expect(streakBonus).toBe(3);
      expect(calculateGamePoints('free', 'win', streakBonus)).toBe(45);
    });

    test('correctly calculates on-chain points for 15-win streak', () => {
      const streakBonus = getStreakBonus(15);
      expect(streakBonus).toBe(5);
      expect(calculateGamePoints('onchain', 'win', streakBonus)).toBe(150);
    });
  });
});
