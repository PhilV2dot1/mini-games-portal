"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useArrowEscape,
  type Difficulty,
  type Direction,
  type Cell,
  type Enemy,
  DIFFICULTY_CONFIG,
} from "@/hooks/useArrowEscape";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getExplorerAddressUrl, getExplorerName } from "@/lib/contracts/addresses";
import { useAccount } from "wagmi";

// ========================================
// ARROW EMOJI HELPERS
// ========================================

const ARROW_EMOJIS: Record<Direction, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "from-green-500 to-emerald-600",
  medium: "from-yellow-500 to-amber-600",
  hard: "from-red-500 to-rose-600",
};

// ========================================
// GRID CELL RENDERER
// ========================================

interface GridCellProps {
  cell: Cell;
  isPlayer: boolean;
  isEnemy: boolean;
}

function GridCell({ cell, isPlayer, isEnemy }: GridCellProps) {
  // Player
  if (isPlayer) {
    return (
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="w-10 h-10 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50 flex items-center justify-center text-white font-bold text-sm"
      >
        ●
      </motion.div>
    );
  }

  // Enemy
  if (isEnemy) {
    return (
      <motion.div
        animate={{ opacity: [1, 0.65, 1] }}
        transition={{ repeat: Infinity, duration: 0.9 }}
        className="w-10 h-10 rounded-full bg-red-500 shadow-lg shadow-red-500/50 flex items-center justify-center text-white text-sm"
      >
        ●
      </motion.div>
    );
  }

  // Exit
  if (cell.type === "exit") {
    return (
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-10 h-10 rounded bg-green-500/20 border border-green-400/60 flex items-center justify-center text-green-400 text-xl"
      >
        ⬡
      </motion.div>
    );
  }

  // Wall
  if (cell.type === "wall") {
    return (
      <div className="w-10 h-10 rounded bg-gray-600 shadow-inner border border-gray-500/50" />
    );
  }

  // Arrow
  if (cell.type === "arrow") {
    return (
      <div className="w-10 h-10 rounded bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-xl font-bold">
        {ARROW_EMOJIS[cell.arrowDir!]}
      </div>
    );
  }

  // Empty
  return <div className="w-10 h-10 rounded bg-gray-800/50" />;
}

// ========================================
// DIRECTIONAL CONTROLS
// ========================================

interface DirButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function DirButton({ label, onClick, disabled }: DirButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-11 h-11 rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-xl font-bold border border-gray-600 transition-all disabled:opacity-30"
    >
      {label}
    </button>
  );
}

// ========================================
// MAIN PAGE
// ========================================

