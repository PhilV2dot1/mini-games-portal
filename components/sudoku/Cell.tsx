import React from "react";
import { SudokuCell } from "@/hooks/useSudoku";

interface CellProps {
  cell: SudokuCell;
  isSelected: boolean;
  isHighlighted: boolean; // Same row/col/region as selected
  isConflict: boolean;
  onClick: () => void;
  disabled: boolean;
}

export const Cell = React.memo(function Cell({
  cell,
  isSelected,
  isHighlighted,
  isConflict,
  onClick,
  disabled,
}: CellProps) {
  const getClassName = () => {
    let classes = "flex items-center justify-center w-full h-full text-lg sm:text-xl font-semibold transition-colors cursor-pointer select-none";

    // Base styling for given vs user cells
    if (cell.isGiven) {
      classes += " text-gray-900 bg-gray-100 font-bold";
    } else {
      classes += " text-blue-600 bg-white";
    }

    // Selected state
    if (isSelected) {
      classes += " ring-2 ring-blue-500 ring-inset bg-blue-50";
    }
    // Highlighted state (same row/col/region)
    else if (isHighlighted) {
      classes += " bg-blue-50/30";
    }

    // Conflict state (takes priority)
    if (isConflict) {
      classes += " !ring-2 !ring-red-500 !bg-red-50";
    }

    // Disabled state
    if (disabled) {
      classes += " cursor-not-allowed opacity-60";
    }

    // Hover effect (only for non-given, non-disabled cells)
    if (!cell.isGiven && !disabled) {
      classes += " hover:bg-blue-50/50";
    }

    return classes;
  };

  const handleClick = () => {
    if (!disabled && !cell.isGiven) {
      onClick();
    }
  };

  return (
    <div
      className={getClassName()}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Cell row ${cell.row + 1}, column ${cell.col + 1}, ${
        cell.value === 0 ? "empty" : `value ${cell.value}`
      }${cell.isGiven ? ", given" : ", user-entered"}${isConflict ? ", conflict" : ""}`}
    >
      {cell.value !== 0 && cell.value}
    </div>
  );
});
