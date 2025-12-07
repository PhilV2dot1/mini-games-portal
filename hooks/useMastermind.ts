"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain } from "wagmi";
import { celo } from "wagmi/chains";
import {
  Code,
  Guess,
  Feedback,
  GameHistory,
  generateSecretCode,
  evaluateGuess,
  isValidGuess,
  hasWon,
  calculateScore,
  Color,
} from "@/lib/games/mastermind-logic";
import { MASTERMIND_CONTRACT_ADDRESS, MASTERMIND_CONTRACT_ABI, MASTERMIND_GAME_FEE } from "@/lib/contracts/mastermind-abi";

type GamePhase = 'playing' | 'won' | 'lost';
export type GameMode = 'free' | 'onchain';

interface GameStats {
  wins: number;
  losses: number;
  totalGames: number;
  averageAttempts: number;
  bestScore: number;
}

const STORAGE_KEYS = {
  FREE_STATS: 'mastermind_free_stats',
};

export function useMastermind() {
  // Game state
  const [mode, setMode] = useState<GameMode>('free');
  const [gamePhase, setGamePhase] = useState<GamePhase>('playing');
  const [secretCode, setSecretCode] = useState<Code>(() => generateSecretCode());
  const [currentGuess, setCurrentGuess] = useState<Guess>([null, null, null, null]);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('');
  const [lastTransactionType, setLastTransactionType] = useState<'startGame' | 'submitScore' | null>(null);

  // Stats (for display)
  const [freeStats, setFreeStats] = useState<GameStats>({
    wins: 0,
    losses: 0,
    totalGames: 0,
    averageAttempts: 0,
    bestScore: 0,
  });

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const { switchChain } = useSwitchChain();

  // Read on-chain stats
  const { data: onchainStats, refetch: refetchStats } = useReadContract({
    address: MASTERMIND_CONTRACT_ADDRESS,
    abi: MASTERMIND_CONTRACT_ABI,
    functionName: 'getStats',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && mode === 'onchain' && MASTERMIND_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000",
      gcTime: 0, // Don't cache - always fetch fresh data
      staleTime: 0, // Consider data immediately stale
    },
  });

  // Check if user has an active on-chain game
  const { data: activeGameData, refetch: refetchActiveGame } = useReadContract({
    address: MASTERMIND_CONTRACT_ADDRESS,
    abi: MASTERMIND_CONTRACT_ABI,
    functionName: 'hasActiveGame',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && mode === 'onchain' && MASTERMIND_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000",
      gcTime: 0, // Don't cache - always fetch fresh data
      staleTime: 0, // Consider data immediately stale
    },
  });

  // Load stats from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedStats = localStorage.getItem(STORAGE_KEYS.FREE_STATS);
    if (savedStats) {
      try {
        setFreeStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Failed to parse saved stats:', e);
      }
    }
  }, []);

  // Check if user has an active on-chain game (compute early)
  const hasActiveOnChainGame = activeGameData ? activeGameData[0] : false;

  // Refetch active game state when wallet connects or address changes
  useEffect(() => {
    if (isConnected && address && mode === 'onchain') {
      // Immediate refetch
      refetchActiveGame();
      refetchStats();

      // Second refetch after 500ms
      const timer1 = setTimeout(() => {
        refetchActiveGame();
        refetchStats();
      }, 500);

      // Third refetch after 1.5s to ensure we have correct state
      const timer2 = setTimeout(() => {
        refetchActiveGame();
        refetchStats();
      }, 1500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isConnected, address, mode, refetchActiveGame, refetchStats]);

  // Handle transaction receipt
  useEffect(() => {
    if (receipt) {
      // Only process if we have a transaction type (avoid double processing)
      if (!lastTransactionType) {
        return;
      }

      // Capture transaction type before clearing it
      const txType = lastTransactionType;

      // Show success message
      setMessage('✅ Transaction completed successfully!');

      // Refetch active game state and stats with multiple attempts
      const refetchData = async () => {
        refetchActiveGame();
        refetchStats();

        // Second refetch after 1 second to ensure blockchain state is updated
        setTimeout(() => {
          refetchActiveGame();
          refetchStats();
        }, 1000);

        // Third refetch after 2 seconds
        setTimeout(() => {
          refetchActiveGame();
          refetchStats();
        }, 2000);

        // Only reset game after submitScore (abandon or real score)
        // Don't reset after startGame - user needs to play!
        if (txType === 'submitScore') {
          setTimeout(() => {
            newGame();
          }, 2500);
        }
      };

      refetchData();

      // Clear transaction type immediately to prevent double processing
      setLastTransactionType(null);

      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  }, [receipt, refetchStats, refetchActiveGame, lastTransactionType]);

  // Handle write contract errors
  useEffect(() => {
    if (writeError) {
      console.error('❌ Write contract error:', writeError);

      // Extract user-friendly error message
      const errorMessage = writeError.message || 'Unknown error';

      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        setMessage('❌ Transaction cancelled by user');
      } else if (errorMessage.includes('insufficient funds')) {
        setMessage('❌ Insufficient funds for transaction');
      } else if (errorMessage.includes('already has an active game')) {
        setMessage('❌ You already have an active game. Abandon it first.');
      } else if (errorMessage.includes('1002') || errorMessage.includes('Invalid score')) {
        // Error #1002 means no active game - frontend state is wrong!
        setMessage('🔄 Syncing game state...');

        // Force immediate refetch to correct the state
        refetchActiveGame();
        refetchStats();

        setTimeout(() => {
          refetchActiveGame();
          refetchStats();
          setMessage('');
        }, 1000);
      } else {
        setMessage(`❌ Transaction failed: ${errorMessage.slice(0, 50)}...`);
      }

      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage('');
      }, 5000);
    }
  }, [writeError, refetchActiveGame, refetchStats]);

  // Update stats when game ends (free mode only)
  const updateStatsOnGameEnd = useCallback((won: boolean, attemptsUsed: number) => {
    if (mode !== 'free' || typeof window === 'undefined') return;

    const score = calculateScore(won, attemptsUsed);
    const newStats = { ...freeStats };
    newStats.totalGames++;

    if (won) {
      newStats.wins++;
      // Calculate new average attempts
      const totalAttempts = (freeStats.averageAttempts * freeStats.wins) + attemptsUsed;
      newStats.averageAttempts = Math.round(totalAttempts / newStats.wins);
      if (score > newStats.bestScore) {
        newStats.bestScore = score;
      }
    } else {
      newStats.losses++;
    }

    setFreeStats(newStats);
    localStorage.setItem(STORAGE_KEYS.FREE_STATS, JSON.stringify(newStats));
  }, [mode, freeStats]);

  // Update current guess at specific position
  const updateGuess = useCallback((position: number, color: Color | null) => {
    const newGuess = [...currentGuess] as Guess;
    newGuess[position] = color;
    setCurrentGuess(newGuess);
  }, [currentGuess]);

  // Submit guess
  const submitGuess = useCallback(() => {
    if (!isValidGuess(currentGuess)) {
      setMessage('❌ Please select all 4 colors');
      return;
    }

    if (gamePhase !== 'playing') return;

    const feedback = evaluateGuess(secretCode, currentGuess);
    const newAttempts = attempts + 1;

    setHistory([...history, { guess: currentGuess as Code, feedback }]);
    setAttempts(newAttempts);
    setCurrentGuess([null, null, null, null]);

    // Check win
    if (hasWon(feedback)) {
      setGamePhase('won');
      const score = calculateScore(true, newAttempts);
      const msg = mode === 'onchain'
        ? `🎉 You cracked the code in ${newAttempts} attempts! Score: ${score}. Submit on-chain!`
        : `🎉 You cracked the code in ${newAttempts} attempts! Score: ${score}`;
      setMessage(msg);
      updateStatsOnGameEnd(true, newAttempts);
      return;
    }

    // Check lose
    if (newAttempts >= 10) {
      setGamePhase('lost');
      const msg = mode === 'onchain'
        ? '😢 Game Over! You can still submit your score.'
        : '😢 Game Over! The code was too tough.';
      setMessage(msg);
      updateStatsOnGameEnd(false, newAttempts);
    }
  }, [currentGuess, secretCode, attempts, history, gamePhase, mode, updateStatsOnGameEnd]);

  // New game
  const newGame = useCallback(() => {
    setSecretCode(generateSecretCode());
    setCurrentGuess([null, null, null, null]);
    setHistory([]);
    setAttempts(0);
    setGamePhase('playing');
    setMessage('');
  }, []);

  // Switch mode
  const switchMode = useCallback((newMode: GameMode) => {
    setMode(newMode);
    if (newMode === 'onchain') {
      setMessage('🎮 On-Chain Mode: Play and submit your score to the blockchain!');
      setTimeout(() => setMessage(''), 3000);
      // Refetch active game state when switching to onchain mode
      setTimeout(() => {
        refetchActiveGame();
        refetchStats();
      }, 100);
    }
    newGame();
  }, [newGame, refetchActiveGame, refetchStats]);

  // Start on-chain game
  const playOnChain = useCallback(async () => {
    if (!isConnected) {
      setMessage('❌ Please connect your wallet first');
      return;
    }

    if (!address) {
      setMessage('❌ Wallet address not found');
      return;
    }

    try {
      // Reset previous transaction state
      resetWrite?.();

      // Check if we're on the correct chain (Celo)
      if (chain?.id !== celo.id) {
        setMessage('⚡ Switching to Celo network...');
        try {
          await switchChain?.({ chainId: celo.id });
          // Give wallet time to switch
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (switchError) {
          console.error('Chain switch error:', switchError);
          setMessage('❌ Please switch to Celo network in your wallet');
          return;
        }
      }

      setMessage('🎲 Starting your on-chain game...');

      // Mark this as a startGame transaction
      setLastTransactionType('startGame');

      writeContract({
        address: MASTERMIND_CONTRACT_ADDRESS,
        abi: MASTERMIND_CONTRACT_ABI,
        functionName: 'startGame',
        chainId: celo.id,
        gas: BigInt(200000),
        value: BigInt(MASTERMIND_GAME_FEE), // 0.01 CELO in wei
      });

    } catch (error) {
      console.error('❌ Transaction error:', error);
      setMessage('❌ Transaction failed - Please try again');
    }
  }, [isConnected, address, chain, switchChain, writeContract, resetWrite]);

  // Submit score on-chain
  const submitScoreOnChain = useCallback(async () => {
    if (!isConnected) {
      setMessage('❌ Please connect your wallet first');
      return;
    }

    if (!address) {
      setMessage('❌ Wallet address not found');
      return;
    }

    if (mode !== 'onchain') {
      setMessage('❌ Switch to On-Chain mode first');
      return;
    }

    if (gamePhase === 'playing') {
      setMessage('❌ Finish the game first');
      return;
    }

    const won = gamePhase === 'won';
    const score = calculateScore(won, attempts);

    try {
      // Reset previous transaction state
      resetWrite?.();

      // Check if we're on the correct chain (Celo)
      if (chain?.id !== celo.id) {
        setMessage('⚡ Switching to Celo network...');
        try {
          await switchChain?.({ chainId: celo.id });
          // Give wallet time to switch
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (switchError) {
          console.error('❌ Chain switch error:', switchError);
          setMessage('❌ Please switch to Celo network in your wallet');
          return;
        }
      }

      setMessage('⏳ Submitting score on-chain...');

      // Mark this as a submitScore transaction
      setLastTransactionType('submitScore');

      writeContract({
        address: MASTERMIND_CONTRACT_ADDRESS,
        abi: MASTERMIND_CONTRACT_ABI,
        functionName: 'submitScore',
        args: [BigInt(score), won, BigInt(attempts)],
        chainId: celo.id,
        gas: BigInt(200000),
      });

    } catch (error) {
      console.error('❌ Failed to submit score:', error);
      setMessage('❌ Failed to submit score - Please try again');
    }
  }, [isConnected, address, mode, gamePhase, attempts, chain, switchChain, writeContract, resetWrite]);

  // Abandon current on-chain game
  const abandonGame = useCallback(async () => {
    if (!isConnected) {
      setMessage('❌ Please connect your wallet first');
      return;
    }

    if (!address) {
      setMessage('❌ Wallet address not found');
      return;
    }

    if (mode !== 'onchain') {
      setMessage('❌ Only for On-Chain mode');
      return;
    }

    try {
      // Reset previous transaction state
      resetWrite?.();

      // Check if we're on the correct chain (Celo)
      if (chain?.id !== celo.id) {
        setMessage('⚡ Switching to Celo network...');
        try {
          await switchChain?.({ chainId: celo.id });
          // Give wallet time to switch
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (switchError) {
          console.error('Chain switch error:', switchError);
          setMessage('❌ Please switch to Celo network in your wallet');
          return;
        }
      }

      setMessage('⏳ Abandoning game on-chain...');

      // Mark this as a submitScore transaction (abandon counts as submit)
      setLastTransactionType('submitScore');

      // Submit score of 0 to reset the game state
      writeContract({
        address: MASTERMIND_CONTRACT_ADDRESS,
        abi: MASTERMIND_CONTRACT_ABI,
        functionName: 'submitScore',
        args: [BigInt(0), false, BigInt(0)],
        chainId: celo.id,
        gas: BigInt(200000),
      });
    } catch (error) {
      console.error('❌ Failed to abandon game:', error);
      setMessage('❌ Failed to abandon game - Please try again');
    }
  }, [isConnected, address, mode, chain, switchChain, writeContract, resetWrite]);

  // Get current stats (free or on-chain)
  const stats: GameStats = mode === 'onchain' && onchainStats
    ? {
        wins: Number(onchainStats[0]),
        losses: Number(onchainStats[1]),
        totalGames: Number(onchainStats[2]),
        averageAttempts: Number(onchainStats[3]),
        bestScore: Number(onchainStats[4]),
      }
    : freeStats;

  return {
    // Game state
    mode,
    gamePhase,
    secretCode,
    currentGuess,
    history,
    attempts,
    message,
    stats,
    hasActiveOnChainGame,

    // Wallet state
    address,
    isConnected,
    isPending: isPending || isConfirming,

    // Actions
    updateGuess,
    submitGuess,
    newGame,
    playOnChain,
    submitScoreOnChain,
    switchMode,
    abandonGame,
    refetchActiveGame,
  };
}
