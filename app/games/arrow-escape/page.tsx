"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useArrowEscape,
  getArrowCells,
  type Arrow,
  type Direction,
} from "@/hooks/useArrowEscape";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  getExplorerAddressUrl,
  getExplorerName,
  getContractAddress,
} from "@/lib/contracts/addresses";
import { useAccount } from "wagmi";

// ========================================
// CONSTANTS
// ========================================

// Cell size per grid size — ensures the board fits on mobile (~380px max)
const GAP = 3;
// We use a fixed cell size per gridSize for consistent SSR:
const CELL_SIZE_BY_GRID: Record<number, number> = {
  5: 60,
  6: 52,
  7: 44,
  8: 38,
  9: 34,
};

const DIR_CHAR: Record<Direction, string> = {
  up: "↑", down: "↓", left: "←", right: "→",
};

// ========================================
// ARROW HEAD triangle
// ========================================

function ArrowHead({ direction, color }: { direction: Direction; color: string }) {
  const s = 9;
  const base: React.CSSProperties = { position: "absolute", width: 0, height: 0, zIndex: 20 };
  switch (direction) {
    case "right": return <div style={{ ...base, right: -s, top: "50%", transform: "translateY(-50%)",
      borderTop: `${s}px solid transparent`, borderBottom: `${s}px solid transparent`, borderLeft: `${s}px solid ${color}` }} />;
    case "left":  return <div style={{ ...base, left: -s, top: "50%", transform: "translateY(-50%)",
      borderTop: `${s}px solid transparent`, borderBottom: `${s}px solid transparent`, borderRight: `${s}px solid ${color}` }} />;
    case "down":  return <div style={{ ...base, bottom: -s, left: "50%", transform: "translateX(-50%)",
      borderLeft: `${s}px solid transparent`, borderRight: `${s}px solid transparent`, borderTop: `${s}px solid ${color}` }} />;
    case "up":    return <div style={{ ...base, top: -s, left: "50%", transform: "translateX(-50%)",
      borderLeft: `${s}px solid transparent`, borderRight: `${s}px solid transparent`, borderBottom: `${s}px solid ${color}` }} />;
  }
}

// ========================================
// ARROW PIECE
// ========================================

interface ArrowPieceProps {
  arrow: Arrow;
  gridSize: number;
  cellSize: number;
  isSelected: boolean;
  isHint: boolean;
  isBlocked: boolean;
  isExiting: boolean;
  onTap: () => void;
}

function ArrowPiece({ arrow, gridSize, cellSize, isSelected, isHint, isBlocked, isExiting, onTap }: ArrowPieceProps) {
  const cells = getArrowCells(arrow.direction, arrow.headRow, arrow.headCol, arrow.length);
  const isHoriz = arrow.direction === "left" || arrow.direction === "right";

  const minRow = Math.min(...cells.map(([r]) => r));
  const minCol = Math.min(...cells.map(([, c]) => c));
  const maxRow = Math.max(...cells.map(([r]) => r));
  const maxCol = Math.max(...cells.map(([, c]) => c));

  const left   = minCol * (cellSize + GAP);
  const top    = minRow * (cellSize + GAP);
  const width  = (maxCol - minCol + 1) * cellSize + (maxCol - minCol) * GAP;
  const height = (maxRow - minRow + 1) * cellSize + (maxRow - minRow) * GAP;

  let exitX = 0, exitY = 0;
  if (isExiting) {
    const totalGrid = gridSize * cellSize + (gridSize - 1) * GAP + 32;
    switch (arrow.direction) {
      case "right": exitX =  totalGrid; break;
      case "left":  exitX = -totalGrid; break;
      case "down":  exitY =  totalGrid; break;
      case "up":    exitY = -totalGrid; break;
    }
  }

  const boxShadow = isSelected
    ? `0 0 0 3px white, 0 4px 12px rgba(0,0,0,0.5)`
    : isHint
    ? `0 0 0 3px #FCFF52, 0 4px 12px rgba(0,0,0,0.5)`
    : `0 2px 8px rgba(0,0,0,0.4)`;

  return (
    <motion.div
      key={arrow.id}
      onClick={onTap}
      className="absolute cursor-pointer select-none"
      style={{ left, top, width, height }}
      animate={
        isBlocked
          ? { x: [0, -6, 6, -4, 4, 0] }
          : isExiting
          ? { x: exitX, y: exitY, opacity: 0 }
          : { x: 0, y: 0, opacity: 1 }
      }
      transition={
        isBlocked
          ? { duration: 0.4 }
          : isExiting
          ? { duration: 0.38, ease: "easeIn" }
          : { type: "spring", stiffness: 350, damping: 28, duration: 0.18 }
      }
      whileHover={{ scale: 1.04, transition: { duration: 0.1 } }}
      whileTap={{ scale: 0.96 }}
    >
      <div
        className="w-full h-full relative flex items-center justify-center rounded-xl overflow-visible"
        style={{
          background: arrow.color,
          boxShadow,
          filter: isHint ? "brightness(1.15)" : undefined,
        }}
      >
        <span
          className="text-white font-black select-none z-10 drop-shadow"
          style={{ fontSize: Math.min(26, (isHoriz ? height : width) * 0.52) }}
        >
          {DIR_CHAR[arrow.direction]}
        </span>
        <ArrowHead direction={arrow.direction} color={arrow.color} />
      </div>

      {isBlocked && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-red-500/60 pointer-events-none"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        />
      )}
    </motion.div>
  );
}

