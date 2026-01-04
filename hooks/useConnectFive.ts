import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";

// ========================================
// TYPES
// ========================================

export type Player = 1 | 2; // 1 = Human (Red), 2 = AI (Yellow)
export type Cell = Player | null;
export type Board = Cell[][];
export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "playing" | "processing" | "finished";
export type GameResult = "win" | "lose" | "draw" | null;
export type AIDifficulty = "easy" | "medium" | "hard";

export interface PlayerStats {
  games: number;
  wins: number;
  losses: number;
  draws: number;
}

// ========================================
// CONSTANTS
// ========================================

export const ROWS = 6;
export const COLS = 7;
const WIN_LENGTH = 4;

// Contract configuration
const CONNECTFIVE_CONTRACT_ADDRESS = "0xd00a6170d83b446314b2e79f9603bc0a72c463e6" as `0x${string}`;
const CONNECTFIVE_CONTRACT_ABI = [
  {
    "type": "function",
    "name": "startGame",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "endGame",
    "inputs": [{"name": "result", "type": "uint8"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getPlayerStats",
    "inputs": [{"name": "player", "type": "address"}],
    "outputs": [
      {"name": "gamesPlayed", "type": "uint256"},
      {"name": "wins", "type": "uint256"},
      {"name": "losses", "type": "uint256"},
      {"name": "draws", "type": "uint256"}
    ],
    "stateMutability": "view"
  }
] as const;

const GAME_RESULT = {
  WIN: 0,
  LOSE: 1,
  DRAW: 2,
} as const;

// ========================================
// UTILITIES
// ========================================

function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function isColumnFull(board: Board, col: number): boolean {
  return board[0][col] !== null;
}

function getDropRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      return row;
    }
  }
  return -1;
}

function checkWin(board: Board, row: number, col: number, player: Player): boolean {
  const directions = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal \
    [1, -1], // diagonal /
  ];

  for (const [dx, dy] of directions) {
    let count = 1;

    // Check positive direction
    for (let i = 1; i < WIN_LENGTH; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      if (
        newRow >= 0 && newRow < ROWS &&
        newCol >= 0 && newCol < COLS &&
        board[newRow][newCol] === player
      ) {
        count++;
      } else break;
    }

    // Check negative direction
    for (let i = 1; i < WIN_LENGTH; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;
      if (
        newRow >= 0 && newRow < ROWS &&
        newCol >= 0 && newCol < COLS &&
        board[newRow][newCol] === player
      ) {
        count++;
      } else break;
    }

    if (count >= WIN_LENGTH) return true;
  }

  return false;
}

function isBoardFull(board: Board): boolean {
  return board[0].every(cell => cell !== null);
}

// ========================================
// AI LOGIC
// ========================================

/**
 * Evaluate board position for AI
 * Positive score = good for AI (player 2)
 * Negative score = good for human (player 1)
 */
function evaluateWindow(window: Cell[], player: Player): number {
  let score = 0;
  const opponent: Player = player === 1 ? 2 : 1;

  const playerCount = window.filter(c => c === player).length;
  const opponentCount = window.filter(c => c === opponent).length;
  const emptyCount = window.filter(c => c === null).length;

  if (playerCount === 4) score += 100;
  else if (playerCount === 3 && emptyCount === 1) score += 5;
  else if (playerCount === 2 && emptyCount === 2) score += 2;

  if (opponentCount === 3 && emptyCount === 1) score -= 80; // Block opponent!

  return score;
}

function scorePosition(board: Board, player: Player): number {
  let score = 0;

  // Score center column (good strategy)
  const centerCol = Math.floor(COLS / 2);
  const centerArray = board.map(row => row[centerCol]);
  const centerCount = centerArray.filter(c => c === player).length;
  score += centerCount * 3;

  // Score horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      const window = [board[row][col], board[row][col+1], board[row][col+2], board[row][col+3]];
      score += evaluateWindow(window, player);
    }
  }

  // Score vertical
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS - 3; row++) {
      const window = [board[row][col], board[row+1][col], board[row+2][col], board[row+3][col]];
      score += evaluateWindow(window, player);
    }
  }

  // Score diagonal /
  for (let row = 0; row < ROWS - 3; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      const window = [board[row][col], board[row+1][col+1], board[row+2][col+2], board[row+3][col+3]];
      score += evaluateWindow(window, player);
    }
  }

  // Score diagonal \
  for (let row = 3; row < ROWS; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      const window = [board[row][col], board[row-1][col+1], board[row-2][col+2], board[row-3][col+3]];
      score += evaluateWindow(window, player);
    }
  }

  return score;
}

