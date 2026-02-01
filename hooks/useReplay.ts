/**
 * useReplay Hook
 * Replay completed multiplayer games by stepping through their actions
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameAction, GameState, MultiplayerRoom, RoomPlayer } from '@/lib/multiplayer/types';

export type ReplaySpeed = 0.5 | 1 | 2 | 4;
export type ReplayStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'finished' | 'error';

interface UseReplayReturn {
  // State
  status: ReplayStatus;
  room: MultiplayerRoom | null;
  players: RoomPlayer[];
  actions: GameAction[];
  currentActionIndex: number;
  currentAction: GameAction | null;
  gameState: GameState | null;
  speed: ReplaySpeed;
  error: string | null;
  progress: number; // 0-100

  // Actions
  loadReplay: (roomId: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  seekTo: (index: number) => void;
  setSpeed: (speed: ReplaySpeed) => void;
  reset: () => void;
}

export function useReplay(): UseReplayReturn {
  const [status, setStatus] = useState<ReplayStatus>('idle');
  const [room, setRoom] = useState<MultiplayerRoom | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [actions, setActions] = useState<GameAction[]>([]);
  const [currentActionIndex, setCurrentActionIndex] = useState(-1);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);
  const [error, setError] = useState<string | null>(null);
  // Store all intermediate game states for seeking
  const gameStatesRef = useRef<(GameState | null)[]>([]);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentAction = currentActionIndex >= 0 && currentActionIndex < actions.length
    ? actions[currentActionIndex]
    : null;

  const progress = actions.length > 0
    ? Math.round(((currentActionIndex + 1) / actions.length) * 100)
    : 0;

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  const loadReplay = useCallback(async (roomId: string) => {
    setStatus('loading');
    setError(null);

    try {
      // Fetch room details
      const roomResponse = await fetch(`/api/multiplayer/rooms/${roomId}`);
      if (!roomResponse.ok) throw new Error('Failed to fetch room');
      const roomData = await roomResponse.json();

      if (roomData.room.status !== 'finished') {
        throw new Error('Game is not finished yet');
      }

      setRoom(roomData.room);
      setPlayers(roomData.players || []);

      // Fetch all actions for this room
      const actionsResponse = await fetch(`/api/multiplayer/rooms/${roomId}/actions`);
      if (!actionsResponse.ok) throw new Error('Failed to fetch actions');
      const actionsData = await actionsResponse.json();

      const sortedActions = (actionsData.actions || []).sort(
        (a: GameAction, b: GameAction) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setActions(sortedActions);
      setCurrentActionIndex(-1);
      setGameState(null);
      gameStatesRef.current = [];
      setStatus('ready');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }, []);

  const stepForward = useCallback(() => {
    if (currentActionIndex >= actions.length - 1) {
      setStatus('finished');
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
      return;
    }

    const nextIndex = currentActionIndex + 1;
    const action = actions[nextIndex];

    setCurrentActionIndex(nextIndex);

    // If this action has game_state data in its action_data, update the state
    if (action.action_data && 'gameState' in action.action_data) {
      const newState = action.action_data.gameState as GameState;
      setGameState(newState);
      gameStatesRef.current[nextIndex] = newState;
    }
  }, [currentActionIndex, actions]);

  const stepBackward = useCallback(() => {
    if (currentActionIndex <= 0) {
      setCurrentActionIndex(-1);
      setGameState(null);
      return;
    }

    const prevIndex = currentActionIndex - 1;
    setCurrentActionIndex(prevIndex);

    // Restore the game state at that point
    const cachedState = gameStatesRef.current[prevIndex];
    if (cachedState) {
      setGameState(cachedState);
    }
  }, [currentActionIndex]);

  const play = useCallback(() => {
    if (status === 'finished') {
      // Restart from beginning
      setCurrentActionIndex(-1);
      setGameState(null);
    }

    setStatus('playing');

    // Clear existing timer
    if (playTimerRef.current) clearInterval(playTimerRef.current);

    const interval = 1500 / speed; // Base interval 1.5s, adjusted by speed
    playTimerRef.current = setInterval(() => {
      setCurrentActionIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= actions.length) {
          if (playTimerRef.current) clearInterval(playTimerRef.current);
          playTimerRef.current = null;
          setStatus('finished');
          return prev;
        }

        const action = actions[nextIndex];
        if (action.action_data && 'gameState' in action.action_data) {
          const newState = action.action_data.gameState as GameState;
          setGameState(newState);
          gameStatesRef.current[nextIndex] = newState;
        }

        return nextIndex;
      });
    }, interval);
  }, [status, speed, actions]);

  const pause = useCallback(() => {
    setStatus('paused');
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
  }, []);

  const seekTo = useCallback((index: number) => {
    const clamped = Math.max(-1, Math.min(index, actions.length - 1));
    setCurrentActionIndex(clamped);

    if (clamped === -1) {
      setGameState(null);
      return;
    }

    // Find the nearest cached game state at or before this index
    let lastState: GameState | null = null;
    for (let i = clamped; i >= 0; i--) {
      if (gameStatesRef.current[i]) {
        lastState = gameStatesRef.current[i];
        break;
      }
      // Try to extract from action data
      const action = actions[i];
      if (action.action_data && 'gameState' in action.action_data) {
        lastState = action.action_data.gameState as GameState;
        gameStatesRef.current[i] = lastState;
        break;
      }
    }

    setGameState(lastState);

    if (status === 'playing') {
      pause();
    }
    if (clamped >= actions.length - 1) {
      setStatus('finished');
    } else {
      setStatus('paused');
    }
  }, [actions, status, pause]);

  const handleSetSpeed = useCallback((newSpeed: ReplaySpeed) => {
    setSpeed(newSpeed);
    // If currently playing, restart the timer with new speed
    if (status === 'playing' && playTimerRef.current) {
      clearInterval(playTimerRef.current);
      const interval = 1500 / newSpeed;
      playTimerRef.current = setInterval(() => {
        setCurrentActionIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex >= actions.length) {
            if (playTimerRef.current) clearInterval(playTimerRef.current);
            playTimerRef.current = null;
            setStatus('finished');
            return prev;
          }

          const action = actions[nextIndex];
          if (action.action_data && 'gameState' in action.action_data) {
            const newState = action.action_data.gameState as GameState;
            setGameState(newState);
            gameStatesRef.current[nextIndex] = newState;
          }

          return nextIndex;
        });
      }, interval);
    }
  }, [status, actions]);

  const reset = useCallback(() => {
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    setStatus('idle');
    setRoom(null);
    setPlayers([]);
    setActions([]);
    setCurrentActionIndex(-1);
    setGameState(null);
    setError(null);
    gameStatesRef.current = [];
  }, []);

  return {
    status,
    room,
    players,
    actions,
    currentActionIndex,
    currentAction,
    gameState,
    speed,
    error,
    progress,
    loadReplay,
    play,
    pause,
    stepForward,
    stepBackward,
    seekTo,
    setSpeed: handleSetSpeed,
    reset,
  };
}

export default useReplay;
