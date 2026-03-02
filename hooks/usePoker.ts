"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, createShuffledDeck } from "@/lib/games/poker-cards";
import { HandResult, evaluateBestHand, determineWinners } from "@/lib/games/poker-evaluator";
import { POKER_ABI } from "@/lib/contracts/poker-abi";
import { getContractAddress, isGameAvailableOnChain, getExplorerTxUrl } from "@/lib/contracts/addresses";

export type PokerPhase = 'betting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'finished';

export type PokerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all_in';

export interface PokerPlayer {
  id: 'player' | 'dealer';
  holeCards: Card[];
  handResult?: HandResult;
  stack: number;
  bet: number;
  status: 'active' | 'folded' | 'all_in';
  isDealer: boolean;
}

export interface PokerStats {
  handsPlayed: number;
  handsWon: number;
  biggestPot: number;
  currentStreak: number;
  bestStreak: number;
  bestHand: string;
}

// Map client outcome string → contract enum value (0=WIN, 1=LOSE, 2=SPLIT)
const OUTCOME_TO_ENUM: Record<string, number> = { win: 0, lose: 1, split: 2 };

// Map client hand rank string → contract uint8 (0–9)
const HAND_RANK_TO_UINT8: Record<string, number> = {
  high_card: 0, one_pair: 1, two_pair: 2, three_of_a_kind: 3,
  straight: 4, flush: 5, full_house: 6, four_of_a_kind: 7,
  straight_flush: 8, royal_flush: 9,
};

const SMALL_BLIND = 50;
const BIG_BLIND = 100;
const STARTING_STACK = 5000;

