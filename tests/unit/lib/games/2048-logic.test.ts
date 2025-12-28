import { describe, test, expect } from 'vitest';
import {
  createEmptyGrid,
  addRandomTile,
  initializeGame,
  move,
  hasWon,
  hasValidMoves,
  type Grid,
  type Direction,
} from '@/lib/games/2048-logic';

describe('2048 Game Logic', () => {
  describe('createEmptyGrid', () => {
    test('creates 4x4 grid', () => {
      const grid = createEmptyGrid();
      expect(grid).toHaveLength(4);
      grid.forEach(row => {
        expect(row).toHaveLength(4);
      });
    });

    test('all cells are initially zero', () => {
      const grid = createEmptyGrid();
      grid.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBe(0);
        });
      });
    });
  });

  describe('addRandomTile', () => {
    test('adds a tile to empty grid', () => {
      const grid = createEmptyGrid();
      const newGrid = addRandomTile(grid);

      let tilesCount = 0;
      newGrid.forEach(row => {
        row.forEach(cell => {
          if (cell !== 0) tilesCount++;
        });
      });

      expect(tilesCount).toBe(1);
    });

    test('added tile is either 2 or 4', () => {
      const grid = createEmptyGrid();
      const newGrid = addRandomTile(grid);

      let foundValue = 0;
      newGrid.forEach(row => {
        row.forEach(cell => {
          if (cell !== 0) foundValue = cell;
        });
      });

      expect([2, 4]).toContain(foundValue);
    });

    test('does not modify full grid', () => {
      const fullGrid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4],
        [2, 4, 8, 16],
      ];

      const newGrid = addRandomTile(fullGrid);
      expect(newGrid).toEqual(fullGrid);
    });

    test('does not mutate original grid', () => {
      const grid = createEmptyGrid();
      const originalGrid = grid.map(row => [...row]);
      addRandomTile(grid);

      expect(grid).toEqual(originalGrid);
    });
  });

  describe('initializeGame', () => {
    test('returns grid with exactly 2 tiles', () => {
      const { grid } = initializeGame();

      let tilesCount = 0;
      grid.forEach(row => {
        row.forEach(cell => {
          if (cell !== 0) tilesCount++;
        });
      });

      expect(tilesCount).toBe(2);
    });

    test('returns initial score of 0', () => {
      const { score } = initializeGame();
      expect(score).toBe(0);
    });

    test('all tiles are either 2 or 4', () => {
      const { grid } = initializeGame();

      grid.forEach(row => {
        row.forEach(cell => {
          if (cell !== 0) {
            expect([2, 4]).toContain(cell);
          }
        });
      });
    });
  });

  describe('move - left', () => {
    test('moves tiles to the left', () => {
      const grid: Grid = [
        [0, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, moved } = move(grid, 'left');

      expect(newGrid[0]).toEqual([2, 0, 0, 0]);
      expect(moved).toBe(true);
    });

    test('merges adjacent equal tiles', () => {
      const grid: Grid = [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, score } = move(grid, 'left');

      expect(newGrid[0]).toEqual([4, 0, 0, 0]);
      expect(score).toBe(4);
    });

    test('merges multiple pairs in one row', () => {
      const grid: Grid = [
        [2, 2, 4, 4],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, score } = move(grid, 'left');

      expect(newGrid[0]).toEqual([4, 8, 0, 0]);
      expect(score).toBe(12); // 4 + 8
    });

    test('does not merge non-adjacent tiles', () => {
      const grid: Grid = [
        [2, 0, 2, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, score } = move(grid, 'left');

      expect(newGrid[0]).toEqual([4, 0, 0, 0]);
      expect(score).toBe(4);
    });

    test('merges only once per move (no chain merges)', () => {
      const grid: Grid = [
        [2, 2, 4, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid } = move(grid, 'left');

      // Should be [4, 4, 0, 0], not [8, 0, 0, 0]
      expect(newGrid[0]).toEqual([4, 4, 0, 0]);
    });

    test('returns moved=false when no movement possible', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { moved } = move(grid, 'left');
      expect(moved).toBe(false);
    });
  });

  describe('move - right', () => {
    test('moves tiles to the right', () => {
      const grid: Grid = [
        [0, 0, 2, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, moved } = move(grid, 'right');

      expect(newGrid[0]).toEqual([0, 0, 0, 2]);
      expect(moved).toBe(true);
    });

    test('merges adjacent equal tiles from right', () => {
      const grid: Grid = [
        [0, 0, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, score } = move(grid, 'right');

      expect(newGrid[0]).toEqual([0, 0, 0, 4]);
      expect(score).toBe(4);
    });

    test('merges multiple pairs from right', () => {
      const grid: Grid = [
        [2, 2, 4, 4],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, score } = move(grid, 'right');

      expect(newGrid[0]).toEqual([0, 0, 4, 8]);
      expect(score).toBe(12);
    });
  });

  describe('move - up', () => {
    test('moves tiles upward', () => {
      const grid: Grid = [
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, moved } = move(grid, 'up');

      expect(newGrid[0][0]).toBe(2);
      expect(newGrid[1][0]).toBe(0);
      expect(moved).toBe(true);
    });

    test('merges tiles vertically', () => {
      const grid: Grid = [
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, score } = move(grid, 'up');

      expect(newGrid[0][0]).toBe(4);
      expect(newGrid[1][0]).toBe(0);
      expect(score).toBe(4);
    });

    test('handles multiple columns', () => {
      const grid: Grid = [
        [2, 4, 0, 0],
        [2, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, score } = move(grid, 'up');

      expect(newGrid[0]).toEqual([4, 8, 0, 0]);
      expect(score).toBe(12);
    });
  });

  describe('move - down', () => {
    test('moves tiles downward', () => {
      const grid: Grid = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const { newGrid, moved } = move(grid, 'down');

      expect(newGrid[3][0]).toBe(2);
      expect(newGrid[0][0]).toBe(0);
      expect(moved).toBe(true);
    });

    test('merges tiles vertically from bottom', () => {
      const grid: Grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [2, 0, 0, 0],
      ];

      const { newGrid, score } = move(grid, 'down');

      expect(newGrid[3][0]).toBe(4);
      expect(newGrid[2][0]).toBe(0);
      expect(score).toBe(4);
    });
  });

  describe('hasWon', () => {
    test('returns true when 2048 tile exists', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4],
        [2, 4, 8, 16],
      ];

      expect(hasWon(grid)).toBe(true);
    });

    test('returns false when no 2048 tile', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 4, 8],
        [2, 4, 8, 16],
      ];

      expect(hasWon(grid)).toBe(false);
    });

    test('returns false for empty grid', () => {
      const grid = createEmptyGrid();
      expect(hasWon(grid)).toBe(false);
    });

    test('returns true even with tiles larger than 2048', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [2, 4, 8, 16],
      ];

      expect(hasWon(grid)).toBe(true);
    });
  });

  describe('hasValidMoves', () => {
    test('returns true when empty cells exist', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 0, 256],
        [512, 1024, 2048, 4],
        [2, 4, 8, 16],
      ];

      expect(hasValidMoves(grid)).toBe(true);
    });

    test('returns true when adjacent tiles can merge horizontally', () => {
      const grid: Grid = [
        [2, 2, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4],
        [8, 4, 16, 32],
      ];

      expect(hasValidMoves(grid)).toBe(true);
    });

    test('returns true when adjacent tiles can merge vertically', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [2, 64, 128, 256],
        [512, 1024, 2048, 4],
        [8, 4, 16, 32],
      ];

      expect(hasValidMoves(grid)).toBe(true);
    });

    test('returns false when no moves possible (game over)', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4],
        [8, 16, 32, 64],
      ];

      expect(hasValidMoves(grid)).toBe(false);
    });

    test('returns true for empty grid', () => {
      const grid = createEmptyGrid();
      expect(hasValidMoves(grid)).toBe(true);
    });

    test('returns true for nearly full grid with one merge option', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4],
        [8, 16, 2048, 32],
      ];

      // 2048 next to 2048 vertically (column 2, rows 2 and 3) can merge
      expect(hasValidMoves(grid)).toBe(true);
    });
  });

  describe('Edge cases and complex scenarios', () => {
    test('handles grid with all same values', () => {
      const grid: Grid = [
        [2, 2, 2, 2],
        [2, 2, 2, 2],
        [2, 2, 2, 2],
        [2, 2, 2, 2],
      ];

      const { newGrid, score } = move(grid, 'left');

      expect(newGrid).toEqual([
        [4, 4, 0, 0],
        [4, 4, 0, 0],
        [4, 4, 0, 0],
        [4, 4, 0, 0],
      ]);
      expect(score).toBe(32); // 8 merges of 4 each
    });

    test('calculates correct score for complex merge', () => {
      const grid: Grid = [
        [2, 2, 4, 4],
        [8, 8, 16, 16],
        [32, 32, 64, 64],
        [128, 128, 256, 256],
      ];

      const { score } = move(grid, 'left');

      // Row 1: 4 + 8 = 12
      // Row 2: 16 + 32 = 48
      // Row 3: 64 + 128 = 192
      // Row 4: 256 + 512 = 768
      // Total: 1020
      expect(score).toBe(1020);
    });

    test('move does not mutate original grid', () => {
      const grid: Grid = [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      const originalGrid = grid.map(row => [...row]);
      move(grid, 'left');

      expect(grid).toEqual(originalGrid);
    });
  });
});
