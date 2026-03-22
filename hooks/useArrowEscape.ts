"use client";
import { useState, useCallback, useRef } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { getContractAddress } from "@/lib/contracts/addresses";

// ========================================
// ON-CHAIN ABI
// ========================================

const ARROWESCAPE_ABI = [
  { type: "function", name: "startSession",  inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "endSession",    inputs: [
    { name: "levelsPlayed",  type: "uint256" },
    { name: "levelsCleared", type: "uint256" },
    { name: "bestScore",     type: "uint256" },
    { name: "bestLevel",     type: "uint256" },
  ], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "abandonSession", inputs: [], outputs: [], stateMutability: "nonpayable" },
] as const;

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

  // ── Level 1 — 5×5 — 7 arrows — ~7 moves ─────────────────────────────────
  // Intro: all have at most 1 blocker. Chain: clear edges → centre unlocks.
  // right(0,4)=(0,4)(0,3)  up(0,1)=(0,1)(1,1)  down(4,3)=(4,3)(3,3)
  // left(2,0)=(2,0)(2,1)   right(1,4)=(1,4)(1,3)  up(0,2)=(0,2)(1,2)
  // down(4,0)=(4,0)(3,0)   — verified zero-overlap
  {
    gridSize: 5,
    optimalMoves: 7,
    arrows: [
      { direction: "right", length: 2, headRow: 0, headCol: 4 },
      { direction: "up",    length: 2, headRow: 0, headCol: 1 },
      { direction: "down",  length: 2, headRow: 4, headCol: 3 },
      { direction: "left",  length: 2, headRow: 2, headCol: 0 },
      { direction: "right", length: 2, headRow: 1, headCol: 4 },
      { direction: "up",    length: 2, headRow: 0, headCol: 2 },
      { direction: "down",  length: 2, headRow: 4, headCol: 0 },
    ],
  },

  // ── Level 2 — 6×6 — 9 arrows — ~12 moves ────────────────────────────────
  // Two waves. Lengths 2-3. Inner arrows blocked by outer ones.
  // Verified zero-overlap with tryBuild().
  {
    gridSize: 6,
    optimalMoves: 12,
    arrows: [
      { direction: "right", length: 2, headRow: 0, headCol: 5 }, // (0,5)(0,4)
      { direction: "right", length: 3, headRow: 2, headCol: 5 }, // (2,5)(2,4)(2,3)
      { direction: "down",  length: 2, headRow: 5, headCol: 0 }, // (5,0)(4,0)
      { direction: "down",  length: 3, headRow: 5, headCol: 3 }, // (5,3)(4,3)(3,3)
      { direction: "left",  length: 2, headRow: 4, headCol: 1 }, // (4,1)(4,2)
      { direction: "left",  length: 3, headRow: 1, headCol: 0 }, // (1,0)(1,1)(1,2)
      { direction: "down",  length: 2, headRow: 5, headCol: 5 }, // (5,5)(4,5)
      { direction: "right", length: 2, headRow: 3, headCol: 5 }, // (3,5)(3,4)
      { direction: "up",    length: 2, headRow: 0, headCol: 3 }, // (0,3)(1,3)
    ],
  },

  // ── Level 3 — 7×7 — 12 arrows — ~18 moves ───────────────────────────────
  // Three waves. Mix of lengths 2-3. Cross-directional dependencies.
  // Verified zero-overlap with tryBuild().
  {
    gridSize: 7,
    optimalMoves: 18,
    arrows: [
      { direction: "right", length: 3, headRow: 0, headCol: 6 }, // (0,6)(0,5)(0,4)
      { direction: "right", length: 2, headRow: 2, headCol: 6 }, // (2,6)(2,5)
      { direction: "right", length: 3, headRow: 4, headCol: 6 }, // (4,6)(4,5)(4,4)
      { direction: "down",  length: 3, headRow: 6, headCol: 0 }, // (6,0)(5,0)(4,0)
      { direction: "down",  length: 2, headRow: 6, headCol: 3 }, // (6,3)(5,3)
      { direction: "down",  length: 2, headRow: 6, headCol: 5 }, // (6,5)(5,5)
      { direction: "left",  length: 2, headRow: 3, headCol: 0 }, // (3,0)(3,1)
      { direction: "left",  length: 2, headRow: 6, headCol: 1 }, // (6,1)(6,2)
      { direction: "up",    length: 3, headRow: 0, headCol: 2 }, // (0,2)(1,2)(2,2)
      { direction: "up",    length: 2, headRow: 1, headCol: 4 }, // (1,4)(2,4)
      { direction: "right", length: 2, headRow: 5, headCol: 2 }, // (5,2)(5,1)
      { direction: "up",    length: 2, headRow: 0, headCol: 0 }, // (0,0)(1,0)
    ],
  },

  // ── Level 4 — 8×8 — 15 arrows — ~25 moves ───────────────────────────────
  // Four waves. Length 2-4. Multiple cross-dependencies.
  // Verified zero-overlap with tryBuild().
  {
    gridSize: 8,
    optimalMoves: 25,
    arrows: [
      { direction: "right", length: 3, headRow: 0, headCol: 7 }, // (0,7)(0,6)(0,5)
      { direction: "right", length: 2, headRow: 2, headCol: 7 }, // (2,7)(2,6)
      { direction: "right", length: 3, headRow: 4, headCol: 7 }, // (4,7)(4,6)(4,5)
      { direction: "right", length: 2, headRow: 6, headCol: 7 }, // (6,7)(6,6)
      { direction: "down",  length: 3, headRow: 7, headCol: 0 }, // (7,0)(6,0)(5,0)
      { direction: "down",  length: 2, headRow: 7, headCol: 3 }, // (7,3)(6,3)
      { direction: "down",  length: 3, headRow: 7, headCol: 5 }, // (7,5)(6,5)(5,5)
      { direction: "down",  length: 3, headRow: 4, headCol: 2 }, // (4,2)(3,2)(2,2)
      { direction: "left",  length: 3, headRow: 1, headCol: 0 }, // (1,0)(1,1)(1,2)
      { direction: "left",  length: 2, headRow: 3, headCol: 0 }, // (3,0)(3,1)
      { direction: "left",  length: 3, headRow: 5, headCol: 2 }, // (5,2)(5,3)(5,4)
      { direction: "up",    length: 3, headRow: 0, headCol: 4 }, // (0,4)(1,4)(2,4)
      { direction: "up",    length: 2, headRow: 5, headCol: 1 }, // (5,1)(6,1)
      { direction: "right", length: 2, headRow: 7, headCol: 7 }, // (7,7)(7,6)
      { direction: "up",    length: 2, headRow: 2, headCol: 5 }, // (2,5)(3,5)
    ],
  },

  // ── Level 5 — 9×9 — 18 arrows — ~35 moves ───────────────────────────────
  // Expert: length 2-4, deep 4-step chains, crowded interior.
  // Verified zero-overlap with tryBuild().
  {
    gridSize: 9,
    optimalMoves: 35,
    arrows: [
      { direction: "right", length: 3, headRow: 0, headCol: 8 }, // (0,8)(0,7)(0,6)
      { direction: "right", length: 2, headRow: 2, headCol: 8 }, // (2,8)(2,7)
      { direction: "right", length: 4, headRow: 4, headCol: 8 }, // (4,8)(4,7)(4,6)(4,5)
      { direction: "right", length: 3, headRow: 6, headCol: 8 }, // (6,8)(6,7)(6,6)
      { direction: "down",  length: 3, headRow: 8, headCol: 0 }, // (8,0)(7,0)(6,0)
      { direction: "down",  length: 2, headRow: 8, headCol: 3 }, // (8,3)(7,3)
      { direction: "down",  length: 3, headRow: 8, headCol: 5 }, // (8,5)(7,5)(6,5)
      { direction: "down",  length: 2, headRow: 8, headCol: 8 }, // (8,8)(7,8)
      { direction: "left",  length: 2, headRow: 0, headCol: 0 }, // (0,0)(0,1)
      { direction: "left",  length: 3, headRow: 3, headCol: 0 }, // (3,0)(3,1)(3,2)
      { direction: "left",  length: 4, headRow: 5, headCol: 0 }, // (5,0)(5,1)(5,2)(5,3)
      { direction: "left",  length: 2, headRow: 8, headCol: 1 }, // (8,1)(8,2)
      { direction: "up",    length: 3, headRow: 0, headCol: 2 }, // (0,2)(1,2)(2,2)
      { direction: "up",    length: 4, headRow: 0, headCol: 4 }, // (0,4)(1,4)(2,4)(3,4)
      { direction: "up",    length: 3, headRow: 1, headCol: 6 }, // (1,6)(2,6)(3,6)
      { direction: "right", length: 2, headRow: 1, headCol: 8 }, // (1,8)(1,7)
      { direction: "down",  length: 2, headRow: 5, headCol: 4 }, // (5,4)(4,4)
      { direction: "up",    length: 2, headRow: 7, headCol: 7 }, // (7,7)(8,7) — up head=7,body=8 → (7,7)(8,7)
    ],
  },

  // ── Level 6 — 10×10 — 20 arrows — ~45 moves ─────────────────────────────
  // Perimeter + interior. Lengths 2-4. Verified zero-overlap.
  {
    gridSize: 10,
    optimalMoves: 45,
    arrows: [
      { direction: "right", length: 3, headRow: 0, headCol: 9 }, // (0,9)(0,8)(0,7)
      { direction: "right", length: 2, headRow: 2, headCol: 9 }, // (2,9)(2,8)
      { direction: "right", length: 4, headRow: 4, headCol: 9 }, // (4,9)(4,8)(4,7)(4,6)
      { direction: "right", length: 3, headRow: 6, headCol: 9 }, // (6,9)(6,8)(6,7)
      { direction: "right", length: 2, headRow: 8, headCol: 9 }, // (8,9)(8,8)
      { direction: "down",  length: 3, headRow: 9, headCol: 0 }, // (9,0)(8,0)(7,0)
      { direction: "down",  length: 2, headRow: 9, headCol: 1 }, // (9,1)(8,1)
      { direction: "down",  length: 3, headRow: 9, headCol: 3 }, // (9,3)(8,3)(7,3)
      { direction: "down",  length: 4, headRow: 9, headCol: 5 }, // (9,5)(8,5)(7,5)(6,5)
      { direction: "down",  length: 2, headRow: 9, headCol: 7 }, // (9,7)(8,7)
      { direction: "left",  length: 3, headRow: 1, headCol: 0 }, // (1,0)(1,1)(1,2)
      { direction: "left",  length: 2, headRow: 3, headCol: 0 }, // (3,0)(3,1)
      { direction: "left",  length: 4, headRow: 5, headCol: 0 }, // (5,0)(5,1)(5,2)(5,3)
      { direction: "left",  length: 2, headRow: 7, headCol: 6 }, // (7,6)(7,7)
      { direction: "left",  length: 2, headRow: 9, headCol: 8 }, // (9,8)(9,9)
      { direction: "up",    length: 3, headRow: 0, headCol: 3 }, // (0,3)(1,3)(2,3)
      { direction: "up",    length: 4, headRow: 0, headCol: 4 }, // (0,4)(1,4)(2,4)(3,4)
      { direction: "up",    length: 2, headRow: 1, headCol: 6 }, // (1,6)(2,6)
      { direction: "up",    length: 2, headRow: 3, headCol: 2 }, // (3,2)(4,2)
      { direction: "up",    length: 2, headRow: 5, headCol: 6 }, // (5,6)(6,6)
    ],
  },

  // ── Level 7 — 11×11 — 23 arrows — ~55 moves ─────────────────────────────
  // Five waves, mixed lengths. Verified zero-overlap.
  {
    gridSize: 11,
    optimalMoves: 55,
    arrows: [
      { direction: "right", length: 3, headRow: 0,  headCol: 10 }, // (0,10)(0,9)(0,8)
      { direction: "right", length: 2, headRow: 2,  headCol: 10 }, // (2,10)(2,9)
      { direction: "right", length: 4, headRow: 4,  headCol: 10 }, // (4,10)(4,9)(4,8)(4,7)
      { direction: "right", length: 3, headRow: 6,  headCol: 10 }, // (6,10)(6,9)(6,8)
      { direction: "right", length: 2, headRow: 8,  headCol: 10 }, // (8,10)(8,9)
      { direction: "right", length: 4, headRow: 10, headCol: 10 }, // (10,10)(10,9)(10,8)(10,7)
      { direction: "down",  length: 3, headRow: 10, headCol: 0  }, // (10,0)(9,0)(8,0)
      { direction: "down",  length: 2, headRow: 10, headCol: 2  }, // (10,2)(9,2)
      { direction: "down",  length: 4, headRow: 10, headCol: 4  }, // (10,4)(9,4)(8,4)(7,4)
      { direction: "down",  length: 3, headRow: 10, headCol: 6  }, // (10,6)(9,6)(8,6)
      { direction: "down",  length: 2, headRow: 9,  headCol: 7  }, // (9,7)(8,7)
      { direction: "left",  length: 3, headRow: 1,  headCol: 0  }, // (1,0)(1,1)(1,2)
      { direction: "left",  length: 2, headRow: 3,  headCol: 0  }, // (3,0)(3,1)
      { direction: "left",  length: 4, headRow: 5,  headCol: 0  }, // (5,0)(5,1)(5,2)(5,3)
      { direction: "left",  length: 3, headRow: 7,  headCol: 0  }, // (7,0)(7,1)(7,2)
      { direction: "left",  length: 2, headRow: 9,  headCol: 8  }, // (9,8)(9,9)
      { direction: "up",    length: 3, headRow: 0,  headCol: 3  }, // (0,3)(1,3)(2,3)
      { direction: "up",    length: 4, headRow: 0,  headCol: 5  }, // (0,5)(1,5)(2,5)(3,5)
      { direction: "up",    length: 2, headRow: 0,  headCol: 7  }, // (0,7)(1,7)
      { direction: "up",    length: 3, headRow: 2,  headCol: 2  }, // (2,2)(3,2)(4,2)
      { direction: "up",    length: 2, headRow: 4,  headCol: 6  }, // (4,6)(5,6)
      { direction: "up",    length: 2, headRow: 6,  headCol: 5  }, // (6,5)(7,5)
      { direction: "up",    length: 2, headRow: 7,  headCol: 8  }, // (7,8)(8,8)
    ],
  },

  // ── Level 8 — 12×12 — 25 arrows — ~65 moves ─────────────────────────────
  // Six waves. Interior cross-dependencies. Verified zero-overlap.
  {
    gridSize: 12,
    optimalMoves: 65,
    arrows: [
      { direction: "right", length: 3, headRow: 0,  headCol: 11 }, // (0,11)(0,10)(0,9)
      { direction: "right", length: 4, headRow: 2,  headCol: 11 }, // (2,11)(2,10)(2,9)(2,8)
      { direction: "right", length: 2, headRow: 4,  headCol: 11 }, // (4,11)(4,10)
      { direction: "right", length: 4, headRow: 6,  headCol: 11 }, // (6,11)(6,10)(6,9)(6,8)
      { direction: "right", length: 3, headRow: 8,  headCol: 11 }, // (8,11)(8,10)(8,9)
      { direction: "right", length: 2, headRow: 10, headCol: 11 }, // (10,11)(10,10)
      { direction: "down",  length: 3, headRow: 11, headCol: 0  }, // (11,0)(10,0)(9,0)
      { direction: "down",  length: 2, headRow: 11, headCol: 2  }, // (11,2)(10,2)
      { direction: "down",  length: 4, headRow: 11, headCol: 4  }, // (11,4)(10,4)(9,4)(8,4)
      { direction: "down",  length: 2, headRow: 11, headCol: 6  }, // (11,6)(10,6)
      { direction: "down",  length: 4, headRow: 11, headCol: 8  }, // (11,8)(10,8)(9,8)(8,8)
      { direction: "down",  length: 2, headRow: 10, headCol: 9  }, // (10,9)(9,9)
      { direction: "left",  length: 3, headRow: 1,  headCol: 0  }, // (1,0)(1,1)(1,2)
      { direction: "left",  length: 4, headRow: 3,  headCol: 0  }, // (3,0)(3,1)(3,2)(3,3)
      { direction: "left",  length: 2, headRow: 5,  headCol: 0  }, // (5,0)(5,1)
      { direction: "left",  length: 4, headRow: 7,  headCol: 0  }, // (7,0)(7,1)(7,2)(7,3)
      { direction: "left",  length: 2, headRow: 9,  headCol: 5  }, // (9,5)(9,6)
      { direction: "left",  length: 2, headRow: 11, headCol: 9  }, // (11,9)(11,10)
      { direction: "up",    length: 3, headRow: 0,  headCol: 3  }, // (0,3)(1,3)(2,3)
      { direction: "up",    length: 4, headRow: 0,  headCol: 5  }, // (0,5)(1,5)(2,5)(3,5)
      { direction: "up",    length: 2, headRow: 0,  headCol: 7  }, // (0,7)(1,7)
      { direction: "up",    length: 2, headRow: 3,  headCol: 9  }, // (3,9)(4,9)
      { direction: "up",    length: 2, headRow: 4,  headCol: 3  }, // (4,3)(5,3)
      { direction: "up",    length: 2, headRow: 5,  headCol: 7  }, // (5,7)(6,7)
      { direction: "up",    length: 3, headRow: 4,  headCol: 5  }, // (4,5)(5,5)(6,5)
    ],
  },

  // ── Level 9 — 13×13 — 30 arrows — ~80 moves ─────────────────────────────
  // Seven waves + interior. Complex cross-chains. Verified zero-overlap.
  {
    gridSize: 13,
    optimalMoves: 80,
    arrows: [
      { direction: "right", length: 2, headRow: 0,  headCol: 12 }, // (0,12)(0,11)
      { direction: "right", length: 3, headRow: 2,  headCol: 12 }, // (2,12)(2,11)(2,10)
      { direction: "right", length: 2, headRow: 4,  headCol: 12 }, // (4,12)(4,11)
      { direction: "right", length: 3, headRow: 6,  headCol: 12 }, // (6,12)(6,11)(6,10)
      { direction: "right", length: 2, headRow: 8,  headCol: 12 }, // (8,12)(8,11)
      { direction: "right", length: 3, headRow: 10, headCol: 12 }, // (10,12)(10,11)(10,10)
      { direction: "right", length: 2, headRow: 12, headCol: 12 }, // (12,12)(12,11)
      { direction: "down",  length: 2, headRow: 12, headCol: 0  }, // (12,0)(11,0)
      { direction: "down",  length: 3, headRow: 12, headCol: 2  }, // (12,2)(11,2)(10,2)
      { direction: "down",  length: 2, headRow: 12, headCol: 4  }, // (12,4)(11,4)
      { direction: "down",  length: 3, headRow: 12, headCol: 6  }, // (12,6)(11,6)(10,6)
      { direction: "down",  length: 2, headRow: 12, headCol: 8  }, // (12,8)(11,8)
      { direction: "down",  length: 2, headRow: 12, headCol: 9  }, // (12,9)(11,9)
      { direction: "left",  length: 2, headRow: 1,  headCol: 0  }, // (1,0)(1,1)
      { direction: "left",  length: 3, headRow: 3,  headCol: 0  }, // (3,0)(3,1)(3,2)
      { direction: "left",  length: 2, headRow: 5,  headCol: 0  }, // (5,0)(5,1)
      { direction: "left",  length: 3, headRow: 7,  headCol: 0  }, // (7,0)(7,1)(7,2)
      { direction: "left",  length: 2, headRow: 9,  headCol: 0  }, // (9,0)(9,1)
      { direction: "left",  length: 2, headRow: 11, headCol: 10 }, // (11,10)(11,11)
      { direction: "up",    length: 2, headRow: 0,  headCol: 2  }, // (0,2)(1,2)
      { direction: "up",    length: 3, headRow: 0,  headCol: 4  }, // (0,4)(1,4)(2,4)
      { direction: "up",    length: 2, headRow: 0,  headCol: 6  }, // (0,6)(1,6)
      { direction: "up",    length: 3, headRow: 0,  headCol: 8  }, // (0,8)(1,8)(2,8)
      { direction: "up",    length: 2, headRow: 0,  headCol: 10 }, // (0,10)(1,10)
      { direction: "right", length: 2, headRow: 5,  headCol: 8  }, // (5,8)(5,7)
      { direction: "down",  length: 2, headRow: 8,  headCol: 5  }, // (8,5)(7,5)
      { direction: "left",  length: 2, headRow: 7,  headCol: 9  }, // (7,9)(7,10)
      { direction: "up",    length: 2, headRow: 5,  headCol: 4  }, // (5,4)(6,4)
      { direction: "right", length: 2, headRow: 3,  headCol: 10 }, // (3,10)(3,9)
      { direction: "up",    length: 2, headRow: 4,  headCol: 6  }, // (4,6)(5,6)
    ],
  },

  // ── Level 10 — 14×14 — 36 arrows — ~100 moves ───────────────────────────
  // Expert master. Dense perimeter + deep interior chains. Verified zero-overlap.
  {
    gridSize: 14,
    optimalMoves: 100,
    arrows: [
      { direction: "right", length: 2, headRow: 0,  headCol: 13 }, // (0,13)(0,12)
      { direction: "right", length: 3, headRow: 2,  headCol: 13 }, // (2,13)(2,12)(2,11)
      { direction: "right", length: 2, headRow: 4,  headCol: 13 }, // (4,13)(4,12)
      { direction: "right", length: 3, headRow: 6,  headCol: 13 }, // (6,13)(6,12)(6,11)
      { direction: "right", length: 2, headRow: 8,  headCol: 13 }, // (8,13)(8,12)
      { direction: "right", length: 3, headRow: 10, headCol: 13 }, // (10,13)(10,12)(10,11)
      { direction: "right", length: 2, headRow: 12, headCol: 13 }, // (12,13)(12,12)
      { direction: "down",  length: 2, headRow: 13, headCol: 0  }, // (13,0)(12,0)
      { direction: "down",  length: 3, headRow: 13, headCol: 2  }, // (13,2)(12,2)(11,2)
      { direction: "down",  length: 2, headRow: 13, headCol: 4  }, // (13,4)(12,4)
      { direction: "down",  length: 3, headRow: 13, headCol: 6  }, // (13,6)(12,6)(11,6)
      { direction: "down",  length: 2, headRow: 13, headCol: 8  }, // (13,8)(12,8)
      { direction: "down",  length: 3, headRow: 13, headCol: 10 }, // (13,10)(12,10)(11,10)
      { direction: "down",  length: 2, headRow: 12, headCol: 11 }, // (12,11)(11,11)
      { direction: "left",  length: 2, headRow: 1,  headCol: 0  }, // (1,0)(1,1)
      { direction: "left",  length: 3, headRow: 3,  headCol: 0  }, // (3,0)(3,1)(3,2)
      { direction: "left",  length: 2, headRow: 5,  headCol: 0  }, // (5,0)(5,1)
      { direction: "left",  length: 3, headRow: 7,  headCol: 0  }, // (7,0)(7,1)(7,2)
      { direction: "left",  length: 2, headRow: 9,  headCol: 0  }, // (9,0)(9,1)
      { direction: "left",  length: 2, headRow: 11, headCol: 3  }, // (11,3)(11,4)
      { direction: "left",  length: 2, headRow: 13, headCol: 11 }, // (13,11)(13,12)
      { direction: "up",    length: 2, headRow: 0,  headCol: 2  }, // (0,2)(1,2)
      { direction: "up",    length: 3, headRow: 0,  headCol: 4  }, // (0,4)(1,4)(2,4)
      { direction: "up",    length: 2, headRow: 0,  headCol: 6  }, // (0,6)(1,6)
      { direction: "up",    length: 3, headRow: 0,  headCol: 8  }, // (0,8)(1,8)(2,8)
      { direction: "up",    length: 2, headRow: 0,  headCol: 10 }, // (0,10)(1,10)
      { direction: "up",    length: 2, headRow: 0,  headCol: 11 }, // (0,11)(1,11)
      { direction: "right", length: 2, headRow: 5,  headCol: 9  }, // (5,9)(5,8)
      { direction: "right", length: 3, headRow: 3,  headCol: 11 }, // (3,11)(3,10)(3,9)
      { direction: "down",  length: 2, headRow: 9,  headCol: 5  }, // (9,5)(8,5)
      { direction: "down",  length: 2, headRow: 10, headCol: 3  }, // (10,3)(9,3)
      { direction: "left",  length: 2, headRow: 10, headCol: 8  }, // (10,8)(10,9)
      { direction: "up",    length: 2, headRow: 6,  headCol: 4  }, // (6,4)(7,4)
      { direction: "up",    length: 3, headRow: 4,  headCol: 6  }, // (4,6)(5,6)(6,6)
      { direction: "right", length: 2, headRow: 7,  headCol: 9  }, // (7,9)(7,8)
      { direction: "down",  length: 2, headRow: 9,  headCol: 7  }, // (9,7)(8,7)
    ],
  },

  // ── Level 11 — 15×15 — 35 arrows — ~120 moves ────────────────────────────
  // Perimeter ring (RIGHT odd rows, DOWN odd cols, LEFT even rows, UP even cols)
  // + interior RIGHT grid. Verified zero-overlap with tryBuild().
  {
    gridSize: 15,
    optimalMoves: 120,
    arrows: [
      { direction: "right", length: 2, headRow: 1,  headCol: 14 },
      { direction: "right", length: 2, headRow: 3,  headCol: 14 },
      { direction: "right", length: 3, headRow: 5,  headCol: 14 },
      { direction: "right", length: 2, headRow: 7,  headCol: 14 },
      { direction: "right", length: 3, headRow: 9,  headCol: 14 },
      { direction: "right", length: 2, headRow: 11, headCol: 14 },
      { direction: "down",  length: 2, headRow: 14, headCol: 1  },
      { direction: "down",  length: 2, headRow: 14, headCol: 3  },
      { direction: "down",  length: 3, headRow: 14, headCol: 5  },
      { direction: "down",  length: 2, headRow: 14, headCol: 7  },
      { direction: "down",  length: 3, headRow: 14, headCol: 9  },
      { direction: "down",  length: 2, headRow: 14, headCol: 11 },
      { direction: "left",  length: 3, headRow: 2,  headCol: 0  },
      { direction: "left",  length: 2, headRow: 4,  headCol: 0  },
      { direction: "left",  length: 3, headRow: 6,  headCol: 0  },
      { direction: "left",  length: 2, headRow: 8,  headCol: 0  },
      { direction: "left",  length: 3, headRow: 10, headCol: 0  },
      { direction: "left",  length: 2, headRow: 12, headCol: 0  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 2  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 4  },
      { direction: "up",    length: 3, headRow: 0,  headCol: 6  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 8  },
      { direction: "up",    length: 3, headRow: 0,  headCol: 10 },
      { direction: "up",    length: 2, headRow: 0,  headCol: 12 },
      { direction: "right", length: 2, headRow: 3,  headCol: 10 },
      { direction: "right", length: 2, headRow: 3,  headCol: 8  },
      { direction: "right", length: 2, headRow: 3,  headCol: 6  },
      { direction: "right", length: 2, headRow: 5,  headCol: 10 },
      { direction: "right", length: 2, headRow: 5,  headCol: 8  },
      { direction: "right", length: 2, headRow: 5,  headCol: 6  },
      { direction: "right", length: 2, headRow: 7,  headCol: 10 },
      { direction: "right", length: 2, headRow: 7,  headCol: 8  },
      { direction: "right", length: 2, headRow: 7,  headCol: 6  },
      { direction: "right", length: 2, headRow: 9,  headCol: 10 },
      { direction: "right", length: 2, headRow: 9,  headCol: 8  },
    ],
  },

  // ── Level 12 — 16×16 — 40 arrows — ~145 moves ────────────────────────────
  // Perimeter ring + interior RIGHT grid (4 rows × 4 positions). Verified zero-overlap.
  {
    gridSize: 16,
    optimalMoves: 145,
    arrows: [
      { direction: "right", length: 2, headRow: 1,  headCol: 15 },
      { direction: "right", length: 2, headRow: 3,  headCol: 15 },
      { direction: "right", length: 3, headRow: 5,  headCol: 15 },
      { direction: "right", length: 2, headRow: 7,  headCol: 15 },
      { direction: "right", length: 3, headRow: 9,  headCol: 15 },
      { direction: "right", length: 2, headRow: 11, headCol: 15 },
      { direction: "down",  length: 2, headRow: 15, headCol: 1  },
      { direction: "down",  length: 2, headRow: 15, headCol: 3  },
      { direction: "down",  length: 3, headRow: 15, headCol: 5  },
      { direction: "down",  length: 2, headRow: 15, headCol: 7  },
      { direction: "down",  length: 3, headRow: 15, headCol: 9  },
      { direction: "down",  length: 2, headRow: 15, headCol: 11 },
      { direction: "left",  length: 3, headRow: 2,  headCol: 0  },
      { direction: "left",  length: 2, headRow: 4,  headCol: 0  },
      { direction: "left",  length: 3, headRow: 6,  headCol: 0  },
      { direction: "left",  length: 2, headRow: 8,  headCol: 0  },
      { direction: "left",  length: 3, headRow: 10, headCol: 0  },
      { direction: "left",  length: 2, headRow: 12, headCol: 0  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 2  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 4  },
      { direction: "up",    length: 3, headRow: 0,  headCol: 6  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 8  },
      { direction: "up",    length: 3, headRow: 0,  headCol: 10 },
      { direction: "up",    length: 2, headRow: 0,  headCol: 12 },
      { direction: "right", length: 2, headRow: 3,  headCol: 11 },
      { direction: "right", length: 2, headRow: 3,  headCol: 9  },
      { direction: "right", length: 2, headRow: 3,  headCol: 7  },
      { direction: "right", length: 2, headRow: 3,  headCol: 5  },
      { direction: "right", length: 2, headRow: 5,  headCol: 11 },
      { direction: "right", length: 2, headRow: 5,  headCol: 9  },
      { direction: "right", length: 2, headRow: 5,  headCol: 7  },
      { direction: "right", length: 2, headRow: 5,  headCol: 5  },
      { direction: "right", length: 2, headRow: 7,  headCol: 11 },
      { direction: "right", length: 2, headRow: 7,  headCol: 9  },
      { direction: "right", length: 2, headRow: 7,  headCol: 7  },
      { direction: "right", length: 2, headRow: 7,  headCol: 5  },
      { direction: "right", length: 2, headRow: 9,  headCol: 11 },
      { direction: "right", length: 2, headRow: 9,  headCol: 9  },
      { direction: "right", length: 2, headRow: 9,  headCol: 7  },
      { direction: "right", length: 2, headRow: 9,  headCol: 5  },
    ],
  },

  // ── Level 13 — 17×17 — 45 arrows — ~170 moves ────────────────────────────
  // Denser perimeter (7 per side) + interior RIGHT grid. Verified zero-overlap.
  {
    gridSize: 17,
    optimalMoves: 170,
    arrows: [
      { direction: "right", length: 2, headRow: 1,  headCol: 16 },
      { direction: "right", length: 2, headRow: 3,  headCol: 16 },
      { direction: "right", length: 3, headRow: 5,  headCol: 16 },
      { direction: "right", length: 2, headRow: 7,  headCol: 16 },
      { direction: "right", length: 3, headRow: 9,  headCol: 16 },
      { direction: "right", length: 2, headRow: 11, headCol: 16 },
      { direction: "right", length: 3, headRow: 13, headCol: 16 },
      { direction: "down",  length: 2, headRow: 16, headCol: 1  },
      { direction: "down",  length: 2, headRow: 16, headCol: 3  },
      { direction: "down",  length: 3, headRow: 16, headCol: 5  },
      { direction: "down",  length: 2, headRow: 16, headCol: 7  },
      { direction: "down",  length: 3, headRow: 16, headCol: 9  },
      { direction: "down",  length: 2, headRow: 16, headCol: 11 },
      { direction: "down",  length: 3, headRow: 16, headCol: 13 },
      { direction: "left",  length: 3, headRow: 2,  headCol: 0  },
      { direction: "left",  length: 2, headRow: 4,  headCol: 0  },
      { direction: "left",  length: 3, headRow: 6,  headCol: 0  },
      { direction: "left",  length: 2, headRow: 8,  headCol: 0  },
      { direction: "left",  length: 3, headRow: 10, headCol: 0  },
      { direction: "left",  length: 2, headRow: 12, headCol: 0  },
      { direction: "left",  length: 3, headRow: 14, headCol: 0  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 2  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 4  },
      { direction: "up",    length: 3, headRow: 0,  headCol: 6  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 8  },
      { direction: "up",    length: 3, headRow: 0,  headCol: 10 },
      { direction: "up",    length: 2, headRow: 0,  headCol: 12 },
      { direction: "up",    length: 3, headRow: 0,  headCol: 14 },
      { direction: "right", length: 2, headRow: 3,  headCol: 12 },
      { direction: "right", length: 2, headRow: 3,  headCol: 10 },
      { direction: "right", length: 2, headRow: 3,  headCol: 8  },
      { direction: "right", length: 2, headRow: 3,  headCol: 6  },
      { direction: "right", length: 2, headRow: 5,  headCol: 12 },
      { direction: "right", length: 2, headRow: 5,  headCol: 10 },
      { direction: "right", length: 2, headRow: 5,  headCol: 8  },
      { direction: "right", length: 2, headRow: 5,  headCol: 6  },
      { direction: "right", length: 2, headRow: 7,  headCol: 12 },
      { direction: "right", length: 2, headRow: 7,  headCol: 10 },
      { direction: "right", length: 2, headRow: 7,  headCol: 8  },
      { direction: "right", length: 2, headRow: 7,  headCol: 6  },
      { direction: "right", length: 2, headRow: 9,  headCol: 12 },
      { direction: "right", length: 2, headRow: 9,  headCol: 10 },
      { direction: "right", length: 2, headRow: 9,  headCol: 8  },
      { direction: "right", length: 2, headRow: 9,  headCol: 6  },
      { direction: "right", length: 2, headRow: 11, headCol: 12 },
    ],
  },

  // ── Level 14 — 18×18 — 50 arrows — ~200 moves ────────────────────────────
  // Denser perimeter + expanded interior RIGHT grid. Verified zero-overlap.
  {
    gridSize: 18,
    optimalMoves: 200,
    arrows: [
      { direction: "right", length: 2, headRow: 1,  headCol: 17 },
      { direction: "right", length: 2, headRow: 3,  headCol: 17 },
      { direction: "right", length: 3, headRow: 5,  headCol: 17 },
      { direction: "right", length: 2, headRow: 7,  headCol: 17 },
      { direction: "right", length: 3, headRow: 9,  headCol: 17 },
      { direction: "right", length: 2, headRow: 11, headCol: 17 },
      { direction: "right", length: 3, headRow: 13, headCol: 17 },
      { direction: "down",  length: 2, headRow: 17, headCol: 1  },
      { direction: "down",  length: 2, headRow: 17, headCol: 3  },
      { direction: "down",  length: 3, headRow: 17, headCol: 5  },
      { direction: "down",  length: 2, headRow: 17, headCol: 7  },
      { direction: "down",  length: 3, headRow: 17, headCol: 9  },
      { direction: "down",  length: 2, headRow: 17, headCol: 11 },
      { direction: "down",  length: 3, headRow: 17, headCol: 13 },
      { direction: "left",  length: 3, headRow: 2,  headCol: 0  },
      { direction: "left",  length: 2, headRow: 4,  headCol: 0  },
      { direction: "left",  length: 3, headRow: 6,  headCol: 0  },
      { direction: "left",  length: 2, headRow: 8,  headCol: 0  },
      { direction: "left",  length: 3, headRow: 10, headCol: 0  },
      { direction: "left",  length: 2, headRow: 12, headCol: 0  },
      { direction: "left",  length: 3, headRow: 14, headCol: 0  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 2  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 4  },
      { direction: "up",    length: 3, headRow: 0,  headCol: 6  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 8  },
      { direction: "up",    length: 3, headRow: 0,  headCol: 10 },
      { direction: "up",    length: 2, headRow: 0,  headCol: 12 },
      { direction: "up",    length: 3, headRow: 0,  headCol: 14 },
      { direction: "right", length: 2, headRow: 3,  headCol: 13 },
      { direction: "right", length: 2, headRow: 3,  headCol: 11 },
      { direction: "right", length: 2, headRow: 3,  headCol: 9  },
      { direction: "right", length: 2, headRow: 3,  headCol: 7  },
      { direction: "right", length: 2, headRow: 3,  headCol: 5  },
      { direction: "right", length: 2, headRow: 5,  headCol: 13 },
      { direction: "right", length: 2, headRow: 5,  headCol: 11 },
      { direction: "right", length: 2, headRow: 5,  headCol: 9  },
      { direction: "right", length: 2, headRow: 5,  headCol: 7  },
      { direction: "right", length: 2, headRow: 5,  headCol: 5  },
      { direction: "right", length: 2, headRow: 7,  headCol: 13 },
      { direction: "right", length: 2, headRow: 7,  headCol: 11 },
      { direction: "right", length: 2, headRow: 7,  headCol: 9  },
      { direction: "right", length: 2, headRow: 7,  headCol: 7  },
      { direction: "right", length: 2, headRow: 7,  headCol: 5  },
      { direction: "right", length: 2, headRow: 9,  headCol: 13 },
      { direction: "right", length: 2, headRow: 9,  headCol: 11 },
      { direction: "right", length: 2, headRow: 9,  headCol: 9  },
      { direction: "right", length: 2, headRow: 9,  headCol: 7  },
      { direction: "right", length: 2, headRow: 9,  headCol: 5  },
      { direction: "right", length: 2, headRow: 11, headCol: 13 },
      { direction: "right", length: 2, headRow: 11, headCol: 11 },
    ],
  },

  // ── Level 15 — 19×19 — 55 arrows — ~240 moves ────────────────────────────
  // Maximum perimeter (8 per side) + deep interior grid. Verified zero-overlap.
  {
    gridSize: 19,
    optimalMoves: 240,
    arrows: [
      { direction: "right", length: 2, headRow: 1,  headCol: 18 },
      { direction: "right", length: 2, headRow: 3,  headCol: 18 },
      { direction: "right", length: 3, headRow: 5,  headCol: 18 },
      { direction: "right", length: 2, headRow: 7,  headCol: 18 },
      { direction: "right", length: 3, headRow: 9,  headCol: 18 },
      { direction: "right", length: 2, headRow: 11, headCol: 18 },
      { direction: "right", length: 3, headRow: 13, headCol: 18 },
      { direction: "right", length: 2, headRow: 15, headCol: 18 },
      { direction: "down",  length: 2, headRow: 18, headCol: 1  },
      { direction: "down",  length: 2, headRow: 18, headCol: 3  },
      { direction: "down",  length: 3, headRow: 18, headCol: 5  },
      { direction: "down",  length: 2, headRow: 18, headCol: 7  },
      { direction: "down",  length: 3, headRow: 18, headCol: 9  },
      { direction: "down",  length: 2, headRow: 18, headCol: 11 },
      { direction: "down",  length: 3, headRow: 18, headCol: 13 },
      { direction: "down",  length: 2, headRow: 18, headCol: 15 },
      { direction: "left",  length: 3, headRow: 2,  headCol: 0  },
      { direction: "left",  length: 2, headRow: 4,  headCol: 0  },
      { direction: "left",  length: 3, headRow: 6,  headCol: 0  },
      { direction: "left",  length: 2, headRow: 8,  headCol: 0  },
      { direction: "left",  length: 3, headRow: 10, headCol: 0  },
      { direction: "left",  length: 2, headRow: 12, headCol: 0  },
      { direction: "left",  length: 3, headRow: 14, headCol: 0  },
      { direction: "left",  length: 2, headRow: 16, headCol: 0  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 2  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 4  },
      { direction: "up",    length: 3, headRow: 0,  headCol: 6  },
      { direction: "up",    length: 2, headRow: 0,  headCol: 8  },
      { direction: "up",    length: 3, headRow: 0,  headCol: 10 },
      { direction: "up",    length: 2, headRow: 0,  headCol: 12 },
      { direction: "up",    length: 3, headRow: 0,  headCol: 14 },
      { direction: "up",    length: 2, headRow: 0,  headCol: 16 },
      { direction: "right", length: 2, headRow: 3,  headCol: 14 },
      { direction: "right", length: 2, headRow: 3,  headCol: 12 },
      { direction: "right", length: 2, headRow: 3,  headCol: 10 },
      { direction: "right", length: 2, headRow: 3,  headCol: 8  },
      { direction: "right", length: 2, headRow: 3,  headCol: 6  },
      { direction: "right", length: 2, headRow: 5,  headCol: 14 },
      { direction: "right", length: 2, headRow: 5,  headCol: 12 },
      { direction: "right", length: 2, headRow: 5,  headCol: 10 },
      { direction: "right", length: 2, headRow: 5,  headCol: 8  },
      { direction: "right", length: 2, headRow: 5,  headCol: 6  },
      { direction: "right", length: 2, headRow: 7,  headCol: 14 },
      { direction: "right", length: 2, headRow: 7,  headCol: 12 },
      { direction: "right", length: 2, headRow: 7,  headCol: 10 },
      { direction: "right", length: 2, headRow: 7,  headCol: 8  },
      { direction: "right", length: 2, headRow: 7,  headCol: 6  },
      { direction: "right", length: 2, headRow: 9,  headCol: 14 },
      { direction: "right", length: 2, headRow: 9,  headCol: 12 },
      { direction: "right", length: 2, headRow: 9,  headCol: 10 },
      { direction: "right", length: 2, headRow: 9,  headCol: 8  },
      { direction: "right", length: 2, headRow: 9,  headCol: 6  },
      { direction: "right", length: 2, headRow: 11, headCol: 14 },
      { direction: "right", length: 2, headRow: 11, headCol: 12 },
      { direction: "right", length: 2, headRow: 11, headCol: 10 },
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
  const { chainId } = useAccount();
  const { writeContract } = useWriteContract();

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

  // On-chain session tracking refs
  const modeRef = useRef<GameMode>("free");
  const chainIdRef = useRef<number | undefined>(undefined);
  chainIdRef.current = chainId;
  const sessionActiveRef = useRef(false);
  const sessionLevelsPlayedRef = useRef(0);
  const sessionLevelsClearedRef = useRef(0);
  const sessionBestScoreRef = useRef(0);
  const sessionBestLevelRef = useRef(0);

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
                // Accumulate on-chain session stats
                if (modeRef.current === "onchain" && sessionActiveRef.current) {
                  sessionLevelsPlayedRef.current += 1;
                  sessionLevelsClearedRef.current += 1;
                  if (s > sessionBestScoreRef.current) sessionBestScoreRef.current = s;
                  if (levelRef.current > sessionBestLevelRef.current) sessionBestLevelRef.current = levelRef.current;
                }
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
    // Abandon on-chain session on restart
    if (modeRef.current === "onchain" && sessionActiveRef.current) {
      const addr = getContractAddress("arrowescape", chainIdRef.current);
      if (addr) writeContract({ address: addr, abi: ARROWESCAPE_ABI, functionName: "abandonSession" });
      sessionActiveRef.current = false;
      sessionLevelsPlayedRef.current = 0;
      sessionLevelsClearedRef.current = 0;
      sessionBestScoreRef.current = 0;
      sessionBestLevelRef.current = 0;
    }
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
  }, [level, writeContract]);

  // ── Next Level ────────────────────────────────────────────────────────
  const nextLevel = useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    animating.current = false;
    const nextLvl = level < LEVELS.length ? level + 1 : 1;

    // On-chain: end session when completing the full cycle (back to level 1)
    if (nextLvl === 1 && modeRef.current === "onchain" && sessionActiveRef.current) {
      const addr = getContractAddress("arrowescape", chainIdRef.current);
      if (addr && sessionLevelsPlayedRef.current > 0) {
        writeContract({
          address: addr, abi: ARROWESCAPE_ABI, functionName: "endSession",
          args: [
            BigInt(sessionLevelsPlayedRef.current),
            BigInt(sessionLevelsClearedRef.current),
            BigInt(sessionBestScoreRef.current),
            BigInt(sessionBestLevelRef.current),
          ],
        });
      }
      sessionActiveRef.current = false;
      sessionLevelsPlayedRef.current = 0;
      sessionLevelsClearedRef.current = 0;
      sessionBestScoreRef.current = 0;
      sessionBestLevelRef.current = 0;
    }

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
  }, [level, writeContract]);

  const setGameMode = useCallback((m: GameMode) => {
    const prev = modeRef.current;
    modeRef.current = m;
    setMode(m);
    // Abandon on-chain session when switching away from onchain
    if (prev === "onchain" && m !== "onchain" && sessionActiveRef.current) {
      const addr = getContractAddress("arrowescape", chainIdRef.current);
      if (addr) {
        writeContract({ address: addr, abi: ARROWESCAPE_ABI, functionName: "abandonSession" });
      }
      sessionActiveRef.current = false;
    }
    // Start session when switching to onchain
    if (m === "onchain" && !sessionActiveRef.current) {
      const addr = getContractAddress("arrowescape", chainIdRef.current);
      if (addr) {
        writeContract({ address: addr, abi: ARROWESCAPE_ABI, functionName: "startSession" });
        sessionActiveRef.current = true;
        sessionLevelsPlayedRef.current = 0;
        sessionLevelsClearedRef.current = 0;
        sessionBestScoreRef.current = 0;
        sessionBestLevelRef.current = 0;
      }
    }
  }, [writeContract]);

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
