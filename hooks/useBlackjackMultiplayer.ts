/**
 * useBlackjackMultiplayer Hook
 * Wraps useMultiplayer with Blackjack-specific logic
 *
 * Blackjack Multiplayer Flow:
 * 1. Both players and dealer are dealt 2 cards from a shared deck
 * 2. Players take turns hitting or standing
 * 3. After both players finish, dealer plays (hits until 17+)
 * 4. Results compared: player closest to 21 without busting wins
 */

'use client';

import { useState, useCallback } from 'react';
import { useMultiplayer } from './useMultiplayer';
import type { BlackjackState } from '@/lib/multiplayer/types';
import { convertToCard, type Card } from '@/lib/games/blackjack-cards';

type MatchResult = 'win' | 'lose' | 'draw' | null;

function createShuffledDeckIndices(): number[] {
  const indices = Array.from({ length: 52 }, (_, i) => i + 1);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function calculateHandTotal(cardValues: number[]): number {
  const cards = cardValues.map(convertToCard);
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.value === 1) {
      aces++;
      total += 11;
    } else if (card.value > 10) {
      total += 10;
    } else {
      total += card.value;
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

const INITIAL_STATE: BlackjackState = {
  phase: 'waiting',
  currentTurn: 1,
  deck: [],
  deckIndex: 0,
  player1Hand: [],
  player2Hand: [],
  dealerHand: [],
  player1Total: 0,
  player2Total: 0,
  dealerTotal: 0,
  player1Status: 'playing',
  player2Status: 'playing',
  showDealerCards: false,
  player1Result: null,
  player2Result: null,
  winner: null,
};

interface UseBlackjackMultiplayerReturn {
  // Game state
  myHand: Card[];
  opponentHand: Card[];
  dealerHand: Card[];
  myTotal: number;
  opponentTotal: number;
  dealerTotal: number;
  myStatus: string;
  opponentStatus: string;
  showDealerCards: boolean;
  isMyTurn: boolean;
  myResult: string | null;
  opponentResult: string | null;
  matchResult: MatchResult;
  phase: string;

  // Multiplayer state
  status: string;
  room: ReturnType<typeof useMultiplayer>['room'];
  players: ReturnType<typeof useMultiplayer>['players'];
  myPlayerNumber: number | null;
  opponent: ReturnType<typeof useMultiplayer>['opponent'];
  error: string | null;
  isSearching: boolean;
  isConnected: boolean;
  myStats: ReturnType<typeof useMultiplayer>['myStats'];
  opponentStats: ReturnType<typeof useMultiplayer>['opponentStats'];

  // Actions
  hit: () => Promise<void>;
  stand: () => Promise<void>;
  findMatch: (mode: 'ranked' | 'casual') => Promise<void>;
  createPrivateRoom: () => Promise<string>;
  joinByCode: (code: string) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
  cancelSearch: () => void;
  surrender: () => Promise<void>;
  playAgain: () => void;
}

function determinePlayerResult(
  playerTotal: number,
  playerStatus: string,
  dealerTotal: number,
  playerHandLength: number
): 'win' | 'lose' | 'push' | 'blackjack' {
  if (playerStatus === 'bust') return 'lose';
  if (playerStatus === 'blackjack') {
    return dealerTotal === 21 ? 'push' : 'blackjack';
  }
  if (dealerTotal > 21) return 'win';
  if (playerTotal > dealerTotal) return 'win';
  if (playerTotal < dealerTotal) return 'lose';
  return 'push';
}

export function useBlackjackMultiplayer(): UseBlackjackMultiplayerReturn {
  const [gameState, setGameState] = useState<BlackjackState>(INITIAL_STATE);
  const [matchResult, setMatchResult] = useState<MatchResult>(null);

  const multiplayer = useMultiplayer({
    gameId: 'blackjack',
    onGameStart: () => {
      console.log('[Blackjack Multiplayer] Game started');
      // Player 1 initializes the deck and deals
      const deck = createShuffledDeckIndices();
      const p1Hand = [deck[0], deck[1]];
      const p2Hand = [deck[2], deck[3]];
      const dHand = [deck[4], deck[5]];

      const p1Total = calculateHandTotal(p1Hand);
      const p2Total = calculateHandTotal(p2Hand);
      const dTotal = calculateHandTotal(dHand);

      const newState: BlackjackState = {
        phase: 'playing',
        currentTurn: 1,
        deck,
        deckIndex: 6,
        player1Hand: p1Hand,
        player2Hand: p2Hand,
        dealerHand: dHand,
        player1Total: p1Total,
        player2Total: p2Total,
        dealerTotal: dTotal,
        player1Status: p1Total === 21 && p1Hand.length === 2 ? 'blackjack' : 'playing',
        player2Status: p2Total === 21 && p2Hand.length === 2 ? 'blackjack' : 'playing',
        showDealerCards: false,
        player1Result: null,
        player2Result: null,
        winner: null,
      };

      // If player 1 has blackjack, skip to player 2
      if (newState.player1Status === 'blackjack') {
        newState.currentTurn = 2;
      }
      // If player 2 also has blackjack, go to dealer phase
      if (newState.player2Status === 'blackjack') {
        finishGame(newState);
      }

      setGameState(newState);
      setMatchResult(null);

      if (multiplayer.myPlayerNumber === 1) {
        multiplayer.updateGameState(newState);
      }
    },
    onGameEnd: (winnerId, reason) => {
      console.log('[Blackjack Multiplayer] Game ended:', winnerId, reason);
      if (reason === 'draw') {
        setMatchResult('draw');
      } else if (winnerId) {
        const myId = multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber)?.user_id;
        setMatchResult(winnerId === myId ? 'win' : 'lose');
      }
    },
    onOpponentAction: (action) => {
      console.log('[Blackjack Multiplayer] Opponent action:', action);
    },
    onGameStateUpdate: (state) => {
      console.log('[Blackjack Multiplayer] Game state update:', state);
      if (state && 'player1Hand' in state) {
        const bjState = state as BlackjackState;
        setGameState(bjState);

        if (bjState.winner !== null) {
          if (bjState.winner === 'draw') {
            setMatchResult('draw');
          } else if (bjState.winner === multiplayer.myPlayerNumber) {
            setMatchResult('win');
          } else {
            setMatchResult('lose');
          }
        }
      }
    },
  });

  const myPlayerNumber = multiplayer.myPlayerNumber;
  const isMyTurn = gameState.currentTurn === myPlayerNumber && gameState.phase === 'playing';

  const myHand = (myPlayerNumber === 1 ? gameState.player1Hand : gameState.player2Hand).map(convertToCard);
  const opponentHand = (myPlayerNumber === 1 ? gameState.player2Hand : gameState.player1Hand).map(convertToCard);
  const dealerHandCards = gameState.dealerHand.map(convertToCard);
  const myTotal = myPlayerNumber === 1 ? gameState.player1Total : gameState.player2Total;
  const opponentTotal = myPlayerNumber === 1 ? gameState.player2Total : gameState.player1Total;
  const myStatus = myPlayerNumber === 1 ? gameState.player1Status : gameState.player2Status;
  const opponentStatus = myPlayerNumber === 1 ? gameState.player2Status : gameState.player1Status;
  const myResult = myPlayerNumber === 1 ? gameState.player1Result : gameState.player2Result;
  const opponentResult = myPlayerNumber === 1 ? gameState.player2Result : gameState.player1Result;

  // Dealer plays and determines results
  function finishGame(state: BlackjackState) {
    state.showDealerCards = true;
    state.phase = 'finished';

    // Dealer hits until 17+
    let dHand = [...state.dealerHand];
    let dTotal = state.dealerTotal;
    let deckIdx = state.deckIndex;

    // Only dealer plays if at least one player is not bust
    const p1NotBust = state.player1Status !== 'bust';
    const p2NotBust = state.player2Status !== 'bust';

    if (p1NotBust || p2NotBust) {
      while (dTotal < 17 && deckIdx < state.deck.length) {
        dHand.push(state.deck[deckIdx++]);
        dTotal = calculateHandTotal(dHand);
      }
    }

    state.dealerHand = dHand;
    state.dealerTotal = dTotal;
    state.deckIndex = deckIdx;

    // Determine results
    state.player1Result = determinePlayerResult(
      state.player1Total, state.player1Status, dTotal, state.player1Hand.length
    );
    state.player2Result = determinePlayerResult(
      state.player2Total, state.player2Status, dTotal, state.player2Hand.length
    );

    // Determine winner: compare who did better against dealer
    const p1Score = resultToScore(state.player1Result);
    const p2Score = resultToScore(state.player2Result);

    if (p1Score > p2Score) {
      state.winner = 1;
    } else if (p2Score > p1Score) {
      state.winner = 2;
    } else {
      // Same result against dealer - compare totals
      if (state.player1Status !== 'bust' && state.player2Status !== 'bust') {
        if (state.player1Total > state.player2Total) {
          state.winner = 1;
        } else if (state.player2Total > state.player1Total) {
          state.winner = 2;
        } else {
          state.winner = 'draw';
        }
      } else {
        state.winner = 'draw';
      }
    }
  }

  const hit = useCallback(async () => {
    if (!isMyTurn || multiplayer.status !== 'playing') return;

    const newState: BlackjackState = { ...gameState };
    const deckIdx = newState.deckIndex;
    if (deckIdx >= newState.deck.length) return;

    const newCard = newState.deck[deckIdx];
    newState.deckIndex = deckIdx + 1;

    if (myPlayerNumber === 1) {
      newState.player1Hand = [...newState.player1Hand, newCard];
      newState.player1Total = calculateHandTotal(newState.player1Hand);
      if (newState.player1Total > 21) {
        newState.player1Status = 'bust';
        // Move to player 2 or finish
        if (newState.player2Status === 'playing') {
          newState.currentTurn = 2;
        } else {
          finishGame(newState);
        }
      }
    } else {
      newState.player2Hand = [...newState.player2Hand, newCard];
      newState.player2Total = calculateHandTotal(newState.player2Hand);
      if (newState.player2Total > 21) {
        newState.player2Status = 'bust';
        finishGame(newState);
      }
    }

    setGameState(newState);
    await multiplayer.sendAction('move', { type: 'hit' });
    await multiplayer.updateGameState(newState);
  }, [isMyTurn, gameState, myPlayerNumber, multiplayer]);

  const stand = useCallback(async () => {
    if (!isMyTurn || multiplayer.status !== 'playing') return;

    const newState: BlackjackState = { ...gameState };

    if (myPlayerNumber === 1) {
      newState.player1Status = 'standing';
      if (newState.player2Status === 'playing') {
        newState.currentTurn = 2;
      } else {
        finishGame(newState);
      }
    } else {
      newState.player2Status = 'standing';
      finishGame(newState);
    }

    setGameState(newState);
    await multiplayer.sendAction('move', { type: 'stand' });
    await multiplayer.updateGameState(newState);
  }, [isMyTurn, gameState, myPlayerNumber, multiplayer]);

  const playAgain = useCallback(() => {
    setGameState(INITIAL_STATE);
    setMatchResult(null);
  }, []);

  return {
    myHand,
    opponentHand,
    dealerHand: dealerHandCards,
    myTotal,
    opponentTotal,
    dealerTotal: gameState.dealerTotal,
    myStatus,
    opponentStatus,
    showDealerCards: gameState.showDealerCards,
    isMyTurn,
    myResult,
    opponentResult,
    matchResult,
    phase: gameState.phase,

    status: multiplayer.status,
    room: multiplayer.room,
    players: multiplayer.players,
    myPlayerNumber: multiplayer.myPlayerNumber,
    opponent: multiplayer.opponent,
    error: multiplayer.error,
    isSearching: multiplayer.isSearching,
    isConnected: multiplayer.isConnected,
    myStats: multiplayer.myStats,
    opponentStats: multiplayer.opponentStats,

    hit,
    stand,
    findMatch: multiplayer.findMatch,
    createPrivateRoom: multiplayer.createPrivateRoom,
    joinByCode: multiplayer.joinByCode,
    setReady: multiplayer.setReady,
    leaveRoom: multiplayer.leaveRoom,
    cancelSearch: multiplayer.cancelSearch,
    surrender: multiplayer.surrender,
    playAgain,
  };
}

function resultToScore(result: string | null): number {
  switch (result) {
    case 'blackjack': return 3;
    case 'win': return 2;
    case 'push': return 1;
    case 'lose': return 0;
    default: return 0;
  }
}

export default useBlackjackMultiplayer;
