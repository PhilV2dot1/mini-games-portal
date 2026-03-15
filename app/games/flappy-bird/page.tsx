"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import { useFlappyBird, CANVAS_W, CANVAS_H } from "@/hooks/useFlappyBird";
import { useHaptic } from "@/hooks/useHaptic";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import {
  getContractAddress,
  getExplorerAddressUrl,
  getExplorerName,
  isGameAvailableOnChain,
} from "@/lib/contracts/addresses";

export default function FlappyBirdPage() {
  const game = useFlappyBird();
  const { chain } = useAccount();
  const contractAddress = getContractAddress("flappybird", chain?.id);
  const { t } = useLanguage();
  const { vibrate } = useHaptic();

  const isPlaying = game.status === "playing";
  const isCountdown = game.status === "countdown";
  const isFinished = game.status === "finished";
  const isProcessing = game.status === "processing";

  // Keyboard: Space / ArrowUp to jump
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        game.jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  // Vibrate on jump (mobile feel)
  const handleJump = useCallback(() => {
    game.jump();
    vibrate("light");
  }, [game, vibrate]);

  // Touch: tap canvas to jump
  const handleCanvasTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleJump();
    },
    [handleJump]
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-900 via-indigo-900 to-gray-900 dark:from-gray-950 dark:via-indigo-950 dark:to-gray-950 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold"
        >
          ← {t("games.backToPortal")}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-orange-400/60 text-center space-y-1"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/btc.svg"
              alt="BTC"
              className="w-10 h-10"
            />
            <h1 className="text-4xl font-black text-white">
              {t("games.flappybird.title")}
            </h1>
          </div>
          <p className="text-sm text-white/70">
            {t("games.flappybird.subtitle")}
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={game.mode} onModeChange={game.setGameMode} />
        </div>

        {/* How to Play */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-xl p-4 shadow-lg border border-white/20"
        >
          <h2 className="font-bold text-lg mb-2 text-white">
            {t("games.flappybird.howToPlay")}
          </h2>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• {t("games.flappybird.rule1")}</li>
            <li>• {t("games.flappybird.rule2")}</li>
            <li>• {t("games.flappybird.rule3")}</li>
            <li>• {t("games.flappybird.rule4")}</li>
          </ul>
        </motion.div>

        {/* Wallet Connect (On-Chain Mode) */}
        {game.mode === "onchain" && <WalletConnect />}

        {/* Result Banner */}
        <AnimatePresence>
          {game.message && (isFinished || isProcessing) && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center py-3 px-4 rounded-xl font-semibold shadow-lg ${
                game.result === "win"
                  ? "bg-green-500/20 text-green-300 border-2 border-green-400"
                  : game.result === "lose"
                    ? "bg-red-500/20 text-red-300 border-2 border-red-400"
                    : "bg-white/10 text-white border-2 border-orange-400"
              }`}
            >
              {game.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex justify-center"
        >
          <canvas
            ref={game.canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            data-testid="flappy-canvas"
            className="rounded-2xl shadow-2xl border-2 border-orange-400/40 cursor-pointer touch-none w-full max-w-[400px]"
            style={{ maxHeight: "560px" }}
            onClick={handleJump}
            onTouchStart={handleCanvasTouch}
          />

          {/* Idle Overlay */}
          {game.status === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
              <div className="text-center space-y-3 px-6">
                <img
                  src="https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/btc.svg"
                  alt="BTC"
                  className="w-16 h-16 mx-auto"
                />
                <p className="text-white font-bold text-xl">Flappy Bitcoin</p>
                <p className="text-white/60 text-sm">
                  {t("games.flappybird.tapToStart")}
                </p>
              </div>
            </div>
          )}

          {/* Countdown Overlay */}
          {isCountdown && game.countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm z-20">
              {game.countdown > 0 ? (
                <motion.div
                  key={game.countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-9xl font-black text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]"
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

          {/* Finished Overlay */}
          {isFinished && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm z-20">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-4 px-8"
              >
                <div className="text-6xl">{game.result === "win" ? "🏆" : "💥"}</div>
                <p className="text-white font-black text-3xl">
                  {game.result === "win" ? t("games.flappybird.win") : t("games.flappybird.lose")}
                </p>
                <p className="text-orange-300 font-bold text-xl">
                  {t("games.flappybird.score")}: {game.score}
                </p>
                <p className="text-white/60 text-sm">
                  {t("games.flappybird.bestScore")}: {game.stats.highScore}
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Score display while playing */}
        {(isPlaying || isCountdown) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center gap-8 bg-white/10 dark:bg-white/5 rounded-xl py-3 px-6 border border-white/20"
          >
            <div className="text-center">
              <p className="text-white/60 text-xs font-medium">{t("games.flappybird.score")}</p>
              <p className="text-white font-black text-2xl">{game.score}</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-xs font-medium">{t("games.flappybird.goal")}</p>
              <p className="text-orange-300 font-black text-2xl">{game.winScore}</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-xs font-medium">{t("games.flappybird.best")}</p>
              <p className="text-yellow-300 font-black text-2xl">{game.stats.highScore}</p>
            </div>
          </motion.div>
        )}

        {/* Controls hint */}
        {(isPlaying || isCountdown) && (
          <p className="text-center text-white/50 text-xs">
            {t("games.flappybird.controls")}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {(game.status === "idle" || isFinished) && (
            <motion.button
              data-testid="start-game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={game.startGame}
              disabled={isProcessing || (game.mode === "onchain" && !contractAddress)}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:brightness-110 text-white rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isProcessing ? t("games.starting") : isFinished ? t("games.playAgain") : t("games.startGame")}
            </motion.button>
          )}
          {isPlaying && (
            <motion.button
              data-testid="stop-game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={game.stopGame}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold shadow-lg transition-all"
            >
              {t("games.reset")}
            </motion.button>
          )}
        </div>

        {/* Player Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-xl p-4 shadow-lg border border-white/20"
        >
          <h3 className="font-bold text-white mb-3">{t("games.flappybird.stats")}</h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-white/60 text-xs">{t("stats.played")}</p>
              <p className="text-white font-bold text-lg">{game.stats.games}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">{t("stats.wins")}</p>
              <p className="text-green-400 font-bold text-lg">{game.stats.wins}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">{t("games.flappybird.best")}</p>
              <p className="text-yellow-300 font-bold text-lg">{game.stats.highScore}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">{t("games.flappybird.score")}</p>
              <p className="text-orange-300 font-bold text-lg">{game.stats.totalScore}</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-white/40 pt-2 space-y-1"
        >
          <p className="font-semibold">{t("games.flappybird.footer")}</p>
          {isGameAvailableOnChain("flappybird", chain?.id) && contractAddress ? (
            <p>
              {t("games.contract")}{" "}
              <a
                href={getExplorerAddressUrl(chain?.id, contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-orange-400 underline transition-colors"
              >
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </a>
              {" | "}
              <a
                href={getExplorerAddressUrl(chain?.id, contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-orange-400 underline transition-colors"
              >
                {t("games.flappybird.viewOnExplorer").replace("Explorer", getExplorerName(chain?.id))}
              </a>
            </p>
          ) : (
            <p className="text-white/30">{t("chain.comingSoon")}</p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
