import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { MEMORY_CONTRACT_ABI } from "@/lib/contracts/memory-abi";
import { getContractAddress, isGameAvailableOnChain } from "@/lib/contracts/addresses";
import {
  type Card,
  type Difficulty,
  DIFFICULTY_CONFIG,
  generateBoard,
  checkMatch,
  isBoardComplete,
  calculateScore,
} from "@/lib/games/memory-logic";

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

const STATS_KEY = "memory_stats";
const FLIP_DELAY = 800; // ms before unmatched cards flip back

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

export function useMemory() {
  // Game state
  const [board, setBoard] = useState<Card[]>([]);
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [result, setResult] = useState<GameResult>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [message, setMessage] = useState("Click Start to begin!");

  // Game tracking
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [timer, setTimer] = useState(0);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);

  // Stats
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const contractAddress = getContractAddress('memory', chain?.id);
  const gameAvailable = isGameAvailableOnChain('memory', chain?.id);
  const { writeContractAsync, isPending } = useWriteContract();

  // Read on-chain stats
  const { data: onChainStats, refetch: refetchStats } = useReadContract({
    address: contractAddress!,
    abi: MEMORY_CONTRACT_ABI,
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
    } catch { /* ignore */ }
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
    } catch { /* ignore */ }
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

  // End game (extracted to handle both free and on-chain)
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
          abi: MEMORY_CONTRACT_ABI,
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
    const newBoard = generateBoard(config.pairs);

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
          abi: MEMORY_CONTRACT_ABI,
          functionName: "startGame",
          args: [getDifficultyEnum(difficulty)],
        });

        setGameStartedOnChain(true);
        setBoard(newBoard);
        setStatus("playing");
        setResult(null);
        setMoves(0);
        setPairsFound(0);
        setTimer(0);
        setSelectedCards([]);
        setIsChecking(false);
        setMessage("");
        startTimer();
      } catch (error) {
        console.error("Failed to start on-chain game:", error);
        setMessage("⚠️ Failed to start on-chain game");
        setStatus("idle");
      }
    } else {
      setBoard(newBoard);
      setStatus("playing");
      setResult(null);
      setMoves(0);
      setPairsFound(0);
      setTimer(0);
      setSelectedCards([]);
      setIsChecking(false);
      setMessage("");
      startTimer();
    }
  }, [difficulty, mode, isConnected, address, writeContractAsync, contractAddress, startTimer]);

  // Handle card flip
  const flipCard = useCallback((cardIndex: number) => {
    if (status !== "playing" || isChecking) return;

    const card = board[cardIndex];
    if (!card || card.isFlipped || card.isMatched) return;
    if (selectedCards.length >= 2) return;

    // Flip the card
    const newBoard = [...board];
    newBoard[cardIndex] = { ...card, isFlipped: true };
    setBoard(newBoard);

    const newSelected = [...selectedCards, cardIndex];
    setSelectedCards(newSelected);

    // If this is the second card, check for match
    if (newSelected.length === 2) {
      setIsChecking(true);
      setMoves((prev) => prev + 1);

      const card1 = newBoard[newSelected[0]];
      const card2 = newBoard[newSelected[1]];

      if (checkMatch(card1, card2)) {
        // Match found!
        const matchedBoard = [...newBoard];
        matchedBoard[newSelected[0]] = { ...card1, isMatched: true };
        matchedBoard[newSelected[1]] = { ...card2, isMatched: true };
        setBoard(matchedBoard);
        setPairsFound((prev) => prev + 1);
        setSelectedCards([]);
        setIsChecking(false);

        // Check if game is complete
        if (isBoardComplete(matchedBoard)) {
          stopTimer();
          const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const finalMoves = moves + 1;
          const score = calculateScore(DIFFICULTY_CONFIG[difficulty].pairs, finalMoves, finalTime);
          setStatus("finished");
          setResult("win");
          endGame(finalTime, finalMoves, score);
        }
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          const resetBoard = [...newBoard];
          resetBoard[newSelected[0]] = { ...resetBoard[newSelected[0]], isFlipped: false };
          resetBoard[newSelected[1]] = { ...resetBoard[newSelected[1]], isFlipped: false };
          setBoard(resetBoard);
          setSelectedCards([]);
          setIsChecking(false);
        }, FLIP_DELAY);
      }
    }
  }, [status, isChecking, board, selectedCards, moves, difficulty, stopTimer, endGame]);

  // Reset game
  const resetGame = useCallback(() => {
    stopTimer();
    setBoard([]);
    setStatus("idle");
    setResult(null);
    setMoves(0);
    setPairsFound(0);
    setTimer(0);
    setSelectedCards([]);
    setIsChecking(false);
    setMessage("Click Start to begin!");
    setGameStartedOnChain(false);
  }, [stopTimer]);

  // Switch mode
  const switchMode = useCallback((newMode: GameMode) => {
    if (status === "playing") return;
    setMode(newMode);
    resetGame();
  }, [status, resetGame]);

  // Change difficulty
  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    if (status === "playing") return;
    setDifficulty(newDifficulty);
  }, [status]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    // State
    board,
    mode,
    status,
    result,
    difficulty,
    message,
    moves,
    pairsFound,
    timer,
    stats,
    isChecking,
    isConnected,
    isProcessing: isPending,
    totalPairs: DIFFICULTY_CONFIG[difficulty].pairs,

    // Actions
    startGame,
    flipCard,
    resetGame,
    switchMode,
    changeDifficulty,
    formatTime,
  };
}

export { DIFFICULTY_CONFIG, type Difficulty } from "@/lib/games/memory-logic";
