"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRoulette, CANVAS_W, CANVAS_H, BET_AMOUNTS, getNumberColor, getBetPayout, WHEEL_ORDER, CRYPTO_TICKERS, type BetType } from "@/hooks/useRoulette";
import { useHaptic } from "@/hooks/useHaptic";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import { getContractAddress, getExplorerAddressUrl, getExplorerName } from "@/lib/contracts/addresses";

const CDN = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/";

// Map each number (0–36) to its crypto ticker (by wheel slot order)
const NUMBER_TO_TICKER: Record<number, string> = {};
WHEEL_ORDER.forEach((num, i) => { NUMBER_TO_TICKER[num] = CRYPTO_TICKERS[i]; });

function CryptoLogo({ ticker, size = 12 }: { ticker: string; size?: number }) {
  return (
    <img
      src={`${CDN}${ticker}.svg`}
      alt={ticker}
      width={size}
      height={size}
      className="inline-block flex-shrink-0"
    />
  );
}

function NumberCell({ n, onClick, bets, disabled }: {
  n: number;
  onClick: () => void;
  bets: { type: BetType; value: number | null; amount: number }[];
  disabled: boolean;
}) {
  const color = getNumberColor(n);
  const ticker = NUMBER_TO_TICKER[n] ?? "btc";
  const betOnThis = bets.filter(b => b.type === "number" && b.value === n);
  const totalBet = betOnThis.reduce((s, b) => s + b.amount, 0);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded text-[9px] font-bold transition-all border flex flex-col items-center justify-center gap-0.5 p-0.5 w-full aspect-square
        ${color === "red" ? "bg-red-600 hover:bg-red-500 border-red-400 text-white" :
          "bg-gray-800 hover:bg-gray-700 border-gray-600 text-white"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
      `}
    >
      <CryptoLogo ticker={ticker} size={13} />
      <span className="leading-none">{n}</span>
      {totalBet > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-gray-900 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow z-10">
          {totalBet >= 100 ? "+" : totalBet}
        </span>
      )}
    </button>
  );
}

function OutsideBetButton({ label, payout, type, value, onClick, bets, disabled, className }: {
  label: string; payout?: number; type: BetType; value: number | null;
  onClick: () => void; bets: { type: BetType; value: number | null; amount: number }[];
  disabled: boolean; className?: string;
}) {
  const betOn = bets.filter(b => b.type === type && b.value === value);
  const totalBet = betOn.reduce((s, b) => s + b.amount, 0);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative py-3 px-2 rounded font-bold text-sm transition-all border flex flex-col items-center justify-center gap-1
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
        ${className}`}
    >
      <span className="leading-none">{label}</span>
      <span className="text-[11px] opacity-70">{(payout ?? getBetPayout(type))}:1</span>
      {totalBet > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-gray-900 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow z-10">
          {totalBet >= 100 ? "+" : totalBet}
        </span>
      )}
    </button>
  );
}

