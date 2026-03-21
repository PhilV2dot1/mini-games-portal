"use client";
import { useState, useCallback, useRef } from "react";

// ========================================
// TYPES
// ========================================

export type Direction = "up" | "down" | "left" | "right";
export type GameStatus = "playing" | "won" | "lost";
export type GameMode = "free" | "onchain";

export interface Arrow {
  id: string;
  direction: Direction;
  length: number;    // number of cells occupied (2, 3, or 4)
  headRow: number;   // row of the head (tip of arrow)
  headCol: number;   // col of the head
  color: string;
  isExited: boolean;
}

export interface Level {
  gridSize: number;
  arrows: Omit<Arrow, "isExited">[];
  optimalMoves: number;
}

export interface GameState {
  arrows: Arrow[];
  gridSize: number;
  moves: number;
  selectedId: string | null;
  status: GameStatus;
  mode: GameMode;
  level: number;
  score: number;
  hintsLeft: number;
  hintId: string | null;
  blockedId: string | null;
  exitingId: string | null;
  history: Arrow[][];  // undo stack
  stars: number;
}

export interface UseArrowEscapeReturn extends GameState {
  selectArrow: (id: string) => void;
  moveSelected: (steps?: number) => void;
  tapArrow: (id: string) => void;
  undo: () => void;
  showHint: () => void;
  restartLevel: () => void;
  nextLevel: () => void;
  setGameMode: (mode: GameMode) => void;
}

// ========================================
// COLORS
// ========================================

const COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#22C55E", // green
  "#F97316", // orange
  "#A855F7", // purple
  "#06B6D4", // cyan
  "#EAB308", // yellow
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F43F5E", // rose
  "#84CC16", // lime
  "#8B5CF6", // violet
];

// ========================================
// LEVEL DEFINITIONS
// ========================================
// headRow/headCol = position of the arrow TIP.
// For direction "right": head is rightmost cell, body extends LEFT.
// For direction "left":  head is leftmost cell, body extends RIGHT.
// For direction "down":  head is bottommost cell, body extends UP.
// For direction "up":    head is topmost cell, body extends DOWN.

