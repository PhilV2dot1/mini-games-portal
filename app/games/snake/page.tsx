"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSnake } from "@/hooks/useSnake";
import { useLocalStats } from "@/hooks/useLocalStats";
import { SnakeBoard } from "@/components/snake/SnakeBoard";
import { GameStatus } from "@/components/snake/GameStatus";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { PlayerStats } from "@/components/snake/PlayerStats";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SnakePage() {
  const {
    snake,
    food,
    mode,
    status,
    score,
    stats,
    message,
    isConnected,
    gridSize,
    startGame,
    resetGame,
    switchMode,
    changeDirection,
  } = useSnake();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === "gameover") {
      // Convert score to result (above 100 = win, otherwise lose)
      const result = score >= 100 ? "win" : "lose";
      recordGame("snake", mode, result);
    }
  }, [status, score, mode, recordGame]);

  const isPlaying = status === "playing";
  const isProcessing = status === "processing";
  const isGameOver = status === "gameover";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 hover:text-celo transition-colors font-bold"
        >
          {t('games.backToPortal')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-celo text-center space-y-1"
        >
          <div className="text-5xl mb-2" role="img" aria-label={t('games.snake.title')}>
            🐍
          </div>
          <h1 className="text-4xl font-black text-gray-900">{t('games.snake.title')}</h1>
          <p className="text-sm text-gray-600">
            {t('games.snake.subtitle')}
          </p>
          <div className="space-y-2 bg-celo/10 rounded-lg p-3 border-2 border-celo">
            <p className="text-sm font-semibold text-gray-800">
              {t('games.snake.instructions')}
            </p>
          </div>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* Game Status */}
        <GameStatus message={message} status={status} score={score} />

        {/* Game Board */}
        <SnakeBoard snake={snake} food={food} gridSize={gridSize} />

        {/* Controls Info */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300 text-center"
          >
            <p className="text-sm font-semibold text-gray-700">
              {t('games.snake.instructions')}
            </p>
          </motion.div>
        )}

        {/* Direction Buttons (Mobile) */}
        {isPlaying && (
          <div className="sm:hidden">
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              <div />
              <button
                onClick={() => changeDirection("UP")}
                className="aspect-square bg-celo hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                ↑
              </button>
              <div />
              <button
                onClick={() => changeDirection("LEFT")}
                className="aspect-square bg-celo hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                ←
              </button>
              <button
                onClick={() => changeDirection("DOWN")}
                className="aspect-square bg-celo hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                ↓
              </button>
              <button
                onClick={() => changeDirection("RIGHT")}
                className="aspect-square bg-celo hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {status === "idle" || isGameOver ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={startGame}
              disabled={isProcessing || (mode === "onchain" && !isConnected)}
              className="px-8 py-3 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? t('games.starting') : t('games.startGame')}
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
              {t('games.reset')}
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
          <p className="font-semibold">
            {t('games.snake.footer')}
          </p>
          <p className="text-gray-500">
            {t('games.contract')}{" "}
            <a
              href="https://celoscan.io/address/0x5646fda34aaf8a95b9b0607db5ca02bdee267598"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-celo underline transition-colors"
            >
              0x5646...7598
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
