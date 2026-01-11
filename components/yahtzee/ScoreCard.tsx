"use client";

import { motion } from "framer-motion";
import type { ScoreCard as ScoreCardType, CategoryName } from "@/hooks/useYahtzee";

interface ScoreCardProps {
  scoreCard: ScoreCardType;
  getPotentialScore: (category: CategoryName) => number;
  onSelectCategory: (category: CategoryName) => void;
  upperSectionTotal: number;
  hasBonus: boolean;
  finalScore: number;
  disabled?: boolean;
  player?: "human" | "ai";
  isActive?: boolean;
}

interface CategoryRowProps {
  name: string;
  category: CategoryName;
  description: string;
  score: number | null;
  potentialScore: number;
  onSelect: () => void;
  disabled: boolean;
}

function CategoryRow({
  name,
  category,
  description,
  score,
  potentialScore,
  onSelect,
  disabled,
}: CategoryRowProps) {
  const isUsed = score !== null;
  const canSelect = !disabled && !isUsed;

  // Determine score quality for color coding
  const getScoreQuality = (): "good" | "okay" | "poor" => {
    if (potentialScore === 0) return "poor";

    // Upper section: good if >= half of maximum
    if (["ones", "twos", "threes", "fours", "fives", "sixes"].includes(category)) {
      const maxPossible = parseInt(category.replace(/[^0-9]/g, "")) ||
                         ({ ones: 5, twos: 10, threes: 15, fours: 20, fives: 25, sixes: 30 }[category] || 0);
      if (potentialScore >= maxPossible * 0.6) return "good";
      if (potentialScore >= maxPossible * 0.3) return "okay";
      return "poor";
    }

    // Lower section fixed scores
    if (["fullHouse", "smallStraight", "largeStraight", "yahtzee"].includes(category)) {
      return potentialScore > 0 ? "good" : "poor";
    }

    // Three/Four of a kind and Chance
    if (potentialScore >= 20) return "good";
    if (potentialScore >= 15) return "okay";
    return "poor";
  };

  const quality = !isUsed ? getScoreQuality() : null;

  return (
    <motion.button
      onClick={canSelect ? onSelect : undefined}
      disabled={!canSelect}
      className={`
        w-full p-2 sm:p-3 rounded-lg
        flex items-center justify-between
        transition-all duration-200
        ${
          isUsed
            ? "bg-gray-100 dark:bg-gray-800 cursor-default"
            : canSelect
            ? quality === "good"
              ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer"
              : quality === "okay"
              ? "bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 cursor-pointer"
              : "bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer"
            : "bg-gray-50 dark:bg-gray-900 opacity-50 cursor-not-allowed"
        }
      `}
      whileHover={canSelect ? { scale: 1.02 } : {}}
      whileTap={canSelect ? { scale: 0.98 } : {}}
      data-category={category}
    >
      <div className="flex flex-col items-start flex-1">
        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
          {name}
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {description}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {!isUsed && canSelect && (
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            → {potentialScore}
          </span>
        )}
        <span className={`
          text-lg sm:text-xl font-bold min-w-[2rem] text-center
          ${isUsed ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"}
        `}>
          {isUsed ? score : "-"}
        </span>
      </div>
    </motion.button>
  );
}

export function ScoreCard({
  scoreCard,
  getPotentialScore,
  onSelectCategory,
  upperSectionTotal,
  hasBonus,
  finalScore,
  disabled = false,
  player,
  isActive = false,
}: ScoreCardProps) {
  const upperCategories: { name: string; category: CategoryName; description: string }[] = [
    { name: "Ones", category: "ones", description: "Sum of all 1s" },
    { name: "Twos", category: "twos", description: "Sum of all 2s" },
    { name: "Threes", category: "threes", description: "Sum of all 3s" },
    { name: "Fours", category: "fours", description: "Sum of all 4s" },
    { name: "Fives", category: "fives", description: "Sum of all 5s" },
    { name: "Sixes", category: "sixes", description: "Sum of all 6s" },
  ];

  const lowerCategories: { name: string; category: CategoryName; description: string }[] = [
    { name: "Three of a Kind", category: "threeOfKind", description: "3+ same dice, sum all" },
    { name: "Four of a Kind", category: "fourOfKind", description: "4+ same dice, sum all" },
    { name: "Full House", category: "fullHouse", description: "3 of one + 2 of another" },
    { name: "Small Straight", category: "smallStraight", description: "Sequence of 4" },
    { name: "Large Straight", category: "largeStraight", description: "Sequence of 5" },
    { name: "Yahtzee!", category: "yahtzee", description: "All 5 dice same" },
    { name: "Chance", category: "chance", description: "Sum of all dice" },
  ];

  const getPlayerLabel = () => {
    if (!player) return null;
    return player === "human" ? "Your Score" : "AI Score";
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Player Header (only shown in AI mode) */}
      {player && (
        <motion.div
          className={`
            text-center py-3 px-6 rounded-xl font-bold text-lg
            ${isActive
              ? "bg-gradient-to-r from-celo to-yellow-400 text-gray-900 shadow-lg ring-4 ring-celo/50"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }
          `}
          animate={isActive ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
        >
          {getPlayerLabel()}
          {isActive && " - Your Turn!"}
        </motion.div>
      )}

      {/* Upper Section */}
      <div className={`
        bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg
        ${isActive ? "ring-4 ring-celo/30" : ""}
      `}>
        <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
          Upper Section
        </h3>
        <div className="space-y-2">
          {upperCategories.map(({ name, category, description }) => (
            <CategoryRow
              key={category}
              name={name}
              category={category}
              description={description}
              score={scoreCard[category]}
              potentialScore={getPotentialScore(category)}
              onSelect={() => onSelectCategory(category)}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Upper Section Summary */}
        <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Upper Total
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {upperSectionTotal}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Bonus (if ≥ 63)
            </span>
            <span className={`
              text-lg font-bold
              ${hasBonus ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-600"}
            `}>
              {hasBonus ? "+35" : "0"}
            </span>
          </div>
          <div className="mt-1 text-xs text-center text-gray-500 dark:text-gray-500">
            {upperSectionTotal}/63 for bonus
          </div>
        </div>
      </div>

      {/* Lower Section */}
      <div className={`
        bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg
        ${isActive ? "ring-4 ring-celo/30" : ""}
      `}>
        <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
          Lower Section
        </h3>
        <div className="space-y-2">
          {lowerCategories.map(({ name, category, description }) => (
            <CategoryRow
              key={category}
              name={name}
              category={category}
              description={description}
              score={scoreCard[category]}
              potentialScore={getPotentialScore(category)}
              onSelect={() => onSelectCategory(category)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* Final Score */}
      <motion.div
        className={`
          bg-gray-900 rounded-xl p-4 sm:p-6 shadow-lg text-white
          ${isActive ? "ring-4 ring-celo/50" : ""}
        `}
        animate={finalScore > 0 ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <span className="text-xl sm:text-2xl font-bold">
            Total Score
          </span>
          <span className="text-3xl sm:text-4xl font-bold">
            {finalScore}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
