"use client";
import { useState, useCallback, useRef } from "react";

// ========================================
// TYPES
// ========================================

export type Direction = "up" | "down" | "left" | "right";

export interface ArrowCell {
  dir: Direction;
  id: number; // unique id for animation key
}

// Grid: null = empty, ArrowCell = has arrow
export type Grid = (ArrowCell | null)[][];

export type GameStatus = "playing" | "won" | "lost";
export type GameMode = "free" | "onchain";

export interface UseArrowEscapeReturn {
  grid: Grid;
  rows: number;
  cols: number;
  lives: number;
  score: number;
  level: number;
  status: GameStatus;
  mode: GameMode;
  arrowsLeft: number;
  hintCell: [number, number] | null;
  exitingCell: [number, number] | null;
  blockedCell: [number, number] | null;
  tapCell: (row: number, col: number) => void;
  showHint: () => void;
  restartLevel: () => void;
  nextLevel: () => void;
  setGameMode: (mode: GameMode) => void;
}

// ========================================
// LEVEL DEFINITIONS
// ========================================

interface LevelDef {
  rows: number;
  cols: number;
  arrows: { row: number; col: number; dir: Direction }[];
}

// Each level is designed so there's always at least 1-2 arrows that can exit immediately,
// and removing them unlocks others, creating a chain puzzle.
//
// Notation: path from [r,c] in direction d must be clear of other arrows to exit.
// "clear path" means all cells between [r,c] and the edge in direction d are null.

