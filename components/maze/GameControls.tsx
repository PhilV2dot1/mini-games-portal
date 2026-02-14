"use client";

import { memo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface GameControlsProps {
  timer: number;
  moves: number;
  formatTime: (seconds: number) => string;
}

export const GameControls = memo(function GameControls({
  timer,
  moves,
  formatTime,
}: GameControlsProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300 dark:border-gray-600">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t("games.maze.moves")}
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {moves}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t("stats.time")}
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {formatTime(timer)}
          </div>
        </div>
      </div>
    </div>
  );
});
