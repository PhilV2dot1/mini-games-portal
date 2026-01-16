"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSnake } from "@/hooks/useSnake";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
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
  const { play } = useGameAudio('snake');
  const prevScore = useRef(score);
  const prevStatus = useRef(status);

  // Play sound effects based on game events
  useEffect(() => {
    // Eating food (score increased)
    if (score > prevScore.current && status === 'playing') {
      play('eat');
    }
    prevScore.current = score;
  }, [score, status, play]);

  useEffect(() => {
    // Game over
    if (status === 'gameover' && prevStatus.current === 'playing') {
      play('crash');
    }
    prevStatus.current = status;
  }, [status, play]);

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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-celo transition-colors font-bold"
        >
          {t('games.backToPortal')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-celo text-center space-y-1"
        >
          <div className="text-5xl mb-2" role="img" aria-label={t('games.snake.title')}>
            🐍
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t('games.snake.title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('games.snake.subtitle')}
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

        {/* How to Play Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg max-w-2xl mx-auto border border-gray-200 dark:border-gray-700"
        >
          <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
            {t('games.snake.howToPlay')}
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• {t('games.snake.rule1')}</li>
            <li>• {t('games.snake.rule2')}</li>
          </ul>
        </motion.div>

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
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300 dark:border-gray-600 text-center"
          >
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
          className="text-center text-xs text-gray-600 dark:text-gray-400 pt-2 space-y-1"
        >
          <p className="font-semibold">
            {t('games.snake.footer')}
          </p>
          <p className="text-gray-500 dark:text-gray-500">
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
