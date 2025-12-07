"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTicTacToe } from "@/hooks/useTicTacToe";
import { useLocalStats } from "@/hooks/useLocalStats";
import { TicTacToeBoard } from "@/components/tictactoe/TicTacToeBoard";
import { GameStatus } from "@/components/tictactoe/GameStatus";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { PlayerStats } from "@/components/tictactoe/PlayerStats";
import { motion } from "framer-motion";

export default function TicTacToePage() {
  const {
    board,
    mode,
    status,
    result,
    stats,
    message,
    isConnected,
    startGame,
    handleMove,
    resetGame,
    switchMode,
  } = useTicTacToe();

  const { recordGame } = useLocalStats();

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === 'finished' && result) {
      recordGame('tictactoe', mode, result);
    }
  }, [status, result, mode, recordGame]);

  const canPlay = status === "playing";
  const isProcessing = status === "processing";
  const isFinished = status === "finished";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-green-100 p-4 sm:p-8">
      <div className="max-w-md mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors font-semibold"
        >
          ← Back to Portal
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-lg rounded-2xl p-4 shadow-xl border-2 border-gray-700 text-center space-y-1"
          style={{ boxShadow: '0 0 0 6px #FCFF52, 0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="text-5xl mb-2" role="img" aria-label="Circle and X">
            ⭕
          </div>
          <h1 className="text-4xl font-black text-gray-900">
            Tic Tac Toe
          </h1>
          <p className="text-sm text-gray-600">Three in a row on Celo</p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* Game Status */}
        <GameStatus message={message} result={result} />

        {/* Game Board */}
        <TicTacToeBoard
          board={board}
          onCellClick={handleMove}
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
              className="px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white border-2 border-[#FCFF52] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white border-2 border-gray-600 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="text-center text-xs text-gray-500 pt-2 space-y-1"
        >
          <p>Contract: 0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881</p>
          <p>
            <a
              href="https://celoscan.io/address/0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-600 transition-colors"
            >
              View on Celoscan →
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