const RAW_LEVELS: { gridSize: number; optimalMoves: number; arrows: Omit<Arrow, "isExited" | "color" | "id">[] }[] = [
  // ── Level 1 — 5×5, 5 arrows ─────────────────────────────────────────────
  // Solution: right@(0,4) exits, then up@(0,2) exits, down@(4,1) exits,
  //           left@(2,0) exits, right@(3,4) exits
  {
    gridSize: 5,
    optimalMoves: 5,
    arrows: [
      { direction: "right", length: 2, headRow: 0, headCol: 4 }, // row0: cols3-4 → exits right
      { direction: "up",    length: 2, headRow: 0, headCol: 2 }, // col2: rows0-1 → exits up (blocked by nothing)
      { direction: "down",  length: 2, headRow: 4, headCol: 1 }, // col1: rows3-4 → exits down
      { direction: "left",  length: 2, headRow: 2, headCol: 0 }, // row2: cols0-1 → exits left
      { direction: "right", length: 2, headRow: 3, headCol: 4 }, // row3: cols3-4 → exits right
    ],
  },

  // ── Level 2 — 6×6, 7 arrows ─────────────────────────────────────────────
  // Corner arrows exit first, then middle ones unblock
  {
    gridSize: 6,
    optimalMoves: 8,
    arrows: [
      { direction: "right", length: 2, headRow: 0, headCol: 5 }, // row0: cols4-5
      { direction: "right", length: 3, headRow: 2, headCol: 5 }, // row2: cols3-5
      { direction: "down",  length: 2, headRow: 5, headCol: 0 }, // col0: rows4-5
      { direction: "down",  length: 3, headRow: 5, headCol: 4 }, // col4: rows3-5
      { direction: "left",  length: 2, headRow: 4, headCol: 1 }, // row4: cols1-2 — blocked by down@col0 until it exits
      { direction: "left",  length: 2, headRow: 1, headCol: 0 }, // row1: cols0-1 — exits left
      { direction: "up",    length: 2, headRow: 0, headCol: 2 }, // col2: rows0-1 — exits up
    ],
  },

  // ── Level 3 — 7×7, 9 arrows ─────────────────────────────────────────────
  {
    gridSize: 7,
    optimalMoves: 12,
    arrows: [
      { direction: "right", length: 3, headRow: 0, headCol: 6 }, // row0: cols4-6
      { direction: "right", length: 2, headRow: 3, headCol: 6 }, // row3: cols5-6
      { direction: "down",  length: 3, headRow: 6, headCol: 2 }, // col2: rows4-6
      { direction: "down",  length: 2, headRow: 6, headCol: 5 }, // col5: rows5-6
      { direction: "left",  length: 3, headRow: 6, headCol: 0 }, // row6: cols0-2 — will overlap col2 down, skip
      { direction: "left",  length: 2, headRow: 3, headCol: 1 }, // row3: cols1-2 — blocked by col2 down
      { direction: "left",  length: 2, headRow: 6, headCol: 0 }, // row6: cols0-1
      { direction: "up",    length: 3, headRow: 0, headCol: 4 }, // col4: rows0-2
      { direction: "up",    length: 2, headRow: 0, headCol: 0 }, // col0: rows0-1
    ],
  },

  // ── Level 4 — 7×7, 11 arrows ────────────────────────────────────────────
  {
    gridSize: 7,
    optimalMoves: 16,
    arrows: [
      { direction: "right", length: 3, headRow: 0, headCol: 6 },
      { direction: "right", length: 2, headRow: 2, headCol: 6 },
      { direction: "right", length: 2, headRow: 4, headCol: 6 },
      { direction: "down",  length: 3, headRow: 6, headCol: 0 },
      { direction: "down",  length: 2, headRow: 6, headCol: 3 },
      { direction: "down",  length: 2, headRow: 6, headCol: 6 },
      { direction: "left",  length: 2, headRow: 1, headCol: 0 },
      { direction: "left",  length: 3, headRow: 3, headCol: 2 }, // row3: cols0-2 — blocked by down@col0
      { direction: "left",  length: 2, headRow: 5, headCol: 1 }, // row5: cols1-2 — blocked by down@col0
      { direction: "up",    length: 3, headRow: 0, headCol: 2 },
      { direction: "up",    length: 2, headRow: 0, headCol: 5 },
    ],
  },

  // ── Level 5 — 8×8, 12 arrows ────────────────────────────────────────────
  {
    gridSize: 8,
    optimalMoves: 24,
    arrows: [
      { direction: "right", length: 3, headRow: 0, headCol: 7 },
      { direction: "right", length: 2, headRow: 2, headCol: 7 },
      { direction: "right", length: 3, headRow: 4, headCol: 7 },
      { direction: "right", length: 2, headRow: 6, headCol: 7 },
      { direction: "down",  length: 3, headRow: 7, headCol: 1 },
      { direction: "down",  length: 2, headRow: 7, headCol: 4 },
      { direction: "down",  length: 3, headRow: 7, headCol: 6 },
      { direction: "left",  length: 2, headRow: 1, headCol: 0 },
      { direction: "left",  length: 3, headRow: 5, headCol: 2 }, // row5: cols0-2 — blocked by col1 down
      { direction: "up",    length: 2, headRow: 0, headCol: 3 },
      { direction: "up",    length: 3, headRow: 0, headCol: 5 },
      { direction: "up",    length: 2, headRow: 3, headCol: 0 }, // col0: rows3-4
    ],
  },
];

// ========================================
// BUILD LEVELS — assign ids, colors, validate & fix overlaps
// ========================================

function buildLevel(raw: typeof RAW_LEVELS[0]): Level {
  const occupied = new Set<string>();

  const arrows: Omit<Arrow, "isExited">[] = [];

  for (let i = 0; i < raw.arrows.length; i++) {
    const a = raw.arrows[i];
    const arrowCells = getArrowCells(a.direction, a.headRow, a.headCol, a.length);

    // Skip arrows that would be out of bounds or overlap
    const valid = arrowCells.every(([r, c]) =>
      r >= 0 && r < raw.gridSize && c >= 0 && c < raw.gridSize
    );
    const noOverlap = arrowCells.every(([r, c]) => !occupied.has(`${r},${c}`));

    if (valid && noOverlap) {
      arrowCells.forEach(([r, c]) => occupied.add(`${r},${c}`));
      arrows.push({
        id: `a${i + 1}`,
        direction: a.direction,
        length: a.length,
        headRow: a.headRow,
        headCol: a.headCol,
        color: COLORS[i % COLORS.length],
      });
    }
  }

  return {
    gridSize: raw.gridSize,
    optimalMoves: raw.optimalMoves,
    arrows,
  };
}

export const LEVELS: Level[] = RAW_LEVELS.map(buildLevel);

// ========================================
// ARROW CELL HELPERS
// ========================================

// Returns all [row, col] cells occupied by an arrow
export function getArrowCells(
  direction: Direction,
  headRow: number,
  headCol: number,
  length: number
): [number, number][] {
  const cells: [number, number][] = [];
  for (let i = 0; i < length; i++) {
    switch (direction) {
      case "right": cells.push([headRow, headCol - i]); break;
      case "left":  cells.push([headRow, headCol + i]); break;
      case "down":  cells.push([headRow - i, headCol]); break;
      case "up":    cells.push([headRow + i, headCol]); break;
    }
  }
  return cells;
}

