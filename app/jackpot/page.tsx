"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useJackpot } from "@/hooks/useJackpot";
import { useLocalStats } from "@/hooks/useLocalStats";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion, AnimatePresence } from "framer-motion";

export default function JackpotPage() {
  const {
    state,
    mode,
    setMode,
    spin,
    lastResult,
    totalScore,
    isSpinning,
    isConnected,
  } = useJackpot();

  const { recordGame } = useLocalStats();

  // Record game to portal stats when result is shown
  useEffect(() => {
    if (state === 'result' && lastResult) {
      // Map jackpot result to standard game result
      const result = lastResult.score > 0 ? 'win' : 'lose';
      recordGame('jackpot', mode, result);
    }
  }, [state, lastResult, mode, recordGame]);

  const canSpin = state === "idle" || state === "result";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-md mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 hover:text-celo transition-colors font-bold"
        >
          ← Back to Portal
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl text-center"
          style={{ border: '4px solid #FCFF52' }}
        >
          <div className="text-6xl mb-2">🎰</div>
          <h1 className="text-4xl font-black text-gray-900">Solo Jackpot</h1>
          <p className="text-sm text-gray-700 mt-2 font-medium">Spin the crypto wheel!</p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* Total Score */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl p-4 text-center shadow-lg"
          style={{ border: '4px solid #FCFF52' }}
        >
          <div className="text-sm text-gray-600 mb-1 font-medium">Total Score</div>
          <div className="text-4xl font-black text-gray-900">{totalScore}</div>
        </motion.div>

        {/* Wheel Area / Result Display */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 min-h-[300px] flex items-center justify-center shadow-xl" style={{ border: '4px solid #FCFF52' }}>
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-gray-700"
              >
                <div className="text-6xl mb-4">🎲</div>
                <p className="text-lg font-semibold">Ready to spin!</p>
              </motion.div>
            )}

            {state === "spinning" && (
              <motion.div
                key="spinning"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" } }}
                className="text-8xl"
              >
                🎰
              </motion.div>
            )}

            {state === "result" && lastResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                {lastResult.isJackpot && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                    className="text-6xl mb-4"
                  >
                    🎉 JACKPOT! 🎉
                  </motion.div>
                )}
                <div className="text-7xl mb-4">
                  {lastResult.score > 0 ? "✨" : "😞"}
                </div>
                <div className={`text-5xl font-black mb-2 ${
                  lastResult.score > 0 ? "text-celo" : "text-gray-500"
                }`}>
                  {lastResult.score}
                </div>
                <div className="text-gray-700 font-semibold">
                  {lastResult.score > 0 ? "Points!" : "Try again!"}
                </div>
                {lastResult.badge && (
                  <div className="mt-2 text-sm text-gray-900 font-bold">
                    {lastResult.badge} Badge
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Spin Button */}
        <div className="flex gap-3 justify-center">
          {canSpin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={spin}
              disabled={isSpinning || (mode === "onchain" && !isConnected)}
              className="px-10 py-4 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSpinning ? "SPINNING..." : "SPIN"}
            </motion.button>
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center text-xs text-gray-600 pt-2 space-y-1"
        >
          <p>Contract: 0x07Bc49E8A2BaF7c68519F9a61FCD733490061644</p>
          <p>
            <a
              href="https://celoscan.io/address/0x07Bc49E8A2BaF7c68519F9a61FCD733490061644"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:text-celo font-semibold transition-colors underline decoration-celo"
            >
              View on Celoscan →
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
