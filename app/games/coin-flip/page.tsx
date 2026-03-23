"use client";

import Link from "next/link";
import { useCallback, useEffect, Fragment } from "react";
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
} from "@/lib/contracts/addresses";

const BTC_LOGO = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/btc.svg";
const ETH_LOGO = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/eth.svg";

// Replace {BTC} and {ETH} tokens in a string with inline logo images
function withLogos(text: string) {
  const parts = text.split(/(\{BTC\}|\{ETH\})/);
  return parts.map((part, i) => {
    if (part === "{BTC}") return <img key={i} src={BTC_LOGO} alt="BTC" className="inline w-4 h-4 mx-0.5 align-middle" />;
    if (part === "{ETH}") return <img key={i} src={ETH_LOGO} alt="ETH" className="inline w-4 h-4 mx-0.5 align-middle" />;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function CoinFlipPage() {
  const game = useCoinFlip();
  const { chain } = useAccount();
  const contractAddress = getContractAddress("coinflip", chain?.id);
  const { t } = useLanguage();
  const { vibrate } = useHaptic();

  const isFlipping = game.status === "flipping";
  const isResult = game.status === "result";
  const isIdle = game.status === "idle";

  // Labels for canvas (translated)
  const labelHeads = t("games.coinflip.heads") || "Heads";
  const labelTails = t("games.coinflip.tails") || "Tails";
  useEffect(() => {
    game.setLabels(labelHeads, labelTails);
  }, [labelHeads, labelTails, game]);

  const handleFlip = useCallback((side: "heads" | "tails") => {
    vibrate("medium");
    game.flip(side);
  }, [game, vibrate]);

  const handleReset = useCallback(() => {
    vibrate("light");
    game.reset();
  }, [game, vibrate]);

  const winMsg = t("games.coinflip.win") || "🎉 Bien joué !";
  const loseMsg = t("games.coinflip.lose") || "😔 Pas de chance...";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-100 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-300 dark:border-white/20 px-4 py-2 rounded-xl text-sm font-semibold mb-6 transition-all">
          {t("games.backToPortal")}
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <img src="/icons/coinflip.png" alt="Coin Flip" className="w-14 h-14 mx-auto object-contain mb-2" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {t("games.coinflip.title") || "Coin Flip"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {withLogos(t("games.coinflip.subtitle"))}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-6 flex justify-center">
          <ModeToggle
            mode={game.mode}
            onModeChange={game.setGameMode}
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
              <span className="text-yellow-500 dark:text-yellow-400 font-bold text-lg">
                🔥 {t("games.coinflip.streak")} {game.streak} !
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
            className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-700/50 shadow-2xl"
            style={{ maxWidth: "100%", display: "block" }}
          />
        </div>

        {/* Result message */}
        <AnimatePresence>
          {isResult && (
            <motion.div
              key={game.result}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center text-xl font-bold mb-4 ${game.result === "win" ? "text-yellow-500 dark:text-yellow-400" : "text-gray-500 dark:text-gray-400"}`}
            >
              {game.result === "win" ? winMsg : loseMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Choice buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* BTC — Heads */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleFlip("heads")}
            disabled={isFlipping}
            className={`relative flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 font-bold text-lg transition-all shadow-lg
              ${isFlipping
                ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                : isResult && game.landedSide === "heads"
                  ? "border-orange-400 bg-orange-500/20 text-orange-600 dark:text-orange-300 shadow-orange-500/30 shadow-xl"
                  : "border-orange-400/50 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 hover:border-orange-400 cursor-pointer"
              }`}
          >
            <img
              src="https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/btc.svg"
              alt="BTC"
              className="w-10 h-10"
            />
            <span className="text-sm font-semibold tracking-wide">{labelHeads}</span>
            <span className="text-xs text-orange-400/70">Bitcoin</span>
            {isResult && game.choice === "heads" && (
              <span className="absolute top-2 right-2 text-sm font-bold">
                {game.result === "win" ? "✓" : "✗"}
              </span>
            )}
          </motion.button>

          {/* ETH — Tails */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleFlip("tails")}
            disabled={isFlipping}
            className={`relative flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 font-bold text-lg transition-all shadow-lg
              ${isFlipping
                ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                : isResult && game.landedSide === "tails"
                  ? "border-indigo-400 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-indigo-500/30 shadow-xl"
                  : "border-indigo-400/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400 cursor-pointer"
              }`}
          >
            <img
              src="https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/eth.svg"
              alt="ETH"
              className="w-10 h-10"
            />
            <span className="text-sm font-semibold tracking-wide">{labelTails}</span>
            <span className="text-xs text-indigo-400/70">Ethereum</span>
            {isResult && game.choice === "tails" && (
              <span className="absolute top-2 right-2 text-sm font-bold">
                {game.result === "win" ? "✓" : "✗"}
              </span>
            )}
          </motion.button>
        </div>

        {/* Status hint / replay */}
        <div className="text-center mb-8">
          {isIdle && (
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {t("games.coinflip.tapToFlip")}
            </p>
          )}
          {isFlipping && (
            <p className="text-indigo-500 dark:text-indigo-300 text-sm animate-pulse">
              {t("games.coinflip.flipping")}
            </p>
          )}
          {isResult && (
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow"
            >
              {t("games.coinflip.flipAgain")}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: t("stats.played") || "Parties", value: game.stats.games },
            { label: t("stats.wins") || "Victoires", value: game.stats.wins },
            { label: t("games.coinflip.streak") || "Série", value: game.streak },
            { label: t("games.coinflip.bestStreak") || "Record", value: game.stats.bestStreak },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* How to play */}
        <div className="bg-white/70 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {t("games.coinflip.howToPlay")}
          </h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>{withLogos(t("games.coinflip.rule1"))}</li>
            <li>{t("games.coinflip.rule2")}</li>
            <li>{t("games.coinflip.rule3")}</li>
          </ul>
        </div>

        {/* Contract info */}
        {game.mode === "onchain" && contractAddress && (
          <div className="text-center text-xs text-gray-400 dark:text-gray-600 mb-6">
            <a
              href={getExplorerAddressUrl(chain?.id, contractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              {t("games.coinflip.viewOnExplorer")} {getExplorerName(chain?.id)} ↗
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
