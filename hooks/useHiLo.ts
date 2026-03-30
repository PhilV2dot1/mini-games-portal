"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { getContractAddress } from "@/lib/contracts/addresses";
import { useLocalStats } from "@/hooks/useLocalStats";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus =
  | "idle"
  | "waiting_start"   // waiting for startSession tx signature + confirmation
  | "playing"
  | "waiting_end"     // waiting for endSession tx signature + confirmation
  | "gameover"
  | "cashout";
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
      { name: "score",   type: "uint256" },
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

  // On-chain tx tracking
  const [startTxHash, setStartTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [endTxHash, setEndTxHash]     = useState<`0x${string}` | undefined>(undefined);

  // Pending end args — computed when game ends, sent after confirmation
  const pendingEndRef = useRef<{
    outcome: 0 | 1;
    streak: number;
    score: number;
    finalStatus: "gameover" | "cashout";
    statsUpdate: PlayerStats;
  } | null>(null);

  const { address, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { recordGame } = useLocalStats();
  const recordGameRef = useRef(recordGame);
  useEffect(() => { recordGameRef.current = recordGame; }, [recordGame]);

  // Wait for startSession confirmation
  const { isSuccess: startConfirmed, isError: startFailed } = useWaitForTransactionReceipt({
    hash: startTxHash,
  });

  // Wait for endSession confirmation
  const { isSuccess: endConfirmed, isError: endFailed } = useWaitForTransactionReceipt({
    hash: endTxHash,
  });

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

  // ── startSession confirmed → start playing ──────────────────────────────────
  useEffect(() => {
    if (startConfirmed && status === "waiting_start") {
      setStatus("playing");
      setStartTxHash(undefined);
    }
  }, [startConfirmed, status]);

  // startSession failed → back to idle
  useEffect(() => {
    if (startFailed && status === "waiting_start") {
      setStatus("idle");
      setStartTxHash(undefined);
    }
  }, [startFailed, status]);

  // ── endSession confirmed → show final result ────────────────────────────────
  useEffect(() => {
    if (endConfirmed && status === "waiting_end" && pendingEndRef.current) {
      const { finalStatus, statsUpdate, outcome } = pendingEndRef.current;
      saveStats(statsUpdate);
      setStats(statsUpdate);
      recordGameRef.current("hilo", "onchain", outcome === 0 ? "win" : "lose");
      setStatus(finalStatus);
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endConfirmed, status]);

  // endSession failed → still show result (game played, just not recorded on-chain)
  useEffect(() => {
    if (endFailed && status === "waiting_end" && pendingEndRef.current) {
      const { finalStatus, statsUpdate, outcome } = pendingEndRef.current;
      saveStats(statsUpdate);
      setStats(statsUpdate);
      recordGameRef.current("hilo", "onchain", outcome === 0 ? "win" : "lose");
      setStatus(finalStatus);
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endFailed, status]);

  // ---- On-chain helpers ----

  const getContractAddress_ = useCallback((): `0x${string}` | null => {
    if (mode !== "onchain" || !address || !chain) return null;
    return getContractAddress("hilo", chain.id);
  }, [mode, address, chain]);

  // ---- Prepare deck (shared between free and onchain) ----

  const prepareDeck = useCallback(() => {
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
    setProbabilities(calcProbabilities(remaining, first.value));
    return { first, remaining };
  }, []);

  // ---- Actions ----

  const startGame = useCallback(async () => {
    const contractAddress = getContractAddress_();

    if (contractAddress) {
      // On-chain: sign startSession first, then play on confirmation
      setStatus("waiting_start");
      prepareDeck();
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: HILO_ABI,
          functionName: "startSession",
        });
        setStartTxHash(hash);
      } catch {
        // User rejected or error — back to idle
        setStatus("idle");
      }
    } else {
      // Free mode: start immediately
      prepareDeck();
      setStatus("playing");
    }
  }, [getContractAddress_, prepareDeck, writeContractAsync]);

  const _finishGame = useCallback(async (
    outcome: 0 | 1,
    finalStreak: number,
    finalMultiplier: number,
    finalStatus: "gameover" | "cashout",
  ) => {
    const score = finalStreak * finalMultiplier;
    const saved = loadStats();
    const statsUpdate: PlayerStats = {
      games:        saved.games + 1,
      wins:         outcome === 0 ? saved.wins + 1 : saved.wins,
      bestStreak:   Math.max(saved.bestStreak, finalStreak),
      totalCorrect: saved.totalCorrect + finalStreak,
    };

    const gameResult = outcome === 0 ? "win" : "lose";
    const contractAddress = getContractAddress_();
    if (contractAddress) {
      // On-chain: send endSession, wait for confirmation before showing result
      setStatus("waiting_end");
      pendingEndRef.current = { outcome, streak: finalStreak, score, finalStatus, statsUpdate };
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: HILO_ABI,
          functionName: "endSession",
          args: [outcome, BigInt(finalStreak), BigInt(score)],
        });
        setEndTxHash(hash);
      } catch {
        // User rejected or error — still show result
        saveStats(statsUpdate);
        setStats(statsUpdate);
        recordGameRef.current("hilo", "onchain", gameResult);
        setStatus(finalStatus);
        pendingEndRef.current = null;
      }
    } else {
      // Free mode: update stats and show result immediately
      saveStats(statsUpdate);
      setStats(statsUpdate);
      recordGameRef.current("hilo", "free", gameResult);
      setStatus(finalStatus);
    }
  }, [getContractAddress_, writeContractAsync]);

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
      setTimeout(() => {
        _finishGame(1, streak, multiplier, "gameover");
      }, 900);
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
          _finishGame(0, newStreak, newMult, "cashout");
        }
      }, 700);
    }
  }, [status, currentCard, deck, streak, multiplier, _finishGame]);

  const cashOut = useCallback(() => {
    if (status !== "playing" || streak < 2) return;
    _finishGame(0, streak, multiplier, "cashout");
  }, [status, streak, multiplier, _finishGame]);

  const resetGame = useCallback(() => {
    // If abandoning mid-game on-chain, send abandonSession (fire & forget)
    if (status === "playing") {
      const contractAddress = getContractAddress_();
      if (contractAddress) {
        writeContractAsync({
          address: contractAddress,
          abi: HILO_ABI,
          functionName: "abandonSession",
        }).catch(() => {/* noop */});
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
    setStartTxHash(undefined);
    setEndTxHash(undefined);
    pendingEndRef.current = null;
  }, [status, getContractAddress_, writeContractAsync]);

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
