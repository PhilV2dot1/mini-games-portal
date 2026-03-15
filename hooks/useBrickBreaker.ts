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

export interface Vec2 { x: number; y: number; }

export interface Ball {
  pos: Vec2;
  vel: Vec2;
  radius: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;       // hits remaining
  maxHp: number;
  color: string;
  hasPowerUp: boolean;
}

export type PowerUpType = "wide" | "multi" | "laser";

export interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  type: PowerUpType;
}

export interface PlayerStats {
  games: number;
  wins: number;
  highScore: number;
  totalScore: number;
  highestLevel: number;
}

// ========================================
// CONSTANTS
// ========================================

export const CANVAS_W = 400;
export const CANVAS_H = 560;
export const PADDLE_W = 80;
export const PADDLE_H = 12;
export const PADDLE_Y = CANVAS_H - 30;
export const BALL_RADIUS = 8;
export const BALL_SPEED = 3;
export const BRICK_ROWS = 5;
export const BRICK_COLS = 8;
export const BRICK_PADDING = 4;
export const BRICK_OFFSET_TOP = 60;
export const BRICK_OFFSET_LEFT = 10;
export const POWERUP_W = 28;
export const POWERUP_H = 14;
export const POWERUP_CHANCE = 0.2;
export const WIDE_DURATION = 8000; // ms
export const LASER_DURATION = 6000; // ms
export const MAX_LIVES = 3;
export const MAX_LEVELS = 3;

const STATS_KEY = "brickbreaker_stats";

const DEFAULT_STATS: PlayerStats = {
  games: 0,
  wins: 0,
  highScore: 0,
  totalScore: 0,
  highestLevel: 0,
};

// Brick colors per HP level
const BRICK_COLORS: Record<number, string> = {
  1: "#60a5fa", // blue-400
  2: "#f59e0b", // amber-400
  3: "#ef4444", // red-500
};

// Points per brick per level
const BRICK_POINTS = [10, 15, 25];

