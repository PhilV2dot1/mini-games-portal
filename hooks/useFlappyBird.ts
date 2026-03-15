"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getContractAddress } from "@/lib/contracts/addresses";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "countdown" | "playing" | "processing" | "finished";
export type GameResult = "win" | "lose" | null;

export interface PlayerStats {
  games: number;
  wins: number;
  highScore: number;
  totalScore: number;
}

// ========================================
// CONSTANTS
// ========================================

export const CANVAS_W = 400;
export const CANVAS_H = 560;

const BIRD_X = 80;
const BIRD_RADIUS = 18;
const GRAVITY = 0.14;        // slightly more gravity for better feel
const JUMP_VELOCITY = -3.2;  // small nudge — subtle trajectory change
const PIPE_WIDTH = 55;
const PIPE_GAP = 200;        // wide gap, very forgiving
const PIPE_SPEED_INIT = 1.6; // slow start
const PIPE_SPEED_INCREMENT = 0.08; // gradual speed increase
const PIPE_INTERVAL = 2200;  // lots of space between pipes
const GROUND_H = 60;
const WIN_SCORE = 30; // pipes passed to win

const STATS_KEY = "flappybird_stats";

const DEFAULT_STATS: PlayerStats = {
  games: 0,
  wins: 0,
  highScore: 0,
  totalScore: 0,
};

// Crypto logos to display on pipes (jsDelivr)
const CRYPTO_LOGOS = ["btc", "eth", "sol", "bnb", "xrp", "ada", "avax", "doge"];

// ========================================
// CONTRACT ABI
// ========================================