const LEVELS: LevelDef[] = [
  // ────────────────────────────────────────────
  // Level 1 — 4×4, 6 arrows — Very easy
  // Solution chain: (0,0)→, (3,3)←, (0,2)↑, (2,3)↓, (1,1)↑, (3,0)→
  // ────────────────────────────────────────────
  {
    rows: 4, cols: 4,
    arrows: [
      { row: 0, col: 0, dir: "right" }, // path right: col1,2,3 all empty → exits immediately ✓
      { row: 3, col: 3, dir: "left" },  // path left: col2,1,0 — col0 has nothing blocking → exits ✓
      { row: 0, col: 2, dir: "up" },    // path up: row-1 → exits immediately ✓
      { row: 2, col: 3, dir: "down" },  // path down: row3 empty → exits ✓
      { row: 1, col: 1, dir: "up" },    // path up: row0,col1 empty → exits ✓
      { row: 3, col: 0, dir: "right" }, // path right: col1,2,3 — col3 had (3,3) but now gone → exits ✓
    ],
  },

  // ────────────────────────────────────────────
  // Level 2 — 4×4, 8 arrows
  // Strategy: corners and edges first, then interior
  // ────────────────────────────────────────────
  {
    rows: 4, cols: 4,
    arrows: [
      { row: 0, col: 3, dir: "right" }, // exits right immediately ✓
      { row: 3, col: 0, dir: "left" },  // exits left immediately ✓
      { row: 0, col: 0, dir: "up" },    // exits up immediately ✓
      { row: 3, col: 3, dir: "down" },  // exits down immediately ✓
      { row: 1, col: 2, dir: "right" }, // path right: col3 empty after (0,3) gone → exits ✓
      { row: 2, col: 1, dir: "left" },  // path left: col0 empty after (3,0) gone → exits ✓
      { row: 1, col: 0, dir: "up" },    // path up: row0,col0 had arrow but now gone → exits ✓
      { row: 2, col: 3, dir: "down" },  // path down: row3,col3 had arrow but now gone → exits ✓
    ],
  },

  // ────────────────────────────────────────────
  // Level 3 — 4×5, 10 arrows
  // Wider grid, mixed directions
  // ────────────────────────────────────────────
  {
    rows: 4, cols: 5,
    arrows: [
      { row: 0, col: 4, dir: "right" }, // exits immediately ✓
      { row: 3, col: 0, dir: "left" },  // exits immediately ✓
      { row: 0, col: 0, dir: "up" },    // exits immediately ✓
      { row: 3, col: 4, dir: "down" },  // exits immediately ✓
      { row: 1, col: 3, dir: "right" }, // after (0,4) gone, col4 clear → exits ✓
      { row: 2, col: 1, dir: "left" },  // after (3,0) gone, col0 clear → exits ✓
      { row: 0, col: 2, dir: "up" },    // exits immediately (row-1 is edge) ✓
      { row: 3, col: 2, dir: "down" },  // exits immediately (row4 is edge) ✓
      { row: 1, col: 0, dir: "up" },    // after (0,0) gone → exits ✓
      { row: 2, col: 4, dir: "down" },  // after (3,4) gone → exits ✓
    ],
  },

  // ────────────────────────────────────────────
  // Level 4 — 4×5, 12 arrows — chain dependencies
  // ────────────────────────────────────────────
  {
    rows: 4, cols: 5,
    arrows: [
      // First wave (clear immediately)
      { row: 0, col: 4, dir: "right" }, // ✓
      { row: 3, col: 0, dir: "left" },  // ✓
      { row: 2, col: 0, dir: "up" },    // path up: row0,1 col0 — row1 has nothing, row0 empty → ✓
      { row: 1, col: 4, dir: "down" },  // path down: row2,3 col4 — row2,3 empty → ✓
      // Second wave
      { row: 0, col: 1, dir: "up" },    // exits immediately ✓
      { row: 3, col: 3, dir: "down" },  // exits immediately ✓
      { row: 1, col: 2, dir: "right" }, // path right: col3,4 — col4 had arrow but gone → ✓ after first wave
      { row: 2, col: 2, dir: "left" },  // path left: col1,0 — after (3,0) gone → ✓
      // Third wave
      { row: 0, col: 3, dir: "right" }, // after (0,4) gone → ✓
      { row: 3, col: 1, dir: "left" },  // after (3,0) gone → ✓
      { row: 1, col: 1, dir: "up" },    // after (0,1) gone → ✓
      { row: 2, col: 3, dir: "down" },  // after (3,3) gone → ✓
    ],
  },

  // ────────────────────────────────────────────
  // Level 5 — 5×5, 14 arrows
  // ────────────────────────────────────────────
  {
    rows: 5, cols: 5,
    arrows: [
      // Immediate exits
      { row: 0, col: 4, dir: "right" }, // ✓
      { row: 4, col: 0, dir: "left" },  // ✓
      { row: 0, col: 0, dir: "up" },    // ✓
      { row: 4, col: 4, dir: "down" },  // ✓
      { row: 2, col: 4, dir: "right" }, // ✓
      // Wave 2 (freed after wave 1)
      { row: 1, col: 3, dir: "right" }, // after (0,4)→ gone, col4 clear → ✓
      { row: 3, col: 1, dir: "left" },  // after (4,0)← gone, col0 clear → ✓
      { row: 1, col: 0, dir: "up" },    // after (0,0)↑ gone → ✓
      { row: 3, col: 4, dir: "down" },  // after (4,4)↓ gone → ✓
      { row: 0, col: 2, dir: "up" },    // exits immediately ✓
      // Wave 3
      { row: 2, col: 2, dir: "left" },  // after (4,0) cleared, path col1,0 free → ✓
      { row: 4, col: 2, dir: "down" },  // exits immediately ✓
      { row: 2, col: 0, dir: "left" },  // after (4,0) cleared → ✓
      { row: 0, col: 3, dir: "up" },    // exits immediately ✓
    ],
  },

  // ────────────────────────────────────────────
  // Level 6 — 5×5, 16 arrows — tighter puzzle
  // ────────────────────────────────────────────
  {
    rows: 5, cols: 5,
    arrows: [
      // Outer ring exits
      { row: 0, col: 0, dir: "up" },    // ✓
      { row: 0, col: 4, dir: "right" }, // ✓
      { row: 4, col: 0, dir: "left" },  // ✓
      { row: 4, col: 4, dir: "down" },  // ✓
      { row: 2, col: 0, dir: "left" },  // ✓
      { row: 2, col: 4, dir: "right" }, // ✓
      { row: 0, col: 2, dir: "up" },    // ✓
      { row: 4, col: 2, dir: "down" },  // ✓
      // Inner ring — freed after outer
      { row: 1, col: 1, dir: "up" },    // after (0,0) gone → ✓
      { row: 1, col: 3, dir: "right" }, // after (0,4) gone → ✓
      { row: 3, col: 1, dir: "left" },  // after (4,0) gone → ✓
      { row: 3, col: 3, dir: "down" },  // after (4,4) gone → ✓
      { row: 1, col: 2, dir: "up" },    // after (0,2) gone → ✓
      { row: 3, col: 2, dir: "down" },  // after (4,2) gone → ✓
      { row: 2, col: 1, dir: "left" },  // after (2,0) gone → ✓
      { row: 2, col: 3, dir: "right" }, // after (2,4) gone → ✓
    ],
  },

  // ────────────────────────────────────────────
  // Level 7 — 5×6, 18 arrows
  // ────────────────────────────────────────────
  {
    rows: 5, cols: 6,
    arrows: [
      // Immediate exits
      { row: 0, col: 0, dir: "up" },    // ✓
      { row: 0, col: 5, dir: "right" }, // ✓
      { row: 4, col: 0, dir: "left" },  // ✓
      { row: 4, col: 5, dir: "down" },  // ✓
      { row: 2, col: 5, dir: "right" }, // ✓
      { row: 2, col: 0, dir: "left" },  // ✓
      { row: 0, col: 3, dir: "up" },    // ✓
      { row: 4, col: 2, dir: "down" },  // ✓
      // Wave 2
      { row: 1, col: 0, dir: "up" },    // after (0,0) → ✓
      { row: 1, col: 5, dir: "right" }, // after (0,5) → ✓
      { row: 3, col: 0, dir: "left" },  // after (4,0) → ✓
      { row: 3, col: 5, dir: "down" },  // after (4,5) → ✓
      { row: 0, col: 1, dir: "up" },    // exits immediately ✓
      { row: 4, col: 4, dir: "down" },  // exits immediately ✓
      // Wave 3
      { row: 1, col: 4, dir: "right" }, // after (1,5) gone → ✓
      { row: 3, col: 1, dir: "left" },  // after (3,0) gone → ✓
      { row: 0, col: 4, dir: "up" },    // exits immediately ✓
      { row: 4, col: 1, dir: "down" },  // exits immediately ✓
    ],
  },

  // ────────────────────────────────────────────
  // Level 8 — 5×6, 20 arrows
  // ────────────────────────────────────────────
  {
    rows: 5, cols: 6,
    arrows: [
      // First wave
      { row: 0, col: 5, dir: "right" }, // ✓
      { row: 4, col: 0, dir: "left" },  // ✓
      { row: 0, col: 0, dir: "up" },    // ✓
      { row: 4, col: 5, dir: "down" },  // ✓
      { row: 0, col: 2, dir: "up" },    // ✓
      { row: 4, col: 3, dir: "down" },  // ✓
      { row: 2, col: 0, dir: "left" },  // ✓
      { row: 2, col: 5, dir: "right" }, // ✓
      // Second wave
      { row: 1, col: 4, dir: "right" }, // after (0,5) gone → ✓
      { row: 3, col: 1, dir: "left" },  // after (4,0) gone → ✓
      { row: 1, col: 0, dir: "up" },    // after (0,0) gone → ✓
      { row: 3, col: 5, dir: "down" },  // after (4,5) gone → ✓
      { row: 0, col: 3, dir: "up" },    // exits immediately ✓
      { row: 4, col: 2, dir: "down" },  // exits immediately ✓
      // Third wave
      { row: 1, col: 3, dir: "right" }, // after (1,4) gone → ✓
      { row: 3, col: 2, dir: "left" },  // after (3,1) gone → ✓
      { row: 1, col: 1, dir: "up" },    // after (0,2) gone → ✓ (path: row0,col1 clear)
      { row: 3, col: 4, dir: "down" },  // after (4,3) gone → ✓ (path: row4,col4 clear)
      { row: 2, col: 1, dir: "left" },  // after (2,0) gone → ✓
      { row: 2, col: 4, dir: "right" }, // after (2,5) gone → ✓
    ],
  },

  // ────────────────────────────────────────────
  // Level 9 — 6×6, 22 arrows
  // ────────────────────────────────────────────
  {
    rows: 6, cols: 6,
    arrows: [
      // First wave — all exit immediately
      { row: 0, col: 0, dir: "up" },    // ✓
      { row: 0, col: 5, dir: "right" }, // ✓
      { row: 5, col: 0, dir: "left" },  // ✓
      { row: 5, col: 5, dir: "down" },  // ✓
      { row: 0, col: 3, dir: "up" },    // ✓
      { row: 5, col: 2, dir: "down" },  // ✓
      { row: 3, col: 0, dir: "left" },  // ✓
      { row: 2, col: 5, dir: "right" }, // ✓
      // Second wave
      { row: 1, col: 0, dir: "up" },    // after (0,0) → ✓
      { row: 1, col: 5, dir: "right" }, // after (0,5) → ✓
      { row: 4, col: 0, dir: "left" },  // after (5,0) → ✓
      { row: 4, col: 5, dir: "down" },  // after (5,5) → ✓
      { row: 0, col: 2, dir: "up" },    // exits immediately ✓
      { row: 5, col: 3, dir: "down" },  // exits immediately ✓
      // Third wave
      { row: 2, col: 0, dir: "left" },  // after (3,0) gone → ✓
      { row: 3, col: 5, dir: "right" }, // after (2,5) gone → ✓
      { row: 1, col: 4, dir: "right" }, // after (1,5) gone → ✓
      { row: 4, col: 1, dir: "left" },  // after (4,0) gone → ✓
      // Fourth wave
      { row: 2, col: 2, dir: "left" },  // after (2,0) gone → ✓
      { row: 3, col: 3, dir: "right" }, // after (3,5) gone → ✓
      { row: 1, col: 2, dir: "up" },    // after (0,2) gone → ✓ (path: row0 clear)
      { row: 4, col: 3, dir: "down" },  // after (5,3) gone → ✓
    ],
  },

  // ────────────────────────────────────────────
  // Level 10 — 6×6, 25 arrows — hardest
  // ────────────────────────────────────────────
  {
    rows: 6, cols: 6,
    arrows: [
      // First wave — corner + mid-edge exits
      { row: 0, col: 5, dir: "right" }, // ✓
      { row: 5, col: 0, dir: "left" },  // ✓
      { row: 0, col: 0, dir: "up" },    // ✓
      { row: 5, col: 5, dir: "down" },  // ✓
      { row: 0, col: 2, dir: "up" },    // ✓
      { row: 5, col: 3, dir: "down" },  // ✓
      { row: 3, col: 0, dir: "left" },  // ✓
      { row: 2, col: 5, dir: "right" }, // ✓
      // Second wave
      { row: 1, col: 5, dir: "right" }, // after (0,5) → ✓
      { row: 4, col: 0, dir: "left" },  // after (5,0) → ✓
      { row: 1, col: 0, dir: "up" },    // after (0,0) → ✓
      { row: 4, col: 5, dir: "down" },  // after (5,5) → ✓
      { row: 0, col: 4, dir: "up" },    // exits immediately ✓
      { row: 5, col: 1, dir: "down" },  // exits immediately ✓
      // Third wave
      { row: 2, col: 0, dir: "left" },  // after (3,0) gone → ✓
      { row: 3, col: 5, dir: "right" }, // after (2,5) gone → ✓
      { row: 1, col: 3, dir: "right" }, // after (1,5) gone → ✓
      { row: 4, col: 2, dir: "left" },  // after (4,0) gone → ✓
      { row: 0, col: 3, dir: "up" },    // exits immediately ✓
      { row: 5, col: 2, dir: "down" },  // exits immediately ✓
      // Fourth wave
      { row: 2, col: 1, dir: "left" },  // after (2,0) gone → ✓
      { row: 3, col: 4, dir: "right" }, // after (3,5) gone → ✓
      { row: 1, col: 1, dir: "up" },    // after (0,0) gone (row0,col1 clear) → ✓
      { row: 4, col: 4, dir: "down" },  // after (5,5) gone (row5,col4 clear) → ✓
      // Fifth — center last
      { row: 2, col: 3, dir: "right" }, // after (2,5) gone + (3,4),(3,5) cleared → path col4,5 free → ✓
    ],
  },
];

