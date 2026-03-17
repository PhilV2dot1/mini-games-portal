"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getContractAddress } from "@/lib/contracts/addresses";
import { useLocalStats } from "@/hooks/useLocalStats";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "countdown" | "playing" | "processing" | "finished";
export type GameResult = "win" | "lose" | null;

export interface PlayerStats {
  games: number;
  wins: number;
  highScore: number; // highest coins reached
  totalScore: number;
}

// ========================================
// CONSTANTS
// ========================================

export const CANVAS_W = 400;
export const CANVAS_H = 620;

const PEG_ROWS = 12;
const PEG_COL_SPACING = 28;
const PEG_ROW_SPACING = 40;
const PEG_AREA_TOP = 75;
const PEG_RADIUS = 5;
const BALL_RADIUS = 10;
const GRAVITY = 0.28;
const BALL_MAX_VEL = 9;
const BOUNCE_DEFLECT_MIN = 0.8;
const BOUNCE_DEFLECT_MAX = 2.5;
const BALL_MAX_LIFETIME_MS = 10000; // force landing after 10s
const BUCKET_H = 48;
const BUCKET_Y = CANVAS_H - BUCKET_H - 5;
const DROP_ZONE_Y = 35;
const INITIAL_COINS = 1000;
const WIN_TARGET = 10000000; // displayed as "1 BTC" (coins / 10,000,000)
const BTC_DIVISOR = 10000000; // 1 BTC = 10,000,000 coins
export function coinsToBTC(coins: number): string {
  const btc = coins / BTC_DIVISOR;
  if (btc >= 1) return btc.toFixed(4) + " BTC";
  if (btc >= 0.001) return btc.toFixed(6) + " BTC";
  return btc.toFixed(8) + " BTC";
}
export const BET_OPTIONS = [10, 25, 50, 100] as const;

// 11 multiplier buckets (symmetric)
const MULTIPLIERS = [0.2, 0.5, 1, 2, 5, 10, 5, 2, 1, 0.5, 0.2];
const NUM_BUCKETS = MULTIPLIERS.length;

// Bucket colors: red→amber→green→gold
const BUCKET_COLORS = [
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#15803d",
  "#f59e0b", // center 10x — gold
  "#15803d", "#16a34a", "#ca8a04", "#ea580c", "#dc2626",
];

// Crypto logos on pegs (no BTC — ball is BTC)
const CRYPTO_LOGOS = ["eth", "sol", "bnb", "xrp", "ada", "avax", "doge", "dot", "matic", "link", "atom", "ltc"];

const STATS_KEY = "plinko_stats";
const DEFAULT_STATS: PlayerStats = { games: 0, wins: 0, highScore: 0, totalScore: 0 };

// ========================================
// CONTRACT ABI
// ========================================

const PLINKO_ABI = [
  { type: "function", name: "startGame", inputs: [], outputs: [], stateMutability: "nonpayable" },
  {
    type: "function", name: "endGame",
    inputs: [{ name: "score", type: "uint256" }, { name: "won", type: "uint256" }],
    outputs: [], stateMutability: "nonpayable",
  },
  {
    type: "function", name: "getPlayerStats",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "gamesPlayed", type: "uint256" }, { name: "wins", type: "uint256" },
      { name: "highScore", type: "uint256" }, { name: "totalScore", type: "uint256" },
    ], stateMutability: "view",
  },
] as const;

// ========================================
// INTERFACES
// ========================================

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; // 1 → 0
  color: string;
}

interface PlinkoBall {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  bet: number;
  landed: boolean;
  landedBucketIdx: number;
  particles: Particle[];
  alpha: number; // fade-out after landing
  spawnedAt: number; // performance.now() at spawn
}

interface Peg {
  x: number; y: number;
  logoIdx: number;
}

// ========================================
// HELPERS
// ========================================

function buildPegs(): Peg[] {
  const pegs: Peg[] = [];
  const PEG_COLS_BASE = 3;
  for (let row = 0; row < PEG_ROWS; row++) {
    const colCount = PEG_COLS_BASE + row; // 3 → 14
    const rowWidth = (colCount - 1) * PEG_COL_SPACING;
    const startX = CANVAS_W / 2 - rowWidth / 2;
    const y = PEG_AREA_TOP + row * PEG_ROW_SPACING;
    for (let col = 0; col < colCount; col++) {
      pegs.push({
        x: startX + col * PEG_COL_SPACING,
        y,
        logoIdx: (row * 3 + col) % CRYPTO_LOGOS.length,
      });
    }
  }
  return pegs;
}