export function usePoker() {
  const { address, isConnected, chain } = useAccount();
  const [mode, setMode] = useState<'free' | 'onchain'>('free');
  const [phase, setPhase] = useState<PokerPhase>('betting');

  // Deck
  const [deck, setDeck] = useState<Card[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);

  // Players
  const [player, setPlayer] = useState<PokerPlayer>({
    id: 'player', holeCards: [], stack: STARTING_STACK, bet: 0, status: 'active', isDealer: false,
  });
  const [dealer, setDealer] = useState<PokerPlayer>({
    id: 'dealer', holeCards: [], stack: STARTING_STACK, bet: 0, status: 'active', isDealer: true,
  });

  // Community cards
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [betAmount, setBetAmount] = useState(BIG_BLIND);

  // Results
  const [playerHand, setPlayerHand] = useState<HandResult | null>(null);
  const [dealerHand, setDealerHand] = useState<HandResult | null>(null);
  const [outcome, setOutcome] = useState<'win' | 'lose' | 'split' | null>(null);
  const [message, setMessage] = useState('');
  const [showDealerCards, setShowDealerCards] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);

  // Stats
  const [stats, setStats] = useState<PokerStats>({
    handsPlayed: 0, handsWon: 0, biggestPot: 0, currentStreak: 0, bestStreak: 0, bestHand: '',
  });

  // Onchain — three separate write instances: startGame, endGame, abandonGame
  const { writeContract: writeStart, data: startHash, isPending: isStartPending, error: startError, reset: resetStart } = useWriteContract();
  const { writeContract: writeEnd, data: endHash, isPending: isEndPending, error: endError, reset: resetEnd } = useWriteContract();
  const { writeContract: writeAbandon, data: abandonHash, isPending: isAbandonPending, error: abandonError, reset: resetAbandon } = useWriteContract();

  const { data: startReceipt, error: startReceiptError, isLoading: isStartConfirming } = useWaitForTransactionReceipt({
    hash: startHash, timeout: 120_000, confirmations: 1,
  });
  const { data: endReceipt, error: endReceiptError, isLoading: isEndConfirming } = useWaitForTransactionReceipt({
    hash: endHash, timeout: 120_000, confirmations: 1,
  });
  const { data: abandonReceipt, error: abandonReceiptError, isLoading: isAbandonConfirming } = useWaitForTransactionReceipt({
    hash: abandonHash, timeout: 120_000, confirmations: 1,
  });

  // Pending endGame result — set synchronously when outcome is determined, cleared after tx
  const [pendingEnd, setPendingEnd] = useState<{ outcome: 'win'|'lose'|'split'; rank: string } | null>(null);

  // Use a ref for gameStartedOnChain so game actions don't need it as a dep
  // (avoids stale closure bugs from useCallback dependency arrays)
  const gameStartedOnChainRef = useRef(false);
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);
  const setOnChainStarted = (val: boolean) => {
    gameStartedOnChainRef.current = val;
    setGameStartedOnChain(val);
  };

  // Block actions only during startGame wallet prompt / confirmation
  const isPending = isStartPending || isAbandonPending;
  const isConfirming = isStartConfirming || isAbandonConfirming;
  const hash = endHash ?? startHash;
  const isRecording = isEndPending || isEndConfirming;

  const contractAddress = getContractAddress('poker', chain?.id);
  const gameAvailable = isGameAvailableOnChain('poker', chain?.id);

  const { data: onchainStats, refetch: refetchStats } = useReadContract({
    address: contractAddress!,
    abi: POKER_ABI,
    functionName: 'getPlayerStats',
    args: [address!],
    query: { enabled: isConnected && mode === 'onchain' && gameAvailable && !!address, gcTime: 0, staleTime: 0 }
  });

  const { data: isGameActiveOnChain, refetch: refetchIsActive } = useReadContract({
    address: contractAddress!,
    abi: POKER_ABI,
    functionName: 'isGameActive',
    args: [address!],
    query: { enabled: isConnected && mode === 'onchain' && gameAvailable && !!address, gcTime: 0, staleTime: 0 }
  });

  const hasActiveOnChainGame = !!isGameActiveOnChain;

  // ─── Deck helpers ─────────────────────────────────────────────────────────────

  const drawCard = useCallback((currentDeck: Card[], currentIndex: number): [Card, number] => {
    const card = currentDeck[currentIndex % currentDeck.length];
    return [card, currentIndex + 1];
  }, []);

  // ─── AI Dealer logic ──────────────────────────────────────────────────────────

  const dealerAction = useCallback((
    dealerCards: Card[], community: Card[], dealerStack: number, currentPotBet: number, dealerBet: number
  ): PokerAction => {
    const hand = evaluateBestHand(dealerCards, community);
    const toCall = currentPotBet - dealerBet;

    const strongHands = ['royal_flush', 'straight_flush', 'four_of_a_kind', 'full_house', 'flush'];
    if (strongHands.includes(hand.rank)) return toCall > 0 ? 'call' : 'bet';

    const mediumHands = ['straight', 'three_of_a_kind', 'two_pair'];
    if (mediumHands.includes(hand.rank)) return toCall > 0 ? 'call' : 'check';

    if (hand.rank === 'one_pair') {
      if (toCall > dealerStack * 0.25) return 'fold';
      return toCall > 0 ? 'call' : 'check';
    }

    if (Math.random() < 0.2) return toCall > 0 ? 'call' : 'bet';
    if (toCall > BIG_BLIND * 2) return 'fold';
    return toCall > 0 ? 'call' : 'check';
  }, []);

  // ─── Start a new hand ─────────────────────────────────────────────────────────

  const startHand = useCallback(() => {
    if (player.stack < BIG_BLIND) {
      setMessage('❌ Not enough chips! Game over.');
      setPhase('finished');
      return;
    }

    const newDeck = createShuffledDeck();
    let idx = 0;
    const [p1, i1] = drawCard(newDeck, idx); idx = i1;
    const [p2, i2] = drawCard(newDeck, idx); idx = i2;
    const [d1, i3] = drawCard(newDeck, idx); idx = i3;
    const [d2, i4] = drawCard(newDeck, idx); idx = i4;

    const playerHoleCards = [p1, p2];
    const dealerHoleCards = [{ ...d1, faceUp: false }, { ...d2, faceUp: false }];

    const sb = Math.min(SMALL_BLIND, dealer.stack);
    const bb = Math.min(BIG_BLIND, player.stack);

    setDeck(newDeck);
    setDeckIndex(idx);
    setCommunityCards([]);
    setPot(sb + bb);
    setCurrentBet(bb);
    setBetAmount(bb);
    setOutcome(null);
    setMessage('Your turn — Check, Bet, or Fold');
    setShowDealerCards(false);
    setPlayer(prev => ({ ...prev, holeCards: playerHoleCards, bet: bb, status: 'active' }));
    setDealer(prev => ({ ...prev, holeCards: dealerHoleCards, bet: sb, status: 'active' }));
    setPlayerHand(null);
    setDealerHand(null);
    setPhase('preflop');
  }, [player.stack, dealer.stack, drawCard]);

  // ─── Deal community cards ─────────────────────────────────────────────────────

  const dealFlop = useCallback((currentDeck: Card[], idx: number) => {
    let newIdx = idx;
    const [c1, i1] = drawCard(currentDeck, newIdx); newIdx = i1;
    const [c2, i2] = drawCard(currentDeck, newIdx); newIdx = i2;
    const [c3, i3] = drawCard(currentDeck, newIdx); newIdx = i3;
    return { cards: [c1, c2, c3], newIdx };
  }, [drawCard]);

  const dealOneCard = useCallback((currentDeck: Card[], idx: number) => {
    const [card, newIdx] = drawCard(currentDeck, idx);
    return { card, newIdx };
  }, [drawCard]);

  // ─── Advance to next street ───────────────────────────────────────────────────

  const advanceStreet = useCallback((
    currentPhase: PokerPhase,
    currentDeck: Card[], currentIdx: number, currentCommunity: Card[],
    dealerStatus: 'active' | 'folded' | 'all_in'
  ) => {
    if (dealerStatus === 'folded') {
      return { nextPhase: 'showdown' as PokerPhase, newCommunity: currentCommunity, newIdx: currentIdx };
    }
    if (currentPhase === 'preflop') {
      const { cards, newIdx } = dealFlop(currentDeck, currentIdx);
      return { nextPhase: 'flop' as PokerPhase, newCommunity: [...currentCommunity, ...cards], newIdx };
    }
    if (currentPhase === 'flop') {
      const { card, newIdx } = dealOneCard(currentDeck, currentIdx);
      return { nextPhase: 'turn' as PokerPhase, newCommunity: [...currentCommunity, card], newIdx };
    }
    if (currentPhase === 'turn') {
      const { card, newIdx } = dealOneCard(currentDeck, currentIdx);
      return { nextPhase: 'river' as PokerPhase, newCommunity: [...currentCommunity, card], newIdx };
    }
    return { nextPhase: 'showdown' as PokerPhase, newCommunity: currentCommunity, newIdx: currentIdx };
  }, [dealFlop, dealOneCard]);

  // ─── Showdown evaluation ──────────────────────────────────────────────────────
  // Returns { outcome, rank } — callers use this to setPendingEnd directly (no useEffect)

  const runShowdown = useCallback((
    playerHoles: Card[], dealerHoles: Card[], community: Card[], currentPot: number
  ): { outcome: 'win' | 'lose' | 'split'; rank: string } => {
    const pResult = evaluateBestHand(playerHoles, community);
    const dResult = evaluateBestHand(dealerHoles, community);

    setDealer(prev => ({ ...prev, holeCards: dealerHoles.map(c => ({ ...c, faceUp: true })) }));
    setShowDealerCards(true);
    setPlayerHand(pResult);
    setDealerHand(dResult);

    const winners = determineWinners([pResult, dResult]);
    let newOutcome: 'win' | 'lose' | 'split';
    let msg: string;

    if (winners.length === 2) {
      newOutcome = 'split';
      msg = `🤝 Split pot! Both players have ${pResult.label}`;
      const half = Math.floor(currentPot / 2);
      setPlayer(prev => ({ ...prev, stack: prev.stack + half }));
      setDealer(prev => ({ ...prev, stack: prev.stack + currentPot - half }));
    } else if (winners[0] === 0) {
      newOutcome = 'win';
      msg = `🎉 You WIN! ${pResult.label} beats ${dResult.label}`;
      setPlayer(prev => ({ ...prev, stack: prev.stack + currentPot }));
    } else {
      newOutcome = 'lose';
      msg = `😔 Dealer wins with ${dResult.label}`;
      setDealer(prev => ({ ...prev, stack: prev.stack + currentPot }));
    }

    setOutcome(newOutcome);
    setMessage(msg);
    setPhase('showdown');
    setPot(0);

    setStats(prev => {
      const isWin = newOutcome === 'win';
      const streak = isWin ? prev.currentStreak + 1 : 0;
      return {
        handsPlayed: prev.handsPlayed + 1,
        handsWon: isWin ? prev.handsWon + 1 : prev.handsWon,
        biggestPot: Math.max(prev.biggestPot, currentPot),
        currentStreak: streak,
        bestStreak: Math.max(prev.bestStreak, streak),
        bestHand: isWin && (
          !prev.bestHand ||
          HAND_RANK_ORDER.indexOf(pResult.rank) < HAND_RANK_ORDER.indexOf(prev.bestHand as HandRank)
        ) ? pResult.rank : prev.bestHand,
      };
    });

    return { outcome: newOutcome, rank: pResult.rank };
  }, []);

  // ─── Helpers for showdown from a win-by-fold ──────────────────────────────────
  // Extracted to avoid repetition in fold/check/call/bet

  const resolveWinByFold = useCallback((winPot: number) => {
    setPlayer(prev => ({ ...prev, stack: prev.stack + winPot }));
    setOutcome('win');
    setMessage('🎉 Dealer folded — you win!');
    setShowDealerCards(true);
    setPhase('showdown');
    setPot(0);
    setStats(prev => {
      const s = prev.currentStreak + 1;
      return { ...prev, handsPlayed: prev.handsPlayed + 1, handsWon: prev.handsWon + 1, currentStreak: s, bestStreak: Math.max(prev.bestStreak, s) };
    });
    if (gameStartedOnChainRef.current) setPendingEnd({ outcome: 'win', rank: 'high_card' });
  }, []);

  // ─── Player actions ───────────────────────────────────────────────────────────
  // gameStartedOnChain is read from a ref — no dependency, no stale closure.
  // All numeric values are computed locally before any setState call.

  const fold = useCallback(() => {
    if (phase === 'betting' || phase === 'showdown' || phase === 'finished') return;
    setPlayer(prev => ({ ...prev, status: 'folded' }));
    setDealer(prev => ({ ...prev, stack: prev.stack + pot }));
    setOutcome('lose');
    setMessage('😔 You folded');
    setShowDealerCards(true);
    setPhase('showdown');
    setPot(0);
    setStats(prev => ({ ...prev, handsPlayed: prev.handsPlayed + 1, currentStreak: 0 }));
    if (gameStartedOnChainRef.current) setPendingEnd({ outcome: 'lose', rank: 'high_card' });
  }, [phase, pot]);

  const check = useCallback(() => {
    if (phase === 'betting' || phase === 'showdown' || phase === 'finished') return;
    if (currentBet > player.bet) {
      setMessage('❌ You must call or raise — there is an active bet');
      return;
    }

    const action = dealerAction(dealer.holeCards, communityCards, dealer.stack, currentBet, dealer.bet);
    let nextDealerStatus = dealer.status;

    if (action === 'bet') {
      const betAmt = Math.min(BIG_BLIND * 2, dealer.stack);
      const newDealerBet = dealer.bet + betAmt;
      setDealer(prev => ({ ...prev, stack: prev.stack - betAmt, bet: newDealerBet }));
      setPot(prev => prev + betAmt);
      setCurrentBet(newDealerBet);
      setMessage(`Dealer bets ${betAmt}. Call, Raise, or Fold?`);
      return;
    }
    if (action === 'fold') nextDealerStatus = 'folded';

    const { nextPhase, newCommunity, newIdx } = advanceStreet(phase, deck, deckIndex, communityCards, nextDealerStatus);
    setCommunityCards(newCommunity);
    setDeckIndex(newIdx);

    if (nextPhase === 'showdown') {
      if (nextDealerStatus === 'folded') {
        resolveWinByFold(pot);
      } else {
        const result = runShowdown(player.holeCards, dealer.holeCards, newCommunity, pot);
        if (gameStartedOnChainRef.current) setPendingEnd(result);
      }
    } else {
      setPhase(nextPhase);
      setMessage('Your turn');
      setPlayer(prev => ({ ...prev, bet: 0 }));
      setDealer(prev => ({ ...prev, bet: 0 }));
      setCurrentBet(0);
      setBetAmount(BIG_BLIND);
    }
  }, [phase, currentBet, player, dealer, communityCards, deck, deckIndex, pot, dealerAction, advanceStreet, runShowdown, resolveWinByFold]);

  const call = useCallback(() => {
    if (phase === 'betting' || phase === 'showdown' || phase === 'finished') return;
    const toCall = Math.min(currentBet - player.bet, player.stack);
    if (toCall <= 0) { check(); return; }

    const newPot = pot + toCall;
    setPlayer(prev => ({ ...prev, stack: prev.stack - toCall, bet: prev.bet + toCall }));
    setPot(newPot);
    setMessage(`You called ${toCall}`);

    const action = dealerAction(dealer.holeCards, communityCards, dealer.stack, currentBet, dealer.bet);
    let nextDealerStatus = dealer.status;
    if (action === 'fold') nextDealerStatus = 'folded';

    const { nextPhase, newCommunity, newIdx } = advanceStreet(phase, deck, deckIndex, communityCards, nextDealerStatus);
    setCommunityCards(newCommunity);
    setDeckIndex(newIdx);

    if (nextPhase === 'showdown') {
      if (nextDealerStatus === 'folded') {
        resolveWinByFold(newPot);
      } else {
        const result = runShowdown(player.holeCards, dealer.holeCards, newCommunity, newPot);
        if (gameStartedOnChainRef.current) setPendingEnd(result);
      }
    } else {
      setPhase(nextPhase);
      setMessage('Your turn');
      setPlayer(prev => ({ ...prev, bet: 0 }));
      setDealer(prev => ({ ...prev, bet: 0 }));
      setCurrentBet(0);
      setBetAmount(BIG_BLIND);
    }
  }, [phase, currentBet, player, dealer, communityCards, deck, deckIndex, pot, check, dealerAction, advanceStreet, runShowdown, resolveWinByFold]);

  const bet = useCallback((amount: number) => {
    if (phase === 'betting' || phase === 'showdown' || phase === 'finished') return;
    const actualBet = Math.min(amount, player.stack);
    if (actualBet <= 0) return;

    const newPlayerBet = player.bet + actualBet;
    const newPlayerStack = player.stack - actualBet;

    const action = dealerAction(dealer.holeCards, communityCards, dealer.stack, newPlayerBet, dealer.bet);
    let dealerContrib = 0;
    let nextDealerStatus = dealer.status;

    if (action === 'fold') {
      nextDealerStatus = 'folded';
    } else if (action === 'call' || action === 'raise') {
      dealerContrib = Math.min(newPlayerBet - dealer.bet, dealer.stack);
      setDealer(prev => ({ ...prev, stack: prev.stack - dealerContrib, bet: prev.bet + dealerContrib }));
    }

    const newPot = pot + actualBet + dealerContrib;
    setPlayer(prev => ({ ...prev, stack: newPlayerStack, bet: newPlayerBet }));
    setPot(newPot);
    setCurrentBet(newPlayerBet);

    const { nextPhase, newCommunity, newIdx } = advanceStreet(phase, deck, deckIndex, communityCards, nextDealerStatus);
    setCommunityCards(newCommunity);
    setDeckIndex(newIdx);

    if (nextPhase === 'showdown') {
      if (nextDealerStatus === 'folded') {
        resolveWinByFold(newPot);
      } else {
        const result = runShowdown(player.holeCards, dealer.holeCards, newCommunity, newPot);
        if (gameStartedOnChainRef.current) setPendingEnd(result);
      }
    } else {
      setPhase(nextPhase);
      setMessage('Your turn');
      setPlayer(prev => ({ ...prev, bet: 0 }));
      setDealer(prev => ({ ...prev, bet: 0 }));
      setCurrentBet(0);
      setBetAmount(BIG_BLIND);
    }
  }, [phase, player, dealer, communityCards, deck, deckIndex, pot, dealerAction, advanceStreet, runShowdown, resolveWinByFold]);

  // ─── On-chain mode ────────────────────────────────────────────────────────────

  const playOnChain = useCallback(() => {
    if (!contractAddress || !isConnected) return;
    resetStart?.();
    setMessage('⏳ Waiting for wallet confirmation...');
    writeStart({
      address: contractAddress,
      abi: POKER_ABI,
      functionName: 'startGame',
      chainId: chain!.id,
      gas: BigInt(300000),
    });
  }, [contractAddress, isConnected, chain, writeStart, resetStart]);

  // startGame confirmed → deal the hand client-side
  useEffect(() => {
    if (startReceipt && mode === 'onchain') {
      setOnChainStarted(true);
      startHand();
    }
  }, [startReceipt]); // eslint-disable-line react-hooks/exhaustive-deps

  const abandonGame = useCallback(() => {
    if (!contractAddress || !isConnected) return;
    resetAbandon?.();
    setMessage('⏳ Abandoning active game...');
    writeAbandon({
      address: contractAddress,
      abi: POKER_ABI,
      functionName: 'abandonGame',
      chainId: chain!.id,
      gas: BigInt(200000),
    });
  }, [contractAddress, isConnected, chain, writeAbandon, resetAbandon]);

  useEffect(() => {
    if (abandonReceipt && mode === 'onchain') {
      setMessage('');
      setPhase('betting');
      setOnChainStarted(false);
      setTimeout(() => { refetchIsActive(); refetchStats(); }, 1500);
    }
  }, [abandonReceipt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (abandonError) {
      const msg = abandonError.message || '';
      setMessage(msg.includes('User rejected') || msg.includes('User denied')
        ? '❌ Transaction rejected'
        : '❌ Failed to abandon game — try again');
      resetAbandon?.();
    }
  }, [abandonError, resetAbandon]);

  useEffect(() => {
    if (abandonReceiptError && mode === 'onchain') {
      setMessage('⚠️ Abandon transaction error — try again');
      resetAbandon?.();
    }
  }, [abandonReceiptError]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitOnChainResult = useCallback((
    currentOutcome: 'win' | 'lose' | 'split',
    handRank: string,
  ) => {
    if (!contractAddress || !isConnected) return;
    resetEnd?.();
    const outcomeEnum = OUTCOME_TO_ENUM[currentOutcome] ?? 1;
    const rankUint8 = HAND_RANK_TO_UINT8[handRank] ?? 0;
    writeEnd({
      address: contractAddress,
      abi: POKER_ABI,
      functionName: 'endGame',
      args: [outcomeEnum, rankUint8],
      chainId: chain!.id,
      gas: BigInt(300000),
    });
  }, [contractAddress, isConnected, chain, writeEnd, resetEnd]);

  // endGame confirmed → reset for next hand
  useEffect(() => {
    if (endReceipt && mode === 'onchain') {
      setPendingEnd(null);
      setOnChainStarted(false);
      setRoundNumber(prev => prev + 1);
      setPhase('betting');
      setMessage('');
      setTimeout(() => { refetchStats(); refetchIsActive(); }, 2000);
    }
  }, [endReceipt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (startHash && mode === 'onchain' && isStartConfirming) {
      setMessage('⏳ Confirming on blockchain...');
    }
  }, [startHash, isStartConfirming]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (startError) {
      const msg = startError.message || '';
      setMessage(
        msg.includes('User rejected') || msg.includes('User denied') ? '❌ Transaction rejected' :
        msg.includes('insufficient funds') ? '❌ Insufficient funds for gas' :
        '❌ Transaction failed'
      );
      setPhase('betting');
    }
  }, [startError]);

  useEffect(() => {
    if (endError) {
      setMessage('⚠️ Failed to record result on-chain — retry with New Hand');
    }
  }, [endError]);

  useEffect(() => {
    if (startReceiptError && mode === 'onchain') {
      setMessage(startReceiptError.message?.includes('timeout')
        ? '⚠️ Transaction timeout — check explorer'
        : '❌ Transaction error — try again');
      setPhase('betting');
      setOnChainStarted(false);
      resetStart?.();
    }
  }, [startReceiptError]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (endReceiptError && mode === 'onchain') {
      setMessage('⚠️ Failed to record result on-chain — retry with New Hand');
      resetEnd?.();
    }
  }, [endReceiptError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync onchain stats — contract returns (handsPlayed, handsWon, handsSplit, bestHandRank, winRate)
  useEffect(() => {
    if (mode === 'onchain' && onchainStats) {
      const [handsPlayed, handsWon, , bestHandRank] = onchainStats as unknown as bigint[];
      const handsPlayedNum = Number(handsPlayed);
      const bestHandIdx = 9 - Number(bestHandRank);
      setStats(prev => ({
        ...prev,
        handsPlayed: handsPlayedNum,
        handsWon: Number(handsWon),
        bestHand: handsPlayedNum > 0 ? (HAND_RANK_ORDER[bestHandIdx] ?? prev.bestHand) : prev.bestHand,
      }));
    }
  }, [onchainStats, mode]);

  // ─── New hand / reset ─────────────────────────────────────────────────────────

  const newHand = useCallback(() => {
    if (mode === 'onchain' && pendingEnd) {
      submitOnChainResult(pendingEnd.outcome, pendingEnd.rank);
      if (player.stack < BIG_BLIND) {
        setPlayer({ id: 'player', holeCards: [], stack: STARTING_STACK, bet: 0, status: 'active', isDealer: false });
        setDealer({ id: 'dealer', holeCards: [], stack: STARTING_STACK, bet: 0, status: 'active', isDealer: true });
      }
      return;
    }

    if (player.stack < BIG_BLIND) {
      setPlayer({ id: 'player', holeCards: [], stack: STARTING_STACK, bet: 0, status: 'active', isDealer: false });
      setDealer({ id: 'dealer', holeCards: [], stack: STARTING_STACK, bet: 0, status: 'active', isDealer: true });
    }
    setRoundNumber(prev => prev + 1);
    setPhase('betting');
    setMessage('');
  }, [mode, pendingEnd, player.stack, submitOnChainResult]);

  const switchMode = useCallback((newMode: 'free' | 'onchain') => {
    setMode(newMode);
    setPhase('betting');
    setCommunityCards([]);
    setPlayerHand(null);
    setDealerHand(null);
    setOutcome(null);
    setMessage('');
    setPlayer(prev => ({ ...prev, holeCards: [], bet: 0, status: 'active', stack: STARTING_STACK }));
    setDealer(prev => ({ ...prev, holeCards: [], bet: 0, status: 'active', stack: STARTING_STACK }));
    setPot(0);
    setCurrentBet(0);
    setPendingEnd(null);
    setOnChainStarted(false);
  }, []);

  return {
    mode, phase, player, dealer, communityCards, pot, currentBet, betAmount, setBetAmount,
    outcome, message, showDealerCards, stats, roundNumber,
    playerHand, dealerHand,
    address, isConnected, chain, contractAddress, gameAvailable,
    isPending, isConfirming, isRecording, hash, pendingEnd,
    hasActiveOnChainGame,
    startHand, fold, check, call, bet, playOnChain, submitOnChainResult,
    newHand, switchMode, abandonGame,
    explorerTxUrl: hash ? getExplorerTxUrl(chain?.id, hash) : null,
  };
}

// For stats bestHand comparison
import type { HandRank } from "@/lib/games/poker-evaluator";
const HAND_RANK_ORDER: HandRank[] = [
  'royal_flush', 'straight_flush', 'four_of_a_kind', 'full_house',
  'flush', 'straight', 'three_of_a_kind', 'two_pair', 'one_pair', 'high_card',
];
