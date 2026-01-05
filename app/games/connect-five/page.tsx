"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useConnectFive } from "@/hooks/useConnectFive";
import { useLocalStats } from "@/hooks/useLocalStats";
import { ConnectFiveBoard } from "@/components/connectfive/ConnectFiveBoard";
import { GameStatus } from "@/components/connectfive/GameStatus";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { PlayerStats } from "@/components/connectfive/PlayerStats";
import { DifficultySelector } from "@/components/connectfive/DifficultySelector";
import { motion } from "framer-motion";

export default function ConnectFivePage() {
  const {
    board,
    mode,
    status,
    result,
    difficulty,
    stats,
    message,
    isConnected,
    startGame,
    handleMove,
    resetGame,
    switchMode,
    setDifficulty,
  } = useConnectFive();

  const { recordGame } = useLocalStats();

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === "finished" && result) {
      recordGame("connectfive", mode, result);
    }
  }, [status, result, mode, recordGame]);

  const canPlay = status === "playing";
  const isProcessing = status === "processing";
  const isFinished = status === "finished";

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
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-celo text-center space-y-1"
        >
          <div className="text-5xl mb-2" role="img" aria-label="Connect 4">
            🔴🟡
          </div>
          <h1 className="text-4xl font-black text-gray-900">
            Connect 4
          </h1>
          <p className="text-sm text-gray-600">Align 4 pieces in a row on Celo</p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

        {/* Difficulty Selector */}
        <DifficultySelector
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          disabled={status === "playing"}
        />

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* Game Status */}
        <GameStatus message={message} result={result} />

        {/* Game Board */}
        <ConnectFiveBoard
          board={board}
          onColumnClick={handleMove}
          disabled={!canPlay || isProcessing}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {status === "idle" || isFinished ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={startGame}
              disabled={isProcessing || (mode === "onchain" && !isConnected)}
              className="px-8 py-3 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Starting..." : "Start Game"}
            </motion.button>
          ) : (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={resetGame}
              disabled={isProcessing}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </motion.button>
          )}
        </div>

        {/* Player Stats */}
        <PlayerStats stats={stats} />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-600 pt-2 space-y-1"
        >
          <p className="font-semibold">🎮 Play against intelligent AI with minimax algorithm</p>
          <p className="text-gray-500">
            Contract:{" "}
            <a
              href="https://celoscan.io/address/0xd00a6170d83b446314b2e79f9603bc0a72c463e6"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-celo underline transition-colors"
            >
              0xd00a...63e6
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
