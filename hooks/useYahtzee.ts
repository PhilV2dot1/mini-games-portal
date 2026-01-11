"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import type { GameMode, GameResult } from "@/lib/types";
import {
  YAHTZEE_CONTRACT_ADDRESS,
  YAHTZEE_CONTRACT_ABI,
} from "@/lib/contracts/yahtzee-abi";

// Player types
export type Player = "human" | "ai";

// AI difficulty levels
export type AIDifficulty = "easy" | "medium" | "hard";

// Category names for the score card
export type CategoryName =
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes"
  | "threeOfKind"
  | "fourOfKind"
  | "fullHouse"
  | "smallStraight"
  | "largeStraight"
  | "yahtzee"
  | "chance";

export type ScoreCard = {
  [K in CategoryName]: number | null;
};

export type GameStatus = "idle" | "playing" | "processing" | "finished";

export interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
}

const EMPTY_SCORECARD: ScoreCard = {
  ones: null,
  twos: null,
  threes: null,
  fours: null,
  fives: null,
  sixes: null,
  threeOfKind: null,
  fourOfKind: null,
  fullHouse: null,
  smallStraight: null,
  largeStraight: null,
  yahtzee: null,
  chance: null,
};

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  totalScore: 0,
  highScore: 0,
};

// ============================================================================
// SCORING ALGORITHMS
// ============================================================================

/**
 * Count occurrences of a specific number in the dice
 */
function countDice(dice: number[], target: number): number {
  return dice.filter((d) => d === target).length;
}

/**
 * Get frequency map of dice values
 */
function getDiceFrequency(dice: number[]): Map<number, number> {
  const freq = new Map<number, number>();
  dice.forEach((d) => freq.set(d, (freq.get(d) || 0) + 1));
  return freq;
}

/**
 * Sum all dice
 */
function sumDice(dice: number[]): number {
  return dice.reduce((sum, d) => sum + d, 0);
}

// Upper Section Scoring
export function calculateOnes(dice: number[]): number {
  return countDice(dice, 1) * 1;
}

export function calculateTwos(dice: number[]): number {
  return countDice(dice, 2) * 2;
}

export function calculateThrees(dice: number[]): number {
  return countDice(dice, 3) * 3;
}

export function calculateFours(dice: number[]): number {
  return countDice(dice, 4) * 4;
}

export function calculateFives(dice: number[]): number {
  return countDice(dice, 5) * 5;
}

export function calculateSixes(dice: number[]): number {
  return countDice(dice, 6) * 6;
}

// Lower Section Validation
export function isThreeOfKind(dice: number[]): boolean {
  const freq = getDiceFrequency(dice);
  return Array.from(freq.values()).some((count) => count >= 3);
}

export function isFourOfKind(dice: number[]): boolean {
  const freq = getDiceFrequency(dice);
  return Array.from(freq.values()).some((count) => count >= 4);
}

export function isFullHouse(dice: number[]): boolean {
  const freq = getDiceFrequency(dice);
  const counts = Array.from(freq.values()).sort();
  return counts.length === 2 && counts[0] === 2 && counts[1] === 3;
}

export function isSmallStraight(dice: number[]): boolean {
  const unique = [...new Set(dice)].sort((a, b) => a - b);
  const straights = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
  ];
  return straights.some((straight) =>
    straight.every((num) => unique.includes(num))
  );
}

export function isLargeStraight(dice: number[]): boolean {
  const sorted = [...dice].sort((a, b) => a - b);
  const straight1 = [1, 2, 3, 4, 5];
  const straight2 = [2, 3, 4, 5, 6];
  return (
    sorted.every((d, i) => d === straight1[i]) ||
    sorted.every((d, i) => d === straight2[i])
  );
}

export function isYahtzee(dice: number[]): boolean {
  return new Set(dice).size === 1;
}

// Lower Section Scoring
export function calculateThreeOfKind(dice: number[]): number {
  return isThreeOfKind(dice) ? sumDice(dice) : 0;
}

export function calculateFourOfKind(dice: number[]): number {
  return isFourOfKind(dice) ? sumDice(dice) : 0;
}

export function calculateFullHouse(dice: number[]): number {
  return isFullHouse(dice) ? 25 : 0;
}

export function calculateSmallStraight(dice: number[]): number {
  return isSmallStraight(dice) ? 30 : 0;
}

