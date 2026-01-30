/**
 * useMastermindMultiplayer Hook
 * Wraps useMultiplayer with Mastermind-specific logic
 *
 * Mastermind Multiplayer Flow:
 * 1. A shared secret code is generated
 * 2. Players alternate turns guessing the code
 * 3. Each gets feedback (exact + partial matches)
 * 4. First player to crack the code wins
 * 5. If both crack it, fewer attempts wins
 * 6. Max 10 attempts each
 */

'use client';

import { useState, useCallback } from 'react';
import { useMultiplayer } from './useMultiplayer';
import type { MastermindState } from '@/lib/multiplayer/types';
import {
  COLORS,
  CODE_LENGTH,
  MAX_ATTEMPTS,
  type Color,
  type Code,
  type Guess,
  type Feedback,
  evaluateGuess,
  isValidGuess,
  hasWon,
  calculateScore,
} from '@/lib/games/mastermind-logic';

type MatchResult = 'win' | 'lose' | 'draw' | null;

function generateSecretCodeIndices(): number[] {
  return Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * COLORS.length));
}

function indicesToCode(indices: number[]): Code {
  return indices.map(i => COLORS[i]) as Code;
}

const INITIAL_STATE: MastermindState = {
  secretCode: [],
  currentTurn: 1,
  player1Attempts: 0,
  player2Attempts: 0,
  player1History: [],
  player2History: [],
  player1Won: null,
  player2Won: null,
  player1Score: 0,
  player2Score: 0,
  phase: 'playing',
  winner: null,
};

interface UseMastermindMultiplayerReturn {
  // Game state
  currentGuess: Guess;
  myHistory: { guess: Code; feedback: Feedback }[];
  opponentHistory: { guess: Code; feedback: Feedback }[];
  myAttempts: number;
  opponentAttempts: number;
  isMyTurn: boolean;
  myWon: boolean | null;
  opponentWon: boolean | null;
  matchResult: MatchResult;
  phase: string;
  secretCode: Code | null; // revealed at end

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
  updateGuess: (position: number, color: Color | null) => void;
  submitGuess: () => Promise<void>;
  findMatch: (mode: 'ranked' | 'casual') => Promise<void>;
  createPrivateRoom: () => Promise<string>;
  joinByCode: (code: string) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
  cancelSearch: () => void;
  surrender: () => Promise<void>;
  playAgain: () => void;
}

