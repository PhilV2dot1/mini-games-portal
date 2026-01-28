/**
 * useRPSMultiplayer Hook
 * Wraps useMultiplayer with Rock-Paper-Scissors specific logic
 *
 * RPS Multiplayer Flow:
 * 1. Both players make their choice simultaneously (hidden)
 * 2. When both have chosen, choices are revealed
 * 3. Round winner determined, scores updated
 * 4. First to win majority of rounds (e.g., 2/3) wins the match
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMultiplayer } from './useMultiplayer';
import type { RPSState } from '@/lib/multiplayer/types';

export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSResult = 'win' | 'lose' | 'draw' | null;

const INITIAL_STATE: RPSState = {
  round: 1,
  maxRounds: 3,
  player1Choice: null,
  player2Choice: null,
  revealed: false,
  scores: [0, 0],
  winner: null,
};

interface UseRPSMultiplayerReturn {
  // Game state
  round: number;
  maxRounds: number;
  myChoice: RPSChoice | null;
  opponentChoice: RPSChoice | null;
  revealed: boolean;
  scores: [number, number];
  roundResult: RPSResult;
  matchResult: RPSResult;
  hasChosen: boolean;
  opponentHasChosen: boolean;

  // Multiplayer state (from useMultiplayer)
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
  makeChoice: (choice: RPSChoice) => Promise<void>;
  findMatch: (mode: 'ranked' | 'casual') => Promise<void>;
  createPrivateRoom: () => Promise<string>;
  joinByCode: (code: string) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
  cancelSearch: () => void;
  surrender: () => Promise<void>;
  playAgain: () => void;
}

// Determine winner of a single round
function determineRoundWinner(choice1: RPSChoice, choice2: RPSChoice): 1 | 2 | 'draw' {
  if (choice1 === choice2) return 'draw';

  if (
    (choice1 === 'rock' && choice2 === 'scissors') ||
    (choice1 === 'paper' && choice2 === 'rock') ||
    (choice1 === 'scissors' && choice2 === 'paper')
  ) {
    return 1; // Player 1 wins
  }

  return 2; // Player 2 wins
}

export function useRPSMultiplayer(): UseRPSMultiplayerReturn {
  const [gameState, setGameState] = useState<RPSState>(INITIAL_STATE);
  const [roundResult, setRoundResult] = useState<RPSResult>(null);
  const [matchResult, setMatchResult] = useState<RPSResult>(null);
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize multiplayer hook
  const multiplayer = useMultiplayer({
    gameId: 'rps',
    onGameStart: () => {
      console.log('[RPS Multiplayer] Game started');
      // Reset game state when game starts
      setGameState(INITIAL_STATE);
      setRoundResult(null);
      setMatchResult(null);
    },
    onGameEnd: (winnerId, reason) => {
      console.log('[RPS Multiplayer] Game ended:', winnerId, reason);
      if (reason === 'draw') {
        setMatchResult('draw');
      } else if (winnerId) {
        const myId = multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber)?.user_id;
        setMatchResult(winnerId === myId ? 'win' : 'lose');
      }
    },
    onOpponentAction: (action) => {
      console.log('[RPS Multiplayer] Opponent action:', action);
      if (action.action_type === 'move' && action.action_data.choice) {
        // Opponent has made a choice (we just know they chose, not what)
        // The actual choice will be revealed via game state update
      }
    },
    onGameStateUpdate: (state) => {
      console.log('[RPS Multiplayer] Game state update:', state);
      if (state && 'round' in state) {
        const rpsState = state as RPSState;
        setGameState(rpsState);

        // Check if round just ended (both choices revealed)
        if (rpsState.revealed && rpsState.player1Choice && rpsState.player2Choice) {
          const winner = determineRoundWinner(rpsState.player1Choice, rpsState.player2Choice);
          if (winner === multiplayer.myPlayerNumber) {
            setRoundResult('win');
          } else if (winner === 'draw') {
            setRoundResult('draw');
          } else {
            setRoundResult('lose');
          }

          // Check for match winner
          if (rpsState.winner !== null) {
            if (rpsState.winner === 'draw') {
              setMatchResult('draw');
            } else if (rpsState.winner === multiplayer.myPlayerNumber) {
              setMatchResult('win');
            } else {
              setMatchResult('lose');
            }
          }
        }
      }
    },
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  // Computed values
  const myPlayerNumber = multiplayer.myPlayerNumber;
  const myChoice = myPlayerNumber === 1 ? gameState.player1Choice : gameState.player2Choice;
  const opponentChoice = gameState.revealed
    ? (myPlayerNumber === 1 ? gameState.player2Choice : gameState.player1Choice)
    : null;
  const hasChosen = myChoice !== null;
  const opponentHasChosen = myPlayerNumber === 1
    ? gameState.player2Choice !== null
    : gameState.player1Choice !== null;

  // Make a choice for this round
  const makeChoice = useCallback(async (choice: RPSChoice) => {
    if (hasChosen || multiplayer.status !== 'playing') {
      console.log('[RPS Multiplayer] Cannot make choice:', { hasChosen, status: multiplayer.status });
      return;
    }

    // Update local state immediately for responsiveness
    const newState: RPSState = { ...gameState };
    if (myPlayerNumber === 1) {
      newState.player1Choice = choice;
    } else {
      newState.player2Choice = choice;
    }

    // Check if both players have now chosen
    const bothChosen = newState.player1Choice !== null && newState.player2Choice !== null;
    if (bothChosen) {
      // Reveal after a short delay for suspense
      revealTimeoutRef.current = setTimeout(() => {
        const revealedState: RPSState = { ...newState, revealed: true };

        // Determine round winner
        const roundWinner = determineRoundWinner(
          revealedState.player1Choice!,
          revealedState.player2Choice!
        );

        // Update scores
        if (roundWinner === 1) {
          revealedState.scores = [revealedState.scores[0] + 1, revealedState.scores[1]];
        } else if (roundWinner === 2) {
          revealedState.scores = [revealedState.scores[0], revealedState.scores[1] + 1];
        }

        // Check for match winner (first to majority)
        const winsNeeded = Math.ceil(revealedState.maxRounds / 2);
        if (revealedState.scores[0] >= winsNeeded) {
          revealedState.winner = 1;
        } else if (revealedState.scores[1] >= winsNeeded) {
          revealedState.winner = 2;
        } else if (revealedState.round >= revealedState.maxRounds) {
          // All rounds played, check for draw
          if (revealedState.scores[0] === revealedState.scores[1]) {
            revealedState.winner = 'draw';
          } else {
            revealedState.winner = revealedState.scores[0] > revealedState.scores[1] ? 1 : 2;
          }
        }

        setGameState(revealedState);

        // If match not over, prepare next round after delay
        if (revealedState.winner === null) {
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              round: prev.round + 1,
              player1Choice: null,
              player2Choice: null,
              revealed: false,
            }));
            setRoundResult(null);
          }, 2000); // 2 seconds to see the result
        }
      }, 500); // Half second reveal delay
    }

    setGameState(newState);

    // Send action to server
    await multiplayer.sendAction('move', { choice });

    // Update game state on server
    await multiplayer.updateGameState(newState);
  }, [hasChosen, gameState, myPlayerNumber, multiplayer]);

  // Play again - reset local state
  const playAgain = useCallback(() => {
    setGameState(INITIAL_STATE);
    setRoundResult(null);
    setMatchResult(null);
  }, []);

  return {
    // Game state
    round: gameState.round,
    maxRounds: gameState.maxRounds,
    myChoice,
    opponentChoice,
    revealed: gameState.revealed,
    scores: gameState.scores,
    roundResult,
    matchResult,
    hasChosen,
    opponentHasChosen,

    // Multiplayer state
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

    // Actions
    makeChoice,
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

export default useRPSMultiplayer;
