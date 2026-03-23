"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import { useMemory, DIFFICULTY_CONFIG } from "@/hooks/useMemory";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { MemoryBoard } from "@/components/memory/MemoryBoard";
import { GameControls } from "@/components/memory/GameControls";
import { PlayerStats } from "@/components/memory/PlayerStats";
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
import type { Difficulty } from "@/lib/games/memory-logic";

export default function MemoryPage() {
  const game = useMemory();
  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play } = useGameAudio("memory");
  const { chain } = useAccount();
  const contractAddress = getContractAddress("memory", chain?.id);

  // Play sounds on game events
  const handleFlip = useCallback(
    (index: number) => {
      play("flip");
      game.flipCard(index);
    },
    [play, game]
  );

  // Detect match/no-match for sound effects
  useEffect(() => {
    if (game.result === "win") {
      play("win");
    }
  }, [game.result, play]);

  // Play match sound when pairs found increases
  const prevPairsRef = useCallback(() => game.pairsFound, [game.pairsFound]);
  useEffect(() => {
    if (game.pairsFound > 0 && game.status === "playing") {
      play("match");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.pairsFound]);

  // Record game when finished
  useEffect(() => {
    if (game.status === "finished" && game.result) {
      recordGame("memory", game.mode, game.result, undefined, game.difficulty);
    }
  }, [game.status, game.result, game.mode, game.difficulty, recordGame]);

  // Translate messages
  const translateMessage = useCallback(
    (msg: string | null): string => {
      if (!msg) return "";
      const messageMap: Record<string, string> = {
        "Click Start to begin!": t("games.memory.clickToStart"),
      };
      if (messageMap[msg]) return messageMap[msg];
      if (msg.startsWith("🎉")) return msg;
      return msg;
    },
    [t]
  );

  const canStart = game.status === "idle" || game.status === "finished";
  const isProcessing = game.status === "processing";
  const isCountdown = game.status === "countdown";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">
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
          <img src="/icons/memory.png" alt="Memory" className="w-14 h-14 mx-auto object-contain mb-2" />
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            {t("games.memory.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("games.memory.subtitle")}
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={game.mode} onModeChange={game.switchMode} />
        </div>

        {/* Wallet Connect (on-chain mode only) */}
        {game.mode === "onchain" && <WalletConnect />}

        {/* How to Play */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
            {t("games.memory.howToPlay")}
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• {t("games.memory.rule1")}</li>
            <li>• {t("games.memory.rule2")}</li>
            <li>• {t("games.memory.rule3")}</li>
          </ul>
        </motion.div>

        {/* Difficulty Selector */}
        {canStart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300 dark:border-gray-600"
          >
            <div className="flex gap-2">
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
                <button
                  key={d}
                  data-testid={`difficulty-${d}`}
                  onClick={() => game.changeDifficulty(d)}
                  className={`
                    flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-200
                    ${
                      game.difficulty === d
                        ? "bg-chain text-gray-900 shadow-md scale-105"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }
                  `}
                >
                  {DIFFICULTY_CONFIG[d].label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Game Controls (timer, moves, pairs) */}
        {game.status !== "idle" && (
          <GameControls
            timer={game.timer}
            moves={game.moves}
            pairsFound={game.pairsFound}
            totalPairs={game.totalPairs}
            formatTime={game.formatTime}
          />
        )}

        {/* Message Display */}
        {game.message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-3 px-4 rounded-xl font-semibold shadow-lg ${
              game.status === "finished"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-400"
                : "bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border-2 border-chain"
            }`}
          >
            {translateMessage(game.message)}
          </motion.div>
        )}

        {/* Memory Board */}
        {(game.status === "playing" || isCountdown) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <MemoryBoard
              board={game.board}
              cols={DIFFICULTY_CONFIG[game.difficulty].cols}
              onFlip={handleFlip}
              disabled={game.isChecking || game.status !== "playing"}
            />
            {/* Countdown Overlay */}
            {isCountdown && game.countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm z-10">
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

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {(canStart || isProcessing) && (
            <motion.button
              data-testid="start-game"
              onClick={game.startGame}
              disabled={isProcessing}
              className="px-8 py-3 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isProcessing ? "⏳ ..." : `🎮 ${t("games.msg.startGame")}`}
            </motion.button>
          )}

          {game.status === "playing" && (
            <motion.button
              data-testid="reset-game"
              onClick={game.resetGame}
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black shadow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔄 {t("games.msg.reset")}
            </motion.button>
          )}
        </div>

        {/* Player Stats */}
        <PlayerStats stats={game.stats} formatTime={game.formatTime} />

        {/* Footer with Contract Link */}
        {game.mode === "onchain" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-xs text-gray-600 pt-2"
          >
            {isGameAvailableOnChain("memory", chain?.id) && contractAddress ? (
              <a
                href={getExplorerAddressUrl(chain?.id, contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-chain transition-colors underline"
              >
                {t("games.memory.viewOnCeloscan").replace(
                  "Explorer",
                  getExplorerName(chain?.id)
                )}
              </a>
            ) : (
              <span>{t("chain.comingSoon")}</span>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
