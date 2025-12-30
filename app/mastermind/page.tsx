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
    shouldShowSubmitButton,
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
          <div className="text-6xl mb-2">🎯</div>
          <h1 className="text-4xl font-black text-gray-900">Crypto Mastermind</h1>
          <p className="text-sm text-gray-700 mt-2 font-medium">Crack the crypto code!</p>
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

        {/* Game Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/90 backdrop-blur-lg rounded-xl p-4 grid grid-cols-3 gap-4 shadow-lg"
          style={{ border: '4px solid #FCFF52' }}
        >
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">Attempts</div>
            <div className="text-3xl font-black text-gray-900">
              {attempts}/{MAX_ATTEMPTS}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">Wins</div>
            <div className="text-2xl font-bold text-gray-900">{stats.wins}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 font-medium">Best Score</div>
            <div className="text-2xl font-bold text-gray-900">{stats.bestScore}</div>
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
            className="bg-white/90 backdrop-blur-lg rounded-lg p-3 text-center text-gray-900 font-semibold shadow-lg"
            style={{ border: '3px solid #FCFF52' }}
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
              transition={{ duration: 0.15 }}
              onClick={submitGuess}
              disabled={currentGuess.some(c => c === null) || isPending}
              className="px-8 py-3 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Submit Guess
            </motion.button>
          )}

          {/* New Game Button */}
          {mode === "free" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={newGame}
              className="px-8 py-3 bg-white bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg transition-all"
            >
              New Game
            </motion.button>
          )}

          {/* On-Chain Controls */}
          {mode === "onchain" && (
            <>
              {/* Show Start button when no game is active AND game phase is NOT won/lost */}
              {!hasActiveOnChainGame && gamePhase !== "won" && gamePhase !== "lost" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={playOnChain}
                  disabled={isPending || !isConnected}
                  className="px-8 py-3 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending ? "Starting..." : "Start On-Chain Game"}
                </motion.button>
              )}

              {/* Show Submit button when game is finished (won/lost) */}
              {shouldShowSubmitButton && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={submitScoreOnChain}
                  disabled={isPending}
                  className="px-8 py-3 bg-gradient-to-r from-green-400 to-green-500 hover:brightness-110 text-white rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending ? "Submitting..." : "Submit Score On-Chain"}
                </motion.button>
              )}

              {/* Show Abandon button only when game is active (playing state) */}
              {hasActiveOnChainGame && gamePhase === "playing" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={abandonGame}
                  disabled={isPending}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center text-xs text-gray-600 pt-2 space-y-1"
        >
          <p>Contract: 0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9</p>
          <p>
            <a
              href="https://celoscan.io/address/0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9"
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
