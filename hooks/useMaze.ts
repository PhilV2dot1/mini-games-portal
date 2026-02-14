import { useState, useCallback, useEffect, useRef } from "react";
import {
  type Difficulty,
  type Direction,
  type Position,
  type MazeGrid,
  DIFFICULTY_CONFIG,
  generateMaze,
  movePlayer,
  checkWin,
  calculateScore,
  PLAYER,
} from "@/lib/games/maze-logic";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "playing" | "processing" | "finished";
export type GameResult = "win" | null;

export interface PlayerStats {
  games: number;
  wins: number;
  bestTimes: {
    easy: number | null;
    medium: number | null;
    hard: number | null;
  };
  bestMoves: {
    easy: number | null;
    medium: number | null;
    hard: number | null;
  };
}

// ========================================
// CONSTANTS
// ========================================

const STATS_KEY = "maze_stats";

const DEFAULT_STATS: PlayerStats = {
  games: 0,
  wins: 0,
  bestTimes: { easy: null, medium: null, hard: null },
  bestMoves: { easy: null, medium: null, hard: null },
};

// ========================================
// HOOK
// ========================================

export function useMaze() {
  // Game state
  const [grid, setGrid] = useState<MazeGrid>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ row: 1, col: 1 });
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [result, setResult] = useState<GameResult>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [message, setMessage] = useState("Click Start to begin!");

  // Game tracking
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);

  // Stats
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) setStats(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  // Save stats to localStorage
  const saveStats = useCallback((newStats: PlayerStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch {
      /* ignore */
    }
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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Start a new game
  const startGame = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const newGrid = generateMaze(config.gridSize);
    // Place player at start
    newGrid[1][1] = PLAYER;
    setGrid(newGrid);
    setPlayerPos({ row: 1, col: 1 });
    setStatus("playing");
    setResult(null);
    setMoves(0);
    setTimer(0);
    setMessage("");
    startTimer();
  }, [difficulty, startTimer]);

  // Handle player movement
  const move = useCallback(
    (direction: Direction) => {
      if (status !== "playing") return;

      const { grid: newGrid, newPos, moved } = movePlayer(
        grid,
        playerPos,
        direction
      );

      if (!moved) return;

      setGrid(newGrid);
      setPlayerPos(newPos);
      setMoves((prev) => prev + 1);

      // Check win
      const gridSize = DIFFICULTY_CONFIG[difficulty].gridSize;
      if (checkWin(newPos, gridSize)) {
        stopTimer();
        const finalTime = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        const finalMoves = moves + 1;
        setStatus("finished");
        setResult("win");
        const score = calculateScore(gridSize, finalMoves, finalTime);
        setMessage(`🎉 Congratulations! Score: ${score}`);

        // Update stats
        const newStats = { ...stats };
        newStats.games += 1;
        newStats.wins += 1;
        if (
          !newStats.bestTimes[difficulty] ||
          finalTime < newStats.bestTimes[difficulty]!
        ) {
          newStats.bestTimes[difficulty] = finalTime;
        }
        if (
          !newStats.bestMoves[difficulty] ||
          finalMoves < newStats.bestMoves[difficulty]!
        ) {
          newStats.bestMoves[difficulty] = finalMoves;
        }
        saveStats(newStats);
      }
    },
    [status, grid, playerPos, difficulty, moves, stats, stopTimer, saveStats]
  );

  // Keyboard controls
  useEffect(() => {
    if (status !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let direction: Direction | null = null;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          direction = "UP";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          direction = "DOWN";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          direction = "LEFT";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          direction = "RIGHT";
          break;
      }

      if (direction) {
        e.preventDefault();
        move(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, move]);

  // Reset game
  const resetGame = useCallback(() => {
    stopTimer();
    setGrid([]);
    setPlayerPos({ row: 1, col: 1 });
    setStatus("idle");
    setResult(null);
    setMoves(0);
    setTimer(0);
    setMessage("Click Start to begin!");
  }, [stopTimer]);

  // Switch mode
  const switchMode = useCallback(
    (newMode: GameMode) => {
      if (status === "playing") return;
      setMode(newMode);
    },
    [status]
  );

  // Change difficulty
  const changeDifficulty = useCallback(
    (newDifficulty: Difficulty) => {
      if (status === "playing") return;
      setDifficulty(newDifficulty);
    },
    [status]
  );

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    // State
    grid,
    playerPos,
    mode,
    status,
    result,
    difficulty,
    message,
    moves,
    timer,
    stats,
    gridSize: DIFFICULTY_CONFIG[difficulty].gridSize,

    // Actions
    startGame,
    move,
    resetGame,
    switchMode,
    changeDifficulty,
    formatTime,
  };
}

export { DIFFICULTY_CONFIG, type Difficulty } from "@/lib/games/maze-logic";
