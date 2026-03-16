"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { getContractAddress } from "@/lib/contracts/addresses";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "flipping" | "result";
export type CoinSide = "heads" | "tails";
export type GameResult = "win" | "lose" | null;

export interface PlayerStats {
  games: number;
  wins: number;
  streak: number;
  bestStreak: number;
}

// ========================================
// CONSTANTS
// ========================================

export const CANVAS_W = 320;
export const CANVAS_H = 320;

const FLIP_DURATION = 1800; // ms
const STATS_KEY = "coinflip_stats";
const DEFAULT_STATS: PlayerStats = { games: 0, wins: 0, streak: 0, bestStreak: 0 };
const BTC_COLOR = "#F7931A";
const ETH_COLOR = "#627EEA";

const BTC_LOGO_URL = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/btc.svg";
const ETH_LOGO_URL = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/eth.svg";

// ========================================
// HELPERS
// ========================================

function loadStats(): PlayerStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : DEFAULT_STATS;
  } catch { return DEFAULT_STATS; }
}
function saveStats(s: PlayerStats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img); // resolve anyway, draw will skip
    img.src = src;
  });
}

// ========================================
// CANVAS
// ========================================

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; color: string; r: number;
}

function spawnParticles(cx: number, cy: number, win: boolean): Particle[] {
  const colors = win
    ? ["#FFD700", "#FFA500", "#F7931A", "#FFEC80"]
    : ["#6b7280", "#9ca3af", "#d1d5db", "#4b5563"];
  return Array.from({ length: 24 }, () => ({
    x: cx, y: cy,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 0.7) * 9,
    alpha: 1,
    r: 3 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

function drawCoin(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  scaleX: number,
  side: CoinSide,
  glowing: boolean,
  btcImg: HTMLImageElement | null,
  ethImg: HTMLImageElement | null
) {
  const R = 88;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleX, 1);

  if (glowing) {
    ctx.shadowBlur = 40;
    ctx.shadowColor = side === "heads" ? BTC_COLOR : ETH_COLOR;
  }

  const isBTC = side === "heads";
  const primary = isBTC ? BTC_COLOR : ETH_COLOR;
  const grad = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
  grad.addColorStop(0, isBTC ? "#FFD27F" : "#8FA8F5");
  grad.addColorStop(0.6, primary);
  grad.addColorStop(1, isBTC ? "#C06000" : "#2945B0");

  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.strokeStyle = isBTC ? "#8B4400" : "#1A2880";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, R * 0.82, 0, Math.PI * 2);
  ctx.strokeStyle = isBTC ? "rgba(255,210,127,0.5)" : "rgba(143,168,245,0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Logo image (clipped to inner circle)
  ctx.shadowBlur = 0;
  const logo = isBTC ? btcImg : ethImg;
  const logoSize = R * 1.1;
  if (logo && logo.complete && logo.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.75, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
    ctx.restore();
  } else {
    // Fallback glyph
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(R * 0.85)}px Arial`;
    ctx.fillText(isBTC ? "₿" : "Ξ", isBTC ? 2 : 0, isBTC ? 4 : 2);
  }

  ctx.restore();
}

function drawFrame(
  canvas: HTMLCanvasElement,
  phase: number,
  flipping: boolean,
  landed: boolean,
  landedSide: CoinSide,
  win: boolean | null,
  particles: Particle[],
  isDark: boolean,
  btcImg: HTMLImageElement | null,
  ethImg: HTMLImageElement | null,
  labelHeads: string,
  labelTails: string,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2 - 10;

  ctx.clearRect(0, 0, W, H);

  // Background — dark/light mode
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  if (isDark) {
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#1e1b4b");
  } else {
    bg.addColorStop(0, "#e0e7ff");
    bg.addColorStop(1, "#f8fafc");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stars (dark only)
  if (isDark) {
    const starSeed = [17, 43, 71, 97, 131, 163, 199, 229, 251, 277, 307, 337];
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < starSeed.length; i++) {
      const sx = (starSeed[i] * 37 + i * 53) % W;
      const sy = (starSeed[i] * 19 + i * 71) % (H - 40);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Particles
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (flipping) {
    const flips = 4;
    const scaleX = Math.cos(phase * Math.PI * 2 * flips);
    const visibleSide: CoinSide = Math.floor(phase * flips * 2) % 2 === 0 ? "heads" : "tails";
    const arcY = cy - Math.sin(phase * Math.PI) * 30;
    drawCoin(ctx, cx, arcY, Math.abs(scaleX) < 0.05 ? 0.05 : scaleX, visibleSide, false, btcImg, ethImg);
  } else if (landed) {
    drawCoin(ctx, cx, cy, 1, landedSide, true, btcImg, ethImg);
    ctx.save();
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = win ? "#FFD700" : (isDark ? "#9ca3af" : "#6b7280");
    ctx.shadowBlur = win ? 12 : 0;
    ctx.shadowColor = "#FFD700";
    ctx.fillText(win ? "✓" : "✗", cx, cy + 115);
    ctx.restore();
  } else {
    drawCoin(ctx, cx, cy, 1, "heads", false, btcImg, ethImg);
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
    ctx.font = "13px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`₿ ${labelHeads}  /  Ξ ${labelTails}`, cx, H - 14);
  }
}

// ========================================
// MUTABLE STATE REF
// ========================================

interface State {
  animId: number;
  flipping: boolean;
  landed: boolean;
  flipStart: number;
  resolvedSide: CoinSide;
  choice: CoinSide | null;
  particles: Particle[];
  lastWin: boolean | null;
}

// ========================================
// HOOK
// ========================================

export function useCoinFlip() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const s = useRef<State>({
    animId: 0,
    flipping: false,
    landed: false,
    flipStart: 0,
    resolvedSide: "heads",
    choice: null,
    particles: [],
    lastWin: null,
  });
  const btcImgRef = useRef<HTMLImageElement | null>(null);
  const ethImgRef = useRef<HTMLImageElement | null>(null);
  const isDarkRef = useRef<boolean>(true);
  const labelHeadsRef = useRef<string>("Heads");
  const labelTailsRef = useRef<string>("Tails");

  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [choice, setChoice] = useState<CoinSide | null>(null);
  const [result, setResult] = useState<GameResult>(null);
  const [landedSide, setLandedSide] = useState<CoinSide>("heads");
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState("");

  const { address, chain } = useAccount();
  const { writeContract } = useWriteContract();

  // Load stats on mount
  useEffect(() => {
    const loaded = loadStats();
    setStats(loaded);
    setStreak(loaded.streak);
  }, []);

  // Preload logos
  useEffect(() => {
    loadImage(BTC_LOGO_URL).then(img => { btcImgRef.current = img; });
    loadImage(ETH_LOGO_URL).then(img => { ethImgRef.current = img; });
  }, []);

  // Watch dark mode via <html class="dark">
  useEffect(() => {
    const update = () => {
      isDarkRef.current = document.documentElement.classList.contains("dark");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Expose label setters so page can inject translated labels
  const setLabels = useCallback((heads: string, tails: string) => {
    labelHeadsRef.current = heads;
    labelTailsRef.current = tails;
  }, []);

  // Single persistent RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = (ts: number) => {
      const st = s.current;
      let phase = 0;

      if (st.flipping) {
        phase = Math.min((ts - st.flipStart) / FLIP_DURATION, 1);

        if (phase >= 1) {
          st.flipping = false;
          st.landed = true;
          const win = st.choice === st.resolvedSide;
          st.lastWin = win;
          st.particles = spawnParticles(canvas.width / 2, canvas.height / 2 - 10, win);

          const saved = loadStats();
          const newStreak = win ? saved.streak + 1 : 0;
          const updated: PlayerStats = {
            games: saved.games + 1,
            wins: win ? saved.wins + 1 : saved.wins,
            streak: newStreak,
            bestStreak: Math.max(saved.bestStreak, newStreak),
          };
          saveStats(updated);

          setLandedSide(st.resolvedSide);
          setResult(win ? "win" : "lose");
          setStatus("result");
          setStats(updated);
          setStreak(newStreak);
          setMessage(win ? "🎉" : "😔");
        }
      }

      st.particles = st.particles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.25, alpha: p.alpha - 0.022 }))
        .filter(p => p.alpha > 0);

      drawFrame(
        canvas, phase,
        st.flipping, st.landed,
        st.resolvedSide, st.lastWin,
        st.particles,
        isDarkRef.current,
        btcImgRef.current, ethImgRef.current,
        labelHeadsRef.current, labelTailsRef.current,
      );

      st.animId = requestAnimationFrame(loop);
    };

    s.current.animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.current.animId);
  }, []);

  const flip = useCallback((chosen: CoinSide) => {
    if (s.current.flipping) return;

    s.current.choice = chosen;
    s.current.flipping = true;
    s.current.landed = false;
    s.current.particles = [];
    s.current.flipStart = performance.now();
    s.current.resolvedSide = Math.random() < 0.5 ? "heads" : "tails";
    s.current.lastWin = null;

    setChoice(chosen);
    setStatus("flipping");
    setResult(null);
    setMessage("");

    if (mode === "onchain" && address && chain) {
      const contractAddress = getContractAddress("coinflip", chain.id);
      if (contractAddress) {
        writeContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: "startGame", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] }],
          functionName: "startGame",
        });
      }
    }
  }, [mode, address, chain, writeContract]);

  const reset = useCallback(() => {
    s.current.flipping = false;
    s.current.landed = false;
    s.current.particles = [];
    s.current.choice = null;
    s.current.lastWin = null;
    setChoice(null);
    setStatus("idle");
    setResult(null);
    setMessage("");
  }, []);

  const setGameMode = useCallback((m: GameMode) => {
    setMode(m);
    reset();
  }, [reset]);

  return {
    canvasRef,
    mode, status, choice, result, landedSide,
    stats, streak, message,
    flip, reset, setGameMode, setLabels,
  };
}
