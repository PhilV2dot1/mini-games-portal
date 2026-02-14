import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { MAZE_CONTRACT_ABI } from "@/lib/contracts/maze-abi";
import { getContractAddress, isGameAvailableOnChain } from "@/lib/contracts/addresses";
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

  // Game tracking
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);

  // Stats
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const contractAddress = getContractAddress('maze', chain?.id);
  const gameAvailable = isGameAvailableOnChain('maze', chain?.id);
  const { writeContractAsync, isPending } = useWriteContract();

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

  // End game (handles both free and on-chain)
  const endGame = useCallback(async (finalTime: number, finalMoves: number, score: number) => {
    if (mode === "free") {
      // Update local stats
      const newStats = { ...stats };
      newStats.games += 1;
      newStats.wins += 1;
      if (!newStats.bestTimes[difficulty] || finalTime < newStats.bestTimes[difficulty]!) {
        newStats.bestTimes[difficulty] = finalTime;
      }
      if (!newStats.bestMoves[difficulty] || finalMoves < newStats.bestMoves[difficulty]!) {
        newStats.bestMoves[difficulty] = finalMoves;
      }
      saveStats(newStats);
      setMessage(`🎉 Congratulations! Score: ${score}`);
    } else {
      // On-chain: record result
      if (!gameStartedOnChain) {
        setMessage(`🎉 Congratulations! Score: ${score}`);
        return;
      }

      try {
        setStatus("processing");
        setMessage("🎉 Recording victory on blockchain...");

        await writeContractAsync({
          address: contractAddress!,
          abi: MAZE_CONTRACT_ABI,
          functionName: "endGame",
          args: [getDifficultyEnum(difficulty), BigInt(finalTime), BigInt(finalMoves), BigInt(score)],
        });

        setGameStartedOnChain(false);
        await refetchStats();
        setMessage(`🎉 Victory! Score: ${score} - recorded on blockchain!`);
        setStatus("finished");
      } catch (error) {
        console.error("Failed to record result:", error);
        setMessage("⚠️ Game finished but not recorded on-chain");
        setGameStartedOnChain(false);
        setStatus("finished");
      }
    }
  }, [mode, stats, difficulty, gameStartedOnChain, writeContractAsync, contractAddress, refetchStats, saveStats]);

  // Start a new game
  const startGame = useCallback(async () => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const newGrid = generateMaze(config.gridSize);
    // Place player at start
    newGrid[1][1] = PLAYER;

    if (mode === "onchain") {
      if (!isConnected || !address) {
        setMessage("⚠️ Please connect wallet first");
        return;
      }

      try {
        setStatus("processing");
        setMessage("Starting game on blockchain...");

        await writeContractAsync({
          address: contractAddress!,
          abi: MAZE_CONTRACT_ABI,
          functionName: "startGame",
          args: [getDifficultyEnum(difficulty)],
        });

        setGameStartedOnChain(true);
        setGrid(newGrid);
        setPlayerPos({ row: 1, col: 1 });
        setStatus("playing");
        setResult(null);
        setMoves(0);
        setTimer(0);
        setMessage("");
        startTimer();
      } catch (error) {
        console.error("Failed to start on-chain game:", error);
        setMessage("⚠️ Failed to start on-chain game");
        setStatus("idle");
      }
    } else {
      setGrid(newGrid);
      setPlayerPos({ row: 1, col: 1 });
      setStatus("playing");
      setResult(null);
      setMoves(0);
      setTimer(0);
      setMessage("");
      startTimer();
    }
  }, [difficulty, mode, isConnected, address, writeContractAsync, contractAddress, startTimer]);

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
        const score = calculateScore(gridSize, finalMoves, finalTime);
        setStatus("finished");
        setResult("win");
        endGame(finalTime, finalMoves, score);
      }
    },
    [status, grid, playerPos, difficulty, moves, stopTimer, endGame]
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
    setGameStartedOnChain(false);
  }, [stopTimer]);

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
    moves,
    timer,
    stats,
    isConnected,
    isProcessing: isPending,
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