// How many steps can this arrow move in its direction before hitting a wall or another arrow?
function maxSteps(arrow: Arrow, others: Arrow[], gridSize: number): number {
  // Build occupied set (excluding this arrow)
  const occupied = new Set<string>();
  for (const other of others) {
    if (other.id === arrow.id || other.isExited) continue;
    getArrowCells(other.direction, other.headRow, other.headCol, other.length)
      .forEach(([r, c]) => occupied.add(`${r},${c}`));
  }

  let steps = 0;
  while (true) {
    const nextHead = nextHeadPos(arrow.direction, arrow.headRow + 0, arrow.headCol + 0, steps + 1);
    const nextCells = getArrowCells(arrow.direction, nextHead[0], nextHead[1], arrow.length);

    // Check bounds
    const inBounds = nextCells.every(([r, c]) => r >= 0 && r < gridSize && c >= 0 && c < gridSize);
    if (!inBounds) {
      // Check if the head is past the edge (can exit)
      const headOut = isHeadOutOfBounds(arrow.direction, nextHead[0], nextHead[1], gridSize);
      if (headOut) steps++; // can exit — count one more step
      break;
    }

    // Check collision
    const blocked = nextCells.some(([r, c]) => occupied.has(`${r},${c}`));
    if (blocked) break;

    steps++;
  }
  return steps;
}

function nextHeadPos(dir: Direction, row: number, col: number, steps: number): [number, number] {
  switch (dir) {
    case "right": return [row, col + steps];
    case "left":  return [row, col - steps];
    case "down":  return [row + steps, col];
    case "up":    return [row - steps, col];
  }
}

function isHeadOutOfBounds(dir: Direction, headRow: number, headCol: number, gridSize: number): boolean {
  switch (dir) {
    case "right": return headCol >= gridSize;
    case "left":  return headCol < 0;
    case "down":  return headRow >= gridSize;
    case "up":    return headRow < 0;
  }
}

// Can this arrow exit in one move (path is clear all the way to the edge)?
function canExitDirectly(arrow: Arrow, others: Arrow[], gridSize: number): boolean {
  return maxSteps(arrow, others, gridSize) >= stepsToExit(arrow, gridSize);
}

function stepsToExit(arrow: Arrow, gridSize: number): number {
  switch (arrow.direction) {
    case "right": return gridSize - arrow.headCol;
    case "left":  return arrow.headCol + 1;
    case "down":  return gridSize - arrow.headRow;
    case "up":    return arrow.headRow + 1;
  }
}

// ========================================
// INITIAL STATE
// ========================================

function initArrows(level: Level): Arrow[] {
  return level.arrows.map(a => ({ ...a, isExited: false }));
}

const STATS_KEY = "arrowescape2stats";

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
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function calcScore(moves: number, optimalMoves: number, hintsUsed: number): number {
  const base = 1000;
  const movePenalty = Math.max(0, moves - optimalMoves) * 10;
  const hintPenalty = hintsUsed * 50;
  return Math.max(100, base - movePenalty - hintPenalty);
}

function calcStars(moves: number, optimalMoves: number): number {
  if (moves <= optimalMoves) return 3;
  if (moves <= Math.floor(optimalMoves * 1.5)) return 2;
  return 1;
}

// ========================================
// HOOK
// ========================================

