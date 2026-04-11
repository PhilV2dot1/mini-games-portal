"use client";

import Link from "next/link";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { FarcasterShare } from "@/components/shared/FarcasterShare";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getContractAddress, getExplorerAddressUrl, getExplorerName } from "@/lib/contracts/addresses";
import {
  TOKENS,
  getPoolForDifficulty,
  type TokenMeta,
  type Difficulty,
} from "./tokens";

// ─── ABI ─────────────────────────────────────────────────────────────────────

const CHL_ABI = [
  {
    name: "startSession",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "difficulty", type: "uint8" }],
    outputs: [],
  },
  {
    name: "endSession",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "outcome",   type: "uint8" },   // 0 = WIN, 1 = LOSE
      { name: "roundsWon", type: "uint256" },
      { name: "score",     type: "uint256" },
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

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ROUNDS      = 10;
const BASE_POINTS     = 50;
const WALLET_BONUS    = 25;
const HARD_MULTIPLIER = 1.5;
const RESULT_FLASH_MS = 1800;

type GameStatus =
  | "idle"
  | "waiting_start"  // waiting for startSession tx
  | "loading"        // fetching prices
  | "playing"
  | "waiting_end"    // waiting for endSession tx
  | "gameover";

interface RoundResult {
  round: number;
  tokenA: TokenMeta;
  tokenB: TokenMeta;
  priceA: number;
  priceB: number;
  guess: "higher" | "lower";
  correct: boolean;
  pts: number;
  walletBonus: boolean;
}

// ─── Price helpers ────────────────────────────────────────────────────────────

function formatPrice(usd: number): string {
  if (usd >= 1000) return `$${usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (usd >= 1)    return `$${usd.toFixed(2)}`;
  if (usd >= 0.001) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(8)}`;
}

function formatMarketCap(mc: number): string {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9)  return `$${(mc / 1e9).toFixed(1)}B`;
  if (mc >= 1e6)  return `$${(mc / 1e6).toFixed(0)}M`;
  return `$${mc.toFixed(0)}`;
}

function roundMarketCapHint(mc: number, difficulty: Difficulty): string {
  if (difficulty === "hard") return "";
  if (difficulty === "easy") return formatMarketCap(mc);
  // medium — round to nearest B
  if (mc >= 1e9) return `~$${(Math.round(mc / 1e9 * 10) / 10).toFixed(1)}B`;
  if (mc >= 1e6) return `~$${Math.round(mc / 1e6)}M`;
  return `~$${mc.toFixed(0)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TokenLogo({ token, size = 56 }: { token: TokenMeta; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size,
        backgroundColor: token.color,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        fontSize: size * 0.34, fontWeight: 900,
        color: token.textColor,
        letterSpacing: "-0.02em",
        boxShadow: `0 0 0 3px ${token.color}33`,
      }}
    >
      {token.symbol.slice(0, 3)}
    </div>
  );
}

function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  const opts: { id: Difficulty; label: string; hint: string; color: string }[] = [
    { id: "easy",   label: "Easy",   hint: "Top 10 + hints",    color: "#35D07F" },
    { id: "medium", label: "Medium", hint: "Top 50 + hints",    color: "#F7931A" },
    { id: "hard",   label: "Hard",   hint: "All + ×1.5 score",  color: "#E84142" },
  ];
  return (
    <div className="flex gap-2 justify-center">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={value === o.id ? { borderColor: o.color, color: o.color } : {}}
          className={`flex-1 py-2 px-1 rounded-xl border-2 text-xs font-bold transition-all
            ${value === o.id ? "bg-white/10" : "border-gray-600 text-gray-400 hover:border-gray-400"}`}
        >
          <div className="text-sm">{o.label}</div>
          <div className="text-[10px] font-normal opacity-70 mt-0.5">{o.hint}</div>
        </button>
      ))}
    </div>
  );
}

function TokenCardRevealed({ token, price, marketCap }: { token: TokenMeta; price: number; marketCap: number }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-4">
      <TokenLogo token={token} size={56} />
      <div className="min-w-0">
        <p className="text-white font-bold text-base leading-tight">{token.name}</p>
        <p className="text-gray-400 text-xs">{token.symbol}</p>
        <p className="font-black text-lg mt-1" style={{ color: "#FCFF52" }}>{formatPrice(price)}</p>
        {marketCap > 0 && (
          <p className="text-gray-500 text-xs">MCap {formatMarketCap(marketCap)}</p>
        )}
      </div>
    </div>
  );
}

function TokenCardMystery({
  token, marketCap, difficulty,
}: {
  token: TokenMeta; marketCap: number; difficulty: Difficulty;
}) {
  const hint = difficulty !== "hard" && marketCap > 0
    ? `Market cap ${roundMarketCapHint(marketCap, difficulty)}`
    : null;
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-4">
      <TokenLogo token={token} size={56} />
      <div className="min-w-0 flex-1">
        <p className="text-white font-bold text-base leading-tight">{token.name}</p>
        <p className="text-gray-400 text-xs">{token.symbol}</p>
        <p className="text-gray-500 font-black text-lg mt-1 tracking-[0.3em]">• • • •</p>
        {hint && <p className="text-gray-400 text-xs">{hint}</p>}
        <p className="text-gray-500 text-[11px] italic mt-1 line-clamp-1">{token.funFact}</p>
      </div>
    </div>
  );
}

function VSDivider() {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-white/10" />
      <span className="font-black text-sm" style={{ color: "#FCFF52" }}>VS</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

function ResultFlash({
  correct, pts, tokenB, revealedPrice, walletBonus,
}: {
  correct: boolean; pts: number; tokenB: TokenMeta; revealedPrice: number; walletBonus: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center z-20
        ${correct ? "bg-green-900/90" : "bg-red-900/90"}`}
    >
      <div className="text-4xl mb-2">{correct ? "✅" : "❌"}</div>
      <p className="text-white font-black text-2xl">{correct ? "Correct!" : "Wrong!"}</p>
      <p className="text-gray-200 text-sm mt-1">
        {tokenB.name} = <span className="font-bold" style={{ color: "#FCFF52" }}>{formatPrice(revealedPrice)}</span>
      </p>
      {correct && <p className="text-green-300 font-bold text-lg mt-1">+{pts} pts</p>}
      {walletBonus && (
        <p className="text-yellow-300 text-xs mt-0.5">💼 Holder bonus +{WALLET_BONUS} pts!</p>
      )}
    </motion.div>
  );
}

