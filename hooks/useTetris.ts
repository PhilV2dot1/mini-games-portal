"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getContractAddress } from "@/lib/contracts/addresses";
import { TETRIS_CONTRACT_ABI } from "@/lib/contracts/tetris-abi";
import {
  type Grid,
  type Piece,
  COLS,
  createEmptyGrid,
  getRandomPiece,
  resetBag,
  rotateCW,
  isValidPosition,
  placePiece,
  clearLines,
  getGhostRow,
  calculateLineScore,
  getLevel,
  getSpeed,
  isGameOver,
} from "@/lib/games/tetris-logic";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "playing" | "processing" | "finished" | "countdown";
export type GameResult = "win" | "lose" | null;

export interface PlayerStats {
  games: number;
  wins: number;
  bestScore: number;
  totalLines: number;
  highestLevel: number;
}

const DEFAULT_STATS: PlayerStats = {
  games: 0,
  wins: 0,
  bestScore: 0,
  totalLines: 0,
  highestLevel: 0,
};

const STATS_KEY = "tetris_stats";
const WIN_THRESHOLD = 10000;

// ========================================
// HOOK
// ========================================

export function useTetris() {
  // Game state
  const [grid, setGrid] = useState<Grid>(createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [holdPiece, setHoldPiece] = useState<Piece | null>(null);
  const [canHold, setCanHold] = useState(true);

  // Score state
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);

  // Game status
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [result, setResult] = useState<GameResult>(null);
  const [message, setMessage] = useState("Click Start to begin!");
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Timer
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Game loop ref — uses requestAnimationFrame for smooth rendering
  const gameLoopRef = useRef<number | null>(null);
  const lastDropRef = useRef<number>(0);
  const speedRef = useRef(getSpeed(1));

  // Mutable game state refs — the game loop reads from these to avoid stale closures
  const stateRef = useRef({
    grid: createEmptyGrid() as Grid,
    currentPiece: null as Piece | null,
    nextPiece: null as Piece | null,
    score: 0,
    lines: 0,
    level: 1,
    status: "idle" as GameStatus,
  });

  // Stats
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const statsRef = useRef(stats);
  const modeRef = useRef(mode);
  const gameStartedOnChainRef = useRef(gameStartedOnChain);

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const contractAddress = getContractAddress("tetris", chain?.id);

  const { writeContractAsync, isPending } = useWriteContract();
  const { refetch: refetchStats } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: TETRIS_CONTRACT_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddress },
  });

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setStats(parsed);
        statsRef.current = parsed;
      }
    } catch { /* ignore */ }
  }, []);

  const saveStats = useCallback((newStats: PlayerStats) => {
    setStats(newStats);
    statsRef.current = newStats;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch { /* ignore */ }
  }, []);

  // Format time
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Timer management
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Stop game loop
  const stopGameLoop = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  // Sync mode and gameStartedOnChain to refs
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { gameStartedOnChainRef.current = gameStartedOnChain; }, [gameStartedOnChain]);

  // ========================================
  // CORE GAME LOOP TICK — uses refs only, no stale closures
  // ========================================

  const finishGame = useCallback(async (finalScore: number, finalLines: number, finalLevel: number, won: boolean) => {
    if (modeRef.current === "free") {
      const newStats = { ...statsRef.current };
      newStats.games += 1;
      if (won) newStats.wins += 1;
      if (finalScore > newStats.bestScore) newStats.bestScore = finalScore;
      newStats.totalLines += finalLines;
      if (finalLevel > newStats.highestLevel) newStats.highestLevel = finalLevel;
      saveStats(newStats);
      setMessage(won ? `Congratulations! Score: ${finalScore}` : `Game Over! Score: ${finalScore}`);
    } else {
      if (!gameStartedOnChainRef.current) {
        setMessage(won ? `Congratulations! Score: ${finalScore}` : `Game Over! Score: ${finalScore}`);
        return;
      }
      try {
        setStatus("processing");
        stateRef.current.status = "processing";
        setMessage("Recording score on blockchain...");
        await writeContractAsync({
          address: contractAddress!,
          abi: TETRIS_CONTRACT_ABI,
          functionName: "endGame",
          args: [BigInt(finalScore), BigInt(finalLines), BigInt(finalLevel)],
        });
        setGameStartedOnChain(false);
        await refetchStats();
        setMessage(`Score: ${finalScore} - recorded on blockchain!`);
        setStatus("finished");
        stateRef.current.status = "finished";
      } catch (error) {
        console.error("Failed to record result:", error);
        setMessage("Game finished but not recorded on-chain");
        setGameStartedOnChain(false);
        setStatus("finished");
        stateRef.current.status = "finished";
      }
    }
  }, [saveStats, writeContractAsync, contractAddress, refetchStats]);

  // The actual tick function — called by setInterval
  // It reads exclusively from stateRef to avoid stale closures
  const gameTick = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing" || !s.currentPiece) return;

    const piece = s.currentPiece;
    const moved = { ...piece, row: piece.row + 1 };

    if (isValidPosition(s.grid, moved)) {
      // Piece can move down
      s.currentPiece = moved;
      setCurrentPiece(moved);
    } else {
      // Lock piece
      const newGrid = placePiece(s.grid, piece);
      const { grid: clearedGrid, linesCleared } = clearLines(newGrid);

      s.grid = clearedGrid;
      setGrid(clearedGrid);

      if (linesCleared > 0) {
        const newLines = s.lines + linesCleared;
        const newLevel = getLevel(newLines);
        const lineScore = calculateLineScore(linesCleared, s.level);

        s.lines = newLines;
        s.level = newLevel;
        s.score += lineScore;

        setLines(newLines);
        setLevel(newLevel);
        setScore(s.score);

        // Update speed if level changed (rAF loop reads speedRef automatically)
        if (newLevel !== level) {
          speedRef.current = getSpeed(newLevel);
        }
      }

      // Spawn next piece
      const next = s.nextPiece || getRandomPiece();
      const newNext = getRandomPiece();

      if (isGameOver(s.grid, next)) {
        // Game over
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        s.status = "finished";
        s.currentPiece = null;
        setCurrentPiece(null);
        setStatus("finished");
        const won = s.score >= WIN_THRESHOLD;
        setResult(won ? "win" : "lose");
        finishGame(s.score, s.lines, s.level, won);
        return;
      }

      s.currentPiece = next;
      s.nextPiece = newNext;
      setCurrentPiece(next);
      setNextPiece(newNext);
      setCanHold(true);
    }
  }, [finishGame]);

  // Start game loop — requestAnimationFrame with timestamp-based dropping
  const startGameLoop = useCallback((speed: number) => {
    stopGameLoop();
    speedRef.current = speed;
    lastDropRef.current = performance.now();

    const loop = (now: number) => {
      if (stateRef.current.status !== "playing") return;

      const elapsed = now - lastDropRef.current;
      if (elapsed >= speedRef.current) {
        lastDropRef.current = now - (elapsed % speedRef.current);
        gameTick();
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
  }, [stopGameLoop, gameTick]);

  // Countdown helper — calls onComplete after 3-2-1-GO
  const startCountdown = useCallback((onComplete: () => void) => {
    setStatus("countdown");
    setCountdown(3);
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
        onComplete();
      }
    }, 1000);
  }, []);

  // Start game
  const startGame = useCallback(async () => {
    resetBag();
    const newGrid = createEmptyGrid();
    const first = getRandomPiece();
    const next = getRandomPiece();

    if (mode === "onchain") {
      if (!isConnected || !address) {
        setMessage("Please connect wallet first");
        return;
      }
      try {
        setStatus("processing");
        setMessage("Starting game on blockchain...");
        await writeContractAsync({
          address: contractAddress!,
          abi: TETRIS_CONTRACT_ABI,
          functionName: "startGame",
        });
        setGameStartedOnChain(true);
      } catch (error) {
        console.error("Failed to start on-chain game:", error);
        setMessage("Failed to start on-chain game");
        setStatus("idle");
        return;
      }
    }

    // Reset state ref (status will become "playing" after countdown)
    stateRef.current = {
      grid: newGrid,
      currentPiece: first,
      nextPiece: next,
      score: 0,
      lines: 0,
      level: 1,
      status: "countdown",
    };

    setGrid(newGrid);
    setCurrentPiece(first);
    setNextPiece(next);
    setHoldPiece(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(1);
    setResult(null);
    setMessage("");
    setTimer(0);

    startCountdown(() => {
      stateRef.current.status = "playing";
      setStatus("playing");
      startTimer();
      startGameLoop(getSpeed(1));
    });
  }, [mode, isConnected, address, writeContractAsync, contractAddress, startCountdown, startTimer, startGameLoop]);

  // Player actions — read from stateRef for instant responsiveness
  const moveLeft = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing" || !s.currentPiece) return;
    const moved = { ...s.currentPiece, col: s.currentPiece.col - 1 };
    if (isValidPosition(s.grid, moved)) {
      s.currentPiece = moved;
      setCurrentPiece(moved);
    }
  }, []);

  const moveRight = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing" || !s.currentPiece) return;
    const moved = { ...s.currentPiece, col: s.currentPiece.col + 1 };
    if (isValidPosition(s.grid, moved)) {
      s.currentPiece = moved;
      setCurrentPiece(moved);
    }
  }, []);

  const moveDown = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing" || !s.currentPiece) return;
    const moved = { ...s.currentPiece, row: s.currentPiece.row + 1 };
    if (isValidPosition(s.grid, moved)) {
      s.currentPiece = moved;
      s.score += 1;
      setCurrentPiece(moved);
      setScore(s.score);
    }
  }, []);

  const rotate = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing" || !s.currentPiece) return;
    const rotated = rotateCW(s.currentPiece);
    // Try normal rotation
    if (isValidPosition(s.grid, rotated)) {
      s.currentPiece = rotated;
      setCurrentPiece(rotated);
      return;
    }
    // Wall kicks: left, right, 2-left, 2-right
    for (const offset of [-1, 1, -2, 2]) {
      const kicked = { ...rotated, col: rotated.col + offset };
      if (isValidPosition(s.grid, kicked)) {
        s.currentPiece = kicked;
        setCurrentPiece(kicked);
        return;
      }
    }
  }, []);

  const hardDrop = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing" || !s.currentPiece) return;
    const ghostR = getGhostRow(s.grid, s.currentPiece);
    const dropDistance = ghostR - s.currentPiece.row;
    s.score += dropDistance * 2;
    s.currentPiece = { ...s.currentPiece, row: ghostR };
    setScore(s.score);
    setCurrentPiece(s.currentPiece);
    // Immediately trigger lock via a tick
    gameTick();
  }, [gameTick]);

  const hold = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing" || !s.currentPiece || !canHold) return;
    setCanHold(false);

    if (holdPiece) {
      // Swap current with hold
      const held = { ...holdPiece, row: 0, col: Math.floor((COLS - holdPiece.shape[0].length) / 2) };
      if (isValidPosition(s.grid, held)) {
        setHoldPiece({ ...s.currentPiece, row: 0, col: 0 });
        s.currentPiece = held;
        setCurrentPiece(held);
      } else {
        setCanHold(true);
      }
    } else {
      // First hold — store current, spawn next
      setHoldPiece({ ...s.currentPiece, row: 0, col: 0 });
      const next = s.nextPiece || getRandomPiece();
      const newNext = getRandomPiece();

      if (isGameOver(s.grid, next)) {
        stopGameLoop();
        stopTimer();
        s.status = "finished";
        setStatus("finished");
        const won = s.score >= WIN_THRESHOLD;
        setResult(won ? "win" : "lose");
        finishGame(s.score, s.lines, s.level, won);
        return;
      }

      s.currentPiece = next;
      s.nextPiece = newNext;
      setCurrentPiece(next);
      setNextPiece(newNext);
    }
  }, [canHold, holdPiece, stopGameLoop, stopTimer, finishGame, gameTick]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.status !== "playing") return;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          moveLeft();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          moveRight();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          moveDown();
          break;
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          rotate();
          break;
        case " ":
          e.preventDefault();
          hardDrop();
          break;
        case "c":
        case "C":
        case "Shift":
          e.preventDefault();
          hold();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop, hold]);

  // Reset game
  const resetGame = useCallback(() => {
    stopGameLoop();
    stopTimer();
    resetBag();

    stateRef.current = {
      grid: createEmptyGrid(),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      lines: 0,
      level: 1,
      status: "idle",
    };

    setGrid(createEmptyGrid());
    setCurrentPiece(null);
    setNextPiece(null);
    setHoldPiece(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(1);
    setStatus("idle");
    setResult(null);
    setTimer(0);
    setCountdown(null);
    setMessage("Click Start to begin!");
    setGameStartedOnChain(false);
  }, [stopGameLoop, stopTimer]);

  // Switch mode
  const switchMode = useCallback(
    (newMode: GameMode) => {
      if (status === "playing") return;
      setMode(newMode);
      resetGame();
    },
    [status, resetGame]
  );

  // Ghost row for current piece
  const ghostRow = currentPiece ? getGhostRow(grid, currentPiece) : null;

  return {
    // State
    grid,
    currentPiece,
    nextPiece,
    holdPiece,
    canHold,
    ghostRow,
    score,
    lines,
    level,
    mode,
    status,
    result,
    message,
    countdown,
    timer,
    stats,
    isConnected,
    isProcessing: isPending,

    // Actions
    startGame,
    resetGame,
    switchMode,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    hardDrop,
    hold,
    formatTime,
  };
}
