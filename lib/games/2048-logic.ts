// 2048 Game Logic - Pure TypeScript implementation

export type TileValue = 0 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192;
export type Grid = TileValue[][];
export type Direction = 'up' | 'down' | 'left' | 'right';

const GRID_SIZE = 4;

// Create empty 4x4 grid
export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

// Get all empty cell positions
function getEmptyCells(grid: Grid): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

// Add random tile (90% = 2, 10% = 4)
export function addRandomTile(grid: Grid): Grid {
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length === 0) return grid;

  const { row, col} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;

  const newGrid = grid.map(r => [...r]);
  newGrid[row][col] = value as TileValue;
  return newGrid;
}

// Initialize new game with 2 random tiles
export function initializeGame(): { grid: Grid; score: number } {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return { grid, score: 0 };
}

// Merge a single line to the left
function mergeLineLeft(line: TileValue[]): { newLine: TileValue[]; score: number } {
  const nonZero = line.filter(val => val !== 0);
  const merged: TileValue[] = [];
  let score = 0;
  let i = 0;

  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const mergedValue = (nonZero[i] * 2) as TileValue;
      merged.push(mergedValue);
      score += mergedValue;
      i += 2;
    } else {
      merged.push(nonZero[i]);
      i += 1;
    }
  }

  while (merged.length < GRID_SIZE) {
    merged.push(0);
  }

  return { newLine: merged, score };
}

// Merge a single line to the right
function mergeLineRight(line: TileValue[]): { newLine: TileValue[]; score: number } {
  const nonZero = line.filter(val => val !== 0);
  const merged: TileValue[] = [];
  let score = 0;
  let i = nonZero.length - 1;

  while (i >= 0) {
    if (i - 1 >= 0 && nonZero[i] === nonZero[i - 1]) {
      const mergedValue = (nonZero[i] * 2) as TileValue;
      merged.unshift(mergedValue);
      score += mergedValue;
      i -= 2;
    } else {
      merged.unshift(nonZero[i]);
      i -= 1;
    }
  }

  while (merged.length < GRID_SIZE) {
    merged.unshift(0);
  }

  return { newLine: merged, score };
}

// Check if two grids are equal
function gridsEqual(grid1: Grid, grid2: Grid): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid1[row][col] !== grid2[row][col]) return false;
    }
  }
  return true;
}

// Execute move in any direction - direct implementation (no rotation)
export function move(grid: Grid, direction: Direction): {
  newGrid: Grid;
  score: number;
  moved: boolean;
} {
  const newGrid: Grid = createEmptyGrid();
  let totalScore = 0;

  switch (direction) {
    case 'left':
      // Move each row to the left
      for (let row = 0; row < GRID_SIZE; row++) {
        const { newLine, score } = mergeLineLeft(grid[row]);
        newGrid[row] = newLine;
        totalScore += score;
      }
      break;

    case 'right':
      // Move each row to the right
      for (let row = 0; row < GRID_SIZE; row++) {
        const { newLine, score } = mergeLineRight(grid[row]);
        newGrid[row] = newLine;
        totalScore += score;
      }
      break;

    case 'up':
      // Move each column upward
      for (let col = 0; col < GRID_SIZE; col++) {
        const column = [grid[0][col], grid[1][col], grid[2][col], grid[3][col]];
        const { newLine, score } = mergeLineLeft(column);
        for (let row = 0; row < GRID_SIZE; row++) {
          newGrid[row][col] = newLine[row];
        }
        totalScore += score;
      }
      break;

    case 'down':
      // Move each column downward
      for (let col = 0; col < GRID_SIZE; col++) {
        const column = [grid[0][col], grid[1][col], grid[2][col], grid[3][col]];
        const { newLine, score } = mergeLineRight(column);
        for (let row = 0; row < GRID_SIZE; row++) {
          newGrid[row][col] = newLine[row];
        }
        totalScore += score;
      }
      break;
  }

  // Check if anything moved
  const moved = !gridsEqual(grid, newGrid);

  return { newGrid, score: totalScore, moved };
}

// Check if 2048 tile exists
export function hasWon(grid: Grid): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 2048) return true;
    }
  }
  return false;
}

// Check if any valid moves exist
export function hasValidMoves(grid: Grid): boolean {
  // Check for empty cells
  if (getEmptyCells(grid).length > 0) return true;

  // Check for adjacent matching tiles (horizontal and vertical)
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const current = grid[row][col];

      // Check right neighbor
      if (col < GRID_SIZE - 1 && grid[row][col + 1] === current) return true;

      // Check down neighbor
      if (row < GRID_SIZE - 1 && grid[row + 1][col] === current) return true;
    }
  }

  return false;
}

// Get tile color configuration
export const TILE_COLORS: Record<TileValue, { bgColor: string; textColor: string; gradient?: string; shadow?: string }> = {
  0: { bgColor: '#cdc1b4', textColor: 'transparent' },
  2: { bgColor: '#eee4da', textColor: '#776e65' },
  4: { bgColor: '#ede0c8', textColor: '#776e65' },
  8: { bgColor: '#f2b179', textColor: '#ffffff' },
  16: { bgColor: '#f59563', textColor: '#ffffff' },
  32: { bgColor: '#f67c5f', textColor: '#ffffff' },
  64: { bgColor: '#f65e3b', textColor: '#ffffff' },
  128: { bgColor: '#edcf72', textColor: '#ffffff' },
  256: { bgColor: '#edcc61', textColor: '#ffffff' },
  512: { bgColor: '#edc850', textColor: '#ffffff' },
  1024: { bgColor: '#edc53f', textColor: '#ffffff' },
  2048: {
    bgColor: '#FCFF52',
    textColor: '#1a1a1a',
    gradient: 'linear-gradient(135deg, #FCFF52 0%, #fde047 50%, #facc15 100%)',
    shadow: '0 0 20px rgba(252, 255, 82, 0.6), 0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  4096: { bgColor: '#3c3a32', textColor: '#ffffff' },
  8192: { bgColor: '#3c3a32', textColor: '#ffffff' },
};