export default function RoulettePage() {
  const game = useRoulette();
  const { chain } = useAccount();
  const contractAddress = getContractAddress("roulette", chain?.id);
  const { t } = useLanguage();
  const { vibrate } = useHaptic();

  const isSpinning = game.status === "spinning";
  const isResult = game.status === "result";

  const handlePlaceBet = useCallback((type: BetType, value: number | null) => {
    vibrate("light");
    game.placeBet(type, value);
  }, [game, vibrate]);

  const handleSpin = useCallback(() => {
    vibrate("medium");
    game.spin();
  }, [game, vibrate]);

  const winColor = game.winningNumber !== null ? getNumberColor(game.winningNumber) : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-100 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors">
          ← {t("common.back") || "Retour"}
        </Link>

        {/* Header */}
        <div className="text-center mb-5">
          <img src="/icons/roulette.png" alt="Roulette" className="w-14 h-14 mx-auto object-contain mb-2" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {t("games.roulette.title") || "Roulette Crypto"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t("games.roulette.subtitle") || "Misez sur les couleurs ou les numéros — la roue décide !"}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-5 flex justify-center">
          <ModeToggle mode={game.mode} onModeChange={game.setGameMode} />
        </div>

        {/* Wallet */}
        {game.mode === "onchain" && (
          <div className="mb-4"><WalletConnect /></div>
        )}

        {/* Chips + mise en cours */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-xl">🪙</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{game.stats.chips}</span>
            <span className="text-gray-500 text-sm">chips</span>
          </div>
          {game.totalBet > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mise : <span className="font-bold text-gray-900 dark:text-white">{game.totalBet}</span>
            </div>
          )}
        </div>

        {/* Canvas — Roue pleine largeur */}
        <div className="relative mb-4 w-full">
          <canvas
            ref={game.canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-700/50 shadow-2xl w-full"
            style={{ display: "block" }}
          />
        </div>

        {/* Result overlay */}
        <AnimatePresence>
          {isResult && game.winningNumber !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg
                ${winColor === "red" ? "bg-red-600" : winColor === "black" ? "bg-gray-800 border border-gray-500" : "bg-green-600"}`}>
                {game.winningNumber}
              </div>
              <span className={`text-xl font-bold ${game.result === "win" ? "text-yellow-500" : "text-gray-500"}`}>
                {game.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chip selector */}
        <div className="flex gap-2 justify-center mb-4">
          {BET_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => game.setSelectedBetAmount(a)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border
                ${game.selectedBetAmount === a
                  ? "bg-yellow-400 text-gray-900 border-yellow-300 shadow-lg scale-105"
                  : "bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-yellow-400"
                }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Table de mise */}
        <div className="bg-green-800 dark:bg-green-900 rounded-2xl p-4 mb-4 border-2 border-green-600 shadow-xl">

          {/* Zéro */}
          <div className="flex justify-center mb-2">
            <button
              onClick={() => handlePlaceBet("number", 0)}
              disabled={isSpinning}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-16 h-10 rounded font-bold text-sm text-white bg-green-600 hover:bg-green-500 border border-green-400 transition-all
                ${isSpinning ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
            >
              <CryptoLogo ticker={NUMBER_TO_TICKER[0]} size={13} />
              <span className="leading-none text-xs">0</span>
              {game.bets.some(b => b.type === "number" && b.value === 0) && (
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-gray-900 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center z-10">
                  {game.bets.filter(b => b.type === "number" && b.value === 0).reduce((s, b) => s + b.amount, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Numéros 1–36 — grille 12 colonnes × 3 rangées */}
          <div className="grid grid-cols-12 gap-1 mb-3">
            {Array.from({ length: 12 }, (_, col) =>
              [1, 2, 3].map((row) => {
                const n = col * 3 + row;
                return (
                  <NumberCell
                    key={n}
                    n={n}
                    onClick={() => handlePlaceBet("number", n)}
                    bets={game.bets}
                    disabled={isSpinning}
                  />
                );
              })
            ).flat()}
          </div>

          {/* Mises extérieures */}
          <div className="grid grid-cols-5 gap-2">
            <OutsideBetButton label="Rouge" type="red" value={null}
              onClick={() => handlePlaceBet("red", null)} bets={game.bets} disabled={isSpinning}
              className="bg-red-700 hover:bg-red-600 border-red-500 text-white" />
            <OutsideBetButton label="Noir" type="black" value={null}
              onClick={() => handlePlaceBet("black", null)} bets={game.bets} disabled={isSpinning}
              className="bg-gray-800 hover:bg-gray-700 border-gray-600 text-white" />
            <OutsideBetButton label="Vert" type="green" value={null}
              onClick={() => handlePlaceBet("green", null)} bets={game.bets} disabled={isSpinning}
              className="bg-green-700 hover:bg-green-600 border-green-500 text-white" />
            <OutsideBetButton label="Pair" type="even" value={null}
              onClick={() => handlePlaceBet("even", null)} bets={game.bets} disabled={isSpinning}
              className="bg-indigo-700 hover:bg-indigo-600 border-indigo-500 text-white" />
            <OutsideBetButton label="Impair" type="odd" value={null}
              onClick={() => handlePlaceBet("odd", null)} bets={game.bets} disabled={isSpinning}
              className="bg-purple-700 hover:bg-purple-600 border-purple-500 text-white" />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={game.clearBets}
            disabled={isSpinning || game.bets.length === 0}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-semibold text-sm transition-all hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("games.roulette.clearBets") || "Effacer"}
          </button>

          {isResult ? (
            <button
              onClick={game.reset}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg"
            >
              {t("games.roulette.playAgain") || "Rejouer"}
            </button>
          ) : (
            <button
              onClick={handleSpin}
              disabled={isSpinning || game.bets.length === 0 || game.totalBet > game.stats.chips}
              className="flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: isSpinning ? "#4338ca" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {isSpinning
                ? (t("games.roulette.spinning") || "La roue tourne...")
                : (t("games.roulette.spin") || "Lancer !")}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: t("stats.played") || "Parties", value: game.stats.games },
            { label: t("stats.wins") || "Victoires", value: game.stats.wins },
            { label: "Chips", value: game.stats.chips },
            { label: t("games.roulette.bestWin") || "Meilleur gain", value: game.stats.bestWin },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Comment jouer */}
        <div className="bg-white/70 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {t("games.roulette.howToPlay") || "Comment jouer"}
          </h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>{t("games.roulette.rule1") || "Choisissez votre mise (10/25/50/100 chips)"}</li>
            <li>{t("games.roulette.rule2") || "Cliquez sur un numéro ou une couleur pour miser"}</li>
            <li>{t("games.roulette.rule3") || "Lancez la roue et attendez le résultat"}</li>
            <li>{t("games.roulette.rule4") || "Numéro plein : ×35 | Couleur : ×1 | Vert (0) : ×17"}</li>
          </ul>
        </div>

        {/* Contrat */}
        {game.mode === "onchain" && contractAddress && (
          <div className="text-center text-xs text-gray-400 mb-6">
            <a href={getExplorerAddressUrl(chain?.id, contractAddress)} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
              {t("games.roulette.viewOnExplorer") || "Voir sur"} {getExplorerName(chain?.id)} ↗
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
