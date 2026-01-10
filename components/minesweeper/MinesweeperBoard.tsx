import { memo } from "react";
import { motion } from "framer-motion";
import type { Board, Difficulty } from "@/hooks/useMinesweeper";

interface MinesweeperBoardProps {
  board: Board;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number, event: React.MouseEvent) => void;
  disabled: boolean;
  difficulty: Difficulty;
  focusedCell?: [number, number];
}

// Number colors for adjacent mine count
const NUMBER_COLORS: Record<number, string> = {
  1: "text-blue-600 font-bold",
  2: "text-green-600 font-bold",
  3: "text-red-600 font-bold",
  4: "text-purple-600 font-bold",
  5: "text-orange-600 font-bold",
  6: "text-cyan-600 font-bold",
  7: "text-gray-900 font-black",
  8: "text-gray-600 font-black",
};

// Cell size based on difficulty (increased for better clickability)
const CELL_SIZES: Record<Difficulty, { desktop: string; mobile: string }> = {
  easy: { desktop: "w-14 h-14 text-xl", mobile: "w-11 h-11 text-lg" },
  medium: { desktop: "w-10 h-10 text-base", mobile: "w-7 h-7 text-sm" },
  hard: { desktop: "w-7 h-7 text-sm", mobile: "w-5 h-5 text-xs" },
};

interface CellProps {
  cell: {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
    row: number;
    col: number;
  };
  onClick: () => void;
  onRightClick: (e: React.MouseEvent | React.TouchEvent) => void;
  disabled: boolean;
  cellSize: { desktop: string; mobile: string };
  isFocused: boolean;
}

const Cell = memo(function Cell({
  cell,
  onClick,
  onRightClick,
  disabled,
  cellSize,
  isFocused,
}: CellProps) {
  const { isMine, isRevealed, isFlagged, adjacentMines } = cell;

  // Long press for mobile flagging
  let pressTimer: NodeJS.Timeout;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    pressTimer = setTimeout(() => {
      onRightClick(e);
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(pressTimer);
  };

  const handleTouchMove = () => {
    clearTimeout(pressTimer);
  };

  // Cell appearance
  let cellContent: React.ReactNode = null;
  let cellClass = "";

  if (isFlagged) {
    // Flagged cell
    cellContent = <span className="text-[1em]">🚩</span>;
    cellClass =
      "bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]";
  } else if (!isRevealed) {
    // Unrevealed cell (3D raised button)
    cellClass =
      "bg-gradient-to-br from-gray-300 to-gray-400 shadow-[2px_2px_4px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.7)] hover:from-gray-350 hover:to-gray-450 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] cursor-pointer";
  } else if (isMine) {
    // Revealed mine (game over)
    cellContent = <span className="text-[1.2em]">💣</span>;
    cellClass =
      "bg-gradient-to-br from-red-500 to-red-600 shadow-inner animate-pulse";
  } else if (adjacentMines > 0) {
    // Revealed cell with number
    cellContent = (
      <span className={NUMBER_COLORS[adjacentMines]}>{adjacentMines}</span>
    );
    cellClass = "bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner";
  } else {
    // Revealed empty cell
    cellClass = "bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner";
  }

  // Add focus ring for keyboard navigation
  if (isFocused) {
    cellClass += " ring-2 ring-celo ring-offset-1";
  }

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if it's too close to a right-click
    if (e.button !== 0) return;
    onClick();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRightClick(e);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      disabled={disabled || isRevealed}
      className={`${cellSize.desktop} ${cellClass} flex items-center justify-center rounded-sm border border-gray-400/20 transition-colors duration-150 select-none sm:${cellSize.desktop} ${cellSize.mobile}`}
      initial={false}
      animate={{
        scale: isRevealed ? 0.98 : 1,
      }}
      whileHover={!isRevealed && !disabled ? { scale: 1.02, transition: { duration: 0.15 } } : {}}
      whileTap={!isRevealed && !disabled ? { scale: 0.95, transition: { duration: 0.1 } } : {}}
      aria-label={`Cell row ${cell.row + 1}, column ${cell.col + 1}, ${
        isFlagged
          ? "flagged"
          : isRevealed
          ? isMine
            ? "mine"
            : adjacentMines > 0
            ? `${adjacentMines} adjacent mines`
            : "empty"
          : "unrevealed"
      }`}
    >
      {cellContent}
    </motion.button>
  );
});

export function MinesweeperBoard({
  board,
  onCellClick,
  onCellRightClick,
  disabled,
  difficulty,
  focusedCell = [0, 0],
}: MinesweeperBoardProps) {
  if (board.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Click Start to begin!</p>
      </div>
    );
  }

  const cellSize = CELL_SIZES[difficulty];
  const cols = board[0]?.length || 0;

  // Container class for horizontal scroll on hard mode mobile
  const containerClass =
    difficulty === "hard"
      ? "overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
      : "overflow-hidden";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 p-2 sm:p-4 rounded-2xl shadow-2xl border-4 border-gray-500 ${containerClass}`}
    >
      <div
        className="inline-grid gap-[2px] bg-gray-500 p-[2px] rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              onClick={() => onCellClick(rowIndex, colIndex)}
              onRightClick={(e) => onCellRightClick(rowIndex, colIndex, e)}
              disabled={disabled}
              cellSize={cellSize}
              isFocused={
                focusedCell[0] === rowIndex && focusedCell[1] === colIndex
              }
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
