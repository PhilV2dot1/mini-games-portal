/**
 * useSpectator Hook
 * Read-only multiplayer room subscription for watching live games
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MultiplayerRealtimeClient,
  type MultiplayerRoom,
  type RoomPlayer,
  type GameAction,
  type RoomCallbacks,
  type GameState,
} from '@/lib/multiplayer';

interface UseSpectatorReturn {
  // State
  room: MultiplayerRoom | null;
  players: RoomPlayer[];
  gameState: GameState | null;
  actions: GameAction[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  spectateRoom: (roomId: string) => Promise<void>;
  stopSpectating: () => void;
}

export function useSpectator(): UseSpectatorReturn {
  const [room, setRoom] = useState<MultiplayerRoom | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [actions, setActions] = useState<GameAction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<MultiplayerRealtimeClient | null>(null);

  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new MultiplayerRealtimeClient();
    }
    return () => {
      clientRef.current?.disconnect();
    };
  }, []);

  const spectateRoom = useCallback(async (roomId: string) => {
    setIsLoading(true);
    setError(null);
    setActions([]);

    try {
      // Fetch room details
      const response = await fetch(`/api/multiplayer/rooms/${roomId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch room details');
      }

      const data = await response.json();
      setRoom(data.room);
      setPlayers(data.players || []);
      if (data.room?.game_state) {
        setGameState(data.room.game_state as GameState);
      }

      // Subscribe to real-time updates (read-only, using a dummy spectator userId)
      const spectatorId = `spectator-${Date.now()}`;
      const callbacks: RoomCallbacks = {
        onPlayerJoin: (player) => {
          setPlayers(prev => {
            if (prev.some(p => p.user_id === player.user_id)) return prev;
            return [...prev, player];
          });
        },
        onPlayerLeave: (playerId) => {
          setPlayers(prev => prev.filter(p => p.user_id !== playerId));
        },
        onPlayerReady: (playerId, ready) => {
          setPlayers(prev =>
            prev.map(p => p.user_id === playerId ? { ...p, ready } : p)
          );
        },
        onGameStart: () => {
          setRoom(prev => prev ? { ...prev, status: 'playing' } : prev);
        },
        onGameStateUpdate: (state) => {
          setGameState(state as GameState);
        },
        onAction: (action) => {
          setActions(prev => [...prev.slice(-49), action]); // Keep last 50 actions
        },
        onGameEnd: (winnerId) => {
          setRoom(prev => prev ? { ...prev, status: 'finished', winner_id: winnerId } : prev);
        },
        onError: (err) => {
          setError(err.message);
        },
      };

      await clientRef.current!.subscribeToRoom(roomId, spectatorId, callbacks);
      setIsConnected(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopSpectating = useCallback(() => {
    clientRef.current?.disconnect();
    setRoom(null);
    setPlayers([]);
    setGameState(null);
    setActions([]);
    setIsConnected(false);
    setError(null);
  }, []);

  return {
    room,
    players,
    gameState,
    actions,
    isConnected,
    isLoading,
    error,
    spectateRoom,
    stopSpectating,
  };
}

export default useSpectator;
