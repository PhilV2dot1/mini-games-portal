"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, createShuffledDeck, determineWinner, Outcome } from "@/lib/games/blackjack-cards";
import { CONTRACT_ABI } from "@/lib/contracts/blackjack-abi";
import { getContractAddress, isGameAvailableOnChain, getExplorerTxUrl } from "@/lib/contracts/addresses";

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

  const contractAddress = getContractAddress('blackjack', chain?.id);
  const gameAvailable = isGameAvailableOnChain('blackjack', chain?.id);

  const { data: onchainStats, refetch: refetchStats } = useReadContract({
    address: contractAddress!,
    abi: CONTRACT_ABI,
    functionName: 'getStats',
    query: {
      enabled: isConnected && mode === 'onchain' && gameAvailable,
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
      console.log('🔍 View on explorer:', getExplorerTxUrl(chain?.id, hash));

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

      // Only reset to betting if the game hasn't been played yet (not in finished state)
      setGamePhase(prev => prev === 'finished' ? 'finished' : 'betting');
    }
  }, [writeError]);

  // Handle receipt errors (timeout, etc.)
  useEffect(() => {
    if (receiptError && mode === 'onchain') {
      console.error('Receipt error:', receiptError);
      const errorMsg = receiptError.message || '';

      if (errorMsg.includes('timeout')) {
        setMessage('⚠️ Transaction taking longer than expected. Check explorer for status.');
      } else {
        setMessage('❌ Transaction error - Please try again');
      }

      // Only reset to betting if game not yet finished
      setGamePhase(prev => prev === 'finished' ? 'finished' : 'betting');
      resetWrite?.();
    }
  }, [receiptError, mode, resetWrite]);

  // Handle transaction receipt (on-chain mode) — result already shown, just refresh stats
  useEffect(() => {
    if (receipt && mode === 'onchain' && address) {
      console.log('✅ On-chain game recorded:', receipt.transactionHash);
      // Restore the outcome message (was overwritten by "Recording result...")
      setMessage(prev => {
        if (prev.startsWith('⏳ Recording') || prev.startsWith('✅ Transaction') || prev.startsWith('⏳ Confirming')) {
          return '✅ Result recorded on blockchain!';
        }
        return prev;
      });
      setTimeout(() => refetchStats(), 2000);
    }
  }, [receipt, address, mode, refetchStats]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Deal initial cards (free and on-chain modes)
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

      if (mode === 'free' && result === 'blackjack') {
        setCredits(prev => prev + 15);
      }
    }
  }, [calculateHandTotal, updateStatsForOutcome, mode]);

  // Hit (free and on-chain modes)
  const hit = useCallback(() => {
    if (gamePhase !== 'playing') return;

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
      if (mode === 'free') {
        setCredits(prev => Math.max(0, prev - 10));
      }
    }
  }, [gamePhase, mode, playerHand, dealerHand, calculateHandTotal, updateStatsForOutcome]);

  // Stand (free and on-chain modes)
  const stand = useCallback(() => {
    if (gamePhase !== 'playing') return;

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

    if (mode === 'free') {
      // Update credits in free mode
      if (result === 'win') {
        setCredits(prev => prev + 10);
      } else if (result === 'blackjack') {
        setCredits(prev => prev + 15);
      } else if (result === 'lose') {
        setCredits(prev => Math.max(0, prev - 10));
      }
    } else if (mode === 'onchain' && contractAddress && gameAvailable) {
      // Record result on-chain after interactive gameplay
      setMessage('⏳ Recording result on blockchain...');
      resetWrite?.();
      writeContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'playGame',
        chainId: chain!.id,
        gas: BigInt(500000),
      });
    }
  }, [gamePhase, mode, dealerHand, playerHand, playerTotal, calculateHandTotal, updateStatsForOutcome, contractAddress, gameAvailable, chain, writeContract, resetWrite]);

  // Play on-chain — deals cards and starts interactive game
  const playOnChain = useCallback(async () => {
    if (!isConnected) {
      setMessage('❌ Please connect your wallet first');
      return;
    }

    if (!address) {
      setMessage('❌ Wallet address not found');
      return;
    }

    if (!contractAddress || !gameAvailable) {
      setMessage('❌ Blackjack not available on this network');
      return;
    }

    // Deal cards for interactive gameplay (same as free mode)
    dealInitialCards();
  }, [isConnected, address, contractAddress, gameAvailable, dealInitialCards]);

  // New game
  const newGame = useCallback(() => {
    if (mode === 'free') {
      if (credits < 10) {
        setMessage('❌ Not enough credits! (Need 10 credits)');
        return;
      }
    }
    dealInitialCards();
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
    setMessage(newMode === 'free' ? 'Click "NEW GAME" to start' : 'Click "DEAL CARDS" to start');
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
