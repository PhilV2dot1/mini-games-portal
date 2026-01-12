import { SudokuBoard } from "@/hooks/useSudoku";
import { Cell } from "./Cell";

interface SudokuGridProps {
  board: SudokuBoard;
  selectedCell: [number, number] | null;
  onCellSelect: (row: number, col: number) => void;
  disabled: boolean;
  conflictCells: Set<string>;
}

export function SudokuGrid({
  board,
  selectedCell,
  onCellSelect,
  disabled,
  conflictCells,
}: SudokuGridProps) {
  // Check if a cell should be highlighted (same row, column, or region as selected)
  const isCellHighlighted = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    const [selRow, selCol] = selectedCell;

    // Same row or column
    if (row === selRow || col === selCol) return true;

    // Same region
    const cellRegion = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    const selRegion = Math.floor(selRow / 3) * 3 + Math.floor(selCol / 3);
    return cellRegion === selRegion;
  };

  // Get border classes for thick borders every 3 cells
  const getCellBorderClass = (row: number, col: number): string => {
    let classes = "border border-gray-300";

    // Right thick border every 3 columns (but not on the last column)
    if ((col + 1) % 3 === 0 && col < 8) {
      classes += " border-r-2 border-r-gray-600";
    }

    // Bottom thick border every 3 rows (but not on the last row)
    if ((row + 1) % 3 === 0 && row < 8) {
      classes += " border-b-2 border-b-gray-600";
    }

    return classes;
  };

  return (
    <div className="inline-block bg-white p-2 sm:p-4 rounded-xl shadow-2xl border-4 border-gray-800">
      <div
        className="grid grid-cols-9 gap-0"
        style={{
          width: "min(90vw, 650px)",
          height: "min(90vw, 650px)",
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected = selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex;
            const isHighlighted = isCellHighlighted(rowIndex, colIndex);
            const isConflict = conflictCells.has(`${rowIndex},${colIndex}`);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getCellBorderClass(rowIndex, colIndex)}
              >
                <Cell
                  cell={cell}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  isConflict={isConflict}
                  onClick={() => onCellSelect(rowIndex, colIndex)}
                  disabled={disabled}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
