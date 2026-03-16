"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useCoinFlip, CANVAS_W, CANVAS_H } from "@/hooks/useCoinFlip";
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

export default function CoinFlipPage() {
  const game = useCoinFlip();
  const { chain } = useAccount();
  const contractAddress = getContractAddress("coinflip", chain?.id);
  const { t } = useLanguage();
  const { vibrate } = useHaptic();

  const isFlipping = game.status === "flipping";
  const isResult = game.status === "result";
  const isIdle = game.status === "idle";

  const handleFlip = useCallback((side: "heads" | "tails") => {
    vibrate("medium");
    game.flip(side);
  }, [game, vibrate]);

  const handleReset = useCallback(() => {
    vibrate("light");
    game.reset();
  }, [game, vibrate]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          ← {t("common.back") || "Retour"}
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-1">
            {t("games.coinflip.title") || "Coin Flip"} 🪙
          </h1>
          <p className="text-gray-400 text-sm">
            {t("games.coinflip.subtitle") || "₿ Pile ou Ξ Face — double ou rien !"}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-6">
          <ModeToggle
            currentMode={game.mode}
            onModeChange={game.setGameMode}
            gameId="coinflip"
          />
        </div>

        {/* Wallet (onchain) */}
        {game.mode === "onchain" && (
          <div className="mb-4">
            <WalletConnect />
          </div>
        )}

        {/* Streak banner */}
        <AnimatePresence>
          {game.streak >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-4 text-center bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl py-2 px-4"
            >
              <span className="text-yellow-400 font-bold text-lg">
                🔥 Série de {game.streak} !
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div className="relative flex justify-center mb-6">
          <canvas
            ref={game.canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-2xl border-2 border-indigo-700/50 shadow-2xl"
            style={{ maxWidth: "100%", display: "block" }}
          />
        </div>

        {/* Result message */}
        <AnimatePresence>
          {game.message && (
            <motion.div
              key={game.message}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center text-xl font-bold mb-4 ${game.result === "win" ? "text-yellow-400" : "text-gray-400"}`}
            >
              {game.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Choice buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleFlip("heads")}
            disabled={isFlipping}
            className={`relative flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 font-bold text-lg transition-all shadow-lg
              ${isFlipping ? "opacity-50 cursor-not-allowed border-gray-700 bg-gray-800" :
                isResult && game.landedSide === "heads" ? "border-orange-400 bg-orange-500/20 text-orange-300 shadow-orange-500/30 shadow-xl" :
                "border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-400 cursor-pointer"
              }`}
          >
            <span className="text-4xl">₿</span>
            <span className="text-sm font-semibold tracking-wide">PILE</span>
            <span className="text-xs text-orange-300/70">Bitcoin</span>
            {isResult && game.choice === "heads" && (
              <span className="absolute top-2 right-2 text-xs">
                {game.result === "win" ? "✓" : "✗"}
              </span>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleFlip("tails")}
            disabled={isFlipping}
            className={`relative flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 font-bold text-lg transition-all shadow-lg
              ${isFlipping ? "opacity-50 cursor-not-allowed border-gray-700 bg-gray-800" :
                isResult && game.landedSide === "tails" ? "border-indigo-400 bg-indigo-500/20 text-indigo-300 shadow-indigo-500/30 shadow-xl" :
                "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400 cursor-pointer"
              }`}
          >
            <span className="text-4xl">Ξ</span>
            <span className="text-sm font-semibold tracking-wide">FACE</span>
            <span className="text-xs text-indigo-300/70">Ethereum</span>
            {isResult && game.choice === "tails" && (
              <span className="absolute top-2 right-2 text-xs">
                {game.result === "win" ? "✓" : "✗"}
              </span>
            )}
          </motion.button>
        </div>

        {/* Flip again / hint */}
        <div className="text-center mb-8">
          {isIdle && (
            <p className="text-gray-500 text-sm">
              {t("games.coinflip.tapToFlip") || "Choisissez ₿ ou Ξ pour lancer la pièce"}
            </p>
          )}
          {isFlipping && (
            <p className="text-indigo-300 text-sm animate-pulse">
              {t("games.coinflip.flipping") || "La pièce tourne..."}
            </p>
          )}
          {isResult && (
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow"
            >
              {t("games.coinflip.flipAgain") || "Rejouer"}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: t("stats.played") || "Parties", value: game.stats.games },
            { label: t("stats.wins") || "Victoires", value: game.stats.wins },
            { label: "Série", value: game.streak },
            { label: "Record", value: game.stats.bestStreak },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* How to play */}
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 mb-6 text-sm text-gray-400">
          <h3 className="font-semibold text-gray-200 mb-2">
            {t("games.coinflip.howToPlay") || "Comment jouer"}
          </h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>{t("games.coinflip.rule1") || "Choisissez ₿ Pile (Bitcoin) ou Ξ Face (Ethereum)"}</li>
            <li>{t("games.coinflip.rule2") || "La pièce tourne et révèle le résultat"}</li>
            <li>{t("games.coinflip.rule3") || "Enchaînez les victoires pour monter votre série 🔥"}</li>
          </ul>
        </div>

        {/* Contract info */}
        {game.mode === "onchain" && contractAddress && (
          <div className="text-center text-xs text-gray-600 mb-6">
            <a
              href={getExplorerAddressUrl(contractAddress, chain?.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors"
            >
              {t("games.coinflip.viewOnExplorer") || "Voir sur"} {getExplorerName(chain?.id)} ↗
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
