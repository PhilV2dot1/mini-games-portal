/**
 * useSolitaireMultiplayer Hook
 * Wraps useMultiplayer with collaborative Solitaire logic
 * 2-4 players collaborate to complete a Solitaire game, taking turns
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMultiplayer } from './useMultiplayer';
import type { SolitaireCollaborativeState } from '@/lib/multiplayer/types';
import {
  type Card,
  type Suit,
  type SolitaireGameState,
  createDeck,
  dealCards,
  canPlaceOnTableau,
  canPlaceOnFoundation,
  checkWinCondition,
  checkIfBlocked,
} from './useSolitaire';

type CollabResult = 'won' | 'blocked' | null;

const TURN_TIME_LIMIT = 30; // seconds per turn

interface UseSolitaireMultiplayerReturn {
  // Game state
  gameState: SolitaireGameState | null;
  isMyTurn: boolean;
  currentTurnPlayer: number | null;
  result: CollabResult;
  playerMoves: Record<number, number>;
  turnTimeRemaining: number | null;

  // Multiplayer state
  status: string;
  room: ReturnType<typeof useMultiplayer>['room'];
  players: ReturnType<typeof useMultiplayer>['players'];
  myPlayerNumber: number | null;
  error: string | null;
  isSearching: boolean;
  isConnected: boolean;

  // Game actions
  handleDrawFromStock: () => Promise<void>;
  handleMoveWasteToTableau: (targetCol: number) => Promise<void>;
  handleMoveWasteToFoundation: (suit: Suit) => Promise<void>;
  handleMoveTableauToTableau: (fromCol: number, cardIndex: number, toCol: number) => Promise<void>;
  handleMoveTableauToFoundation: (colIndex: number, suit: Suit) => Promise<void>;
  handleMoveFoundationToTableau: (suit: Suit, targetCol: number) => Promise<void>;

  // Multiplayer actions
  findMatch: (mode: 'ranked' | 'casual') => Promise<void>;
  createPrivateRoom: () => Promise<string>;
  joinByCode: (code: string) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
  cancelSearch: () => void;
  playAgain: () => void;
}

// Scoring constants (same as solo)
const SCORING = {
  WASTE_TO_TABLEAU: 5,
  WASTE_TO_FOUNDATION: 10,
  TABLEAU_TO_FOUNDATION: 10,
  FOUNDATION_TO_TABLEAU: -15,
  STOCK_RECYCLE: -20,
};

function solitaireToCollabState(
  gs: SolitaireGameState,
  currentTurn: number,
  maxPlayers: number,
  playerMoves: Record<number, number>,
  gameStatus: 'playing' | 'won' | 'blocked'
): SolitaireCollaborativeState {
  return {
    tableau: gs.tableau,
    foundations: gs.foundations,
    stock: gs.stock,
    waste: gs.waste,
    moves: gs.moves,
    score: gs.score,
    currentTurn,
    maxPlayers,
    turnTimeLimit: TURN_TIME_LIMIT,
    turnStartedAt: Date.now(),
    playerMoves,
    status: gameStatus,
  };
}

function collabToSolitaireState(cs: SolitaireCollaborativeState): SolitaireGameState {
  return {
    tableau: cs.tableau as Card[][],
    foundations: cs.foundations as SolitaireGameState['foundations'],
    stock: cs.stock as Card[],
    waste: cs.waste as Card[],
    moves: cs.moves,
    score: cs.score,
    startTime: null,
    elapsedTime: 0,
  };
}

export function useSolitaireMultiplayer(): UseSolitaireMultiplayerReturn {
  const [localGameState, setLocalGameState] = useState<SolitaireGameState | null>(null);
  const [result, setResult] = useState<CollabResult>(null);
  const [playerMoves, setPlayerMoves] = useState<Record<number, number>>({});
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<number | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const multiplayer = useMultiplayer({
    gameId: 'solitaire',
    onGameStart: () => {
      console.log('[Solitaire Collab] Game started');
      // Host (player 1) creates and deals the initial game state
    },
    onGameEnd: (_winnerId, reason) => {
      console.log('[Solitaire Collab] Game ended:', reason);
      if (reason === 'win') {
        setResult('won');
      } else {
        setResult('blocked');
      }
    },
    onOpponentAction: (action) => {
      console.log('[Solitaire Collab] Action received:', action);
    },
    onGameStateUpdate: (state) => {
      console.log('[Solitaire Collab] Game state update');
      if (state && 'tableau' in state && 'currentTurn' in state) {
        const collabState = state as SolitaireCollaborativeState;
        setLocalGameState(collabToSolitaireState(collabState));
        setCurrentTurnPlayer(collabState.currentTurn);
        setPlayerMoves(collabState.playerMoves || {});

        if (collabState.status === 'won') {
          setResult('won');
        } else if (collabState.status === 'blocked') {
          setResult('blocked');
        }
      }
    },
  });

  const isMyTurn = currentTurnPlayer === multiplayer.myPlayerNumber;

  // Turn timer effect
  useEffect(() => {
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current);
      turnTimerRef.current = null;
    }

    if (multiplayer.status !== 'playing' || result) {
      setTurnTimeRemaining(null);
      return;
    }

    setTurnTimeRemaining(TURN_TIME_LIMIT);

    turnTimerRef.current = setInterval(() => {
      setTurnTimeRemaining(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
      }
    };
  }, [currentTurnPlayer, multiplayer.status, result]);

  // Auto-skip turn when timer runs out
  useEffect(() => {
    if (turnTimeRemaining === 0 && isMyTurn && multiplayer.status === 'playing' && !result) {
      advanceTurn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnTimeRemaining, isMyTurn, multiplayer.status, result]);

  // When game starts and I'm player 1, deal the cards
  useEffect(() => {
    if (
      multiplayer.status === 'playing' &&
      multiplayer.myPlayerNumber === 1 &&
      !localGameState &&
      !result
    ) {
      const deck = createDeck();
      const newState = dealCards(deck);
      newState.startTime = Date.now();
      setLocalGameState(newState);
      setCurrentTurnPlayer(1);

      const initialPlayerMoves: Record<number, number> = {};
      multiplayer.players.forEach(p => {
        initialPlayerMoves[p.player_number] = 0;
      });
      setPlayerMoves(initialPlayerMoves);

      // Broadcast initial state
      const collabState = solitaireToCollabState(
        newState,
        1,
        multiplayer.players.length,
        initialPlayerMoves,
        'playing'
      );
      multiplayer.updateGameState(collabState);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiplayer.status, multiplayer.myPlayerNumber, localGameState, result]);

  // Advance to next player's turn
  const advanceTurn = useCallback(() => {
    if (!currentTurnPlayer || !multiplayer.players.length) return;

    const playerNumbers = multiplayer.players
      .map(p => p.player_number)
      .sort((a, b) => a - b);

    const currentIndex = playerNumbers.indexOf(currentTurnPlayer);
    const nextIndex = (currentIndex + 1) % playerNumbers.length;
    const nextPlayer = playerNumbers[nextIndex];

    setCurrentTurnPlayer(nextPlayer);
    return nextPlayer;
  }, [currentTurnPlayer, multiplayer.players]);

  // Helper to broadcast state after a move
  const broadcastState = useCallback(async (
    newGameState: SolitaireGameState,
    nextTurn: number,
    newPlayerMoves: Record<number, number>
  ) => {
    // Check win condition
    const hasWon = checkWinCondition(newGameState.foundations);
    const isBlocked = !hasWon && checkIfBlocked(newGameState);

    let gameStatus: 'playing' | 'won' | 'blocked' = 'playing';
    if (hasWon) {
      gameStatus = 'won';
      setResult('won');
    } else if (isBlocked) {
      gameStatus = 'blocked';
      setResult('blocked');
    }

    const collabState = solitaireToCollabState(
      newGameState,
      nextTurn,
      multiplayer.players.length,
      newPlayerMoves,
      gameStatus
    );

    await multiplayer.sendAction('move', {
      playerNumber: multiplayer.myPlayerNumber,
      moveType: 'solitaire-move',
    });
    await multiplayer.updateGameState(collabState);
  }, [multiplayer]);

  // Increment player moves count
  const incrementMyMoves = useCallback(() => {
    const myNum = multiplayer.myPlayerNumber;
    if (!myNum) return playerMoves;
    const newMoves = { ...playerMoves, [myNum]: (playerMoves[myNum] || 0) + 1 };
    setPlayerMoves(newMoves);
    return newMoves;
  }, [multiplayer.myPlayerNumber, playerMoves]);

  // =====================
  // GAME MOVE HANDLERS
  // =====================

  const handleDrawFromStock = useCallback(async () => {
    if (!isMyTurn || !localGameState || multiplayer.status !== 'playing' || result) return;

    const state = localGameState;
    let newState: SolitaireGameState;

    if (state.stock.length === 0) {
      if (state.waste.length === 0) return;
      // Recycle waste to stock
      newState = {
        ...state,
        stock: [...state.waste].reverse().map(card => ({ ...card, faceUp: false })),
        waste: [],
        score: state.score + SCORING.STOCK_RECYCLE,
        moves: state.moves + 1,
      };
    } else {
      const card = { ...state.stock[0], faceUp: true };
      newState = {
        ...state,
        waste: [card, ...state.waste],
        stock: state.stock.slice(1),
        moves: state.moves + 1,
      };
    }

    setLocalGameState(newState);
    const newMoves = incrementMyMoves();
    const nextTurn = advanceTurn() || currentTurnPlayer || 1;
    await broadcastState(newState, nextTurn, newMoves);
  }, [isMyTurn, localGameState, multiplayer.status, result, incrementMyMoves, advanceTurn, currentTurnPlayer, broadcastState]);

  const handleMoveWasteToTableau = useCallback(async (targetCol: number) => {
    if (!isMyTurn || !localGameState || multiplayer.status !== 'playing' || result) return;
    if (localGameState.waste.length === 0) return;

    const card = localGameState.waste[0];
    const targetColumn = localGameState.tableau[targetCol];
    if (!canPlaceOnTableau(card, targetColumn)) return;

    const newTableau = [...localGameState.tableau];
    newTableau[targetCol] = [...newTableau[targetCol], card];

    const newState: SolitaireGameState = {
      ...localGameState,
      tableau: newTableau,
      waste: localGameState.waste.slice(1),
      score: localGameState.score + SCORING.WASTE_TO_TABLEAU,
      moves: localGameState.moves + 1,
    };

    setLocalGameState(newState);
    const newMoves = incrementMyMoves();
    const nextTurn = advanceTurn() || currentTurnPlayer || 1;
    await broadcastState(newState, nextTurn, newMoves);
  }, [isMyTurn, localGameState, multiplayer.status, result, incrementMyMoves, advanceTurn, currentTurnPlayer, broadcastState]);

  const handleMoveWasteToFoundation = useCallback(async (suit: Suit) => {
    if (!isMyTurn || !localGameState || multiplayer.status !== 'playing' || result) return;
    if (localGameState.waste.length === 0) return;

    const card = localGameState.waste[0];
    const foundation = localGameState.foundations[suit];
    if (!canPlaceOnFoundation(card, foundation)) return;

    const newFoundations = { ...localGameState.foundations };
    newFoundations[suit] = [...newFoundations[suit], card];

    const newState: SolitaireGameState = {
      ...localGameState,
      foundations: newFoundations,
      waste: localGameState.waste.slice(1),
      score: localGameState.score + SCORING.WASTE_TO_FOUNDATION,
      moves: localGameState.moves + 1,
    };

    setLocalGameState(newState);
    const newMoves = incrementMyMoves();
    const nextTurn = advanceTurn() || currentTurnPlayer || 1;
    await broadcastState(newState, nextTurn, newMoves);
  }, [isMyTurn, localGameState, multiplayer.status, result, incrementMyMoves, advanceTurn, currentTurnPlayer, broadcastState]);

  const handleMoveTableauToTableau = useCallback(async (fromCol: number, cardIndex: number, toCol: number) => {
    if (!isMyTurn || !localGameState || multiplayer.status !== 'playing' || result) return;

    const fromColumn = localGameState.tableau[fromCol];
    const toColumn = localGameState.tableau[toCol];

    if (cardIndex >= fromColumn.length) return;
    if (!fromColumn[cardIndex].faceUp) return;

    const cardsToMove = fromColumn.slice(cardIndex);
    if (!canPlaceOnTableau(cardsToMove[0], toColumn)) return;

    const newTableau = [...localGameState.tableau];
    const newFromColumn = [...newTableau[fromCol]].slice(0, cardIndex);
    const newToColumn = [...newTableau[toCol], ...cardsToMove];

    // Flip newly exposed card
    if (newFromColumn.length > 0) {
      const topCard = newFromColumn[newFromColumn.length - 1];
      if (!topCard.faceUp) {
        newFromColumn[newFromColumn.length - 1] = { ...topCard, faceUp: true };
      }
    }

    newTableau[fromCol] = newFromColumn;
    newTableau[toCol] = newToColumn;

    const newState: SolitaireGameState = {
      ...localGameState,
      tableau: newTableau,
      moves: localGameState.moves + 1,
    };

    setLocalGameState(newState);
    const newMoves = incrementMyMoves();
    const nextTurn = advanceTurn() || currentTurnPlayer || 1;
    await broadcastState(newState, nextTurn, newMoves);
  }, [isMyTurn, localGameState, multiplayer.status, result, incrementMyMoves, advanceTurn, currentTurnPlayer, broadcastState]);

  const handleMoveTableauToFoundation = useCallback(async (colIndex: number, suit: Suit) => {
    if (!isMyTurn || !localGameState || multiplayer.status !== 'playing' || result) return;

    const column = localGameState.tableau[colIndex];
    if (column.length === 0) return;

    const card = column[column.length - 1];
    const foundation = localGameState.foundations[suit];
    if (!canPlaceOnFoundation(card, foundation)) return;

    const newTableau = [...localGameState.tableau];
    const newColumn = [...newTableau[colIndex]];
    newColumn.pop();

    // Flip newly exposed card
    if (newColumn.length > 0) {
      const topCard = newColumn[newColumn.length - 1];
      if (!topCard.faceUp) {
        newColumn[newColumn.length - 1] = { ...topCard, faceUp: true };
      }
    }

    newTableau[colIndex] = newColumn;

    const newFoundations = { ...localGameState.foundations };
    newFoundations[suit] = [...newFoundations[suit], card];

    const newState: SolitaireGameState = {
      ...localGameState,
      tableau: newTableau,
      foundations: newFoundations,
      score: localGameState.score + SCORING.TABLEAU_TO_FOUNDATION,
      moves: localGameState.moves + 1,
    };

    setLocalGameState(newState);
    const newMoves = incrementMyMoves();
    const nextTurn = advanceTurn() || currentTurnPlayer || 1;
    await broadcastState(newState, nextTurn, newMoves);
  }, [isMyTurn, localGameState, multiplayer.status, result, incrementMyMoves, advanceTurn, currentTurnPlayer, broadcastState]);

  const handleMoveFoundationToTableau = useCallback(async (suit: Suit, targetCol: number) => {
    if (!isMyTurn || !localGameState || multiplayer.status !== 'playing' || result) return;

    const foundation = localGameState.foundations[suit];
    if (foundation.length === 0) return;

    const card = foundation[foundation.length - 1];
    const targetColumn = localGameState.tableau[targetCol];
    if (!canPlaceOnTableau(card, targetColumn)) return;

    const newFoundations = { ...localGameState.foundations };
    newFoundations[suit] = [...newFoundations[suit]];
    newFoundations[suit].pop();

    const newTableau = [...localGameState.tableau];
    newTableau[targetCol] = [...newTableau[targetCol], card];

    const newState: SolitaireGameState = {
      ...localGameState,
      foundations: newFoundations,
      tableau: newTableau,
      score: localGameState.score + SCORING.FOUNDATION_TO_TABLEAU,
      moves: localGameState.moves + 1,
    };

    setLocalGameState(newState);
    const newMoves = incrementMyMoves();
    const nextTurn = advanceTurn() || currentTurnPlayer || 1;
    await broadcastState(newState, nextTurn, newMoves);
  }, [isMyTurn, localGameState, multiplayer.status, result, incrementMyMoves, advanceTurn, currentTurnPlayer, broadcastState]);

  const playAgain = useCallback(() => {
    setLocalGameState(null);
    setResult(null);
    setPlayerMoves({});
    setCurrentTurnPlayer(null);
    setTurnTimeRemaining(null);
  }, []);

  return {
    // Game state
    gameState: localGameState,
    isMyTurn,
    currentTurnPlayer,
    result,
    playerMoves,
    turnTimeRemaining,

    // Multiplayer state
    status: multiplayer.status,
    room: multiplayer.room,
    players: multiplayer.players,
    myPlayerNumber: multiplayer.myPlayerNumber,
    error: multiplayer.error,
    isSearching: multiplayer.isSearching,
    isConnected: multiplayer.isConnected,

    // Game actions
    handleDrawFromStock,
    handleMoveWasteToTableau,
    handleMoveWasteToFoundation,
    handleMoveTableauToTableau,
    handleMoveTableauToFoundation,
    handleMoveFoundationToTableau,

    // Multiplayer actions
    findMatch: multiplayer.findMatch,
    createPrivateRoom: multiplayer.createPrivateRoom,
    joinByCode: multiplayer.joinByCode,
    setReady: multiplayer.setReady,
    leaveRoom: multiplayer.leaveRoom,
    cancelSearch: multiplayer.cancelSearch,
    playAgain,
  };
}

export default useSolitaireMultiplayer;
