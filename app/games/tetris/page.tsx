"use client";

import Link from "next/link";
import { useEffect, useCallback, useRef } from "react";
import { useTetris } from "@/hooks/useTetris";
import { useSwipe } from "@/hooks/useSwipe";
import { useHaptic } from "@/hooks/useHaptic";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { TetrisBoard } from "@/components/tetris/TetrisBoard";
import { NextPiece } from "@/components/tetris/NextPiece";
import { HoldPiece } from "@/components/tetris/HoldPiece";
import { GameControls } from "@/components/tetris/GameControls";
import { PlayerStats } from "@/components/tetris/PlayerStats";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import {
  getContractAddress,
  getExplorerAddressUrl,
  getExplorerName,
  isGameAvailableOnChain,
} from "@/lib/contracts/addresses";

export default function TetrisPage() {
  const game = useTetris();
  const { chain } = useAccount();
  const contractAddress = getContractAddress("tetris", chain?.id);
  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play } = useGameAudio("tetris");
  const { vibrate } = useHaptic();

  // Translate messages
  const translateMessage = useCallback(
    (msg: string): string => {
      if (!msg) return "";
      if (msg.includes("Congratulations")) return msg;
      if (msg.includes("Game Over")) return msg;
      if (msg.includes("Recording")) return msg;
      if (msg.includes("Score:")) return msg;
      if (msg.includes("Click Start")) return t("games.tetris.howToPlay");
      if (msg.includes("connect wallet")) return t("games.msg.connectWallet");
      if (msg.includes("Starting game on blockchain")) return t("games.msg.startingBlockchain");
      if (msg.includes("Failed to start")) return t("games.msg.failedStart");
      return msg;
    },
    [t]
  );

  // Sound effects
  const prevScore = useRef(game.score);
  const prevLines = useRef(game.lines);
  const prevLevel = useRef(game.level);
  const prevStatus = useRef(game.status);

  useEffect(() => {
    if (game.lines > prevLines.current && game.status === "playing") {
      const cleared = game.lines - prevLines.current;
      if (cleared >= 4) {
        play("tetris");
        vibrate('success');
      } else {
        play("lineClear");
        vibrate('medium');
      }
    }
    prevLines.current = game.lines;
  }, [game.lines, game.status, play, vibrate]);

  useEffect(() => {
    if (game.level > prevLevel.current && game.status === "playing") {
      play("levelUp");
      vibrate('warning');
    }
    prevLevel.current = game.level;
  }, [game.level, game.status, play, vibrate]);

  useEffect(() => {
    if (game.status === "finished" && prevStatus.current === "playing") {
      play("gameOver");
      vibrate(game.result === 'win' ? 'success' : 'error');
    }
    prevStatus.current = game.status;
  }, [game.status, game.result, play, vibrate]);

  // Record game when finished
  useEffect(() => {
    if (game.status === "finished" && game.result) {
      recordGame("tetris", game.mode, game.result === "win" ? "win" : "lose");
    }
  }, [game.status, game.result, game.mode, recordGame]);

  const isPlaying = game.status === "playing";
  const isCountdown = game.status === "countdown";
  const isProcessing = game.status === "waiting_start" || game.status === "waiting_end";
  const isFinished = game.status === "finished";

  // Swipe controls for mobile: left/right to move, up to rotate, down to hard drop
  const swipeRef = useSwipe({
    onSwipe: (dir) => {
      if (dir === 'left') game.moveLeft();
      else if (dir === 'right') game.moveRight();
      else if (dir === 'up') game.rotate();
      else if (dir === 'down') game.hardDrop();
    },
    enabled: isPlaying,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-300 dark:border-white/20 px-4 py-2 rounded-xl text-sm font-semibold mb-6 transition-all"
        >
          {t("games.backToPortal")}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-chain text-center space-y-1"
        >
          <img src="/icons/tetris.png" alt="Tetris" className="w-14 h-14 mx-auto object-contain mb-2" />
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            {t("games.tetris.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("games.tetris.subtitle")}
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={game.mode} onModeChange={game.switchMode} />
        </div>

        {/* How to Play */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
            {t("games.tetris.howToPlay")}
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• {t("games.tetris.rule1")}</li>
            <li>• {t("games.tetris.rule2")}</li>
            <li>• {t("games.tetris.rule3")}</li>
            <li>• {t("games.tetris.rule4")}</li>
          </ul>
        </motion.div>

        {/* Wallet Connect (On-Chain Mode) */}
        {game.mode === "onchain" && <WalletConnect />}

        {/* Game Controls */}
        {(isPlaying || isCountdown) && (
          <GameControls
            score={game.score}
            level={game.level}
            lines={game.lines}
            timer={game.timer}
            formatTime={game.formatTime}
          />
        )}

        {/* Message Display */}
        {game.message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-3 px-4 rounded-xl font-semibold shadow-lg ${
              game.result === "win"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-400"
                : game.result === "lose"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-400"
                  : "bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border-2 border-chain"
            }`}
          >
            {translateMessage(game.message)}
          </motion.div>
        )}

        {/* Game Board + Side Panels */}
        {(isPlaying || isCountdown) && (
          <motion.div
            ref={swipeRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex justify-center"
          >
            {/* Hold piece — positioned top-left of board */}
            <div className="absolute left-0 top-0 z-10">
              <HoldPiece piece={game.holdPiece} canHold={game.canHold} />
            </div>

            {/* Board */}
            <TetrisBoard
              grid={game.grid}
              currentPiece={game.currentPiece}
              ghostRow={game.ghostRow}
            />

            {/* Next piece — positioned top-right of board */}
            <div className="absolute right-0 top-0 z-10">
              <NextPiece piece={game.nextPiece} />
            </div>

            {/* Countdown Overlay */}
            {isCountdown && game.countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                {game.countdown > 0 ? (
                  <motion.div
                    key={game.countdown}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="text-9xl font-black text-chain drop-shadow-[0_0_20px_rgba(252,255,82,0.8)]"
                  >
                    {game.countdown}
                  </motion.div>
                ) : (
                  <motion.div
                    key="go"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-7xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]"
                  >
                    GO!
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Controls Info */}
        {(isPlaying || isCountdown) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300 dark:border-gray-600 text-center"
          >
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("games.tetris.instructions")}
            </p>
          </motion.div>
        )}

        {/* Mobile Direction Buttons */}
        {(isPlaying || isCountdown) && (
          <div className="sm:hidden">
            <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
              {/* Row 1: Hold + Rotate + Hard Drop */}
              <button
                data-testid="action-hold"
                onClick={game.hold}
                className="aspect-square bg-purple-500 hover:bg-purple-600 rounded-lg font-bold text-white text-xs shadow-md active:scale-95 transition-all"
              >
                Hold
              </button>
              <div />
              <button
                data-testid="action-rotate"
                onClick={game.rotate}
                className="aspect-square bg-chain hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                ↻
              </button>
              <div />
              <button
                data-testid="action-harddrop"
                onClick={game.hardDrop}
                className="aspect-square bg-orange-500 hover:bg-orange-600 rounded-lg font-bold text-white text-xs shadow-md active:scale-95 transition-all"
              >
                Drop
              </button>
              {/* Row 2: Left + Down + Right */}
              <div />
              <button
                data-testid="direction-left"
                onClick={game.moveLeft}
                className="aspect-square bg-chain hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                ←
              </button>
              <button
                data-testid="direction-down"
                onClick={game.moveDown}
                className="aspect-square bg-chain hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                ↓
              </button>
              <button
                data-testid="direction-right"
                onClick={game.moveRight}
                className="aspect-square bg-chain hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                →
              </button>
              <div />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {game.status === "idle" || isFinished ? (
            <motion.button
              data-testid="start-game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={game.startGame}
              disabled={isProcessing || (game.mode === "onchain" && !game.isConnected)}
              className="px-8 py-3 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? t("games.starting") : t("games.startGame")}
            </motion.button>
          ) : isCountdown ? null : (
            <motion.button
              data-testid="reset-game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={game.resetGame}
              disabled={isProcessing}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("games.reset")}
            </motion.button>
          )}
        </div>

        {/* Player Stats */}
        <PlayerStats stats={game.stats} />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-600 dark:text-gray-400 pt-2 space-y-1"
        >
          <p className="font-semibold">{t("games.tetris.footer")}</p>
          {isGameAvailableOnChain("tetris", chain?.id) && contractAddress ? (
            <p className="text-gray-500 dark:text-gray-500">
              {t("games.contract")}{" "}
              <a
                href={getExplorerAddressUrl(chain?.id, contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-chain underline transition-colors"
              >
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </a>
              {" | "}
              <a
                href={getExplorerAddressUrl(chain?.id, contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-chain underline transition-colors"
              >
                {t("games.tetris.viewOnCeloscan").replace(
                  "Celoscan",
                  getExplorerName(chain?.id)
                )}
              </a>
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t("chain.comingSoon")}</p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
