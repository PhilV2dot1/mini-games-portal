"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { getContractAddress, isGameAvailableOnChain } from "@/lib/contracts/addresses";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "playing" | "won" | "lost" | "processing";
export type Difficulty = "easy" | "medium" | "hard";
export type Direction = "up" | "down" | "left" | "right";
export type CellType = "empty" | "wall" | "arrow" | "exit";

export interface Cell {
  type: CellType;
  arrowDir?: Direction;
}

export interface Enemy {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface PlayerStats {
  games: number;
  wins: number;
  bestMoves: {
    easy: number | null;
    medium: number | null;
    hard: number | null;
  };
}

// ========================================
// DIFFICULTY CONFIG
// ========================================

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { gridSize: number; arrows: [number, number]; enemies: number; walls: number }
> = {
  easy:   { gridSize: 6, arrows: [3, 5],  enemies: 1, walls: 6 },
  medium: { gridSize: 7, arrows: [6, 9],  enemies: 2, walls: 10 },
  hard:   { gridSize: 8, arrows: [10, 15], enemies: 4, walls: 14 },
};

// ========================================
// CONSTANTS
// ========================================

const STATS_KEY = "arrowescapestats";

const DEFAULT_STATS: PlayerStats = {
  games: 0,
  wins: 0,
  bestMoves: { easy: null, medium: null, hard: null },
};

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

// Simple ABI for onchain interaction
const ARROW_ESCAPE_ABI = [
  {
    name: "startGame",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "difficulty", type: "uint8" }],
    outputs: [],
  },
  {
    name: "endGame",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "won", type: "bool" },
      { name: "moves", type: "uint256" },
      { name: "level", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

// ========================================
// LEVEL GENERATION
// ========================================

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function generateLevel(difficulty: Difficulty, level: number): {
  grid: Cell[][];
  playerX: number;
  playerY: number;
  exitX: number;
  exitY: number;
  enemies: Enemy[];
} {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const size = cfg.gridSize;
  const rand = rng(level * 31337 + (difficulty === "easy" ? 0 : difficulty === "medium" ? 1000 : 2000));

  // Initialize empty grid
  const grid: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ type: "empty" as CellType }))
  );

  // Player always at (1,1)
  const playerX = 1;
  const playerY = 1;

  // Exit at far corner — pick from multiple options
  const corners = [
    { x: size - 2, y: size - 2 },
    { x: size - 2, y: 1 },
    { x: 1, y: size - 2 },
  ];
  const exitCorner = corners[Math.floor(rand() * corners.length)];
  const exitX = exitCorner.x;
  const exitY = exitCorner.y;

  // Place walls randomly (avoid player and exit)
  const numWalls = cfg.walls;
  let wallsPlaced = 0;
  let attempts = 0;
  while (wallsPlaced < numWalls && attempts < 200) {
    attempts++;
    const wx = Math.floor(rand() * size);
    const wy = Math.floor(rand() * size);
    if (
      (wx === playerX && wy === playerY) ||
      (wx === exitX && wy === exitY) ||
      grid[wy][wx].type !== "empty"
    ) {
      continue;
    }
    grid[wy][wx] = { type: "wall" };
    wallsPlaced++;
  }

  // BFS to ensure path from player to exit
  function bfs(startX: number, startY: number, targetX: number, targetY: number): boolean {
    const visited = new Set<string>();
    const queue: [number, number][] = [[startX, startY]];
    visited.add(`${startX},${startY}`);
    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      if (cx === targetX && cy === targetY) return true;
      for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited.has(`${nx},${ny}`) && grid[ny][nx].type !== "wall") {
          visited.add(`${nx},${ny}`);
          queue.push([nx, ny]);
        }
      }
    }
    return false;
  }

  // Remove walls that block the only path
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x].type === "wall") {
        grid[y][x] = { type: "empty" };
        if (!bfs(playerX, playerY, exitX, exitY)) {
          // Keep wall removed — path was blocked
        } else {
          grid[y][x] = { type: "wall" };
        }
      }
    }
  }

  // Final BFS to make sure path exists after all removals
  // If still no path, clear all walls on one axis
  if (!bfs(playerX, playerY, exitX, exitY)) {
    for (let i = 0; i < size; i++) {
      grid[playerY][i] = { type: "empty" };
      grid[i][exitX] = { type: "empty" };
    }
  }

  // Place arrows
  const [minArrows, maxArrows] = cfg.arrows;
  const numArrows = minArrows + Math.floor(rand() * (maxArrows - minArrows + 1));
  let arrowsPlaced = 0;
  attempts = 0;
  while (arrowsPlaced < numArrows && attempts < 500) {
    attempts++;
    const ax = Math.floor(rand() * size);
    const ay = Math.floor(rand() * size);
    if (
      (ax === playerX && ay === playerY) ||
      (ax === exitX && ay === exitY) ||
      grid[ay][ax].type !== "empty"
    ) {
      continue;
    }
    const dir = DIRECTIONS[Math.floor(rand() * DIRECTIONS.length)];
    grid[ay][ax] = { type: "arrow", arrowDir: dir };
    arrowsPlaced++;
  }

  // Place exit
  grid[exitY][exitX] = { type: "exit" };

  // Place enemies far from player
  const enemies: Enemy[] = [];
  const numEnemies = cfg.enemies;
  attempts = 0;
  while (enemies.length < numEnemies && attempts < 500) {
    attempts++;
    const ex = Math.floor(rand() * size);
    const ey = Math.floor(rand() * size);
    const dist = Math.abs(ex - playerX) + Math.abs(ey - playerY);
    if (
      dist < 3 ||
      (ex === exitX && ey === exitY) ||
      grid[ey][ex].type !== "empty" ||
      enemies.some(e => e.x === ex && e.y === ey)
    ) {
      continue;
    }
    // Patrol direction: primarily horizontal or vertical
    const horizontal = rand() > 0.5;
    enemies.push({
      x: ex,
      y: ey,
      dx: horizontal ? (rand() > 0.5 ? 1 : -1) : 0,
      dy: horizontal ? 0 : (rand() > 0.5 ? 1 : -1),
    });
  }

  return { grid, playerX, playerY, exitX, exitY, enemies };
}

