import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { GAME2048_CONTRACT_ABI } from "@/lib/contracts/2048-abi";
import { getContractAddress, isGameAvailableOnChain } from "@/lib/contracts/addresses";
import {
  Grid,
  Direction,
  initializeGame,
  move,
  addRandomTile,
  hasWon,
  hasValidMoves,
} from "@/lib/games/2048-logic";

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "playing" | "won" | "lost";

export function use2048() {
  const [grid, setGrid] = useState<Grid>(() => initializeGame().grid);
  const [score, setScore] = useState(0);
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("playing");
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);

  const { address, isConnected, chain } = useAccount();
  const contractAddress = getContractAddress('2048', chain?.id);
  const gameAvailable = isGameAvailableOnChain('2048', chain?.id);
  const { writeContractAsync, isPending } = useWriteContract();

  const handleMove = useCallback((direction: Direction) => {
    setGrid((currentGrid) => {
      const { newGrid, score: moveScore, moved } = move(currentGrid, direction);

      if (!moved) return currentGrid;

      const gridWithNewTile = addRandomTile(newGrid);

      // Update score
      setScore((currentScore) => currentScore + moveScore);

      // Check win/loss conditions
      if (hasWon(gridWithNewTile)) {
        setStatus("won");
      } else if (!hasValidMoves(gridWithNewTile)) {
        setStatus("lost");
      }

      return gridWithNewTile;
    });
  }, []);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };

      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  const startNewGame = useCallback(async () => {
    if (mode === "onchain" && !isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (mode === "onchain") {
      try {
        await writeContractAsync({
          address: contractAddress!,
          abi: GAME2048_CONTRACT_ABI,
          functionName: "startGame",
        });
        setGameStartedOnChain(true);
      } catch (error) {
        console.error("Failed to start on-chain game:", error);
        return;
      }
    }

    const { grid: newGrid, score: newScore } = initializeGame();
    setGrid(newGrid);
    setScore(newScore);
    setStatus("playing");
  }, [mode, isConnected, writeContractAsync]);

  const submitScore = useCallback(async () => {
    if (mode === "onchain" && gameStartedOnChain) {
      try {
        await writeContractAsync({
          address: contractAddress!,
          abi: GAME2048_CONTRACT_ABI,
          functionName: "submitScore",
          args: [BigInt(score), status === "won"],
        });
        setGameStartedOnChain(false);
      } catch (error) {
        console.error("Failed to submit score:", error);
      }
    }
  }, [mode, gameStartedOnChain, score, status, writeContractAsync]);

  const switchMode = useCallback((newMode: GameMode) => {
    setMode(newMode);
    const { grid: newGrid, score: newScore } = initializeGame();
    setGrid(newGrid);
    setScore(newScore);
    setStatus("playing");
    setGameStartedOnChain(false);
  }, []);

  return {
    grid,
    score,
    mode,
    status,
    isConnected,
    isPending,
    gameStartedOnChain,
    handleMove,
    startNewGame,
    submitScore,
    switchMode,
  };
}
