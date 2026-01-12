"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSudoku } from "@/hooks/useSudoku";
import { useLocalStats } from "@/hooks/useLocalStats";
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

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === "finished" && result) {
      recordGame("sudoku", mode, result, undefined, difficulty);
    }
  }, [status, result, mode, difficulty, recordGame]);

  const canPlay = status === "playing";
  const isFinished = status === "finished";
  const canStart = status === "idle" || isFinished;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 hover:text-celo transition-colors font-bold"
        >
          ← {t("games.backToPortal")}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-celo text-center space-y-1"
        >
          <div
            className="text-5xl mb-2"
            role="img"
            aria-label="Sudoku game"
          >
            🔢
          </div>
          <h1 className="text-4xl font-black text-gray-900">
            Sudoku
          </h1>
          <p className="text-sm text-gray-600">
            Classic number puzzle - fill the grid!
          </p>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl text-left">
            <p className="text-base font-semibold text-gray-700 mb-2">
              📖 How to Play:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Fill the 9×9 grid so each row, column, and 3×3 box contains 1-9</li>
              <li>• Click a cell, then use the number pad or keyboard (1-9) to fill it</li>
              <li>• Use hints (3 max) to highlight conflicts in your solution</li>
              <li>• Complete the puzzle without errors to win!</li>
            </ul>
          </div>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

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
        <GameStatus status={status} result={result} message={message} />

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
                onNumberClick={handleNumberInput}
                onErase={handleErase}
                disabled={!canPlay}
              />
            )}

            {/* Hint Button */}
            {canPlay && (
              <HintButton
                hintsRemaining={hintsRemaining}
                onHintClick={handleHint}
                disabled={!canPlay}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {canStart && (
            <motion.button
              onClick={startGame}
              disabled={isProcessing || (mode === "onchain" && !isConnected)}
              className="px-8 py-3 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isProcessing ? "⏳ Processing..." : "🎮 Start Game"}
            </motion.button>
          )}

          {(canPlay || isFinished) && (
            <motion.button
              onClick={resetGame}
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black shadow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔄 Reset
            </motion.button>
          )}
        </div>

        {/* Player Stats */}
        <PlayerStats stats={stats} formatTime={formatTime} />

        {/* Footer with Contract Link */}
        {mode === "onchain" && (
          <div className="text-center text-xs text-gray-600 pt-2">
            <a
              href={`https://celoscan.io/address/SUDOKU_CONTRACT_ADDRESS`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-celo transition-colors underline"
            >
              View Contract on Celoscan →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
