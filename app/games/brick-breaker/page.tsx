"use client";

import Link from "next/link";
import { useEffect, useCallback, useRef } from "react";
import { useBrickBreaker, CANVAS_W, CANVAS_H } from "@/hooks/useBrickBreaker";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import {
  getExplorerAddressUrl,
} from "@/lib/contracts/addresses";

export default function BrickBreakerPage() {
  const game = useBrickBreaker();
  const { chain } = useAccount();
  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play } = useGameAudio("brickbreaker");

  const prevScore = useRef(game.score);
  const prevLevel = useRef(game.level);
  const prevResult = useRef(game.result);

  // Sound effects
  useEffect(() => {
    if (game.score > prevScore.current && game.status === "playing") {
      play("brickHit");
    }
    prevScore.current = game.score;
  }, [game.score, game.status, play]);

  useEffect(() => {
    if (game.level > prevLevel.current && game.status === "playing") {
      play("levelUp");
    }
    prevLevel.current = game.level;
  }, [game.level, game.status, play]);

  useEffect(() => {
    if (game.result && game.result !== prevResult.current) {
      if (game.result === "win") play("win");
      else play("lose");
    }
    prevResult.current = game.result;
  }, [game.result, play]);

  // Record game when finished
  useEffect(() => {
    if (game.status === "finished" && game.result) {
      recordGame("brickbreaker", game.mode, game.result);
    }
  }, [game.status, game.result, game.mode, recordGame]);

  // Mouse / touch paddle control
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (game.status !== "playing") return;
      const rect = e.currentTarget.getBoundingClientRect();
      game.movePaddleTo(e.clientX, rect);
    },
    [game]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (game.status !== "playing") return;
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      game.movePaddleTo(e.touches[0].clientX, rect);
    },
    [game]
  );

  // Keyboard paddle control
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (game.status !== "playing") return;
      if (e.key === "ArrowLeft") game.movePaddleByDelta(-20);
      if (e.key === "ArrowRight") game.movePaddleByDelta(20);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [game]);

  const isPlaying = game.status === "playing";
  const isCountdown = game.status === "countdown";
  const isFinished = game.status === "finished";
  const isIdle = game.status === "idle";
  const isWaitingTx = game.status === "waiting_start" || game.status === "waiting_end";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Back */}
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
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-sky-400 text-center space-y-1"
        >
          <img src="/icons/brickbreaker.png" alt="Brick Breaker" className="w-14 h-14 mx-auto object-contain mb-2" />
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            {t("games.brickbreaker.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("games.brickbreaker.subtitle")}
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={game.mode} onModeChange={game.setGameMode} />
        </div>

        {/* Wallet connect for on-chain */}
        {game.mode === "onchain" && <WalletConnect />}

        {/* How to Play */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
            {t("games.brickbreaker.howToPlay")}
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• {t("games.brickbreaker.rule1")}</li>
            <li>• {t("games.brickbreaker.rule2")}</li>
            <li>• {t("games.brickbreaker.rule3")}</li>
            <li>• {t("games.brickbreaker.rule4")}</li>
            <li>• {t("games.brickbreaker.rule5")}</li>
          </ul>
        </motion.div>

        {/* Game Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-gray-200 dark:border-gray-700"
        >
          {/* HUD */}
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="flex gap-4 text-sm font-bold text-gray-700 dark:text-gray-300">
              <span>Score: <span className="text-sky-500">{game.score}</span></span>
              <span>{t("games.brickbreaker.level")}: <span className="text-indigo-500">{game.level}/3</span></span>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-gray-700 dark:text-gray-300">
              {t("games.brickbreaker.lives")}:{" "}
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} className={i < game.lives ? "text-red-500" : "text-gray-400"}>❤️</span>
              ))}
            </div>
          </div>

          {/* Power-up indicators */}
          {(game.wideActive || game.laserActive) && (
            <div className="flex gap-2 mb-2 justify-center text-xs font-bold">
              {game.wideActive && <span className="bg-amber-400/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">WIDE PADDLE</span>}
              {game.laserActive && <span className="bg-pink-400/20 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">LASER</span>}
            </div>
          )}

          {/* Canvas */}
          <div className="relative flex justify-center">
            <canvas
              ref={game.canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="rounded-xl border-2 border-sky-500/40 touch-none cursor-none w-full max-w-sm"
              style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
            />

            {/* Countdown overlay */}
            {isCountdown && game.countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm z-10">
                {game.countdown > 0 ? (
                  <motion.div
                    key={game.countdown}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="text-9xl font-black text-sky-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.8)]"
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

            {/* Waiting for tx overlay */}
            {isWaitingTx && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm gap-3">
                <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-white font-semibold text-sm">Confirming transaction...</p>
              </div>
            )}

            {/* Idle / Finished overlay */}
            {(isIdle || isFinished) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm gap-4">
                {isFinished && (
                  <p className={`text-2xl font-black ${game.result === "win" ? "text-green-400" : "text-red-400"}`}>
                    {game.message}
                  </p>
                )}
                {isFinished && (
                  <p className="text-white font-bold text-lg">Score: {game.score}</p>
                )}
                <button
                  onClick={game.startGame}
                  className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-xl text-lg transition-all active:scale-95 shadow-lg"
                >
                  {isFinished ? "▶ Play Again" : "▶ Start"}
                </button>
              </div>
            )}
          </div>

          {/* Mobile arrow buttons */}
          <div className="flex justify-center gap-6 mt-3 sm:hidden">
            <button
              onPointerDown={() => {
                const interval = setInterval(() => game.movePaddleByDelta(-15), 50);
                const stop = () => clearInterval(interval);
                window.addEventListener("pointerup", stop, { once: true });
              }}
              className="w-14 h-14 bg-sky-500/20 hover:bg-sky-500/40 text-sky-500 rounded-xl font-black text-2xl flex items-center justify-center active:scale-95"
            >
              ◀
            </button>
            <button
              onPointerDown={() => {
                const interval = setInterval(() => game.movePaddleByDelta(15), 50);
                const stop = () => clearInterval(interval);
                window.addEventListener("pointerup", stop, { once: true });
              }}
              className="w-14 h-14 bg-sky-500/20 hover:bg-sky-500/40 text-sky-500 rounded-xl font-black text-2xl flex items-center justify-center active:scale-95"
            >
              ▶
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        {game.stats.games > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">{t("stats.title")}</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-2xl font-black text-sky-500">{game.stats.games}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t("stats.played")}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-2xl font-black text-green-500">{game.stats.wins}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t("stats.wins")}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-2xl font-black text-indigo-500">{game.stats.highScore}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t("stats.best")}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* On-chain explorer link */}
        {game.mode === "onchain" && game.contractAddress && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            <a
              href={getExplorerAddressUrl(chain?.id, game.contractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-500 transition-colors"
            >
              {t("games.brickbreaker.viewOnCeloscan")}
            </a>
          </p>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
          {t("games.brickbreaker.footer")}
        </p>
      </div>
    </main>
  );
}
