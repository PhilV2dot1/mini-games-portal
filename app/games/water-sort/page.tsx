"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { useWaterSort, CRYPTOS, Tube, Difficulty, PourAnim } from "@/hooks/useWaterSort";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getExplorerAddressUrl, getExplorerName } from "@/lib/contracts/addresses";
import { useAccount } from "wagmi";

// ========================================
// TUBE SVG — éprouvette avec reflets de verre
// ========================================
// Dimensions internes SVG
const TW = 60;   // largeur totale
const TH = 200;  // hauteur totale
const RX = 12;   // rayon coins
const PAD = 6;   // épaisseur de la paroi
const NECK_Y = 28; // hauteur du col ouvert
const SEG_H = (TH - NECK_Y - PAD) / 4; // hauteur d'un segment (fond = PAD)
const CDN_ICONS = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/";

// SVG content for a tube — reused in TubeDisplay and AnimatingTube
function TubeSVGContent({
  tube,
  index,
  isSelected,
}: {
  tube: Tube;
  index: number;
  isSelected: boolean;
}) {
  const innerX = PAD;
  const innerW = TW - PAD * 2;
  const innerTop = NECK_Y;
  const innerH = TH - NECK_Y - PAD;
  const slotY = (slotIdx: number) => innerTop + innerH - (slotIdx + 1) * SEG_H;
  const clipId = `tube-clip-${index}`;

  return (
    <svg
      width={TW}
      height={TH + 10}
      viewBox={`0 0 ${TW} ${TH + 10}`}
      overflow="visible"
    >
      <defs>
        <clipPath id={clipId}>
          <rect
            x={innerX} y={innerTop}
            width={innerW} height={innerH}
            rx={RX - PAD} ry={RX - PAD}
          />
        </clipPath>
        <linearGradient id={`shine-${index}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="white" stopOpacity="0.18" />
          <stop offset="35%"  stopColor="white" stopOpacity="0.06" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`seg-top-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.35" />
          <stop offset="40%"  stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="black" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* Ombre portée sous le tube */}
      <ellipse cx={TW / 2} cy={TH + 8} rx={TW * 0.38} ry={4} fill="rgba(0,0,0,0.20)" />

      {/* Corps extérieur de l'éprouvette (verre) */}
      <rect
        x={0} y={NECK_Y - 8}
        width={TW} height={TH - NECK_Y + 8 + PAD}
        rx={RX} ry={RX}
        fill="rgba(200,230,255,0.15)"
        stroke={isSelected ? "#facc15" : "rgba(100,160,220,0.70)"}
        strokeWidth={isSelected ? 2.5 : 1.8}
      />

      {/* Segments de liquide (clippés dans l'intérieur) */}
      <g clipPath={`url(#${clipId})`}>
        <rect x={innerX} y={innerTop} width={innerW} height={innerH}
          fill="rgba(255,255,255,0.04)" />

        {Array.from({ length: 4 }, (_, slotIdx) => {
          const seg = tube[slotIdx];
          const crypto = seg ? CRYPTOS.find(c => c.id === seg) : null;
          const y = slotY(slotIdx);
          const isTopSeg = slotIdx === tube.length - 1 && !!seg;

          return (
            <g key={slotIdx}>
              {crypto && (
                <>
                  <rect
                    x={innerX} y={y}
                    width={innerW} height={SEG_H}
                    fill={crypto.color}
                  />
                  {isTopSeg && (
                    <rect
                      x={innerX} y={y}
                      width={innerW} height={SEG_H * 0.38}
                      fill={`url(#seg-top-${index})`}
                    />
                  )}
                  {isTopSeg && (
                    <path
                      d={`M${innerX},${y}
                          q${innerW * 0.25},-5 ${innerW * 0.5},0
                          q${innerW * 0.25},5  ${innerW * 0.5},0`}
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="1.5"
                    />
                  )}
                  {slotIdx > 0 && tube[slotIdx - 1] && (
                    <line
                      x1={innerX} y1={y + SEG_H}
                      x2={innerX + innerW} y2={y + SEG_H}
                      stroke="rgba(0,0,0,0.2)" strokeWidth="1"
                    />
                  )}
                </>
              )}
            </g>
          );
        })}

        <rect
          x={innerX} y={innerTop}
          width={innerW * 0.28} height={innerH}
          fill={`url(#shine-${index})`}
        />
      </g>

      {/* Parois de verre (devant le liquide) */}
      <rect x={0} y={NECK_Y - 8} width={PAD} height={TH - NECK_Y + 8}
        rx={2} fill="rgba(100,160,220,0.20)" />
      <rect x={TW - PAD} y={NECK_Y - 8} width={PAD} height={TH - NECK_Y + 8}
        rx={2} fill="rgba(100,160,220,0.14)" />
      <rect x={0} y={TH - PAD} width={TW} height={PAD + 10}
        rx={RX} fill="rgba(100,160,220,0.18)" />

      <rect
        x={PAD + 2} y={NECK_Y}
        width={3} height={TH - NECK_Y - PAD - 10}
        rx={1.5}
        fill="rgba(255,255,255,0.22)"
      />

      {/* Col / ouverture du tube */}
      <rect x={PAD} y={0} width={innerW} height={NECK_Y + 2}
        rx={3}
        fill="rgba(200,230,255,0.15)"
        stroke={isSelected ? "#facc15" : "rgba(100,160,220,0.65)"}
        strokeWidth={isSelected ? 2 : 1.2}
      />

      {/* Logos crypto */}
      {Array.from({ length: 4 }, (_, slotIdx) => {
        const seg = tube[slotIdx];
        const crypto = seg ? CRYPTOS.find(c => c.id === seg) : null;
        if (!crypto) return null;
        const y = slotY(slotIdx);
        const cx = TW / 2;
        const cy = y + SEG_H / 2;
        return (
          <image
            key={slotIdx}
            href={`${CDN_ICONS}${crypto.ticker}.svg`}
            x={cx - 11} y={cy - 11}
            width={22} height={22}
          />
        );
      })}
    </svg>
  );
}