// ========================================
// MOVEMENT LOGIC
// ========================================

function dirToOffset(dir: Direction): [number, number] {
  switch (dir) {
    case "up":    return [0, -1];
    case "down":  return [0, 1];
    case "left":  return [-1, 0];
    case "right": return [1, 0];
  }
}

interface MoveResult {
  newX: number;
  newY: number;
  hitWall: boolean;
  reachedExit: boolean;
}

function applyPlayerMove(
  grid: Cell[][],
  x: number,
  y: number,
  dir: Direction,
  size: number
): MoveResult {
  const [dx, dy] = dirToOffset(dir);
  let nx = x + dx;
  let ny = y + dy;

  // Out of bounds or wall: no move
  if (nx < 0 || nx >= size || ny < 0 || ny >= size) {
    return { newX: x, newY: y, hitWall: true, reachedExit: false };
  }
  if (grid[ny][nx].type === "wall") {
    return { newX: x, newY: y, hitWall: true, reachedExit: false };
  }

  // Follow arrow chain (max 20 steps to prevent infinite loops)
  let steps = 0;
  while (steps < 20) {
    const cell = grid[ny][nx];
    if (cell.type === "exit") {
      return { newX: nx, newY: ny, hitWall: false, reachedExit: true };
    }
    if (cell.type !== "arrow") {
      break;
    }
    // Follow the arrow
    const [adx, ady] = dirToOffset(cell.arrowDir!);
    const nextX = nx + adx;
    const nextY = ny + ady;
    if (nextX < 0 || nextX >= size || nextY < 0 || nextY >= size || grid[nextY][nextX].type === "wall") {
      break;
    }
    nx = nextX;
    ny = nextY;
    steps++;
  }

  if (grid[ny][nx].type === "exit") {
    return { newX: nx, newY: ny, hitWall: false, reachedExit: true };
  }

  return { newX: nx, newY: ny, hitWall: false, reachedExit: false };
}

