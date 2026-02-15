"use client";

import { memo } from "react";
import { type Piece, type TetrominoType } from "@/lib/games/tetris-logic";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const BRICK_COLORS: Record<TetrominoType, { bg: string; light: string; dark: string }> = {
  I: { bg: "#06b6d4", light: "#67e8f9", dark: "#0891b2" },
  O: { bg: "#eab308", light: "#fde047", dark: "#ca8a04" },
  T: { bg: "#a855f7", light: "#c084fc", dark: "#7c3aed" },
  S: { bg: "#22c55e", light: "#86efac", dark: "#16a34a" },
  Z: { bg: "#ef4444", light: "#fca5a5", dark: "#dc2626" },
  J: { bg: "#3b82f6", light: "#93c5fd", dark: "#2563eb" },
  L: { bg: "#f97316", light: "#fdba74", dark: "#ea580c" },
};

interface HoldPieceProps {
  piece: Piece | null;
  canHold: boolean;
}

export const HoldPiece = memo(function HoldPiece({ piece, canHold }: HoldPieceProps) {
  const { t } = useLanguage();

  return (
    <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-3 shadow-lg border border-gray-200 dark:border-gray-700 ${
      !canHold ? "opacity-50" : ""
    }`}>
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center mb-2 font-semibold">
        {t("games.tetris.hold")}
      </div>
      <div className="flex justify-center">
        {piece ? (
          <div
            className="grid gap-[1px]"
            style={{
              gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)`,
            }}
          >
            {piece.shape.flatMap((row, r) =>
              row.map((filled, c) => {
                if (!filled) {
                  return (
                    <div
                      key={`${r}-${c}`}
                      style={{ width: 20, height: 20 }}
                    />
                  );
                }
                const colors = BRICK_COLORS[piece.type];
                return (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 3,
                      background: colors.bg,
                      boxShadow: `inset 2px 2px 0 ${colors.light}, inset -2px -2px 0 ${colors.dark}`,
                    }}
                  />
                );
              })
            )}
          </div>
        ) : (
          <div className="w-[72px] h-[72px] flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs">
            C / Shift
          </div>
        )}
      </div>
    </div>
  );
});
