"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useMinesweeper } from "@/hooks/useMinesweeper";
import { useLocalStats } from "@/hooks/useLocalStats";
import { MinesweeperBoard } from "@/components/minesweeper/MinesweeperBoard";
import { GameStatus } from "@/components/minesweeper/GameStatus";
import { GameControls } from "@/components/minesweeper/GameControls";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { PlayerStats } from "@/components/minesweeper/PlayerStats";
import { DifficultySelector } from "@/components/minesweeper/DifficultySelector";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function MinesweeperPage() {
  const {
    board,
    mode,
    status,
    result,
    difficulty,
    timer,
    flagsRemaining,
    stats,
    message,
    isConnected,
    isProcessing,
    focusedCell,
    startGame,
    handleCellClick,
    handleCellRightClick,
    resetGame,
    switchMode,
    changeDifficulty,
  } = useMinesweeper();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === "finished" && result) {
      recordGame("minesweeper", mode, result, undefined, difficulty);
    }
  }, [status, result, mode, difficulty, recordGame]);

  const canPlay = status === "playing";
  const isFinished = status === "finished";

  // Detect if on mobile for instructions
  const isMobile = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-200 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
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
            aria-label="Minesweeper game"
          >
            💣🚩
          </div>
          <h1 className="text-4xl font-black text-gray-900">
            {t("games.minesweeper.title")}
          </h1>
          <p className="text-sm text-gray-600">
            {t("games.minesweeper.subtitle")}
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
          className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg max-w-2xl mx-auto border border-gray-200"
        >
          <h2 className="font-bold text-lg mb-2 text-gray-900">
            {t("games.minesweeper.howToPlay")}
          </h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {t("games.minesweeper.rule1")}</li>
            <li>• {t("games.minesweeper.rule2")}</li>
            <li>• {t("games.minesweeper.rule3")}</li>
            <li>• {t("games.minesweeper.rule4")}</li>
            <li>• {t("games.minesweeper.rule5")}</li>
          </ul>
        </motion.div>

        {/* Difficulty Selector */}
        <DifficultySelector
          difficulty={difficulty}
          onDifficultyChange={changeDifficulty}
          disabled={status === "playing"}
        />

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* Game Controls (Timer, Flags, Mines) */}
        <GameControls
          timer={timer}
          flagsRemaining={flagsRemaining}
          difficulty={difficulty}
        />

        {/* Game Status */}
        <GameStatus message={message} result={result} />

        {/* Game Board */}
        <MinesweeperBoard
          board={board}
          onCellClick={handleCellClick}
          onCellRightClick={handleCellRightClick}
          disabled={!canPlay || isProcessing}
          difficulty={difficulty}
          focusedCell={focusedCell}
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
              {isProcessing ? t("games.starting") : t("games.startGame")}
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
              {t("games.reset")}
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
            {t("games.minesweeper.gameInfo")}
          </p>
          <p className="text-gray-500">
            {t("games.contract")}{" "}
            <a
              href="https://celoscan.io/address/0x62798e5246169e655901C546c0496bb2C6158041"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-celo underline transition-colors"
            >
              {t("games.minesweeper.viewOnCeloscan")}
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
