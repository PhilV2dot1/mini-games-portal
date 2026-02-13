import { motion, AnimatePresence } from "framer-motion";

interface GameMessageProps {
  message: string;
}

export function GameMessage({ message }: GameMessageProps) {
  if (!message) return null;

  // Determine message type based on content (supports EN + FR)
  const isError = message.includes('❌');
  const isSuccess = message.includes('✅') || message.includes('WIN') || message.includes('GAGNEZ') || message.includes('BLACKJACK') || message.includes('🎉');
  const isProcessing = message.includes('⏳') || message.includes('🎲') || message.includes('⚠️');

  const bgColor = isError
    ? 'bg-red-100 border-red-400 text-red-800'
    : isSuccess
    ? 'bg-green-100 border-green-400 text-green-800'
    : isProcessing
    ? 'bg-blue-100 border-blue-400 text-blue-800'
    : 'bg-gray-100 border-gray-400 text-gray-800';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`p-4 rounded-xl border-2 ${bgColor} font-semibold text-center shadow-lg`}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
}
