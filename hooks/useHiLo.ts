"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { getContractAddress } from "@/lib/contracts/addresses";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "playing" | "gameover" | "cashout";
export type GuessResult = "correct" | "wrong" | "push" | null;

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  rank: Rank;
  suit: Suit;
  value: number; // A=1, 2-10=face, J=11, Q=12, K=13
}

export interface PlayerStats {
  games: number;
  wins: number;
  bestStreak: number;
  totalCorrect: number;
}

// ========================================
// CONSTANTS
// ========================================

const STATS_KEY = "hilo_stats";
const DEFAULT_STATS: PlayerStats = { games: 0, wins: 0, bestStreak: 0, totalCorrect: 0 };

const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];

const RANK_VALUES: Record<Rank, number> = {
  A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "10": 10, J: 11, Q: 12, K: 13,
};

// Streak multipliers: streak 0-1 = ×1, 2 = ×2, 3 = ×3, 4 = ×5, 5+ = ×10
const MULTIPLIERS = [1, 1, 2, 3, 5, 10];

function getMultiplier(streak: number): number {
  return MULTIPLIERS[Math.min(streak, MULTIPLIERS.length - 1)];
}

// ========================================
// ABI — HiLoSession.sol
// ========================================

const HILO_ABI = [
  {
    name: "startSession",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "endSession",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "outcome", type: "uint8" },   // 0 = WIN, 1 = LOSE
      { name: "streak",  type: "uint256" },
      { name: "score",   type: "uint256" },  // streak × multiplier
    ],
    outputs: [],
  },
  {
    name: "abandonSession",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;

// ========================================
// HELPERS
// ========================================

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, value: RANK_VALUES[rank] });
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadStats(): PlayerStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : DEFAULT_STATS;
  } catch { return DEFAULT_STATS; }
}