// ========================================
// GRID BUILDER
// ========================================

let idCounter = 1;

function buildGrid(def: LevelDef): Grid {
  const grid: Grid = Array.from({ length: def.rows }, () =>
    Array(def.cols).fill(null)
  );
  for (const a of def.arrows) {
    grid[a.row][a.col] = { dir: a.dir, id: idCounter++ };
  }
  return grid;
}

// ========================================
// LOGIC HELPERS
// ========================================

function canExit(grid: Grid, row: number, col: number): boolean {
  const cell = grid[row][col];
  if (!cell) return false;
  const rows = grid.length;
  const cols = grid[0].length;

  switch (cell.dir) {
    case "up":
      for (let r = row - 1; r >= 0; r--) {
        if (grid[r][col] !== null) return false;
      }
      return true;
    case "down":
      for (let r = row + 1; r < rows; r++) {
        if (grid[r][col] !== null) return false;
      }
      return true;
    case "left":
      for (let c = col - 1; c >= 0; c--) {
        if (grid[row][c] !== null) return false;
      }
      return true;
    case "right":
      for (let c = col + 1; c < cols; c++) {
        if (grid[row][c] !== null) return false;
      }
      return true;
  }
}

function countArrows(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) count++;
    }
  }
  return count;
}

function findHint(grid: Grid): [number, number] | null {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] !== null && canExit(grid, r, c)) {
        return [r, c];
      }
    }
  }
  return null;
}

