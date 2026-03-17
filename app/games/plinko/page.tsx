"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import { usePlinko, CANVAS_W, CANVAS_H, BET_OPTIONS, coinsToBTC } from "@/hooks/usePlinko";
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

export default function PlinkoPage() {
  const game = usePlinko();
  const { chain } = useAccount();
  const contractAddress = getContractAddress("plinko", chain?.id);
  const { t } = useLanguage();
  const { vibrate } = useHaptic();

  const isPlaying = game.status === "playing";
  const isCountdown = game.status === "countdown";
  const isFinished = game.status === "finished";
  const isProcessing = game.status === "processing";

  // Keyboard: Space to drop ball
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        game.dropBall();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  // Canvas mouse move — aim
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      game.handleMouseMove(e.clientX, rect);
    },
    [game]
  );

  // Canvas touch move — aim
  const handleCanvasTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        game.handleTouchMove(e.touches[0].clientX, rect);
      }
    },
    [game]
  );

  // Canvas click — drop ball
  const handleCanvasClick = useCallback(() => {
    game.dropBall();
    vibrate("light");
  }, [game, vibrate]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 dark:from-gray-950 dark:via-indigo-950 dark:to-gray-950 p-4 sm:p-8">
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
          className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-yellow-400/60 text-center space-y-1"
        >
          <img src="/icons/plinko.png" alt="Plinko" className="w-14 h-14 mx-auto object-contain mb-2" />
          <h1 className="text-4xl font-black text-white">
            {t("games.plinko.title")}
          </h1>
          <p className="text-sm text-white/70">
            {t("games.plinko.subtitle")}
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
            {t("games.plinko.howToPlay")}
          </h2>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• {t("games.plinko.rule1")}</li>
            <li>• {t("games.plinko.rule2")}</li>
            <li>• {t("games.plinko.rule3")}</li>
            <li>• {t("games.plinko.rule4")}</li>
          </ul>
        </motion.div>

        {/* Wallet Connect (On-Chain Mode) */}
        {game.mode === "onchain" && <WalletConnect />}

        {/* Bet Selector */}
        {(isPlaying || isCountdown) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 bg-white/10 dark:bg-white/5 rounded-xl py-3 px-4 border border-white/20"
          >
            <span className="text-white/60 text-sm font-medium mr-1">
              {t("games.plinko.bet")}:
            </span>
            {BET_OPTIONS.map((bet) => (
              <button
                key={bet}
                onClick={() => game.setBet(bet)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  game.currentBet === bet
                    ? "bg-yellow-400 text-gray-900 shadow-lg scale-105"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {bet}
              </button>
            ))}
          </motion.div>
        )}

        {/* Coins display while playing */}
        {(isPlaying || isCountdown) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center gap-8 bg-white/10 dark:bg-white/5 rounded-xl py-3 px-6 border border-white/20"
          >
            <div className="text-center">
              <p className="text-white/60 text-xs font-medium">{t("games.plinko.coins")}</p>
              <p className="text-yellow-300 font-black text-2xl">{coinsToBTC(game.coins)}</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-xs font-medium">{t("games.plinko.bet")}</p>
              <p className="text-orange-300 font-black text-2xl">{game.currentBet}</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-xs font-medium">{t("games.plinko.best")}</p>
              <p className="text-white font-black text-2xl">{game.stats.highScore}</p>
            </div>
          </motion.div>
        )}

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
                    : "bg-white/10 text-white border-2 border-yellow-400"
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
            data-testid="plinko-canvas"
            className="rounded-2xl shadow-2xl border-2 border-yellow-400/40 cursor-crosshair touch-none w-full max-w-[400px]"
            style={{ maxHeight: "620px" }}
            onMouseMove={handleCanvasMouseMove}
            onTouchMove={handleCanvasTouchMove}
            onClick={handleCanvasClick}
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
                <p className="text-white font-bold text-xl">{t("games.plinko.title")}</p>
                <p className="text-white/60 text-sm">
                  {t("games.plinko.tapToDrop")}
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
                  className="text-9xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]"
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
                <div className="text-6xl">
                  {game.result === "win" ? "🏆" : "💸"}
                </div>
                <p className="text-white font-black text-2xl">
                  {game.result === "win"
                    ? t("games.plinko.win")
                    : t("games.plinko.lose")}
                </p>
                <p className="text-yellow-300 font-bold text-xl">
                  {coinsToBTC(game.coins)}
                </p>
                <p className="text-white/60 text-sm">
                  {t("games.plinko.best")}: {coinsToBTC(game.stats.highScore)}
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Controls hint */}
        {(isPlaying || isCountdown) && (
          <p className="text-center text-white/50 text-xs">
            {t("games.plinko.controls")}
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
            <>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={game.endGameManually}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:brightness-110 text-white rounded-xl font-semibold shadow-lg transition-all"
              >
                {t("games.plinko.endGame") || "End & Save"}
              </motion.button>
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
            </>
          )}
        </div>

        {/* Player Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-xl p-4 shadow-lg border border-white/20"
        >
          <h3 className="font-bold text-white mb-3">{t("games.plinko.stats")}</h3>
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
              <p className="text-white/60 text-xs">{t("games.plinko.best")}</p>
              <p className="text-yellow-300 font-bold text-lg">{coinsToBTC(game.stats.highScore)}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">{t("games.plinko.coins")}</p>
              <p className="text-orange-300 font-bold text-lg">{coinsToBTC(game.stats.totalScore)}</p>
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
          <p className="font-semibold">{t("games.plinko.footer")}</p>
          {isGameAvailableOnChain("plinko", chain?.id) && contractAddress ? (
            <p>
              {t("games.contract")}{" "}
              <a
                href={getExplorerAddressUrl(chain?.id, contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-yellow-400 underline transition-colors"
              >
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </a>
              {" | "}
              <a
                href={getExplorerAddressUrl(chain?.id, contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-yellow-400 underline transition-colors"
              >
                {t("games.plinko.viewOnExplorer").replace("Explorer", getExplorerName(chain?.id))}
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