interface TubeDisplayProps {
  tube: Tube;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
  tubeRef?: React.Ref<HTMLButtonElement>;
  invisible?: boolean;
}

function TubeDisplay({ tube, index, isSelected, onClick, disabled, tubeRef, invisible }: TubeDisplayProps) {
  return (
    <button
      ref={tubeRef}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Tube ${index + 1}`}
      className={[
        "relative transition-all duration-200 focus:outline-none",
        isSelected ? "scale-110 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" : "hover:scale-105",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
      style={{ width: TW, height: TH + 10, opacity: invisible ? 0 : 1 }}
    >
      <TubeSVGContent tube={tube} index={index} isSelected={isSelected} />
    </button>
  );
}

// ========================================
// ANIMATING TUBE — overlay that performs the pour animation
// ========================================

interface AnimatingTubeProps {
  pourAnim: PourAnim;
  tubes: Tube[];
  tubeRefs: React.RefObject<(HTMLButtonElement | null)[]>;
}

function AnimatingTube({ pourAnim, tubes, tubeRefs }: AnimatingTubeProps) {
  const [scope, animate] = useAnimate();
  const [streamVisible, setStreamVisible] = useState(false);
  const [streamCoords, setStreamCoords] = useState<{
    x1: number; y1: number; x2: number; y2: number; pathLen: number;
  } | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const fromEl = tubeRefs.current?.[pourAnim.fromIdx];
    const toEl = tubeRefs.current?.[pourAnim.toIdx];
    if (!fromEl || !toEl || !scope.current) {
      pourAnim.onComplete();
      return;
    }

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    // Delta X: how far the animated tube must travel horizontally
    const deltaX = toRect.left - fromRect.left;
    const isLeft = deltaX < 0;

    // Liquid stream coordinates (viewport-fixed)
    // Stream starts at the top-center of the tube (after it's moved + tilted)
    // and ends at the top-center of the destination tube
    const streamX1 = toRect.left + toRect.width / 2;
    const streamY1 = fromRect.top + 10; // near top of tube (col)
    const streamX2 = toRect.left + toRect.width / 2;
    const streamY2 = toRect.top + NECK_Y + 10;
    const dy = streamY2 - streamY1;
    const approxLen = Math.abs(dy) + 20;

    setStreamCoords({ x1: streamX1, y1: streamY1, x2: streamX2, y2: streamY2, pathLen: approxLen });

    async function runAnimation() {
      try {
        // Phase 1: lift (150ms)
        await animate(scope.current, { y: -40 }, { duration: 0.15, ease: "easeOut" });

        // Phase 2: move horizontally (250ms)
        await animate(scope.current, { x: deltaX }, { duration: 0.25, ease: "easeInOut" });

        // Phase 3: tilt (200ms)
        const tiltAngle = isLeft ? -125 : 125;
        await animate(scope.current, { rotate: tiltAngle }, { duration: 0.2, ease: "easeInOut" });

        // Show liquid stream for 350ms
        setStreamVisible(true);
        await new Promise(r => setTimeout(r, 350));
        setStreamVisible(false);

        // Phase 4: un-tilt (150ms)
        await animate(scope.current, { rotate: 0 }, { duration: 0.15, ease: "easeInOut" });

        // Phase 5: move back (200ms)
        await animate(scope.current, { x: 0 }, { duration: 0.2, ease: "easeInOut" });

        // Phase 6: lower (150ms)
        await animate(scope.current, { y: 0 }, { duration: 0.15, ease: "easeOut" });

        // Apply game state
        pourAnim.onComplete();
      } catch {
        pourAnim.onComplete();
      }
    }

    runAnimation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fromEl = tubeRefs.current?.[pourAnim.fromIdx];
  if (!fromEl) return null;

  const fromRect = fromEl.getBoundingClientRect();
  const tube = tubes[pourAnim.fromIdx];

  return (
    <>
      {/* Animated tube clone — fixed position, tracks original tube location */}
      <div
        ref={scope}
        style={{
          position: "fixed",
          top: fromRect.top,
          left: fromRect.left,
          width: TW,
          height: TH + 10,
          pointerEvents: "none",
          zIndex: 100,
          transformOrigin: "50% 15px", // rotate around the neck/top
        }}
      >
        <TubeSVGContent
          tube={tube}
          index={pourAnim.fromIdx + 1000} // unique clip/gradient ids to avoid conflicts
          isSelected={true}
        />
      </div>

      {/* Liquid stream SVG — fixed overlay */}
      {streamVisible && streamCoords && (
        <svg
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            zIndex: 99,
            overflow: "visible",
          }}
        >
          <LiquidStream
            x1={streamCoords.x1}
            y1={streamCoords.y1}
            x2={streamCoords.x2}
            y2={streamCoords.y2}
            pathLen={streamCoords.pathLen}
            color={pourAnim.color}
            ticker={pourAnim.ticker}
          />
        </svg>
      )}
    </>
  );
}

// ========================================
// LIQUID STREAM SVG — animated vertical stream
// ========================================

interface LiquidStreamProps {
  x1: number; y1: number;
  x2: number; y2: number;
  pathLen: number;
  color: string;
  ticker: string;
}

function LiquidStream({ x1, y1, x2, y2, pathLen, color, ticker }: LiquidStreamProps) {
  // Slight curve: control point offset horizontally
  const cx = (x1 + x2) / 2 + (x2 - x1) * 0.1;
  const cy = (y1 + y2) / 2;
  const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  const animId = `stream-${Math.round(x1)}-${Math.round(y1)}`;

  return (
    <g>
      <defs>
        <style>{`
          @keyframes ${animId}-draw {
            from { stroke-dashoffset: ${pathLen}; opacity: 0.9; }
            to   { stroke-dashoffset: 0; opacity: 0.9; }
          }
          @keyframes ${animId}-drop {
            0%   { offset-distance: 0%; opacity: 0.9; }
            100% { offset-distance: 100%; opacity: 0.5; }
          }
        `}</style>
      </defs>

      {/* Main stream line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        strokeDasharray={pathLen}
        strokeDashoffset={pathLen}
        style={{
          animation: `${animId}-draw 280ms ease-out forwards`,
          filter: `drop-shadow(0 0 4px ${color}88)`,
        }}
      />

      {/* Thin highlight on stream */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={pathLen}
        strokeDashoffset={pathLen}
        style={{
          animation: `${animId}-draw 280ms ease-out forwards`,
        }}
      />

      {/* Travelling drop */}
      <circle r={7} fill={color} opacity={0.95} style={{ filter: `drop-shadow(0 0 3px ${color})` }}>
        <animateMotion dur="280ms" fill="freeze" path={pathD} />
      </circle>

      {/* Crypto logo on the drop */}
      <image
        href={`${CDN_ICONS}${ticker}.svg`}
        width={13}
        height={13}
      >
        <animateMotion
          dur="280ms"
          fill="freeze"
          path={pathD}
          keyPoints="0;1"
          keyTimes="0;1"
          calcMode="linear"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          values="-6.5,-6.5;-6.5,-6.5"
          keyTimes="0;1"
          dur="280ms"
          fill="freeze"
          additive="sum"
        />
      </image>
    </g>
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

  const tubeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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
        <div className="text-center mb-6">
          <img
            src="/icons/watersort.png"
            alt="Water Sort Crypto"
            className="w-14 h-14 mx-auto object-contain mb-2"
          />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {t("games.watersort.title") || "Water Sort Crypto"}
          </h1>
          <p className="text-cyan-700 dark:text-cyan-300/70 text-sm">
            {t("games.watersort.subtitle") || "Sort the crypto liquids — pour and match colors!"}
          </p>
        </div>

        {/* Mode Toggle + Wallet */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <ModeToggle
            mode={game.mode}
            onModeChange={game.setGameMode}
          />
          {game.mode === "onchain" && <WalletConnect />}
        </div>

        {/* ── IDLE: difficulty picker + Start button ── */}
        {game.status === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 mb-6 text-center"
          >
            <p className="text-sm text-gray-500 dark:text-cyan-300/60 uppercase tracking-wider mb-4 font-semibold">
              {t("games.watersort.chooseDifficulty") || "Choose Difficulty"}
            </p>
            <div className="flex gap-3 justify-center mb-6">
              {difficulties.map(d => (
                <button
                  key={d}
                  onClick={() => game.newGame(d)}
                  className={[
                    "px-5 py-2 rounded-full text-sm font-bold text-white transition-all",
                    `bg-gradient-to-r ${DIFFICULTY_COLORS[d]}`,
                    game.difficulty === d
                      ? "ring-2 ring-white scale-110 shadow-lg"
                      : "opacity-55 hover:opacity-90 hover:scale-105",
                  ].join(" ")}
                >
                  {diffLabel(d)}
                </button>
              ))}
            </div>

            {bestForDiff > 0 && (
              <p className="text-xs text-yellow-500 dark:text-yellow-400 mb-4">
                🏆 {t("games.watersort.bestMoves") || "Best"}: {bestForDiff} {t("games.watersort.moves") || "moves"}
              </p>
            )}

            <button
              onClick={game.startGame}
              className="px-10 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg shadow-lg transition-all active:scale-95"
            >
              {t("games.watersort.startGame") || "▶ Start Game"}
            </button>
          </motion.div>
        )}

        {/* ── PLAYING / WON: tubes + controls ── */}
        {game.status !== "idle" && (
          <>
            {/* Stats Row */}
            <div className="flex gap-6 justify-center mb-6 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{game.moves}</div>
                <div className="text-xs text-cyan-700 dark:text-cyan-300/60 uppercase tracking-wider">
                  {t("games.watersort.moves") || "Moves"}
                </div>
              </div>
              {bestForDiff > 0 && (
                <div>
                  <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{bestForDiff}</div>
                  <div className="text-xs text-cyan-700 dark:text-cyan-300/60 uppercase tracking-wider">
                    {t("games.watersort.bestMoves") || "Best"}
                  </div>
                </div>
              )}
            </div>

            {/* Tubes Grid */}
            <div ref={containerRef} className="relative flex flex-wrap gap-3 justify-center mb-8">
              {game.tubes.map((tube, idx) => (
                <TubeDisplay
                  key={idx}
                  tube={tube}
                  index={idx}
                  isSelected={game.selectedTube === idx}
                  onClick={() => game.selectTube(idx)}
                  disabled={game.status === "won" || game.status === "countdown"}
                  tubeRef={(el) => { tubeRefs.current[idx] = el; }}
                  invisible={game.pourAnim !== null && game.pourAnim.fromIdx === idx}
                />
              ))}

              {/* Countdown overlay */}
              <AnimatePresence>
                {game.status === "countdown" && game.countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm z-10">
                    {game.countdown > 0 ? (
                      <motion.div
                        key={game.countdown}
                        initial={{ scale: 2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="text-9xl font-black text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.9)]"
                      >
                        {game.countdown}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="go"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-7xl font-black text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.9)]"
                      >
                        GO!
                      </motion.div>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Reset / New Game buttons */}
            <div className="flex gap-3 justify-center mb-8">
              <button
                onClick={game.resetGame}
                className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white border border-gray-300 dark:border-white/20 hover:bg-gray-300 dark:hover:bg-white/20 transition-all text-sm"
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
          </>
        )}

        {/* How to Play */}
        <div className="bg-white/70 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-5 mb-6">
          <h2 className="text-gray-900 dark:text-white font-bold mb-3 text-sm uppercase tracking-wider">
            {t("games.watersort.howToPlay") || "How to Play"}
          </h2>
          <ol className="space-y-1.5">
            {(["rule1", "rule2", "rule3", "rule4"] as const).map((key, i) => (
              <li key={key} className="flex gap-2 text-sm text-gray-600 dark:text-cyan-200/80">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex-shrink-0">{i + 1}.</span>
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
              className="bg-white/70 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-3 text-center"
            >
              <div className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-cyan-700 dark:text-cyan-300/60">{s.label}</div>
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
              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 text-xs underline"
            >
              {t("games.watersort.viewOnExplorer") || `View on ${explorerName} →`}
            </a>
          </div>
        )}

      </div>

      {/* Pour Animation Overlay (outside the max-w container so it's truly fixed) */}
      <AnimatePresence>
        {game.pourAnim && (
          <AnimatingTube
            key={`${game.pourAnim.fromIdx}-${game.pourAnim.toIdx}-${Date.now()}`}
            pourAnim={game.pourAnim}
            tubes={game.tubes}
            tubeRefs={tubeRefs}
          />
        )}
      </AnimatePresence>

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
              className="bg-gradient-to-br from-white to-cyan-50 dark:from-cyan-900 dark:to-blue-900 border border-cyan-200 dark:border-cyan-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t("games.watersort.win") || "Sorted! All cryptos matched!"}
              </h2>

              <div className="flex gap-6 justify-center my-4">
                <div>
                  <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-300">{game.moves}</div>
                  <div className="text-xs text-gray-500 dark:text-cyan-300/60 uppercase">
                    {t("games.watersort.moves") || "Moves"}
                  </div>
                </div>
                {bestForDiff > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">{bestForDiff}</div>
                    <div className="text-xs text-gray-500 dark:text-cyan-300/60 uppercase">
                      {t("games.watersort.bestMoves") || "Best"}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={game.resetGame}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white border border-gray-300 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 transition-all font-medium"
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
