"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useLocalStats } from "@/hooks/useLocalStats";
import { getContractAddress } from "@/lib/contracts/addresses";

const SPACEINVADERS_ABI = [
  { type: "function", name: "startSession",  inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "endSession",    inputs: [{ name: "gamesPlayed", type: "uint256" }, { name: "gamesWon", type: "uint256" }, { name: "bestScore", type: "uint256" }, { name: "bestWave", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "abandonSession", inputs: [], outputs: [], stateMutability: "nonpayable" },
] as const;

// ========================================
// TYPES
// ========================================

export type GameStatus = "idle" | "countdown" | "playing" | "gameover" | "victory";
export type GameMode = "free" | "onchain";

export interface SpaceInvadersStats {
  games: number;
  wins: number;
  highScore: number;
  wave: number;
}

// ========================================
// CONSTANTS
// ========================================

export const CANVAS_W = 480;
export const CANVAS_H = 560;

const ROWS = 5;
const COLS = 10;
const ENEMY_W = 32;
const ENEMY_H = 24;
const ENEMY_H_GAP = 20;
const ENEMY_V_GAP = 14;
const ENEMY_TOP = 60;
const ENEMY_LEFT_MARGIN = 20;

const PLAYER_W = 42;
const PLAYER_H = 24;
const PLAYER_Y_OFFSET = 30;
const PLAYER_SPEED = 4;
const PLAYER_BULLET_SPEED = 8;
const PLAYER_BULLET_COOLDOWN = 300; // ms

const ENEMY_BULLET_W = 4;
const ENEMY_BULLET_H = 10;
const ENEMY_BULLET_SPEED = 3.5;

const BUNKER_COLS = 4;
const BUNKER_BLOCK_SIZE = 6;
const BUNKER_W = 10 * BUNKER_BLOCK_SIZE; // 60
const BUNKER_H = 8 * BUNKER_BLOCK_SIZE;  // 48

const UFO_SPEED = 1.8;
const UFO_W = 48;
const UFO_H = 20;
const UFO_POINTS = 500;
const UFO_WAVE_INTERVAL = 3; // every 3 waves

const STATS_KEY = "spaceinvaders_stats";

const DEFAULT_STATS: SpaceInvadersStats = {
  games: 0,
  wins: 0,
  highScore: 0,
  wave: 0,
};

// ========================================
// GAME OBJECTS
// ========================================

interface Enemy {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  type: 0 | 1 | 2; // 0=top, 1=mid, 2=bottom
  alive: boolean;
  frame: number; // animation frame 0/1
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  fromPlayer: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1
  color: string;
  size: number;
}

interface BunkerBlock {
  x: number;
  y: number;
  hp: number; // 3 = full, 0 = destroyed
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

interface UFO {
  x: number;
  y: number;
  active: boolean;
  direction: 1 | -1;
}

// ========================================
// BUNKER SHAPE (10×8 grid, 1=block)
// ========================================

const BUNKER_TEMPLATE: number[][] = [
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
];

function makeBunkers(): BunkerBlock[][] {
  // 4 bunkers evenly spaced
  const bunkers: BunkerBlock[][] = [];
  const totalBunkerWidth = BUNKER_COLS * BUNKER_W + (BUNKER_COLS - 1) * 20;
  const startX = (CANVAS_W - totalBunkerWidth) / 2;
  const bunkerY = CANVAS_H - 130;

  for (let b = 0; b < BUNKER_COLS; b++) {
    const bx = startX + b * (BUNKER_W + 20);
    const blocks: BunkerBlock[] = [];
    for (let row = 0; row < BUNKER_TEMPLATE.length; row++) {
      for (let col = 0; col < BUNKER_TEMPLATE[row].length; col++) {
        if (BUNKER_TEMPLATE[row][col] === 1) {
          blocks.push({
            x: bx + col * BUNKER_BLOCK_SIZE,
            y: bunkerY + row * BUNKER_BLOCK_SIZE,
            hp: 3,
          });
        }
      }
    }
    bunkers.push(blocks);
  }
  return bunkers;
}

function makeEnemies(wave: number): Enemy[] {
  const enemies: Enemy[] = [];
  let id = 0;
  const totalW = COLS * ENEMY_W + (COLS - 1) * ENEMY_H_GAP;
  const startX = (CANVAS_W - totalW) / 2;

  // Push down on later waves (capped)
  const waveOffset = Math.min(wave * 4, 40);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const type: 0 | 1 | 2 = row < 1 ? 0 : row < 3 ? 1 : 2;
      enemies.push({
        id: id++,
        row,
        col,
        x: startX + col * (ENEMY_W + ENEMY_H_GAP),
        y: ENEMY_TOP + waveOffset + row * (ENEMY_H + ENEMY_V_GAP),
        type,
        alive: true,
        frame: 0,
      });
    }
  }
  return enemies;
}

function makeStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      brightness: Math.random() * 0.6 + 0.4,
    });
  }
  return stars;
}