function isTerminalNode(board: Board): boolean {
  // Check if someone won or board is full
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] !== null) {
        if (checkWin(board, row, col, board[row][col]!)) return true;
      }
    }
  }
  return isBoardFull(board);
}

function getValidColumns(board: Board): number[] {
  const valid: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (!isColumnFull(board, col)) {
      valid.push(col);
    }
  }
  return valid;
}

/**
 * Minimax algorithm with alpha-beta pruning for AI
 */
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): [number, number | null] {
  const validCols = getValidColumns(board);
  const isTerminal = isTerminalNode(board);

  if (depth === 0 || isTerminal) {
    if (isTerminal) {
      // Check for wins
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (board[row][col] === 2 && checkWin(board, row, col, 2)) {
            return [100000, null]; // AI wins
          } else if (board[row][col] === 1 && checkWin(board, row, col, 1)) {
            return [-100000, null]; // Human wins
          }
        }
      }
      return [0, null]; // Draw
    } else {
      return [scorePosition(board, 2), null]; // Score current position
    }
  }

  if (maximizingPlayer) {
    let value = -Infinity;
    let column = validCols[Math.floor(Math.random() * validCols.length)];

    for (const col of validCols) {
      const row = getDropRow(board, col);
      const boardCopy = board.map(r => [...r]);
      boardCopy[row][col] = 2;

      const newScore = minimax(boardCopy, depth - 1, alpha, beta, false)[0];
      if (newScore > value) {
        value = newScore;
        column = col;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break; // Beta cutoff
    }
    return [value, column];
  } else {
    let value = Infinity;
    let column = validCols[Math.floor(Math.random() * validCols.length)];

    for (const col of validCols) {
      const row = getDropRow(board, col);
      const boardCopy = board.map(r => [...r]);
      boardCopy[row][col] = 1;

      const newScore = minimax(boardCopy, depth - 1, alpha, beta, true)[0];
      if (newScore < value) {
        value = newScore;
        column = col;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break; // Alpha cutoff
    }
    return [value, column];
  }
}

/**
 * Get AI's best move using minimax algorithm
 */
function getAIMove(board: Board, difficulty: AIDifficulty = "medium"): number {
  const depthMap = {
    easy: 2,    // Easy: Depth 2 (weak AI, makes mistakes)
    medium: 4,  // Medium: Depth 4 (balanced AI)
    hard: 6,    // Hard: Depth 6 (strong AI, very challenging)
  };

  const depth = depthMap[difficulty];
  const [_, column] = minimax(board, depth, -Infinity, Infinity, true);
  return column ?? Math.floor(Math.random() * COLS);
}

// ========================================
// HOOK
// ========================================

export function useConnectFive() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [result, setResult] = useState<GameResult>(null);
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const [stats, setStats] = useState<PlayerStats>({
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  });
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);
  const [message, setMessage] = useState("Click Start to begin!");

  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Load stats from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("connectfive_celo_stats");
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load stats:", e);
      }
    }
  }, []);

  // Load on-chain stats when connected
  const { data: onChainStats, refetch: refetchStats } = useReadContract({
    address: CONNECTFIVE_CONTRACT_ADDRESS,
    abi: CONNECTFIVE_CONTRACT_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: {
      enabled: mode === "onchain" && isConnected && !!address,
    },
  });

  // Update stats when on-chain data changes
  useEffect(() => {
    if (mode === "onchain" && onChainStats) {
      const [gamesPlayed, wins, losses, draws] = onChainStats as readonly bigint[];
      setStats({
        games: Number(gamesPlayed),
        wins: Number(wins),
        losses: Number(losses),
        draws: Number(draws),
      });
    }
  }, [onChainStats, mode]);

  // End game and record result
  const endGame = useCallback(
    async (gameResult: "win" | "lose" | "draw") => {
      setStatus("finished");
      setResult(gameResult);

      if (mode === "free") {
        // Free play: update local stats
        const newStats = {
          ...stats,
          games: stats.games + 1,
          wins: stats.wins + (gameResult === "win" ? 1 : 0),
          losses: stats.losses + (gameResult === "lose" ? 1 : 0),
          draws: stats.draws + (gameResult === "draw" ? 1 : 0),
        };
        setStats(newStats);
        localStorage.setItem("connectfive_celo_stats", JSON.stringify(newStats));

        if (gameResult === "win") setMessage("🎉 Victory! You connected 4!");
        else if (gameResult === "lose") setMessage("😢 AI Wins!");
        else setMessage("🤝 Draw! Board is full");
      } else {
        // On-chain: record result
        if (!gameStartedOnChain) {
          if (gameResult === "win") setMessage("🎉 You Win!");
          else if (gameResult === "lose") setMessage("😢 AI Wins!");
          else setMessage("🤝 Draw!");
          return;
        }

        try {
          setStatus("processing");
          const resultCode =
            gameResult === "win"
              ? GAME_RESULT.WIN
              : gameResult === "lose"
              ? GAME_RESULT.LOSE
              : GAME_RESULT.DRAW;

          if (gameResult === "win")
            setMessage("🎉 You Win! Recording on blockchain...");
          else if (gameResult === "lose")
            setMessage("😢 AI Wins! Recording on blockchain...");
          else setMessage("🤝 Draw! Recording on blockchain...");

          await writeContractAsync({
            address: CONNECTFIVE_CONTRACT_ADDRESS,
            abi: CONNECTFIVE_CONTRACT_ABI,
            functionName: "endGame",
            args: [resultCode],
          });

          setGameStartedOnChain(false);
          await refetchStats();

          if (gameResult === "win")
            setMessage("🎉 Victory recorded on blockchain!");
          else if (gameResult === "lose")
            setMessage("😢 AI Wins - recorded on blockchain");
          else setMessage("🤝 Draw - recorded on blockchain");

          setStatus("finished");
        } catch (error) {
          console.error("Failed to record result:", error);
          setMessage("⚠️ Game finished but not recorded on-chain");
          setGameStartedOnChain(false);
          setStatus("finished");
        }
      }
    },
    [mode, stats, gameStartedOnChain, writeContractAsync, refetchStats]
  );

  // Handle player move
  const handleMove = useCallback(
    async (col: number) => {
      if (status !== "playing") return;
      if (isColumnFull(board, col)) return;

      const row = getDropRow(board, col);
      if (row === -1) return;

      // Player move
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = 1;
      setBoard(newBoard);

      // Check if player won
      if (checkWin(newBoard, row, col, 1)) {
        await endGame("win");
        return;
      }

      // Check for draw
      if (isBoardFull(newBoard)) {
        await endGame("draw");
        return;
      }

      // AI move
      setMessage("AI is thinking...");
      setTimeout(() => {
        const aiCol = getAIMove(newBoard, difficulty);
        const aiRow = getDropRow(newBoard, aiCol);

        if (aiRow !== -1) {
          const aiBoard = newBoard.map(r => [...r]);
          aiBoard[aiRow][aiCol] = 2;
          setBoard(aiBoard);

          // Check if AI won
          if (checkWin(aiBoard, aiRow, aiCol, 2)) {
            endGame("lose");
            return;
          }

          // Check for draw
          if (isBoardFull(aiBoard)) {
            endGame("draw");
            return;
          }

          setMessage("Your turn - drop a piece!");
        }
      }, 500); // Small delay for AI "thinking"
    },
    [board, status, difficulty, endGame]
  );

  // Start game
  const startGame = useCallback(async () => {
    setBoard(createEmptyBoard());
    setResult(null);
    setMessage("Your turn - drop a piece!");

    if (mode === "onchain") {
      if (!isConnected || !address) {
        setMessage("⚠️ Please connect wallet first");
        return;
      }

      try {
        setStatus("processing");
        setMessage("Starting game on blockchain...");

        await writeContractAsync({
          address: CONNECTFIVE_CONTRACT_ADDRESS,
          abi: CONNECTFIVE_CONTRACT_ABI,
          functionName: "startGame",
        });

        setGameStartedOnChain(true);
        setStatus("playing");
        setMessage("Game started! Your turn");
      } catch (error) {
        console.error("Failed to start on-chain game:", error);
        setMessage("⚠️ Failed to start on-chain game");
        setStatus("idle");
      }
    } else {
      setStatus("playing");
    }
  }, [mode, isConnected, address, writeContractAsync]);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setStatus("idle");
    setResult(null);
    setMessage("Click Start to begin!");
    setGameStartedOnChain(false);
  }, []);

  // Switch mode
  const switchMode = useCallback((newMode: GameMode) => {
    setMode(newMode);
    resetGame();
  }, [resetGame]);

  return {
    board,
    mode,
    status,
    result,
    difficulty,
    stats,
    message,
    isConnected,
    startGame,
    handleMove,
    resetGame,
    switchMode,
    setDifficulty,
  };
}
