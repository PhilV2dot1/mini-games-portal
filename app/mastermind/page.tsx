"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useMastermind } from "@/hooks/useMastermind";
import { useLocalStats } from "@/hooks/useLocalStats";
import { MAX_ATTEMPTS } from "@/lib/games/mastermind-logic";
import { ColorPalette } from "@/components/mastermind/ColorPalette";
import { CurrentGuess } from "@/components/mastermind/CurrentGuess";
import { GameHistory } from "@/components/mastermind/GameHistory";
import { FeedbackLegend } from "@/components/mastermind/FeedbackLegend";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion } from "framer-motion";

export default function MastermindPage() {
  const {
    mode,
    gamePhase,
    currentGuess,
    history,
    attempts,
    message,
    stats,
    hasActiveOnChainGame,
    isConnected,
    isPending,
    updateGuess,
    submitGuess,
    newGame,
    playOnChain,
    submitScoreOnChain,
    switchMode,
    abandonGame,
  } = useMastermind();

  const { recordGame } = useLocalStats();

  // Record game when finished
  useEffect(() => {
    if (gamePhase === "won" || gamePhase === "lost") {
      const result = gamePhase === "won" ? "win" : "lose";
      recordGame("mastermind", mode, result);
    }
  }, [gamePhase, mode, recordGame]);

  // Find first empty position to fill
  const firstEmptyPosition = currentGuess.findIndex(color => color === null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors font-semibold"
        >
          ← Back to Portal
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 border border-yellow-500/30 rounded-2xl p-6 shadow-xl text-center"
        >
          <div className="text-6xl mb-2">🎯</div>
          <h1 className="text-4xl font-black text-yellow-400">Mastermind</h1>
          <p className="text-sm text-gray-400 mt-2">Crack the color code!</p>
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
            className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 text-center"
          >
            <p className="text-yellow-200 text-sm">
              ⚠️ On-chain games require <span className="font-bold">0.01 CELO</span> to start
            </p>
          </motion.div>
        )}

        {/* Game Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-xl p-4 grid grid-cols-3 gap-4"
        >
          <div className="text-center">
            <div className="text-sm text-gray-400">Attempts</div>
            <div className="text-3xl font-black text-yellow-400">
              {attempts}/{MAX_ATTEMPTS}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Wins</div>
            <div className="text-2xl font-bold text-white">{stats.wins}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Best Score</div>
            <div className="text-2xl font-bold text-white">{stats.bestScore}</div>
          </div>
        </motion.div>

        {/* Feedback Legend */}
        <FeedbackLegend />

        {/* Game History */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GameHistory history={history} maxAttempts={MAX_ATTEMPTS} />
        </motion.div>

        {/* Current Guess */}
        {gamePhase === "playing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CurrentGuess
              guess={currentGuess}
              onClearPosition={(pos) => updateGuess(pos, null)}
              disabled={isPending}
            />
          </motion.div>
        )}

        {/* Color Palette */}
        {gamePhase === "playing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ColorPalette
              onSelectColor={(color) => {
                if (firstEmptyPosition !== -1) {
                  updateGuess(firstEmptyPosition, color);
                }
              }}
              disabled={isPending}
            />
          </motion.div>
        )}

        {/* Message Display */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-lg p-3 text-center text-white"
          >
            {message}
          </motion.div>
        )}

        {/* Game Controls */}
        <div className="flex gap-3 justify-center flex-wrap">
          {/* Submit Guess Button */}
          {gamePhase === "playing" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={submitGuess}
              disabled={currentGuess.some(c => c === null) || isPending}
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Submit Guess
            </motion.button>
          )}

          {/* New Game Button */}
          {mode === "free" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={newGame}
              className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-yellow-400 rounded-xl font-black shadow-lg transition-all"
            >
              New Game
            </motion.button>
          )}

          {/* On-Chain Controls */}
          {mode === "onchain" && (
            <>
              {!hasActiveOnChainGame && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={playOnChain}
                  disabled={isPending || !isConnected}
                  className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending ? "Starting..." : "Start On-Chain Game"}
                </motion.button>
              )}

              {hasActiveOnChainGame && (gamePhase === "won" || gamePhase === "lost") && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={submitScoreOnChain}
                  disabled={isPending}
                  className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-yellow-400 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending ? "Submitting..." : "Submit Score"}
                </motion.button>
              )}

              {hasActiveOnChainGame && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={abandonGame}
                  disabled={isPending}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending ? "Abandoning..." : "Abandon Game"}
                </motion.button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-400 pt-2 space-y-1"
        >
          <p>Contract: 0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9</p>
          <p>
            <a
              href="https://celoscan.io/address/0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-yellow-400 transition-colors"
            >
              View on Celoscan →
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
