"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useHiLo } from "@/hooks/useHiLo";
import type { Card } from "@/hooks/useHiLo";
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

// ─── CSS Card Component ─────────────────────────────────────────────────────

function PlayingCard({
  card,
  faceDown = false,
  size = "lg",
  glow,
  className = "",
}: {
  card: Card | null;
  faceDown?: boolean;
  size?: "sm" | "lg";
  glow?: "green" | "red" | "yellow";
  className?: string;
}) {
  const isRed = card?.suit === "♥" || card?.suit === "♦";
  const w = size === "sm" ? "w-10 h-14" : "w-24 h-36";
  const rankSize = size === "sm" ? "text-xs" : "text-2xl";
  const suitSize = size === "sm" ? "text-sm" : "text-3xl";

  const glowClass = glow === "green"
    ? "shadow-[0_0_20px_4px_rgba(74,222,128,0.7)] border-green-400"
    : glow === "red"
    ? "shadow-[0_0_20px_4px_rgba(248,113,113,0.7)] border-red-400"
    : glow === "yellow"
    ? "shadow-[0_0_20px_4px_rgba(250,204,21,0.7)] border-yellow-400"
    : "border-gray-200 dark:border-gray-600";

  if (faceDown || !card) {
    return (
      <div className={`${w} rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gradient-to-br from-indigo-700 to-indigo-900 flex items-center justify-center shadow-lg ${className}`}>
        <span className="text-white/40 text-2xl">🂠</span>
      </div>
    );
  }

  return (
    <div
      className={`${w} rounded-xl border-2 ${glowClass} bg-white dark:bg-gray-800 flex flex-col justify-between p-1.5 shadow-xl select-none transition-all ${className}`}
    >
      <div className={`${rankSize} font-black leading-none ${isRed ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
        {card.rank}
        <span className={`block ${size === "sm" ? "text-xs" : "text-base"}`}>{card.suit}</span>
      </div>
      <div className={`${suitSize} text-center leading-none ${isRed ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
        {card.suit}
      </div>
      <div className={`${rankSize} font-black leading-none text-right rotate-180 ${isRed ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
        {card.rank}
        <span className={`block ${size === "sm" ? "text-xs" : "text-base"}`}>{card.suit}</span>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HiLoPage() {
  const game = useHiLo();
  const { chain } = useAccount();
  const { t } = useLanguage();

  const contractAddress = getContractAddress("hilo" as never, chain?.id);
  const explorerUrl = contractAddress ? getExplorerAddressUrl(chain?.id, contractAddress) : null;
  const explorerName = getExplorerName(chain?.id);

  const canCashOut = game.status === "playing" && game.streak >= 2;

  // Determine card glow based on last guess result
  const currentGlow = game.guessResult === "correct" ? "green"
    : game.guessResult === "wrong" ? "red"
    : game.guessResult === "push" ? "yellow"
    : undefined;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-300 dark:border-white/20 px-4 py-2 rounded-xl text-sm font-semibold mb-6 transition-all"
        >
          {t("games.backToPortal")}
        </Link>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🃏</div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {t("games.hilo.title") || "Hi-Lo"}
          </h1>
          <p className="text-emerald-300 text-sm font-medium">
            {t("games.hilo.subtitle") || "Higher or Lower — ride your streak, cash out before you fall!"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <ModeToggle mode={game.mode} onModeChange={game.setGameMode} />
          {game.mode === "onchain" && <WalletConnect />}
        </div>

        {/* Multiplier Badge */}
        <AnimatePresence>
          {game.status === "playing" && game.streak >= 2 && (
            <motion.div
              key={game.multiplier}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex justify-center mb-4"
            >
              <div className="px-5 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/60 text-yellow-400 font-black text-lg animate-pulse">
                🔥 ×{game.multiplier} — {t("games.hilo.streak") || "Streak"} {game.streak}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Area */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-5">

          {/* History Strip */}
          {game.history.length > 1 && (
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              <span className="text-gray-500 text-xs uppercase shrink-0">{t("games.hilo.history") || "History"}:</span>
              {game.history.slice(0, -1).map((card, i) => (
                <PlayingCard key={i} card={card} size="sm" />
              ))}
            </div>
          )}

          {/* Main Card Display */}
          <div className="flex items-center justify-center gap-6 mb-6">
            {/* Current card */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-gray-400 text-xs uppercase">{t("games.hilo.current") || "Current"}</span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={game.currentCard ? `${game.currentCard.rank}${game.currentCard.suit}` : "none"}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <PlayingCard card={game.currentCard} glow={currentGlow} />
                </motion.div>
              </AnimatePresence>
              {game.currentCard && (
                <span className="text-gray-400 text-xs">
                  {t("games.hilo.value") || "Value"}: {game.currentCard.value}
                </span>
              )}
            </div>

            {/* VS separator */}
            <div className="flex flex-col items-center gap-1 text-gray-500">
              <span className="text-2xl">→</span>
            </div>

            {/* Next card (revealed after guess, else face down) */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-gray-400 text-xs uppercase">{t("games.hilo.next") || "Next"}</span>
              <AnimatePresence mode="wait">
                {game.nextCard ? (
                  <motion.div
                    key={`next-${game.nextCard.rank}${game.nextCard.suit}`}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PlayingCard
                      card={game.nextCard}
                      glow={game.guessResult === "correct" ? "green" : game.guessResult === "wrong" ? "red" : game.guessResult === "push" ? "yellow" : undefined}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="facedown">
                    <PlayingCard card={null} faceDown />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Probabilities */}
          {game.status === "playing" && game.currentCard && (
            <div className="grid grid-cols-3 gap-2 mb-5 text-center">
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-green-400 font-black text-lg">{game.probabilities.higher}%</p>
                <p className="text-gray-400 text-xs">{t("games.hilo.higher") || "Higher"}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-yellow-400 font-black text-lg">{game.probabilities.equal}%</p>
                <p className="text-gray-400 text-xs">{t("games.hilo.equal") || "Equal"}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-blue-400 font-black text-lg">{game.probabilities.lower}%</p>
                <p className="text-gray-400 text-xs">{t("games.hilo.lower") || "Lower"}</p>
              </div>
            </div>
          )}

          {/* Cards remaining */}
          {game.status === "playing" && (
            <p className="text-center text-gray-500 text-xs mb-4">
              {game.deck.length} {t("games.hilo.cardsLeft") || "cards left in deck"}
            </p>
          )}

          {/* Action Buttons — Playing */}
          {game.status === "playing" && (
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => game.guess("higher")}
                disabled={!!game.nextCard}
                className="flex-1 py-4 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-black text-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↑ {t("games.hilo.higher") || "Higher"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => game.guess("lower")}
                disabled={!!game.nextCard}
                className="flex-1 py-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↓ {t("games.hilo.lower") || "Lower"}
              </motion.button>
            </div>
          )}

          {/* Cash Out Button */}
          <AnimatePresence>
            {canCashOut && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                whileTap={{ scale: 0.95 }}
                onClick={game.cashOut}
                disabled={!!game.nextCard}
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-black text-base shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                💰 {t("games.hilo.cashOut") || "Cash Out"} (×{game.multiplier})
              </motion.button>
            )}
          </AnimatePresence>

          {/* Start / Play Again */}
          {(game.status === "idle" || game.status === "gameover" || game.status === "cashout") && (
            <button
              onClick={game.startGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-black text-xl shadow-lg transition-all"
            >
              {game.status === "idle"
                ? (t("games.hilo.startGame") || "Start Game")
                : (t("games.hilo.playAgain") || "Play Again")}
            </button>
          )}
        </div>

        {/* Result Screens */}
        <AnimatePresence>
          {game.status === "gameover" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center mb-5 p-5 rounded-2xl bg-red-900/30 border border-red-500/40"
            >
              <div className="text-4xl mb-2">💥</div>
              <p className="text-red-400 font-black text-2xl mb-1">
                {t("games.hilo.gameOver") || "Game Over!"}
              </p>
              <p className="text-gray-300 text-sm">
                {t("games.hilo.streak") || "Streak"}: {game.streak}
              </p>
            </motion.div>
          )}
          {game.status === "cashout" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center mb-5 p-5 rounded-2xl bg-yellow-900/30 border border-yellow-500/40"
            >
              <div className="text-4xl mb-2">💰</div>
              <p className="text-yellow-400 font-black text-2xl mb-1">
                {t("games.hilo.cashedOut") || "Cashed Out!"}
              </p>
              <p className="text-gray-300 text-sm">
                {t("games.hilo.streak") || "Streak"}: {game.streak} × {game.multiplier}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-5">
          <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.hilo.stats") || "My Stats"}
          </h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-gray-400 text-xs uppercase mb-1">{t("stats.played") || "Games"}</p>
              <p className="text-white font-bold text-lg">{game.stats.games}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase mb-1">{t("stats.wins") || "Wins"}</p>
              <p className="text-green-400 font-bold text-lg">{game.stats.wins}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase mb-1">{t("games.hilo.bestStreak") || "Best"}</p>
              <p className="text-yellow-400 font-bold text-lg">{game.stats.bestStreak}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase mb-1">{t("games.hilo.correct") || "Correct"}</p>
              <p className="text-emerald-400 font-bold text-lg">{game.stats.totalCorrect}</p>
            </div>
          </div>
        </div>

        {/* How to Play */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-5">
          <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.hilo.howToPlay") || "How to Play"}
          </h2>
          <ol className="space-y-2">
            {(["rule1", "rule2", "rule3", "rule4", "rule5"] as const).map((key, i) => (
              <li key={key} className="flex gap-2 text-sm text-gray-300">
                <span className="text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>
                {t(`games.hilo.${key}`) || ""}
              </li>
            ))}
          </ol>
        </div>

        {/* Multiplier Table */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-5">
          <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.hilo.multipliers") || "Streak Multipliers"}
          </h2>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { streak: "1", mult: "×1" },
              { streak: "2", mult: "×2" },
              { streak: "3", mult: "×3" },
              { streak: "4", mult: "×5" },
              { streak: "5+", mult: "×10" },
            ].map(({ streak: s, mult }) => (
              <div key={s} className="bg-white/5 rounded-lg p-2">
                <p className="text-gray-400 text-xs">{t("games.hilo.streak") || "Streak"} {s}</p>
                <p className="text-yellow-400 font-black text-base">{mult}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mb-6">
          <p className="mb-1">{t("games.hilo.footer") || "Hi-Lo — ride the streak, cash out at the right time!"}</p>
          {game.mode === "onchain" && explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              {t("games.hilo.viewOnExplorer") || `View on ${explorerName} →`}
            </a>
          ) : (
            <span className="text-gray-600">{t("chain.comingSoon") || "On-chain coming soon"}</span>
          )}
        </div>

      </div>
    </main>
  );
}
