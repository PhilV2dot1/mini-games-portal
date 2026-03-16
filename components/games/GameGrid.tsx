"use client";

import { useState, useMemo } from "react";
import { GameMetadata, GameDuration } from "@/lib/types";
import { GameCard } from "./GameCard";
import { GameFilter, FilterState } from "./GameFilter";
import { motion } from "framer-motion";
import { SkeletonCardGrid } from "@/components/ui/SkeletonCard";

interface GameGridProps {
  games: GameMetadata[];
  loading?: boolean;
}

const DURATION_ORDER: Record<GameDuration, number> = { quick: 0, medium: 1, long: 2 };

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function GameGrid({ games, loading = false }: GameGridProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    duration: "all",
    sort: "default",
  });

  const filtered = useMemo(() => {
    let result = [...games];

    if (filters.category !== "all") {
      result = result.filter((g) => g.category === filters.category);
    }
    if (filters.duration !== "all") {
      result = result.filter((g) => g.duration === filters.duration);
    }

    if (filters.sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sort === "duration-asc") {
      result.sort((a, b) => DURATION_ORDER[a.duration] - DURATION_ORDER[b.duration]);
    } else if (filters.sort === "duration-desc") {
      result.sort((a, b) => DURATION_ORDER[b.duration] - DURATION_ORDER[a.duration]);
    }

    return result;
  }, [games, filters]);

  if (loading) {
    return <SkeletonCardGrid count={6} />;
  }

  return (
    <>
      <GameFilter
        filters={filters}
        onChange={setFilters}
        totalCount={games.length}
        filteredCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-3">🎮</div>
          <p className="text-lg font-medium">Aucun jeu trouvé</p>
        </div>
      ) : (
        <motion.div
          key={`${filters.category}-${filters.duration}-${filters.sort}`}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          {filtered.map((game, index) => (
            <motion.div key={game.id} variants={item} className="h-full">
              <GameCard game={game} index={index} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
}