function spawnParticles(ball: PlinkoBall, color: string) {
  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14;
    const speed = 1.5 + Math.random() * 3;
    ball.particles.push({
      x: ball.x, y: ball.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      life: 1,
      color,
    });
  }
}

// Pre-load crypto logo images
const logoCache: Record<string, HTMLImageElement> = {};
function getLogoImg(ticker: string): HTMLImageElement {
  if (!logoCache[ticker]) {
    const img = new Image();
    img.src = `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/${ticker}.svg`;
    logoCache[ticker] = img;
  }
  return logoCache[ticker];
}

// ========================================
// HOOK
// ========================================

export function usePlinko() {
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [currentBet, setCurrentBetState] = useState<number>(BET_OPTIONS[0]);
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [result, setResult] = useState<GameResult>(null);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [localStats, setLocalStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);
  const [lastBucketIdx, setLastBucketIdx] = useState<number>(-1); // for audio triggers

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pegsRef = useRef<Peg[]>(buildPegs());

  const stateRef = useRef({
    balls: [] as PlinkoBall[],
    coins: INITIAL_COINS,
    currentBet: BET_OPTIONS[0] as number,
    aimX: CANVAS_W / 2,
    nextId: 0,
    status: "idle" as GameStatus,
    animId: 0,
    lastTime: 0,
    maxCoins: INITIAL_COINS, // track high point for highScore
  });

  const { address, chainId } = useAccount();
  const contractAddress = getContractAddress("plinko", chainId);
  const { writeContractAsync } = useWriteContract();
  const { recordGame } = useLocalStats();
  // Stable ref so finalizeGame doesn't recreate on every recordGame identity change
  const recordGameRef = useRef(recordGame);
  useEffect(() => { recordGameRef.current = recordGame; }, [recordGame]);
  const manualEndRef = useRef(false);

  const { data: onChainStats } = useReadContract({
    address: contractAddress ?? undefined,
    abi: PLINKO_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddress },
  });

  // Load local stats
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) setLocalStats(JSON.parse(raw));
    } catch {}
  }, []);

  // Pre-load logos
  useEffect(() => {
    CRYPTO_LOGOS.forEach(t => getLogoImg(t));
  }, []);

  // ======================================
  // DRAW
  // ======================================

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;
    const pegs = pegsRef.current;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, "#1c1232");
    bg.addColorStop(0.5, "#2d1b4e");
    bg.addColorStop(1, "#1a0f2e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    [[20,15],[70,30],[140,10],[210,25],[310,8],[370,35],[50,55],[130,50],[250,45],[350,60],[90,80],[180,70]].forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
    });

    // Aim indicator (dotted vertical line)
    if (s.status === "playing") {
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(251,191,36,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.aimX, DROP_ZONE_Y - 10);
      ctx.lineTo(s.aimX, PEG_AREA_TOP - 10);
      ctx.stroke();
      ctx.setLineDash([]);
      // Arrow head
      ctx.fillStyle = "rgba(251,191,36,0.8)";
      ctx.beginPath();
      ctx.moveTo(s.aimX, DROP_ZONE_Y - 2);
      ctx.lineTo(s.aimX - 6, DROP_ZONE_Y - 14);
      ctx.lineTo(s.aimX + 6, DROP_ZONE_Y - 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Pegs
    for (const peg of pegs) {
      // Peg glow
      ctx.save();
      ctx.shadowColor = "rgba(251,191,36,0.3)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Peg circle
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Crypto logo on peg (tiny)
      const logo = getLogoImg(CRYPTO_LOGOS[peg.logoIdx]);
      const ls = PEG_RADIUS * 1.6;
      try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, peg.x - ls / 2, peg.y - ls / 2, ls, ls);
        ctx.restore();
      } catch {}
    }

    // Buckets
    const bucketW = CANVAS_W / NUM_BUCKETS;
    for (let i = 0; i < NUM_BUCKETS; i++) {
      const bx = i * bucketW;
      // Bucket bg
      ctx.fillStyle = BUCKET_COLORS[i];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(bx + 1, BUCKET_Y, bucketW - 2, BUCKET_H);
      ctx.globalAlpha = 1;
      // Bucket border
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 1, BUCKET_Y, bucketW - 2, BUCKET_H);
      // Multiplier text
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${bucketW > 40 ? 11 : 9}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${MULTIPLIERS[i]}x`, bx + bucketW / 2, BUCKET_Y + BUCKET_H / 2);
    }

    // Particles
    for (const ball of s.balls) {
      for (const p of ball.particles) {
        ctx.globalAlpha = p.life * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Balls
    for (const ball of s.balls) {
      if (ball.landed && ball.alpha <= 0) continue;
      ctx.globalAlpha = ball.landed ? ball.alpha : 1;
      ctx.save();
      ctx.translate(ball.x, ball.y);

      // BTC coin
      const coinGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, BALL_RADIUS);
      coinGrad.addColorStop(0, "#ffd700");
      coinGrad.addColorStop(0.6, "#f7931a");
      coinGrad.addColorStop(1, "#c47100");
      ctx.fillStyle = coinGrad;
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // ₿ symbol
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${BALL_RADIUS}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("₿", 0, 1);

      // Glow
      ctx.shadowColor = "#f7931a";
      ctx.shadowBlur = 8;
      ctx.strokeStyle = "rgba(247,147,26,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // HUD — coins and bet
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.roundRect(6, 6, 120, 28, 6);
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`₿ ${coinsToBTC(s.coins)}`, 14, 20);

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.roundRect(CANVAS_W - 126, 6, 120, 28, 6);
    ctx.fill();
    ctx.fillStyle = "#a3e635";
    ctx.textAlign = "right";
    ctx.fillText(`Bet: ${s.currentBet}`, CANVAS_W - 14, 20);
  }, []);

  // ======================================
  // GAME LOOP
  // ======================================

  const gameLoop = useCallback((timestamp: number) => {
    const s = stateRef.current;
    if (s.status !== "playing" && s.status !== "countdown") return;

    if (s.status === "countdown") {
      draw();
      s.animId = requestAnimationFrame(gameLoop);
      return;
    }

    if (s.lastTime === 0) s.lastTime = timestamp;
    const dt = Math.min((timestamp - s.lastTime) / 16.67, 2);
    s.lastTime = timestamp;

    const pegs = pegsRef.current;
    const bucketW = CANVAS_W / NUM_BUCKETS;

    for (const ball of s.balls) {
      if (ball.landed) {
        // Fade out
        ball.alpha = Math.max(0, ball.alpha - 0.04 * dt);
        // Update particles
        for (const p of ball.particles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 0.1 * dt;
          p.life -= 0.035 * dt;
        }
        ball.particles = ball.particles.filter(p => p.life > 0);
        continue;
      }

      // Gravity
      ball.vy += GRAVITY * dt;

      // Cap velocity
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > BALL_MAX_VEL) {
        const scale = BALL_MAX_VEL / speed;
        ball.vx *= scale;
        ball.vy *= scale;
      }

      // Move
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Wall bounce
      if (ball.x - BALL_RADIUS < 0) { ball.x = BALL_RADIUS; ball.vx = Math.abs(ball.vx) * 0.7; }
      if (ball.x + BALL_RADIUS > CANVAS_W) { ball.x = CANVAS_W - BALL_RADIUS; ball.vx = -Math.abs(ball.vx) * 0.7; }

      // Peg collisions
      for (const peg of pegs) {
        const dx = ball.x - peg.x;
        const dy = ball.y - peg.y;
        const dist = Math.hypot(dx, dy);
        const minDist = BALL_RADIUS + PEG_RADIUS;
        if (dist < minDist && dist > 0.01) {
          const nx = dx / dist;
          const ny = dy / dist;
          // Push out
          ball.x = peg.x + nx * (minDist + 0.5);
          ball.y = peg.y + ny * (minDist + 0.5);
          // Reflect
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2 * dot * nx;
          ball.vy -= 2 * dot * ny;
          // Random lateral deflection (Plinko signature)
          const deflect = BOUNCE_DEFLECT_MIN + Math.random() * (BOUNCE_DEFLECT_MAX - BOUNCE_DEFLECT_MIN);
          ball.vx += Math.random() > 0.5 ? deflect : -deflect;
          // Damping
          ball.vx *= 0.85;
          ball.vy *= 0.88;
        }
      }

      // Force landing if ball has been alive too long
      if (!ball.landed && timestamp - ball.spawnedAt > BALL_MAX_LIFETIME_MS) {
        ball.x = Math.max(BALL_RADIUS, Math.min(CANVAS_W - BALL_RADIUS, ball.x));
        ball.y = BUCKET_Y;
      }

      // Bucket landing
      if (!ball.landed && ball.y + BALL_RADIUS >= BUCKET_Y) {
        ball.landed = true;
        ball.alpha = 1;
        const bucketIdx = Math.max(0, Math.min(NUM_BUCKETS - 1, Math.floor(ball.x / bucketW)));
        ball.landedBucketIdx = bucketIdx;
        const payout = Math.round(ball.bet * MULTIPLIERS[bucketIdx]);
        s.coins += payout;
        if (s.coins > s.maxCoins) s.maxCoins = s.coins;
        setCoins(s.coins);
        setLastBucketIdx(bucketIdx);
        spawnParticles(ball, BUCKET_COLORS[bucketIdx]);
      }
    }

    // Remove fully faded balls
    s.balls = s.balls.filter(b => !b.landed || b.alpha > 0 || b.particles.length > 0);

    // Win / lose check
    const allLanded = s.balls.every(b => b.landed);
    if (s.coins >= WIN_TARGET) {
      s.status = "finished";
      setStatus("processing");
      return;
    }
    if (allLanded && s.coins < s.currentBet) {
      s.status = "finished";
      setStatus("processing");
      return;
    }

    draw();
    s.animId = requestAnimationFrame(gameLoop);
  }, [draw]);

  // ======================================
  // FINALIZE
  // ======================================

  useEffect(() => {
    if (status !== "processing") return;
    const s = stateRef.current;
    const won = s.coins >= WIN_TARGET;
    finalizeGame(won, s.maxCoins, manualEndRef.current);
    manualEndRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const finalizeGame = useCallback(async (won: boolean, finalScore: number, manual = false) => {
    setResult(won ? "win" : "lose");
    setMessage(won ? "🏆 You reached 1 BTC!" : manual ? "🏁 Session terminée !" : "💸 Broke!");

    const raw = localStorage.getItem(STATS_KEY);
    const prev: PlayerStats = raw ? JSON.parse(raw) : DEFAULT_STATS;
    const next: PlayerStats = {
      games: prev.games + 1,
      wins: prev.wins + (won ? 1 : 0),
      highScore: Math.max(prev.highScore, finalScore),
      totalScore: prev.totalScore + finalScore,
    };
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
    setLocalStats(next);

    let txHash: string | undefined;

    if (mode === "onchain" && address && contractAddress && gameStartedOnChain) {
      try {
        txHash = await writeContractAsync({
          address: contractAddress,
          abi: PLINKO_ABI,
          functionName: "endGame",
          args: [BigInt(finalScore), BigInt(won ? 1 : 0)],
        });
        setGameStartedOnChain(false);
      } catch (err) {
        console.error("endGame tx failed:", err);
      }
    }

    await recordGameRef.current("plinko", mode, won ? "win" : "lose", txHash);
    setStatus("finished");
  }, [mode, address, contractAddress, gameStartedOnChain, writeContractAsync]);

  // ======================================
  // DROP BALL
  // ======================================

  const dropBall = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    if (s.coins < s.currentBet) return;
    s.coins -= s.currentBet;
    setCoins(s.coins);
    const jitter = (Math.random() - 0.5) * 8;
    s.balls.push({
      id: s.nextId++,
      x: Math.max(BALL_RADIUS + 5, Math.min(CANVAS_W - BALL_RADIUS - 5, s.aimX + jitter)),
      y: DROP_ZONE_Y,
      vx: 0,
      vy: 0.5,
      bet: s.currentBet,
      landed: false,
      landedBucketIdx: -1,
      particles: [],
      alpha: 1,
      spawnedAt: performance.now(),
    });
  }, []);

  // ======================================
  // AIM
  // ======================================

  const handleMouseMove = useCallback((clientX: number, rect: DOMRect) => {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    const scaleX = CANVAS_W / rect.width;
    s.aimX = Math.max(BALL_RADIUS + 10, Math.min(CANVAS_W - BALL_RADIUS - 10,
      (clientX - rect.left) * scaleX));
  }, []);

  const handleTouchMove = useCallback((clientX: number, rect: DOMRect) => {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    const scaleX = CANVAS_W / rect.width;
    s.aimX = Math.max(BALL_RADIUS + 10, Math.min(CANVAS_W - BALL_RADIUS - 10,
      (clientX - rect.left) * scaleX));
  }, []);

  const moveAim = useCallback((delta: number) => {
    const s = stateRef.current;
    s.aimX = Math.max(BALL_RADIUS + 10, Math.min(CANVAS_W - BALL_RADIUS - 10, s.aimX + delta));
  }, []);

  // ======================================
  // BET
  // ======================================

  const setBet = useCallback((bet: number) => {
    stateRef.current.currentBet = bet;
    setCurrentBetState(bet);
  }, []);

  // ======================================
  // START / STOP
  // ======================================

  const launchGame = useCallback(() => {
    const s = stateRef.current;
    if (s.animId) { cancelAnimationFrame(s.animId); s.animId = 0; }
    s.status = "playing";
    s.lastTime = 0;
    setStatus("playing");
    s.animId = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const startGame = useCallback(async () => {
    const s = stateRef.current;
    if (s.animId) cancelAnimationFrame(s.animId);

    s.balls = [];
    s.coins = INITIAL_COINS;
    s.maxCoins = INITIAL_COINS;
    s.aimX = CANVAS_W / 2;
    s.nextId = 0;
    s.lastTime = 0;
    s.status = "countdown";

    setCoins(INITIAL_COINS);
    setResult(null);
    setMessage("");
    setStatus("countdown");
    setCountdown(3);

    if (mode === "onchain" && address && contractAddress) {
      try {
        await writeContractAsync({
          address: contractAddress, abi: PLINKO_ABI,
          functionName: "startGame", args: [],
        });
        setGameStartedOnChain(true);
      } catch (err) {
        console.error("startGame tx failed:", err);
      }
    }

    s.animId = requestAnimationFrame(gameLoop);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else if (count === 0) {
        setCountdown(0);
      } else {
        clearInterval(interval);
        setCountdown(null);
        launchGame();
      }
    }, 1000);
  }, [mode, address, contractAddress, writeContractAsync, gameLoop, launchGame]);

  const stopGame = useCallback(() => {
    const s = stateRef.current;
    if (s.animId) cancelAnimationFrame(s.animId);
    s.status = "idle";
    setStatus("idle");
    setMessage("");
  }, []);

  // End session and record score (on-chain if applicable)
  const endGameManually = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    if (s.animId) { cancelAnimationFrame(s.animId); s.animId = 0; }
    manualEndRef.current = true;
    s.status = "finished";
    setStatus("processing");
  }, []);

  const setGameMode = useCallback((m: GameMode) => {
    setMode(m);
    stopGame();
  }, [stopGame]);

  // Cleanup
  useEffect(() => {
    return () => {
      const s = stateRef.current;
      if (s.animId) cancelAnimationFrame(s.animId);
    };
  }, []);

  const contractStats = onChainStats
    ? {
        games: Number((onChainStats as readonly bigint[])[0]),
        wins: Number((onChainStats as readonly bigint[])[1]),
        highScore: Number((onChainStats as readonly bigint[])[2]),
        totalScore: Number((onChainStats as readonly bigint[])[3]),
      }
    : null;

  const displayStats = mode === "onchain" && contractStats ? contractStats : localStats;

  return {
    canvasRef,
    coins,
    currentBet,
    mode,
    status,
    result,
    message,
    countdown,
    contractAddress,
    stats: displayStats,
    lastBucketIdx,
    startGame,
    stopGame,
    endGameManually,
    setGameMode,
    dropBall,
    setBet,
    handleMouseMove,
    handleTouchMove,
    moveAim,
    winTarget: WIN_TARGET,
  };
}
