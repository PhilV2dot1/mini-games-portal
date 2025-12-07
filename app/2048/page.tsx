"use client";

import Link from "next/link";
import { useEffect } from "react";
import { use2048 } from "@/hooks/use2048";
import { useLocalStats } from "@/hooks/useLocalStats";
import { GameGrid } from "@/components/2048/GameGrid";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion } from "framer-motion";

export default function Game2048Page() {
  const {
    grid,
    score,
    mode,
    status,
    isConnected,
    isPending,
    gameStartedOnChain,
    startNewGame,
    submitScore,
    switchMode,
  } = use2048();

  const { recordGame } = useLocalStats();

  // Record game when finished
  useEffect(() => {
    if (status === "won" || status === "lost") {
      const result = status === "won" ? "win" : "lose";
      recordGame("2048", mode, result);
    }
  }, [status, mode, recordGame]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
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
          <div className="text-6xl mb-2">🔢</div>
          <h1 className="text-4xl font-black text-gray-900">2048</h1>
          <p className="text-sm text-gray-700 mt-2 font-medium">Merge tiles to reach 2048!</p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* Fee Warning for On-Chain Mode */}
        {mode === "onchain" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: 'rgba(252, 255, 82, 0.4)', border: '4px solid #FCFF52' }}
          >
            <p className="text-gray-900 text-sm font-bold">
              ⚠️ On-chain games require <span className="font-black">0.01 CELO</span> to start
            </p>
          </motion.div>
        )}

        {/* Score Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl p-4 flex justify-between items-center shadow-lg"
          style={{ border: '4px solid #FCFF52' }}
        >
          <div>
            <div className="text-sm text-gray-600 font-medium">Score</div>
            <div className="text-3xl font-black text-gray-900">{score}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">Status</div>
            <div className="text-xl font-bold text-gray-900">
              {status === "playing" && "🎮 Playing"}
              {status === "won" && "🎉 Won!"}
              {status === "lost" && "😞 Lost"}
            </div>
          </div>
        </motion.div>

        {/* Game Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center"
        >
          <GameGrid grid={grid} />
        </motion.div>

        {/* Controls */}
        <div className="text-center space-y-3">
          <p className="text-gray-700 text-sm font-medium">
            Use arrow keys to move tiles
          </p>

          <div className="flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={startNewGame}
              disabled={isPending || (mode === "onchain" && !isConnected)}
              className="px-8 py-3 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isPending ? "Starting..." : "New Game"}
            </motion.button>

            {mode === "onchain" && gameStartedOnChain && (status === "won" || status === "lost") && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                onClick={submitScore}
                disabled={isPending}
                className="px-8 py-3 bg-white border-[3px] border-celo hover:bg-gray-50 text-gray-900 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? "Submitting..." : "Submit Score"}
              </motion.button>
            )}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center text-xs text-gray-600 pt-2 space-y-1"
        >
          <p>Contract: 0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1</p>
          <p>
            <a
              href="https://celoscan.io/address/0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1"
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
