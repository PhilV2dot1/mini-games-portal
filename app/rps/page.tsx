"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import { useRockPaperScissors, type Choice } from "@/hooks/useRockPaperScissors";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { GameBoard } from "@/components/rps/GameBoard";
import { GameStatus } from "@/components/rps/GameStatus";
import { PlayerStats } from "@/components/rps/PlayerStats";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RockPaperScissorsPage() {
  const {
    mode,
    status,
    stats,
    lastResult,
    message,
    play: playRound,
    resetStats,
    switchMode,
  } = useRockPaperScissors();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play: playSound } = useGameAudio('rps');

  // Wrapper for play with sound effects
  const handleChoice = useCallback((choice: Choice) => {
    playSound('select');
    playRound(choice);
  }, [playSound, playRound]);

  // Play result sound when game finishes
  useEffect(() => {
    if (status === 'finished' && lastResult) {
      // Short delay for reveal sound
      playSound('reveal');

      // Play result sound after a brief delay
      const timer = setTimeout(() => {
        if (lastResult.result === 'win') {
          playSound('win');
        } else if (lastResult.result === 'lose') {
          playSound('lose');
        } else {
          playSound('tie');
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [status, lastResult, playSound]);

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
      className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8"
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
          className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-celo transition-colors font-bold"
        >
          {t('games.backToPortal')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-celo text-center space-y-2"
        >
          <div className="text-5xl mb-2" role="img" aria-label={t('games.rps.title')}>
            ✊
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {t('games.rps.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-semibold">
            {t('games.rps.subtitle')}
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
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-gray-300 dark:border-gray-600"
        >
          <GameBoard onChoice={handleChoice} disabled={isProcessing} />
        </motion.div>

        {/* Player Stats */}
        <PlayerStats stats={stats} onReset={mode === 'free' ? resetStats : undefined} />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-2 space-y-1"
        >
          <p>{t('games.contract')} 0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49</p>
          <p>
            <a
              href="https://celoscan.io/address/0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 dark:text-white hover:text-celo font-semibold transition-colors underline decoration-celo"
            >
              {t('games.rps.viewOnCeloscan')}
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
