import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { TICTACTOE_CONTRACT_ADDRESS, TICTACTOE_CONTRACT_ABI, GAME_RESULT } from "@/lib/contracts/tictactoe-abi";

type CellValue = 0 | 1 | 2; // 0 = empty, 1 = X (player), 2 = O (AI)
type Board = CellValue[];
type GameMode = "free" | "onchain";
type GameStatus = "idle" | "playing" | "processing" | "finished";
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

  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

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
    address: TICTACTOE_CONTRACT_ADDRESS,
    abi: TICTACTOE_CONTRACT_ABI,
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
        localStorage.setItem("tictactoe_celo_stats", JSON.stringify(newStats));

        if (gameResult === "win") setMessage("🎉 Victory!");
        else if (gameResult === "lose") setMessage("😢 AI Wins");
        else setMessage("🤝 Draw!");
      } else {
        // On-chain: record result
        if (!gameStartedOnChain) {
          if (gameResult === "win") setMessage("🎉 You Win!");
          else if (gameResult === "lose") setMessage("😢 AI Wins");
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
            address: TICTACTOE_CONTRACT_ADDRESS,
            abi: TICTACTOE_CONTRACT_ABI,
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
    [
      mode,
      stats,
      gameStartedOnChain,
      writeContractAsync,
      refetchStats,
    ]
  );

  // Handle player move
  const handleMove = useCallback(
    async (position: number) => {
      if (status !== "playing" || board[position] !== 0) {
        return;
      }

      setStatus("processing");

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
    if (status === "processing" || status === "playing") return;

    if (mode === "onchain" && !isConnected) {
      setMessage("Please connect wallet first!");
      return;
    }

    setStatus("processing");

    try {
      if (mode === "onchain") {
        setMessage("Recording game start on blockchain...");

        await writeContractAsync({
          address: TICTACTOE_CONTRACT_ADDRESS,
          abi: TICTACTOE_CONTRACT_ABI,
          functionName: "startGame",
          args: [],
        });

        setGameStartedOnChain(true);
      }

      // Reset board and start
      setBoard([0, 0, 0, 0, 0, 0, 0, 0, 0]);
      setResult(null);
      setStatus("playing");
      setMessage("Your turn! Tap a cell");
    } catch (error: any) {
      console.error("Start error:", error);

      let errorMsg = "Failed to start game";
      if (error.message?.includes("rejected")) {
        errorMsg = "Transaction rejected";
      } else if (error.message?.includes("insufficient funds")) {
        errorMsg = "Insufficient CELO for gas";
      }

      setMessage(errorMsg);
      setStatus("idle");
    }
  }, [status, mode, isConnected, writeContractAsync]);

  // Reset game
  const resetGame = useCallback(() => {
    if (status === "processing") return;

    setBoard([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setStatus("idle");
    setResult(null);
    setGameStartedOnChain(false);
    setMessage("Click Start to begin!");
  }, [status]);

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
