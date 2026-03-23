"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRoulette, CANVAS_W, CANVAS_H, BET_AMOUNTS, getNumberColor, WHEEL_ORDER, CRYPTO_TICKERS, type BetType } from "@/hooks/useRoulette";
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

// Chip colors by amount
const CHIP_COLOR: Record<number, string> = {
  10:  "bg-blue-500 border-blue-300",
  25:  "bg-green-500 border-green-300",
  50:  "bg-orange-500 border-orange-300",
  100: "bg-red-500 border-red-300",
};

function ChipBadge({ amount }: { amount: number }) {
  const color = CHIP_COLOR[amount] ?? "bg-yellow-500 border-yellow-300";
  return (
    <span className={`absolute -top-2 -right-2 z-20 ${color} border-2 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg`}>
      {amount >= 100 ? "+" : amount}
    </span>
  );
}

// Roulette table layout: 3 rows top-to-bottom = [3,6,9,...,36] [2,5,8,...,35] [1,4,7,...,34]
// 12 columns left to right
const TABLE_ROWS = [
  Array.from({ length: 12 }, (_, col) => col * 3 + 3), // row top:    3,6,9,...,36
  Array.from({ length: 12 }, (_, col) => col * 3 + 2), // row middle: 2,5,8,...,35
  Array.from({ length: 12 }, (_, col) => col * 3 + 1), // row bottom: 1,4,7,...,34
];

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
  const lastBet = betOnThis[betOnThis.length - 1];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded border-2 font-bold transition-all select-none
        ${color === "red"
          ? "bg-red-700 hover:bg-red-600 border-red-400 text-white"
          : "bg-gray-900 hover:bg-gray-700 border-gray-600 text-white"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
        ${totalBet > 0 ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-green-900" : ""}
      `}
    >
      <img src={`${CDN}${ticker}.svg`} alt={ticker} width={18} height={18} className="flex-shrink-0" />
      <span className="text-sm font-black leading-none">{n}</span>
      {totalBet > 0 && <ChipBadge amount={lastBet?.amount ?? totalBet} />}
    </button>
  );
}

function ZeroCell({ onClick, bets, disabled }: {
  onClick: () => void;
  bets: { type: BetType; value: number | null; amount: number }[];
  disabled: boolean;
}) {
  const betOnThis = bets.filter(b => b.type === "number" && b.value === 0);
  const totalBet = betOnThis.reduce((s, b) => s + b.amount, 0);
  const lastBet = betOnThis[betOnThis.length - 1];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center justify-center gap-1 rounded border-2 border-emerald-400 bg-emerald-700 hover:bg-emerald-600 text-white font-black transition-all row-span-3 w-full h-full
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
        ${totalBet > 0 ? "ring-2 ring-yellow-400" : ""}
      `}
    >
      <img src={`${CDN}${NUMBER_TO_TICKER[0]}.svg`} alt="btc" width={20} height={20} />
      <span className="text-lg leading-none">0</span>
      {totalBet > 0 && <ChipBadge amount={lastBet?.amount ?? totalBet} />}
    </button>
  );
}

