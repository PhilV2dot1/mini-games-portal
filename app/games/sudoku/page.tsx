"use client";

import Link from "next/link";
import { useEffect, useCallback, useRef, useMemo } from "react";
import { useSudoku } from "@/hooks/useSudoku";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { SudokuGrid } from "@/components/sudoku/SudokuGrid";
import { GameStatus } from "@/components/sudoku/GameStatus";
import { GameControls } from "@/components/sudoku/GameControls";
import { NumberPad } from "@/components/sudoku/NumberPad";
import { HintButton } from "@/components/sudoku/HintButton";
import { DifficultySelector } from "@/components/sudoku/DifficultySelector";
import { PlayerStats } from "@/components/sudoku/PlayerStats";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import { getContractAddress, getExplorerAddressUrl, getExplorerName, isGameAvailableOnChain } from '@/lib/contracts/addresses';

export default function SudokuPage() {
  const {
    board,
    mode,
    status,
    result,
    difficulty,
    timer,
    hintsRemaining,
    selectedCell,
    conflictCells,
    stats,
    message,
    isConnected,
    isProcessing,
    startGame,
    handleCellSelect,
    handleNumberInput,
    handleErase,
    handleHint,
    resetGame,
    switchMode,
    changeDifficulty,
    formatTime,
  } = useSudoku();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { chain } = useAccount();
  const contractAddress = getContractAddress('sudoku', chain?.id);
  const { play } = useGameAudio('sudoku');
  const prevConflicts = useRef(conflictCells.size);

  // Wrappers with sound effects
  const handleNumberInputWithSound = useCallback((num: number) => {
    play('place');
    handleNumberInput(num);
  }, [play, handleNumberInput]);

  const handleEraseWithSound = useCallback(() => {
    play('erase');
    handleErase();
  }, [play, handleErase]);

  const handleHintWithSound = useCallback(() => {
    play('hint');
    handleHint();
  }, [play, handleHint]);

  // Play error sound when conflicts appear
  useEffect(() => {
    if (conflictCells.size > prevConflicts.current) {
      play('error');
    }
    prevConflicts.current = conflictCells.size;
  }, [conflictCells.size, play]);

  // Play complete sound when game is won
  useEffect(() => {
    if (status === "finished" && result === "win") {
      play('complete');
    }
  }, [status, result, play]);

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === "finished" && result) {
      recordGame("sudoku", mode, result, undefined, difficulty);
    }
  }, [status, result, mode, difficulty, recordGame]);

  // Translate game messages from hook (English) to current language
  const translateMessage = useCallback((msg: string | null): string | null => {
    if (!msg) return null;
    const messageMap: Record<string, string> = {
      'Click Start to begin!': t('games.msg.clickStart'),
      'Loading puzzle...': t('games.msg.loadingPuzzle'),
      'Please connect your wallet first!': t('games.msg.connectWallet'),
      'Starting game on blockchain...': t('games.msg.startingBlockchain'),
      'Solve the puzzle!': t('games.msg.solvePuzzle'),
      'Failed to load puzzle. Please try again.': t('games.msg.failedLoadPuzzle'),
      'No conflicts found!': t('games.msg.noConflicts'),
      'Recording result on blockchain...': t('games.msg.recordingResult'),
      'Failed to record result on blockchain.': t('games.msg.failedRecordBlockchain'),
      'Finish current game first!': t('games.msg.finishCurrent'),
    };
    if (messageMap[msg]) return messageMap[msg];
    // Dynamic messages
    if (msg.includes('conflict(s) highlighted')) return msg;
    if (msg.startsWith('🎉 Solved in')) return msg.replace('Solved in', t('games.sudoku.completed') || 'Solved in');
    return msg;
  }, [t]);

  // Translate message for display
  const translatedMessage = useMemo(() => translateMessage(message), [translateMessage, message]);

  const canPlay = status === "playing";
  const isFinished = status === "finished";
  const canStart = status === "idle" || isFinished;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-chain transition-colors font-bold"
        >
          ← {t("games.backToPortal")}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-chain text-center space-y-1"
        >
          <div
            className="text-5xl mb-2"
            role="img"
            aria-label="Sudoku game"
          >
            🔢
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            {t('games.sudoku.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('games.msg.sudokuSubtitle')}
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
            {t("games.sudoku.howToPlay")}
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• {t("games.sudoku.rule1")}</li>
            <li>• {t("games.sudoku.rule2")}</li>
          </ul>
        </motion.div>

        {/* Difficulty Selector */}
        <DifficultySelector
          difficulty={difficulty}
          onDifficultyChange={changeDifficulty}
          disabled={!canStart}
        />

        {/* Wallet Connect (on-chain mode only) */}
        {mode === "onchain" && !isConnected && (
          <WalletConnect />
        )}

        {/* Game Controls (Timer & Hints) */}
        {status !== "idle" && (
          <GameControls
            timer={timer}
            hintsRemaining={hintsRemaining}
            formatTime={formatTime}
          />
        )}

        {/* Game Status */}
        <GameStatus status={status} result={result} message={translatedMessage} />

        {/* Main Game Area */}
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
          {/* Sudoku Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <SudokuGrid
              board={board}
              selectedCell={selectedCell}
              onCellSelect={handleCellSelect}
              disabled={!canPlay}
              conflictCells={conflictCells}
            />
          </motion.div>

          {/* Controls Panel */}
          <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[300px]">
            {/* Number Pad */}
            {canPlay && (
              <NumberPad
                onNumberClick={handleNumberInputWithSound}
                onErase={handleEraseWithSound}
                disabled={!canPlay}
              />
            )}

            {/* Hint Button */}
            {canPlay && (
              <HintButton
                hintsRemaining={hintsRemaining}
                onHintClick={handleHintWithSound}
                disabled={!canPlay}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {canStart && (
            <motion.button
              data-testid="start-game"
              onClick={startGame}
              disabled={isProcessing || (mode === "onchain" && !isConnected)}
              className="px-8 py-3 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isProcessing ? `⏳ ${t('games.msg.processing')}` : `🎮 ${t('games.msg.startGame')}`}
            </motion.button>
          )}

          {(canPlay || isFinished) && (
            <motion.button
              data-testid="reset-game"
              onClick={resetGame}
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black shadow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔄 {t('games.msg.reset')}
            </motion.button>
          )}
        </div>

        {/* Player Stats */}
        <PlayerStats stats={stats} formatTime={formatTime} />

        {/* Footer with Contract Link */}
        {mode === "onchain" && (
          <div className="text-center text-xs text-gray-600 pt-2">
            {isGameAvailableOnChain('sudoku', chain?.id) ? (
              <a
                href={getExplorerAddressUrl(chain?.id, contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-chain transition-colors underline"
              >
                {t('games.sudoku.viewOnCeloscan').replace('Celoscan', getExplorerName(chain?.id))}
              </a>
            ) : (
              <span>{t('chain.comingSoon')}</span>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
