"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { parseEventLogs } from "viem";
import { celo } from "wagmi/chains";
import { Card, createShuffledDeck, convertToCard, determineWinner, Outcome } from "@/lib/games/blackjack-cards";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contracts/blackjack-abi";

export type GamePhase = 'betting' | 'playing' | 'dealer' | 'finished';

export interface GameStats {
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  currentStreak: number;
  bestStreak: number;
}

export function useBlackjack() {
  const { address, isConnected, chain } = useAccount();
  const [mode, setMode] = useState<'free' | 'onchain'>('free');
  const [gamePhase, setGamePhase] = useState<GamePhase>('betting');

  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);

  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<GameStats>({
    wins: 0, losses: 0, pushes: 0, blackjacks: 0,
    currentStreak: 0, bestStreak: 0
  });

  const [credits, setCredits] = useState(1000);
  const [showDealerCard, setShowDealerCard] = useState(false);

  // Wagmi hooks
  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { data: receipt, error: receiptError, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    timeout: 120_000, // 2 minute timeout for better reliability on Celo
    confirmations: 1, // Wait for 1 confirmation
  });
  const { switchChain } = useSwitchChain();

  const { data: onchainStats, refetch: refetchStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getStats',
    query: {
      enabled: isConnected && mode === 'onchain',
      gcTime: 0,
      staleTime: 0,
    }
  });

  // CRITICAL: Ace calculation algorithm
  const calculateHandTotal = useCallback((cards: Card[]): number => {
    let total = 0;
    let aces = 0;

    // First pass: sum all cards, aces as 11
    for (const card of cards) {
      if (card.value === 1) {
        aces++;
        total += 11;
      } else if (card.value > 10) {
        total += 10; // Face cards
      } else {
        total += card.value;
      }
    }

    // Second pass: convert aces from 11 to 1 while busting
    while (total > 21 && aces > 0) {
      total -= 10; // Convert one ace from 11 to 1
      aces--;
    }

    return total;
  }, []);

  // Update stats helper
  const updateStatsForOutcome = useCallback((result: Outcome) => {
    setStats(prev => {
      const isWin = result === 'win' || result === 'blackjack';
      const newStreak = isWin ? prev.currentStreak + 1 : 0;

      return {
        wins: result === 'win' ? prev.wins + 1 : result === 'blackjack' ? prev.wins + 1 : prev.wins,
        losses: result === 'lose' ? prev.losses + 1 : prev.losses,
        pushes: result === 'push' ? prev.pushes + 1 : prev.pushes,
        blackjacks: result === 'blackjack' ? prev.blackjacks + 1 : prev.blackjacks,
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
      };
    });
  }, []);

  // Log transaction hash and update message
  useEffect(() => {
    if (hash && mode === 'onchain') {
      console.log('✅ Transaction sent:', hash);
      console.log('🔍 View on Celoscan:', `https://celoscan.io/tx/${hash}`);

      // Show confirming status
      if (isConfirming) {
        setMessage('⏳ Confirming on blockchain... (this may take 10-30 seconds)');
      } else {
        setMessage('✅ Transaction sent! Waiting for blockchain confirmation...');
      }
    }
  }, [hash, mode, isConfirming]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      const errorMessage = writeError.message || 'Transaction failed';

      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        setMessage('❌ Transaction rejected by user');
      } else if (errorMessage.includes('insufficient funds')) {
        setMessage('❌ Insufficient funds for gas');
      } else {
        setMessage('❌ Transaction failed: ' + errorMessage.substring(0, 50));
      }

      setGamePhase('betting');
    }
  }, [writeError]);

  // Handle receipt errors (timeout, etc.)
  useEffect(() => {
    if (receiptError && mode === 'onchain') {
      console.error('Receipt error:', receiptError);
      const errorMsg = receiptError.message || '';

      if (errorMsg.includes('timeout')) {
        setMessage('⚠️ Transaction taking longer than expected. Check Celoscan for status.');
      } else {
        setMessage('❌ Transaction error - Please try again');
      }

      setGamePhase('betting');
      // Reset write state for clean retry
      resetWrite?.();
    }
  }, [receiptError, mode, resetWrite]);

  // Parse transaction receipt for instant results (on-chain mode)
  useEffect(() => {
    if (receipt && mode === 'onchain' && address) {
      const events = parseEventLogs({
        abi: CONTRACT_ABI,
        eventName: ['GamePlayed'],
        logs: receipt.logs,
      });

      const userEvent = events.find(e =>
        e.args.player?.toLowerCase() === address.toLowerCase()
      );

      if (userEvent) {
        const { playerCards, dealerCards, playerTotal, dealerTotal, outcome } = userEvent.args;

        setPlayerHand((playerCards as number[]).map(convertToCard));
        setDealerHand((dealerCards as number[]).map(convertToCard));
        setPlayerTotal(Number(playerTotal));
        setDealerTotal(Number(dealerTotal));
        setOutcome(outcome as Outcome);
        setGamePhase('finished');
        setShowDealerCard(true);

        const messages = {
          win: '✅ You WIN!',
          lose: 'Dealer wins',
          push: "It's a PUSH",
          blackjack: '🎉 BLACKJACK!'
        };
        setMessage(messages[outcome as Outcome]);

        updateStatsForOutcome(outcome as Outcome);
        setTimeout(() => refetchStats(), 2000);
      } else {
        // No game event found in receipt
        console.warn('No GamePlayed event found in receipt');
        setMessage('⚠️ Transaction successful but no game data received');
        setGamePhase('betting');
      }
    }
  }, [receipt, address, mode, updateStatsForOutcome, refetchStats]);

  // Update stats from on-chain
  useEffect(() => {
    if (mode === 'onchain' && onchainStats) {
      const [wins, losses, pushes, blackjacks, , , currentStreak, bestStreak] = onchainStats;
      setStats({
        wins: Number(wins),
        losses: Number(losses),
        pushes: Number(pushes),
        blackjacks: Number(blackjacks),
        currentStreak: Number(currentStreak),
        bestStreak: Number(bestStreak),
      });
    }
  }, [onchainStats, mode]);

  // Deal initial cards (free mode)
  const dealInitialCards = useCallback(() => {
    const deck = createShuffledDeck();
    const pHand = [deck[0], deck[1]];
    const dHand = [deck[2], deck[3]];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setPlayerTotal(calculateHandTotal(pHand));
    setDealerTotal(calculateHandTotal(dHand));
    setGamePhase('playing');
    setShowDealerCard(false);
    setOutcome(null);
    setMessage('');

    // Check for immediate blackjack
    const pTotal = calculateHandTotal(pHand);
    if (pTotal === 21) {
      // Player has blackjack, reveal dealer and determine winner
      setShowDealerCard(true);
      const dTotal = calculateHandTotal(dHand);
      const result = dTotal === 21 ? 'push' : 'blackjack';
      setOutcome(result);
      setGamePhase('finished');

      const messages = {
        push: "Both Blackjack - PUSH!",
        blackjack: 'BLACKJACK! You win!'
      };
      setMessage(messages[result]);

      updateStatsForOutcome(result);

      if (result === 'blackjack') {
        setCredits(prev => prev + 15);
      }
    }
  }, [calculateHandTotal, updateStatsForOutcome]);

  // Hit (free mode)
  const hit = useCallback(() => {
    if (gamePhase !== 'playing' || mode === 'onchain') return;

    const deck = createShuffledDeck();
    const newCard = deck[playerHand.length + dealerHand.length];
    const newHand = [...playerHand, newCard];
    const newTotal = calculateHandTotal(newHand);

    setPlayerHand(newHand);
    setPlayerTotal(newTotal);

    // Bust check
    if (newTotal > 21) {
      setGamePhase('finished');
      setShowDealerCard(true);
      setOutcome('lose');
      setMessage('BUST! You lose.');
      updateStatsForOutcome('lose');
      setCredits(prev => Math.max(0, prev - 10));
    }
  }, [gamePhase, mode, playerHand, dealerHand, calculateHandTotal, updateStatsForOutcome]);

  // Stand (free mode)
  const stand = useCallback(() => {
    if (gamePhase !== 'playing' || mode === 'onchain') return;

    setGamePhase('dealer');
    setShowDealerCard(true);

    // Dealer plays
    let dHand = [...dealerHand];
    let dTotal = calculateHandTotal(dHand);
    const deck = createShuffledDeck();
    let cardIndex = playerHand.length + dealerHand.length;

    // Dealer hits until 17+
    while (dTotal < 17) {
      const newCard = deck[cardIndex++];
      dHand = [...dHand, newCard];
      dTotal = calculateHandTotal(dHand);
    }

    setDealerHand(dHand);
    setDealerTotal(dTotal);

    // Determine winner
    const result = determineWinner(playerTotal, dTotal, playerHand.length === 2);
    setOutcome(result);
    setGamePhase('finished');

    const messages = {
      win: 'You WIN!',
      lose: 'Dealer wins',
      push: "It's a PUSH",
      blackjack: 'BLACKJACK!'
    };
    setMessage(messages[result]);

    updateStatsForOutcome(result);

    // Update credits
    if (result === 'win') {
      setCredits(prev => prev + 10);
    } else if (result === 'blackjack') {
      setCredits(prev => prev + 15);
    } else if (result === 'lose') {
      setCredits(prev => Math.max(0, prev - 10));
    }
    // Push: no change to credits
  }, [gamePhase, mode, dealerHand, playerHand, playerTotal, calculateHandTotal, updateStatsForOutcome]);

  // Play on-chain with improved reliability
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
        setMessage('⚡ Switching to Celo...');
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

      // Show immediate feedback
      setMessage('🎲 Preparing your game...');
      setGamePhase('playing');

      console.log('📤 Sending playGame transaction...');

      // Send transaction with explicit gas settings for reliability
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'playGame',
        chainId: celo.id,
        gas: BigInt(500000), // Set explicit gas limit
      });

    } catch (error) {
      console.error('❌ Transaction error:', error);
      setMessage('❌ Transaction failed - Please try again');
      setGamePhase('betting');
    }
  }, [isConnected, address, chain, switchChain, writeContract, resetWrite]);

  // New game
  const newGame = useCallback(() => {
    if (mode === 'free') {
      if (credits < 10) {
        setMessage('❌ Not enough credits! (Need 10 credits)');
        return;
      }
      dealInitialCards();
    } else {
      // On-chain mode
      setGamePhase('betting');
      setPlayerHand([]);
      setDealerHand([]);
      setPlayerTotal(0);
      setDealerTotal(0);
      setOutcome(null);
      setMessage('Click "PLAY ON-CHAIN" to start');
      setShowDealerCard(false);
    }
  }, [mode, credits, dealInitialCards]);

  // Switch mode
  const switchMode = useCallback((newMode: 'free' | 'onchain') => {
    setMode(newMode);
    setGamePhase('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerTotal(0);
    setDealerTotal(0);
    setOutcome(null);
    setMessage(newMode === 'free' ? 'Click "NEW GAME" to start' : 'Click "PLAY ON-CHAIN" to start');
    setShowDealerCard(false);

    if (newMode === 'free') {
      setStats({ wins: 0, losses: 0, pushes: 0, blackjacks: 0, currentStreak: 0, bestStreak: 0 });
      setCredits(1000);
    }
  }, []);

  // Reset credits (free mode only)
  const resetCredits = useCallback(() => {
    if (mode === 'free') {
      setCredits(1000);
      setStats({ wins: 0, losses: 0, pushes: 0, blackjacks: 0, currentStreak: 0, bestStreak: 0 });
      setMessage('Credits reset to 1000');
    }
  }, [mode]);

  return {
    mode,
    gamePhase,
    playerHand,
    dealerHand,
    playerTotal,
    dealerTotal,
    outcome,
    message,
    stats,
    credits,
    isPending,
    showDealerCard,
    isConnected,
    address,
    hit,
    stand,
    newGame,
    playOnChain,
    switchMode,
    resetCredits,
  };
}
