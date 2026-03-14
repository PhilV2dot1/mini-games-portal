"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, createShuffledDeck, determineWinner, Outcome } from "@/lib/games/blackjack-cards";
import { CONTRACT_ABI } from "@/lib/contracts/blackjack-abi";
import { getContractAddress, isGameAvailableOnChain } from "@/lib/contracts/addresses";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  const { t } = useLanguage();
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
  // On-chain: true after the game finishes locally, while tx is being confirmed
  const [isRecording, setIsRecording] = useState(false);

  const isTxInProgress = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Wagmi hooks
  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { data: receipt, error: receiptError, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    timeout: 60_000,
    confirmations: 1,
  });

  const contractAddress = getContractAddress('blackjack', chain?.id);
  const gameAvailable = isGameAvailableOnChain('blackjack', chain?.id);

  const { data: onchainStats, refetch: refetchStats } = useReadContract({
    address: contractAddress!,
    abi: CONTRACT_ABI,
    functionName: 'getStats',
    query: {
      enabled: isConnected && !!address && mode === 'onchain' && gameAvailable,
      gcTime: 0,
      staleTime: 0,
    }
  });

  // ─── Ace calculation ────────────────────────────────────────────────────────
  const calculateHandTotal = useCallback((cards: Card[]): number => {
    let total = 0;
    let aces = 0;
    for (const card of cards) {
      if (card.value === 1) { aces++; total += 11; }
      else if (card.value > 10) { total += 10; }
      else { total += card.value; }
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  }, []);

  // ─── Stats helper (free + onchain local update) ───────────────────────────
  const updateStatsForOutcome = useCallback((result: Outcome) => {
    setStats(prev => {
      const isWin = result === 'win' || result === 'blackjack';
      const newStreak = isWin ? prev.currentStreak + 1 : 0;
      return {
        wins: isWin ? prev.wins + 1 : prev.wins,
        losses: result === 'lose' ? prev.losses + 1 : prev.losses,
        pushes: result === 'push' ? prev.pushes + 1 : prev.pushes,
        blackjacks: result === 'blackjack' ? prev.blackjacks + 1 : prev.blackjacks,
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
      };
    });
  }, []);

  // ─── Sync on-chain stats ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'onchain' && onchainStats) {
      const [wins, losses, pushes, blackjacks, , , currentStreak, bestStreak] = onchainStats;
      setStats({
        wins: Number(wins), losses: Number(losses),
        pushes: Number(pushes), blackjacks: Number(blackjacks),
        currentStreak: Number(currentStreak), bestStreak: Number(bestStreak),
      });
    }
  }, [onchainStats, mode]);

  // ─── On-chain receipt: confirm recording ─────────────────────────────────
  useEffect(() => {
    if (!receipt || mode !== 'onchain') return;
    setIsRecording(false);
    isTxInProgress.current = false;
    setMessage(prev =>
      prev.startsWith('⏳') ? '✅ ' + t('games.blackjack.recorded') : prev
    );
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => refetchStats(), 2000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [receipt, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Write errors ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!writeError) return;
    const msg = writeError.message || '';
    if (msg.includes('User rejected') || msg.includes('User denied')) {
      setMessage('❌ ' + t('games.blackjack.txRejected'));
    } else if (msg.includes('insufficient funds')) {
      setMessage('❌ ' + t('games.blackjack.insufficientFunds'));
    } else {
      setMessage('❌ ' + t('games.blackjack.txFailed'));
    }
    setIsRecording(false);
    isTxInProgress.current = false;
  }, [writeError]);

  // ─── Receipt timeout ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!receiptError || mode !== 'onchain') return;
    const msg = receiptError.message || '';
    setMessage(msg.includes('timeout')
      ? '⚠️ ' + t('games.blackjack.txTimeout')
      : '❌ ' + t('games.blackjack.txFailed'));
    setIsRecording(false);
    isTxInProgress.current = false;
    resetWrite?.();
  }, [receiptError, mode, resetWrite]);

  // ─── Internal: send playGame tx after local result ───────────────────────
  const recordOnChain = useCallback(() => {
    if (!contractAddress || !gameAvailable || isTxInProgress.current) return;
    isTxInProgress.current = true;
    setIsRecording(true);
    resetWrite?.();
    writeContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'playGame',
      chainId: chain!.id,
      gas: BigInt(500000),
    });
  }, [contractAddress, gameAvailable, chain, writeContract, resetWrite]);

  // ─── Deal cards (free + onchain: identical gameplay) ─────────────────────
  const dealInitialCards = useCallback(() => {
    const deck = createShuffledDeck();
    const pHand = [deck[0], deck[1]];
    const dHand = [deck[2], deck[3]];
    const pTotal = calculateHandTotal(pHand);
    const dTotal = calculateHandTotal(dHand);

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setPlayerTotal(pTotal);
    setDealerTotal(dTotal);
    setGamePhase('playing');
    setShowDealerCard(false);
    setOutcome(null);
    setMessage('');

    // Immediate blackjack
    if (pTotal === 21) {
      const result: Outcome = dTotal === 21 ? 'push' : 'blackjack';
      setShowDealerCard(true);
      setOutcome(result);
      setGamePhase('finished');
      setMessage(result === 'blackjack' ? '🎉 ' + t('games.blackjack.blackjackWin') : t('games.blackjack.bothBlackjack'));
      updateStatsForOutcome(result);
      if (mode === 'free') {
        if (result === 'blackjack') setCredits(prev => prev + 15);
      } else {
        // Record blackjack on-chain immediately
        setMessage('🎉 ' + t('games.blackjack.blackjackWin') + ' ⏳ ' + t('games.blackjack.recording'));
        recordOnChain();
      }
    }
  }, [calculateHandTotal, updateStatsForOutcome, mode, recordOnChain]);

  // ─── HIT (free + onchain identical) ──────────────────────────────────────
  const hit = useCallback(() => {
    if (gamePhase !== 'playing') return;

    const deck = createShuffledDeck();
    const newCard = deck[playerHand.length + dealerHand.length];
    const newHand = [...playerHand, newCard];
    const newTotal = calculateHandTotal(newHand);

    setPlayerHand(newHand);
    setPlayerTotal(newTotal);

    if (newTotal > 21) {
      setGamePhase('finished');
      setShowDealerCard(true);
      setOutcome('lose');
      updateStatsForOutcome('lose');
      if (mode === 'free') {
        setMessage(t('games.blackjack.bustLose'));
        setCredits(prev => Math.max(0, prev - 10));
      } else {
        setMessage(t('games.blackjack.bustLose') + ' ⏳ ' + t('games.blackjack.recording'));
        recordOnChain();
      }
    }
  }, [gamePhase, mode, playerHand, dealerHand, calculateHandTotal, updateStatsForOutcome, recordOnChain]);

  // ─── STAND (free + onchain identical) ────────────────────────────────────
  const stand = useCallback(() => {
    if (gamePhase !== 'playing') return;

    setShowDealerCard(true);

    let dHand = [...dealerHand];
    let dTotal = calculateHandTotal(dHand);
    const deck = createShuffledDeck();
    let idx = playerHand.length + dealerHand.length;
    while (dTotal < 17) {
      dHand = [...dHand, deck[idx++]];
      dTotal = calculateHandTotal(dHand);
    }

    setDealerHand(dHand);
    setDealerTotal(dTotal);

    const result = determineWinner(playerTotal, dTotal, playerHand.length === 2);
    setOutcome(result);
    setGamePhase('finished');
    updateStatsForOutcome(result);

    const msgs: Record<Outcome, string> = {
      win: '✅ ' + t('games.blackjack.youWin'),
      lose: t('games.blackjack.dealerWins'),
      push: t('games.blackjack.itsPush'),
      blackjack: '🎉 ' + t('games.blackjack.blackjackLabel'),
    };

    if (mode === 'free') {
      setMessage(msgs[result]);
      if (result === 'win') setCredits(prev => prev + 10);
      else if (result === 'blackjack') setCredits(prev => prev + 15);
      else if (result === 'lose') setCredits(prev => Math.max(0, prev - 10));
    } else {
      setMessage(msgs[result] + ' ⏳ ' + t('games.blackjack.recording'));
      recordOnChain();
    }
  }, [gamePhase, mode, dealerHand, playerHand, playerTotal, calculateHandTotal, updateStatsForOutcome, recordOnChain]);

  // ─── New game ─────────────────────────────────────────────────────────────
  const newGame = useCallback(() => {
    if (mode === 'free' && credits < 10) {
      setMessage('❌ ' + t('games.blackjack.notEnoughCredits'));
      return;
    }
    if (!isConnected && mode === 'onchain') {
      setMessage('❌ ' + t('games.blackjack.connectWallet'));
      return;
    }
    if (mode === 'onchain' && (!contractAddress || !gameAvailable)) {
      setMessage('❌ ' + t('games.blackjack.notAvailable'));
      return;
    }
    dealInitialCards();
  }, [mode, credits, isConnected, contractAddress, gameAvailable, dealInitialCards]);

  // playOnChain alias kept for the page button label logic
  const playOnChain = newGame;

  // ─── Switch mode ──────────────────────────────────────────────────────────
  const switchMode = useCallback((newMode: 'free' | 'onchain') => {
    setMode(newMode);
    setGamePhase('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerTotal(0);
    setDealerTotal(0);
    setOutcome(null);
    setMessage('');
    setShowDealerCard(false);
    setIsRecording(false);
    isTxInProgress.current = false;
    if (newMode === 'free') {
      setStats({ wins: 0, losses: 0, pushes: 0, blackjacks: 0, currentStreak: 0, bestStreak: 0 });
      setCredits(1000);
    }
  }, []);

  // ─── Reset credits (free only) ────────────────────────────────────────────
  const resetCredits = useCallback(() => {
    if (mode !== 'free') return;
    setCredits(1000);
    setStats({ wins: 0, losses: 0, pushes: 0, blackjacks: 0, currentStreak: 0, bestStreak: 0 });
    setMessage('Credits reset to 1000');
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
    // isPending = wallet signing; isRecording = tx sent, waiting for receipt
    isPending: isPending || isConfirming,
    isRecording,
    txHash: hash,
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
