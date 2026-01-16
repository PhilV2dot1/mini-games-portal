"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import { useTicTacToe } from "@/hooks/useTicTacToe";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { TicTacToeBoard } from "@/components/tictactoe/TicTacToeBoard";
import { GameStatus } from "@/components/tictactoe/GameStatus";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { PlayerStats } from "@/components/tictactoe/PlayerStats";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  const { t } = useLanguage();
  const { play } = useGameAudio('tictactoe');

  // Wrapper for handleMove with sound effect
  const handleMoveWithSound = useCallback((index: number) => {
    play('place');
    handleMove(index);
  }, [play, handleMove]);

  // Play result sound when game finishes
  useEffect(() => {
    if (status === 'finished' && result) {
      if (result === 'win') {
        play('win');
      } else if (result === 'lose') {
        play('lose');
      } else if (result === 'draw') {
        play('tie');
      }
    }
  }, [status, result, play]);

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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-md mx-auto space-y-4">
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
          <div className="text-5xl mb-2" role="img" aria-label={t('games.tictactoe.title')}>
            ⭕
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            {t('games.tictactoe.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('games.tictactoe.subtitle')}</p>
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
          onCellClick={handleMoveWithSound}
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
          <p>{t('games.contract')} 0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881</p>
          <p>
            <a
              href="https://celoscan.io/address/0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:text-celo font-semibold transition-colors underline decoration-celo"
            >
              {t('games.tictactoe.viewOnCeloscan')}
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