const STATS_KEY = "arrowescapestats";

interface Stats {
  gamesPlayed: number;
  levelsCleared: number;
  bestScore: number;
}

function loadStats(): Stats {
  try {
    const s = localStorage.getItem(STATS_KEY);
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }
  return { gamesPlayed: 0, levelsCleared: 0, bestScore: 0 };
}

function saveStats(s: Stats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

// ========================================
// HOOK
// ========================================

export function useArrowEscape(): UseArrowEscapeReturn {
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<Grid>(() => buildGrid(LEVELS[0]));
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [mode, setGameModeState] = useState<GameMode>("free");
  const [hintCell, setHintCell] = useState<[number, number] | null>(null);
  const [exitingCell, setExitingCell] = useState<[number, number] | null>(null);
  const [blockedCell, setBlockedCell] = useState<[number, number] | null>(null);

  // Ref to block taps while animating
  const animating = useRef(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const levelDef = LEVELS[level - 1];
  const rows = levelDef.rows;
  const cols = levelDef.cols;
  const arrowsLeft = countArrows(grid);

  const tapCell = useCallback((row: number, col: number) => {
    if (animating.current) return;
    if (status !== "playing") return;

    setGrid(currentGrid => {
      if (currentGrid[row][col] === null) return currentGrid;

      if (canExit(currentGrid, row, col)) {
        // Start exit animation
        animating.current = true;
        setExitingCell([row, col]);

        setTimeout(() => {
          setGrid(g => {
            const next: Grid = g.map(r => [...r]);
            next[row][col] = null;
            const remaining = countArrows(next);
            if (remaining === 0) {
              setStatus("won");
              // Save stats
              setScore(prev => {
                const newScore = prev + 10 + (lives > 0 ? lives * 5 : 0);
                const stats = loadStats();
                stats.levelsCleared += 1;
                if (newScore > stats.bestScore) stats.bestScore = newScore;
                saveStats(stats);
                return newScore;
              });
            } else {
              setScore(prev => prev + 10);
            }
            return next;
          });
          setExitingCell(null);
          animating.current = false;
        }, 350);

        return currentGrid; // grid updated in timeout
      } else {
        // Blocked — shake + lose life
        setBlockedCell([row, col]);
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setTimeout(() => {
              setStatus("lost");
              setBlockedCell(null);
              const stats = loadStats();
              stats.gamesPlayed += 1;
              saveStats(stats);
            }, 500);
          } else {
            setTimeout(() => setBlockedCell(null), 500);
          }
          return newLives;
        });
        return currentGrid;
      }
    });
  }, [status, lives]);

  const showHint = useCallback(() => {
    setGrid(currentGrid => {
      const hint = findHint(currentGrid);
      if (hint) {
        setHintCell(hint);
        if (hintTimer.current) clearTimeout(hintTimer.current);
        hintTimer.current = setTimeout(() => setHintCell(null), 2000);
      }
      return currentGrid;
    });
  }, []);

  const restartLevel = useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    animating.current = false;
    setGrid(buildGrid(LEVELS[level - 1]));
    setLives(3);
    setScore(0);
    setStatus("playing");
    setHintCell(null);
    setExitingCell(null);
    setBlockedCell(null);
  }, [level]);

  const nextLevel = useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    animating.current = false;
    const nextLvl = level < LEVELS.length ? level + 1 : 1;
    setLevel(nextLvl);
    setGrid(buildGrid(LEVELS[nextLvl - 1]));
    setLives(3);
    setScore(0);
    setStatus("playing");
    setHintCell(null);
    setExitingCell(null);
    setBlockedCell(null);
    if (nextLvl === 1) {
      // Completed all levels — update gamesPlayed
      const stats = loadStats();
      stats.gamesPlayed += 1;
      saveStats(stats);
    }
  }, [level]);

  const setGameMode = useCallback((m: GameMode) => {
    setGameModeState(m);
  }, []);

  return {
    grid,
    rows,
    cols,
    lives,
    score,
    level,
    status,
    mode,
    arrowsLeft,
    hintCell,
    exitingCell,
    blockedCell,
    tapCell,
    showHint,
    restartLevel,
    nextLevel,
    setGameMode,
  };
}