export function calculateLargeStraight(dice: number[]): number {
  return isLargeStraight(dice) ? 40 : 0;
}

export function calculateYahtzee(dice: number[]): number {
  return isYahtzee(dice) ? 50 : 0;
}

export function calculateChance(dice: number[]): number {
  return sumDice(dice);
}

/**
 * Calculate score for a specific category
 */
export function calculateCategoryScore(
  category: CategoryName,
  dice: number[]
): number {
  switch (category) {
    case "ones":
      return calculateOnes(dice);
    case "twos":
      return calculateTwos(dice);
    case "threes":
      return calculateThrees(dice);
    case "fours":
      return calculateFours(dice);
    case "fives":
      return calculateFives(dice);
    case "sixes":
      return calculateSixes(dice);
    case "threeOfKind":
      return calculateThreeOfKind(dice);
    case "fourOfKind":
      return calculateFourOfKind(dice);
    case "fullHouse":
      return calculateFullHouse(dice);
    case "smallStraight":
      return calculateSmallStraight(dice);
    case "largeStraight":
      return calculateLargeStraight(dice);
    case "yahtzee":
      return calculateYahtzee(dice);
    case "chance":
      return calculateChance(dice);
  }
}

/**
 * Get upper section total
 */
export function getUpperSectionTotal(scoreCard: ScoreCard): number {
  const upperCategories: CategoryName[] = [
    "ones",
    "twos",
    "threes",
    "fours",
    "fives",
    "sixes",
  ];
  return upperCategories.reduce((total, category) => {
    const score = scoreCard[category];
    return total + (score !== null ? score : 0);
  }, 0);
}

/**
 * Check if upper section qualifies for bonus (≥63)
 */
export function hasUpperBonus(scoreCard: ScoreCard): boolean {
  return getUpperSectionTotal(scoreCard) >= 63;
}

/**
 * Calculate final score with bonuses
 */
export function getFinalScore(scoreCard: ScoreCard): number {
  let total = 0;

  // Sum all categories
  Object.values(scoreCard).forEach((score) => {
    if (score !== null) {
      total += score;
    }
  });

  // Add upper section bonus if qualified
  if (hasUpperBonus(scoreCard)) {
    total += 35;
  }

  return total;
}

/**
 * Check if all categories are filled
 */
export function isGameComplete(scoreCard: ScoreCard): boolean {
  return Object.values(scoreCard).every((score) => score !== null);
}

// ============================================================================
// AI HELPER FUNCTIONS
// ============================================================================

/**
 * Get available (unused) categories from a scorecard
 */
function getAvailableCategories(scoreCard: ScoreCard): CategoryName[] {
  return (Object.keys(scoreCard) as CategoryName[]).filter(
    (category) => scoreCard[category] === null
  );
}

/**
 * Get the most frequent dice value
 */
function getMostFrequentValue(freq: Map<number, number>): number {
  let maxCount = 0;
  let mostFrequent = 1;

  freq.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = value;
    }
  });

  return mostFrequent;
}

/**
 * AI hold strategy: decide which dice to hold based on roll number
 */
function getAIHoldStrategy(
  dice: number[],
  rollNumber: number,
  difficulty: AIDifficulty
): boolean[] {
  const freq = getDiceFrequency(dice);

  // Easy: Random holds
  if (difficulty === "easy") {
    return dice.map(() => Math.random() > 0.6);
  }

  // Medium/Hard: Strategic holds
  const mostCommon = getMostFrequentValue(freq);
  const maxCount = freq.get(mostCommon) || 0;

  // Roll 1: Keep pairs, 3-of-kinds, 4-of-kinds, yahtzees
  if (rollNumber === 1) {
    if (maxCount >= 3) {
      // Keep all matching the most common
      return dice.map((d) => d === mostCommon);
    }
    // Keep pairs
    if (maxCount === 2) {
      return dice.map((d) => d === mostCommon);
    }
    return [false, false, false, false, false];
  }

  // Roll 2: More aggressive keeping
  if (rollNumber === 2) {
    if (maxCount >= 2) {
      return dice.map((d) => d === mostCommon);
    }
    // Check for straight potential
    const unique = [...new Set(dice)].sort((a, b) => a - b);
    if (unique.length >= 4) {
      // Keep dice that contribute to straight
      return dice.map((d) => unique.includes(d));
    }
    return [false, false, false, false, false];
  }

  return [false, false, false, false, false];
}

