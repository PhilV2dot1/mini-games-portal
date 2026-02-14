// ========================================
// MAZE GAME LOGIC
// ========================================

// Cell types
export const WALL = 0;
export const PATH = 1;
export const PLAYER = 2;
export const START = 3;
export const EXIT = 4;

export type CellType = typeof WALL | typeof PATH | typeof PLAYER | typeof START | typeof EXIT;
export type Difficulty = "easy" | "medium" | "hard";
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface Position {
  row: number;
  col: number;
}

export interface DifficultyConfig {
  gridSize: number;
  label: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { gridSize: 11, label: "Easy (5×5)" },
  medium: { gridSize: 21, label: "Medium (10×10)" },
  hard: { gridSize: 31, label: "Hard (15×15)" },
};

export type MazeGrid = CellType[][];

/**
 * Generate a maze using iterative DFS (Recursive Backtracking)
 * Odd grid sizes ensure clean wall/path pattern
 */
export function generateMaze(gridSize: number): MazeGrid {
  // Fill with walls
  const grid: MazeGrid = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(WALL)
  );

  // Start carving from (1,1)
  grid[1][1] = PATH;
  const stack: Position[] = [{ row: 1, col: 1 }];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(grid, current, gridSize);

    if (neighbors.length > 0) {
      // Pick random neighbor
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];

      // Carve wall between current and neighbor
      const wallRow = current.row + (next.row - current.row) / 2;
      const wallCol = current.col + (next.col - current.col) / 2;
      grid[wallRow][wallCol] = PATH;
      grid[next.row][next.col] = PATH;

      stack.push(next);
    } else {
      stack.pop();
    }
  }

  // Set start and exit
  grid[1][1] = START;
  grid[gridSize - 2][gridSize - 2] = EXIT;

  return grid;
}

/**
 * Get unvisited neighbors 2 cells away (for maze generation)
 */
function getUnvisitedNeighbors(
  grid: MazeGrid,
  pos: Position,
  gridSize: number
): Position[] {
  const directions = [
    { row: -2, col: 0 },
    { row: 2, col: 0 },
    { row: 0, col: -2 },
    { row: 0, col: 2 },
  ];

  return directions
    .map((d) => ({ row: pos.row + d.row, col: pos.col + d.col }))
    .filter(
      (p) =>
        p.row > 0 &&
        p.row < gridSize - 1 &&
        p.col > 0 &&
        p.col < gridSize - 1 &&
        grid[p.row][p.col] === WALL
    );
}

/**
 * Move player in a direction. Returns new state only if move is valid.
 */
export function movePlayer(
  grid: MazeGrid,
  playerPos: Position,
  direction: Direction
): { grid: MazeGrid; newPos: Position; moved: boolean } {
  const deltas: Record<Direction, Position> = {
    UP: { row: -1, col: 0 },
    DOWN: { row: 1, col: 0 },
    LEFT: { row: 0, col: -1 },
    RIGHT: { row: 0, col: 1 },
  };

  const delta = deltas[direction];
  const newRow = playerPos.row + delta.row;
  const newCol = playerPos.col + delta.col;

  // Check bounds
  if (newRow < 0 || newRow >= grid.length || newCol < 0 || newCol >= grid[0].length) {
    return { grid, newPos: playerPos, moved: false };
  }

  // Check if target cell is walkable
  const targetCell = grid[newRow][newCol];
  if (targetCell === WALL) {
    return { grid, newPos: playerPos, moved: false };
  }

  // Move player
  const newGrid = grid.map((row) => [...row]);

  // Restore old cell (START or PATH)
  newGrid[playerPos.row][playerPos.col] =
    playerPos.row === 1 && playerPos.col === 1 ? START : PATH;

  // Place player at new position (unless it's EXIT — keep EXIT visible)
  if (targetCell !== EXIT) {
    newGrid[newRow][newCol] = PLAYER;
  }

  return { grid: newGrid, newPos: { row: newRow, col: newCol }, moved: true };
}

/**
 * Check if player reached the exit
 */
export function checkWin(playerPos: Position, gridSize: number): boolean {
  return playerPos.row === gridSize - 2 && playerPos.col === gridSize - 2;
}

/**
 * Calculate score based on difficulty, moves, and time
 */
export function calculateScore(
  gridSize: number,
  moves: number,
  timeSeconds: number
): number {
  const navigable = Math.floor(gridSize / 2);
  const optimalMoves = navigable * 2; // rough estimate of shortest path
  const moveScore = Math.max(0, 100 - Math.max(0, moves - optimalMoves) * 2);
  const timeScore = Math.max(0, 100 - timeSeconds * 2);
  return Math.round((moveScore + timeScore) / 2);
}