const FLAPPYBIRD_ABI = [
  {
    type: "function",
    name: "startGame",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "endGame",
    inputs: [
      { name: "score", type: "uint256" },
      { name: "survived", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPlayerStats",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "gamesPlayed", type: "uint256" },
      { name: "wins", type: "uint256" },
      { name: "highScore", type: "uint256" },
      { name: "totalScore", type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;

// ========================================
// HELPERS
// ========================================

interface Pipe {
  x: number;
  gapY: number; // center of the gap
  passed: boolean;
  logoIdx: number;
}

interface BirdState {
  y: number;
  vy: number;
  angle: number; // visual rotation in degrees
}

function makePipe(x: number): Pipe {
  const minGap = GROUND_H + PIPE_GAP / 2 + 20;
  const maxGap = CANVAS_H - GROUND_H - PIPE_GAP / 2 - 20;
  const gapY = minGap + Math.random() * (maxGap - minGap);
  return { x, gapY, passed: false, logoIdx: Math.floor(Math.random() * CRYPTO_LOGOS.length) };
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

export function useFlappyBird() {
  const [score, setScore] = useState(0);
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [result, setResult] = useState<GameResult>(null);
  const [message, setMessage] = useState("Click Start to play!");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [localStats, setLocalStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({
    bird: { y: CANVAS_H / 2, vy: 0, angle: 0 } as BirdState,
    pipes: [] as Pipe[],
    score: 0,
    pipeSpeed: PIPE_SPEED_INIT,
    nextPipeX: CANVAS_W + 100,
    status: "idle" as GameStatus,
    animId: 0,
    lastTime: 0,
    bgOffset: 0, // parallax
    groundOffset: 0,
    // pre-loaded logo images map
    logoImgs: {} as Record<string, HTMLImageElement>,
  });

  const { address, chainId } = useAccount();
  const contractAddress = getContractAddress("flappybird", chainId);
  const { writeContractAsync } = useWriteContract();

  const { data: onChainStats } = useReadContract({
    address: contractAddress ?? undefined,
    abi: FLAPPYBIRD_ABI,
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

  // Pre-load crypto logos
  useEffect(() => {
    CRYPTO_LOGOS.forEach((t) => { getLogoImg(t); });
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

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H - GROUND_H);
    sky.addColorStop(0, "#1a1a2e");
    sky.addColorStop(0.5, "#16213e");
    sky.addColorStop(1, "#0f3460");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H - GROUND_H);

    // Stars (static pattern)
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    const starPositions = [
      [30, 20], [80, 45], [150, 15], [220, 35], [290, 10],
      [360, 50], [50, 80], [130, 70], [200, 90], [310, 65],
      [380, 30], [240, 55], [170, 100], [340, 85], [90, 110],
    ];
    starPositions.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    });

    // Moon
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(360, 40, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#16213e";
    ctx.beginPath();
    ctx.arc(368, 36, 14, 0, Math.PI * 2);
    ctx.fill();

    // Ground
    const groundGrad = ctx.createLinearGradient(0, CANVAS_H - GROUND_H, 0, CANVAS_H);
    groundGrad.addColorStop(0, "#2d5a27");
    groundGrad.addColorStop(0.3, "#3d7a35");
    groundGrad.addColorStop(1, "#1a3a14");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, CANVAS_H - GROUND_H, CANVAS_W, GROUND_H);

    // Ground grid lines (moving)
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    const offset = s.groundOffset % gridSpacing;
    for (let x = -gridSpacing + offset; x < CANVAS_W + gridSpacing; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, CANVAS_H - GROUND_H);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }

    // Pipes
    for (const pipe of s.pipes) {
      const topH = pipe.gapY - PIPE_GAP / 2;
      const botY = pipe.gapY + PIPE_GAP / 2;
      const botH = CANVAS_H - GROUND_H - botY;

      // Pipe body gradient
      const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      pipeGrad.addColorStop(0, "#1a472a");
      pipeGrad.addColorStop(0.4, "#2d6a3f");
      pipeGrad.addColorStop(0.6, "#3d8a55");
      pipeGrad.addColorStop(1, "#1a472a");

      // Top pipe
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topH);

      // Top pipe cap
      const capW = PIPE_WIDTH + 10;
      ctx.fillStyle = "#2d6a3f";
      ctx.beginPath();
      ctx.roundRect(pipe.x - 5, topH - 22, capW, 22, [0, 0, 4, 4]);
      ctx.fill();
      ctx.strokeStyle = "#1a472a";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bottom pipe
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(pipe.x, botY, PIPE_WIDTH, botH);

      // Bottom pipe cap
      ctx.fillStyle = "#2d6a3f";
      ctx.beginPath();
      ctx.roundRect(pipe.x - 5, botY, capW, 22, [4, 4, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = "#1a472a";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Crypto logo on top pipe cap
      const logo = getLogoImg(CRYPTO_LOGOS[pipe.logoIdx]);
      const logoSize = 32;
      const logoX = pipe.x + PIPE_WIDTH / 2 - logoSize / 2;
      const logoY = topH - 22 + (22 - logoSize) / 2;
      try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      } catch {}
    }

    // Bird
    const bird = s.bird;
    ctx.save();
    ctx.translate(BIRD_X, bird.y);
    ctx.rotate((bird.angle * Math.PI) / 180);

    // Bird body (coin shape)
    const coinGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, BIRD_RADIUS);
    coinGrad.addColorStop(0, "#ffd700");
    coinGrad.addColorStop(0.6, "#f7931a");
    coinGrad.addColorStop(1, "#c47100");
    ctx.fillStyle = coinGrad;
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Bitcoin ₿ symbol
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${BIRD_RADIUS}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("₿", 0, 1);

    // Glow
    ctx.shadowColor = "#f7931a";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(247,147,26,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Score display
    ctx.fillStyle = "#fff";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText(String(s.score), CANVAS_W / 2, 16);
    ctx.shadowBlur = 0;
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

    // Initialize lastTime on first playing frame to avoid huge dt
    if (s.lastTime === 0) s.lastTime = timestamp;
    const dt = Math.min((timestamp - s.lastTime) / 16.67, 2); // normalized: 1.0 = 60fps frame
    s.lastTime = timestamp;

    // Parallax ground
    s.groundOffset += s.pipeSpeed * dt;

    // Bird physics (dt-normalized)
    s.bird.vy += GRAVITY * dt;
    s.bird.y += s.bird.vy * dt;
    s.bird.angle = Math.min(90, Math.max(-30, s.bird.vy * 5));

    // Ground / ceiling collision
    if (s.bird.y + BIRD_RADIUS >= CANVAS_H - GROUND_H || s.bird.y - BIRD_RADIUS <= 0) {
      s.status = "finished";
      setScore(s.score);
      setStatus("processing");
      return;
    }

    // Move pipes + spawn
    for (const pipe of s.pipes) {
      pipe.x -= s.pipeSpeed * dt;

      // Passed pipe → score
      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        s.score++;
        setScore(s.score);

        // Speed up every 5 pipes
        if (s.score % 5 === 0) {
          s.pipeSpeed += PIPE_SPEED_INCREMENT;
        }

        // Win condition
        if (s.score >= WIN_SCORE) {
          s.status = "finished";
          setStatus("processing");
          return;
        }
      }

      // Bird ↔ pipe collision
      const topH = pipe.gapY - PIPE_GAP / 2;
      const botY = pipe.gapY + PIPE_GAP / 2;
      const birdLeft = BIRD_X - BIRD_RADIUS + 4;
      const birdRight = BIRD_X + BIRD_RADIUS - 4;
      const birdTop = s.bird.y - BIRD_RADIUS + 4;
      const birdBot = s.bird.y + BIRD_RADIUS - 4;

      const inPipeX = birdRight > pipe.x + 5 && birdLeft < pipe.x + PIPE_WIDTH - 5;
      if (inPipeX && (birdTop < topH || birdBot > botY)) {
        s.status = "finished";
        setScore(s.score);
        setStatus("processing");
        return;
      }
    }

    // Remove off-screen pipes
    s.pipes = s.pipes.filter((p) => p.x + PIPE_WIDTH > -10);

    // Spawn new pipe
    const lastPipe = s.pipes[s.pipes.length - 1];
    if (!lastPipe || lastPipe.x < CANVAS_W - PIPE_INTERVAL) {
      s.pipes.push(makePipe(CANVAS_W + 20));
    }

    draw();
    s.animId = requestAnimationFrame(gameLoop);
  }, [draw]);

  // ======================================
  // FINALIZE GAME
  // ======================================

  useEffect(() => {
    if (status !== "processing") return;
    const s = stateRef.current;
    const won = s.score >= WIN_SCORE;
    finalizeGame(won, s.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const finalizeGame = useCallback(async (won: boolean, finalScore: number) => {
    const res: GameResult = won ? "win" : "lose";
    setResult(res);
    setMessage(won ? "🎉 You reached 30 pipes!" : "💥 Crash!");

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

    if (mode === "onchain" && address && contractAddress && gameStartedOnChain) {
      try {
        await writeContractAsync({
          address: contractAddress,
          abi: FLAPPYBIRD_ABI,
          functionName: "endGame",
          args: [BigInt(finalScore), BigInt(won ? 1 : 0)],
        });
        setGameStartedOnChain(false);
      } catch (err) {
        console.error("endGame tx failed:", err);
      }
    }

    setStatus("finished");
  }, [mode, address, contractAddress, gameStartedOnChain, writeContractAsync]);

  // ======================================
  // JUMP
  // ======================================

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    s.bird.vy = JUMP_VELOCITY;
  }, []);

  // ======================================
  // START / STOP
  // ======================================

  const launchGame = useCallback(() => {
    const s = stateRef.current;
    // Cancel any existing RAF (countdown loop) before starting play loop
    if (s.animId) {
      cancelAnimationFrame(s.animId);
      s.animId = 0;
    }
    s.status = "playing";
    s.lastTime = 0; // will be set on first frame
    setStatus("playing");
    s.animId = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const startGame = useCallback(async () => {
    const s = stateRef.current;
    if (s.animId) cancelAnimationFrame(s.animId);

    s.bird = { y: CANVAS_H / 2, vy: 0, angle: 0 };
    s.pipes = [];
    s.score = 0;
    s.pipeSpeed = PIPE_SPEED_INIT;
    s.nextPipeX = CANVAS_W + 100;
    s.groundOffset = 0;
    s.status = "countdown";
    // Spawn first pipe a bit off-screen
    s.pipes.push(makePipe(CANVAS_W + 80));

    setScore(0);
    setResult(null);
    setMessage("");
    setStatus("countdown");
    setCountdown(3);

    if (mode === "onchain" && address && contractAddress) {
      try {
        await writeContractAsync({
          address: contractAddress,
          abi: FLAPPYBIRD_ABI,
          functionName: "startGame",
          args: [],
        });
        setGameStartedOnChain(true);
      } catch (err) {
        console.error("startGame tx failed:", err);
      }
    }

    s.lastTime = performance.now();
    s.animId = requestAnimationFrame(gameLoop);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
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
    setMessage("Click Start to play!");
  }, []);

  const setGameMode = useCallback((m: GameMode) => {
    setMode(m);
    stopGame();
  }, [stopGame]);

  // Cleanup on unmount
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
    score,
    mode,
    status,
    result,
    message,
    countdown,
    gameStartedOnChain,
    isOnChainActive: false,
    contractAddress,
    stats: displayStats,
    startGame,
    stopGame,
    setGameMode,
    jump,
    winScore: WIN_SCORE,
  };
}
