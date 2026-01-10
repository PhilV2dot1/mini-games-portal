import { motion } from "framer-motion";
import type { GameResult } from "@/hooks/useMinesweeper";

interface GameStatusProps {
  message: string;
  result: GameResult;
}

export function GameStatus({ message, result }: GameStatusProps) {
  // Determine colors based on result
  let bgColor = "from-blue-500 to-blue-600"; // Default playing
  let textColor = "text-white";
  let icon = "💡";

  if (result === "win") {
    bgColor = "from-green-500 to-green-600";
    icon = "🎉";
  } else if (result === "lose") {
    bgColor = "from-red-500 to-red-600";
    icon = "💣";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: result ? [1, 1.05, 1] : 1,
      }}
      transition={{
        scale: { duration: 0.3 },
      }}
      className={`bg-gradient-to-r ${bgColor} ${textColor} rounded-xl px-6 py-3 shadow-lg text-center font-bold`}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl" role="img" aria-hidden="true">
          {icon}
        </span>
        <span className="text-lg">{message}</span>
      </div>
    </motion.div>
  );
}
