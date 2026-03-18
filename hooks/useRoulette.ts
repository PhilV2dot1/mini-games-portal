"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { getContractAddress } from "@/lib/contracts/addresses";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "spinning" | "result";
export type BetType = "red" | "black" | "green" | "odd" | "even" | "number";
export type GameResult = "win" | "lose" | null;

export interface Bet {
  type: BetType;
  value: number | null; // null for color/odd/even bets
  amount: number;
  payout: number; // multiplier
}

export interface PlayerStats {
  games: number;
  wins: number;
  chips: number;
  bestWin: number;
}

// ========================================
// CONSTANTS
// ========================================

export const CANVAS_W = 560;
export const CANVAS_H = 560;

const SPIN_DURATION = 4500; // ms
const STATS_KEY = "roulette_stats";
const INITIAL_CHIPS = 1000;

const DEFAULT_STATS: PlayerStats = {
  games: 0, wins: 0, chips: INITIAL_CHIPS, bestWin: 0,
};

export const BET_AMOUNTS = [10, 25, 50, 100] as const;

// European roulette: 0 + 1-36
// 0 = green, odd red numbers, even black numbers
const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

export function getNumberColor(n: number): "green" | "red" | "black" {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

export function getBetPayout(type: BetType): number {
  switch (type) {
    case "number": return 35;
    case "green":  return 17;
    case "red":
    case "black":
    case "odd":
    case "even":   return 1;
  }
}

// Arrange in classic roulette wheel order
export const WHEEL_ORDER = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];
const SLOT_COUNT = WHEEL_ORDER.length; // 37

// Colors per slot in wheel order
const WHEEL_COLORS = WHEEL_ORDER.map(n => getNumberColor(n));

// Crypto tokens for wheel decoration (one per sector, cycling)
// 37 unique tickers — one per wheel slot, all verified valid on jsDelivr
export const CRYPTO_TICKERS = ["btc","eth","sol","bnb","xrp","ada","avax","doge","dot","matic","link","atom","ltc","uni","aave","snx","crv","mkr","comp","yfi","sushi","1inch","bal","ren","knc","zrx","lrc","band","uma","algo","iost","grt","icp","fil","theta","enj","usdt"];

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
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });
}

// ========================================
// CANVAS DRAW
// ========================================

interface Particle {
  x: number; y: number; vx: number; vy: number;
  alpha: number; color: string; r: number;
}

