import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import {
  SUDOKU_CONTRACT_ADDRESS,
  SUDOKU_CONTRACT_ABI,
} from "@/lib/contracts/sudoku-abi";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "playing" | "processing" | "finished";
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
    clues: 40,
    label: "Easy (40 clues)",
  },
  medium: {
    clues: 30,
    label: "Medium (30 clues)",
  },
  hard: {
    clues: 25,
    label: "Hard (25 clues)",
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

  // Wallet connection
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending: isProcessing } = useWriteContract();

  // Read contract stats (on-chain mode)
  const { data: contractStats, refetch: refetchStats } = useReadContract({
    address: SUDOKU_CONTRACT_ADDRESS,
    abi: SUDOKU_CONTRACT_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: {
      enabled: mode === "onchain" && !!address,
    },
  });

  // Save local stats to localStorage
  useEffect(() => {
    if (mode === "free") {
      localStorage.setItem("sudoku_celo_stats", JSON.stringify(stats));
    }
  }, [stats, mode]);

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

  // Start game
  const startGame = useCallback(async () => {
    try {
      setMessage("Loading puzzle...");
      setStatus("idle");

      // Check wallet for on-chain mode
      if (mode === "onchain") {
        if (!isConnected || !address) {
          setMessage("Please connect your wallet first!");
          return;
        }

        // Start game on contract
        setStatus("processing");
        setMessage("Starting game on blockchain...");

        await writeContractAsync({
          address: SUDOKU_CONTRACT_ADDRESS,
          abi: SUDOKU_CONTRACT_ABI,
          functionName: "startGame",
          args: [DIFFICULTY_ENUM[difficulty.toUpperCase() as keyof typeof DIFFICULTY_ENUM]],
        });

        setGameStartedOnChain(true);
      }

      // Fetch puzzle from API
      const { puzzle, solution } = await fetchPuzzle();

      // Parse puzzle
      const newBoard = parsePuzzle(puzzle, solution);

      setBoard(newBoard);
      setSolution(solution);
      setStatus("playing");
      setTimer(0);
      setHintsRemaining(MAX_HINTS);
      setHintsUsed(0);
      setSelectedCell(null);
      setConflictCells(new Set());
      setResult(null);
      setMessage("Solve the puzzle!");
    } catch (error) {
      console.error("Failed to start game:", error);
      setMessage("Failed to load puzzle. Please try again.");
      setStatus("idle");
    }
  }, [mode, difficulty, isConnected, address, writeContractAsync, fetchPuzzle]);

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
    if (status === "finished") return;

    setStatus("finished");
    setResult(gameResult);
    setSelectedCell(null);

    if (gameResult === "win") {
      setMessage(`🎉 Solved in ${formatTime(timer)}!`);

      // Update stats
      if (mode === "free") {
        const isPerfect = hintsUsed === 0;
        const newBestTimes = { ...stats.bestTimes };
        const currentBest = stats.bestTimes[difficulty];

        if (currentBest === null || timer < currentBest) {
          newBestTimes[difficulty] = timer;
        }

        setStats({
          games: stats.games + 1,
          wins: stats.wins + 1,
          bestTimes: newBestTimes,
          perfectGames: stats.perfectGames + (isPerfect ? 1 : 0),
          totalHintsUsed: stats.totalHintsUsed + hintsUsed,
        });
      } else if (mode === "onchain" && isConnected && address) {
        // End game on contract
        try {
          setStatus("processing");
          setMessage("Recording result on blockchain...");

          await writeContractAsync({
            address: SUDOKU_CONTRACT_ADDRESS,
            abi: SUDOKU_CONTRACT_ABI,
            functionName: "endGame",
            args: [
              GAME_RESULT.WIN,
              DIFFICULTY_ENUM[difficulty.toUpperCase() as keyof typeof DIFFICULTY_ENUM],
              BigInt(timer),
              hintsUsed,
            ],
          });

          setGameStartedOnChain(false);
          refetchStats();
          setStatus("finished");
          setMessage(`🎉 Solved in ${formatTime(timer)}!`);
        } catch (error) {
          console.error("Failed to end game on contract:", error);
          setStatus("finished");
          setMessage("Failed to record result on blockchain.");
        }
      }
    }
  }, [status, timer, mode, stats, difficulty, hintsUsed, isConnected, address, writeContractAsync, refetchStats]);

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
    if (status === "playing" || status === "processing") {
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
    isProcessing,
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
