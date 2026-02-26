/**
 * usePokerMultiplayer Hook
 * Wraps useMultiplayer with Texas Hold'em poker-specific logic.
 *
 * Flow:
 * 1. Player 1 (dealer button) posts small blind, Player 2 posts big blind.
 * 2. Each player gets 2 hole cards (preflop).
 * 3. Betting rounds: preflop → flop (3 cards) → turn (1 card) → river (1 card) → showdown.
 * 4. Player 1 (non-dealer) acts first preflop; dealer acts first post-flop.
 * 5. A player wins by having the best 5-card hand or by the opponent folding.
 */

'use client';

import { useState, useCallback } from 'react';
import { useMultiplayer } from './useMultiplayer';
import type { PokerMPState } from '@/lib/multiplayer/types';
import { convertToCard, type Card } from '@/lib/games/poker-cards';
import { evaluateBestHand } from '@/lib/games/poker-evaluator';

type MatchResult = 'win' | 'lose' | 'draw' | null;

const STARTING_STACK = 5000;
const SMALL_BLIND = 50;
const BIG_BLIND = 100;

function createShuffledDeckIndices(): number[] {
  const indices = Array.from({ length: 52 }, (_, i) => i + 1);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

const INITIAL_STATE: PokerMPState = {
  phase: 'waiting',
  currentTurn: 1,
  deck: [],
  deckIndex: 0,
  communityCards: [],
  pot: 0,
  currentBet: 0,
  player1Stack: STARTING_STACK,
  player2Stack: STARTING_STACK,
  player1Bet: 0,
  player2Bet: 0,
  player1TotalBet: 0,
  player2TotalBet: 0,
  player1Status: 'active',
  player2Status: 'active',
  player1HoleCards: [],
  player2HoleCards: [],
  dealerButton: 1,
  winner: null,
  player1HandRank: null,
  player2HandRank: null,
};

interface UsePokerMultiplayerReturn {
  // Game state
  gameState: PokerMPState | null;
  myHoleCards: Card[];
  opponentHoleCards: Card[];
  communityCards: Card[];
  myStack: number;
  opponentStack: number;
  myBet: number;
  opponentBet: number;
  myStatus: string;
  opponentStatus: string;
  isDealer: boolean;
  opponentHandResult: ReturnType<typeof evaluateBestHand> | undefined;
  isMyTurn: boolean;
  matchResult: MatchResult;
  betAmount: number;
  setBetAmount: (v: number) => void;
  winner: string | null;
  loser: string | null;

  // Multiplayer state
  status: ReturnType<typeof useMultiplayer>['status'];
  room: ReturnType<typeof useMultiplayer>['room'];
  players: ReturnType<typeof useMultiplayer>['players'];
  myPlayerNumber: number | null;
  error: string | null;
  isSearching: boolean;
  isConnected: boolean;
  myStats: ReturnType<typeof useMultiplayer>['myStats'];
  opponentStats: ReturnType<typeof useMultiplayer>['opponentStats'];

  // Actions
  fold: () => Promise<void>;
  check: () => Promise<void>;
  call: () => Promise<void>;
  bet: (amount: number) => Promise<void>;
  findMatch: (mode: 'ranked' | 'casual') => Promise<void>;
  createPrivateRoom: () => Promise<string>;
  joinByCode: (code: string) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  leaveRoom: () => void;
  cancelSearch: () => void;
  surrender: () => Promise<void>;
}

/** Determine hand winner at showdown */
function resolveShowdown(state: PokerMPState): PokerMPState {
  const community = state.communityCards.map(convertToCard);
  const p1Hole = state.player1HoleCards.map(convertToCard);
  const p2Hole = state.player2HoleCards.map(convertToCard);

  const p1Result = evaluateBestHand(p1Hole, community);
  const p2Result = evaluateBestHand(p2Hole, community);

  const newState: PokerMPState = { ...state };
  newState.phase = 'showdown';
  newState.player1HandRank = p1Result.label;
  newState.player2HandRank = p2Result.label;

  if (p1Result.score > p2Result.score) {
    newState.winner = 1;
    newState.player1Stack += state.pot;
  } else if (p2Result.score > p1Result.score) {
    newState.winner = 2;
    newState.player2Stack += state.pot;
  } else {
    // Split pot
    newState.winner = 'draw';
    const half = Math.floor(state.pot / 2);
    newState.player1Stack += half;
    newState.player2Stack += state.pot - half;
  }
  newState.pot = 0;
  return newState;
}

/** After a betting action, check if we should advance the street */
function maybeAdvanceStreet(state: PokerMPState): PokerMPState {
  // Both players have acted and bets are equal (or someone folded)
  if (state.player1Status === 'folded' || state.player2Status === 'folded') {
    // Win by fold — handled in fold()
    return state;
  }

  const betsEqual = state.player1Bet === state.player2Bet;
  if (!betsEqual) return state;

  // Move to next street
  const newState: PokerMPState = {
    ...state,
    player1Bet: 0,
    player2Bet: 0,
    currentBet: 0,
  };
  // Post-flop: non-dealer (player without dealer button) acts first
  const nonDealer = (state.dealerButton === 1 ? 2 : 1) as 1 | 2;

  if (state.phase === 'preflop') {
    // Deal flop (3 cards)
    newState.communityCards = [
      state.deck[state.deckIndex],
      state.deck[state.deckIndex + 1],
      state.deck[state.deckIndex + 2],
    ];
    newState.deckIndex = state.deckIndex + 3;
    newState.phase = 'flop';
    newState.currentTurn = nonDealer;
  } else if (state.phase === 'flop') {
    newState.communityCards = [...state.communityCards, state.deck[state.deckIndex]];
    newState.deckIndex = state.deckIndex + 1;
    newState.phase = 'turn';
    newState.currentTurn = nonDealer;
  } else if (state.phase === 'turn') {
    newState.communityCards = [...state.communityCards, state.deck[state.deckIndex]];
    newState.deckIndex = state.deckIndex + 1;
    newState.phase = 'river';
    newState.currentTurn = nonDealer;
  } else if (state.phase === 'river') {
    return resolveShowdown(newState);
  }
  return newState;
}

export function usePokerMultiplayer(): UsePokerMultiplayerReturn {
  const [gameState, setGameState] = useState<PokerMPState>(INITIAL_STATE);
  const [matchResult, setMatchResult] = useState<MatchResult>(null);
  const [betAmount, setBetAmount] = useState(BIG_BLIND * 2);
  const [winner, setWinner] = useState<string | null>(null);
  const [loser, setLoser] = useState<string | null>(null);

  const multiplayer = useMultiplayer({
    gameId: 'poker',
    onGameStart: () => {
      console.log('[Poker Multiplayer] Game started');

      // Player 1 (dealer button) always initialises the deck
      const deck = createShuffledDeckIndices();

      // Deal 2 hole cards to each player, burn 1 card first
      const p1HoleCards = [deck[1], deck[3]]; // indices 1,3
      const p2HoleCards = [deck[2], deck[4]]; // indices 2,4
      const deckIndex = 5; // next card to use

      // Blinds: player 1 = small blind, player 2 = big blind
      const p1Blind = Math.min(SMALL_BLIND, STARTING_STACK);
      const p2Blind = Math.min(BIG_BLIND, STARTING_STACK);

      const newState: PokerMPState = {
        phase: 'preflop',
        currentTurn: 1, // Player 1 (small blind) acts first preflop
        deck,
        deckIndex,
        communityCards: [],
        pot: p1Blind + p2Blind,
        currentBet: p2Blind, // Big blind sets the current bet
        player1Stack: STARTING_STACK - p1Blind,
        player2Stack: STARTING_STACK - p2Blind,
        player1Bet: p1Blind,
        player2Bet: p2Blind,
        player1TotalBet: p1Blind,
        player2TotalBet: p2Blind,
        player1Status: 'active',
        player2Status: 'active',
        player1HoleCards: p1HoleCards,
        player2HoleCards: p2HoleCards,
        dealerButton: 1,
        winner: null,
        player1HandRank: null,
        player2HandRank: null,
      };

      setGameState(newState);
      setMatchResult(null);
      setBetAmount(BIG_BLIND * 2);

      if (multiplayer.myPlayerNumber === 1) {
        multiplayer.updateGameState(newState);
      }
    },
    onGameEnd: (winnerId, reason) => {
      console.log('[Poker Multiplayer] Game ended:', winnerId, reason);
      const myPlayer = multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber);
      const opponentPlayer = multiplayer.players.find(p => p.player_number !== multiplayer.myPlayerNumber);

      if (reason === 'draw') {
        setMatchResult('draw');
        setWinner(null);
        setLoser(null);
      } else if (winnerId) {
        const isWin = winnerId === myPlayer?.user_id;
        setMatchResult(isWin ? 'win' : 'lose');
        setWinner(isWin ? (myPlayer?.display_name || myPlayer?.username || 'You') : (opponentPlayer?.display_name || opponentPlayer?.username || 'Opponent'));
        setLoser(isWin ? (opponentPlayer?.display_name || opponentPlayer?.username || 'Opponent') : (myPlayer?.display_name || myPlayer?.username || 'You'));
      }
    },
    onOpponentAction: (action) => {
      console.log('[Poker Multiplayer] Opponent action:', action);
    },
    onGameStateUpdate: (state) => {
      if (state && 'player1HoleCards' in state) {
        const pokerState = state as PokerMPState;
        setGameState(pokerState);

        if (pokerState.winner !== null) {
          const myPN = multiplayer.myPlayerNumber;
          if (pokerState.winner === 'draw') {
            setMatchResult('draw');
          } else {
            setMatchResult(pokerState.winner === myPN ? 'win' : 'lose');
          }
        }
      }
    },
  });

  const myPlayerNumber = multiplayer.myPlayerNumber;
  const isMyTurn = gameState.currentTurn === myPlayerNumber &&
    (gameState.phase === 'preflop' || gameState.phase === 'flop' ||
     gameState.phase === 'turn' || gameState.phase === 'river');

  const myHoleCards = (myPlayerNumber === 1
    ? gameState.player1HoleCards
    : gameState.player2HoleCards
  ).map(convertToCard);

  const opponentHoleCards = (myPlayerNumber === 1
    ? gameState.player2HoleCards
    : gameState.player1HoleCards
  ).map(v => ({ ...convertToCard(v), faceUp: gameState.phase === 'showdown' }));

  const communityCards = gameState.communityCards.map(convertToCard);

  const myStack = myPlayerNumber === 1 ? gameState.player1Stack : gameState.player2Stack;
  const opponentStack = myPlayerNumber === 1 ? gameState.player2Stack : gameState.player1Stack;
  const myBet = myPlayerNumber === 1 ? gameState.player1Bet : gameState.player2Bet;
  const opponentBet = myPlayerNumber === 1 ? gameState.player2Bet : gameState.player1Bet;
  const myStatus = myPlayerNumber === 1 ? gameState.player1Status : gameState.player2Status;
  const opponentStatus = myPlayerNumber === 1 ? gameState.player2Status : gameState.player1Status;
  const isDealer = gameState.dealerButton === myPlayerNumber;

  const opponentHandResult = gameState.phase === 'showdown'
    ? evaluateBestHand(
        opponentHoleCards,
        communityCards
      )
    : undefined;

  const fold = useCallback(async () => {
    if (!isMyTurn || multiplayer.status !== 'playing') return;

    const newState: PokerMPState = { ...gameState };
    if (myPlayerNumber === 1) {
      newState.player1Status = 'folded';
      newState.player2Stack += newState.pot;
      newState.winner = 2;
    } else {
      newState.player2Status = 'folded';
      newState.player1Stack += newState.pot;
      newState.winner = 1;
    }
    newState.pot = 0;
    newState.phase = 'showdown';

    setGameState(newState);
    await multiplayer.sendAction('move', { type: 'fold' });
    await multiplayer.updateGameState(newState);

    // Notify end
    const opponentPN = myPlayerNumber === 1 ? 2 : 1;
    const opponentPlayer = multiplayer.players.find(p => p.player_number === opponentPN);
    if (opponentPlayer) {
      await multiplayer.surrender(); // uses existing surrender mechanism
    }
  }, [isMyTurn, gameState, myPlayerNumber, multiplayer]);

  const check = useCallback(async () => {
    if (!isMyTurn || multiplayer.status !== 'playing') return;
    // Check is only valid when no outstanding bet to call
    if (gameState.currentBet > (myPlayerNumber === 1 ? gameState.player1Bet : gameState.player2Bet)) return;

    const newState: PokerMPState = { ...gameState };
    // Switch turn to opponent
    newState.currentTurn = (myPlayerNumber === 1 ? 2 : 1) as 1 | 2;

    // If it was the last actor (same bet), advance street
    const advanced = maybeAdvanceStreet(newState);

    setGameState(advanced);
    await multiplayer.sendAction('move', { type: 'check' });
    await multiplayer.updateGameState(advanced);
  }, [isMyTurn, gameState, myPlayerNumber, multiplayer]);

  const call = useCallback(async () => {
    if (!isMyTurn || multiplayer.status !== 'playing') return;

    const newState: PokerMPState = { ...gameState };
    const callAmount = newState.currentBet - (myPlayerNumber === 1 ? newState.player1Bet : newState.player2Bet);
    const actualCall = Math.min(callAmount, myPlayerNumber === 1 ? newState.player1Stack : newState.player2Stack);

    if (myPlayerNumber === 1) {
      newState.player1Stack -= actualCall;
      newState.player1Bet += actualCall;
      newState.player1TotalBet += actualCall;
    } else {
      newState.player2Stack -= actualCall;
      newState.player2Bet += actualCall;
      newState.player2TotalBet += actualCall;
    }
    newState.pot += actualCall;
    newState.currentTurn = (myPlayerNumber === 1 ? 2 : 1) as 1 | 2;

    const advanced = maybeAdvanceStreet(newState);

    setGameState(advanced);
    await multiplayer.sendAction('move', { type: 'call', amount: actualCall });
    await multiplayer.updateGameState(advanced);
  }, [isMyTurn, gameState, myPlayerNumber, multiplayer]);

  const bet = useCallback(async (amount: number) => {
    if (!isMyTurn || multiplayer.status !== 'playing') return;

    const newState: PokerMPState = { ...gameState };
    const myCurrentBet = myPlayerNumber === 1 ? newState.player1Bet : newState.player2Bet;
    const myStack = myPlayerNumber === 1 ? newState.player1Stack : newState.player2Stack;
    const raiseAmount = Math.min(amount, myStack);
    const totalBet = myCurrentBet + raiseAmount;

    if (myPlayerNumber === 1) {
      newState.player1Stack -= raiseAmount;
      newState.player1Bet = totalBet;
      newState.player1TotalBet += raiseAmount;
    } else {
      newState.player2Stack -= raiseAmount;
      newState.player2Bet = totalBet;
      newState.player2TotalBet += raiseAmount;
    }
    newState.pot += raiseAmount;
    newState.currentBet = totalBet;
    newState.currentTurn = (myPlayerNumber === 1 ? 2 : 1) as 1 | 2;

    setGameState(newState);
    await multiplayer.sendAction('move', { type: 'bet', amount: raiseAmount });
    await multiplayer.updateGameState(newState);
  }, [isMyTurn, gameState, myPlayerNumber, multiplayer]);

  return {
    gameState: multiplayer.status === 'playing' ? gameState : null,
    myHoleCards,
    opponentHoleCards,
    communityCards,
    myStack,
    opponentStack,
    myBet,
    opponentBet,
    myStatus,
    opponentStatus,
    isDealer,
    opponentHandResult,
    isMyTurn,
    matchResult,
    betAmount,
    setBetAmount,
    winner,
    loser,

    status: multiplayer.status,
    room: multiplayer.room,
    players: multiplayer.players,
    myPlayerNumber: multiplayer.myPlayerNumber,
    error: multiplayer.error,
    isSearching: multiplayer.isSearching,
    isConnected: multiplayer.isConnected,
    myStats: multiplayer.myStats,
    opponentStats: multiplayer.opponentStats,

    fold,
    check,
    call,
    bet,
    findMatch: multiplayer.findMatch,
    createPrivateRoom: multiplayer.createPrivateRoom,
    joinByCode: multiplayer.joinByCode,
    setReady: multiplayer.setReady,
    leaveRoom: multiplayer.leaveRoom,
    cancelSearch: multiplayer.cancelSearch,
    surrender: multiplayer.surrender,
  };
}

export default usePokerMultiplayer;