// Contract ABI
const BRICKBREAKER_ABI = [
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
      { name: "level", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "abandonGame",
    inputs: [],
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
      { name: "highestLevel", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isGameActive",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

// ========================================
// HELPERS
// ========================================

function buildBricks(level: number): Brick[] {
  const bricks: Brick[] = [];
  const brickW = (CANVAS_W - BRICK_OFFSET_LEFT * 2 - BRICK_PADDING * (BRICK_COLS - 1)) / BRICK_COLS;
  const brickH = 20;
  const rows = BRICK_ROWS + (level - 1); // more rows per level

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      // Higher levels: more multi-hit bricks
      let hp = 1;
      if (level >= 2 && r < 2) hp = 2;
      if (level >= 3 && r < 1) hp = 3;

      const hasPowerUp = Math.random() < POWERUP_CHANCE;
      bricks.push({
        x: BRICK_OFFSET_LEFT + c * (brickW + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + r * (brickH + BRICK_PADDING),
        width: brickW,
        height: brickH,
        hp,
        maxHp: hp,
        color: BRICK_COLORS[hp] ?? "#60a5fa",
        hasPowerUp,
      });
    }
  }
  return bricks;
}

function initialBall(paddleX: number, level: number = 1): Ball {
  const speed = BALL_SPEED + (level - 1) * 0.8;
  return {
    pos: { x: paddleX + PADDLE_W / 2, y: PADDLE_Y - BALL_RADIUS - 2 },
    vel: { x: speed * (Math.random() > 0.5 ? 1 : -1) * 0.6, y: -speed },
    radius: BALL_RADIUS,
  };
}

function initialPaddle(): Paddle {
  return {
    x: CANVAS_W / 2 - PADDLE_W / 2,
    y: PADDLE_Y,
    width: PADDLE_W,
    height: PADDLE_H,
  };
}

// ========================================
// HOOK
// ========================================

export function useBrickBreaker() {
  // Game state (rendered via canvas — stored in ref for RAF loop)
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [level, setLevel] = useState(1);
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [result, setResult] = useState<GameResult>(null);
  const [message, setMessage] = useState("Click Start to begin!");
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);
  const [localStats, setLocalStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Power-up timers (UI display)
  const [wideActive, setWideActive] = useState(false);
  const [laserActive, setLaserActive] = useState(false);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state ref (mutable, used in RAF loop)
  const stateRef = useRef({
    balls: [] as Ball[],
    paddle: initialPaddle(),
    bricks: [] as Brick[],
    powerUps: [] as PowerUp[],
    laserBolts: [] as Array<{ x: number; y: number; vy: number }>,
    score: 0,
    lives: MAX_LIVES,
    level: 1,
    status: "idle" as GameStatus,
    wideTimer: 0,
    laserTimer: 0,
    paddleTargetX: CANVAS_W / 2 - PADDLE_W / 2,
    animId: 0,
    lastTime: 0,
    shooting: false,
    respawnTimer: 0, // ms remaining before next ball spawns after losing a life
  });

  // Wallet / contract
  const { address, chainId } = useAccount();
  const contractAddress = getContractAddress("brickbreaker", chainId);

  const { writeContractAsync } = useWriteContract();

  const { data: onChainStats } = useReadContract({
    address: contractAddress ?? undefined,
    abi: BRICKBREAKER_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddress },
  });

  const { data: isOnChainActive } = useReadContract({
    address: contractAddress ?? undefined,
    abi: BRICKBREAKER_ABI,
    functionName: "isGameActive",
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

  // ======================================
  // DRAW
  // ======================================

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    // Clear
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Bricks
    for (const brick of s.bricks) {
      const alpha = 0.4 + 0.6 * (brick.hp / brick.maxHp);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = brick.color;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
      ctx.fill();

      // HP indicator dots
      if (brick.maxHp > 1) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        for (let i = 0; i < brick.hp; i++) {
          ctx.beginPath();
          ctx.arc(brick.x + 6 + i * 8, brick.y + brick.height / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Power-up indicator
      if (brick.hasPowerUp) {
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2, 3);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Power-ups
    for (const pu of s.powerUps) {
      ctx.fillStyle = pu.type === "wide" ? "#f59e0b" : pu.type === "multi" ? "#a78bfa" : "#f472b6";
      ctx.beginPath();
      ctx.roundRect(pu.x, pu.y, pu.width, pu.height, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = pu.type === "wide" ? "WIDE" : pu.type === "multi" ? "MULTI" : "LASER";
      ctx.fillText(label, pu.x + pu.width / 2, pu.y + pu.height / 2);
    }

    // Laser bolts
    ctx.fillStyle = "#f472b6";
    for (const bolt of s.laserBolts) {
      ctx.fillRect(bolt.x - 2, bolt.y, 4, 12);
    }

    // Balls
    for (const ball of s.balls) {
      const ballGrad = ctx.createRadialGradient(ball.pos.x - 2, ball.pos.y - 2, 1, ball.pos.x, ball.pos.y, ball.radius);
      ballGrad.addColorStop(0, "#e0f2fe");
      ballGrad.addColorStop(1, "#38bdf8");
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Paddle
    const padGrad = ctx.createLinearGradient(s.paddle.x, s.paddle.y, s.paddle.x, s.paddle.y + s.paddle.height);
    padGrad.addColorStop(0, s.wideTimer > 0 ? "#f59e0b" : "#38bdf8");
    padGrad.addColorStop(1, s.wideTimer > 0 ? "#d97706" : "#0284c7");
    ctx.fillStyle = padGrad;
    ctx.beginPath();
    ctx.roundRect(s.paddle.x, s.paddle.y, s.paddle.width, s.paddle.height, 6);
    ctx.fill();
  }, []);

  // ======================================
  // GAME LOOP
  // ======================================

  const gameLoop = useCallback((timestamp: number) => {
    const s = stateRef.current;
    if (s.status !== "playing" && s.status !== "countdown") return;
    if (s.status === "countdown") { draw(); s.animId = requestAnimationFrame(gameLoop); return; }

    const dt = Math.min(timestamp - s.lastTime, 32); // cap at 32ms
    s.lastTime = timestamp;

    // Direct paddle movement — no lag
    s.paddle.x = Math.max(0, Math.min(CANVAS_W - s.paddle.width, s.paddleTargetX));

    const scoreGained = { v: 0 };
    const toRemoveBalls: number[] = [];

    // Update balls
    for (let bi = 0; bi < s.balls.length; bi++) {
      const ball = s.balls[bi];
      ball.pos.x += ball.vel.x;
      ball.pos.y += ball.vel.y;

      // Wall bounces
      if (ball.pos.x - ball.radius < 0) { ball.pos.x = ball.radius; ball.vel.x = Math.abs(ball.vel.x); }
      if (ball.pos.x + ball.radius > CANVAS_W) { ball.pos.x = CANVAS_W - ball.radius; ball.vel.x = -Math.abs(ball.vel.x); }
      if (ball.pos.y - ball.radius < 0) { ball.pos.y = ball.radius; ball.vel.y = Math.abs(ball.vel.y); }

      // Paddle collision
      if (
        ball.vel.y > 0 &&
        ball.pos.y + ball.radius >= s.paddle.y &&
        ball.pos.y + ball.radius <= s.paddle.y + s.paddle.height + 4 &&
        ball.pos.x >= s.paddle.x &&
        ball.pos.x <= s.paddle.x + s.paddle.width
      ) {
        ball.vel.y = -Math.abs(ball.vel.y);
        // Add angle based on hit position
        const hitPos = (ball.pos.x - s.paddle.x) / s.paddle.width; // 0..1
        ball.vel.x = (hitPos - 0.5) * BALL_SPEED * 2;
        // Normalize speed
        const speed2 = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);
        const target = BALL_SPEED + (s.level - 1) * 0.8;
        ball.vel.x = (ball.vel.x / speed2) * target;
        ball.vel.y = (ball.vel.y / speed2) * target;
      }

      // Brick collisions
      for (let i = s.bricks.length - 1; i >= 0; i--) {
        const b = s.bricks[i];
        if (
          ball.pos.x + ball.radius > b.x &&
          ball.pos.x - ball.radius < b.x + b.width &&
          ball.pos.y + ball.radius > b.y &&
          ball.pos.y - ball.radius < b.y + b.height
        ) {
          // Determine collision side
          const overlapLeft = ball.pos.x + ball.radius - b.x;
          const overlapRight = b.x + b.width - (ball.pos.x - ball.radius);
          const overlapTop = ball.pos.y + ball.radius - b.y;
          const overlapBottom = b.y + b.height - (ball.pos.y - ball.radius);
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft || minOverlap === overlapRight) ball.vel.x *= -1;
          else ball.vel.y *= -1;

          b.hp--;
          if (b.hp <= 0) {
            // Drop power-up
            if (b.hasPowerUp) {
              const types: PowerUpType[] = ["wide", "multi", "laser"];
              const type = types[Math.floor(Math.random() * types.length)];
              s.powerUps.push({
                x: b.x + b.width / 2 - POWERUP_W / 2,
                y: b.y,
                width: POWERUP_W,
                height: POWERUP_H,
                vy: 2,
                type,
              });
            }
            scoreGained.v += BRICK_POINTS[s.level - 1] ?? 10;
            s.bricks.splice(i, 1);
          } else {
            // Update color
            b.color = BRICK_COLORS[b.hp] ?? "#60a5fa";
          }
          break;
        }
      }

      // Ball falls below paddle
      if (ball.pos.y - ball.radius > CANVAS_H) {
        toRemoveBalls.push(bi);
      }
    }

    // Remove fallen balls
    for (let i = toRemoveBalls.length - 1; i >= 0; i--) {
      s.balls.splice(toRemoveBalls[i], 1);
    }

    // Respawn timer — wait 1s before new ball appears after losing a life
    if (s.respawnTimer > 0) {
      s.respawnTimer -= dt;
      if (s.respawnTimer <= 0) {
        s.respawnTimer = 0;
        s.balls = [initialBall(s.paddle.x, s.level)];
      }
      draw();
      s.animId = requestAnimationFrame(gameLoop);
      return;
    }

    // If no balls left — lose a life
    if (s.balls.length === 0) {
      s.lives--;
      setLives(s.lives);
      if (s.lives <= 0) {
        s.status = "finished";
        setStatus("processing");
        return;
      }
      // Start 1s respawn delay
      s.respawnTimer = 1000;
    }

    // Update power-ups
    for (let i = s.powerUps.length - 1; i >= 0; i--) {
      const pu = s.powerUps[i];
      pu.y += pu.vy;

      // Caught by paddle
      if (
        pu.y + pu.height >= s.paddle.y &&
        pu.y <= s.paddle.y + s.paddle.height &&
        pu.x + pu.width >= s.paddle.x &&
        pu.x <= s.paddle.x + s.paddle.width
      ) {
        if (pu.type === "wide") {
          s.paddle.width = PADDLE_W * 1.8;
          s.wideTimer = WIDE_DURATION;
          setWideActive(true);
        } else if (pu.type === "multi") {
          // Spawn 2 extra balls from current balls
          const extras = s.balls.slice(0, 1).flatMap(b => [
            { ...b, vel: { x: b.vel.x + 1, y: b.vel.y }, pos: { ...b.pos } },
            { ...b, vel: { x: b.vel.x - 1, y: b.vel.y }, pos: { ...b.pos } },
          ]);
          s.balls.push(...extras);
        } else if (pu.type === "laser") {
          s.laserTimer = LASER_DURATION;
          s.shooting = true;
          setLaserActive(true);
        }
        s.powerUps.splice(i, 1);
      } else if (pu.y > CANVAS_H) {
        s.powerUps.splice(i, 1);
      }
    }

    // Laser shooting
    if (s.shooting && s.laserTimer > 0) {
      // Fire every 20 frames
      if (Math.floor(timestamp / 80) % 2 === 0) {
        s.laserBolts.push(
          { x: s.paddle.x + 8, y: s.paddle.y, vy: -10 },
          { x: s.paddle.x + s.paddle.width - 8, y: s.paddle.y, vy: -10 }
        );
      }
    }

    // Update laser bolts
    for (let i = s.laserBolts.length - 1; i >= 0; i--) {
      const bolt = s.laserBolts[i];
      bolt.y += bolt.vy;
      if (bolt.y < 0) { s.laserBolts.splice(i, 1); continue; }
      // Brick collision
      let hit = false;
      for (let j = s.bricks.length - 1; j >= 0; j--) {
        const b = s.bricks[j];
        if (bolt.x >= b.x && bolt.x <= b.x + b.width && bolt.y >= b.y && bolt.y <= b.y + b.height) {
          b.hp--;
          if (b.hp <= 0) {
            scoreGained.v += BRICK_POINTS[s.level - 1] ?? 10;
            s.bricks.splice(j, 1);
          }
          hit = true;
          break;
        }
      }
      if (hit) s.laserBolts.splice(i, 1);
    }

    // Power-up timers
    if (s.wideTimer > 0) {
      s.wideTimer -= dt;
      if (s.wideTimer <= 0) {
        s.paddle.width = PADDLE_W;
        setWideActive(false);
      }
    }
    if (s.laserTimer > 0) {
      s.laserTimer -= dt;
      if (s.laserTimer <= 0) {
        s.shooting = false;
        setLaserActive(false);
      }
    }

    // Apply score
    if (scoreGained.v > 0) {
      s.score += scoreGained.v;
      setScore(s.score);
    }

    // Level complete
    if (s.bricks.length === 0) {
      if (s.level >= MAX_LEVELS) {
        s.status = "finished";
        setStatus("processing");
        return;
      } else {
        s.level++;
        setLevel(s.level);
        s.bricks = buildBricks(s.level);
        s.powerUps = [];
        s.laserBolts = [];
        s.wideTimer = 0;
        s.laserTimer = 0;
        s.paddle.width = PADDLE_W;
        s.shooting = false;
        setWideActive(false);
        setLaserActive(false);
        s.balls = [initialBall(s.paddle.x, s.level)];
      }
    }

    draw();
    s.animId = requestAnimationFrame(gameLoop);
  }, [draw]);

  // ======================================
  // ON STATUS "processing" → finalize
  // ======================================

  useEffect(() => {
    if (status !== "processing") return;
    const s = stateRef.current;
    const won = s.level >= MAX_LEVELS && s.bricks.length === 0 && s.lives > 0;
    finalizeGame(won, s.score, s.level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const finalizeGame = useCallback(async (won: boolean, finalScore: number, finalLevel: number) => {
    const res: GameResult = won ? "win" : "lose";
    setResult(res);
    setMessage(won ? "🎉 You cleared all levels!" : "💥 Game Over!");

    // Update local stats
    const raw = localStorage.getItem(STATS_KEY);
    const prev: PlayerStats = raw ? JSON.parse(raw) : DEFAULT_STATS;
    const next: PlayerStats = {
      games: prev.games + 1,
      wins: prev.wins + (won ? 1 : 0),
      highScore: Math.max(prev.highScore, finalScore),
      totalScore: prev.totalScore + finalScore,
      highestLevel: Math.max(prev.highestLevel, finalLevel),
    };
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
    setLocalStats(next);

    // On-chain recording
    if (mode === "onchain" && address && contractAddress) {
      try {
        await writeContractAsync({
          address: contractAddress,
          abi: BRICKBREAKER_ABI,
          functionName: "endGame",
          args: [BigInt(finalScore), finalLevel as unknown as never],
        });
        setGameStartedOnChain(false);
      } catch (err) {
        console.error("endGame tx failed:", err);
      }
    }

    setStatus("finished");
  }, [mode, address, contractAddress, writeContractAsync]);

  // ======================================
  // CONTROLS
  // ======================================

  const movePaddleTo = useCallback((clientX: number, canvasRect: DOMRect) => {
    const relX = clientX - canvasRect.left;
    const scaleX = CANVAS_W / canvasRect.width;
    const targetX = relX * scaleX - stateRef.current.paddle.width / 2;
    stateRef.current.paddleTargetX = Math.max(0, Math.min(CANVAS_W - stateRef.current.paddle.width, targetX));
  }, []);

  const movePaddleByDelta = useCallback((delta: number) => {
    stateRef.current.paddleTargetX = Math.max(
      0,
      Math.min(CANVAS_W - stateRef.current.paddle.width, stateRef.current.paddleTargetX + delta)
    );
  }, []);

  // ======================================
  // START / STOP
  // ======================================

  // Launch the RAF loop (called after countdown ends)
  const launchGame = useCallback(() => {
    const s = stateRef.current;
    s.status = "playing";
    s.lastTime = performance.now();
    setStatus("playing");
    s.animId = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const startGame = useCallback(async () => {
    const s = stateRef.current;
    if (s.animId) cancelAnimationFrame(s.animId);

    // Reset game state
    s.score = 0;
    s.lives = MAX_LIVES;
    s.level = 1;
    s.status = "countdown";
    s.balls = [initialBall(CANVAS_W / 2 - PADDLE_W / 2, 1)];
    s.paddle = initialPaddle();
    s.bricks = buildBricks(1);
    s.powerUps = [];
    s.laserBolts = [];
    s.wideTimer = 0;
    s.laserTimer = 0;
    s.shooting = false;
    s.respawnTimer = 0;
    s.paddleTargetX = s.paddle.x;

    setScore(0);
    setLives(MAX_LIVES);
    setLevel(1);
    setResult(null);
    setWideActive(false);
    setLaserActive(false);
    setMessage("");
    setStatus("countdown");

    // On-chain start
    if (mode === "onchain" && address && contractAddress) {
      try {
        await writeContractAsync({
          address: contractAddress,
          abi: BRICKBREAKER_ABI,
          functionName: "startGame",
          args: [],
        });
        setGameStartedOnChain(true);
      } catch (err) {
        console.error("startGame tx failed:", err);
      }
    }

    // Draw initial frame while counting down
    s.lastTime = performance.now();
    s.animId = requestAnimationFrame(gameLoop);

    // Countdown 3 → 2 → 1 → Go! → play
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else if (count === 0) {
        setCountdown(0); // "GO!"
      } else {
        clearInterval(interval);
        setCountdown(null);
        launchGame();
      }
    }, 1000);
  }, [mode, address, contractAddress, writeContractAsync, launchGame]);

  const stopGame = useCallback(() => {
    const s = stateRef.current;
    if (s.animId) cancelAnimationFrame(s.animId);
    s.status = "idle";
    setStatus("idle");
    setMessage("Click Start to begin!");
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
        highestLevel: Number((onChainStats as readonly bigint[])[4]),
      }
    : null;

  const displayStats = mode === "onchain" && contractStats ? contractStats : localStats;

  return {
    // Refs
    canvasRef,
    // State
    score,
    lives,
    level,
    mode,
    status,
    result,
    message,
    countdown,
    wideActive,
    laserActive,
    gameStartedOnChain,
    isOnChainActive: isOnChainActive ?? false,
    contractAddress,
    // Stats
    stats: displayStats,
    // Actions
    startGame,
    stopGame,
    setGameMode,
    movePaddleTo,
    movePaddleByDelta,
  };
}
