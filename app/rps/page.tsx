"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRockPaperScissors } from "@/hooks/useRockPaperScissors";
import { useLocalStats } from "@/hooks/useLocalStats";
import { GameBoard } from "@/components/rps/GameBoard";
import { GameStatus } from "@/components/rps/GameStatus";
import { PlayerStats } from "@/components/rps/PlayerStats";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion } from "framer-motion";

export default function RockPaperScissorsPage() {
  const {
    mode,
    status,
    stats,
    lastResult,
    message,
    play,
    resetStats,
    switchMode,
  } = useRockPaperScissors();

  const { recordGame } = useLocalStats();

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === 'finished' && lastResult) {
      // Map RPS result to standard game result ('tie' in RPS = 'draw' in portal)
      const result = lastResult.result === 'tie' ? 'draw' : lastResult.result;
      recordGame('rps', mode, result);
    }
  }, [status, lastResult, mode, recordGame]);

  const isProcessing = status === "processing";

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="max-w-md mx-auto space-y-4 sm:space-y-5">
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
          className="bg-white/95 backdrop-blur-lg rounded-2xl p-5 shadow-xl border-2 border-gray-700 text-center space-y-2"
          style={{
            boxShadow: "0 0 0 6px #FCFF52, 0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="text-5xl mb-2" role="img" aria-label="Hand fist">
            ✊
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Rock Paper Scissors
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-semibold">
            Classic hand game on Celo
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* Game Status */}
        <GameStatus result={lastResult} message={message} />

        {/* Game Board */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/95 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-gray-700"
          style={{
            boxShadow: "0 0 0 6px #FCFF52, 0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          }}
        >
          <GameBoard onChoice={play} disabled={isProcessing} />
        </motion.div>

        {/* Player Stats */}
        <PlayerStats stats={stats} onReset={mode === 'free' ? resetStats : undefined} />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs sm:text-sm text-gray-600 pt-2 space-y-1"
        >
          <p>Contract: 0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49</p>
          <p>
            <a
              href="https://celoscan.io/address/0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49"
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
