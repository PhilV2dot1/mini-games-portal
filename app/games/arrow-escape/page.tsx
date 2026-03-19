"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useArrowEscape,
  type Direction,
  type Grid,
} from "@/hooks/useArrowEscape";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getExplorerAddressUrl, getExplorerName, getContractAddress } from "@/lib/contracts/addresses";
import { useAccount } from "wagmi";

// ========================================
// CONSTANTS
// ========================================

const ARROW_CHARS: Record<Direction, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

const ARROW_COLORS: Record<Direction, string> = {
  up:    "#3B82F6", // blue-500
  down:  "#22C55E", // green-500
  left:  "#EC4899", // pink-500
  right: "#F97316", // orange-500
};

// Exit delta in "cell units" — actual pixels = delta × cellSize
function getExitDelta(dir: Direction, row: number, col: number, rows: number, cols: number): { x: number; y: number } {
  switch (dir) {
    case "up":    return { x: 0, y: -(row + 1) };
    case "down":  return { x: 0, y: (rows - row) };
    case "left":  return { x: -(col + 1), y: 0 };
    case "right": return { x: (cols - col), y: 0 };
  }
}

// ========================================
// HEARTS
// ========================================

function LivesDisplay({ lives }: { lives: number }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          animate={i >= lives ? { scale: [1, 1.3, 0.8, 1] } : {}}
          className={`text-xl ${i < lives ? "opacity-100" : "opacity-20 grayscale"}`}
        >
          ❤️
        </motion.span>
      ))}
    </div>
  );
}

// ========================================
// MAIN PAGE
// ========================================

