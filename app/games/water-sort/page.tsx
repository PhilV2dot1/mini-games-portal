"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useWaterSort, CRYPTOS, Tube, Difficulty } from "@/hooks/useWaterSort";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getExplorerAddressUrl, getExplorerName } from "@/lib/contracts/addresses";
import { useAccount } from "wagmi";

// ========================================
// SEGMENT COMPONENT
// ========================================

function TubeSegment({ cryptoId, isTop }: { cryptoId: string; isTop: boolean }) {
  const crypto = CRYPTOS.find(c => c.id === cryptoId);
  if (!crypto) return null;
  return (
    <div
      className="w-full flex-none flex items-center justify-center"
      style={{
        height: "25%",
        backgroundColor: crypto.color,
        boxShadow: isTop
          ? `inset 0 4px 8px rgba(255,255,255,0.3)`
          : `inset 0 2px 4px rgba(255,255,255,0.15)`,
      }}
    >
      <img
        src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/${crypto.ticker}.svg`}
        alt={crypto.name}
        width={20}
        height={20}
      />
    </div>
  );
}

// ========================================
// TUBE COMPONENT
// ========================================

interface TubeDisplayProps {
  tube: Tube;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}

function TubeDisplay({ tube, index, isSelected, onClick, disabled }: TubeDisplayProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={`Tube ${index + 1}`}
      className={[
        "relative flex flex-col-reverse items-stretch w-14 h-52",
        "rounded-b-2xl border-2 overflow-hidden transition-all duration-200",
        "bg-white/5 backdrop-blur-sm",
        isSelected
          ? "ring-4 ring-yellow-400 scale-105 border-yellow-400"
          : "border-white/40 hover:border-white/70",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {/* 4 slots — chacun occupe exactement 25% de la hauteur du tube */}
      {Array.from({ length: 4 }, (_, slotIdx) => {
        const segment = tube[slotIdx];
        return segment ? (
          <TubeSegment
            key={slotIdx}
            cryptoId={segment}
            isTop={slotIdx === tube.length - 1}
          />
        ) : (
          <div key={slotIdx} className="w-full flex-none" style={{ height: "25%" }} />
        );
      })}
    </button>
  );
}

// ========================================
// DIFFICULTY BUTTON
// ========================================

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy:   "from-green-500 to-emerald-600",
  medium: "from-yellow-500 to-amber-600",
  hard:   "from-red-500 to-rose-600",
};

// ========================================
// MAIN PAGE
// ========================================

export default function WaterSortPage() {
  const game = useWaterSort();
  const { t } = useLanguage();
  const { chain } = useAccount();

  const explorerUrl = game.contractAddress
    ? getExplorerAddressUrl(chain?.id, game.contractAddress)
    : null;
  const explorerName = getExplorerName(chain?.id);

  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  const diffLabel = (d: Difficulty) => {
    if (d === "easy") return t("games.watersort.easy") || "Easy";
    if (d === "medium") return t("games.watersort.medium") || "Medium";
    return t("games.watersort.hard") || "Hard";
  };

  const bestForDiff = game.stats.bestMoves[game.difficulty];

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-950 via-blue-950 to-indigo-950 p-4 sm:p-8">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-cyan-300/70 hover:text-white text-sm mb-6 transition-colors"
        >
          ← {t("common.back") || "Back"}
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/icons/watersort.png"
            alt="Water Sort Crypto"
            className="w-14 h-14 mx-auto object-contain mb-2"
          />
          <h1 className="text-4xl font-bold text-white mb-1">
            {t("games.watersort.title") || "Water Sort Crypto"}
          </h1>
          <p className="text-cyan-300/70 text-sm">
            {t("games.watersort.subtitle") || "Sort the crypto liquids — pour and match colors!"}
          </p>
        </div>

        {/* Mode Toggle + Wallet */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <ModeToggle
            mode={game.mode}
            onModeChange={game.setGameMode}
          />
          {game.mode === "onchain" && <WalletConnect />}
        </div>

        {/* Difficulty Selector */}
        <div className="flex gap-2 justify-center mb-5">
          {difficulties.map(d => (
            <button
              key={d}
              onClick={() => game.newGame(d)}
              className={[
                "px-4 py-1.5 rounded-full text-sm font-semibold text-white transition-all",
                `bg-gradient-to-r ${DIFFICULTY_COLORS[d]}`,
                game.difficulty === d
                  ? "ring-2 ring-white scale-105 shadow-lg"
                  : "opacity-60 hover:opacity-100",
              ].join(" ")}
            >
              {diffLabel(d)}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex gap-6 justify-center mb-6 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{game.moves}</div>
            <div className="text-xs text-cyan-300/60 uppercase tracking-wider">
              {t("games.watersort.moves") || "Moves"}
            </div>
          </div>
          {bestForDiff > 0 && (
            <div>
              <div className="text-2xl font-bold text-yellow-400">{bestForDiff}</div>
              <div className="text-xs text-cyan-300/60 uppercase tracking-wider">
                {t("games.watersort.bestMoves") || "Best"}
              </div>
            </div>
          )}
        </div>

        {/* Tubes Grid */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {game.tubes.map((tube, idx) => (
            <TubeDisplay
              key={idx}
              tube={tube}
              index={idx}
              isSelected={game.selectedTube === idx}
              onClick={() => game.selectTube(idx)}
              disabled={game.status === "won"}
            />
          ))}
        </div>

        {/* Reset / New Game buttons */}
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={game.resetGame}
            className="px-5 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all text-sm"
          >
            {t("games.watersort.playAgain") || "Play Again"}
          </button>
          <button
            onClick={() => game.newGame(game.difficulty)}
            className="px-5 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition-all text-sm font-semibold"
          >
            {t("games.watersort.newGame") || "New Game"}
          </button>
        </div>

        {/* How to Play */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-6">
          <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.watersort.howToPlay") || "How to Play"}
          </h2>
          <ol className="space-y-1.5">
            {(["rule1", "rule2", "rule3", "rule4"] as const).map((key, i) => (
              <li key={key} className="flex gap-2 text-sm text-cyan-200/80">
                <span className="text-cyan-400 font-bold flex-shrink-0">{i + 1}.</span>
                {t(`games.watersort.${key}`) || ""}
              </li>
            ))}
          </ol>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Games", value: game.stats.games },
            { label: "Wins", value: game.stats.wins },
            { label: "Best", value: bestForDiff || "—" },
          ].map(s => (
            <div
              key={s.label}
              className="bg-white/5 rounded-xl border border-white/10 p-3 text-center"
            >
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-cyan-300/60">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Contract Link */}
        {game.mode === "onchain" && explorerUrl && (
          <div className="text-center mb-4">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 text-xs underline"
            >
              {t("games.watersort.viewOnExplorer") || `View on ${explorerName} →`}
            </a>
          </div>
        )}

      </div>

      {/* Win Overlay */}
      <AnimatePresence>
        {game.status === "won" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-cyan-900 to-blue-900 border border-cyan-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              {/* Confetti-like circles */}
              <div className="flex justify-center gap-2 mb-4">
                {CRYPTOS.slice(0, 6).map(c => (
                  <motion.div
                    key={c.id}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: CRYPTOS.indexOf(c) * 0.07 }}
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>

              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("games.watersort.win") || "Sorted! All cryptos matched!"}
              </h2>

              <div className="flex gap-6 justify-center my-4">
                <div>
                  <div className="text-3xl font-bold text-cyan-300">{game.moves}</div>
                  <div className="text-xs text-cyan-300/60 uppercase">
                    {t("games.watersort.moves") || "Moves"}
                  </div>
                </div>
                {bestForDiff > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-yellow-400">{bestForDiff}</div>
                    <div className="text-xs text-cyan-300/60 uppercase">
                      {t("games.watersort.bestMoves") || "Best"}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={game.resetGame}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all font-medium"
                >
                  {t("games.watersort.playAgain") || "Play Again"}
                </button>
                <button
                  onClick={() => game.newGame(game.difficulty)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 transition-all"
                >
                  {t("games.watersort.newGame") || "New Game"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