// ========================================
// DRAWING HELPERS
// ========================================

function drawGlow(ctx: CanvasRenderingContext2D, color: string, blur: number) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function clearGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  const { x, y, type, frame } = e;
  const cx = x + ENEMY_W / 2;
  const cy = y + ENEMY_H / 2;

  if (type === 0) {
    // Round alien with antennae (top row) — cyan
    drawGlow(ctx, "#00FFFF", 8);
    ctx.fillStyle = "#00FFCC";
    // Body
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 10, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#001A1A";
    ctx.beginPath();
    ctx.arc(cx - 4, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    // Antennae
    ctx.strokeStyle = "#00FFCC";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 8);
    ctx.lineTo(cx - 7, cy - 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 5, cy - 8);
    ctx.lineTo(cx + 7, cy - 14);
    ctx.stroke();
    // Antennae tips
    ctx.fillStyle = "#00FFCC";
    ctx.beginPath();
    ctx.arc(cx - 7, cy - 14, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 7, cy - 14, 2, 0, Math.PI * 2);
    ctx.fill();
    // Bottom legs (animated)
    const legOffset = frame === 0 ? 2 : -2;
    ctx.strokeStyle = "#00FFCC";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 10);
    ctx.lineTo(cx - 10, cy + 14 + legOffset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy + 10);
    ctx.lineTo(cx + 10, cy + 14 + legOffset);
    ctx.stroke();
  } else if (type === 1) {
    // Crab alien (middle rows) — green
    drawGlow(ctx, "#00FF88", 8);
    ctx.fillStyle = "#22FF88";
    // Body rectangle
    ctx.beginPath();
    ctx.roundRect(cx - 13, cy - 8, 26, 16, 4);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#001100";
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 5, cy - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Claws (animated)
    const clawOffset = frame === 0 ? 2 : -1;
    ctx.fillStyle = "#22FF88";
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy);
    ctx.lineTo(cx - 18, cy - 4 - clawOffset);
    ctx.lineTo(cx - 20, cy);
    ctx.lineTo(cx - 18, cy + 4 + clawOffset);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 13, cy);
    ctx.lineTo(cx + 18, cy - 4 - clawOffset);
    ctx.lineTo(cx + 20, cy);
    ctx.lineTo(cx + 18, cy + 4 + clawOffset);
    ctx.closePath();
    ctx.fill();
    // Bottom legs
    ctx.strokeStyle = "#22FF88";
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 5, cy + 8);
      ctx.lineTo(cx + i * 7, cy + 13);
      ctx.stroke();
    }
  } else {
    // Squid alien (bottom rows) — lime green
    drawGlow(ctx, "#88FF00", 8);
    ctx.fillStyle = "#AAFF44";
    // Bell shape
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 12, Math.PI, 0);
    ctx.lineTo(cx + 12, cy + 6);
    ctx.lineTo(cx + 8, cy + 10);
    ctx.lineTo(cx + 4, cy + 6);
    ctx.lineTo(cx, cy + 10);
    ctx.lineTo(cx - 4, cy + 6);
    ctx.lineTo(cx - 8, cy + 10);
    ctx.lineTo(cx - 12, cy + 6);
    ctx.closePath();
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#112200";
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    // Tentacles (animated)
    const tentOffset = frame === 0 ? 1 : -1;
    ctx.strokeStyle = "#AAFF44";
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 4, cy + 10);
      ctx.lineTo(cx + i * 4 + tentOffset, cy + 16);
      ctx.stroke();
    }
  }

  clearGlow(ctx);
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const cx = x + PLAYER_W / 2;
  // Player ship — yellow trapezoid
  drawGlow(ctx, "#FCFF52", 12);
  ctx.fillStyle = "#FCFF52";

  // Main body (trapezoid)
  ctx.beginPath();
  ctx.moveTo(cx, y);              // top tip
  ctx.lineTo(cx + 16, y + PLAYER_H - 4); // bottom-right
  ctx.lineTo(cx - 16, y + PLAYER_H - 4); // bottom-left
  ctx.closePath();
  ctx.fill();

  // Wider base
  ctx.fillStyle = "#DDDF30";
  ctx.beginPath();
  ctx.rect(cx - 19, y + PLAYER_H - 10, 38, 10);
  ctx.fill();

  // Cockpit
  ctx.fillStyle = "#00DDFF";
  ctx.beginPath();
  ctx.arc(cx, y + PLAYER_H - 12, 5, 0, Math.PI * 2);
  ctx.fill();

  clearGlow(ctx);
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  if (b.fromPlayer) {
    drawGlow(ctx, "#FCFF52", 8);
    ctx.fillStyle = "#FCFF52";
    ctx.fillRect(b.x - 2, b.y, 4, 10);
  } else {
    drawGlow(ctx, "#FF4400", 10);
    ctx.fillStyle = "#FF6600";
    ctx.fillRect(b.x - ENEMY_BULLET_W / 2, b.y, ENEMY_BULLET_W, ENEMY_BULLET_H);
  }
  clearGlow(ctx);
}

