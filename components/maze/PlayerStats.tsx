"use client";

import { memo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { PlayerStats as PlayerStatsType } from "@/hooks/useMaze";

interface PlayerStatsProps {
  stats: PlayerStatsType;
  formatTime: (seconds: number) => string;
}

export const PlayerStats = memo(function PlayerStats({
  stats,
  formatTime,
}: PlayerStatsProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-center">
        {t("games.yourStats")}
      </h3>
      <div className="grid grid-cols-2 gap-3 text-center text-sm">
        <div>
          <div className="text-gray-500 dark:text-gray-400">
            {t("stats.played")}
          </div>
          <div className="font-bold text-gray-900 dark:text-white">
            {stats.games}
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">
            {t("stats.wins")}
          </div>
          <div className="font-bold text-gray-900 dark:text-white">
            {stats.wins}
          </div>
        </div>
      </div>
      {(stats.bestTimes.easy ||
        stats.bestTimes.medium ||
        stats.bestTimes.hard) && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
            {t("stats.bestTimes")}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <div key={d}>
                <div className="text-gray-400 capitalize">{d}</div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {stats.bestTimes[d] ? formatTime(stats.bestTimes[d]!) : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