// ========================================
// STARS
// ========================================

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1 justify-center text-2xl">
      {[1, 2, 3].map(i => (
        <span key={i} className={i <= count ? "opacity-100" : "opacity-20 grayscale"}>⭐</span>
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
  const explorerUrl = contractAddress ? getExplorerAddressUrl(chain?.id, contractAddress) : null;
  const explorerName = getExplorerName(chain?.id);

  const CELL_SIZE = CELL_SIZE_BY_GRID[game.gridSize] ?? 40;
  const gridPixels = game.gridSize * CELL_SIZE + (game.gridSize - 1) * GAP;
  const activeArrows = game.arrows.filter(a => !a.isExited);
  const exitedCount  = game.arrows.length - activeArrows.length;

  // Keyboard: arrow keys move selected
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!game.selectedId) return;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
        game.moveSelected(1);
      }
      if (e.key === "Escape") game.selectArrow(game.selectedId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [game]);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 sm:p-6">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          ← {t("common.back") || "Back"}
        </Link>

        {/* Header */}
        <div className="text-center mb-5">
          <img src="/icons/arrow-escape.png" alt="Arrow Escape" className="w-14 h-14 mx-auto object-contain mb-2" />
          <h1 className="text-3xl font-bold text-white mb-1">
            {t("games.arrowescape.title") || "Arrow Escape"}
          </h1>
          <p className="text-[#FCFF52] text-sm font-medium">
            {t("games.arrowescape.subtitle") || "Slide the arrows out — clear the grid!"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <ModeToggle mode={game.mode} onModeChange={game.setGameMode} />
          {game.mode === "onchain" && <WalletConnect />}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="text-sm font-semibold text-gray-300">
            {t("games.arrowescape.level") || "Level"}{" "}
            <span className="text-[#FCFF52] font-bold text-base">{game.level}</span>
            <span className="text-gray-500">/5</span>
          </div>
          <div className="text-sm font-semibold text-gray-300">
            <span className="text-white font-bold">{exitedCount}</span>
            <span className="text-gray-500">/{game.arrows.length} out</span>
          </div>
          <div className="text-sm font-semibold text-gray-300">
            {t("games.arrowescape.moves") || "Moves"}{" "}
            <span className="text-white font-bold">{game.moves}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-1.5 mb-5 overflow-hidden">
          <motion.div
            className="h-full bg-[#FCFF52] rounded-full"
            animate={{ width: `${game.arrows.length > 0 ? (exitedCount / game.arrows.length) * 100 : 0}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />
        </div>

        {/* Grid */}
        <div className="flex justify-center mb-5">
          <div
            className="relative rounded-2xl bg-gray-900/80 border border-white/10"
            style={{ width: gridPixels + 32, height: gridPixels + 32, padding: 16 }}
          >
            {/* Background cells */}
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${game.gridSize}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${game.gridSize}, ${CELL_SIZE}px)`,
              gap: `${GAP}px`,
            }}>
              {Array.from({ length: game.gridSize * game.gridSize }).map((_, i) => (
                <div key={i} className="rounded-md border border-white/[0.06] bg-white/[0.03]"
                  style={{ width: CELL_SIZE, height: CELL_SIZE }} />
              ))}
            </div>

            {/* Arrow pieces */}
            <div className="absolute inset-4 overflow-visible">
              {game.arrows.map(arrow => {
                if (arrow.isExited && game.exitingId !== arrow.id) return null;
                return (
                  <ArrowPiece
                    key={arrow.id}
                    arrow={arrow}
                    gridSize={game.gridSize}
                    cellSize={CELL_SIZE}
                    isSelected={game.selectedId === arrow.id}
                    isHint={game.hintId === arrow.id}
                    isBlocked={game.blockedId === arrow.id}
                    isExiting={game.exitingId === arrow.id}
                    onTap={() => game.tapArrow(arrow.id)}
                  />
                );
              })}
            </div>

            {/* Edge indicators */}
            {Array.from({ length: game.gridSize }).map((_, i) => {
              const pos = i * (CELL_SIZE + GAP) + CELL_SIZE / 2;
              return (
                <span key={i}>
                  <span className="absolute text-gray-600 text-[9px] font-bold" style={{ top: 2, left: 16 + pos - 4 }}>↑</span>
                  <span className="absolute text-gray-600 text-[9px] font-bold" style={{ bottom: 2, left: 16 + pos - 4 }}>↓</span>
                  <span className="absolute text-gray-600 text-[9px] font-bold" style={{ left: 2, top: 16 + pos - 6 }}>←</span>
                  <span className="absolute text-gray-600 text-[9px] font-bold" style={{ right: 2, top: 16 + pos - 6 }}>→</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-6">
          <button
            onClick={game.undo}
            disabled={game.history.length === 0 || game.status !== "playing"}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all disabled:opacity-30"
          >
            ↩ {t("games.arrowescape.undo") || "Undo"}
          </button>
          <button
            onClick={game.showHint}
            disabled={game.hintsLeft === 0 || game.status !== "playing"}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all disabled:opacity-30"
          >
            💡 {t("games.arrowescape.hint") || "Hint"}{" "}
            <span className="text-[#FCFF52]">({game.hintsLeft})</span>
          </button>
          <button
            onClick={game.restartLevel}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all"
          >
            🔄 {t("games.arrowescape.restart") || "Restart"}
          </button>
        </div>

        {/* How to Play */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-5">
          <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.arrowescape.howToPlay") || "How to Play"}
          </h2>
          <ol className="space-y-2">
            {[
              t("games.arrowescape.rule1") || "Tap an arrow to slide it in its direction.",
              t("games.arrowescape.rule2") || "Arrows move as far as possible until blocked.",
              t("games.arrowescape.rule3") || "When the path to the edge is clear, the arrow exits!",
              t("games.arrowescape.rule4") || "Clear all arrows. Fewer moves = more stars!",
            ].map((rule, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-[#FCFF52] font-bold flex-shrink-0">{i + 1}.</span>
                {rule}
              </li>
            ))}
          </ol>
        </div>

        {/* Contract Link */}
        {game.mode === "onchain" && (
          <div className="text-center mb-6 text-xs">
            {explorerUrl ? (
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                className="text-[#FCFF52] hover:text-yellow-300 underline">
                {`View on ${explorerName} →`}
              </a>
            ) : (
              <span className="text-gray-600">{t("chain.comingSoon") || "On-chain coming soon"}</span>
            )}
          </div>
        )}

      </div>

      {/* WIN OVERLAY */}
      <AnimatePresence>
        {game.status === "won" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gray-900 border border-[#FCFF52]/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("games.arrowescape.win") || "Level Cleared!"}
              </h2>
              <Stars count={game.stars} />
              <div className="flex gap-8 justify-center my-5">
                <div>
                  <div className="text-3xl font-bold text-[#FCFF52]">{game.score}</div>
                  <div className="text-xs text-gray-400 uppercase mt-1">Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{game.moves}</div>
                  <div className="text-xs text-gray-400 uppercase mt-1">
                    {t("games.arrowescape.moves") || "Moves"}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={game.restartLevel}
                  className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all text-sm font-medium"
                >
                  🔄 {t("games.arrowescape.restart") || "Restart"}
                </button>
                <button
                  onClick={game.nextLevel}
                  className="px-5 py-2.5 rounded-xl bg-[#FCFF52] text-gray-900 font-bold hover:bg-yellow-300 transition-all text-sm"
                >
                  {game.level < 5
                    ? (t("games.arrowescape.nextLevel") || "Next Level →")
                    : (t("games.arrowescape.playAgain") || "Play Again")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
