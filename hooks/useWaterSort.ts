"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { getContractAddress } from "@/lib/contracts/addresses";
import { useLocalStats } from "@/hooks/useLocalStats";

// ========================================
// TYPES
// ========================================

export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "playing" | "won";
export type Difficulty = "easy" | "medium" | "hard";

export type Segment = string; // crypto id
export type Tube = Segment[]; // index 0 = bottom, last = top

export interface WaterSortStats {
  games: number;
  wins: number;
  bestMoves: { easy: number; medium: number; hard: number };
}

export interface PourAnim {
  from: number;    // source tube index
  to: number;      // destination tube index
  color: string;   // color of the segment being poured (crypto color)
  count: number;   // number of segments being poured
  ticker: string;  // crypto ticker for logo
}

// ========================================
// CRYPTO DEFINITIONS
// ========================================

export const CRYPTOS = [
  { id: "btc",  name: "Bitcoin",   ticker: "btc",  color: "#F7931A", light: "#FEE4BC" },
  { id: "eth",  name: "Ethereum",  ticker: "eth",  color: "#627EEA", light: "#D6DEFF" },
  { id: "sol",  name: "Solana",    ticker: "sol",  color: "#9945FF", light: "#E8D5FF" },
  { id: "bnb",  name: "BNB",       ticker: "bnb",  color: "#F3BA2F", light: "#FEF3C7" },
  { id: "xrp",  name: "XRP",       ticker: "xrp",  color: "#00AAE4", light: "#BAE6FD" },
  { id: "ada",  name: "Cardano",   ticker: "ada",  color: "#0033AD", light: "#BFDBFE" },
  { id: "avax", name: "Avalanche", ticker: "avax", color: "#E84142", light: "#FECACA" },
  { id: "dot",  name: "Polkadot",  ticker: "dot",  color: "#E6007A", light: "#FBCFE8" },
];

// ========================================
// LEVEL CONFIGS
// ========================================

const LEVEL_CONFIGS: Record<Difficulty, { numCryptos: number; numTubes: number }> = {
  easy:   { numCryptos: 6, numTubes: 8  },
  medium: { numCryptos: 7, numTubes: 9  },
  hard:   { numCryptos: 8, numTubes: 10 },
};

// ========================================
// CONTRACT ABI
// ========================================