function spawnParticles(cx: number, cy: number, win: boolean): Particle[] {
  const colors = win
    ? ["#FFD700","#FFA500","#FF6B35","#FFEC80","#FF4500"]
    : ["#6b7280","#9ca3af","#4b5563"];
  return Array.from({ length: 30 }, () => ({
    x: cx, y: cy,
    vx: (Math.random() - 0.5) * 10,
    vy: (Math.random() - 0.8) * 11,
    alpha: 1, r: 3 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  wheelAngle: number,
  R: number,
  logos: (HTMLImageElement | null)[],
  isDark: boolean,
  highlightIdx: number | null,
) {
  const sliceAngle = (Math.PI * 2) / SLOT_COUNT;

  // Outer ring shadow
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R + 6, 0, Math.PI * 2);
  ctx.shadowBlur = 30;
  ctx.shadowColor = isDark ? "rgba(99,102,241,0.6)" : "rgba(99,102,241,0.3)";
  ctx.strokeStyle = isDark ? "#6366f1" : "#818cf8";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  // Draw each sector
  for (let i = 0; i < SLOT_COUNT; i++) {
    const startAngle = wheelAngle + i * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;
    const color = WHEEL_COLORS[i];

    // Sector fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.closePath();

    if (highlightIdx === i) {
      ctx.fillStyle = color === "red" ? "#ff6b6b" : color === "black" ? "#9ca3af" : "#4ade80";
      ctx.shadowBlur = 20;
      ctx.shadowColor = color === "red" ? "#ff6b6b" : color === "green" ? "#4ade80" : "#fff";
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = color === "red" ? "#dc2626" : color === "black" ? "#1f2937" : "#16a34a";
    }
    ctx.fill();

    // Sector border
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Number label
    const midAngle = startAngle + sliceAngle / 2;
    const labelR = R * 0.78;
    const lx = cx + Math.cos(midAngle) * labelR;
    const ly = cy + Math.sin(midAngle) * labelR;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(midAngle + Math.PI / 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `bold ${Math.round(R * 0.065)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(WHEEL_ORDER[i]), 0, 0);
    ctx.restore();

    // Crypto logo in outer ring
    const logoR = R * 0.91;
    const logoX = cx + Math.cos(midAngle) * logoR;
    const logoY = cy + Math.sin(midAngle) * logoR;
    const logoSize = R * 0.09;
    const logo = logos[i % logos.length];
    if (logo && logo.complete && logo.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX, logoY, logoSize * 0.55, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logo, logoX - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
      ctx.restore();
    }
  }

  // Center hub
  const hubGrad = ctx.createRadialGradient(cx - R * 0.04, cy - R * 0.04, R * 0.02, cx, cy, R * 0.14);
  hubGrad.addColorStop(0, isDark ? "#818cf8" : "#a5b4fc");
  hubGrad.addColorStop(1, isDark ? "#4338ca" : "#6366f1");
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = hubGrad;
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#6366f1";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Spokes
  for (let i = 0; i < 8; i++) {
    const a = wheelAngle + (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * 0.12, cy + Math.sin(a) * R * 0.12);
    ctx.lineTo(cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  ballAngle: number,
  ballR: number,   // distance from center
  R: number,
  isResult: boolean,
) {
  const bx = cx + Math.cos(ballAngle) * ballR;
  const by = cy + Math.sin(ballAngle) * ballR;
  const r = R * 0.045; // slightly larger when landed

  if (!isResult) {
    // Trail only while spinning
    for (let i = 1; i <= 4; i++) {
      const ta = ballAngle - (i * 0.12);
      const tx = cx + Math.cos(ta) * ballR;
      const ty = cy + Math.sin(ta) * ballR;
      ctx.beginPath();
      ctx.arc(tx, ty, r * (1 - i * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.15 - i * 0.03})`;
      ctx.fill();
    }
  }

  // Ball — gold when landed, white when spinning
  const ballGrad = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.35, r * 0.1, bx, by, r);
  if (isResult) {
    ballGrad.addColorStop(0, "#fff7c0");
    ballGrad.addColorStop(0.5, "#fbbf24");
    ballGrad.addColorStop(1, "#92400e");
  } else {
    ballGrad.addColorStop(0, "#ffffff");
    ballGrad.addColorStop(0.5, "#e2e8f0");
    ballGrad.addColorStop(1, "#94a3b8");
  }
  ctx.beginPath();
  ctx.arc(bx, by, r, 0, Math.PI * 2);
  ctx.fillStyle = ballGrad;
  ctx.shadowBlur = isResult ? 18 : 12;
  ctx.shadowColor = isResult ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.8)";
  ctx.fill();
  ctx.shadowBlur = 0;

  if (isResult) {
    // Gold ring around ball
    ctx.beginPath();
    ctx.arc(bx, by, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawMarker(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, isDark: boolean) {
  // Triangle pointer at top
  const my = cy - R - 2;
  ctx.beginPath();
  ctx.moveTo(cx, my + 14);
  ctx.lineTo(cx - 8, my + 28);
  ctx.lineTo(cx + 8, my + 28);
  ctx.closePath();
  ctx.fillStyle = isDark ? "#fbbf24" : "#f59e0b";
  ctx.shadowBlur = 8;
  ctx.shadowColor = "#fbbf24";
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawFrame(
  canvas: HTMLCanvasElement,
  wheelAngle: number,
  ballAngle: number,
  ballR: number,
  spinning: boolean,
  resultIdx: number | null,
  particles: Particle[],
  isDark: boolean,
  logos: (HTMLImageElement | null)[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) / 2 - 18;

  ctx.clearRect(0, 0, W, H);

  // Background
  const bg = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.4);
  if (isDark) {
    bg.addColorStop(0, "#1e1b4b");
    bg.addColorStop(1, "#0f172a");
  } else {
    bg.addColorStop(0, "#eef2ff");
    bg.addColorStop(1, "#dde6f5");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

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

  // Wheel
  drawWheel(ctx, cx, cy, wheelAngle, R, logos, isDark,
    !spinning && resultIdx !== null ? resultIdx : null);

  // Marker
  drawMarker(ctx, cx, cy, R, isDark);

  // Ball (only while spinning or just landed)
  if (spinning || resultIdx !== null) {
    drawBall(ctx, cx, cy, ballAngle, ballR, R, !spinning && resultIdx !== null);
  }
}

// ========================================
// MUTABLE STATE REF
// ========================================

interface State {
  animId: number;
  spinning: boolean;
  spinStart: number;
  wheelStartAngle: number;
  wheelEndAngle: number;      // final resting angle
  ballStartAngle: number;
  ballFinalAngle: number;     // exact angle where ball lands (center of winning slot)
  ballFinalR: number;         // radius where ball rests after spin
  resolvedIdx: number;        // slot index (in WHEEL_ORDER) that wins
  particles: Particle[];
  resultIdx: number | null;
}

// ========================================
// HOOK
// ========================================

export function useRoulette() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const s = useRef<State>({
    animId: 0, spinning: false, spinStart: 0,
    wheelStartAngle: 0, wheelEndAngle: 0,
    ballStartAngle: 0, ballFinalAngle: 0, ballFinalR: 0, resolvedIdx: 0,
    particles: [], resultIdx: null,
  });
  const logosRef = useRef<(HTMLImageElement | null)[]>([]);
  const isDarkRef = useRef(true);

  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [bets, setBets] = useState<Bet[]>([]);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(25);
  const [result, setResult] = useState<GameResult>(null);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [totalWin, setTotalWin] = useState<number>(0);
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [message, setMessage] = useState("");

  // Session tracking for on-chain recording
  const sessionRef = useRef({
    active: false,
    spinsPlayed: 0,
    spinsWon: 0,
    bestWin: 0,       // best single-spin net profit
  });

  const { address, chain } = useAccount();
  const { writeContract, writeContractAsync } = useWriteContract();

  // Load stats
  useEffect(() => {
    const s = loadStats();
    setStats(s);
  }, []);

  // Preload crypto logos (one per slot)
  useEffect(() => {
    const base = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/";
    Promise.all(
      CRYPTO_TICKERS.slice(0, SLOT_COUNT).map(t => loadImage(`${base}${t}.svg`))
    ).then(imgs => { logosRef.current = imgs; });
  }, []);

  // Dark mode observer
  useEffect(() => {
    const update = () => { isDarkRef.current = document.documentElement.classList.contains("dark"); };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // RAF loop — mounted once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = (ts: number) => {
      const st = s.current;
      let wheelAngle = st.wheelStartAngle;
      const R = Math.min(canvas.width, canvas.height) / 2 - 18;
      // After spin: freeze ball at its landing position
      let ballAngle = st.spinning ? st.ballStartAngle : st.ballFinalAngle;
      let ballR = st.spinning ? R * 0.92 : st.ballFinalR;

      if (st.spinning) {
        const elapsed = ts - st.spinStart;
        const t = Math.min(elapsed / SPIN_DURATION, 1);
        const ease = easeOut(t);

        // Wheel rotates forward (5 full turns + landing offset)
        wheelAngle = st.wheelStartAngle + (st.wheelEndAngle - st.wheelStartAngle) * ease;

        // Ball spirals inward and converges to the winning slot angle
        const ballProgress = easeOut(t);
        const ballSpeed = (1 - ease) * 0.18 + ease * 0.01;
        const rawAngle = st.ballStartAngle - (ts - st.spinStart) * ballSpeed * 0.06;
        // Blend from free rotation → final slot angle over last 30% of spin
        const snapT = Math.max(0, (t - 0.7) / 0.3);
        const snapEase = snapT * snapT * (3 - 2 * snapT); // smoothstep
        ballAngle = rawAngle + snapEase * (st.ballFinalAngle - rawAngle);
        ballR = R * 0.92 - ballProgress * R * 0.12; // spiral inward

        if (t >= 1) {
          st.spinning = false;
          st.resultIdx = st.resolvedIdx;
          // Freeze ball at exact landing position
          st.ballFinalAngle = ballAngle;
          st.ballFinalR = ballR;
          const num = WHEEL_ORDER[st.resolvedIdx];
          const win = calcWin(betsRef.current, num);
          st.particles = spawnParticles(canvas.width / 2, canvas.height / 2, win > 0);

          const saved = loadStats();
          // chips already deducted optimistically at spin start — just add winnings
          const newChips = saved.chips + win;
          const updated: PlayerStats = {
            games: saved.games + 1,
            wins: win > 0 ? saved.wins + 1 : saved.wins,
            chips: Math.max(0, newChips),
            bestWin: Math.max(saved.bestWin, win),
          };
          saveStats(updated);

          // Update session counters
          const sess = sessionRef.current;
          sess.spinsPlayed++;
          if (win > 0) {
            sess.spinsWon++;
            const netWin = win - totalBetRef.current;
            if (netWin > sess.bestWin) sess.bestWin = netWin;
          }

          setWinningNumber(num);
          setTotalWin(win);
          setResult(win > 0 ? "win" : "lose");
          setStatus("result");
          setStats(updated);
          setMessage(win > 0 ? `+${win} chips 🎉` : "Pas de chance...");
        }
      }

      // Animate particles
      st.particles = st.particles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, alpha: p.alpha - 0.018 }))
        .filter(p => p.alpha > 0);

      drawFrame(
        canvas, wheelAngle, ballAngle, ballR,
        st.spinning, st.resultIdx, st.particles,
        isDarkRef.current, logosRef.current,
      );

      st.animId = requestAnimationFrame(loop);
    };

    s.current.animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.current.animId);
  }, []);

  // Keep bets in a ref for access inside RAF
  const betsRef = useRef<Bet[]>([]);
  const totalBetRef = useRef<number>(0);
  useEffect(() => { betsRef.current = bets; }, [bets]);
  useEffect(() => {
    totalBetRef.current = bets.reduce((sum, b) => sum + b.amount, 0);
  }, [bets]);

  const spin = useCallback(() => {
    if (s.current.spinning || bets.length === 0) return;
    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    const currentStats = loadStats();
    if (totalBet > currentStats.chips) return;

    // Deduct chips optimistically
    const deducted = { ...currentStats, chips: currentStats.chips - totalBet };
    saveStats(deducted);
    setStats(deducted);

    // Resolve winning number
    const resolvedIdx = Math.floor(Math.random() * SLOT_COUNT);
    const sliceAngle = (Math.PI * 2) / SLOT_COUNT;

    // Wheel end angle: enough full rotations to feel satisfying
    const extraRotations = 5 + Math.random() * 3;
    const targetAngle = -resolvedIdx * sliceAngle;
    const wheelEndAngle = s.current.wheelStartAngle + Math.PI * 2 * extraRotations + targetAngle;

    // Ball must land exactly at the center of the winning slot in absolute coords
    // Slot i center in absolute = wheelEndAngle + i*sliceAngle - π/2 + sliceAngle/2
    const ballFinalAngle = wheelEndAngle + resolvedIdx * sliceAngle - Math.PI / 2 + sliceAngle / 2;

    s.current.resultIdx = null; // clear highlight while spinning
    s.current.spinning = true;
    s.current.spinStart = performance.now();
    s.current.wheelEndAngle = wheelEndAngle;
    s.current.ballFinalAngle = ballFinalAngle;
    s.current.ballStartAngle = Math.random() * Math.PI * 2;
    s.current.resolvedIdx = resolvedIdx;
    s.current.resultIdx = null;
    s.current.particles = [];

    setStatus("spinning");
    setResult(null);
    setMessage("");
    setWinningNumber(null);

    // Open session on first spin of the session
    if (mode === "onchain" && address && chain && !sessionRef.current.active) {
      const addr = getContractAddress("roulette", chain.id);
      if (addr) {
        sessionRef.current.active = true;
        writeContract({
          address: addr as `0x${string}`,
          abi: [{ name: "startSession", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] }],
          functionName: "startSession",
        });
      }
    }
  }, [bets, mode, address, chain, writeContract]);

  const placeBet = useCallback((type: BetType, value: number | null) => {
    if (status === "spinning") return;
    setBets(prev => {
      // Merge same bet type+value
      const existing = prev.findIndex(b => b.type === type && b.value === value);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], amount: updated[existing].amount + selectedBetAmount };
        return updated;
      }
      return [...prev, { type, value, amount: selectedBetAmount, payout: getBetPayout(type) }];
    });
  }, [status, selectedBetAmount]);

  const clearBets = useCallback(() => {
    if (status === "spinning") return;
    setBets([]);
  }, [status]);

  const reset = useCallback(() => {
    // Keep resultIdx so the wheel stays in last position until next spin
    s.current.particles = [];
    setBets([]);
    setResult(null);
    setMessage("");
    setWinningNumber(null);
    setStatus("idle");
  }, []);

  const setGameMode = useCallback((m: GameMode) => {
    setMode(m);
    reset();
    // Abandon on-chain session if switching mode mid-session
    if (m !== "onchain" && sessionRef.current.active && address && chain) {
      const addr = getContractAddress("roulette", chain.id);
      if (addr) {
        writeContract({
          address: addr as `0x${string}`,
          abi: [{ name: "abandonSession", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] }],
          functionName: "abandonSession",
        });
      }
      sessionRef.current = { active: false, spinsPlayed: 0, spinsWon: 0, bestWin: 0 };
    }
  }, [reset, address, chain, writeContract]);

  // End session and record on-chain
  const endSession = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess.active || !address || !chain) return;
    const addr = getContractAddress("roulette", chain.id);
    if (!addr) return;

    const finalChips = loadStats().chips;
    try {
      await writeContractAsync({
        address: addr as `0x${string}`,
        abi: [{
          name: "endSession", type: "function", stateMutability: "nonpayable",
          inputs: [
            { name: "spinsPlayed", type: "uint256" },
            { name: "spinsWon",    type: "uint256" },
            { name: "bestWin",     type: "uint256" },
            { name: "finalChips",  type: "uint256" },
          ],
          outputs: [],
        }],
        functionName: "endSession",
        args: [
          BigInt(sess.spinsPlayed),
          BigInt(sess.spinsWon),
          BigInt(sess.bestWin),
          BigInt(finalChips),
        ],
      });
    } catch (err) {
      console.error("endSession tx failed:", err);
    }
    sessionRef.current = { active: false, spinsPlayed: 0, spinsWon: 0, bestWin: 0 };
  }, [address, chain, writeContractAsync]);

  const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
  const hasActiveSession = sessionRef.current.active;

  return {
    canvasRef,
    mode, status, bets, selectedBetAmount,
    result, winningNumber, totalWin, totalBet,
    stats, message, hasActiveSession,
    spin, placeBet, clearBets, reset, endSession,
    setSelectedBetAmount, setGameMode,
  };
}

// ========================================
// WIN CALCULATION
// ========================================

function calcWin(bets: Bet[], winningNumber: number): number {
  let total = 0;
  const color = getNumberColor(winningNumber);
  for (const bet of bets) {
    let won = false;
    if (bet.type === "number")  won = bet.value === winningNumber;
    else if (bet.type === "red")   won = color === "red";
    else if (bet.type === "black") won = color === "black";
    else if (bet.type === "green") won = color === "green";
    else if (bet.type === "odd")   won = winningNumber > 0 && winningNumber % 2 === 1;
    else if (bet.type === "even")  won = winningNumber > 0 && winningNumber % 2 === 0;
    if (won) total += bet.amount * (bet.payout + 1); // payout + stake back
  }
  return total;
}
