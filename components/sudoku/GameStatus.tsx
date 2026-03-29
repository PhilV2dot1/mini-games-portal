import { motion } from "framer-motion";
import { GameStatus as Status, GameResult } from "@/hooks/useSudoku";

interface GameStatusProps {
  status: Status;
  result: GameResult;
  message: string;
}

export function GameStatus({ status, result, message }: GameStatusProps) {
  if (status === "idle") return null;

  const getStatusColor = () => {
    if (status === "finished" && result === "win") {
      return "from-green-500 to-green-600";
    }
    if (status === "playing") {
      return "from-blue-500 to-blue-600";
    }
    if (status === "waiting_start" || status === "waiting_end") {
      return "from-yellow-500 to-orange-600";
    }
    return "from-gray-500 to-gray-600";
  };

  const getIcon = () => {
    if (status === "finished" && result === "win") return "🎉";
    if (status === "playing") return "🧩";
    if (status === "waiting_start" || status === "waiting_end") return "⏳";
    return "ℹ️";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-r ${getStatusColor()} text-white rounded-xl p-4 text-center shadow-lg`}
    >
      <div className="flex items-center justify-center gap-3">
        <span className="text-2xl" role="img" aria-label="status">
          {getIcon()}
        </span>
        <span className="font-black text-lg" aria-live="polite">
          {message}
        </span>
      </div>
    </motion.div>
  );
}
