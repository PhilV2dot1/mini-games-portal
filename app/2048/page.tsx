"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { use2048 } from "@/hooks/use2048";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { GameGrid } from "@/components/2048/GameGrid";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  const { t } = useLanguage();
  const { play } = useGameAudio('2048');
  const prevScore = useRef(score);
  const prevStatus = useRef(status);

  // Play sound when score changes (merge happened)
  useEffect(() => {
    if (score > prevScore.current && status === 'playing') {
      play('merge');
    }
    prevScore.current = score;
  }, [score, status, play]);

  // Play sound when game ends
  useEffect(() => {
    if (status !== prevStatus.current) {
      if (status === 'won') {
        play('win');
      } else if (status === 'lost') {
        play('lose');
      }
    }
    prevStatus.current = status;
  }, [status, play]);

  // Record game when finished
  useEffect(() => {
    if (status === "won" || status === "lost") {
      const result = status === "won" ? "win" : "lose";
      recordGame("2048", mode, result);
    }
  }, [status, mode, recordGame]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">
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
          <div className="text-5xl mb-2">🔢</div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t('games.2048.title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('games.2048.subtitle')}</p>
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
            className="rounded-lg p-3 text-center bg-celo/10 border-2 border-celo"
          >
            <p className="text-gray-900 text-sm font-bold">
              {t('games.2048.onChainFeeWarning').split('0.01 CELO')[0]}
              <span className="font-black">0.01 CELO</span>
              {t('games.2048.onChainFeeWarning').split('0.01 CELO')[1]}
            </p>
          </motion.div>
        )}

        {/* Score Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 flex justify-between items-center shadow-lg border-2 border-gray-300 dark:border-gray-600"
        >
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('games.2048.score')}</div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{score}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('games.2048.status')}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {status === "playing" && t('games.2048.playing')}
              {status === "won" && t('games.2048.won')}
              {status === "lost" && t('games.2048.lost')}
            </div>
          </div>
        </motion.div>

        {/* Game Grid */}
        <div className="flex justify-center">
          <GameGrid grid={grid} />
        </div>

        {/* Controls */}
        <div className="text-center space-y-3">
          <p className="text-gray-700 text-sm font-medium">
            {t('games.2048.instructions')}
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
              {isPending ? t('games.starting') : t('games.2048.newGame')}
            </motion.button>

            {mode === "onchain" && gameStartedOnChain && (status === "won" || status === "lost") && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                onClick={submitScore}
                disabled={isPending}
                className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? t('games.2048.submitting') : t('games.2048.submitScore')}
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
          <p>{t('games.contract')} 0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1</p>
          <p>
            <a
              href="https://celoscan.io/address/0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:text-celo font-semibold transition-colors underline decoration-celo"
            >
              {t('games.2048.viewOnCeloscan')}
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
