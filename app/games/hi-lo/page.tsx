"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useHiLo } from "@/hooks/useHiLo";
import type { Card } from "@/hooks/useHiLo";
import { PlayingCard } from "@/components/shared/PlayingCard";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import {
  getContractAddress,
  getExplorerAddressUrl,
  getExplorerName,
} from "@/lib/contracts/addresses";

// ─── Page ───────────────────────────────────────────────────────────────────

function HiLoCard({
  card,
  faceDown = false,
  size = "lg",
  glow,
}: {
  card: Card | null;
  faceDown?: boolean;
  size?: "sm" | "lg";
  glow?: "green" | "red" | "yellow";
}) {
  if (faceDown || !card) {
    return (
      <PlayingCard
        faceDown
        size={size === "lg" ? "lg" : "sm"}
        glow={glow}
      />
    );
  }
  return (
    <PlayingCard
      suit={card.suit}
      value={card.value}
      size={size === "lg" ? "lg" : "sm"}
      glow={glow}
    />
  );
}

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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
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
          <img src="/icons/hilo.png" alt="Hi-Lo" className="w-14 h-14 mx-auto object-contain mb-2" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {t("games.hilo.title") || "Hi-Lo"}
          </h1>
          <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
            {t("games.hilo.subtitle") || "Higher or Lower — ride your streak, cash out before you fall!"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex flex-col items-center gap-3 mb-3">
          <ModeToggle mode={game.mode} onModeChange={game.setGameMode} />
        </div>
        {game.mode === "onchain" && (
          <div className="mb-5">
            <WalletConnect />
          </div>
        )}

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
              <div className="px-5 py-2 rounded-full bg-yellow-100 dark:bg-yellow-500/20 border border-yellow-400 dark:border-yellow-500/60 text-yellow-700 dark:text-yellow-400 font-black text-lg animate-pulse">
                🔥 ×{game.multiplier} — {t("games.hilo.streak") || "Streak"} {game.streak}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Area */}
        <div className="bg-white/80 dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 p-6 mb-5 shadow-lg">

          {/* History Strip */}
          {game.history.length > 1 && (
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              <span className="text-gray-500 dark:text-gray-500 text-xs uppercase shrink-0">{t("games.hilo.history") || "History"}:</span>
              {game.history.slice(0, -1).map((card, i) => (
                <HiLoCard key={i} card={card} size="sm" />
              ))}
            </div>
          )}

          {/* Main Card Display */}
          <div className="flex items-center justify-center gap-6 mb-6">
            {/* Current card */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">{t("games.hilo.current") || "Current"}</span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={game.currentCard ? `${game.currentCard.rank}${game.currentCard.suit}` : "none"}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <HiLoCard card={game.currentCard} glow={currentGlow} />
                </motion.div>
              </AnimatePresence>
              {game.currentCard && (
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {t("games.hilo.value") || "Value"}: {game.currentCard.value}
                </span>
              )}
            </div>

            {/* VS separator */}
            <div className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500">
              <span className="text-2xl">→</span>
            </div>

            {/* Next card (revealed after guess, else face down) */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">{t("games.hilo.next") || "Next"}</span>
              <AnimatePresence mode="wait">
                {game.nextCard ? (
                  <motion.div
                    key={`next-${game.nextCard.rank}${game.nextCard.suit}`}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HiLoCard
                      card={game.nextCard}
                      glow={game.guessResult === "correct" ? "green" : game.guessResult === "wrong" ? "red" : game.guessResult === "push" ? "yellow" : undefined}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="facedown">
                    <HiLoCard card={null} faceDown />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Probabilities */}
          {game.status === "playing" && game.currentCard && (
            <div className="grid grid-cols-3 gap-2 mb-5 text-center">
              <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-2">
                <p className="text-green-600 dark:text-green-400 font-black text-lg">{game.probabilities.higher}%</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">{t("games.hilo.higher") || "Higher"}</p>
              </div>
              <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-2">
                <p className="text-yellow-600 dark:text-yellow-400 font-black text-lg">{game.probabilities.equal}%</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">{t("games.hilo.equal") || "Equal"}</p>
              </div>
              <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-2">
                <p className="text-blue-600 dark:text-blue-400 font-black text-lg">{game.probabilities.lower}%</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">{t("games.hilo.lower") || "Lower"}</p>
              </div>
            </div>
          )}

          {/* Cards remaining */}
          {game.status === "playing" && (
            <p className="text-center text-gray-500 text-xs mb-4">
              {game.deck.length} {t("games.hilo.cardsLeft") || "cards left in deck"}
            </p>
          )}

          {/* Waiting for startSession tx */}
          {game.status === "waiting_start" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"
              />
              <p className="text-gray-600 dark:text-gray-300 text-sm font-semibold text-center">
                {t("games.hilo.waitingStart") || "Sign the transaction to start your on-chain session…"}
              </p>
            </div>
          )}

          {/* Waiting for endSession tx */}
          {game.status === "waiting_end" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"
              />
              <p className="text-gray-600 dark:text-gray-300 text-sm font-semibold text-center">
                {t("games.hilo.waitingEnd") || "Recording result on-chain…"}
              </p>
            </div>
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
              className="text-center mb-5 p-5 rounded-2xl bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/40"
            >
              <div className="text-4xl mb-2">💥</div>
              <p className="text-red-600 dark:text-red-400 font-black text-2xl mb-1">
                {t("games.hilo.gameOver") || "Game Over!"}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t("games.hilo.streak") || "Streak"}: {game.streak}
              </p>
            </motion.div>
          )}
          {game.status === "cashout" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center mb-5 p-5 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500/40"
            >
              <div className="text-4xl mb-2">💰</div>
              <p className="text-yellow-700 dark:text-yellow-400 font-black text-2xl mb-1">
                {t("games.hilo.cashedOut") || "Cashed Out!"}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t("games.hilo.streak") || "Streak"}: {game.streak} × {game.multiplier}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="bg-white/80 dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 p-5 mb-5 shadow-lg">
          <h2 className="text-gray-900 dark:text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.hilo.stats") || "My Stats"}
          </h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">{t("stats.played") || "Games"}</p>
              <p className="text-gray-900 dark:text-white font-bold text-lg">{game.stats.games}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">{t("stats.wins") || "Wins"}</p>
              <p className="text-green-600 dark:text-green-400 font-bold text-lg">{game.stats.wins}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">{t("games.hilo.bestStreak") || "Best"}</p>
              <p className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">{game.stats.bestStreak}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">{t("games.hilo.correct") || "Correct"}</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{game.stats.totalCorrect}</p>
            </div>
          </div>
        </div>

        {/* How to Play */}
        <div className="bg-white/80 dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 p-5 mb-5 shadow-lg">
          <h2 className="text-gray-900 dark:text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.hilo.howToPlay") || "How to Play"}
          </h2>
          <ol className="space-y-2">
            {(["rule1", "rule2", "rule3", "rule4", "rule5"] as const).map((key, i) => (
              <li key={key} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>
                {t(`games.hilo.${key}`) || ""}
              </li>
            ))}
          </ol>
        </div>

        {/* Multiplier Table */}
        <div className="bg-white/80 dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 p-5 mb-5 shadow-lg">
          <h2 className="text-gray-900 dark:text-white font-bold mb-3 text-sm uppercase tracking-wider">
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
              <div key={s} className="bg-gray-100 dark:bg-white/5 rounded-lg p-2">
                <p className="text-gray-500 dark:text-gray-400 text-xs">{t("games.hilo.streak") || "Streak"} {s}</p>
                <p className="text-yellow-600 dark:text-yellow-400 font-black text-base">{mult}</p>
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
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 underline"
            >
              {t("games.hilo.viewOnExplorer") || `View on ${explorerName} →`}
            </a>
          ) : (
            <span className="text-gray-500 dark:text-gray-600">{t("chain.comingSoon") || "On-chain coming soon"}</span>
          )}
        </div>

      </div>
    </main>
  );
}
