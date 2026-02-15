"use client";

import { memo, useMemo } from "react";
import {
  type Grid,
  type Piece,
  type TetrominoType,
  COLS,
  ROWS,
} from "@/lib/games/tetris-logic";

// CSS colors for proper 3D brick effect (not Tailwind classes)
const BRICK_COLORS: Record<TetrominoType, { bg: string; light: string; dark: string }> = {
  I: { bg: "#06b6d4", light: "#67e8f9", dark: "#0891b2" },
  O: { bg: "#eab308", light: "#fde047", dark: "#ca8a04" },
  T: { bg: "#a855f7", light: "#c084fc", dark: "#7c3aed" },
  S: { bg: "#22c55e", light: "#86efac", dark: "#16a34a" },
  Z: { bg: "#ef4444", light: "#fca5a5", dark: "#dc2626" },
  J: { bg: "#3b82f6", light: "#93c5fd", dark: "#2563eb" },
  L: { bg: "#f97316", light: "#fdba74", dark: "#ea580c" },
};

const GHOST_STYLE = { bg: "rgba(255,255,255,0.12)", light: "rgba(255,255,255,0.18)", dark: "rgba(255,255,255,0.06)" };

type CellDisplay = { type: "empty" } | { type: "ghost" } | { type: "piece"; piece: TetrominoType };

interface TetrisBoardProps {
  grid: Grid;
  currentPiece: Piece | null;
  ghostRow: number | null;
}

export const TetrisBoard = memo(function TetrisBoard({
  grid,
  currentPiece,
  ghostRow,
}: TetrisBoardProps) {
  // Build display grid: merge placed cells + ghost + current piece
  const displayGrid = useMemo(() => {
    const result: CellDisplay[][] = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => {
        const cell = grid[r][c];
        if (cell !== 0) return { type: "piece" as const, piece: cell };
        return { type: "empty" as const };
      })
    );

    // Render ghost piece
    if (currentPiece && ghostRow !== null && ghostRow !== currentPiece.row) {
      const { shape } = currentPiece;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const gr = ghostRow + r;
          const gc = currentPiece.col + c;
          if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS && result[gr][gc].type === "empty") {
            result[gr][gc] = { type: "ghost" };
          }
        }
      }
    }

    // Render current piece
    if (currentPiece) {
      const { shape, type, row, col } = currentPiece;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const gr = row + r;
          const gc = col + c;
          if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS) {
            result[gr][gc] = { type: "piece", piece: type };
          }
        }
      }
    }

    return result;
  }, [grid, currentPiece, ghostRow]);

  return (
    <div
      data-testid="tetris-board"
      className="bg-gray-900 dark:bg-gray-950 rounded-xl p-1.5 shadow-2xl border-2 border-gray-600 dark:border-gray-500"
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: "1px",
          width: `${COLS * 32}px`,
        }}
      >
        {displayGrid.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (cell.type === "empty") {
              return (
                <div
                  key={rowIdx * COLS + colIdx}
                  className="bg-gray-800/40 dark:bg-gray-800/25"
                  style={{ width: 32, height: 32, borderRadius: 2 }}
                />
              );
            }

            const colors = cell.type === "ghost" ? GHOST_STYLE : BRICK_COLORS[cell.piece];

            return (
              <div
                key={rowIdx * COLS + colIdx}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 3,
                  background: colors.bg,
                  boxShadow: `inset 2px 2px 0 ${colors.light}, inset -2px -2px 0 ${colors.dark}`,
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
});
