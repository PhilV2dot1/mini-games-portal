"use client";

import { COLORS, Color } from "@/lib/games/mastermind-logic";
import { ColorPeg } from "./ColorPeg";

interface ColorPaletteProps {
  onSelectColor: (color: Color) => void;
  disabled?: boolean;
}

export function ColorPalette({ onSelectColor, disabled }: ColorPaletteProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 p-2 sm:p-4 bg-white/90 backdrop-blur-sm rounded-lg border border-yellow-500/50 shadow-sm">
      {COLORS.map(color => (
        <ColorPeg
          key={color}
          color={color}
          size="large"
          onClick={() => !disabled && onSelectColor(color)}
        />
      ))}
    </div>
  );
}