const WATERSORT_ABI = [
  { type: "function", name: "startGame", inputs: [{ name: "difficulty", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "endGame", inputs: [{ name: "difficulty", type: "string" }, { name: "moves", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const;

// ========================================
// STATS
// ========================================

const STATS_KEY = "watersort_stats";
const DEFAULT_STATS: WaterSortStats = {
  games: 0,
  wins: 0,
  bestMoves: { easy: 0, medium: 0, hard: 0 },
};

function loadStats(): WaterSortStats {
  if (typeof window === "undefined") return { ...DEFAULT_STATS, bestMoves: { ...DEFAULT_STATS.bestMoves } };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS, bestMoves: { ...DEFAULT_STATS.bestMoves } };
    return JSON.parse(raw) as WaterSortStats;
  } catch {
    return { ...DEFAULT_STATS, bestMoves: { ...DEFAULT_STATS.bestMoves } };
  }
}

function saveStats(stats: WaterSortStats) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

// ========================================
// PUZZLE GENERATION
// ========================================

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePuzzle(numCryptos: number, numTubes: number): Tube[] {
  const cryptos = CRYPTOS.slice(0, numCryptos);
  // Each crypto appears exactly 4 times
  const segments: Segment[] = cryptos.flatMap(c => [c.id, c.id, c.id, c.id]);
  const shuffled = shuffleArray(segments);

  const tubes: Tube[] = [];
  for (let i = 0; i < numCryptos; i++) {
    tubes.push(shuffled.slice(i * 4, i * 4 + 4));
  }
  // Add empty tubes
  for (let i = 0; i < numTubes - numCryptos; i++) {
    tubes.push([]);
  }
  return tubes;
}

// ========================================
// POUR LOGIC (pure functions)
// ========================================

function canPour(tubes: Tube[], from: number, to: number): boolean {
  if (from === to) return false;
  const fromTube = tubes[from];
  const toTube = tubes[to];

  if (fromTube.length === 0) return false;
  if (toTube.length >= 4) return false;

  const topColor = fromTube[fromTube.length - 1];

  // Can pour into empty tube
  if (toTube.length === 0) return true;

  // Top of 'to' must match top of 'from'
  return toTube[toTube.length - 1] === topColor;
}

function pourLiquid(tubes: Tube[], from: number, to: number): Tube[] {
  const fromTube = tubes[from];
  const topColor = fromTube[fromTube.length - 1];

  // Count consecutive same color on top of 'from'
  let count = 0;
  for (let i = fromTube.length - 1; i >= 0; i--) {
    if (fromTube[i] === topColor) count++;
    else break;
  }

  // How many can fit in 'to'
  const space = 4 - tubes[to].length;
  const moveCount = Math.min(count, space);

  // Move segments
  const newTubes = tubes.map(t => [...t]);
  for (let i = 0; i < moveCount; i++) {
    newTubes[to].push(newTubes[from].pop()!);
  }
  return newTubes;
}

function checkWon(tubes: Tube[]): boolean {
  return tubes.every(tube => {
    if (tube.length === 0) return true;
    if (tube.length !== 4) return false;
    return tube.every(s => s === tube[0]);
  });
}

// ========================================
// HOOK
// ========================================

export function useWaterSort() {
  const { chain } = useAccount();
  const contractAddress = getContractAddress("watersort", chain?.id);

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [tubes, setTubes] = useState<Tube[]>([]);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [mode, setGameMode] = useState<GameMode>("free");
  const [stats, setStats] = useState<WaterSortStats>(() => loadStats());

  const [pourAnim, setPourAnim] = useState<PourAnim | null>(null);

  const { writeContractAsync } = useWriteContract();
  const { recordGame } = useLocalStats();
  const recordGameRef = useRef(recordGame);
  useEffect(() => { recordGameRef.current = recordGame; }, [recordGame]);

  // Stable refs for values used inside callbacks
  const tubesRef = useRef<Tube[]>([]);
  const selectedTubeRef = useRef<number | null>(null);
  const movesRef = useRef(0);
  const statusRef = useRef<GameStatus>("idle");
  const modeRef = useRef<GameMode>("free");
  const difficultyRef = useRef<Difficulty>("easy");
  const pourAnimRef = useRef<PourAnim | null>(null);

  tubesRef.current = tubes;
  selectedTubeRef.current = selectedTube;
  movesRef.current = moves;
  statusRef.current = status;
  modeRef.current = mode;
  difficultyRef.current = difficulty;
  pourAnimRef.current = pourAnim;

  const contractAddressRef = useRef(contractAddress);
  contractAddressRef.current = contractAddress;

  // Initialize puzzle on mount
  useEffect(() => {
    const config = LEVEL_CONFIGS[difficulty];
    setTubes(generatePuzzle(config.numCryptos, config.numTubes));
    setStatus("idle");
    setMoves(0);
    setSelectedTube(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startOnchain = useCallback(async (diff: Difficulty) => {
    if (modeRef.current !== "onchain" || !contractAddressRef.current) return;
    try {
      await writeContractAsync({
        address: contractAddressRef.current as `0x${string}`,
        abi: WATERSORT_ABI,
        functionName: "startGame",
        args: [diff],
      });
    } catch {
      // non-blocking
    }
  }, [writeContractAsync]);

  const handleWin = useCallback((newMoves: number, diff: Difficulty) => {
    setStatus("won");
    setStats(prevStats => {
      const newStats: WaterSortStats = {
        ...prevStats,
        games: prevStats.games + 1,
        wins: prevStats.wins + 1,
        bestMoves: {
          ...prevStats.bestMoves,
          [diff]: prevStats.bestMoves[diff] === 0
            ? newMoves
            : Math.min(prevStats.bestMoves[diff], newMoves),
        },
      };
      saveStats(newStats);
      return newStats;
    });
    recordGameRef.current("watersort", modeRef.current, "win", undefined);
    if (modeRef.current === "onchain" && contractAddressRef.current) {
      writeContractAsync({
        address: contractAddressRef.current as `0x${string}`,
        abi: WATERSORT_ABI,
        functionName: "endGame",
        args: [diff, BigInt(newMoves)],
      }).catch(() => {});
    }
  }, [writeContractAsync]);

  const selectTube = useCallback((idx: number) => {
    // Block interactions while animating
    if (pourAnimRef.current !== null) return;

    const currentStatus = statusRef.current;
    const currentTubes = tubesRef.current;
    const currentSelected = selectedTubeRef.current;
    const currentMoves = movesRef.current;
    const currentDifficulty = difficultyRef.current;

    // Start game on first interaction
    if (currentStatus === "idle") {
      setStatus("playing");
      startOnchain(currentDifficulty);
    }

    if (currentSelected === null) {
      // Select if tube not empty
      if (currentTubes[idx].length === 0) return;
      setSelectedTube(idx);
      return;
    }

    if (currentSelected === idx) {
      // Deselect
      setSelectedTube(null);
      return;
    }

    // Try to pour
    if (canPour(currentTubes, currentSelected, idx)) {
      const fromTube = currentTubes[currentSelected];
      const topSegId = fromTube[fromTube.length - 1];
      const crypto = CRYPTOS.find(c => c.id === topSegId);

      // Count consecutive same-color segments being poured
      let count = 0;
      for (let i = fromTube.length - 1; i >= 0; i--) {
        if (fromTube[i] === topSegId) count++;
        else break;
      }
      const space = 4 - currentTubes[idx].length;
      const moveCount = Math.min(count, space);

      const newTubes = pourLiquid(currentTubes, currentSelected, idx);
      const newMoves = currentMoves + 1;

      // Trigger pour animation first, then apply state after 450ms
      const anim: PourAnim = {
        from: currentSelected,
        to: idx,
        color: crypto?.color ?? "#888",
        count: moveCount,
        ticker: crypto?.ticker ?? topSegId,
      };
      setPourAnim(anim);

      setTimeout(() => {
        setTubes(newTubes);
        setMoves(newMoves);
        setSelectedTube(null);
        setPourAnim(null);

        if (checkWon(newTubes)) {
          handleWin(newMoves, currentDifficulty);
        }
      }, 450);

      return;
    }

    // Can't pour — select new tube if not empty
    if (currentTubes[idx].length > 0) {
      setSelectedTube(idx);
    } else {
      setSelectedTube(null);
    }
  }, [startOnchain, handleWin]);

  const resetGame = useCallback(() => {
    const config = LEVEL_CONFIGS[difficultyRef.current];
    setTubes(generatePuzzle(config.numCryptos, config.numTubes));
    setStatus("idle");
    setMoves(0);
    setSelectedTube(null);
    setPourAnim(null);
  }, []);

  const newGame = useCallback((diff: Difficulty) => {
    const config = LEVEL_CONFIGS[diff];
    setDifficulty(diff);
    setTubes(generatePuzzle(config.numCryptos, config.numTubes));
    setStatus("idle");
    setMoves(0);
    setSelectedTube(null);
    setPourAnim(null);
  }, []);

  return {
    tubes,
    selectedTube,
    moves,
    status,
    mode,
    difficulty,
    cryptos: CRYPTOS,
    selectTube,
    resetGame,
    newGame,
    setGameMode,
    stats,
    contractAddress,
    pourAnim,
  };
}
