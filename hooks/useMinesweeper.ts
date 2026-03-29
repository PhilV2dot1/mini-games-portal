import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import {
  MINESWEEPER_CONTRACT_ABI,
} from "@/lib/contracts/minesweeper-abi";
import { getContractAddress, isGameAvailableOnChain } from "@/lib/contracts/addresses";

// ========================================
// TYPES
// ========================================

export type Player = 1 | 2;
export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "waiting_start" | "playing" | "waiting_end" | "finished";
export type GameResult = "win" | "lose" | null;
export type Difficulty = "easy" | "medium" | "hard";

export interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number; // 0-8
  row: number;
  col: number;
}

export type Board = Cell[][];

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

export interface PlayerStats {
  games: number;
  wins: number;
  losses: number;
  bestTimes: {
    easy: number | null;
    medium: number | null;
    hard: number | null;
  };
  totalFlagsUsed: number;
  perfectGames: number;
}

// ========================================
// CONSTANTS
// ========================================

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    rows: 8,
    cols: 8,
    mines: 10,
    label: "Easy (8×8, 10 mines)",
  },
  medium: {
    rows: 16,
    cols: 16,
    mines: 40,
    label: "Medium (16×16, 40 mines)",
  },
  hard: {
    rows: 16,
    cols: 30,
    mines: 99,
    label: "Hard (16×30, 99 mines)",
  },
};

const GAME_RESULT = {
  WIN: 0,
  LOSE: 1,
} as const;

const DIFFICULTY_ENUM = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
} as const;

const DIRECTIONS_8 = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

// ========================================
// UTILITIES
// ========================================

function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
      row,
      col,
    }))
  );
}

function getSafeCells(
  row: number,
  col: number,
  maxRows: number,
  maxCols: number
): Set<string> {
  const safe = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < maxRows && c >= 0 && c < maxCols) {
        safe.add(`${r},${c}`);
      }
    }
  }
  return safe;
}

function countAdjacentMines(board: Board, row: number, col: number): number {
  let count = 0;
  for (const [dr, dc] of DIRECTIONS_8) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < board.length && c >= 0 && c < board[0].length) {
      if (board[r][c].isMine) count++;
    }
  }
  return count;
}

function placeMines(
  board: Board,
  mineCount: number,
  safeRow: number,
  safeCol: number
): Board {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

  let minesPlaced = 0;
  const safeCells = getSafeCells(safeRow, safeCol, rows, cols);
  const maxAttempts = mineCount * 10;
  let attempts = 0;

  while (minesPlaced < mineCount && attempts < maxAttempts) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    if (!newBoard[row][col].isMine && !safeCells.has(`${row},${col}`)) {
      newBoard[row][col].isMine = true;
      minesPlaced++;
    }
    attempts++;
  }

  // Fallback deterministic placement if rejection sampling fails
  if (minesPlaced < mineCount) {
    for (let r = 0; r < rows && minesPlaced < mineCount; r++) {
      for (let c = 0; c < cols && minesPlaced < mineCount; c++) {
        if (!newBoard[r][c].isMine && !safeCells.has(`${r},${c}`)) {
          newBoard[r][c].isMine = true;
          minesPlaced++;
        }
      }
    }
  }

  // Calculate adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newBoard[r][c].isMine) {
        newBoard[r][c].adjacentMines = countAdjacentMines(newBoard, r, c);
      }
    }
  }

  return newBoard;
}

function floodFill(board: Board, row: number, col: number): Board {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const queue: [number, number][] = [[row, col]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const cell = newBoard[r][c];
    if (cell.isMine || cell.isFlagged || cell.isRevealed) continue;

    cell.isRevealed = true;

    // If cell has adjacent mines, don't propagate flood fill
    if (cell.adjacentMines > 0) continue;

    // Add all 8 adjacent cells to queue
    for (const [dr, dc] of DIRECTIONS_8) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        queue.push([nr, nc]);
      }
    }
  }

  return newBoard;
}

function revealAllMines(board: Board): Board {
  return board.map((row) =>
    row.map((cell) =>
      cell.isMine ? { ...cell, isRevealed: true } : { ...cell }
    )
  );
}

