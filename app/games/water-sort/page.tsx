"use client";

import Link from "next/link";
import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

interface TubeDisplayProps {
  tube: Tube;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
  tubeRef?: React.Ref<HTMLButtonElement>;
}

function TubeDisplay({ tube, index, isSelected, onClick, disabled, tubeRef }: TubeDisplayProps) {
  // Intérieur du tube
  const innerX = PAD;
  const innerW = TW - PAD * 2;
  const innerTop = NECK_Y;
  const innerH = TH - NECK_Y - PAD;

  // Pour chaque slot 0=bas → 3=haut, on calcule y dans l'espace interne
  // On rend de haut en bas dans le SVG (y croît vers le bas)
  const slotY = (slotIdx: number) => innerTop + innerH - (slotIdx + 1) * SEG_H;

  // Clip path pour arrondir le bas du tube (fond en U)
  const clipId = `tube-clip-${index}`;

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
      style={{ width: TW, height: TH + 10 }}
    >
      <svg
        width={TW}
        height={TH + 10}
        viewBox={`0 0 ${TW} ${TH + 10}`}
        overflow="visible"
      >
        <defs>
          {/* Clip : intérieur du tube (zone liquide) */}
          <clipPath id={clipId}>
            <rect
              x={innerX} y={innerTop}
              width={innerW} height={innerH}
              rx={RX - PAD} ry={RX - PAD}
            />
          </clipPath>
          {/* Gradient reflet latéral gauche */}
          <linearGradient id={`shine-${index}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="white" stopOpacity="0.18" />
            <stop offset="35%"  stopColor="white" stopOpacity="0.06" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          {/* Gradient reflet haut de chaque segment */}
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
          {/* Fond (transparent si vide) */}
          <rect x={innerX} y={innerTop} width={innerW} height={innerH}
            fill="rgba(255,255,255,0.04)" />

          {/* 4 couches de bas en haut */}
          {Array.from({ length: 4 }, (_, slotIdx) => {
            const seg = tube[slotIdx];
            const crypto = seg ? CRYPTOS.find(c => c.id === seg) : null;
            const y = slotY(slotIdx);
            const isTopSeg = slotIdx === tube.length - 1 && !!seg;

            return (
              <g key={slotIdx}>
                {crypto && (
                  <>
                    {/* Bloc de couleur */}
                    <rect
                      x={innerX} y={y}
                      width={innerW} height={SEG_H}
                      fill={crypto.color}
                    />
                    {/* Reflet sur le dessus du segment */}
                    {isTopSeg && (
                      <rect
                        x={innerX} y={y}
                        width={innerW} height={SEG_H * 0.38}
                        fill={`url(#seg-top-${index})`}
                      />
                    )}
                    {/* Ondulation surface supérieure (si segment du dessus) */}
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
                    {/* Séparateur entre segments */}
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

          {/* Reflet latéral gauche (sur tout le liquide) */}
          <rect
            x={innerX} y={innerTop}
            width={innerW * 0.28} height={innerH}
            fill={`url(#shine-${index})`}
          />
        </g>

        {/* Parois de verre (devant le liquide) */}
        {/* Bord gauche */}
        <rect x={0} y={NECK_Y - 8} width={PAD} height={TH - NECK_Y + 8}
          rx={2} fill="rgba(100,160,220,0.20)" />
        {/* Bord droit */}
        <rect x={TW - PAD} y={NECK_Y - 8} width={PAD} height={TH - NECK_Y + 8}
          rx={2} fill="rgba(100,160,220,0.14)" />
        {/* Fond arrondi */}
        <rect x={0} y={TH - PAD} width={TW} height={PAD + 10}
          rx={RX} fill="rgba(100,160,220,0.18)" />

        {/* Reflet vertical brillant gauche (rayure de verre) */}
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

        {/* Logos crypto — un par segment rempli */}
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
    </button>
  );
}

// ========================================
// POUR OVERLAY — animated arc from source to destination tube
// ========================================

interface PourOverlayProps {
  pourAnim: PourAnim | null;
  tubeRefs: React.RefObject<(HTMLButtonElement | null)[]>;
  containerRef: React.RefObject<HTMLDivElement>;
}

function PourOverlay({ pourAnim, tubeRefs, containerRef }: PourOverlayProps) {
  if (!pourAnim) return null;

  const refs = tubeRefs.current;
  const container = containerRef.current;
  if (!refs || !container) return null;

  const fromEl = refs[pourAnim.from];
  const toEl = refs[pourAnim.to];
  if (!fromEl || !toEl) return null;

  const containerRect = container.getBoundingClientRect();
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();

  // Top-center of each tube relative to the container
  const x1 = fromRect.left - containerRect.left + fromRect.width / 2;
  const y1 = fromRect.top - containerRect.top + 10; // slightly below top edge
  const x2 = toRect.left - containerRect.left + toRect.width / 2;
  const y2 = toRect.top - containerRect.top + 10;

  // Control point: arc upward between the two tubes
  const midX = (x1 + x2) / 2;
  const arcHeight = Math.max(60, Math.abs(x2 - x1) * 0.55);
  const cy = Math.min(y1, y2) - arcHeight;

  const pathD = `M ${x1} ${y1} Q ${midX} ${cy} ${x2} ${y2}`;

  // Approximate path length for dasharray animation
  const dx = x2 - x1;
  const dy = y2 - y1;
  const approxLen = Math.sqrt(dx * dx + dy * dy) + arcHeight * 1.4;

  const animId = `pour-${pourAnim.from}-${pourAnim.to}`;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        <style>{`
          @keyframes ${animId}-flow {
            from { stroke-dashoffset: ${approxLen}; }
            to   { stroke-dashoffset: 0; }
          }
        `}</style>
      </defs>

      {/* Arc path — liquid stream */}
      <path
        d={pathD}
        fill="none"
        stroke={pourAnim.color}
        strokeWidth={8}
        strokeLinecap="round"
        opacity={0.85}
        strokeDasharray={approxLen}
        strokeDashoffset={approxLen}
        style={{
          animation: `${animId}-flow 400ms ease-out forwards`,
        }}
      />

      {/* Drop travelling along the path */}
      <circle r={8} fill={pourAnim.color} opacity={0.9}>
        <animateMotion
          dur="400ms"
          fill="freeze"
          path={pathD}
        />
      </circle>

      {/* Crypto logo on the drop */}
      <image
        href={`${CDN_ICONS}${pourAnim.ticker}.svg`}
        width={14}
        height={14}
      >
        <animateMotion
          dur="400ms"
          fill="freeze"
          path={pathD}
          keyPoints="0;1"
          keyTimes="0;1"
          calcMode="linear"
        />
        {/* Offset the image so it's centered on the drop */}
        <animateTransform
          attributeName="transform"
          type="translate"
          values="-7,-7;-7,-7"
          keyTimes="0;1"
          dur="400ms"
          fill="freeze"
          additive="sum"
        />
      </image>
    </svg>
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
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-indigo-100 dark:from-cyan-950 dark:via-blue-950 dark:to-indigo-950 p-4 sm:p-8">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-cyan-700 dark:text-cyan-300/70 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors"
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
              disabled={game.status === "won"}
              tubeRef={(el) => { tubeRefs.current[idx] = el; }}
            />
          ))}
          <PourOverlay
            pourAnim={game.pourAnim}
            tubeRefs={tubeRefs}
            containerRef={containerRef}
          />
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