export default function ArrowEscapePage() {
  const game = useArrowEscape();
  const { t } = useLanguage();
  const { chain } = useAccount();

  const contractAddress = getContractAddress("arrowescape" as never, chain?.id);
  const explorerUrl = contractAddress
    ? getExplorerAddressUrl(chain?.id, contractAddress)
    : null;
  const explorerName = getExplorerName(chain?.id);

  // Responsive cell size
  const [cellSize, setCellSize] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth;
      const available = Math.min(w - 48, 360);
      const size = Math.max(40, Math.floor(available / game.cols));
      setCellSize(size);
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [game.cols]);

  const gap = 4;
  const gridW = game.cols * cellSize + (game.cols - 1) * gap;
  const gridH = game.rows * cellSize + (game.rows - 1) * gap;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 sm:p-6">
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
            src="/icons/arrow-escape.png"
            alt="Arrow Escape"
            className="w-14 h-14 mx-auto object-contain mb-2"
          />
          <h1 className="text-3xl font-bold text-white mb-1">
            {t("games.arrowescape.title") || "Arrow Escape"}
          </h1>
          <p className="text-[#FCFF52] text-sm font-medium">
            {t("games.arrowescape.subtitle") || "Tap arrows to slide them out — clear the grid!"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <ModeToggle mode={game.mode} onModeChange={game.setGameMode} />
          {game.mode === "onchain" && <WalletConnect />}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-5 px-2">
          <LivesDisplay lives={game.lives} />
          <div className="text-sm font-semibold text-gray-300">
            {t("games.arrowescape.level") || "Level"}{" "}
            <span className="text-[#FCFF52] font-bold text-base">{game.level}</span>
            <span className="text-gray-500">/10</span>
          </div>
          <div className="text-sm font-semibold text-gray-300">
            {t("games.arrowescape.score") || "Score"}{" "}
            <span className="text-white font-bold">{game.score}</span>
          </div>
          <div className="text-sm font-semibold text-gray-300">
            {t("games.arrowescape.arrows") || "Arrows"}{" "}
            <span className="text-white font-bold">{game.arrowsLeft}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="flex justify-center mb-6" ref={containerRef}>
          <div
            className="relative bg-gray-900/80 rounded-2xl p-3 border border-white/10"
            style={{ width: gridW + 24, height: gridH + 24 }}
          >
            {/* Grid cells */}
            <div
              className="relative"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${game.cols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${game.rows}, ${cellSize}px)`,
                gap: `${gap}px`,
              }}
            >
              {game.grid.map((row, r) =>
                row.map((cell, c) => {
                  const isExiting =
                    game.exitingCell !== null &&
                    game.exitingCell[0] === r &&
                    game.exitingCell[1] === c;
                  const isBlocked =
                    game.blockedCell !== null &&
                    game.blockedCell[0] === r &&
                    game.blockedCell[1] === c;
                  const isHint =
                    game.hintCell !== null &&
                    game.hintCell[0] === r &&
                    game.hintCell[1] === c;

                  if (cell === null) {
                    return (
                      <div
                        key={`${r}-${c}`}
                        className="rounded-lg border border-white/10 bg-white/5"
                        style={{ width: cellSize, height: cellSize }}
                      />
                    );
                  }

                  const exitDelta = isExiting
                    ? getExitDelta(cell.dir, r, c, game.rows, game.cols)
                    : { x: 0, y: 0 };

                  return (
                    <motion.div
                      key={cell.id}
                      onClick={() => game.tapCell(r, c)}
                      className={[
                        "rounded-lg flex items-center justify-center cursor-pointer select-none relative",
                        isHint ? "ring-4 ring-[#FCFF52]/80 animate-pulse" : "",
                      ].join(" ")}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: ARROW_COLORS[cell.dir],
                      }}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      animate={
                        isExiting
                          ? {
                              x: exitDelta.x * (cellSize + gap),
                              y: exitDelta.y * (cellSize + gap),
                              opacity: 0,
                              scale: 0.5,
                            }
                          : isBlocked
                          ? { x: [-5, 5, -5, 5, 0] }
                          : { x: 0, y: 0, opacity: 1, scale: 1 }
                      }
                      transition={
                        isExiting
                          ? { duration: 0.35, ease: "easeIn" }
                          : isBlocked
                          ? { duration: 0.4, type: "tween" }
                          : { duration: 0.1 }
                      }
                    >
                      {/* Red flash overlay when blocked */}
                      {isBlocked && (
                        <motion.div
                          className="absolute inset-0 rounded-lg bg-red-500"
                          initial={{ opacity: 0.6 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                      <span
                        className="text-white font-bold select-none z-10"
                        style={{ fontSize: Math.max(16, cellSize * 0.42) }}
                      >
                        {ARROW_CHARS[cell.dir]}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={game.showHint}
            disabled={game.status !== "playing"}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all disabled:opacity-40"
          >
            {t("games.arrowescape.hint") || "Hint 💡"}
          </button>
          <button
            onClick={game.restartLevel}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all"
          >
            {t("games.arrowescape.restart") || "Restart 🔄"}
          </button>
        </div>

        {/* How to Play */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-5">
          <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.arrowescape.howToPlay") || "How to Play"}
          </h2>
          <ol className="space-y-2">
            {(["rule1", "rule2", "rule3", "rule4"] as const).map((key, i) => (
              <li key={key} className="flex gap-2 text-sm text-gray-300">
                <span className="text-[#FCFF52] font-bold flex-shrink-0">{i + 1}.</span>
                {t(`games.arrowescape.${key}`) || ""}
              </li>
            ))}
          </ol>
        </div>

        {/* Color legend */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-5">
          <div className="flex flex-wrap gap-3 justify-center">
            {(["up", "down", "left", "right"] as Direction[]).map(dir => (
              <div key={dir} className="flex items-center gap-1.5 text-sm">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-base"
                  style={{ backgroundColor: ARROW_COLORS[dir] }}
                >
                  {ARROW_CHARS[dir]}
                </div>
                <span className="text-gray-400 capitalize">{dir}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Link */}
        {game.mode === "onchain" && explorerUrl && (
          <div className="text-center mb-4">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FCFF52] hover:text-yellow-300 text-xs underline"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gray-900 border border-[#FCFF52]/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {t("games.arrowescape.win") || "Level cleared!"}
              </h2>
              <p className="text-[#FCFF52] text-sm font-semibold mb-4">
                {t("games.arrowescape.level") || "Level"} {game.level} / 10
              </p>

              <div className="flex gap-6 justify-center my-4">
                <div>
                  <div className="text-3xl font-bold text-[#FCFF52]">{game.score}</div>
                  <div className="text-xs text-gray-400 uppercase">
                    {t("games.arrowescape.score") || "Score"}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white flex gap-0.5 justify-center">
                    {[0, 1, 2].map(i => (
                      <span key={i} className={i < game.lives ? "opacity-100" : "opacity-20"}>❤️</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 uppercase">Lives</div>
                </div>
              </div>

              <div className="flex gap-3 justify-center mt-5">
                <button
                  onClick={game.restartLevel}
                  className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all text-sm font-medium"
                >
                  {t("games.arrowescape.restart") || "Restart 🔄"}
                </button>
                <button
                  onClick={game.nextLevel}
                  className="px-5 py-2.5 rounded-xl bg-[#FCFF52] text-gray-900 font-bold hover:bg-yellow-300 transition-all text-sm"
                >
                  {game.level < 10
                    ? (t("games.arrowescape.nextLevel") || "Next Level →")
                    : (t("games.arrowescape.playAgain") || "Try Again")}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gray-900 border border-red-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-5xl mb-3">💔</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("games.arrowescape.lost") || "No lives left!"}
              </h2>
              <p className="text-sm text-gray-400 mb-5">
                {t("games.arrowescape.level") || "Level"} {game.level} — {t("games.arrowescape.score") || "Score"} {game.score}
              </p>

              <button
                onClick={game.restartLevel}
                className="px-6 py-2.5 rounded-xl bg-[#FCFF52] text-gray-900 font-bold hover:bg-yellow-300 transition-all"
              >
                {t("games.arrowescape.playAgain") || "Try Again"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
