import { motion } from "framer-motion";

interface NumberPadProps {
  onNumberClick: (value: number) => void;
  onErase: () => void;
  disabled: boolean;
}

export function NumberPad({ onNumberClick, onErase, disabled }: NumberPadProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border-2 border-gray-300">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {numbers.map((num) => (
          <motion.button
            key={num}
            onClick={() => onNumberClick(num)}
            disabled={disabled}
            className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black text-lg sm:text-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
          >
            {num}
          </motion.button>
        ))}
      </div>
      <motion.button
        onClick={onErase}
        disabled={disabled}
        className="mt-3 w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        🗑️ Erase
      </motion.button>
    </div>
  );
}