function OutsideBetCell({ label, sub, type, value, onClick, bets, disabled, className }: {
  label: string; sub: string; type: BetType; value: number | null;
  onClick: () => void; bets: { type: BetType; value: number | null; amount: number }[];
  disabled: boolean; className?: string;
}) {
  const betOn = bets.filter(b => b.type === type && b.value === value);
  const totalBet = betOn.reduce((s, b) => s + b.amount, 0);
  const lastBet = betOn[betOn.length - 1];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center justify-center gap-0.5 py-3 rounded border-2 font-bold transition-all
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
        ${totalBet > 0 ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-green-900" : ""}
        ${className}`}
    >
      <span className="text-sm font-black tracking-wide uppercase">{label}</span>
      <span className="text-[11px] opacity-70 font-normal">{sub}</span>
      {totalBet > 0 && <ChipBadge amount={lastBet?.amount ?? totalBet} />}
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
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-300 dark:border-white/20 px-4 py-2 rounded-xl text-sm font-semibold mb-6 transition-all">
          {t("games.backToPortal")}
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
              Mise : <span className="font-bold text-yellow-500">{game.totalBet}</span>
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
        <div className="flex gap-2 justify-center mb-5">
          {BET_AMOUNTS.map(a => {
            const isSelected = game.selectedBetAmount === a;
            return (
              <button
                key={a}
                onClick={() => game.setSelectedBetAmount(a)}
                className={`relative w-14 h-14 rounded-full font-black text-sm transition-all border-4 shadow-lg
                  ${isSelected ? "scale-110 shadow-yellow-400/40 shadow-xl" : "opacity-70 hover:opacity-100 hover:scale-105"}
                  ${a === 10  ? "bg-blue-600 border-blue-300 text-white" : ""}
                  ${a === 25  ? "bg-green-600 border-green-300 text-white" : ""}
                  ${a === 50  ? "bg-orange-600 border-orange-300 text-white" : ""}
                  ${a === 100 ? "bg-red-600 border-red-300 text-white" : ""}
                `}
              >
                {a}
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════
            TAPIS DE CASINO
            ════════════════════════════════════ */}
        <div
          className="rounded-2xl p-4 mb-5 shadow-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #1a5c2a 0%, #145221 50%, #0f3d18 100%)",
            border: "3px solid #c9a84c",
            boxShadow: "0 0 0 1px #8b6914, inset 0 0 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* Titre décoratif casino */}
          <div className="text-center mb-3">
            <span
              className="text-xs font-black tracking-[0.3em] uppercase"
              style={{ color: "#c9a84c", textShadow: "0 0 8px rgba(201,168,76,0.5)" }}
            >
              ✦ Crypto Roulette ✦
            </span>
          </div>

          {/* Grille principale : 0 + numéros 1-36 */}
          <div className="flex gap-1.5 mb-3">

            {/* Colonne Zéro */}
            <div className="flex-shrink-0" style={{ width: "52px" }}>
              <ZeroCell
                onClick={() => handlePlaceBet("number", 0)}
                bets={game.bets}
                disabled={isSpinning}
              />
            </div>

            {/* Grille 12 colonnes × 3 rangées */}
            <div className="flex-1 grid grid-cols-12 grid-rows-3 gap-1">
              {TABLE_ROWS.flatMap((row) =>
                row.map((n) => (
                  <NumberCell
                    key={n}
                    n={n}
                    onClick={() => handlePlaceBet("number", n)}
                    bets={game.bets}
                    disabled={isSpinning}
                  />
                ))
              )}
            </div>
          </div>

          {/* Séparateur doré */}
          <div className="h-px mb-3" style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }} />

          {/* Mises extérieures — ligne 1 : Rouge / Noir / Vert (0) */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <OutsideBetCell label="Rouge" sub="1:1" type="red" value={null}
              onClick={() => handlePlaceBet("red", null)} bets={game.bets} disabled={isSpinning}
              className="bg-red-800 hover:bg-red-700 border-yellow-600 text-white" />
            <OutsideBetCell label="Noir" sub="1:1" type="black" value={null}
              onClick={() => handlePlaceBet("black", null)} bets={game.bets} disabled={isSpinning}
              className="bg-gray-900 hover:bg-gray-800 border-yellow-600 text-white" />
            <OutsideBetCell label="Vert (0)" sub="17:1" type="green" value={null}
              onClick={() => handlePlaceBet("green", null)} bets={game.bets} disabled={isSpinning}
              className="bg-emerald-800 hover:bg-emerald-700 border-yellow-600 text-white" />
          </div>

          {/* Mises extérieures — ligne 2 : Pair / Impair */}
          <div className="grid grid-cols-2 gap-2">
            <OutsideBetCell label="Pair" sub="1:1" type="even" value={null}
              onClick={() => handlePlaceBet("even", null)} bets={game.bets} disabled={isSpinning}
              className="bg-indigo-900 hover:bg-indigo-800 border-yellow-600 text-white" />
            <OutsideBetCell label="Impair" sub="1:1" type="odd" value={null}
              onClick={() => handlePlaceBet("odd", null)} bets={game.bets} disabled={isSpinning}
              className="bg-purple-900 hover:bg-purple-800 border-yellow-600 text-white" />
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

        {/* End Session button — on-chain mode only, once a session is open */}
        {game.mode === "onchain" && game.hasActiveSession && !isSpinning && (
          <div className="flex justify-center mb-4">
            <button
              onClick={game.endSession}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:brightness-110 text-white font-semibold shadow-lg transition-all text-sm"
            >
              {t("games.roulette.endSession") || "⛓️ Enregistrer & Terminer"}
            </button>
          </div>
        )}

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
            <li>{t("games.roulette.rule1")}</li>
            <li>{t("games.roulette.rule2")}</li>
            <li>{t("games.roulette.rule3")}</li>
            <li>{t("games.roulette.rule4")}</li>
          </ul>
        </div>

        {/* Contrat */}
        {game.mode === "onchain" && contractAddress && (
          <div className="text-center text-xs text-gray-400 mb-6">
            <a href={getExplorerAddressUrl(chain?.id, contractAddress)} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
              {t("games.roulette.viewOnExplorer")} {getExplorerName(chain?.id)} ↗
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