function checkWinCondition(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      // If any non-mine cell is not revealed, game not won
      if (!cell.isMine && !cell.isRevealed) {
        return false;
      }
    }
  }
  return true;
}

function checkIfPerfectGame(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      // If any flagged cell is not a mine, not perfect
      if (cell.isFlagged && !cell.isMine) {
        return false;
      }
    }
  }
  return true;
}

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

export function useMinesweeper() {
  const [board, setBoard] = useState<Board>([]);
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [result, setResult] = useState<GameResult>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timer, setTimer] = useState(0);
  const [flagsRemaining, setFlagsRemaining] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const [stats, setStats] = useState<PlayerStats>({
    games: 0,
    wins: 0,
    losses: 0,
    bestTimes: { easy: null, medium: null, hard: null },
    totalFlagsUsed: 0,
    perfectGames: 0,
  });
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);
  const [message, setMessage] = useState("Click Start to begin!");
  const [focusedCell, setFocusedCell] = useState<[number, number]>([0, 0]);

  // On-chain tx tracking
  const [startTxHash, setStartTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [endTxHash, setEndTxHash] = useState<`0x${string}` | undefined>(undefined);
  const pendingEndRef = useRef<{ gameResult: "win" | "lose"; statsUpdate: PlayerStats } | null>(null);

  const { address, isConnected, chain } = useAccount();
  const contractAddress = getContractAddress('minesweeper', chain?.id);
  const gameAvailable = isGameAvailableOnChain('minesweeper', chain?.id);
  const { writeContractAsync, isPending } = useWriteContract();

  const { isSuccess: startConfirmed, isError: startFailed } = useWaitForTransactionReceipt({ hash: startTxHash });
  const { isSuccess: endConfirmed, isError: endFailed } = useWaitForTransactionReceipt({ hash: endTxHash });

  // Read on-chain stats
  const { data: onChainStats, refetch: refetchStats } = useReadContract({
    address: contractAddress!,
    abi: MINESWEEPER_CONTRACT_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: {
      enabled: mode === "onchain" && isConnected && !!address && gameAvailable,
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "playing") {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("minesweeper_celo_stats");
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load stats:", e);
      }
    }
  }, []);

  // Update stats when on-chain data changes
  useEffect(() => {
    if (mode === "onchain" && onChainStats) {
      const [gamesPlayed, wins, losses, bestTimeEasy, bestTimeMedium, bestTimeHard] =
        onChainStats as [bigint, bigint, bigint, bigint, bigint, bigint];

      setStats((prev) => ({
        ...prev,
        games: Number(gamesPlayed),
        wins: Number(wins),
        losses: Number(losses),
        bestTimes: {
          easy: bestTimeEasy > 0n ? Number(bestTimeEasy) : null,
          medium: bestTimeMedium > 0n ? Number(bestTimeMedium) : null,
          hard: bestTimeHard > 0n ? Number(bestTimeHard) : null,
        },
      }));
    }
  }, [onChainStats, mode]);

  // Initialize board on mount and difficulty change
  useEffect(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    setBoard(createEmptyBoard(config.rows, config.cols));
    setFlagsRemaining(config.mines);
    setFocusedCell([0, 0]);
  }, [difficulty]);

  // Keyboard support
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (status !== "playing") return;

      const config = DIFFICULTY_CONFIG[difficulty];
      const [row, col] = focusedCell;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setFocusedCell([Math.max(0, row - 1), col]);
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedCell([Math.min(config.rows - 1, row + 1), col]);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setFocusedCell([row, Math.max(0, col - 1)]);
          break;
        case "ArrowRight":
          e.preventDefault();
          setFocusedCell([row, Math.min(config.cols - 1, col + 1)]);
          break;
        case " ": // Space
          e.preventDefault();
          handleCellClick(row, col);
          break;
        case "f":
        case "F":
          e.preventDefault();
          handleCellRightClick(row, col, e as any);
          break;
      }
    },
    [focusedCell, status, difficulty]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // startGame tx confirmed → start playing
  useEffect(() => {
    if (startConfirmed && status === "waiting_start") {
      setGameStartedOnChain(true);
      setStatus("playing");
      setMessage("Game started! Click a cell");
      setStartTxHash(undefined);
    }
  }, [startConfirmed, status]);

  useEffect(() => {
    if (startFailed && status === "waiting_start") {
      setMessage("Transaction failed");
      setStatus("idle");
      setStartTxHash(undefined);
    }
  }, [startFailed, status]);

  // endGame tx confirmed → show final result
  useEffect(() => {
    if (endConfirmed && status === "waiting_end" && pendingEndRef.current) {
      const { statsUpdate } = pendingEndRef.current;
      setStats(statsUpdate);
      localStorage.setItem("minesweeper_celo_stats", JSON.stringify(statsUpdate));
      refetchStats();
      setGameStartedOnChain(false);
      setStatus("finished");
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endConfirmed, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (endFailed && status === "waiting_end" && pendingEndRef.current) {
      const { statsUpdate } = pendingEndRef.current;
      setStats(statsUpdate);
      localStorage.setItem("minesweeper_celo_stats", JSON.stringify(statsUpdate));
      setGameStartedOnChain(false);
      setStatus("finished");
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endFailed, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start game
  const startGame = useCallback(async () => {
    const config = DIFFICULTY_CONFIG[difficulty];
    setBoard(createEmptyBoard(config.rows, config.cols));
    setFlagsRemaining(config.mines);
    setTimer(0);
    setFirstClick(true);
    setResult(null);
    setMessage("Click a cell to start!");
    setFocusedCell([0, 0]);
    setStartTxHash(undefined);
    setEndTxHash(undefined);
    pendingEndRef.current = null;

    if (mode === "onchain") {
      if (!isConnected || !address) {
        setMessage("⚠️ Please connect wallet first");
        return;
      }
      setStatus("waiting_start");
      setMessage("Sign transaction to start...");
      try {
        const hash = await writeContractAsync({
          address: contractAddress!,
          abi: MINESWEEPER_CONTRACT_ABI,
          functionName: "startGame",
          args: [getDifficultyEnum(difficulty)],
        });
        setStartTxHash(hash);
      } catch {
        setMessage("Transaction rejected");
        setStatus("idle");
      }
      return;
    }

    setStatus("playing");
  }, [mode, difficulty, isConnected, address, writeContractAsync]);

  // Handle cell click (reveal)
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (status !== "playing") return;
      if (board[row]?.[col]?.isRevealed || board[row]?.[col]?.isFlagged) return;

      let newBoard = [...board.map((r) => r.map((c) => ({ ...c })))];

      // First click: place mines
      if (firstClick) {
        const config = DIFFICULTY_CONFIG[difficulty];
        newBoard = placeMines(newBoard, config.mines, row, col);
        setFirstClick(false);
      }

      const cell = newBoard[row][col];

      // Hit a mine - game over
      if (cell.isMine) {
        newBoard = revealAllMines(newBoard);
        setBoard(newBoard);
        endGame("lose");
        return;
      }

      // Flood fill if cell has no adjacent mines
      if (cell.adjacentMines === 0) {
        newBoard = floodFill(newBoard, row, col);
      } else {
        newBoard[row][col].isRevealed = true;
      }

      setBoard(newBoard);

      // Check win condition
      if (checkWinCondition(newBoard)) {
        endGame("win");
      }
    },
    [board, status, firstClick, difficulty]
  );

  // Handle cell right-click (flag)
  const handleCellRightClick = useCallback(
    (row: number, col: number, event: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
      if ("preventDefault" in event) {
        event.preventDefault();
      }
      if (status !== "playing") return;
      if (!board[row]?.[col]) return;

      const newBoard = board.map((r) => r.map((c) => ({ ...c })));
      const cell = newBoard[row][col];

      // Can't flag revealed cells
      if (cell.isRevealed) return;

      if (cell.isFlagged) {
        // Remove flag
        cell.isFlagged = false;
        setFlagsRemaining((prev) => prev + 1);
      } else {
        // Add flag (if we have flags remaining)
        if (flagsRemaining > 0) {
          cell.isFlagged = true;
          setFlagsRemaining((prev) => prev - 1);
        } else {
          return; // Can't place more flags
        }
      }

      setBoard(newBoard);
    },
    [board, status, flagsRemaining]
  );

  // End game
  const endGame = useCallback(
    async (gameResult: "win" | "lose") => {
      setResult(gameResult);

      const config = DIFFICULTY_CONFIG[difficulty];
      const flagsUsed = config.mines - flagsRemaining;
      const isPerfectGame = gameResult === "win" && checkIfPerfectGame(board);

      const newBestTimes = { ...stats.bestTimes };
      if (gameResult === "win") {
        const currentBest = stats.bestTimes[difficulty];
        if (currentBest === null || timer < currentBest) {
          newBestTimes[difficulty] = timer;
        }
      }

      const statsUpdate: PlayerStats = {
        games: stats.games + 1,
        wins: stats.wins + (gameResult === "win" ? 1 : 0),
        losses: stats.losses + (gameResult === "lose" ? 1 : 0),
        bestTimes: newBestTimes,
        totalFlagsUsed: stats.totalFlagsUsed + flagsUsed,
        perfectGames: stats.perfectGames + (isPerfectGame ? 1 : 0),
      };

      if (mode === "free") {
        setStats(statsUpdate);
        localStorage.setItem("minesweeper_celo_stats", JSON.stringify(statsUpdate));
        if (gameResult === "win") setMessage(`🎉 Victory in ${timer}s!`);
        else setMessage("💣 Boom! Game Over");
        setStatus("finished");
        return;
      }

      if (!gameStartedOnChain) {
        if (gameResult === "win") setMessage(`🎉 Victory in ${timer}s!`);
        else setMessage("💣 Boom! Game Over");
        setStatus("finished");
        return;
      }

      const resultCode = gameResult === "win" ? GAME_RESULT.WIN : GAME_RESULT.LOSE;
      setMessage(gameResult === "win" ? "🎉 Victory! Signing transaction..." : "💣 Game Over! Signing transaction...");
      setStatus("waiting_end");
      pendingEndRef.current = { gameResult, statsUpdate };

      try {
        const hash = await writeContractAsync({
          address: contractAddress!,
          abi: MINESWEEPER_CONTRACT_ABI,
          functionName: "endGame",
          args: [resultCode, getDifficultyEnum(difficulty), BigInt(timer)],
        });
        setEndTxHash(hash);
      } catch {
        setStats(statsUpdate);
        localStorage.setItem("minesweeper_celo_stats", JSON.stringify(statsUpdate));
        if (gameResult === "win") setMessage(`🎉 Victory in ${timer}s!`);
        else setMessage("💣 Boom! Game Over");
        setGameStartedOnChain(false);
        setStatus("finished");
        pendingEndRef.current = null;
      }
    },
    [mode, stats, difficulty, timer, flagsRemaining, board, gameStartedOnChain, writeContractAsync]
  );

  // Reset game
  const resetGame = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    setBoard(createEmptyBoard(config.rows, config.cols));
    setStatus("idle");
    setResult(null);
    setTimer(0);
    setFlagsRemaining(config.mines);
    setFirstClick(true);
    setMessage("Click Start to begin!");
    setGameStartedOnChain(false);
    setFocusedCell([0, 0]);
  }, [difficulty]);

  // Switch mode
  const switchMode = useCallback(
    (newMode: GameMode) => {
      setMode(newMode);
      resetGame();
    },
    [resetGame]
  );

  // Change difficulty
  const changeDifficulty = useCallback(
    (newDifficulty: Difficulty) => {
      if (status === "playing") return; // Can't change during game
      setDifficulty(newDifficulty);
      const config = DIFFICULTY_CONFIG[newDifficulty];
      setBoard(createEmptyBoard(config.rows, config.cols));
      setFlagsRemaining(config.mines);
      setFocusedCell([0, 0]);
    },
    [status]
  );

  return {
    // State
    board,
    mode,
    status,
    result,
    difficulty,
    timer,
    flagsRemaining,
    stats,
    message,
    isConnected,
    isProcessing: isPending,
    focusedCell,

    // Actions
    startGame,
    handleCellClick,
    handleCellRightClick,
    resetGame,
    switchMode,
    changeDifficulty,
  };
}
