"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEventLogs } from "viem";
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
  const [currentBet, setCurrentBet] = useState(0);  // current bet to call
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

  // Onchain
  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { data: receipt, error: receiptError, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    timeout: 120_000,
    confirmations: 1,
  });

  const contractAddress = getContractAddress('poker', chain?.id);
  const gameAvailable = isGameAvailableOnChain('poker', chain?.id);

  const { data: onchainStats, refetch: refetchStats } = useReadContract({
    address: contractAddress!,
    abi: POKER_ABI,
    functionName: 'getStats',
    query: {
      enabled: isConnected && mode === 'onchain' && gameAvailable,
      gcTime: 0, staleTime: 0,
    }
  });

  // ─── Deck helpers ────────────────────────────────────────────────────────────

  const drawCard = useCallback((currentDeck: Card[], currentIndex: number): [Card, number] => {
    const card = currentDeck[currentIndex % currentDeck.length];
    return [card, currentIndex + 1];
  }, []);

  // ─── AI Dealer logic ─────────────────────────────────────────────────────────

  const dealerAction = useCallback((
    dealerCards: Card[], community: Card[], dealerStack: number, currentPotBet: number, dealerBet: number
  ): PokerAction => {
    const hand = evaluateBestHand(dealerCards, community);
    const toCall = currentPotBet - dealerBet;

    // Strong hands: raise
    const strongHands = ['royal_flush', 'straight_flush', 'four_of_a_kind', 'full_house', 'flush'];
    if (strongHands.includes(hand.rank)) return toCall > 0 ? 'call' : 'bet';

    // Medium hands: call or check
    const mediumHands = ['straight', 'three_of_a_kind', 'two_pair'];
    if (mediumHands.includes(hand.rank)) return toCall > 0 ? 'call' : 'check';

    // Weak but something: call small bets, fold big
    if (hand.rank === 'one_pair') {
      if (toCall > dealerStack * 0.25) return 'fold';
      return toCall > 0 ? 'call' : 'check';
    }

    // High card: bluff 20% of the time
    if (Math.random() < 0.2) return toCall > 0 ? 'call' : 'bet';
    if (toCall > BIG_BLIND * 2) return 'fold';
    return toCall > 0 ? 'call' : 'check';
  }, []);

  // ─── Start a new hand ────────────────────────────────────────────────────────

  const startHand = useCallback(() => {
    if (player.stack < BIG_BLIND) {
      setMessage('❌ Not enough chips! Game over.');
      setPhase('finished');
      return;
    }

    const newDeck = createShuffledDeck();
    let idx = 0;

    // Deal hole cards
    const [p1, i1] = drawCard(newDeck, idx); idx = i1;
    const [p2, i2] = drawCard(newDeck, idx); idx = i2;
    const [d1, i3] = drawCard(newDeck, idx); idx = i3;
    const [d2, i4] = drawCard(newDeck, idx); idx = i4;

    const playerHoleCards = [p1, p2];
    const dealerHoleCards = [
      { ...d1, faceUp: false },
      { ...d2, faceUp: false },
    ];

    // Dealer posts small blind, player posts big blind (simplified)
    const sb = Math.min(SMALL_BLIND, dealer.stack);
    const bb = Math.min(BIG_BLIND, player.stack);

    const newPot = sb + bb;

    setDeck(newDeck);
    setDeckIndex(idx);
    setCommunityCards([]);
    setPot(newPot);
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

  // ─── Deal community cards ────────────────────────────────────────────────────

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

  // ─── Advance to next street or showdown ──────────────────────────────────────

  const advanceStreet = useCallback((
    currentPhase: PokerPhase,
    currentDeck: Card[], currentIdx: number, currentCommunity: Card[],
    dealerStatus: 'active' | 'folded' | 'all_in'
  ) => {
    if (dealerStatus === 'folded') {
      // Player wins immediately
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

  // ─── Showdown evaluation ─────────────────────────────────────────────────────

  const runShowdown = useCallback((
    playerHoles: Card[], dealerHoles: Card[], community: Card[], currentPot: number
  ) => {
    const pResult = evaluateBestHand(playerHoles, community);
    const dResult = evaluateBestHand(dealerHoles, community);

    const revealed = dealerHoles.map(c => ({ ...c, faceUp: true }));
    setDealer(prev => ({ ...prev, holeCards: revealed }));
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
        bestHand: isWin && HAND_RANK_ORDER.indexOf(pResult.rank) < HAND_RANK_ORDER.indexOf(prev.bestHand as HandRank)
          ? pResult.rank : prev.bestHand,
      };
    });
  }, []);

  // ─── Player actions ───────────────────────────────────────────────────────────

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
  }, [phase, pot]);

  const check = useCallback(() => {
    if (phase === 'betting' || phase === 'showdown' || phase === 'finished') return;
    if (currentBet > player.bet) {
      setMessage('❌ You must call or raise — there is an active bet');
      return;
    }
    setMessage('✓ You checked');
    // Dealer acts
    const action = dealerAction(dealer.holeCards, communityCards, dealer.stack, currentBet, dealer.bet);
    let dealerPotContrib = 0;
    let nextDealerStatus = dealer.status;

    if (action === 'bet') {
      const betAmt = Math.min(BIG_BLIND * 2, dealer.stack);
      dealerPotContrib = betAmt;
      setDealer(prev => ({ ...prev, stack: prev.stack - betAmt, bet: prev.bet + betAmt }));
      setPot(prev => prev + betAmt);
      setCurrentBet(dealer.bet + betAmt);
      setMessage(`Dealer bets ${betAmt}. Call, Raise, or Fold?`);
      return; // Player must respond
    }
    if (action === 'fold') {
      nextDealerStatus = 'folded';
    }

    const { nextPhase, newCommunity, newIdx } = advanceStreet(phase, deck, deckIndex, communityCards, nextDealerStatus);
    setCommunityCards(newCommunity);
    setDeckIndex(newIdx);

    if (nextPhase === 'showdown') {
      if (nextDealerStatus === 'folded') {
        setPlayer(prev => ({ ...prev, stack: prev.stack + pot + dealerPotContrib }));
        setOutcome('win');
        setMessage('🎉 Dealer folded — you win!');
        setShowDealerCards(true);
        setPhase('showdown');
        setPot(0);
        setStats(prev => { const s = prev.currentStreak + 1; return { ...prev, handsPlayed: prev.handsPlayed + 1, handsWon: prev.handsWon + 1, currentStreak: s, bestStreak: Math.max(prev.bestStreak, s) }; });
      } else {
        runShowdown(player.holeCards, dealer.holeCards, newCommunity, pot + dealerPotContrib);
      }
    } else {
      setPhase(nextPhase);
      setMessage('Your turn');
      setPlayer(prev => ({ ...prev, bet: 0 }));
      setDealer(prev => ({ ...prev, bet: 0 }));
      setCurrentBet(0);
      setBetAmount(BIG_BLIND);
    }
  }, [phase, currentBet, player, dealer, communityCards, deck, deckIndex, pot, dealerAction, advanceStreet, runShowdown]);

  const call = useCallback(() => {
    if (phase === 'betting' || phase === 'showdown' || phase === 'finished') return;
    const toCall = Math.min(currentBet - player.bet, player.stack);
    if (toCall <= 0) { check(); return; }

    setPlayer(prev => ({ ...prev, stack: prev.stack - toCall, bet: prev.bet + toCall }));
    setPot(prev => prev + toCall);
    setMessage(`You called ${toCall}`);

    const action = dealerAction(dealer.holeCards, communityCards, dealer.stack, currentBet, dealer.bet);
    let nextDealerStatus = dealer.status;
    if (action === 'fold') nextDealerStatus = 'folded';

    const { nextPhase, newCommunity, newIdx } = advanceStreet(phase, deck, deckIndex, communityCards, nextDealerStatus);
    setCommunityCards(newCommunity);
    setDeckIndex(newIdx);

    if (nextPhase === 'showdown') {
      if (nextDealerStatus === 'folded') {
        const totalPot = pot + toCall;
        setPlayer(prev => ({ ...prev, stack: prev.stack + totalPot }));
        setOutcome('win');
        setMessage('🎉 Dealer folded — you win!');
        setShowDealerCards(true);
        setPhase('showdown');
        setPot(0);
        setStats(prev => { const s = prev.currentStreak + 1; return { ...prev, handsPlayed: prev.handsPlayed + 1, handsWon: prev.handsWon + 1, currentStreak: s, bestStreak: Math.max(prev.bestStreak, s) }; });
      } else {
        runShowdown(player.holeCards, dealer.holeCards, newCommunity, pot + toCall);
      }
    } else {
      setPhase(nextPhase);
      setMessage('Your turn');
      setPlayer(prev => ({ ...prev, bet: 0 }));
      setDealer(prev => ({ ...prev, bet: 0 }));
      setCurrentBet(0);
      setBetAmount(BIG_BLIND);
    }
  }, [phase, currentBet, player, dealer, communityCards, deck, deckIndex, pot, check, dealerAction, advanceStreet, runShowdown]);

  const bet = useCallback((amount: number) => {
    if (phase === 'betting' || phase === 'showdown' || phase === 'finished') return;
    const actualBet = Math.min(amount, player.stack);
    if (actualBet <= 0) return;

    setPlayer(prev => ({ ...prev, stack: prev.stack - actualBet, bet: prev.bet + actualBet }));
    setPot(prev => prev + actualBet);
    setCurrentBet(player.bet + actualBet);

    const action = dealerAction(dealer.holeCards, communityCards, dealer.stack, currentBet + actualBet, dealer.bet);
    let dealerContrib = 0;
    let nextDealerStatus = dealer.status;

    if (action === 'fold') {
      nextDealerStatus = 'folded';
    } else if (action === 'call' || action === 'raise') {
      const toCall = Math.min(player.bet + actualBet - dealer.bet, dealer.stack);
      dealerContrib = toCall;
      setDealer(prev => ({ ...prev, stack: prev.stack - toCall, bet: prev.bet + toCall }));
      setPot(prev => prev + toCall);
    }

    const { nextPhase, newCommunity, newIdx } = advanceStreet(phase, deck, deckIndex, communityCards, nextDealerStatus);
    setCommunityCards(newCommunity);
    setDeckIndex(newIdx);
    const totalPot = pot + actualBet + dealerContrib;

    if (nextPhase === 'showdown') {
      if (nextDealerStatus === 'folded') {
        setPlayer(prev => ({ ...prev, stack: prev.stack + totalPot }));
        setOutcome('win');
        setMessage('🎉 Dealer folded — you win!');
        setShowDealerCards(true);
        setPhase('showdown');
        setPot(0);
        setStats(prev => { const s = prev.currentStreak + 1; return { ...prev, handsPlayed: prev.handsPlayed + 1, handsWon: prev.handsWon + 1, currentStreak: s, bestStreak: Math.max(prev.bestStreak, s) }; });
      } else {
        runShowdown(player.holeCards, dealer.holeCards, newCommunity, totalPot);
      }
    } else {
      setPhase(nextPhase);
      setMessage('Your turn');
      setPlayer(prev => ({ ...prev, bet: 0 }));
      setDealer(prev => ({ ...prev, bet: 0 }));
      setCurrentBet(0);
      setBetAmount(BIG_BLIND);
    }
  }, [phase, player, dealer, communityCards, deck, deckIndex, pot, currentBet, dealerAction, advanceStreet, runShowdown]);

  // ─── Onchain mode ─────────────────────────────────────────────────────────────

  const playOnChain = useCallback(() => {
    if (!contractAddress || !isConnected) return;
    setPhase('preflop');
    setMessage('⏳ Waiting for wallet confirmation...');

    writeContract({
      address: contractAddress,
      abi: POKER_ABI,
      functionName: 'playHand',
      chainId: chain!.id,
      gas: BigInt(600000),
    });
  }, [contractAddress, isConnected, chain, writeContract]);

  useEffect(() => {
    if (hash && mode === 'onchain' && isConfirming) {
      setMessage('⏳ Confirming on blockchain... (this may take 10-30 seconds)');
    }
  }, [hash, mode, isConfirming]);

  useEffect(() => {
    if (writeError) {
      const msg = writeError.message || '';
      if (msg.includes('User rejected') || msg.includes('User denied')) {
        setMessage('❌ Transaction rejected');
      } else if (msg.includes('insufficient funds')) {
        setMessage('❌ Insufficient funds for gas');
      } else {
        setMessage('❌ Transaction failed');
      }
      setPhase('betting');
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError && mode === 'onchain') {
      setMessage(receiptError.message?.includes('timeout')
        ? '⚠️ Transaction timeout — check explorer'
        : '❌ Transaction error — try again');
      setPhase('betting');
      resetWrite?.();
    }
  }, [receiptError, mode, resetWrite]);

  useEffect(() => {
    if (receipt && mode === 'onchain' && address) {
      try {
        const events = parseEventLogs({ abi: POKER_ABI, eventName: ['HandPlayed'], logs: receipt.logs });
        const ev = events.find(e => (e.args as Record<string, unknown>).player?.toString().toLowerCase() === address.toLowerCase());
        if (ev) {
          const args = ev.args as unknown as { holeCards: number[]; communityCards: number[]; handRank: number; outcome: string };
          const pHoles = (args.holeCards || []).map((v: number) => ({ value: ((v - 1) % 13) + 1, suit: (['♠','♥','♦','♣'] as const)[Math.floor((v - 1) / 13) % 4], display: ['A','2','3','4','5','6','7','8','9','10','J','Q','K'][((v - 1) % 13)], faceUp: true }));
          const comm = (args.communityCards || []).map((v: number) => ({ value: ((v - 1) % 13) + 1, suit: (['♠','♥','♦','♣'] as const)[Math.floor((v - 1) / 13) % 4], display: ['A','2','3','4','5','6','7','8','9','10','J','Q','K'][((v - 1) % 13)], faceUp: true }));
          setCommunityCards(comm);
          setPlayer(prev => ({ ...prev, holeCards: pHoles }));
          setShowDealerCards(true);
          const isWin = args.outcome === 'win';
          setOutcome(isWin ? 'win' : args.outcome === 'split' ? 'split' : 'lose');
          setMessage(isWin ? '🎉 You WIN!' : args.outcome === 'split' ? '🤝 Split pot!' : '😔 Dealer wins');
          setPhase('showdown');
          setStats(prev => { const s = isWin ? prev.currentStreak + 1 : 0; return { ...prev, handsPlayed: prev.handsPlayed + 1, handsWon: isWin ? prev.handsWon + 1 : prev.handsWon, currentStreak: s, bestStreak: Math.max(prev.bestStreak, s) }; });
          setTimeout(() => refetchStats(), 2000);
        } else {
          setMessage('⚠️ Transaction confirmed but no event found');
          setPhase('betting');
        }
      } catch {
        setMessage('⚠️ Error parsing transaction result');
        setPhase('betting');
      }
    }
  }, [receipt, mode, address, refetchStats]);

  useEffect(() => {
    if (mode === 'onchain' && onchainStats) {
      const [handsPlayed, handsWon] = onchainStats as unknown as bigint[];
      setStats(prev => ({ ...prev, handsPlayed: Number(handsPlayed), handsWon: Number(handsWon) }));
    }
  }, [onchainStats, mode]);

  // ─── New hand / reset ─────────────────────────────────────────────────────────

  const newHand = useCallback(() => {
    if (player.stack < BIG_BLIND) {
      // Rebuy
      setPlayer({ id: 'player', holeCards: [], stack: STARTING_STACK, bet: 0, status: 'active', isDealer: false });
      setDealer({ id: 'dealer', holeCards: [], stack: STARTING_STACK, bet: 0, status: 'active', isDealer: true });
    }
    setRoundNumber(prev => prev + 1);
    setPhase('betting');
    setMessage('');
  }, [player.stack]);

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
  }, []);

  return {
    // State
    mode, phase, player, dealer, communityCards, pot, currentBet, betAmount, setBetAmount,
    outcome, message, showDealerCards, stats, roundNumber,
    playerHand, dealerHand,
    // Wallet
    address, isConnected, chain, contractAddress, gameAvailable,
    // Onchain state
    isPending, isConfirming, hash,
    // Actions
    startHand, fold, check, call, bet, playOnChain,
    newHand, switchMode,
    // Explorer
    explorerTxUrl: hash ? getExplorerTxUrl(chain?.id, hash) : null,
  };
}

// For stats bestHand comparison
import type { HandRank } from "@/lib/games/poker-evaluator";
const HAND_RANK_ORDER: HandRank[] = [
  'royal_flush', 'straight_flush', 'four_of_a_kind', 'full_house',
  'flush', 'straight', 'three_of_a_kind', 'two_pair', 'one_pair', 'high_card',
];
