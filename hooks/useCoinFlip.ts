"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { getContractAddress } from "@/lib/contracts/addresses";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "flipping" | "result" | "processing";
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

const FLIP_DURATION = 1800; // ms total flip animation
const STATS_KEY = "coinflip_stats";

const DEFAULT_STATS: PlayerStats = { games: 0, wins: 0, streak: 0, bestStreak: 0 };

// BTC (heads) and ETH (tails) logos
const BTC_COLOR = "#F7931A";
const ETH_COLOR = "#627EEA";

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

// ========================================
// CANVAS DRAW
// ========================================

interface DrawState {
  phase: number;         // 0..1 flip progress
  flipping: boolean;
  landed: boolean;
  side: CoinSide;
  result: GameResult;
  choice: CoinSide | null;
  particles: Particle[];
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number;
  color: string;
  r: number;
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
  scaleX: number,   // -1..1 squish for flip illusion
  side: CoinSide,
  glowing: boolean
) {
  const R = 88;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleX, 1);

  // Glow
  if (glowing) {
    ctx.shadowBlur = 40;
    ctx.shadowColor = side === "heads" ? BTC_COLOR : ETH_COLOR;
  }

  // Coin body
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

  // Rim
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.strokeStyle = isBTC ? "#8B4400" : "#1A2880";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.82, 0, Math.PI * 2);
  ctx.strokeStyle = isBTC ? "rgba(255,210,127,0.5)" : "rgba(143,168,245,0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Symbol
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (isBTC) {
    ctx.font = `bold ${Math.round(R * 0.85)}px Arial`;
    ctx.fillText("₿", 2, 4);
  } else {
    ctx.font = `bold ${Math.round(R * 0.7)}px Arial`;
    ctx.fillText("Ξ", 0, 2);
  }

  ctx.restore();
}

function drawCanvas(canvas: HTMLCanvasElement, ds: DrawState) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2 - 10;

  // Background
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stars
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  const starSeed = [17, 43, 71, 97, 131, 163, 199, 229, 251, 277, 307, 337];
  for (let i = 0; i < starSeed.length; i++) {
    const sx = (starSeed[i] * 37 + i * 53) % W;
    const sy = (starSeed[i] * 19 + i * 71) % (H - 40);
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Particles
  for (const p of ds.particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (ds.flipping) {
    // Flip animation: scaleX oscillates from 1 → -1 → 1 multiple times
    const t = ds.phase; // 0..1
    const flips = 4;
    const scaleX = Math.cos(t * Math.PI * 2 * flips);
    // Alternate side based on flip count
    const visibleSide: CoinSide = Math.floor(t * flips * 2) % 2 === 0
      ? "heads"
      : "tails";
    // Slight vertical arc
    const arcY = cy - Math.sin(t * Math.PI) * 30;
    drawCoin(ctx, cx, arcY, Math.abs(scaleX) < 0.05 ? 0.05 : scaleX, visibleSide, false);
  } else if (ds.landed) {
    drawCoin(ctx, cx, cy, 1, ds.side, true);

    // Result label
    const win = ds.result === "win";
    ctx.save();
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = win ? "#FFD700" : "#9ca3af";
    ctx.shadowBlur = win ? 12 : 0;
    ctx.shadowColor = "#FFD700";
    ctx.fillText(win ? "✓ Gagné !" : "✗ Perdu", cx, cy + 115);
    ctx.restore();
  } else {
    // Idle — show both sides hint
    drawCoin(ctx, cx, cy, 1, "heads", false);
  }

  // Bottom label
  if (!ds.flipping && !ds.landed) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("₿ Pile  /  Ξ Face", cx, H - 14);
  }
}

// ========================================
// HOOK
// ========================================

export function useCoinFlip() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const flipStartRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const resolvedSideRef = useRef<CoinSide>("heads");

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

  // Load stats
  useEffect(() => {
    const s = loadStats();
    setStats(s);
    setStreak(s.streak);
  }, []);

  // Draw loop (idle + flip)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId = 0;
    let flipping = false;
    let landed = false;

    const loop = (ts: number) => {
      let phase = 0;
      if (flipping) {
        phase = Math.min((ts - flipStartRef.current) / FLIP_DURATION, 1);
        if (phase >= 1) {
          flipping = false;
          landed = true;
          // Trigger result
          const side = resolvedSideRef.current;
          setLandedSide(side);
          const win = choice === side;
          setResult(win ? "win" : "lose");
          setStatus("result");
          particlesRef.current = spawnParticles(canvas.width / 2, canvas.height / 2 - 10, win);

          const s = loadStats();
          const newStreak = win ? s.streak + 1 : 0;
          const updated: PlayerStats = {
            games: s.games + 1,
            wins: win ? s.wins + 1 : s.wins,
            streak: newStreak,
            bestStreak: Math.max(s.bestStreak, newStreak),
          };
          saveStats(updated);
          setStats(updated);
          setStreak(newStreak);
          setMessage(win ? "🎉 Bien joué !" : "😔 Pas de chance...");
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.25, alpha: p.alpha - 0.022 }))
        .filter(p => p.alpha > 0);

      drawCanvas(canvas, {
        phase,
        flipping: flipping && !landed,
        landed,
        side: resolvedSideRef.current,
        result: landed ? (choice === resolvedSideRef.current ? "win" : "lose") : null,
        choice,
        particles: particlesRef.current,
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Subscribe to flip start
    const onFlip = () => { flipping = true; landed = false; particlesRef.current = []; };
    const onReset = () => { flipping = false; landed = false; particlesRef.current = []; };
    canvas.addEventListener("_flip" as any, onFlip);
    canvas.addEventListener("_reset" as any, onReset);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("_flip" as any, onFlip);
      canvas.removeEventListener("_reset" as any, onReset);
    };
  }, [choice]);

  const flip = useCallback((chosen: CoinSide) => {
    if (status === "flipping") return;
    setChoice(chosen);
    setResult(null);
    setMessage("");
    setStatus("flipping");

    // Resolve result immediately (random), reveal at end of animation
    resolvedSideRef.current = Math.random() < 0.5 ? "heads" : "tails";
    flipStartRef.current = performance.now();

    const canvas = canvasRef.current;
    if (canvas) canvas.dispatchEvent(new Event("_flip"));

    // On-chain: record game start
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
  }, [status, mode, address, chain, writeContract]);

  const reset = useCallback(() => {
    setStatus("idle");
    setChoice(null);
    setResult(null);
    setMessage("");
    const canvas = canvasRef.current;
    if (canvas) canvas.dispatchEvent(new Event("_reset"));
  }, []);

  const setGameMode = useCallback((m: GameMode) => {
    setMode(m);
    reset();
  }, [reset]);

  return {
    canvasRef,
    mode, status, choice, result, landedSide,
    stats, streak, message,
    flip, reset, setGameMode,
  };
}