function drawBunkerBlock(ctx: CanvasRenderingContext2D, block: BunkerBlock) {
  if (block.hp <= 0) return;
  const alpha = block.hp / 3;
  ctx.fillStyle = `rgba(0, 255, 100, ${alpha * 0.9})`;
  drawGlow(ctx, "#00FF64", block.hp * 2);
  ctx.fillRect(block.x, block.y, BUNKER_BLOCK_SIZE - 1, BUNKER_BLOCK_SIZE - 1);
  clearGlow(ctx);
}

function drawUFO(ctx: CanvasRenderingContext2D, ufo: UFO) {
  if (!ufo.active) return;
  const cx = ufo.x + UFO_W / 2;
  const cy = ufo.y + UFO_H / 2;

  drawGlow(ctx, "#FF00FF", 12);
  // Saucer body
  ctx.fillStyle = "#CC00CC";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, UFO_W / 2, UFO_H / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dome
  ctx.fillStyle = "#FF44FF";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, UFO_W / 3, UFO_H / 2, 0, Math.PI, 0);
  ctx.fill();
  // Windows
  ctx.fillStyle = "#FFaaFF";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * 10, cy + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  clearGlow(ctx);
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalAlpha = p.life;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[]) {
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  lives: number,
  wave: number,
  highScore: number
) {
  ctx.fillStyle = "#00FFAA";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE: ${score}`, 10, 22);

  ctx.textAlign = "center";
  ctx.fillStyle = "#AAAAFF";
  ctx.fillText(`WAVE ${wave}`, CANVAS_W / 2, 22);

  ctx.textAlign = "right";
  ctx.fillStyle = "#FFFF44";
  ctx.fillText(`HI: ${highScore}`, CANVAS_W - 10, 22);

  // Lives
  ctx.textAlign = "left";
  ctx.fillStyle = "#FF4444";
  ctx.font = "12px monospace";
  for (let i = 0; i < lives; i++) {
    drawPlayer(ctx, 10 + i * 28, CANVAS_H - 20);
  }

  // Dividers
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(CANVAS_W, 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_H - 40);
  ctx.lineTo(CANVAS_W, CANVAS_H - 40);
  ctx.stroke();
}

function drawIdleScreen(ctx: CanvasRenderingContext2D, stars: Star[]) {
  ctx.fillStyle = "#000011";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawStars(ctx, stars);

  ctx.textAlign = "center";
  drawGlow(ctx, "#00FFCC", 20);
  ctx.fillStyle = "#00FFCC";
  ctx.font = "bold 36px monospace";
  ctx.fillText("SPACE INVADERS", CANVAS_W / 2, 120);
  clearGlow(ctx);

  ctx.fillStyle = "#88FF88";
  ctx.font = "14px monospace";
  ctx.fillText("Defend Earth from the crypto invasion!", CANVAS_W / 2, 160);

  // Sample enemies
  const sampleTypes: Array<0 | 1 | 2> = [0, 1, 2];
  const labels = ["30 pts", "20 pts", "10 pts"];
  for (let i = 0; i < 3; i++) {
    const ex = CANVAS_W / 2 - 50;
    const ey = 200 + i * 50;
    drawEnemy(ctx, {
      id: i,
      row: i,
      col: 0,
      x: ex,
      y: ey,
      type: sampleTypes[i],
      alive: true,
      frame: 0,
    });
    ctx.fillStyle = "#AAFFAA";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`= ${labels[i]}`, ex + 44, ey + 14);
  }

  // UFO sample
  ctx.fillStyle = "#FF88FF";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`MYSTERY = ${UFO_POINTS} pts`, CANVAS_W / 2 - 50, 380);

  drawGlow(ctx, "#FCFF52", 10);
  ctx.fillStyle = "#FCFF52";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Press START to play", CANVAS_W / 2, CANVAS_H - 60);
  clearGlow(ctx);
}

function drawGameOver(ctx: CanvasRenderingContext2D, score: number, highScore: number, stars: Star[]) {
  ctx.fillStyle = "#000011";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawStars(ctx, stars);

  ctx.textAlign = "center";
  drawGlow(ctx, "#FF4444", 20);
  ctx.fillStyle = "#FF4444";
  ctx.font = "bold 48px monospace";
  ctx.fillText("GAME OVER", CANVAS_W / 2, 200);
  clearGlow(ctx);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "20px monospace";
  ctx.fillText(`Score: ${score}`, CANVAS_W / 2, 260);
  ctx.fillStyle = "#FFFF44";
  ctx.fillText(`High Score: ${highScore}`, CANVAS_W / 2, 295);

  ctx.fillStyle = "#AAAAFF";
  ctx.font = "14px monospace";
  ctx.fillText("Press RESTART to play again", CANVAS_W / 2, 360);
}

function drawVictory(ctx: CanvasRenderingContext2D, score: number, wave: number, stars: Star[]) {
  ctx.fillStyle = "#000011";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawStars(ctx, stars);

  ctx.textAlign = "center";
  drawGlow(ctx, "#FCFF52", 20);
  ctx.fillStyle = "#FCFF52";
  ctx.font = "bold 40px monospace";
  ctx.fillText("EARTH SAVED!", CANVAS_W / 2, 200);
  clearGlow(ctx);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "20px monospace";
  ctx.fillText(`Score: ${score}`, CANVAS_W / 2, 260);
  ctx.fillStyle = "#AAFFAA";
  ctx.fillText(`Wave ${wave} cleared!`, CANVAS_W / 2, 295);
}

// ========================================
// HOOK
// ========================================

export function useSpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [mode, setGameModeState] = useState<GameMode>("free");
  const setGameMode = useCallback((m: GameMode) => {
    modeRef.current = m;
    setGameModeState(m);
  }, []);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [stats, setStats] = useState<SpaceInvadersStats>(DEFAULT_STATS);

  const { recordGame } = useLocalStats();
  const { chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const contractAddress = getContractAddress("spaceinvaders", chain?.id);
  const contractAddressRef = useRef(contractAddress);
  contractAddressRef.current = contractAddress;
  const modeRef = useRef<GameMode>("free");
  const sessionActiveRef = useRef(false);
  const sessionGamesRef = useRef(0);
  const sessionWinsRef = useRef(0);
  const sessionBestScoreRef = useRef(0);
  const sessionBestWaveRef = useRef(0);

  // Game state refs (avoid re-render on every frame)
  const stateRef = useRef({
    status: "idle" as GameStatus,
    lives: 3,
    score: 0,
    wave: 1,
    playerX: CANVAS_W / 2 - PLAYER_W / 2,
    playerY: CANVAS_H - PLAYER_Y_OFFSET - PLAYER_H,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    bunkers: [] as BunkerBlock[][],
    stars: makeStars(),
    ufo: { x: -UFO_W, y: 40, active: false, direction: 1 as 1 | -1 },
    enemyDir: 1 as 1 | -1,
    enemyMoveTimer: 0,
    enemyMoveInterval: 800, // ms between moves (decreases)
    enemyShootTimer: 0,
    enemyShootInterval: 1200, // ms between enemy shots
    animFrame: 0,
    animTimer: 0,
    bulletIdCounter: 0,
    particleIdCounter: 0,
    lastPlayerShot: 0,
    keysHeld: new Set<string>(),
    lastTimestamp: 0,
    rafId: 0,
    killsThisWave: 0,
    bunkersUnlocked: 0,
    bunkerFlashMsg: "",
    bunkerFlashTimer: 0,
  });

  // Load stats
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STATS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as SpaceInvadersStats;
          setStats(parsed);
          setHighScore(parsed.highScore);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const saveStats = useCallback((newStats: SpaceInvadersStats) => {
    setStats(newStats);
    if (typeof window !== "undefined") {
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    }
  }, []);

  // ----------------------------------------
  // SPAWN / RESET HELPERS
  // ----------------------------------------

  const spawnExplosion = useCallback((x: number, y: number, color: string) => {
    const s = stateRef.current;
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      const speed = Math.random() * 2 + 1;
      s.particles.push({
        id: s.particleIdCounter++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: Math.random() * 3 + 2,
      });
    }
  }, []);

  const initWave = useCallback((w: number) => {
    const s = stateRef.current;
    s.enemies = makeEnemies(w - 1);
    s.bunkers = []; // bunkers start empty — unlocked by kills
    s.killsThisWave = 0;
    s.bunkersUnlocked = 0;
    s.bunkerFlashMsg = "";
    s.bunkerFlashTimer = 0;
    s.bullets = [];
    s.particles = [];
    s.ufo = { x: -UFO_W, y: 40, active: false, direction: 1 };
    // Speed up enemy movement with each wave
    s.enemyMoveInterval = Math.max(150, 800 - (w - 1) * 60);
    s.enemyShootInterval = Math.max(400, 1200 - (w - 1) * 80);
    s.enemyDir = 1;
    s.enemyMoveTimer = 0;
    s.enemyShootTimer = 0;
    s.animTimer = 0;
    s.animFrame = 0;
  }, []);

  // ----------------------------------------
  // COLLISION HELPERS
  // ----------------------------------------

  function rectsOverlap(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // ----------------------------------------
  // MAIN GAME LOOP
  // ----------------------------------------

  const gameLoop = useCallback((timestamp: number) => {
    const s = stateRef.current;
    if (s.status !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dt = Math.min(timestamp - (s.lastTimestamp || timestamp), 50);
    s.lastTimestamp = timestamp;

    // --- UPDATE ---

    // Move stars (parallax)
    for (const star of s.stars) {
      star.y += star.speed;
      if (star.y > CANVAS_H) {
        star.y = 0;
        star.x = Math.random() * CANVAS_W;
      }
    }

    // Player movement
    if (s.keysHeld.has("ArrowLeft") || s.keysHeld.has("KeyA")) {
      s.playerX = Math.max(0, s.playerX - PLAYER_SPEED);
    }
    if (s.keysHeld.has("ArrowRight") || s.keysHeld.has("KeyD")) {
      s.playerX = Math.min(CANVAS_W - PLAYER_W, s.playerX + PLAYER_SPEED);
    }

    // UFO movement
    if (s.ufo.active) {
      s.ufo.x += UFO_SPEED * s.ufo.direction;
      if (s.ufo.x > CANVAS_W + UFO_W || s.ufo.x < -UFO_W * 2) {
        s.ufo.active = false;
      }
    } else if (s.wave % UFO_WAVE_INTERVAL === 0 && Math.random() < 0.0005) {
      // Spawn UFO
      s.ufo.direction = Math.random() < 0.5 ? 1 : -1;
      s.ufo.x = s.ufo.direction === 1 ? -UFO_W : CANVAS_W + UFO_W;
      s.ufo.active = true;
    }

    // Enemy animation
    s.animTimer += dt;
    if (s.animTimer > 500) {
      s.animTimer = 0;
      s.animFrame = s.animFrame === 0 ? 1 : 0;
      for (const e of s.enemies) {
        if (e.alive) e.frame = s.animFrame;
      }
    }

    // Enemy movement
    s.enemyMoveTimer += dt;
    const aliveEnemies = s.enemies.filter(e => e.alive);
    if (s.enemyMoveTimer >= s.enemyMoveInterval) {
      s.enemyMoveTimer = 0;

      // Determine bounds
      const minX = Math.min(...aliveEnemies.map(e => e.x));
      const maxX = Math.max(...aliveEnemies.map(e => e.x + ENEMY_W));

      let shouldDrop = false;
      if (s.enemyDir === 1 && maxX + 10 >= CANVAS_W) {
        shouldDrop = true;
      } else if (s.enemyDir === -1 && minX - 10 <= 0) {
        shouldDrop = true;
      }

      if (shouldDrop) {
        s.enemyDir = s.enemyDir === 1 ? -1 : 1;
        for (const e of s.enemies) {
          if (e.alive) e.y += 16;
        }
      } else {
        const step = 12;
        for (const e of s.enemies) {
          if (e.alive) e.x += step * s.enemyDir;
        }
      }

      // Check if enemies reached bottom
      const maxY = Math.max(...aliveEnemies.map(e => e.y + ENEMY_H));
      if (maxY >= CANVAS_H - 50) {
        s.status = "gameover";
        setStatus("gameover");
        return;
      }
    }

    // Enemy shooting
    s.enemyShootTimer += dt;
    if (s.enemyShootTimer >= s.enemyShootInterval && aliveEnemies.length > 0) {
      s.enemyShootTimer = 0;
      // Pick a random alive enemy in the bottom row per column
      const cols = new Map<number, Enemy[]>();
      for (const e of aliveEnemies) {
        if (!cols.has(e.col)) cols.set(e.col, []);
        cols.get(e.col)!.push(e);
      }
      // Pick random column
      const colKeys = Array.from(cols.keys());
      if (colKeys.length > 0) {
        const randomCol = colKeys[Math.floor(Math.random() * colKeys.length)];
        const colEnemies = cols.get(randomCol)!;
        // Shoot from the lowest enemy in that column
        const shooter = colEnemies.reduce((prev, curr) => (curr.y > prev.y ? curr : prev));
        s.bullets.push({
          id: s.bulletIdCounter++,
          x: shooter.x + ENEMY_W / 2,
          y: shooter.y + ENEMY_H,
          fromPlayer: false,
        });
      }
    }

    // Move bullets
    const bulletsToRemove = new Set<number>();
    for (const b of s.bullets) {
      if (b.fromPlayer) {
        b.y -= PLAYER_BULLET_SPEED;
        if (b.y < 0) bulletsToRemove.add(b.id);
      } else {
        b.y += ENEMY_BULLET_SPEED;
        if (b.y > CANVAS_H) bulletsToRemove.add(b.id);
      }
    }

    // Bullet vs bunkers
    for (const b of s.bullets) {
      if (bulletsToRemove.has(b.id)) continue;
      for (const bunker of s.bunkers) {
        for (const block of bunker) {
          if (block.hp <= 0) continue;
          if (rectsOverlap(
            b.x - 2, b.y, 4, b.fromPlayer ? 10 : ENEMY_BULLET_H,
            block.x, block.y, BUNKER_BLOCK_SIZE, BUNKER_BLOCK_SIZE
          )) {
            block.hp--;
            bulletsToRemove.add(b.id);
            spawnExplosion(b.x, b.y, "#00FF64");
            break;
          }
        }
      }
    }

    // Bunker unlock thresholds (kills needed per bunker: 5, 15, 30, 45)
    const BUNKER_THRESHOLDS = [5, 15, 30, 45];

    // Player bullet vs enemies
    for (const b of s.bullets) {
      if (!b.fromPlayer || bulletsToRemove.has(b.id)) continue;
      for (const e of s.enemies) {
        if (!e.alive) continue;
        if (rectsOverlap(b.x - 2, b.y, 4, 10, e.x, e.y, ENEMY_W, ENEMY_H)) {
          e.alive = false;
          bulletsToRemove.add(b.id);
          const points = e.type === 0 ? 30 : e.type === 1 ? 20 : 10;
          s.score += points;
          setScore(s.score);
          spawnExplosion(e.x + ENEMY_W / 2, e.y + ENEMY_H / 2, "#00FF88");
          s.killsThisWave++;

          // Unlock next bunker if threshold reached
          const nextThreshold = BUNKER_THRESHOLDS[s.bunkersUnlocked];
          if (nextThreshold !== undefined && s.killsThisWave >= nextThreshold) {
            const allBunkers = makeBunkers();
            if (s.bunkersUnlocked < allBunkers.length) {
              s.bunkers.push(allBunkers[s.bunkersUnlocked]);
              s.bunkersUnlocked++;
              s.bunkerFlashMsg = `🛡 Shield ${s.bunkersUnlocked} unlocked!`;
              s.bunkerFlashTimer = 2000;
            }
          }
          break;
        }
      }
    }

    // Player bullet vs UFO
    for (const b of s.bullets) {
      if (!b.fromPlayer || bulletsToRemove.has(b.id)) continue;
      if (s.ufo.active && rectsOverlap(b.x - 2, b.y, 4, 10, s.ufo.x, s.ufo.y, UFO_W, UFO_H)) {
        s.ufo.active = false;
        bulletsToRemove.add(b.id);
        s.score += UFO_POINTS;
        setScore(s.score);
        spawnExplosion(s.ufo.x + UFO_W / 2, s.ufo.y + UFO_H / 2, "#FF44FF");
      }
    }

    // Enemy bullet vs player
    for (const b of s.bullets) {
      if (b.fromPlayer || bulletsToRemove.has(b.id)) continue;
      if (rectsOverlap(
        b.x - ENEMY_BULLET_W / 2, b.y, ENEMY_BULLET_W, ENEMY_BULLET_H,
        s.playerX, s.playerY, PLAYER_W, PLAYER_H
      )) {
        bulletsToRemove.add(b.id);
        s.lives--;
        setLives(s.lives);
        spawnExplosion(s.playerX + PLAYER_W / 2, s.playerY + PLAYER_H / 2, "#FCFF52");
        if (s.lives <= 0) {
          s.status = "gameover";
          setStatus("gameover");
          return;
        }
      }
    }

    s.bullets = s.bullets.filter(b => !bulletsToRemove.has(b.id));

    // Update particles
    for (const p of s.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
    }
    s.particles = s.particles.filter(p => p.life > 0);

    // Bunker flash timer
    if (s.bunkerFlashTimer > 0) {
      s.bunkerFlashTimer -= dt;
      if (s.bunkerFlashTimer <= 0) s.bunkerFlashMsg = "";
    }

    // Check wave cleared
    if (aliveEnemies.length === 0) {
      const bonus = 100 * s.wave;
      s.score += bonus;
      setScore(s.score);
      s.wave++;
      setWave(s.wave);
      initWave(s.wave);
    }

    // --- DRAW ---
    ctx.fillStyle = "#000011";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    drawStars(ctx, s.stars);

    // Bunkers
    for (const bunker of s.bunkers) {
      for (const block of bunker) {
        drawBunkerBlock(ctx, block);
      }
    }

    // Enemies
    for (const e of s.enemies) {
      if (e.alive) drawEnemy(ctx, e);
    }

    // UFO
    drawUFO(ctx, s.ufo);

    // Player
    drawPlayer(ctx, s.playerX, s.playerY);

    // Bullets
    for (const b of s.bullets) {
      drawBullet(ctx, b);
    }

    // Particles
    for (const p of s.particles) {
      drawParticle(ctx, p);
    }

    // Bunker unlock flash
    if (s.bunkerFlashMsg && s.bunkerFlashTimer > 0) {
      const alpha = Math.min(1, s.bunkerFlashTimer / 500);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawGlow(ctx, "#00FF64", 16);
      ctx.fillStyle = "#00FF64";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText(s.bunkerFlashMsg, CANVAS_W / 2, CANVAS_H / 2 - 20);
      clearGlow(ctx);
      ctx.restore();
    }

    // HUD
    drawHUD(ctx, s.score, s.lives, s.wave, highScore);

    s.rafId = requestAnimationFrame(gameLoop);
  }, [highScore, initWave, spawnExplosion]);

  // ----------------------------------------
  // START / RESET
  // ----------------------------------------

  const startGame = useCallback(() => {
    // Start on-chain session on first game of the session
    if (modeRef.current === "onchain" && contractAddressRef.current && !sessionActiveRef.current) {
      sessionActiveRef.current = true;
      sessionGamesRef.current = 0;
      sessionWinsRef.current = 0;
      sessionBestScoreRef.current = 0;
      sessionBestWaveRef.current = 0;
      writeContractAsync({
        address: contractAddressRef.current as `0x${string}`,
        abi: SPACEINVADERS_ABI,
        functionName: "startSession",
        args: [],
      }).catch(() => { sessionActiveRef.current = false; });
    }

    const s = stateRef.current;
    // Initialise the game state immediately (so the idle screen shows the grid)
    s.lives = 3;
    s.score = 0;
    s.wave = 1;
    s.playerX = CANVAS_W / 2 - PLAYER_W / 2;
    s.playerY = CANVAS_H - PLAYER_Y_OFFSET - PLAYER_H;
    s.bullets = [];
    s.particles = [];
    s.stars = makeStars();
    s.lastTimestamp = 0;
    s.keysHeld = new Set();
    initWave(1);

    setStatus("countdown");
    setLives(3);
    setScore(0);
    setWave(1);
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
        stateRef.current.status = "playing";
        setStatus("playing");
        cancelAnimationFrame(stateRef.current.rafId);
        stateRef.current.rafId = requestAnimationFrame(gameLoop);
      }
    }, 1000);
  }, [gameLoop, initWave]);

  const resetGame = useCallback(() => {
    if (modeRef.current === "onchain" && contractAddressRef.current && sessionActiveRef.current) {
      sessionActiveRef.current = false;
      writeContractAsync({
        address: contractAddressRef.current as `0x${string}`,
        abi: SPACEINVADERS_ABI,
        functionName: "abandonSession",
        args: [],
      }).catch(() => {});
    }
    const s = stateRef.current;
    cancelAnimationFrame(s.rafId);
    s.status = "idle";
    setStatus("idle");
    setLives(3);
    setScore(0);
    setWave(1);

    // Draw idle screen
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) drawIdleScreen(ctx, s.stars);
    }
  }, []);

  // ----------------------------------------
  // STATUS CHANGE SIDE EFFECTS
  // ----------------------------------------

  useEffect(() => {
    if (status === "gameover" || status === "victory") {
      const s = stateRef.current;
      cancelAnimationFrame(s.rafId);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          if (status === "gameover") {
            drawGameOver(ctx, s.score, Math.max(s.score, highScore), s.stars);
          } else {
            drawVictory(ctx, s.score, s.wave, s.stars);
          }
        }
      }

      // Update stats
      const isWin = status === "victory";
      const newHighScore = Math.max(highScore, s.score);
      const newBestWave = Math.max(stats.wave, s.wave);
      const newStats: SpaceInvadersStats = {
        games: stats.games + 1,
        wins: isWin ? stats.wins + 1 : stats.wins,
        highScore: newHighScore,
        wave: newBestWave,
      };
      saveStats(newStats);
      setHighScore(newHighScore);
      recordGame("spaceinvaders" as never, modeRef.current, isWin ? "win" : "lose");

      // Accumulate session stats
      sessionGamesRef.current += 1;
      if (isWin) sessionWinsRef.current += 1;
      if (s.score > sessionBestScoreRef.current) sessionBestScoreRef.current = s.score;
      if (s.wave > sessionBestWaveRef.current) sessionBestWaveRef.current = s.wave;

      // Commit session on-chain after each game
      if (modeRef.current === "onchain" && contractAddressRef.current && sessionActiveRef.current) {
        sessionActiveRef.current = false;
        writeContractAsync({
          address: contractAddressRef.current as `0x${string}`,
          abi: SPACEINVADERS_ABI,
          functionName: "endSession",
          args: [
            BigInt(sessionGamesRef.current),
            BigInt(sessionWinsRef.current),
            BigInt(sessionBestScoreRef.current),
            BigInt(sessionBestWaveRef.current),
          ],
        }).catch(() => {});
      }
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw idle screen on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) drawIdleScreen(ctx, stateRef.current.stars);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(stateRef.current.rafId);
    };
  }, []);

  // ----------------------------------------
  // KEY HANDLERS
  // ----------------------------------------

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const s = stateRef.current;
    if (s.status !== "playing") return;

    s.keysHeld.add(e.code);

    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      const now = Date.now();
      if (now - s.lastPlayerShot >= PLAYER_BULLET_COOLDOWN) {
        s.lastPlayerShot = now;
        s.bullets.push({
          id: s.bulletIdCounter++,
          x: s.playerX + PLAYER_W / 2,
          y: s.playerY,
          fromPlayer: true,
        });
      }
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    stateRef.current.keysHeld.delete(e.code);
  }, []);

  // ----------------------------------------
  // MOBILE CONTROLS
  // ----------------------------------------

  const mobileLeft = useCallback(() => {
    stateRef.current.keysHeld.add("ArrowLeft");
  }, []);

  const mobileRight = useCallback(() => {
    stateRef.current.keysHeld.add("ArrowRight");
  }, []);

  const mobileLeftEnd = useCallback(() => {
    stateRef.current.keysHeld.delete("ArrowLeft");
  }, []);

  const mobileRightEnd = useCallback(() => {
    stateRef.current.keysHeld.delete("ArrowRight");
  }, []);

  const mobileFire = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    const now = Date.now();
    if (now - s.lastPlayerShot >= PLAYER_BULLET_COOLDOWN) {
      s.lastPlayerShot = now;
      s.bullets.push({
        id: s.bulletIdCounter++,
        x: s.playerX + PLAYER_W / 2,
        y: s.playerY,
        fromPlayer: true,
      });
    }
  }, []);

  return {
    canvasRef,
    status,
    countdown,
    mode,
    setGameMode,
    lives,
    score,
    wave,
    highScore,
    stats,
    startGame,
    resetGame,
    handleKeyDown,
    handleKeyUp,
    mobileLeft,
    mobileRight,
    mobileLeftEnd,
    mobileRightEnd,
    mobileFire,
  };
}
