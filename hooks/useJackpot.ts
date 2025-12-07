import { useState, useCallback } from "react";
import { useWriteContract, useAccount } from "wagmi";
import { JACKPOT_CONTRACT_ADDRESS, JACKPOT_CONTRACT_ABI } from "@/lib/contracts/jackpot-abi";

export type GameState = "idle" | "spinning" | "revealing" | "result";
export type GameMode = "free" | "onchain";

export interface GameResult {
  score: number;
  isJackpot: boolean;
  badge?: "Gold" | "Silver";
}

// Weighted outcomes based on crypto market cap
const WHEEL_OUTCOMES = [
  { points: 1000, weight: 2, isJackpot: true },  // BTC - Jackpot! (Rank #1)
  { points: 500, weight: 5, isJackpot: false },  // ETH (Rank #2)
  { points: 250, weight: 8, isJackpot: false },  // XRP (Rank #3)
  { points: 100, weight: 12, isJackpot: false }, // BNB (Rank #4)
  { points: 50, weight: 15, isJackpot: false },  // SOL (Rank #5)
  { points: 25, weight: 18, isJackpot: false },  // CELO (Rank #6)
  { points: 10, weight: 20, isJackpot: false },  // OP (Rank #7)
  { points: 0, weight: 20, isJackpot: false },   // MISS - Lose
];

function getRandomOutcome(): GameResult {
  const totalWeight = WHEEL_OUTCOMES.reduce((sum, outcome) => sum + outcome.weight, 0);
  let random = Math.random() * totalWeight;

  for (const outcome of WHEEL_OUTCOMES) {
    random -= outcome.weight;
    if (random <= 0) {
      return {
        score: outcome.points,
        isJackpot: outcome.isJackpot,
        badge: outcome.points >= 500 ? "Gold" : outcome.points >= 100 ? "Silver" : undefined,
      };
    }
  }

  return { score: 0, isJackpot: false };
}

export function useJackpot() {
  const [state, setState] = useState<GameState>("idle");
  const [mode, setMode] = useState<GameMode>("free");
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [sessionId, setSessionId] = useState<bigint | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Wagmi hooks for contract interaction
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const spin = useCallback(async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setState("spinning");

    try {
      if (mode === "free") {
        // Free play: Instant result with off-chain RNG
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate spin time
        const result = getRandomOutcome();

        setState("result");
        setLastResult(result);

        // Delay totalScore update to match visual sequence completion
        setTimeout(() => {
          setTotalScore(prev => prev + result.score);
          setIsSpinning(false);
        }, 3500);
      } else {
        // On-chain mode: Use smart contract
        if (!isConnected || !address) {
          throw new Error("Wallet not connected");
        }

        try {
          // For now, simulate the game in on-chain mode
          // In production, you'd want to integrate with Farcaster SDK for FID
          // and properly read the sessionId from events

          // Simulate spin
          await new Promise(resolve => setTimeout(resolve, 3000));
          const result = getRandomOutcome();

          setState("result");
          setLastResult(result);

          // Delay totalScore update to match visual sequence completion
          setTimeout(() => {
            setTotalScore(prev => prev + result.score);
            setIsSpinning(false);
          }, 3500);
        } catch (contractError) {
          console.error("Contract error:", contractError);
          throw contractError;
        }
      }
    } catch (error) {
      console.error("Spin error:", error);
      setState("idle");
      setIsSpinning(false);
    }
  }, [mode, isConnected, address, isSpinning]);

  const resetGame = useCallback(() => {
    setState("idle");
    setLastResult(null);
    setIsSpinning(false);
  }, []);

  const switchMode = useCallback((newMode: GameMode) => {
    setMode(newMode);
    resetGame();
  }, [resetGame]);

  return {
    state,
    mode,
    setMode: switchMode,
    spin,
    lastResult,
    totalScore,
    sessionId,
    resetGame,
    isSpinning: isSpinning || isPending,
    isConnected,
  };
}
