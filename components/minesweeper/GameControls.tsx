import { motion } from "framer-motion";
import type { Difficulty } from "@/hooks/useMinesweeper";
import { DIFFICULTY_CONFIG } from "@/hooks/useMinesweeper";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface GameControlsProps {
  timer: number;
  flagsRemaining: number;
  difficulty: Difficulty;
}

export function GameControls({
  timer,
  flagsRemaining,
  difficulty,
}: GameControlsProps) {
  // Format timer as MM:SS
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const totalMines = DIFFICULTY_CONFIG[difficulty].mines;
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2 border-gray-300"
    >
      <div className="grid grid-cols-3 gap-4">
        {/* Timer */}
        <div className="flex flex-col items-center">
          <div className="text-2xl mb-1" role="img" aria-label="Timer">
            ⏱️
          </div>
          <div
            className="text-xl font-mono font-bold text-gray-900"
            aria-live="polite"
            aria-atomic="true"
          >
            {formattedTime}
          </div>
          <div className="text-xs text-gray-600">{t('games.minesweeper.timer')}</div>
        </div>

        {/* Flags Remaining */}
        <div className="flex flex-col items-center">
          <div className="text-2xl mb-1" role="img" aria-label="Flags">
            🚩
          </div>
          <div
            className={`text-xl font-bold ${
              flagsRemaining === 0
                ? "text-red-600"
                : flagsRemaining < 5
                ? "text-orange-600"
                : "text-gray-900"
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {flagsRemaining}
          </div>
          <div className="text-xs text-gray-600">{t('games.minesweeper.flagsRemaining')}</div>
        </div>

        {/* Total Mines */}
        <div className="flex flex-col items-center">
          <div className="text-2xl mb-1" role="img" aria-label="Mines">
            💣
          </div>
          <div className="text-xl font-bold text-gray-900">{totalMines}</div>
          <div className="text-xs text-gray-600">{t('games.minesweeper.minesTotal')}</div>
        </div>
      </div>
    </motion.div>
  );
}