/**
 * AI category selection: Easy difficulty (random)
 */
function getAICategoryEasy(
  dice: number[],
  scoreCard: ScoreCard
): CategoryName {
  const available = getAvailableCategories(scoreCard);
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * AI category selection: Medium difficulty (greedy)
 */
function getAICategoryMedium(
  dice: number[],
  scoreCard: ScoreCard
): CategoryName {
  const available = getAvailableCategories(scoreCard);
  let bestCategory = available[0];
  let bestScore = 0;

  for (const category of available) {
    const score = calculateCategoryScore(category, dice);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

/**
 * AI category selection: Hard difficulty (strategic)
 */
function getAICategoryHard(
  dice: number[],
  scoreCard: ScoreCard
): CategoryName {
  const available = getAvailableCategories(scoreCard);
  const upperTotal = getUpperSectionTotal(scoreCard);
  const needsUpperBonus = upperTotal < 63;

  // Prioritize upper section if close to bonus (50-62)
  if (needsUpperBonus && upperTotal >= 50) {
    const upperCategories = available.filter((cat) =>
      ["ones", "twos", "threes", "fours", "fives", "sixes"].includes(cat)
    );
    if (upperCategories.length > 0) {
      // Pick best upper category
      let bestCategory = upperCategories[0];
      let bestScore = 0;
      for (const category of upperCategories) {
        const score = calculateCategoryScore(category, dice);
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }
      return bestCategory;
    }
  }

  // Otherwise use greedy strategy
  return getAICategoryMedium(dice, scoreCard);
}

/**
 * Get AI category based on difficulty
 */
function getAICategory(
  dice: number[],
  scoreCard: ScoreCard,
  difficulty: AIDifficulty
): CategoryName {
  switch (difficulty) {
    case "easy":
      return getAICategoryEasy(dice, scoreCard);
    case "medium":
      return getAICategoryMedium(dice, scoreCard);
    case "hard":
      return getAICategoryHard(dice, scoreCard);
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useYahtzee() {
  // Game State
  const [dice, setDice] = useState<number[]>([1, 1, 1, 1, 1]);
  const [heldDice, setHeldDice] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [rollsRemaining, setRollsRemaining] = useState(3);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [scoreCard, setScoreCard] = useState<ScoreCard>(EMPTY_SCORECARD);
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [message, setMessage] = useState("Click Start Game to begin!");
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);

  // AI Mode State
  const [vsAI, setVsAI] = useState(false);
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>("medium");
  const [currentPlayer, setCurrentPlayer] = useState<Player>("human");
  const [playerScoreCard, setPlayerScoreCard] = useState<ScoreCard>(EMPTY_SCORECARD);
  const [aiScoreCard, setAIScoreCard] = useState<ScoreCard>(EMPTY_SCORECARD);
  const [winner, setWinner] = useState<Player | "tie" | null>(null);

  // Stats (will be loaded from localStorage or blockchain)
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);

  // Ref to avoid circular dependency between selectCategory and playAITurn
  const playAITurnRef = useRef<(() => Promise<void>) | null>(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: onChainStats, refetch: refetchStats } = useReadContract({
    address: YAHTZEE_CONTRACT_ADDRESS,
    abi: YAHTZEE_CONTRACT_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
  });

  // Load stats from localStorage (free mode) or blockchain (on-chain mode)
  useEffect(() => {
    if (mode === "free") {
      const saved = localStorage.getItem("yahtzee_stats");
      if (saved) {
        try {
          setStats(JSON.parse(saved));
        } catch {
          setStats(DEFAULT_STATS);
        }
      }
    } else if (mode === "onchain" && onChainStats) {
      // Load stats from blockchain
      const [gamesPlayed, totalScore, highScore] = onChainStats;
      setStats({
        gamesPlayed: Number(gamesPlayed),
        totalScore: Number(totalScore),
        highScore: Number(highScore),
      });
    }
  }, [mode, onChainStats]);

  // Save stats to localStorage (free mode)
  const saveStats = useCallback(
    (newStats: PlayerStats) => {
      if (mode === "free") {
        localStorage.setItem("yahtzee_stats", JSON.stringify(newStats));
        setStats(newStats);
      }
    },
    [mode]
  );

  /**
   * Roll all non-held dice
   */
  const rollDice = useCallback(() => {
    if (status !== "playing") return;
    if (rollsRemaining <= 0) return;

    const newDice = dice.map((die, index) =>
      heldDice[index] ? die : Math.floor(Math.random() * 6) + 1
    );

    setDice(newDice);
    setRollsRemaining((prev) => prev - 1);

    if (rollsRemaining - 1 === 0) {
      setMessage("No rolls left! Select a category to score.");
    } else {
      setMessage(`${rollsRemaining - 1} rolls remaining. Click dice to hold.`);
    }
  }, [dice, heldDice, rollsRemaining, status]);

  /**
   * Toggle hold state for a die
   */
  const toggleHold = useCallback(
    (index: number) => {
      if (status !== "playing") return;
      if (rollsRemaining === 3) {
        // Can't hold dice before first roll
        setMessage("Roll the dice first!");
        return;
      }

      const newHeldDice = [...heldDice];
      newHeldDice[index] = !newHeldDice[index];
      setHeldDice(newHeldDice);
    },
    [heldDice, rollsRemaining, status]
  );

  /**
   * Select a category and lock in the score
   */
  const selectCategory = useCallback(
    async (category: CategoryName) => {
      if (status !== "playing") return;

      // In AI mode, use separate scorecards
      const currentScoreCard = vsAI
        ? currentPlayer === "human"
          ? playerScoreCard
          : aiScoreCard
        : scoreCard;

      if (currentScoreCard[category] !== null) {
        setMessage("Category already used! Choose another.");
        return;
      }

      const score = calculateCategoryScore(category, dice);

      // Update appropriate score card
      const newScoreCard = { ...currentScoreCard, [category]: score };

      if (vsAI) {
        if (currentPlayer === "human") {
          setPlayerScoreCard(newScoreCard);
        } else {
          setAIScoreCard(newScoreCard);
        }
      } else {
        setScoreCard(newScoreCard);
      }

      // Check if game is complete
      const playerComplete = vsAI ? isGameComplete(vsAI && currentPlayer === "human" ? newScoreCard : playerScoreCard) : false;
      const aiComplete = vsAI ? isGameComplete(vsAI && currentPlayer === "ai" ? newScoreCard : aiScoreCard) : false;
      const soloComplete = !vsAI && isGameComplete(newScoreCard);

      if ((vsAI && playerComplete && aiComplete) || soloComplete) {
        // Game finished
        const finalScore = vsAI
          ? getFinalScore(currentPlayer === "human" ? newScoreCard : playerScoreCard)
          : getFinalScore(newScoreCard);

        setStatus("finished");

        if (vsAI) {
          // Determine winner
          const playerFinalScore = getFinalScore(
            currentPlayer === "human" ? newScoreCard : playerScoreCard
          );
          const aiFinalScore = getFinalScore(
            currentPlayer === "ai" ? newScoreCard : aiScoreCard
          );

          if (playerFinalScore > aiFinalScore) {
            setWinner("human");
            setMessage(`You Win! ${playerFinalScore} - ${aiFinalScore}`);
          } else if (aiFinalScore > playerFinalScore) {
            setWinner("ai");
            setMessage(`AI Wins! ${aiFinalScore} - ${playerFinalScore}`);
          } else {
            setWinner("tie");
            setMessage(`It's a Tie! ${playerFinalScore} - ${aiFinalScore}`);
          }

          // Update stats (only count player's score)
          const newStats: PlayerStats = {
            gamesPlayed: stats.gamesPlayed + 1,
            totalScore: stats.totalScore + playerFinalScore,
            highScore: Math.max(stats.highScore, playerFinalScore),
          };

          if (mode === "free") {
            saveStats(newStats);
          }
        } else {
          // Solo mode
          setMessage(`Game Over! Final Score: ${finalScore}`);

          const newStats: PlayerStats = {
            gamesPlayed: stats.gamesPlayed + 1,
            totalScore: stats.totalScore + finalScore,
            highScore: Math.max(stats.highScore, finalScore),
          };

          if (mode === "free") {
            saveStats(newStats);
          } else if (mode === "onchain" && address && gameStartedOnChain) {
            // End game on-chain
            setStatus("processing");
            try {
              await writeContractAsync({
                address: YAHTZEE_CONTRACT_ADDRESS,
                abi: YAHTZEE_CONTRACT_ABI,
                functionName: "endGame",
                args: [BigInt(finalScore)],
              });
              setStatus("finished");
              refetchStats();
            } catch (error) {
              console.error("Failed to end game on-chain:", error);
              setMessage("Blockchain error! Game saved locally.");
              setStatus("finished");
            }
          }
        }

        return;
      }

      // Advance to next turn or switch players
      if (vsAI) {
        // Switch players
        if (currentPlayer === "human") {
          setCurrentPlayer("ai");
          setMessage("AI is thinking...");
          // Reset for AI turn
          setRollsRemaining(3);
          setHeldDice([false, false, false, false, false]);
          setDice([1, 1, 1, 1, 1]);
          // Trigger AI turn after a short delay
          setTimeout(() => {
            if (playAITurnRef.current) {
              playAITurnRef.current();
            }
          }, 800);
        } else {
          setCurrentPlayer("human");
          setCurrentTurn((prev) => prev + 1);
          setRollsRemaining(3);
          setHeldDice([false, false, false, false, false]);
          setDice([1, 1, 1, 1, 1]);
          setMessage(`Turn ${currentTurn + 1}/13 - Roll the dice!`);
        }
      } else {
        // Solo mode
        setCurrentTurn((prev) => prev + 1);
        setRollsRemaining(3);
        setHeldDice([false, false, false, false, false]);
        setDice([1, 1, 1, 1, 1]);
        setMessage(`Turn ${currentTurn + 1}/13 - Roll the dice!`);
      }
    },
    [
      status,
      scoreCard,
      playerScoreCard,
      aiScoreCard,
      vsAI,
      currentPlayer,
      dice,
      stats,
      mode,
      address,
      gameStartedOnChain,
      currentTurn,
      saveStats,
      writeContractAsync,
      refetchStats,
    ]
  );

  /**
   * Execute AI's turn automatically
   */
  const playAITurn = useCallback(async () => {
    if (currentPlayer !== "ai" || status !== "playing") return;

    // Helper function for delays
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // Roll 1
      await delay(400);
      const roll1 = [1, 2, 3, 4, 5].map(() => Math.floor(Math.random() * 6) + 1);
      setDice(roll1);
      setRollsRemaining(2);
      setMessage("AI rolled the dice...");

      // Decide which dice to hold after roll 1
      await delay(300);
      const hold1 = getAIHoldStrategy(roll1, 1, aiDifficulty);
      setHeldDice(hold1);

      // Roll 2
      await delay(600);
      const roll2 = roll1.map((die, index) =>
        hold1[index] ? die : Math.floor(Math.random() * 6) + 1
      );
      setDice(roll2);
      setRollsRemaining(1);
      setMessage("AI rolled again...");

      // Decide which dice to hold after roll 2
      await delay(300);
      const hold2 = getAIHoldStrategy(roll2, 2, aiDifficulty);
      setHeldDice(hold2);

      // Roll 3
      await delay(600);
      const roll3 = roll2.map((die, index) =>
        hold2[index] ? die : Math.floor(Math.random() * 6) + 1
      );
      setDice(roll3);
      setRollsRemaining(0);
      setMessage("AI is choosing a category...");

      // Select category
      await delay(500);
      const category = getAICategory(roll3, aiScoreCard, aiDifficulty);
      await selectCategory(category);
    } catch (error) {
      console.error("AI turn error:", error);
      setMessage("AI turn failed, switching to player...");
      setCurrentPlayer("human");
    }
  }, [currentPlayer, status, aiDifficulty, aiScoreCard, selectCategory]);

  // Update ref when playAITurn changes
  useEffect(() => {
    playAITurnRef.current = playAITurn;
  }, [playAITurn]);

  /**
   * Start a new game
   */
  const startGame = useCallback(async () => {
    if (status === "playing") return;

    // Reset game state
    setDice([1, 1, 1, 1, 1]);
    setHeldDice([false, false, false, false, false]);
    setRollsRemaining(3);
    setCurrentTurn(1);
    setScoreCard(EMPTY_SCORECARD);
    setGameStartTime(Date.now());
    setStatus("playing");

    // Reset AI state
    setPlayerScoreCard(EMPTY_SCORECARD);
    setAIScoreCard(EMPTY_SCORECARD);
    setCurrentPlayer("human");
    setWinner(null);

    setMessage("Turn 1/13 - Roll the dice!");

    // Start game on-chain if in on-chain mode (AI mode is always free mode)
    if (mode === "onchain" && address && isConnected && !vsAI) {
      setStatus("processing");
      try {
        await writeContractAsync({
          address: YAHTZEE_CONTRACT_ADDRESS,
          abi: YAHTZEE_CONTRACT_ABI,
          functionName: "startGame",
        });
        setGameStartedOnChain(true);
        setStatus("playing");
      } catch (error) {
        console.error("Failed to start game on-chain:", error);
        setMessage("Blockchain error! Switching to free mode.");
        setMode("free");
        setStatus("playing");
      }
    }
  }, [status, mode, address, isConnected, vsAI, writeContractAsync]);

  /**
   * Reset game to idle state
   */
  const resetGame = useCallback(() => {
    setDice([1, 1, 1, 1, 1]);
    setHeldDice([false, false, false, false, false]);
    setRollsRemaining(3);
    setCurrentTurn(1);
    setScoreCard(EMPTY_SCORECARD);
    setStatus("idle");
    setMessage("Click Start Game to begin!");
    setGameStartedOnChain(false);
    setGameStartTime(0);

    // Reset AI state
    setPlayerScoreCard(EMPTY_SCORECARD);
    setAIScoreCard(EMPTY_SCORECARD);
    setCurrentPlayer("human");
    setWinner(null);
  }, []);

  /**
   * Switch between free and on-chain modes
   */
  const switchMode = useCallback(
    (newMode: GameMode) => {
      if (status === "playing") {
        const confirm = window.confirm(
          "Switching modes will reset your current game. Continue?"
        );
        if (!confirm) return;
      }

      setMode(newMode);
      resetGame();

      if (newMode === "onchain" && !isConnected) {
        setMessage("Connect your wallet to play on-chain!");
      } else {
        setMessage("Click Start Game to begin!");
      }
    },
    [status, isConnected, resetGame]
  );

  /**
   * Get potential score for a category (for display)
   */
  const getPotentialScore = useCallback(
    (category: CategoryName): number => {
      if (scoreCard[category] !== null) {
        return scoreCard[category];
      }
      return calculateCategoryScore(category, dice);
    },
    [scoreCard, dice]
  );

  /**
   * Get average score
   */
  const getAverageScore = useCallback((): number => {
    if (stats.gamesPlayed === 0) return 0;
    return Math.round(stats.totalScore / stats.gamesPlayed);
  }, [stats]);

  return {
    // Game State
    dice,
    heldDice,
    rollsRemaining,
    currentTurn,
    scoreCard,
    mode,
    status,
    message,
    stats,
    gameStartTime,

    // AI Mode State
    vsAI,
    aiDifficulty,
    currentPlayer,
    playerScoreCard,
    aiScoreCard,
    winner,

    // Computed Values
    upperSectionTotal: getUpperSectionTotal(vsAI ? (currentPlayer === "human" ? playerScoreCard : aiScoreCard) : scoreCard),
    hasBonus: hasUpperBonus(vsAI ? (currentPlayer === "human" ? playerScoreCard : aiScoreCard) : scoreCard),
    finalScore: getFinalScore(vsAI ? (currentPlayer === "human" ? playerScoreCard : aiScoreCard) : scoreCard),
    averageScore: getAverageScore(),
    isComplete: isGameComplete(scoreCard),

    // AI Mode Computed Values
    playerUpperTotal: getUpperSectionTotal(playerScoreCard),
    playerHasBonus: hasUpperBonus(playerScoreCard),
    playerFinalScore: getFinalScore(playerScoreCard),
    aiUpperTotal: getUpperSectionTotal(aiScoreCard),
    aiHasBonus: hasUpperBonus(aiScoreCard),
    aiFinalScore: getFinalScore(aiScoreCard),

    // Wallet State
    isConnected,
    address,
    isProcessing: isPending,

    // Actions
    startGame,
    rollDice,
    toggleHold,
    selectCategory,
    resetGame,
    switchMode,
    getPotentialScore,
    setVsAI,
    setAIDifficulty,
  };
}
