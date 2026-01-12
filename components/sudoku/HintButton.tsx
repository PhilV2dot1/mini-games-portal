import { motion } from "framer-motion";

interface HintButtonProps {
  hintsRemaining: number;
  onHintClick: () => void;
  disabled: boolean;
}

export function HintButton({ hintsRemaining, onHintClick, disabled }: HintButtonProps) {
  const isOutOfHints = hintsRemaining <= 0;
  const buttonDisabled = disabled || isOutOfHints;

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border-2 border-gray-300">
      <div className="text-sm text-gray-600 font-semibold mb-2 text-center">
        💡 Hint System
      </div>
      <p className="text-xs text-gray-500 mb-3 text-center">
        Click to highlight all conflicts in the grid
      </p>
      <motion.button
        onClick={onHintClick}
        disabled={buttonDisabled}
        className={`w-full px-6 py-3 rounded-xl font-black shadow-lg transition-all ${
          isOutOfHints
            ? "bg-gray-400 cursor-not-allowed text-gray-200"
            : "bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        whileHover={!buttonDisabled ? { scale: 1.05 } : {}}
        whileTap={!buttonDisabled ? { scale: 0.95 } : {}}
      >
        {isOutOfHints ? "🚫 No Hints Left" : `💡 Use Hint (${hintsRemaining} left)`}
      </motion.button>
      {isOutOfHints && (
        <p className="text-xs text-red-600 mt-2 text-center font-semibold">
          All hints used - solve on your own!
        </p>
      )}
    </div>
  );
}
