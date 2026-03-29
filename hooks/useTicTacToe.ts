import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { TICTACTOE_CONTRACT_ABI, GAME_RESULT } from "@/lib/contracts/tictactoe-abi";
import { getContractAddress, isGameAvailableOnChain } from "@/lib/contracts/addresses";

type CellValue = 0 | 1 | 2; // 0 = empty, 1 = X (player), 2 = O (AI)
type Board = CellValue[];
type GameMode = "free" | "onchain";
type GameStatus = "idle" | "waiting_start" | "playing" | "waiting_end" | "finished";
type GameResult = "win" | "lose" | "draw" | null;

export interface PlayerStats {
  games: number;
  wins: number;
  losses: number;
  draws: number;
}

export function useTicTacToe() {
  const [board, setBoard] = useState<Board>([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [result, setResult] = useState<GameResult>(null);
  const [stats, setStats] = useState<PlayerStats>({
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  });
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);
  const [message, setMessage] = useState("Click Start to begin!");

  // On-chain tx tracking
  const [startTxHash, setStartTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [endTxHash, setEndTxHash] = useState<`0x${string}` | undefined>(undefined);
  const pendingEndRef = useRef<{ gameResult: "win" | "lose" | "draw"; statsUpdate: PlayerStats } | null>(null);

  const { address, isConnected, chain } = useAccount();
  const contractAddress = getContractAddress('tictactoe', chain?.id);
  const gameAvailable = isGameAvailableOnChain('tictactoe', chain?.id);
  const { writeContractAsync } = useWriteContract();

  const { isSuccess: startConfirmed, isError: startFailed } = useWaitForTransactionReceipt({ hash: startTxHash });
  const { isSuccess: endConfirmed, isError: endFailed } = useWaitForTransactionReceipt({ hash: endTxHash });

  // Load stats from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tictactoe_celo_stats");
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
    address: contractAddress!,
    abi: TICTACTOE_CONTRACT_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: {
      enabled: mode === "onchain" && isConnected && !!address && gameAvailable,
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

  // startGame tx confirmed → start playing
  useEffect(() => {
    if (startConfirmed && status === "waiting_start") {
      setGameStartedOnChain(true);
      setBoard([0, 0, 0, 0, 0, 0, 0, 0, 0]);
      setResult(null);
      setStatus("playing");
      setMessage("Your turn! Tap a cell");
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
      const { gameResult, statsUpdate } = pendingEndRef.current;
      setStats(statsUpdate);
      localStorage.setItem("tictactoe_celo_stats", JSON.stringify(statsUpdate));
      refetchStats();
      if (gameResult === "win") setMessage("🎉 Victory recorded on blockchain!");
      else if (gameResult === "lose") setMessage("😢 AI Wins - recorded on blockchain");
      else setMessage("🤝 Draw - recorded on blockchain");
      setGameStartedOnChain(false);
      setStatus("finished");
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endConfirmed, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (endFailed && status === "waiting_end" && pendingEndRef.current) {
      const { gameResult, statsUpdate } = pendingEndRef.current;
      setStats(statsUpdate);
      localStorage.setItem("tictactoe_celo_stats", JSON.stringify(statsUpdate));
      if (gameResult === "win") setMessage("🎉 You Win! (not recorded on-chain)");
      else if (gameResult === "lose") setMessage("😢 AI Wins (not recorded on-chain)");
      else setMessage("🤝 Draw (not recorded on-chain)");
      setGameStartedOnChain(false);
      setStatus("finished");
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endFailed, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if player has won
  const checkWin = useCallback((player: 1 | 2, currentBoard: Board): boolean => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];
    return lines.some((line) => line.every((i) => currentBoard[i] === player));
  }, []);

  // AI move logic
  const getAIMove = useCallback(
    (currentBoard: Board): number => {
      // Try to win
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === 0) {
          const testBoard = [...currentBoard];
          testBoard[i] = 2;
          if (checkWin(2, testBoard)) {
            return i;
          }
        }
      }

      // Block player
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === 0) {
          const testBoard = [...currentBoard];
          testBoard[i] = 1;
          if (checkWin(1, testBoard)) {
            return i;
          }
        }
      }

      // Take center
      if (currentBoard[4] === 0) return 4;

      // Take corner
      const corners = [0, 2, 6, 8];
      for (const corner of corners) {
        if (currentBoard[corner] === 0) return corner;
      }

      // Take any
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === 0) return i;
      }

      return 0;
    },
    [checkWin]
  );

  // End game and record result
  const endGame = useCallback(
    async (gameResult: "win" | "lose" | "draw") => {
      setResult(gameResult);

      const statsUpdate = {
        ...stats,
        games: stats.games + 1,
        wins: stats.wins + (gameResult === "win" ? 1 : 0),
        losses: stats.losses + (gameResult === "lose" ? 1 : 0),
        draws: stats.draws + (gameResult === "draw" ? 1 : 0),
      };

      if (mode === "free") {
        setStats(statsUpdate);
        localStorage.setItem("tictactoe_celo_stats", JSON.stringify(statsUpdate));
        if (gameResult === "win") setMessage("🎉 Victory!");
        else if (gameResult === "lose") setMessage("😢 AI Wins");
        else setMessage("🤝 Draw!");
        setStatus("finished");
        return;
      }

      // On-chain mode
      if (!gameStartedOnChain) {
        if (gameResult === "win") setMessage("🎉 You Win!");
        else if (gameResult === "lose") setMessage("😢 AI Wins");
        else setMessage("🤝 Draw!");
        setStatus("finished");
        return;
      }

      const resultCode =
        gameResult === "win" ? GAME_RESULT.WIN
        : gameResult === "lose" ? GAME_RESULT.LOSE
        : GAME_RESULT.DRAW;

      if (gameResult === "win") setMessage("🎉 You Win! Signing transaction...");
      else if (gameResult === "lose") setMessage("😢 AI Wins! Signing transaction...");
      else setMessage("🤝 Draw! Signing transaction...");

      setStatus("waiting_end");
      pendingEndRef.current = { gameResult, statsUpdate };

      try {
        const hash = await writeContractAsync({
          address: contractAddress!,
          abi: TICTACTOE_CONTRACT_ABI,
          functionName: "endGame",
          args: [resultCode],
        });
        setEndTxHash(hash);
      } catch {
        setStats(statsUpdate);
        localStorage.setItem("tictactoe_celo_stats", JSON.stringify(statsUpdate));
        if (gameResult === "win") setMessage("🎉 You Win!");
        else if (gameResult === "lose") setMessage("😢 AI Wins");
        else setMessage("🤝 Draw!");
        setGameStartedOnChain(false);
        setStatus("finished");
        pendingEndRef.current = null;
      }
    },
    [mode, stats, gameStartedOnChain, writeContractAsync]
  );

  // Handle player move
  const handleMove = useCallback(
    async (position: number) => {
      if (status !== "playing" || board[position] !== 0) {
        return;
      }

      // Player move
      const newBoard = [...board];
      newBoard[position] = 1;
      setBoard(newBoard);

      // Check win
      if (checkWin(1, newBoard)) {
        await endGame("win");
        return;
      }

      // Check draw
      if (newBoard.every((c) => c !== 0)) {
        await endGame("draw");
        return;
      }

      // AI move
      setMessage("AI thinking...");

      setTimeout(async () => {
        const aiMove = getAIMove(newBoard);
        newBoard[aiMove] = 2;
        setBoard(newBoard);

        if (checkWin(2, newBoard)) {
          await endGame("lose");
        } else if (newBoard.every((c) => c !== 0)) {
          await endGame("draw");
        } else {
          setMessage("Your turn!");
          setStatus("playing");
        }
      }, 600);
    },
    [status, board, checkWin, getAIMove, endGame]
  );

  // Start game
  const startGame = useCallback(async () => {
    if (status === "waiting_start" || status === "playing") return;

    setStartTxHash(undefined);
    setEndTxHash(undefined);
    pendingEndRef.current = null;

    if (mode === "onchain") {
      if (!isConnected) {
        setMessage("Please connect wallet first!");
        return;
      }
      setStatus("waiting_start");
      setMessage("Sign transaction to start...");
      try {
        const hash = await writeContractAsync({
          address: contractAddress!,
          abi: TICTACTOE_CONTRACT_ABI,
          functionName: "startGame",
          args: [],
        });
        setStartTxHash(hash);
      } catch {
        setMessage("Transaction rejected");
        setStatus("idle");
      }
      return;
    }

    // Free mode
    setBoard([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setResult(null);
    setStatus("playing");
    setMessage("Your turn! Tap a cell");
  }, [status, mode, isConnected, writeContractAsync]);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setStatus("idle");
    setResult(null);
    setGameStartedOnChain(false);
    setMessage("Click Start to begin!");
    setStartTxHash(undefined);
    setEndTxHash(undefined);
    pendingEndRef.current = null;
  }, []);

  // Switch mode
  const switchMode = useCallback(
    (newMode: GameMode) => {
      setMode(newMode);
      resetGame();

      if (newMode === "onchain" && isConnected) {
        refetchStats();
      }
    },
    [resetGame, isConnected, refetchStats]
  );

  return {
    board,
    mode,
    status,
    result,
    stats,
    message,
    isConnected,
    startGame,
    handleMove,
    resetGame,
    switchMode,
  };
}
