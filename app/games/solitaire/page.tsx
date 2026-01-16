"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import { useSolitaire, Suit } from "@/hooks/useSolitaire";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { SolitaireBoard } from "@/components/solitaire/SolitaireBoard";
import { GameStatus } from "@/components/solitaire/GameStatus";
import { PlayerStats } from "@/components/solitaire/PlayerStats";
import { GameControls } from "@/components/solitaire/GameControls";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface DragItem {
  fromWaste?: boolean;
  fromTableau?: number;
  fromTableauIndex?: number;
}

export default function SolitairePage() {
  const {
    gameState,
    mode,
    status,
    message,
    stats,
    canUndo,
    canAutoComplete,
    startGame,
    resetGame,
    switchMode,
    drawFromStock,
    moveWasteToTableau,
    moveWasteToFoundation,
    moveTableauToTableau,
    moveTableauToFoundation,
    undoMove,
    autoComplete,
  } = useSolitaire();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play } = useGameAudio('solitaire');

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === "won") {
      recordGame("solitaire", mode, "win");
      play('win');
    }
  }, [status, mode, recordGame, play]);

  const isPlaying = status === "playing";
  const isWon = status === "won";

  // Wrappers with sound effects
  const drawFromStockWithSound = useCallback(() => {
    play('flip');
    drawFromStock();
  }, [play, drawFromStock]);

  // Handle tableau click (for quick move to foundation)
  const handleTableauClick = (columnIndex: number, cardIndex: number) => {
    if (!isPlaying) return;

    const column = gameState.tableau[columnIndex];
    if (cardIndex !== column.length - 1) return; // Only top card

    const card = column[cardIndex];

    // Try to move to foundation
    play('place');
    moveTableauToFoundation(columnIndex, card.suit);
  };

  // Handle tableau drop
  const handleTableauDrop = (item: DragItem, targetColumnIndex: number) => {
    if (!isPlaying) return;

    play('place');
    if (item.fromWaste) {
      moveWasteToTableau(targetColumnIndex);
    } else if (item.fromTableau !== undefined) {
      const cardIndex = item.fromTableauIndex || 0;
      moveTableauToTableau(item.fromTableau, cardIndex, targetColumnIndex);
    }
  };

  // Handle foundation drop
  const handleFoundationDrop = (item: DragItem, suit: Suit) => {
    if (!isPlaying) return;

    if (item.fromWaste) {
      moveWasteToFoundation(suit);
    } else if (item.fromTableau !== undefined) {
      moveTableauToFoundation(item.fromTableau, suit);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-100 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-purple-700 dark:hover:text-celo transition-colors font-bold"
        >
          {t('games.backToPortal')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-purple-500 text-center space-y-1"
        >
          <div className="text-5xl mb-2" role="img" aria-label={t('games.solitaire.title')}>
            🃏
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t('games.solitaire.title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('games.solitaire.subtitle')}
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
            {t('games.solitaire.howToPlay')}
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• {t('games.solitaire.rule1')}</li>
            <li>• {t('games.solitaire.rule2')}</li>
          </ul>
        </motion.div>

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* Game Status */}
        <GameStatus
          message={message}
          status={status}
          score={gameState.score}
          moves={gameState.moves}
          elapsedTime={gameState.elapsedTime}
        />

        {/* Game Board */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border-2 border-purple-300"
        >
          <SolitaireBoard
            gameState={gameState}
            onTableauClick={handleTableauClick}
            onTableauDrop={handleTableauDrop}
            onFoundationDrop={handleFoundationDrop}
            onStockClick={drawFromStockWithSound}
          />
        </motion.div>

        {/* Game Controls */}
        <GameControls
          status={status}
          canUndo={canUndo}
          canAutoComplete={canAutoComplete}
          onStart={startGame}
          onReset={resetGame}
          onUndo={undoMove}
          onAutoComplete={autoComplete}
        />

        {/* How to Play */}
        {!isPlaying && !isWon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/90 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-gray-300"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-3">{t('games.solitaire.howToPlay')}</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{t('games.solitaire.rule1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{t('games.solitaire.rule2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{t('games.solitaire.rule3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{t('games.solitaire.rule4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{t('games.solitaire.rule5')}</span>
              </li>
            </ul>
          </motion.div>
        )}

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
            {t('games.solitaire.footer')}
          </p>
          <p className="text-gray-500">
            {t('games.contract')}{" "}
            <a
              href="https://celoscan.io/address/0x0000000000000000000000000000000000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-700 underline transition-colors"
            >
              0x0000...0000
            </a>
            {" "}{t('games.solitaire.awaitingDeployment')}
          </p>
        </motion.div>
      </div>
    </main>
  );
}
