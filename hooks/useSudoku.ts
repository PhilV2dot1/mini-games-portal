import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import {
  SUDOKU_CONTRACT_ABI,
} from "@/lib/contracts/sudoku-abi";
import { getContractAddress, isGameAvailableOnChain } from "@/lib/contracts/addresses";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "waiting_start" | "playing" | "waiting_end" | "finished";
export type GameResult = "win" | null;
export type Difficulty = "easy" | "medium" | "hard";

export interface SudokuCell {
  value: number; // 0 = empty, 1-9 = filled
  isGiven: boolean; // true if part of puzzle, false if user-entered
  row: number;
  col: number;
  region: number; // 0-8 (which 3x3 box)
}

export type SudokuBoard = SudokuCell[][];

export interface DifficultyConfig {
  clues: number;
  label: string;
}

export interface PlayerStats {
  games: number;
  wins: number;
  bestTimes: {
    easy: number | null;
    medium: number | null;
    hard: number | null;
  };
  perfectGames: number; // Games with no hints used
  totalHintsUsed: number;
}

export interface PuzzleResponse {
  newboard: {
    grids: Array<{
      value: number[][];
      solution: number[][];
      difficulty: string;
    }>;
  };
}

// ========================================
// CONSTANTS
// ========================================

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    clues: 50,
    label: "Easy (Beginner)",
  },
  medium: {
    clues: 35,
    label: "Medium",
  },
  hard: {
    clues: 25,
    label: "Hard",
  },
};

const GAME_RESULT = {
  WIN: 0,
} as const;

const DIFFICULTY_ENUM = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
} as const;

const MAX_HINTS = 3;
const API_URL = "https://sudoku-api.vercel.app/api/dosuku";

// ========================================
// UTILITIES
// ========================================

function createEmptyBoard(): SudokuBoard {
  const board: SudokuBoard = [];
  for (let row = 0; row < 9; row++) {
    board[row] = [];
    for (let col = 0; col < 9; col++) {
      board[row][col] = {
        value: 0,
        isGiven: false,
        row,
        col,
        region: getRegion(row, col),
      };
    }
  }
  return board;
}

function getRegion(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function checkRow(board: SudokuBoard, row: number, value: number, excludeCol?: number): boolean {
  for (let col = 0; col < 9; col++) {
    if (col !== excludeCol && board[row][col].value === value) {
      return false;
    }
  }
  return true;
}

function checkColumn(board: SudokuBoard, col: number, value: number, excludeRow?: number): boolean {
  for (let row = 0; row < 9; row++) {
    if (row !== excludeRow && board[row][col].value === value) {
      return false;
    }
  }
  return true;
}

function checkRegion(board: SudokuBoard, row: number, col: number, value: number): boolean {
  const regionRow = Math.floor(row / 3) * 3;
  const regionCol = Math.floor(col / 3) * 3;

  for (let r = regionRow; r < regionRow + 3; r++) {
    for (let c = regionCol; c < regionCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c].value === value) {
        return false;
      }
    }
  }
  return true;
}

function isValidMove(board: SudokuBoard, row: number, col: number, value: number): boolean {
  if (value === 0) return true; // Empty is always valid
  return checkRow(board, row, value, col) &&
         checkColumn(board, col, value, row) &&
         checkRegion(board, row, col, value);
}

function findConflicts(board: SudokuBoard): Set<string> {
  const conflicts = new Set<string>();

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = board[row][col].value;
      if (value === 0) continue;

      // Check if this cell has conflicts
      if (!isValidMove(board, row, col, value)) {
        conflicts.add(`${row},${col}`);
      }
    }
  }

  return conflicts;
}

function checkWinCondition(board: SudokuBoard, solution: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value !== solution[row][col]) {
        return false;
      }
    }
  }
  return true;
}

