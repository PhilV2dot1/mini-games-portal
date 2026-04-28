"use client";

import { GameCategory, GameDuration } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type SortOption = "default" | "name" | "duration-asc" | "duration-desc";

export interface FilterState {
  category: GameCategory | "all";
  duration: GameDuration | "all";
  sort: SortOption;
}

interface GameFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const CATEGORY_LABELS: Record<GameCategory | "all", string> = {
  all: "🎮 Tous",
  cards: "🃏 Cartes",
  arcade: "🕹️ Arcade",
  puzzle: "🧩 Puzzle",
  strategy: "♟️ Stratégie",
  casino: "🎰 Casino",
};

const DURATION_LABELS: Record<GameDuration | "all", string> = {
  all: "⏱ Durée",
  instant: "⚡ < 1 min",
  short: "🕐 1-2 min",
  medium: "⏳ 2-5 min",
  long: "🎯 5-15 min",
  extended: "🏆 15+ min",
};

const SORT_LABELS: Record<SortOption, string> = {
  default: "Par défaut",
  name: "Nom A→Z",
  "duration-asc": "Durée ↑",
  "duration-desc": "Durée ↓",
};

export function GameFilter({ filters, onChange, totalCount, filteredCount }: GameFilterProps) {
  const { language } = useLanguage();

  const categoryLabels = language === "fr" ? CATEGORY_LABELS : {
    all: "🎮 All",
    cards: "🃏 Cards",
    arcade: "🕹️ Arcade",
    puzzle: "🧩 Puzzle",
    strategy: "♟️ Strategy",
    casino: "🎰 Casino",
  };

  const durationLabels = language === "fr" ? DURATION_LABELS : {
    all: "⏱ Duration",
    instant: "⚡ < 1 min",
    short: "🕐 1-2 min",
    medium: "⏳ 2-5 min",
    long: "🎯 5-15 min",
    extended: "🏆 15+ min",
  };

  const sortLabels = language === "fr" ? SORT_LABELS : {
    default: "Default",
    name: "Name A→Z",
    "duration-asc": "Duration ↑",
    "duration-desc": "Duration ↓",
  };

  const hasActiveFilter = filters.category !== "all" || filters.duration !== "all" || filters.sort !== "default";

  const reset = () => onChange({ category: "all", duration: "all", sort: "default" });

  const btnBase = "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border";
  const btnActive = "border-transparent text-gray-900 dark:text-gray-900 shadow-sm";
  const btnInactive = "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-400 bg-white/60 dark:bg-gray-800/60";

  return (
    <div className="mb-6 space-y-3">
      {/* Category row */}
      <div className="flex flex-wrap gap-2 items-center">
        {(Object.keys(categoryLabels) as (GameCategory | "all")[]).map((cat) => (
          <button
            key={cat}
            onClick={() => onChange({ ...filters, category: cat })}
            className={`${btnBase} ${filters.category === cat ? btnActive : btnInactive}`}
            style={filters.category === cat ? { backgroundColor: "var(--chain-primary)" } : {}}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Duration + Sort row */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "instant", "short", "medium", "long", "extended"] as (GameDuration | "all")[]).map((dur) => (
            <button
              key={dur}
              onClick={() => onChange({ ...filters, duration: dur })}
              className={`${btnBase} ${filters.duration === dur ? btnActive : btnInactive}`}
              style={filters.duration === dur ? { backgroundColor: "var(--chain-primary)" } : {}}
            >
              {durationLabels[dur]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort select */}
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOption })}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {(Object.keys(sortLabels) as SortOption[]).map((s) => (
              <option key={s} value={s}>{sortLabels[s]}</option>
            ))}
          </select>

          {/* Reset */}
          {hasActiveFilter && (
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              ✕
            </button>
          )}

          {/* Count */}
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {filteredCount}/{totalCount}
          </span>
        </div>
      </div>
    </div>
  );
}