function moveEnemies(enemies: Enemy[], grid: Cell[][], size: number): Enemy[] {
  return enemies.map(enemy => {
    let nx = enemy.x + enemy.dx;
    let ny = enemy.y + enemy.dy;
    let dx = enemy.dx;
    let dy = enemy.dy;

    // Check collision: wall or out of bounds → reverse direction
    if (nx < 0 || nx >= size || ny < 0 || ny >= size || grid[ny][nx].type === "wall") {
      dx = -dx;
      dy = -dy;
      nx = enemy.x + dx;
      ny = enemy.y + dy;
      // If still blocked, stay in place
      if (nx < 0 || nx >= size || ny < 0 || ny >= size || grid[ny][nx].type === "wall") {
        nx = enemy.x;
        ny = enemy.y;
        // Try perpendicular
        const temp = dx;
        dx = dy;
        dy = temp;
      }
    }

    return { x: nx, y: ny, dx, dy };
  });
}

// ========================================
// HOOK
// ========================================

export function useArrowEscape() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [playerX, setPlayerX] = useState(1);
  const [playerY, setPlayerY] = useState(1);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [exitX, setExitX] = useState(5);
  const [exitY, setExitY] = useState(5);
  const [moves, setMoves] = useState(0);
  const [level, setLevel] = useState(1);

  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);

  // Keep refs in sync for keyboard handler
  const gridRef = useRef<Cell[][]>([]);
  const playerXRef = useRef(1);
  const playerYRef = useRef(1);
  const enemiesRef = useRef<Enemy[]>([]);
  const statusRef = useRef<GameStatus>("idle");
  const difficultyRef = useRef<Difficulty>("easy");
  const movesRef = useRef(0);
  const levelRef = useRef(1);
  const exitXRef = useRef(5);
  const exitYRef = useRef(5);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
  useEffect(() => { playerYRef.current = playerY; }, [playerY]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { movesRef.current = moves; }, [moves]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { exitXRef.current = exitX; }, [exitX]);
  useEffect(() => { exitYRef.current = exitY; }, [exitY]);

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const contractAddress = getContractAddress("arrowescape" as never, chain?.id);
  const gameAvailable = isGameAvailableOnChain("arrowescape" as never, chain?.id);
  const { writeContractAsync, isPending } = useWriteContract();

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) setStats(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveStats = useCallback((newStats: PlayerStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch { /* ignore */ }
  }, []);

  // Load a specific level into state
  const loadLevel = useCallback((diff: Difficulty, lvl: number) => {
    const { grid: g, playerX: px, playerY: py, exitX: ex, exitY: ey, enemies: en } = generateLevel(diff, lvl);
    setGrid(g);
    setPlayerX(px);
    setPlayerY(py);
    setExitX(ex);
    setExitY(ey);
    setEnemies(en);
    setMoves(0);
  }, []);

  // Start game
  const startGame = useCallback(async () => {
    if (mode === "onchain" && (!isConnected || !address)) {
      return;
    }

    if (mode === "onchain" && gameAvailable && contractAddress) {
      try {
        setStatus("processing");
        await writeContractAsync({
          address: contractAddress,
          abi: ARROW_ESCAPE_ABI,
          functionName: "startGame",
          args: [difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : 2],
        });
      } catch {
        setStatus("idle");
        return;
      }
    }

    setLevel(1);
    loadLevel(difficulty, 1);
    setStatus("playing");
  }, [mode, isConnected, address, gameAvailable, contractAddress, writeContractAsync, difficulty, loadLevel]);

  // Handle player move
  const move = useCallback((dir: Direction) => {
    if (statusRef.current !== "playing") return;

    const currentGrid = gridRef.current;
    const size = DIFFICULTY_CONFIG[difficultyRef.current].gridSize;
    const result = applyPlayerMove(currentGrid, playerXRef.current, playerYRef.current, dir, size);

    const newMoves = movesRef.current + 1;

    if (result.hitWall) {
      return;
    }

    // Check if player lands on an enemy
    const hitEnemy = enemiesRef.current.some(e => e.x === result.newX && e.y === result.newY);

    if (hitEnemy) {
      setPlayerX(result.newX);
      setPlayerY(result.newY);
      setMoves(newMoves);
      setStatus("lost");
      return;
    }

    if (result.reachedExit) {
      setPlayerX(result.newX);
      setPlayerY(result.newY);
      setMoves(newMoves);
      setStatus("won");

      // Update stats
      const newStats = { ...stats };
      newStats.games += 1;
      newStats.wins += 1;
      if (!newStats.bestMoves[difficultyRef.current] || newMoves < newStats.bestMoves[difficultyRef.current]!) {
        newStats.bestMoves[difficultyRef.current] = newMoves;
      }
      saveStats(newStats);

      // Record on-chain
      if (mode === "onchain" && gameAvailable && contractAddress) {
        writeContractAsync({
          address: contractAddress,
          abi: ARROW_ESCAPE_ABI,
          functionName: "endGame",
          args: [true, BigInt(newMoves), BigInt(levelRef.current)],
        }).catch(() => {});
      }
      return;
    }

    // Move enemies
    const newEnemies = moveEnemies(enemiesRef.current, currentGrid, size);

    // Check if any enemy moved onto player
    const enemyCatchesPlayer = newEnemies.some(e => e.x === result.newX && e.y === result.newY);

    setPlayerX(result.newX);
    setPlayerY(result.newY);
    setMoves(newMoves);
    setEnemies(newEnemies);

    if (enemyCatchesPlayer) {
      setStatus("lost");
      return;
    }
  }, [stats, saveStats, mode, gameAvailable, contractAddress, writeContractAsync]);

  // Keyboard handler
  useEffect(() => {
    if (status !== "playing") return;

    const handleKey = (e: KeyboardEvent) => {
      let dir: Direction | null = null;
      switch (e.key) {
        case "ArrowUp":    case "w": case "W": dir = "up";    break;
        case "ArrowDown":  case "s": case "S": dir = "down";  break;
        case "ArrowLeft":  case "a": case "A": dir = "left";  break;
        case "ArrowRight": case "d": case "D": dir = "right"; break;
      }
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status, move]);

  // Reset to idle
  const resetGame = useCallback(() => {
    setGrid([]);
    setPlayerX(1);
    setPlayerY(1);
    setEnemies([]);
    setMoves(0);
    setLevel(1);
    setStatus("idle");
  }, []);

  // Play again (restart same level)
  const playAgain = useCallback(() => {
    loadLevel(difficulty, level);
    setStatus("playing");
  }, [difficulty, level, loadLevel]);

  // New game (new level)
  const newGame = useCallback((diff?: Difficulty) => {
    const d = diff ?? difficulty;
    setDifficulty(d);
    const newLevel = level + 1;
    setLevel(newLevel);
    loadLevel(d, newLevel);
    setStatus("playing");
  }, [difficulty, level, loadLevel]);

  // Switch mode
  const switchMode = useCallback((newMode: GameMode) => {
    if (status === "playing") return;
    setMode(newMode);
    resetGame();
  }, [status, resetGame]);

  // Change difficulty
  const changeDifficulty = useCallback((d: Difficulty) => {
    if (status === "playing") return;
    setDifficulty(d);
  }, [status]);

  const gridSize = DIFFICULTY_CONFIG[difficulty].gridSize;

  return {
    // State
    grid,
    playerX,
    playerY,
    enemies,
    exitX,
    exitY,
    moves,
    level,
    mode,
    status,
    difficulty,
    stats,
    gridSize,
    isConnected,
    isProcessing: isPending,
    contractAddress,
    gameAvailable,

    // Actions
    startGame,
    move,
    resetGame,
    playAgain,
    newGame,
    switchMode,
    changeDifficulty,
  };
}