export function useArrowEscape(): UseArrowEscapeReturn {
  const [level, setLevel] = useState(1);
  const [arrows, setArrows] = useState<Arrow[]>(() => initArrows(LEVELS[0]));
  const [moves, setMoves] = useState(0);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [mode, setMode] = useState<GameMode>("free");
  const [score, setScore] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintId, setHintId] = useState<string | null>(null);
  const [blockedId, setBlockedId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Arrow[][]>([]);
  const [stars, setStars] = useState(0);

  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animating = useRef(false);
  const hintsUsedRef = useRef(0);
  const levelRef = useRef(level);
  levelRef.current = level;

  const gridSize = LEVELS[level - 1].gridSize;
  const optimalMoves = LEVELS[level - 1].optimalMoves;
  const gridSizeRef = useRef(gridSize);
  gridSizeRef.current = gridSize;
  const optimalMovesRef = useRef(optimalMoves);
  optimalMovesRef.current = optimalMoves;

  // ── Move an arrow N steps (or to exit) ────────────────────────────────
  const doMove = useCallback((arrowId: string, steps: number) => {
    if (animating.current) return;
    if (status !== "playing") return;

    setArrows(prev => {
      const arrow = prev.find(a => a.id === arrowId);
      if (!arrow || arrow.isExited) return prev;

      const gs = gridSizeRef.current;
      const available = maxSteps(arrow, prev, gs);
      if (available === 0) {
        setBlockedId(arrowId);
        setTimeout(() => setBlockedId(null), 500);
        return prev;
      }

      const actualSteps = Math.min(steps, available);
      const exitSteps = stepsToExit(arrow, gs);
      const willExit = actualSteps >= exitSteps;

      setHistory(h => [...h.slice(-19), prev]);
      setMoves(m => m + 1);

      if (willExit) {
        animating.current = true;
        setExitingId(arrowId);

        const newHead = nextHeadPos(arrow.direction, arrow.headRow, arrow.headCol, actualSteps);
        const updated = prev.map(a =>
          a.id === arrowId ? { ...a, headRow: newHead[0], headCol: newHead[1] } : a
        );

        setTimeout(() => {
          setArrows(curr => {
            const next = curr.map(a =>
              a.id === arrowId ? { ...a, isExited: true } : a
            );
            const remaining = next.filter(a => !a.isExited).length;
            if (remaining === 0) {
              setMoves(m => {
                const opt = optimalMovesRef.current;
                const s = calcScore(m, opt, hintsUsedRef.current);
                setScore(s);
                setStars(calcStars(m, opt));
                setStatus("won");
                const stats = loadStats();
                stats.levelsCleared += 1;
                if (s > stats.bestScore) stats.bestScore = s;
                saveStats(stats);
                return m;
              });
            }
            return next;
          });
          setExitingId(null);
          animating.current = false;
        }, 400);

        return updated;
      } else {
        const newHead = nextHeadPos(arrow.direction, arrow.headRow, arrow.headCol, actualSteps);
        return prev.map(a =>
          a.id === arrowId ? { ...a, headRow: newHead[0], headCol: newHead[1] } : a
        );
      }
    });
  }, [status]);

  // ── Tap/click an arrow ────────────────────────────────────────────────
  const tapArrow = useCallback((id: string) => {
    doMove(id, 999); // move as far as possible (maxSteps clamped internally)
  }, [doMove]);

  // ── Select for directional input ──────────────────────────────────────
  const selectArrow = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  // ── Move selected arrow one step ──────────────────────────────────────
  const moveSelected = useCallback((steps = 1) => {
    if (selectedId) doMove(selectedId, steps);
  }, [selectedId, doMove]);

  // ── Undo ──────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (animating.current) return;
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setArrows(prev);
      setMoves(m => Math.max(0, m - 1));
      setStatus("playing");
      return h.slice(0, -1);
    });
  }, []);

  // ── Hint ──────────────────────────────────────────────────────────────
  const showHint = useCallback(() => {
    if (hintsLeft <= 0) return;
    setArrows(prev => {
      const gs = gridSizeRef.current;
      const canExit = prev.find(a => !a.isExited && canExitDirectly(a, prev, gs));
      const canMove = prev.find(a => !a.isExited && maxSteps(a, prev, gs) > 0);
      const target = canExit || canMove;
      if (target) {
        setHintId(target.id);
        setHintsLeft(h => h - 1);
        hintsUsedRef.current += 1;
        if (hintTimer.current) clearTimeout(hintTimer.current);
        hintTimer.current = setTimeout(() => setHintId(null), 2500);
      }
      return prev;
    });
  }, [hintsLeft, gridSize]);

  // ── Restart ───────────────────────────────────────────────────────────
  const restartLevel = useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    animating.current = false;
    setArrows(initArrows(LEVELS[level - 1]));
    setMoves(0);
    setScore(0);
    setStatus("playing");
    setHintsLeft(3);
    setHintId(null);
    setBlockedId(null);
    setExitingId(null);
    setSelectedId(null);
    setHistory([]);
    setStars(0);
    hintsUsedRef.current = 0;
  }, [level]);

  // ── Next Level ────────────────────────────────────────────────────────
  const nextLevel = useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    animating.current = false;
    const nextLvl = level < LEVELS.length ? level + 1 : 1;
    setLevel(nextLvl);
    setArrows(initArrows(LEVELS[nextLvl - 1]));
    setMoves(0);
    setScore(0);
    setStatus("playing");
    setHintsLeft(3);
    setHintId(null);
    setBlockedId(null);
    setExitingId(null);
    setSelectedId(null);
    setHistory([]);
    setStars(0);
    hintsUsedRef.current = 0;
    if (nextLvl === 1) {
      const stats = loadStats();
      stats.gamesPlayed += 1;
      saveStats(stats);
    }
  }, [level]);

  const setGameMode = useCallback((m: GameMode) => setMode(m), []);

  return {
    arrows,
    gridSize,
    moves,
    selectedId,
    status,
    mode,
    level,
    score,
    hintsLeft,
    hintId,
    blockedId,
    exitingId,
    history,
    stars,
    selectArrow,
    moveSelected,
    tapArrow,
    undo,
    showHint,
    restartLevel,
    nextLevel,
    setGameMode,
  };
}
