import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { MAZE_CONTRACT_ABI } from "@/lib/contracts/maze-abi";
import { getContractAddress, isGameAvailableOnChain } from "@/lib/contracts/addresses";
import {
  type Difficulty,
  type Direction,
  type Position,
  type MazeGrid,
  DIFFICULTY_CONFIG,
  WALL_SHIFT_INTERVAL,
  generateMaze,
  movePlayer,
  checkWin,
  calculateScore,
  getVisibleCells,
  shiftWalls,
  PLAYER,
} from "@/lib/games/maze-logic";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "waiting_start" | "countdown" | "playing" | "waiting_end" | "finished";
export type GameResult = "win" | "timeout" | null;

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

const DIFFICULTY_ENUM = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
} as const;

function getDifficultyEnum(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy":
      return DIFFICULTY_ENUM.EASY;
    case "medium":
      return DIFFICULTY_ENUM.MEDIUM;
    case "hard":
      return DIFFICULTY_ENUM.HARD;
  }
}

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
  const [countdown, setCountdown] = useState<number | null>(null);

  // Game tracking
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);

  // Fog of war state
  const [visibleCells, setVisibleCells] = useState<Set<string> | null>(null);

  // Stats
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wallShiftRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const gridRef = useRef<MazeGrid>(grid);
  const playerPosRef = useRef<Position>(playerPos);
  const statusRef = useRef<GameStatus>(status);

  // Keep refs in sync
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { statusRef.current = status; }, [status]);

  // On-chain tx tracking
  const [startTxHash, setStartTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [endTxHash, setEndTxHash] = useState<`0x${string}` | undefined>(undefined);
  const pendingEndRef = useRef<{ finalTime: number; finalMoves: number; score: number } | null>(null);
  const startCountdownAndGameRef = useRef<(() => void) | null>(null);

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const contractAddress = getContractAddress('maze', chain?.id);
  const gameAvailable = isGameAvailableOnChain('maze', chain?.id);
  const { writeContractAsync } = useWriteContract();

  const { isSuccess: startConfirmed, isError: startFailed } = useWaitForTransactionReceipt({ hash: startTxHash });
  const { isSuccess: endConfirmed, isError: endFailed } = useWaitForTransactionReceipt({ hash: endTxHash });

  // Read on-chain stats
  const { data: onChainStats, refetch: refetchStats } = useReadContract({
    address: contractAddress!,
    abi: MAZE_CONTRACT_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: {
      enabled: mode === "onchain" && isConnected && !!address && gameAvailable,
    },
  });

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) setStats(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  // Update stats when on-chain data changes
  useEffect(() => {
    if (mode === "onchain" && onChainStats) {
      const [gamesPlayed, wins, bestTimeEasy, bestTimeMedium, bestTimeHard, bestMovesEasy, bestMovesMedium, bestMovesHard] =
        onChainStats as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];

      setStats({
        games: Number(gamesPlayed),
        wins: Number(wins),
        bestTimes: {
          easy: bestTimeEasy > 0n ? Number(bestTimeEasy) : null,
          medium: bestTimeMedium > 0n ? Number(bestTimeMedium) : null,
          hard: bestTimeHard > 0n ? Number(bestTimeHard) : null,
        },
        bestMoves: {
          easy: bestMovesEasy > 0n ? Number(bestMovesEasy) : null,
          medium: bestMovesMedium > 0n ? Number(bestMovesMedium) : null,
          hard: bestMovesHard > 0n ? Number(bestMovesHard) : null,
        },
      });
    }
  }, [onChainStats, mode]);

  // startGame tx confirmed → start countdown
  useEffect(() => {
    if (startConfirmed && status === "waiting_start") {
      setGameStartedOnChain(true);
      setStartTxHash(undefined);
      startCountdownAndGameRef.current?.();
    }
  }, [startConfirmed, status]);

  useEffect(() => {
    if (startFailed && status === "waiting_start") {
      setMessage("Transaction failed");
      setStatus("idle");
      setStartTxHash(undefined);
      startCountdownAndGameRef.current = null;
    }
  }, [startFailed, status]);

  // endGame tx confirmed → show final result
  useEffect(() => {
    if (endConfirmed && status === "waiting_end" && pendingEndRef.current) {
      const { score } = pendingEndRef.current;
      refetchStats();
      setMessage(`Victory! Score: ${score} - recorded on blockchain!`);
      setGameStartedOnChain(false);
      setStatus("finished");
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endConfirmed, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (endFailed && status === "waiting_end" && pendingEndRef.current) {
      const { score } = pendingEndRef.current;
      setMessage(`Victory! Score: ${score} (not recorded on-chain)`);
      setGameStartedOnChain(false);
      setStatus("finished");
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endFailed, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save stats to localStorage
  const saveStats = useCallback((newStats: PlayerStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch {
      /* ignore */
    }
  }, []);

  // Get current difficulty config
  const config = DIFFICULTY_CONFIG[difficulty];

  // Timer management — countdown from timeLimit
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setTimer(config.timeLimit);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, config.timeLimit - elapsed);
      setTimer(remaining);

      if (remaining <= 0) {
        // Time's up! — handled by the effect below
      }
    }, 1000);
  }, [config.timeLimit]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Stop wall shift interval
  const stopWallShift = useCallback(() => {
    if (wallShiftRef.current) {
      clearInterval(wallShiftRef.current);
      wallShiftRef.current = null;
    }
  }, []);

  // Handle time's up
  useEffect(() => {
    if (status === "playing" && timer <= 0 && config.timeLimit > 0) {
      stopTimer();
      stopWallShift();
      setStatus("finished");
      setResult("timeout");
      setMessage("Time's up!");
    }
  }, [timer, status, config.timeLimit, stopTimer, stopWallShift]);

  // Moving walls interval (Hard mode)
  const startWallShift = useCallback(() => {
    if (!config.movingWalls) return;

    wallShiftRef.current = setInterval(() => {
      if (statusRef.current !== "playing") return;

      setGrid(prevGrid => {
        const newGrid = shiftWalls(prevGrid, playerPosRef.current);
        // Update fog after wall shift
        if (config.fogRadius > 0) {
          setVisibleCells(getVisibleCells(playerPosRef.current, newGrid, config.fogRadius));
        }
        return newGrid;
      });
    }, WALL_SHIFT_INTERVAL * 1000);
  }, [config.movingWalls, config.fogRadius]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopWallShift();
    };
  }, [stopTimer, stopWallShift]);

  // End game (handles both free and on-chain)
  const endGame = useCallback(async (finalTime: number, finalMoves: number, score: number) => {
    const newStats = { ...stats };
    newStats.games += 1;
    newStats.wins += 1;
    if (!newStats.bestTimes[difficulty] || finalTime < newStats.bestTimes[difficulty]!) {
      newStats.bestTimes[difficulty] = finalTime;
    }
    if (!newStats.bestMoves[difficulty] || finalMoves < newStats.bestMoves[difficulty]!) {
      newStats.bestMoves[difficulty] = finalMoves;
    }

    if (mode === "free") {
      saveStats(newStats);
      setMessage(`Congratulations! Score: ${score}`);
      return;
    }

    if (!gameStartedOnChain) {
      setMessage(`Congratulations! Score: ${score}`);
      return;
    }

    setStatus("waiting_end");
    setMessage("Recording victory on blockchain...");
    pendingEndRef.current = { finalTime, finalMoves, score };
    saveStats(newStats);

    try {
      const hash = await writeContractAsync({
        address: contractAddress!,
        abi: MAZE_CONTRACT_ABI,
        functionName: "endGame",
        args: [getDifficultyEnum(difficulty), BigInt(finalTime), BigInt(finalMoves), BigInt(score)],
      });
      setEndTxHash(hash);
    } catch {
      setMessage(`Game finished but not recorded on-chain. Score: ${score}`);
      setGameStartedOnChain(false);
      setStatus("finished");
      pendingEndRef.current = null;
    }
  }, [mode, stats, difficulty, gameStartedOnChain, writeContractAsync, contractAddress, saveStats]);

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

  // Start a new game
  const startGame = useCallback(async () => {
    setStartTxHash(undefined);
    setEndTxHash(undefined);
    pendingEndRef.current = null;

    const newGrid = generateMaze(config.gridSize);
    newGrid[1][1] = PLAYER;
    const fog = getVisibleCells({ row: 1, col: 1 }, newGrid, config.fogRadius);

    const startCountdownAndGame = () => {
      setGrid(newGrid);
      setPlayerPos({ row: 1, col: 1 });
      setResult(null);
      setMoves(0);
      setMessage("");
      setVisibleCells(fog);
      startCountdown(() => {
        setStatus("playing");
        startTimer();
        startWallShift();
      });
    };

    if (mode === "onchain") {
      if (!isConnected || !address) {
        setMessage("Please connect wallet first");
        return;
      }
      setStatus("waiting_start");
      setMessage("Sign transaction to start...");
      startCountdownAndGameRef.current = startCountdownAndGame;
      try {
        const hash = await writeContractAsync({
          address: contractAddress!,
          abi: MAZE_CONTRACT_ABI,
          functionName: "startGame",
          args: [getDifficultyEnum(difficulty)],
        });
        setStartTxHash(hash);
      } catch {
        setMessage("Transaction rejected");
        setStatus("idle");
        startCountdownAndGameRef.current = null;
      }
      return;
    }

    startCountdownAndGame();
  }, [difficulty, config, mode, isConnected, address, writeContractAsync, contractAddress, startCountdown, startTimer, startWallShift]);

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

      // Update fog of war
      if (config.fogRadius > 0) {
        setVisibleCells(getVisibleCells(newPos, newGrid, config.fogRadius));
      }

      // Check win
      if (checkWin(newPos, config.gridSize)) {
        stopTimer();
        stopWallShift();
        const finalTime = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        const finalMoves = moves + 1;
        const score = calculateScore(config.gridSize, finalMoves, finalTime, difficulty);
        setStatus("finished");
        setResult("win");
        endGame(finalTime, finalMoves, score);
      }
    },
    [status, grid, playerPos, difficulty, config, moves, stopTimer, stopWallShift, endGame]
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
    stopWallShift();
    setGrid([]);
    setPlayerPos({ row: 1, col: 1 });
    setStatus("idle");
    setResult(null);
    setMoves(0);
    setTimer(0);
    setCountdown(null);
    setMessage("Click Start to begin!");
    setGameStartedOnChain(false);
    setVisibleCells(null);
  }, [stopTimer, stopWallShift]);

  // Switch mode
  const switchMode = useCallback(
    (newMode: GameMode) => {
      if (status === "playing") return;
      setMode(newMode);
      resetGame();
    },
    [status, resetGame]
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
    countdown,
    moves,
    timer,
    stats,
    isConnected,
    gridSize: config.gridSize,
    visibleCells,
    timeLimit: config.timeLimit,
    fogRadius: config.fogRadius,
    movingWalls: config.movingWalls,

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