function Spinner({ color = "#FCFF52" }: { color?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="w-8 h-8 rounded-full border-4 border-t-transparent"
      style={{ borderColor: `${color}44`, borderTopColor: "transparent" }}
    />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CryptoHigherLowerPage() {
  const { t } = useLanguage();
  const { address, isConnected, chain } = useAccount();

  const contractAddress = getContractAddress("cryptohigherlower" as never, chain?.id);
  const explorerUrl     = contractAddress ? getExplorerAddressUrl(chain?.id, contractAddress) : null;
  const explorerName    = getExplorerName(chain?.id);

  // ── game state ─────────────────────────────────────────────────────────────
  const [gameStatus,  setGameStatus]  = useState<GameStatus>("idle");
  const [difficulty,  setDifficulty]  = useState<Difficulty>("medium");
  const [mode,        setMode]        = useState<"free" | "onchain">("free");

  const [round,    setRound]    = useState(0);
  const [score,    setScore]    = useState(0);
  const [streak,   setStreak]   = useState(0);
  const [history,  setHistory]  = useState<RoundResult[]>([]);

  const [tokenA, setTokenA] = useState<TokenMeta | null>(null);
  const [tokenB, setTokenB] = useState<TokenMeta | null>(null);
  const [priceA, setPriceA] = useState(0);
  const [priceB, setPriceB] = useState(0);
  const [mcapA,  setMcapA]  = useState(0);
  const [mcapB,  setMcapB]  = useState(0);

  const [flashResult, setFlashResult] = useState<{ correct: boolean; pts: number; walletBonus: boolean } | null>(null);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [isGuessing,  setIsGuessing]  = useState(false);

  // Track final score for endSession (state updates may not be flushed yet)
  const finalScoreRef    = useRef(0);
  const finalRoundsRef   = useRef(0);
  const finalOutcomeRef  = useRef<"WIN" | "LOSE">("LOSE");

  const poolRef    = useRef<TokenMeta[]>([]);
  const usedIdsRef = useRef<Set<string>>(new Set());

  // ── wagmi contracts ────────────────────────────────────────────────────────
  const { writeContractAsync } = useWriteContract();

  const [startTxHash, setStartTxHash] = useState<`0x${string}` | undefined>();
  const [endTxHash,   setEndTxHash]   = useState<`0x${string}` | undefined>();

  const { isSuccess: startConfirmed } = useWaitForTransactionReceipt({ hash: startTxHash });
  const { isSuccess: endConfirmed }   = useWaitForTransactionReceipt({ hash: endTxHash });

  // ── wallet balance for CELO holder bonus ──────────────────────────────────
  const tokenBIsCelo = tokenB?.id === "celo";
  const { data: celoBalance } = useBalance({
    address,
    query: { enabled: isConnected && tokenBIsCelo },
  });

  const holdsTokenB = useCallback((): boolean => {
    if (!isConnected) return false;
    if (tokenBIsCelo && celoBalance) return celoBalance.value > 0n;
    return false;
  }, [isConnected, tokenBIsCelo, celoBalance]);

  // ── startSession confirmed → start fetching first pair ────────────────────
  const pendingStartRef = useRef(false);
  if (startConfirmed && pendingStartRef.current) {
    pendingStartRef.current = false;
    // loadNextPair will be called by the effect below via a flag
  }

  // ── price fetch ────────────────────────────────────────────────────────────
  const fetchPrices = useCallback(
    async (ids: string[]): Promise<Record<string, { usd: number; usd_market_cap: number }>> => {
      const res = await fetch(`/api/crypto-prices?ids=${ids.join(",")}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    []
  );

  // ── pick pair ──────────────────────────────────────────────────────────────
  const pickPair = useCallback(
    (pool: TokenMeta[], usedIds: Set<string>): [TokenMeta, TokenMeta] | null => {
      const avail = pool.filter((t) => !usedIds.has(t.id));
      if (avail.length < 2) return null;
      const s = [...avail].sort(() => Math.random() - 0.5);
      return [s[0], s[1]];
    },
    []
  );

  // ── load next pair ────────────────────────────────────────────────────────
  const loadNextPair = useCallback(
    async (
      nextRound: number,
      curA: TokenMeta | null,
      curPriceA: number,
      curMcapA: number,
    ) => {
      setGameStatus("loading");
      setFetchError(null);

      const pool    = poolRef.current;
      const usedIds = usedIdsRef.current;

      let a = curA;
      let pa = curPriceA;
      let ma = curMcapA;
      let newB: TokenMeta | null = null;

      if (a === null) {
        const pair = pickPair(pool, usedIds);
        if (!pair) { setFetchError("Not enough tokens in pool."); setGameStatus("idle"); return; }
        [a, newB] = pair;
        usedIds.add(a.id);
        usedIds.add(newB.id);
      } else {
        const avail = pool.filter((t) => !usedIds.has(t.id));
        if (avail.length === 0) { setGameStatus("gameover"); return; }
        newB = avail[Math.floor(Math.random() * avail.length)];
        usedIds.add(newB.id);
      }

      const idsToFetch = a === curA ? [newB!.id] : [a!.id, newB!.id];
      let prices: Record<string, { usd: number; usd_market_cap: number }> = {};

      try {
        prices = await fetchPrices(idsToFetch);
      } catch {
        await new Promise((r) => setTimeout(r, 3000));
        try { prices = await fetchPrices(idsToFetch); }
        catch { setFetchError("Unable to fetch prices. Please try again."); setGameStatus("playing"); return; }
      }

      if (a !== curA) { pa = prices[a!.id]?.usd ?? 0; ma = prices[a!.id]?.usd_market_cap ?? 0; }
      const pb = prices[newB!.id]?.usd ?? 0;
      const mb = prices[newB!.id]?.usd_market_cap ?? 0;

      setTokenA(a!);
      setTokenB(newB!);
      setPriceA(pa);
      setPriceB(pb);
      setMcapA(ma);
      setMcapB(mb);
      setRound(nextRound);
      setGameStatus("playing");
    },
    [fetchPrices, pickPair]
  );

  // ── start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(async () => {
    const pool = getPoolForDifficulty(difficulty);
    const celoTokens = TOKENS.filter((t) => t.celoEco);
    const merged = [...pool];
    celoTokens.forEach((ct) => { if (!merged.find((t) => t.id === ct.id)) merged.push(ct); });

    poolRef.current    = merged;
    usedIdsRef.current = new Set();

    setScore(0);
    setStreak(0);
    setHistory([]);
    setFlashResult(null);
    setFetchError(null);
    setTokenA(null);
    setTokenB(null);
    setStartTxHash(undefined);
    setEndTxHash(undefined);
    finalScoreRef.current  = 0;
    finalRoundsRef.current = 0;

    if (mode === "onchain" && contractAddress) {
      try {
        setGameStatus("waiting_start");
        const difficultyIdx = difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : 2;
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: CHL_ABI,
          functionName: "startSession",
          args: [difficultyIdx],
        });
        setStartTxHash(hash);
        // loadNextPair will be triggered once startConfirmed
      } catch {
        setGameStatus("idle");
      }
    } else {
      await loadNextPair(1, null, 0, 0);
    }
  }, [difficulty, mode, contractAddress, writeContractAsync, loadNextPair]);

  // ── watch startConfirmed ──────────────────────────────────────────────────
  const startConfirmedHandledRef = useRef(false);
  if (startConfirmed && startTxHash && !startConfirmedHandledRef.current) {
    startConfirmedHandledRef.current = true;
    // async kick-off without blocking render
    loadNextPair(1, null, 0, 0);
  }

  // ── multiplier ────────────────────────────────────────────────────────────
  const getMultiplier = (s: number): number => s >= 6 ? 3 : s >= 3 ? 2 : 1;
  const currentMult   = getMultiplier(streak);
  const streakGlow    = streak >= 3;

  // ── handle guess ─────────────────────────────────────────────────────────
  const handleGuess = useCallback(
    async (guess: "higher" | "lower") => {
      if (!tokenA || !tokenB || gameStatus !== "playing" || isGuessing) return;
      setIsGuessing(true);

      const isCorrect  = guess === "higher" ? priceB >= priceA : priceB <= priceA;
      const newStreak  = isCorrect ? streak + 1 : 0;
      const mult       = getMultiplier(streak);
      const hardBonus  = difficulty === "hard" ? HARD_MULTIPLIER : 1;
      const wb         = isCorrect && holdsTokenB();
      const pts        = isCorrect
        ? Math.round(BASE_POINTS * mult * hardBonus) + (wb ? WALLET_BONUS : 0)
        : 0;

      const result: RoundResult = {
        round, tokenA, tokenB, priceA, priceB, guess,
        correct: isCorrect, pts, walletBonus: wb,
      };

      setHistory((h) => {
        const updated = [...h, result];
        finalRoundsRef.current = updated.filter((r) => r.correct).length;
        return updated;
      });
      setFlashResult({ correct: isCorrect, pts, walletBonus: wb });
      setStreak(newStreak);

      const newScore = isCorrect ? score + pts : score;
      if (isCorrect) setScore(newScore);
      finalScoreRef.current = newScore;

      await new Promise((r) => setTimeout(r, RESULT_FLASH_MS));
      setFlashResult(null);
      setIsGuessing(false);

      const gameOver = !isCorrect || round >= MAX_ROUNDS;
      finalOutcomeRef.current = (isCorrect && round >= MAX_ROUNDS) ? "WIN" : "LOSE";

      if (gameOver) {
        if (mode === "onchain" && contractAddress) {
          try {
            setGameStatus("waiting_end");
            const outcomeIdx = finalOutcomeRef.current === "WIN" ? 0 : 1;
            const hash = await writeContractAsync({
              address: contractAddress,
              abi: CHL_ABI,
              functionName: "endSession",
              args: [outcomeIdx, BigInt(finalRoundsRef.current), BigInt(finalScoreRef.current)],
            });
            setEndTxHash(hash);
          } catch {
            setGameStatus("gameover");
          }
        } else {
          setGameStatus("gameover");
        }
      } else {
        await loadNextPair(round + 1, tokenB!, priceB, mcapB);
      }
    },
    [
      tokenA, tokenB, gameStatus, isGuessing,
      priceA, priceB, mcapB, streak, difficulty, round, score,
      holdsTokenB, loadNextPair, mode, contractAddress, writeContractAsync,
    ]
  );

  // ── endSession confirmed ───────────────────────────────────────────────────
  const endConfirmedHandledRef = useRef(false);
  if (endConfirmed && endTxHash && !endConfirmedHandledRef.current) {
    endConfirmedHandledRef.current = true;
    setGameStatus("gameover");
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const roundsWon       = history.filter((h) => h.correct).length;
  const walletBonusTotal = history.filter((h) => h.walletBonus).length * WALLET_BONUS;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-md mx-auto">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold mb-5 transition-all"
        >
          ← {t("games.backToPortal") || "Back to Portal"}
        </Link>

        {/* Header */}
        <div className="text-center mb-5">
          <img src="/icons/cryptohigherlower.png" alt="" className="w-14 h-14 mx-auto object-contain mb-2 rounded-xl" />
          <h1 className="text-2xl font-black tracking-tight mb-0.5" style={{ color: "#FCFF52" }}>
            CRYPTO HIGHER / LOWER
          </h1>
          <p className="text-gray-400 text-sm">
            Guess which crypto has a higher price — build your streak!
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>
        {mode === "onchain" && (
          <div className="mb-5">
            <WalletConnect />
          </div>
        )}

        {/* ── IDLE ── */}
        {gameStatus === "idle" && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-5">
            <h2 className="text-white font-bold text-center mb-4">Choose Difficulty</h2>
            <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            <button
              onClick={startGame}
              className="mt-5 w-full py-4 rounded-xl font-black text-gray-900 text-lg shadow-lg transition-all hover:brightness-110"
              style={{ backgroundColor: "#FCFF52" }}
            >
              Start Game
            </button>

            <div className="mt-5 space-y-2">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">How to play</p>
              {[
                "You see Token A with its live price and Token B hidden.",
                "Guess if Token B's price is Higher or Lower than Token A.",
                "Correct? Token B becomes the new Token A — chain continues!",
                "Streak ×2 from round 3, ×3 from round 6.",
                "One wrong answer ends the game. Max 10 rounds.",
              ].map((rule, i) => (
                <p key={i} className="text-gray-400 text-xs flex gap-2">
                  <span className="font-bold flex-shrink-0" style={{ color: "#FCFF52" }}>{i + 1}.</span>
                  {rule}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ── WAITING START TX ── */}
        {gameStatus === "waiting_start" && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-10 mb-5 flex flex-col items-center gap-4">
            <Spinner color="#FCFF52" />
            <p className="text-gray-300 text-sm font-semibold text-center">
              Sign the transaction to start your on-chain session…
            </p>
          </div>
        )}

        {/* ── LOADING PRICES ── */}
        {gameStatus === "loading" && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-10 mb-5 flex flex-col items-center gap-4">
            <Spinner color="#FCFF52" />
            <p className="text-gray-300 text-sm font-semibold">
              {fetchError ? "Retrying…" : "Fetching live prices…"}
            </p>
          </div>
        )}

        {/* ── PLAYING ── */}
        {gameStatus === "playing" && tokenA && tokenB && (
          <>
            {/* HUD */}
            <div className="flex items-center justify-between mb-3">
              <div
                className={`px-3 py-1.5 rounded-full border text-xs font-black transition-all ${
                  streakGlow
                    ? "border-green-400 text-green-300 bg-green-900/30 shadow-[0_0_12px_#22c55e55]"
                    : "border-gray-600 text-gray-400 bg-white/5"
                }`}
              >
                🔥 {streak}
                {currentMult > 1 && <span className="ml-1" style={{ color: "#FCFF52" }}>×{currentMult}</span>}
              </div>
              <div className="text-gray-400 text-xs font-semibold">
                Round <span className="text-white font-black">{round}</span> / {MAX_ROUNDS}
              </div>
              <div
                className="px-3 py-1.5 rounded-full border border-yellow-500/30 text-xs font-black"
                style={{ color: "#FCFF52" }}
              >
                {score} pts
              </div>
            </div>

            {/* Cards area */}
            <div className="relative rounded-2xl bg-white/5 border border-white/10 p-4 mb-4">
              <AnimatePresence>
                {flashResult && (
                  <ResultFlash
                    correct={flashResult.correct}
                    pts={flashResult.pts}
                    tokenB={tokenB}
                    revealedPrice={priceB}
                    walletBonus={flashResult.walletBonus}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`a-${tokenA.id}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <TokenCardRevealed token={tokenA} price={priceA} marketCap={mcapA} />
                </motion.div>
              </AnimatePresence>

              <VSDivider />

              <AnimatePresence mode="wait">
                <motion.div
                  key={`b-${tokenB.id}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <TokenCardMystery token={tokenB} marketCap={mcapB} difficulty={difficulty} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Guess buttons */}
            {!flashResult && (
              <div className="flex gap-3 mb-4">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleGuess("higher")}
                  disabled={isGuessing}
                  className="flex-1 py-4 rounded-xl text-white font-black text-xl shadow-lg transition-all disabled:opacity-40"
                  style={{ backgroundColor: "#1D9E75" }}
                >
                  ▲ Higher
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleGuess("lower")}
                  disabled={isGuessing}
                  className="flex-1 py-4 rounded-xl text-white font-black text-xl shadow-lg transition-all disabled:opacity-40"
                  style={{ backgroundColor: "#D85A30" }}
                >
                  ▼ Lower
                </motion.button>
              </div>
            )}

            {fetchError && (
              <p className="text-red-400 text-xs text-center mb-3">{fetchError}</p>
            )}
          </>
        )}

        {/* ── WAITING END TX ── */}
        {gameStatus === "waiting_end" && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-10 mb-5 flex flex-col items-center gap-4">
            <Spinner color="#8B5CF6" />
            <p className="text-gray-300 text-sm font-semibold text-center">
              Recording result on-chain…
            </p>
          </div>
        )}

        {/* ── GAME OVER ── */}
        {gameStatus === "gameover" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-5"
          >
            {/* Score */}
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">
                {roundsWon === MAX_ROUNDS ? "🏆" : roundsWon >= 7 ? "🎉" : roundsWon >= 4 ? "👍" : "💀"}
              </div>
              <p className="text-white font-black text-3xl" style={{ textShadow: "0 0 20px #FCFF5255" }}>
                {score} pts
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {roundsWon === MAX_ROUNDS ? "Perfect game! 🔥" : `${roundsWon} / ${MAX_ROUNDS} correct`}
              </p>
            </div>

            {/* Breakdown */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-5 space-y-2 text-sm">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Score Breakdown</p>
              <div className="flex justify-between">
                <span className="text-gray-300">Correct answers ({roundsWon})</span>
                <span className="text-white font-bold">{roundsWon} × {BASE_POINTS}</span>
              </div>
              {difficulty === "hard" && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Hard mode</span>
                  <span className="font-bold" style={{ color: "#E84142" }}>×1.5 applied</span>
                </div>
              )}
              {walletBonusTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">💼 Wallet holder bonus</span>
                  <span className="text-yellow-300 font-bold">+{walletBonusTotal}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white font-bold">Total</span>
                <span className="font-black" style={{ color: "#FCFF52" }}>{score} pts</span>
              </div>
            </div>

            {/* Round history dots */}
            {history.length > 0 && (
              <div className="mb-5">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Round History</p>
                <div className="flex gap-1.5 flex-wrap">
                  {history.map((h) => (
                    <div
                      key={h.round}
                      title={`R${h.round}: ${h.tokenA.symbol} vs ${h.tokenB.symbol}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                        ${h.correct ? "bg-green-700 text-white" : "bg-red-800 text-white"}`}
                    >
                      {h.round}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* On-chain confirmation */}
            {mode === "onchain" && endTxHash && (
              <div className="mb-4 p-3 rounded-xl bg-green-900/20 border border-green-500/30 text-center">
                <p className="text-green-400 text-xs font-semibold">✅ Result recorded on-chain</p>
                {explorerUrl && (
                  <a
                    href={`${explorerUrl}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-green-400 text-xs underline hover:text-green-300"
                  >
                    View on {explorerName} →
                  </a>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <FarcasterShare
                gameName="Crypto Higher / Lower"
                outcome={`${score} pts (${roundsWon}/${MAX_ROUNDS} correct)`}
                stats={{ played: 1, wins: roundsWon === MAX_ROUNDS ? 1 : 0 }}
              />
              <button
                onClick={() => { startConfirmedHandledRef.current = false; endConfirmedHandledRef.current = false; startGame(); }}
                className="w-full py-3 rounded-xl font-black text-gray-900 text-base transition-all hover:brightness-110"
                style={{ backgroundColor: "#FCFF52" }}
              >
                Play Again
              </button>
              <Link
                href="/"
                className="block text-center text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                ← Back to portal
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats bar (persistent while playing) */}
        {gameStatus === "playing" && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-gray-400 text-xs uppercase mb-1">Score</p>
                <p className="text-white font-black text-lg">{score}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase mb-1">Streak</p>
                <p className="text-green-400 font-black text-lg">{streak}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase mb-1">Mult</p>
                <p className="font-black text-lg" style={{ color: "#FCFF52" }}>×{currentMult}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 mb-6">
          <p>Prices via CoinGecko · refreshed every 60s</p>
          {mode === "onchain" && explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank" rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-400 underline"
            >
              View contract on {explorerName} →
            </a>
          ) : (
            <span>On-chain mode available · sign in with wallet</span>
          )}
        </div>

      </div>
    </main>
  );
}
