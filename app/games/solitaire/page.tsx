"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSolitaire } from "@/hooks/useSolitaire";
import { useLocalStats } from "@/hooks/useLocalStats";
import { SolitaireBoard } from "@/components/solitaire/SolitaireBoard";
import { GameStatus } from "@/components/solitaire/GameStatus";
import { PlayerStats } from "@/components/solitaire/PlayerStats";
import { GameControls } from "@/components/solitaire/GameControls";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion } from "framer-motion";

export default function SolitairePage() {
  const {
    gameState,
    mode,
    status,
    message,
    stats,
    isConnected,
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
    moveFoundationToTableau,
    undoMove,
    autoComplete,
  } = useSolitaire();

  const { recordGame } = useLocalStats();

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === "won") {
      recordGame("solitaire", mode, "win");
    }
  }, [status, mode, recordGame]);

  const isPlaying = status === "playing";
  const isProcessing = status === "processing";
  const isWon = status === "won";

  // Handle tableau click (for quick move to foundation)
  const handleTableauClick = (columnIndex: number, cardIndex: number) => {
    if (!isPlaying) return;

    const column = gameState.tableau[columnIndex];
    if (cardIndex !== column.length - 1) return; // Only top card

    const card = column[cardIndex];

    // Try to move to foundation
    moveTableauToFoundation(columnIndex, card.suit);
  };

  // Handle tableau drop
  const handleTableauDrop = (item: any, targetColumnIndex: number) => {
    if (!isPlaying) return;

    if (item.fromWaste) {
      moveWasteToTableau(targetColumnIndex);
    } else if (item.fromTableau !== undefined) {
      const cardIndex = item.fromTableauIndex || 0;
      moveTableauToTableau(item.fromTableau, cardIndex, targetColumnIndex);
    }
  };

  // Handle foundation drop
  const handleFoundationDrop = (item: any, suit: any) => {
    if (!isPlaying) return;

    if (item.fromWaste) {
      moveWasteToFoundation(suit);
    } else if (item.fromTableau !== undefined) {
      moveTableauToFoundation(item.fromTableau, suit);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-100 to-blue-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 hover:text-purple-700 transition-colors font-bold"
        >
          ← Back to Portal
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-purple-500 text-center space-y-1"
        >
          <div className="text-5xl mb-2" role="img" aria-label="Solitaire">
            🃏
          </div>
          <h1 className="text-4xl font-black text-gray-900">Klondike Solitaire</h1>
          <p className="text-sm text-gray-600">
            Classic card patience game - Stack cards to win!
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

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
            onStockClick={drawFromStock}
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
            <h3 className="text-lg font-bold text-gray-900 mb-3">How to Play</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>Build foundations from Ace to King by suit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>Stack tableau cards in descending order, alternating colors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>Only Kings can be placed in empty tableau columns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>Click stock to draw cards, drag and drop to move</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>Use Undo to reverse moves, Auto-Complete when possible</span>
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
            🃏 Classic Klondike Solitaire with blockchain integration
          </p>
          <p className="text-gray-500">
            Contract:{" "}
            <a
              href="https://celoscan.io/address/0x0000000000000000000000000000000000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-700 underline transition-colors"
            >
              0x0000...0000
            </a>
            {" "}(Awaiting deployment)
          </p>
        </motion.div>
      </div>
    </main>
  );
}
