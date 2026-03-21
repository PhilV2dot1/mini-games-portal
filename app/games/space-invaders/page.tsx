"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpaceInvaders, CANVAS_W, CANVAS_H } from "@/hooks/useSpaceInvaders";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import {
  getContractAddress,
  getExplorerAddressUrl,
  getExplorerName,
  isGameAvailableOnChain,
} from "@/lib/contracts/addresses";

export default function SpaceInvadersPage() {
  const game = useSpaceInvaders();
  const { chain } = useAccount();
  const { t } = useLanguage();

  const contractAddress = getContractAddress("spaceinvaders" as never, chain?.id);
  const explorerUrl = contractAddress
    ? getExplorerAddressUrl(chain?.id, contractAddress)
    : null;
  const explorerName = getExplorerName(chain?.id);

  // Keyboard events
  useEffect(() => {
    window.addEventListener("keydown", game.handleKeyDown);
    window.addEventListener("keyup", game.handleKeyUp);
    return () => {
      window.removeEventListener("keydown", game.handleKeyDown);
      window.removeEventListener("keyup", game.handleKeyUp);
    };
  }, [game.handleKeyDown, game.handleKeyUp]);

  const handleMobileFire = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    game.mobileFire();
  }, [game]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 dark:from-gray-950 dark:via-indigo-950 dark:to-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
        >
          ← {t("common.back") || "Back"}
        </Link>

        {/* Header */}
        <div className="text-center mb-5">
          <img
            src="/icons/space-invaders.png"
            alt="Space Invaders"
            className="w-14 h-14 mx-auto object-contain mb-2"
          />
          <h1 className="text-3xl font-bold text-white mb-1">
            {t("games.spaceinvaders.title") || "Space Invaders"}
          </h1>
          <p className="text-indigo-300 text-sm font-medium">
            {t("games.spaceinvaders.subtitle") || "Defend Earth from the crypto invasion!"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <ModeToggle mode={game.mode} onModeChange={game.setGameMode} />
          {game.mode === "onchain" && <WalletConnect />}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4 px-2">
          {/* Lives */}
          <div className="flex items-center gap-1 text-sm font-semibold text-gray-300">
            <span className="text-gray-400 text-xs uppercase mr-1">
              {t("games.spaceinvaders.lives") || "Lives"}
            </span>
            {[0, 1, 2].map(i => (
              <span key={i} className={`text-base ${i < game.lives ? "opacity-100" : "opacity-20 grayscale"}`}>
                ❤️
              </span>
            ))}
          </div>
          <div className="text-sm font-semibold text-gray-300">
            {t("games.spaceinvaders.wave") || "Wave"}{" "}
            <span className="text-indigo-300 font-bold text-base">{game.wave}</span>
          </div>
          <div className="text-sm font-semibold text-gray-300">
            {t("games.spaceinvaders.score") || "Score"}{" "}
            <span className="text-white font-bold">{game.score}</span>
          </div>
          <div className="text-sm font-semibold text-gray-300">
            {t("games.spaceinvaders.highScore") || "Best"}{" "}
            <span className="text-[#FCFF52] font-bold">{game.highScore}</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex justify-center mb-4">
          <div className="relative w-full" style={{ maxWidth: "480px" }}>
            <canvas
              ref={game.canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              data-testid="space-invaders-canvas"
              className="rounded-2xl border border-indigo-500/30 shadow-2xl touch-none w-full"
              style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
            />
            {/* Countdown overlay */}
            <AnimatePresence>
              {game.status === "countdown" && game.countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm z-10">
                  {game.countdown > 0 ? (
                    <motion.div
                      key={game.countdown}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="text-9xl font-black text-[#FCFF52] drop-shadow-[0_0_30px_rgba(252,255,82,0.9)]"
                    >
                      {game.countdown}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="go"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-7xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.9)]"
                    >
                      GO!
                    </motion.div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center justify-between gap-3 mb-5 px-2">
          <button
            className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xl font-bold transition-all active:scale-95 select-none"
            onPointerDown={game.mobileLeft}
            onPointerUp={game.mobileLeftEnd}
            onPointerLeave={game.mobileLeftEnd}
            onPointerCancel={game.mobileLeftEnd}
          >
            ←
          </button>
          <button
            className="flex-[2] py-4 rounded-xl bg-indigo-600/80 hover:bg-indigo-500/80 border border-indigo-400/40 text-white text-base font-bold transition-all active:scale-95 select-none"
            onPointerDown={handleMobileFire}
          >
            🔫 {t("games.spaceinvaders.fire") || "FIRE"}
          </button>
          <button
            className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xl font-bold transition-all active:scale-95 select-none"
            onPointerDown={game.mobileRight}
            onPointerUp={game.mobileRightEnd}
            onPointerLeave={game.mobileRightEnd}
            onPointerCancel={game.mobileRightEnd}
          >
            →
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-6">
          {(game.status === "idle" || game.status === "gameover" || game.status === "victory") && (
            <button
              onClick={game.startGame}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg shadow-lg transition-all"
            >
              {game.status === "idle"
                ? (t("games.spaceinvaders.startGame") || "Start Game")
                : (t("games.spaceinvaders.playAgain") || "Play Again")}
            </button>
          )}
          {game.status === "playing" && (
            <button
              onClick={game.resetGame}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all"
            >
              {t("games.reset") || "Reset"}
            </button>
          )}
        </div>

        {/* Status Messages */}
        {game.status === "gameover" && (
          <div className="text-center mb-5 p-4 rounded-xl bg-red-900/30 border border-red-500/40">
            <p className="text-red-400 font-bold text-xl">
              {t("games.spaceinvaders.gameOver") || "Game Over!"}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {t("games.spaceinvaders.score") || "Score"}: {game.score}
            </p>
          </div>
        )}
        {game.status === "victory" && (
          <div className="text-center mb-5 p-4 rounded-xl bg-yellow-900/30 border border-yellow-500/40">
            <p className="text-[#FCFF52] font-bold text-xl">
              {t("games.spaceinvaders.victory") || "Earth Saved!"}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {t("games.spaceinvaders.score") || "Score"}: {game.score}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-5">
          <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.spaceinvaders.stats") || "My Stats"}
          </h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-gray-400 text-xs uppercase mb-1">
                {t("stats.played") || "Games"}
              </p>
              <p className="text-white font-bold text-lg">{game.stats.games}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase mb-1">
                {t("stats.wins") || "Wins"}
              </p>
              <p className="text-green-400 font-bold text-lg">{game.stats.wins}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase mb-1">
                {t("games.spaceinvaders.highScore") || "Best"}
              </p>
              <p className="text-[#FCFF52] font-bold text-lg">{game.stats.highScore}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase mb-1">
                {t("games.spaceinvaders.wave") || "Wave"}
              </p>
              <p className="text-indigo-300 font-bold text-lg">{game.stats.wave}</p>
            </div>
          </div>
        </div>

        {/* How to Play */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-5">
          <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.spaceinvaders.howToPlay") || "How to Play"}
          </h2>
          <ol className="space-y-2">
            {(["rule1", "rule2", "rule3", "rule4"] as const).map((key, i) => (
              <li key={key} className="flex gap-2 text-sm text-gray-300">
                <span className="text-indigo-400 font-bold flex-shrink-0">{i + 1}.</span>
                {t(`games.spaceinvaders.${key}`) || ""}
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mb-6">
          <p className="mb-1">{t("games.spaceinvaders.footer") || "Space Invaders — defend Earth from the crypto invasion!"}</p>
          {game.mode === "onchain" && explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {t("games.spaceinvaders.viewOnExplorer") || `View on ${explorerName} →`}
            </a>
          ) : (
            <span className="text-gray-600">{t("chain.comingSoon") || "On-chain coming soon"}</span>
          )}
        </div>

      </div>
    </main>
  );
}