function parsePuzzle(puzzleData: number[][], solutionData: number[][]): SudokuBoard {
  const board: SudokuBoard = [];
  for (let row = 0; row < 9; row++) {
    board[row] = [];
    for (let col = 0; col < 9; col++) {
      const value = puzzleData[row][col];
      board[row][col] = {
        value: value,
        isGiven: value !== 0,
        row,
        col,
        region: getRegion(row, col),
      };
    }
  }
  return board;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ========================================
// MAIN HOOK
// ========================================

export function useSudoku() {
  // Game state
  const [board, setBoard] = useState<SudokuBoard>(createEmptyBoard());
  const [solution, setSolution] = useState<number[][]>([]);
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [result, setResult] = useState<GameResult>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timer, setTimer] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(MAX_HINTS);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [conflictCells, setConflictCells] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("Click Start to begin!");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);

  // Local stats (free mode)
  const [stats, setStats] = useState<PlayerStats>(() => {
    if (typeof window === "undefined") return {
      games: 0,
      wins: 0,
      bestTimes: { easy: null, medium: null, hard: null },
      perfectGames: 0,
      totalHintsUsed: 0,
    };

    const saved = localStorage.getItem("sudoku_celo_stats");
    return saved ? JSON.parse(saved) : {
      games: 0,
      wins: 0,
      bestTimes: { easy: null, medium: null, hard: null },
      perfectGames: 0,
      totalHintsUsed: 0,
    };
  });

  // On-chain tx tracking
  const [startTxHash, setStartTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [endTxHash, setEndTxHash] = useState<`0x${string}` | undefined>(undefined);
  const pendingEndRef = useRef<{ finalTime: number; finalMoves: number; statsUpdate: PlayerStats } | null>(null);

  // Wallet connection
  const { address, isConnected, chain } = useAccount();
  const contractAddress = getContractAddress('sudoku', chain?.id);
  const gameAvailable = isGameAvailableOnChain('sudoku', chain?.id);
  const { writeContractAsync } = useWriteContract();

  const { isSuccess: startConfirmed, isError: startFailed } = useWaitForTransactionReceipt({ hash: startTxHash });
  const { isSuccess: endConfirmed, isError: endFailed } = useWaitForTransactionReceipt({ hash: endTxHash });

  // Read contract stats (on-chain mode)
  const { data: contractStats, refetch: refetchStats } = useReadContract({
    address: contractAddress!,
    abi: SUDOKU_CONTRACT_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: {
      enabled: mode === "onchain" && !!address && gameAvailable,
    },
  });

  // Save local stats to localStorage
  useEffect(() => {
    if (mode === "free") {
      localStorage.setItem("sudoku_celo_stats", JSON.stringify(stats));
    }
  }, [stats, mode]);

  // Pending puzzle fetch ref — stored so startConfirmed effect can kick off play
  const pendingPuzzleFetchRef = useRef<(() => Promise<void>) | null>(null);

  // startGame tx confirmed → fetch puzzle and start playing
  useEffect(() => {
    if (startConfirmed && status === "waiting_start") {
      setGameStartedOnChain(true);
      setStartTxHash(undefined);
      setStatus("playing");
      // Execute the stored puzzle-fetch-and-start fn
      if (pendingPuzzleFetchRef.current) {
        pendingPuzzleFetchRef.current();
        pendingPuzzleFetchRef.current = null;
      }
    }
  }, [startConfirmed, status]);

  useEffect(() => {
    if (startFailed && status === "waiting_start") {
      setMessage("Transaction failed");
      setStatus("idle");
      setStartTxHash(undefined);
      pendingPuzzleFetchRef.current = null;
    }
  }, [startFailed, status]);

  // endGame tx confirmed → show final result
  useEffect(() => {
    if (endConfirmed && status === "waiting_end" && pendingEndRef.current) {
      refetchStats();
      setMessage(`🎉 Solved in ${formatTime(pendingEndRef.current.finalTime)}! Recorded on blockchain.`);
      setGameStartedOnChain(false);
      setStatus("finished");
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endConfirmed, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (endFailed && status === "waiting_end" && pendingEndRef.current) {
      const { finalTime } = pendingEndRef.current;
      setMessage(`🎉 Solved in ${formatTime(finalTime)}! (not recorded on-chain)`);
      setGameStartedOnChain(false);
      setStatus("finished");
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endFailed, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "playing") {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (status !== "playing" || !selectedCell) return;

      const [row, col] = selectedCell;

      switch (e.key) {
        case "ArrowUp":
          setSelectedCell([Math.max(0, row - 1), col]);
          break;
        case "ArrowDown":
          setSelectedCell([Math.min(8, row + 1), col]);
          break;
        case "ArrowLeft":
          setSelectedCell([row, Math.max(0, col - 1)]);
          break;
        case "ArrowRight":
          setSelectedCell([row, Math.min(8, col + 1)]);
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          handleNumberInput(parseInt(e.key));
          break;
        case "Delete":
        case "Backspace":
          handleErase();
          break;
        case "h":
        case "H":
          handleHint();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [status, selectedCell, board, hintsRemaining]);

  // Fetch puzzle from API
  const fetchPuzzle = useCallback(async (): Promise<{ puzzle: number[][], solution: number[][] }> => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("API request failed");

      const data: PuzzleResponse = await response.json();
      const grid = data.newboard.grids[0];

      return {
        puzzle: grid.value,
        solution: grid.solution,
      };
    } catch (error) {
      console.error("Failed to fetch puzzle:", error);
      throw error;
    }
  }, []);

  // Add extra clues for easier difficulties (makes puzzle more beginner-friendly)
  const adjustDifficulty = useCallback((puzzle: number[][], solution: number[][], targetDifficulty: Difficulty): number[][] => {
    // Count current clues
    let currentClues = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (puzzle[row][col] !== 0) currentClues++;
      }
    }

    const targetClues = DIFFICULTY_CONFIG[targetDifficulty].clues;
    const cluesNeeded = targetClues - currentClues;

    if (cluesNeeded <= 0) return puzzle; // Puzzle already has enough clues

    // Create a copy of the puzzle
    const adjustedPuzzle = puzzle.map(row => [...row]);

    // Get all empty cells
    const emptyCells: [number, number][] = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (adjustedPuzzle[row][col] === 0) {
          emptyCells.push([row, col]);
        }
      }
    }

    // Randomly select cells to reveal
    const cellsToReveal = Math.min(cluesNeeded, emptyCells.length);
    const shuffled = emptyCells.sort(() => Math.random() - 0.5);

    for (let i = 0; i < cellsToReveal; i++) {
      const [row, col] = shuffled[i];
      adjustedPuzzle[row][col] = solution[row][col];
    }

    return adjustedPuzzle;
  }, []);

  // Start game
  const startGame = useCallback(async () => {
    setStartTxHash(undefined);
    setEndTxHash(undefined);
    pendingEndRef.current = null;

    const launchGame = async () => {
      try {
        setMessage("Loading puzzle...");
        let { puzzle, solution } = await fetchPuzzle();
        puzzle = adjustDifficulty(puzzle, solution, difficulty);
        const newBoard = parsePuzzle(puzzle, solution);
        setBoard(newBoard);
        setSolution(solution);
        setTimer(0);
        setHintsRemaining(MAX_HINTS);
        setHintsUsed(0);
        setSelectedCell(null);
        setConflictCells(new Set());
        setResult(null);
        setStatus("playing");
        setMessage("Solve the puzzle!");
      } catch {
        setMessage("Failed to load puzzle. Please try again.");
        setStatus("idle");
      }
    };

    if (mode === "onchain") {
      if (!isConnected || !address) {
        setMessage("Please connect your wallet first!");
        return;
      }
      setStatus("waiting_start");
      setMessage("Sign transaction to start...");
      pendingPuzzleFetchRef.current = launchGame;
      try {
        const hash = await writeContractAsync({
          address: contractAddress!,
          abi: SUDOKU_CONTRACT_ABI,
          functionName: "startGame",
          args: [DIFFICULTY_ENUM[difficulty.toUpperCase() as keyof typeof DIFFICULTY_ENUM]],
        });
        setStartTxHash(hash);
      } catch {
        setMessage("Transaction rejected");
        setStatus("idle");
        pendingPuzzleFetchRef.current = null;
      }
      return;
    }

    // Free mode — launch immediately
    await launchGame();
  }, [mode, difficulty, isConnected, address, writeContractAsync, contractAddress, fetchPuzzle, adjustDifficulty]);

  // Handle cell selection
  const handleCellSelect = useCallback((row: number, col: number) => {
    if (status !== "playing") return;
    if (board[row][col].isGiven) return; // Can't select given cells

    setSelectedCell([row, col]);
  }, [status, board]);

  // Handle number input
  const handleNumberInput = useCallback((value: number) => {
    if (status !== "playing" || !selectedCell) return;

    const [row, col] = selectedCell;
    if (board[row][col].isGiven) return; // Can't modify given cells

    // Create new board with updated value
    const newBoard = board.map((r) => r.map((cell) => ({ ...cell })));
    newBoard[row][col].value = value;

    setBoard(newBoard);

    // Check win condition
    if (checkWinCondition(newBoard, solution)) {
      endGame("win");
    }
  }, [status, selectedCell, board, solution]);

  // Handle erase
  const handleErase = useCallback(() => {
    if (status !== "playing" || !selectedCell) return;

    const [row, col] = selectedCell;
    if (board[row][col].isGiven) return;

    const newBoard = board.map((r) => r.map((cell) => ({ ...cell })));
    newBoard[row][col].value = 0;

    setBoard(newBoard);
  }, [status, selectedCell, board]);

  // Handle hint (highlight conflicts)
  const handleHint = useCallback(() => {
    if (status !== "playing" || hintsRemaining <= 0) return;

    const conflicts = findConflicts(board);
    setConflictCells(conflicts);
    setHintsRemaining((prev) => prev - 1);
    setHintsUsed((prev) => prev + 1);
    setMessage(conflicts.size > 0 ? `${conflicts.size} conflict(s) highlighted!` : "No conflicts found!");

    // Clear conflicts after 3 seconds
    setTimeout(() => {
      setConflictCells(new Set());
      if (status === "playing") {
        setMessage("Solve the puzzle!");
      }
    }, 3000);
  }, [status, hintsRemaining, board]);

  // End game
  const endGame = useCallback(async (gameResult: GameResult) => {
    if (status === "finished" || status === "waiting_end") return;

    setResult(gameResult);
    setSelectedCell(null);

    if (gameResult !== "win") {
      setStatus("finished");
      return;
    }

    const isPerfect = hintsUsed === 0;
    const newBestTimes = { ...stats.bestTimes };
    const currentBest = stats.bestTimes[difficulty];
    if (currentBest === null || timer < currentBest) {
      newBestTimes[difficulty] = timer;
    }
    const statsUpdate = {
      games: stats.games + 1,
      wins: stats.wins + 1,
      bestTimes: newBestTimes,
      perfectGames: stats.perfectGames + (isPerfect ? 1 : 0),
      totalHintsUsed: stats.totalHintsUsed + hintsUsed,
    };

    if (mode === "free") {
      setStats(statsUpdate);
      localStorage.setItem("sudoku_celo_stats", JSON.stringify(statsUpdate));
      setMessage(`🎉 Solved in ${formatTime(timer)}!`);
      setStatus("finished");
      return;
    }

    if (!gameStartedOnChain) {
      setMessage(`🎉 Solved in ${formatTime(timer)}!`);
      setStatus("finished");
      return;
    }

    setStatus("waiting_end");
    setMessage("🎉 Solved! Signing transaction...");
    pendingEndRef.current = { finalTime: timer, finalMoves: hintsUsed, statsUpdate };
    setStats(statsUpdate);
    localStorage.setItem("sudoku_celo_stats", JSON.stringify(statsUpdate));

    try {
      const hash = await writeContractAsync({
        address: contractAddress!,
        abi: SUDOKU_CONTRACT_ABI,
        functionName: "endGame",
        args: [
          GAME_RESULT.WIN,
          DIFFICULTY_ENUM[difficulty.toUpperCase() as keyof typeof DIFFICULTY_ENUM],
          BigInt(timer),
          hintsUsed,
        ],
      });
      setEndTxHash(hash);
    } catch {
      setMessage(`🎉 Solved in ${formatTime(timer)}! (not recorded on-chain)`);
      setGameStartedOnChain(false);
      setStatus("finished");
      pendingEndRef.current = null;
    }
  }, [status, timer, mode, stats, difficulty, hintsUsed, gameStartedOnChain, writeContractAsync, contractAddress]);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setSolution([]);
    setStatus("idle");
    setResult(null);
    setTimer(0);
    setHintsRemaining(MAX_HINTS);
    setHintsUsed(0);
    setSelectedCell(null);
    setConflictCells(new Set());
    setMessage("Click Start to begin!");
    setGameStartedOnChain(false);
  }, []);

  // Switch mode
  const switchMode = useCallback((newMode: GameMode) => {
    if (status === "playing" || status === "waiting_start" || status === "waiting_end") {
      setMessage("Finish current game first!");
      return;
    }
    setMode(newMode);
    resetGame();
  }, [status, resetGame]);

  // Change difficulty
  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    if (status === "playing" || status === "processing") {
      setMessage("Finish current game first!");
      return;
    }
    setDifficulty(newDifficulty);
  }, [status]);

  // Get current stats based on mode
  const currentStats = mode === "onchain" && contractStats
    ? {
        games: Number(contractStats[0]),
        wins: Number(contractStats[1]),
        bestTimes: {
          easy: contractStats[2] > 0n ? Number(contractStats[2]) : null,
          medium: contractStats[3] > 0n ? Number(contractStats[3]) : null,
          hard: contractStats[4] > 0n ? Number(contractStats[4]) : null,
        },
        perfectGames: Number(contractStats[5]),
        totalHintsUsed: 0, // Not tracked on-chain
      }
    : stats;

  return {
    // State
    board,
    mode,
    status,
    result,
    difficulty,
    timer,
    hintsRemaining,
    selectedCell,
    conflictCells,
    stats: currentStats,
    message,
    isConnected,
    hintsUsed,

    // Actions
    startGame,
    handleCellSelect,
    handleNumberInput,
    handleErase,
    handleHint,
    resetGame,
    switchMode,
    changeDifficulty,

    // Utilities
    formatTime,
  };
}
