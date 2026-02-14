"use client";

import { memo } from "react";
import { WALL, PATH, PLAYER, START, EXIT } from "@/lib/games/maze-logic";
import type { MazeGrid } from "@/lib/games/maze-logic";

interface MazeBoardProps {
  grid: MazeGrid;
  gridSize: number;
}

const CELL_COLORS: Record<number, string> = {
  [WALL]: "bg-gray-800 dark:bg-gray-900",
  [PATH]: "bg-gray-100 dark:bg-gray-600",
  [PLAYER]: "bg-chain shadow-inner",
  [START]: "bg-green-300 dark:bg-green-700",
  [EXIT]: "bg-yellow-400 dark:bg-yellow-500 animate-pulse",
};

export const MazeBoard = memo(function MazeBoard({
  grid,
  gridSize,
}: MazeBoardProps) {
  if (grid.length === 0) return null;

  return (
    <div
      data-testid="maze-board"
      className="bg-gray-800 dark:bg-gray-900 rounded-xl p-1 shadow-xl border-2 border-gray-700 dark:border-gray-600 mx-auto"
      style={{ maxWidth: "100%" }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: gridSize > 21 ? "0px" : "1px",
        }}
      >
        {grid.flatMap((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              data-testid={`maze-cell-${rowIdx}-${colIdx}`}
              className={`aspect-square ${CELL_COLORS[cell] || CELL_COLORS[PATH]} ${
                cell === PLAYER ? "rounded-full" : ""
              }`}
              style={{
                minWidth: gridSize > 21 ? "8px" : "12px",
              }}
            />
          ))
        )}
      </div>
    </div>
  );
});