export function useMastermindMultiplayer(): UseMastermindMultiplayerReturn {
  const [gameState, setGameState] = useState<MastermindState>(INITIAL_STATE);
  const [matchResult, setMatchResult] = useState<MatchResult>(null);
  const [currentGuess, setCurrentGuess] = useState<Guess>([null, null, null, null]);

  const multiplayer = useMultiplayer({
    gameId: 'mastermind',
    onGameStart: () => {
      console.log('[Mastermind Multiplayer] Game started');
      const code = generateSecretCodeIndices();
      const newState: MastermindState = {
        ...INITIAL_STATE,
        secretCode: code,
      };
      setGameState(newState);
      setMatchResult(null);
      setCurrentGuess([null, null, null, null]);

      if (multiplayer.myPlayerNumber === 1) {
        multiplayer.updateGameState(newState);
      }
    },
    onGameEnd: (winnerId, reason) => {
      console.log('[Mastermind Multiplayer] Game ended:', winnerId, reason);
      if (reason === 'draw') {
        setMatchResult('draw');
      } else if (winnerId) {
        const myId = multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber)?.user_id;
        setMatchResult(winnerId === myId ? 'win' : 'lose');
      }
    },
    onOpponentAction: (action) => {
      console.log('[Mastermind Multiplayer] Opponent action:', action);
    },
    onGameStateUpdate: (state) => {
      console.log('[Mastermind Multiplayer] Game state update:', state);
      if (state && 'secretCode' in state) {
        const mState = state as MastermindState;
        setGameState(mState);

        if (mState.winner !== null) {
          if (mState.winner === 'draw') {
            setMatchResult('draw');
          } else if (mState.winner === multiplayer.myPlayerNumber) {
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

  // Convert history indices to Color-based history
  const convertHistory = (history: { guess: number[]; exact: number; partial: number }[]) => {
    return history.map(h => ({
      guess: indicesToCode(h.guess),
      feedback: { blackPegs: h.exact, whitePegs: h.partial } as Feedback,
    }));
  };

  const myHistory = convertHistory(myPlayerNumber === 1 ? gameState.player1History : gameState.player2History);
  const opponentHistory = convertHistory(myPlayerNumber === 1 ? gameState.player2History : gameState.player1History);
  const myAttempts = myPlayerNumber === 1 ? gameState.player1Attempts : gameState.player2Attempts;
  const opponentAttempts = myPlayerNumber === 1 ? gameState.player2Attempts : gameState.player1Attempts;
  const myWon = myPlayerNumber === 1 ? gameState.player1Won : gameState.player2Won;
  const opponentWon = myPlayerNumber === 1 ? gameState.player2Won : gameState.player1Won;

  const updateGuess = useCallback((position: number, color: Color | null) => {
    setCurrentGuess(prev => {
      const newGuess = [...prev] as Guess;
      newGuess[position] = color;
      return newGuess;
    });
  }, []);

  const submitGuess = useCallback(async () => {
    if (!isMyTurn || multiplayer.status !== 'playing') return;
    if (!isValidGuess(currentGuess)) return;

    const code = indicesToCode(gameState.secretCode);
    const feedback = evaluateGuess(code, currentGuess as Code);
    const won = hasWon(feedback);

    // Convert guess to indices
    const guessIndices = (currentGuess as Code).map(c => COLORS.indexOf(c));

    const newState: MastermindState = { ...gameState };
    const historyEntry = { guess: guessIndices, exact: feedback.blackPegs, partial: feedback.whitePegs };

    if (myPlayerNumber === 1) {
      newState.player1History = [...newState.player1History, historyEntry];
      newState.player1Attempts = newState.player1Attempts + 1;
      if (won) {
        newState.player1Won = true;
        newState.player1Score = calculateScore(true, newState.player1Attempts);
      } else if (newState.player1Attempts >= MAX_ATTEMPTS) {
        newState.player1Won = false;
        newState.player1Score = 0;
      }
    } else {
      newState.player2History = [...newState.player2History, historyEntry];
      newState.player2Attempts = newState.player2Attempts + 1;
      if (won) {
        newState.player2Won = true;
        newState.player2Score = calculateScore(true, newState.player2Attempts);
      } else if (newState.player2Attempts >= MAX_ATTEMPTS) {
        newState.player2Won = false;
        newState.player2Score = 0;
      }
    }

    // Check if game is over
    const p1Done = newState.player1Won !== null;
    const p2Done = newState.player2Won !== null;

    if (p1Done && p2Done) {
      newState.phase = 'finished';
      // Determine winner
      if (newState.player1Won && newState.player2Won) {
        // Both cracked it - fewer attempts wins
        if (newState.player1Attempts < newState.player2Attempts) {
          newState.winner = 1;
        } else if (newState.player2Attempts < newState.player1Attempts) {
          newState.winner = 2;
        } else {
          newState.winner = 'draw';
        }
      } else if (newState.player1Won) {
        newState.winner = 1;
      } else if (newState.player2Won) {
        newState.winner = 2;
      } else {
        newState.winner = 'draw'; // Both failed
      }
    } else {
      // Switch turns
      newState.currentTurn = gameState.currentTurn === 1 ? 2 : 1;
    }

    setGameState(newState);
    setCurrentGuess([null, null, null, null]);

    await multiplayer.sendAction('move', {
      type: 'guess',
      guess: guessIndices,
      exact: feedback.blackPegs,
      partial: feedback.whitePegs,
    });
    await multiplayer.updateGameState(newState);
  }, [isMyTurn, currentGuess, gameState, myPlayerNumber, multiplayer]);

  const playAgain = useCallback(() => {
    setGameState(INITIAL_STATE);
    setMatchResult(null);
    setCurrentGuess([null, null, null, null]);
  }, []);

  return {
    currentGuess,
    myHistory,
    opponentHistory,
    myAttempts,
    opponentAttempts,
    isMyTurn,
    myWon,
    opponentWon,
    matchResult,
    phase: gameState.phase,
    secretCode: gameState.phase === 'finished' && gameState.secretCode.length > 0
      ? indicesToCode(gameState.secretCode)
      : null,

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

    updateGuess,
    submitGuess,
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

export default useMastermindMultiplayer;