function saveStats(s: PlayerStats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

/**
 * Among the remaining deck cards, what % are strictly higher than currentValue?
 * Also returns % strictly lower.
 */
function calcProbabilities(remainingDeck: Card[], currentValue: number) {
  const total = remainingDeck.length;
  if (total === 0) return { higher: 0, lower: 0, equal: 0 };
  const higher = remainingDeck.filter(c => c.value > currentValue).length;
  const lower  = remainingDeck.filter(c => c.value < currentValue).length;
  const equal  = total - higher - lower;
  return {
    higher: Math.round((higher / total) * 100),
    lower:  Math.round((lower  / total) * 100),
    equal:  Math.round((equal  / total) * 100),
  };
}

// ========================================
// HOOK
// ========================================

export function useHiLo() {
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");

  // Deck state
  const [deck, setDeck] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [history, setHistory] = useState<Card[]>([]);
  const [nextCard, setNextCard] = useState<Card | null>(null);

  // Game progress
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [guessResult, setGuessResult] = useState<GuessResult>(null);
  const [probabilities, setProbabilities] = useState({ higher: 50, lower: 50, equal: 0 });

  // Stats
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);

  const { address, chain } = useAccount();
  const { writeContract } = useWriteContract();

  // Load stats on mount
  useEffect(() => {
    setStats(loadStats());
  }, []);

  // Update probabilities whenever current card or deck changes
  useEffect(() => {
    if (currentCard && deck.length > 0) {
      setProbabilities(calcProbabilities(deck, currentCard.value));
    }
  }, [currentCard, deck]);

  // ---- On-chain helpers ----

  const getContract = useCallback(() => {
    if (mode !== "onchain" || !address || !chain) return null;
    const contractAddress = getContractAddress("hilo", chain.id);
    if (!contractAddress) return null;
    return contractAddress as `0x${string}`;
  }, [mode, address, chain]);

  // ---- Actions ----

  const startGame = useCallback(() => {
    const shuffled = shuffle(buildDeck());
    const first = shuffled[0];
    const remaining = shuffled.slice(1);
    setDeck(remaining);
    setCurrentCard(first);
    setHistory([first]);
    setNextCard(null);
    setStreak(0);
    setMultiplier(1);
    setGuessResult(null);
    setStatus("playing");
    setProbabilities(calcProbabilities(remaining, first.value));

    // On-chain: open session
    const contractAddress = getContract();
    if (contractAddress) {
      writeContract({
        address: contractAddress,
        abi: HILO_ABI,
        functionName: "startSession",
      });
    }
  }, [getContract, writeContract]);

  const guess = useCallback((direction: "higher" | "lower") => {
    if (status !== "playing" || !currentCard || deck.length === 0) return;

    const next = deck[0];
    const remaining = deck.slice(1);

    let result: GuessResult;
    if (next.value === currentCard.value) {
      result = "push";
    } else if (direction === "higher" && next.value > currentCard.value) {
      result = "correct";
    } else if (direction === "lower" && next.value < currentCard.value) {
      result = "correct";
    } else {
      result = "wrong";
    }

    setNextCard(next);
    setGuessResult(result);

    if (result === "wrong") {
      // Game over — save local stats
      const saved = loadStats();
      const updated: PlayerStats = {
        games:        saved.games + 1,
        wins:         saved.wins,
        bestStreak:   Math.max(saved.bestStreak, streak),
        totalCorrect: saved.totalCorrect + streak,
      };
      saveStats(updated);
      setStats(updated);

      // On-chain: endSession(LOSE=1, streak, score)
      const contractAddress = getContract();
      if (contractAddress) {
        const score = streak * multiplier;
        writeContract({
          address: contractAddress,
          abi: HILO_ABI,
          functionName: "endSession",
          args: [1, BigInt(streak), BigInt(score)],
        });
      }

      setTimeout(() => setStatus("gameover"), 900);

    } else {
      const newStreak = result === "push" ? streak : streak + 1;
      const newMult = getMultiplier(newStreak);
      setStreak(newStreak);
      setMultiplier(newMult);
      setDeck(remaining);

      setTimeout(() => {
        setCurrentCard(next);
        setHistory(prev => [...prev.slice(-4), next]);
        setNextCard(null);
        setGuessResult(null);

        if (remaining.length === 0) {
          // Deck exhausted = auto-cashout win
          const saved = loadStats();
          const updated: PlayerStats = {
            games:        saved.games + 1,
            wins:         saved.wins + 1,
            bestStreak:   Math.max(saved.bestStreak, newStreak),
            totalCorrect: saved.totalCorrect + newStreak,
          };
          saveStats(updated);
          setStats(updated);

          // On-chain: endSession(WIN=0, streak, score)
          const contractAddress = getContract();
          if (contractAddress) {
            const score = newStreak * newMult;
            writeContract({
              address: contractAddress,
              abi: HILO_ABI,
              functionName: "endSession",
              args: [0, BigInt(newStreak), BigInt(score)],
            });
          }

          setStatus("cashout");
        }
      }, 700);
    }
  }, [status, currentCard, deck, streak, multiplier, getContract, writeContract]);

  const cashOut = useCallback(() => {
    if (status !== "playing" || streak < 2) return;

    const saved = loadStats();
    const updated: PlayerStats = {
      games:        saved.games + 1,
      wins:         saved.wins + 1,
      bestStreak:   Math.max(saved.bestStreak, streak),
      totalCorrect: saved.totalCorrect + streak,
    };
    saveStats(updated);
    setStats(updated);

    // On-chain: endSession(WIN=0, streak, score)
    const contractAddress = getContract();
    if (contractAddress) {
      const score = streak * multiplier;
      writeContract({
        address: contractAddress,
        abi: HILO_ABI,
        functionName: "endSession",
        args: [0, BigInt(streak), BigInt(score)],
      });
    }

    setStatus("cashout");
  }, [status, streak, multiplier, getContract, writeContract]);

  const resetGame = useCallback(() => {
    // If abandoning mid-game, close the on-chain session
    if (status === "playing") {
      const contractAddress = getContract();
      if (contractAddress) {
        writeContract({
          address: contractAddress,
          abi: HILO_ABI,
          functionName: "abandonSession",
        });
      }
    }

    setStatus("idle");
    setCurrentCard(null);
    setNextCard(null);
    setHistory([]);
    setStreak(0);
    setMultiplier(1);
    setGuessResult(null);
    setDeck([]);
  }, [status, getContract, writeContract]);

  const setGameMode = useCallback((m: GameMode) => {
    setMode(m);
    resetGame();
  }, [resetGame]);

  return {
    mode, status,
    currentCard, nextCard, history,
    streak, multiplier, guessResult, probabilities,
    stats, deck,
    startGame, guess, cashOut, resetGame, setGameMode,
  };
}