export default function ArrowEscapePage() {
  const game = useArrowEscape();
  const { t } = useLanguage();
  const { chain } = useAccount();

  const explorerUrl =
    game.contractAddress
      ? getExplorerAddressUrl(chain?.id, game.contractAddress)
      : null;
  const explorerName = getExplorerName(chain?.id);

  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  const diffLabel = (d: Difficulty) => {
    if (d === "easy")   return t("games.arrowescape.easy")   || "Easy";
    if (d === "medium") return t("games.arrowescape.medium") || "Medium";
    return               t("games.arrowescape.hard")          || "Hard";
  };

  const bestForDiff = game.stats.bestMoves[game.difficulty];

  // Prevent page scroll on arrow keys while playing
  useEffect(() => {
    const prevent = (e: KeyboardEvent) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", prevent, { passive: false });
    return () => window.removeEventListener("keydown", prevent);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-rose-100 dark:from-orange-950 dark:via-red-950 dark:to-rose-950 p-4 sm:p-8">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-orange-700 dark:text-orange-300/70 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors"
        >
          ← {t("common.back") || "Back"}
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/icons/arrow-escape.png"
            alt="Arrow Escape"
            className="w-14 h-14 mx-auto object-contain mb-2"
          />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {t("games.arrowescape.title") || "Arrow Escape"}
          </h1>
          <p className="text-orange-700 dark:text-orange-300/70 text-sm">
            {t("games.arrowescape.subtitle") || "Navigate arrows to reach the exit — avoid enemies!"}
          </p>
        </div>

        {/* Mode Toggle + Wallet */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <ModeToggle mode={game.mode} onModeChange={game.switchMode} />
          {game.mode === "onchain" && <WalletConnect />}
        </div>

        {/* Difficulty Selector */}
        <div className="flex gap-2 justify-center mb-5">
          {difficulties.map(d => (
            <button
              key={d}
              onClick={() => {
                game.changeDifficulty(d);
                if (game.status === "idle") {
                  // Just change difficulty, don't start
                }
              }}
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
        <div className="flex gap-6 justify-center mb-5 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{game.moves}</div>
            <div className="text-xs text-orange-700 dark:text-orange-300/60 uppercase tracking-wider">
              {t("games.arrowescape.moves") || "Moves"}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{game.level}</div>
            <div className="text-xs text-orange-700 dark:text-orange-300/60 uppercase tracking-wider">
              {t("games.arrowescape.level") || "Level"}
            </div>
          </div>
          {bestForDiff !== null && (
            <div>
              <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{bestForDiff}</div>
              <div className="text-xs text-orange-700 dark:text-orange-300/60 uppercase tracking-wider">
                {t("games.arrowescape.bestLevel") || "Best"}
              </div>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="flex flex-col items-center mb-6">

          {/* Idle state — Start button */}
          {game.status === "idle" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="text-6xl">🏹</div>
              <button
                onClick={game.startGame}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg hover:from-orange-400 hover:to-red-500 transition-all shadow-lg"
              >
                Start Game
              </button>
            </div>
          )}

          {/* Processing */}
          {game.status === "processing" && (
            <div className="py-12 text-orange-600 dark:text-orange-300 text-center">
              <div className="text-4xl mb-3 animate-spin">⚙️</div>
              <p className="text-sm">Starting on blockchain…</p>
            </div>
          )}

          {/* Game Grid */}
          {(game.status === "playing" || game.status === "won" || game.status === "lost") && game.grid.length > 0 && (
            <div
              className="grid gap-0.5 p-2 bg-gray-900/80 rounded-xl border border-gray-700"
              style={{ gridTemplateColumns: `repeat(${game.gridSize}, 2.5rem)` }}
            >
              {game.grid.map((row, y) =>
                row.map((cell, x) => (
                  <GridCell
                    key={`${x}-${y}`}
                    cell={cell}
                    isPlayer={x === game.playerX && y === game.playerY}
                    isEnemy={game.enemies.some(e => e.x === x && e.y === y)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Directional Controls */}
        {game.status === "playing" && (
          <div className="grid grid-cols-3 gap-1 w-36 mx-auto mb-6">
            <div />
            <DirButton label="↑" onClick={() => game.move("up")} />
            <div />
            <DirButton label="←" onClick={() => game.move("left")} />
            <button className="w-11 h-11 opacity-0" disabled />
            <DirButton label="→" onClick={() => game.move("right")} />
            <div />
            <DirButton label="↓" onClick={() => game.move("down")} />
            <div />
          </div>
        )}

        {/* Action Buttons */}
        {game.status !== "idle" && game.status !== "processing" && (
          <div className="flex gap-3 justify-center mb-8">
            <button
              onClick={game.playAgain}
              className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white border border-gray-300 dark:border-white/20 hover:bg-gray-300 dark:hover:bg-white/20 transition-all text-sm"
            >
              {t("games.arrowescape.playAgain") || "Try Again"}
            </button>
            <button
              onClick={() => game.newGame()}
              className="px-5 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-500 transition-all text-sm font-semibold"
            >
              {t("games.arrowescape.newGame") || "New Game"}
            </button>
          </div>
        )}

        {/* How to Play */}
        <div className="bg-white/70 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-5 mb-6">
          <h2 className="text-gray-900 dark:text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.arrowescape.howToPlay") || "How to Play"}
          </h2>
          <ol className="space-y-1.5">
            {(["rule1", "rule2", "rule3", "rule4"] as const).map((key, i) => (
              <li key={key} className="flex gap-2 text-sm text-gray-600 dark:text-orange-200/80">
                <span className="text-orange-600 dark:text-orange-400 font-bold flex-shrink-0">{i + 1}.</span>
                {t(`games.arrowescape.${key}`) || ""}
              </li>
            ))}
          </ol>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Games",  value: game.stats.games },
            { label: "Wins",   value: game.stats.wins },
            { label: "Best",   value: bestForDiff ?? "—" },
          ].map(s => (
            <div
              key={s.label}
              className="bg-white/70 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-3 text-center"
            >
              <div className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-orange-700 dark:text-orange-300/60">{s.label}</div>
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
              className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 text-xs underline"
            >
              {t("games.arrowescape.viewOnExplorer") || `View on ${explorerName} →`}
            </a>
          </div>
        )}

      </div>

      {/* WIN OVERLAY */}
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
              className="bg-gradient-to-br from-white to-orange-50 dark:from-orange-900 dark:to-red-900 border border-orange-200 dark:border-orange-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t("games.arrowescape.win") || "Escaped! You reached the exit!"}
              </h2>

              <div className="flex gap-6 justify-center my-4">
                <div>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-300">{game.moves}</div>
                  <div className="text-xs text-gray-500 dark:text-orange-300/60 uppercase">
                    {t("games.arrowescape.moves") || "Moves"}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-300">{game.level}</div>
                  <div className="text-xs text-gray-500 dark:text-orange-300/60 uppercase">
                    {t("games.arrowescape.level") || "Level"}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={game.playAgain}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white border border-gray-300 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 transition-all font-medium"
                >
                  {t("games.arrowescape.playAgain") || "Try Again"}
                </button>
                <button
                  onClick={() => game.newGame()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:from-orange-400 hover:to-red-500 transition-all"
                >
                  {t("games.arrowescape.newGame") || "New Game"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOST OVERLAY */}
      <AnimatePresence>
        {game.status === "lost" && (
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
              className="bg-gradient-to-br from-white to-red-50 dark:from-red-900 dark:to-gray-900 border border-red-200 dark:border-red-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-5xl mb-3">💀</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t("games.arrowescape.lost") || "Caught! An enemy got you."}
              </h2>
              <p className="text-sm text-gray-500 dark:text-red-200/60 mb-4">
                {game.moves} {t("games.arrowescape.moves") || "moves"} — Level {game.level}
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={game.playAgain}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:from-orange-400 hover:to-red-500 transition-all"
                >
                  {t("games.arrowescape.playAgain") || "Try Again"}
                </button>
                <button
                  onClick={() => game.newGame()}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white border border-gray-300 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 transition-all font-medium"
                >
                  {t("games.arrowescape.newGame") || "New Game"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
