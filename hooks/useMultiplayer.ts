/**
 * useMultiplayer Hook
 * React hook for multiplayer game functionality
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  MultiplayerRealtimeClient,
  type MultiplayerRoom,
  type RoomPlayer,
  type GameAction,
  type MultiplayerStats,
  type MultiplayerStatus,
  type RoomCallbacks,
  type ActionType,
  type GameState,
} from '@/lib/multiplayer';

interface UseMultiplayerOptions {
  gameId: string;
  onGameStart?: () => void;
  onGameEnd?: (winnerId: string | null, reason: string) => void;
  onOpponentAction?: (action: GameAction) => void;
  onGameStateUpdate?: (state: GameState) => void;
}

interface UseMultiplayerReturn {
  // State
  room: MultiplayerRoom | null;
  players: RoomPlayer[];
  gameState: GameState | null;
  status: MultiplayerStatus;
  myPlayerNumber: number | null;
  isMyTurn: boolean;
  error: string | null;
  isSearching: boolean;
  isConnected: boolean;

  // Player info
  myStats: MultiplayerStats | null;
  opponentStats: MultiplayerStats | null;
  opponent: RoomPlayer | null;

  // Actions
  findMatch: (mode: 'ranked' | 'casual') => Promise<void>;
  createPrivateRoom: () => Promise<string>;
  joinByCode: (code: string) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  sendAction: (type: ActionType, data: Record<string, unknown>) => Promise<void>;
  updateGameState: (state: GameState) => Promise<void>;
  surrender: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  cancelSearch: () => void;
}

export function useMultiplayer(options: UseMultiplayerOptions): UseMultiplayerReturn {
  const { gameId, onGameStart, onGameEnd, onOpponentAction, onGameStateUpdate } = options;
  const { user } = useAuth();

  // State
  const [room, setRoom] = useState<MultiplayerRoom | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [status, setStatus] = useState<MultiplayerStatus>('idle');
  const [myPlayerNumber, setMyPlayerNumber] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myStats, setMyStats] = useState<MultiplayerStats | null>(null);
  const [opponentStats, setOpponentStats] = useState<MultiplayerStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs
  const clientRef = useRef<MultiplayerRealtimeClient | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Computed values
  const isMyTurn = gameState && 'currentTurn' in gameState
    ? gameState.currentTurn === myPlayerNumber
    : false;

  const opponent = players.find(p => p.player_number !== myPlayerNumber) || null;
  const isSearching = status === 'searching';

  // Initialize realtime client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new MultiplayerRealtimeClient();
    }

    return () => {
      // Cleanup on unmount
      clientRef.current?.disconnect();
    };
  }, []);

  // Subscribe to room updates
  const subscribeToRoom = useCallback(async (roomId: string) => {
    if (!user?.id || !clientRef.current) return;

    const callbacks: RoomCallbacks = {
      onPlayerJoin: (player) => {
        console.log('[useMultiplayer] Player joined:', player);
        setPlayers(prev => {
          // Avoid duplicates - check by player_number (more reliable than user_id
          // since local creator uses auth ID but realtime sends internal DB ID)
          if (prev.some(p => p.player_number === player.player_number)) {
            // Update existing player with server data (replace local placeholder)
            return prev.map(p => p.player_number === player.player_number ? player : p);
          }
          return [...prev, player];
        });
      },
      onPlayerLeave: (playerId) => {
        console.log('[useMultiplayer] Player left:', playerId);
        setPlayers(prev => prev.filter(p => p.user_id !== playerId));
      },
      onPlayerReady: (playerId, ready, playerNumber) => {
        console.log('[useMultiplayer] Player ready:', playerId, ready, 'playerNumber:', playerNumber);
        setPlayers(prev =>
          prev.map(p => {
            // Match by player_number (more reliable) or fall back to user_id
            if (playerNumber && p.player_number === playerNumber) return { ...p, ready };
            if (p.user_id === playerId) return { ...p, ready };
            return p;
          })
        );
      },
      onGameStart: () => {
        console.log('[useMultiplayer] Game started');
        setStatus('playing');
        onGameStart?.();
      },
      onGameStateUpdate: (state) => {
        console.log('[useMultiplayer] Game state update:', state);
        setGameState(state as GameState);
        onGameStateUpdate?.(state as GameState);
      },
      onAction: (action) => {
        console.log('[useMultiplayer] Action received:', action);
        onOpponentAction?.(action);
      },
      onGameEnd: (winnerId, reason) => {
        console.log('[useMultiplayer] Game ended:', winnerId, reason);
        setStatus('finished');
        onGameEnd?.(winnerId, reason);
      },
      onError: (err) => {
        console.error('[useMultiplayer] Error:', err);
        setError(err.message);
      },
    };

    await clientRef.current.subscribeToRoom(roomId, user.id, callbacks);
    setIsConnected(true);
  }, [user?.id, onGameStart, onGameEnd, onOpponentAction, onGameStateUpdate]);

  // Poll for game start as fallback when realtime doesn't fire
  const startGamePolling = useCallback((roomId: string) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/multiplayer/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room?.status === 'playing') {
            console.log('[useMultiplayer] Game started (detected via polling)');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setStatus('playing');
            onGameStart?.();
          }
        }
      } catch (err) {
        console.error('[useMultiplayer] Polling error:', err);
      }
    }, 2000);

    // Stop polling after 60 seconds
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 60000);
  }, [onGameStart]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Find a match
  const findMatch = useCallback(async (mode: 'ranked' | 'casual') => {
    if (!user?.id) {
      setError('Please sign in to play multiplayer');
      return;
    }

    setError(null);
    setStatus('searching');

    // Create abort controller for cancellation
    searchAbortRef.current = new AbortController();

    try {
      const response = await fetch('/api/multiplayer/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId,
          mode,
        }),
        signal: searchAbortRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to find match');
      }

      const data = await response.json();
      setRoom(data.room);
      setPlayers(data.room.multiplayer_room_players || []);
      setGameState(data.room.game_state);

      // Find my player number
      const myPlayer = data.room.multiplayer_room_players?.find(
        (p: RoomPlayer) => p.user_id === user.id
      );
      setMyPlayerNumber(myPlayer?.player_number || null);

      // Set status based on room state
      if (data.room.status === 'playing') {
        setStatus('playing');
      } else {
        setStatus('waiting');
      }

      // Subscribe to room updates
      await subscribeToRoom(data.room.id);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('[useMultiplayer] Search cancelled');
        setStatus('idle');
        return;
      }
      console.error('[useMultiplayer] Find match error:', err);
      setError((err as Error).message);
      setStatus('idle');
    }
  }, [user?.id, gameId, subscribeToRoom]);

  // Create a private room
  const createPrivateRoom = useCallback(async (): Promise<string> => {
    if (!user?.id) {
      throw new Error('Please sign in to create a room');
    }

    setError(null);
    setStatus('searching');

    try {
      const response = await fetch('/api/multiplayer/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId,
          mode: '1v1-casual',
          isPrivate: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create room');
      }

      const data = await response.json();
      setRoom(data.room);

      // Add the creator as player 1 in the local players list
      // Include user info so PlayerCard can display the name
      const displayName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.user_metadata?.preferred_username
        || user.email?.split('@')[0]
        || 'Player';
      const creatorPlayer: RoomPlayer & { users?: Record<string, string> } = {
        room_id: data.room.id,
        user_id: user.id,
        player_number: 1,
        ready: false,
        disconnected: false,
        joined_at: new Date().toISOString(),
        disconnected_at: null,
        username: displayName,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url || undefined,
        users: {
          display_name: displayName,
          username: displayName,
          avatar_url: user.user_metadata?.avatar_url || '',
        },
      };
      setPlayers([creatorPlayer]);
      setMyPlayerNumber(1);
      setStatus('waiting');

      // Subscribe to room updates
      await subscribeToRoom(data.room.id);

      return data.roomCode;
    } catch (err) {
      console.error('[useMultiplayer] Create room error:', err);
      setError((err as Error).message);
      setStatus('idle');
      throw err;
    }
  }, [user?.id, gameId, subscribeToRoom]);

  // Join by code
  const joinByCode = useCallback(async (code: string) => {
    if (!user?.id) {
      setError('Please sign in to join a room');
      return;
    }

    setError(null);
    setStatus('searching');

    try {
      const response = await fetch('/api/multiplayer/join-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          roomCode: code,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join room');
      }

      const data = await response.json();
      setRoom(data.room);
      setPlayers(data.room.multiplayer_room_players || []);
      setMyPlayerNumber(data.playerNumber);
      setStatus('waiting');

      // Subscribe to room updates
      await subscribeToRoom(data.room.id);
    } catch (err) {
      console.error('[useMultiplayer] Join by code error:', err);
      setError((err as Error).message);
      setStatus('idle');
    }
  }, [user?.id, subscribeToRoom]);

  // Set ready status
  const setReady = useCallback(async (ready: boolean) => {
    if (!room?.id || !user?.id) return;

    try {
      // Optimistic update: update local player ready state immediately
      setPlayers(prev =>
        prev.map(p => p.player_number === myPlayerNumber ? { ...p, ready } : p)
      );

      if (ready) {
        setStatus('ready');
      } else {
        setStatus('waiting');
      }

      const response = await fetch(`/api/multiplayer/rooms/${room.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          actionType: 'ready',
          actionData: { ready },
        }),
      });

      if (!response.ok) {
        // Revert on failure
        setPlayers(prev =>
          prev.map(p => p.player_number === myPlayerNumber ? { ...p, ready: !ready } : p)
        );
        setStatus('waiting');
        const data = await response.json();
        throw new Error(data.error || 'Failed to set ready status');
      }

      // Check if the server started the game (all players ready)
      const data = await response.json();
      if (data.gameStarted) {
        console.log('[useMultiplayer] Game started via API response');
        setStatus('playing');
        onGameStart?.();
      } else if (ready) {
        // If we just set ready but game didn't start yet, poll for game start
        // (in case the other player sets ready and realtime doesn't fire)
        startGamePolling(room.id);
      }
    } catch (err) {
      console.error('[useMultiplayer] Set ready error:', err);
      setError((err as Error).message);
    }
  }, [room?.id, user?.id, myPlayerNumber, onGameStart]);

  // Send game action
  const sendAction = useCallback(async (type: ActionType, data: Record<string, unknown>) => {
    if (!room?.id || !user?.id) return;

    try {
      await fetch(`/api/multiplayer/rooms/${room.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          actionType: type,
          actionData: data,
        }),
      });
    } catch (err) {
      console.error('[useMultiplayer] Send action error:', err);
      setError((err as Error).message);
    }
  }, [room?.id, user?.id]);

  // Update game state
  const updateGameState = useCallback(async (state: GameState | Record<string, unknown>) => {
    if (!clientRef.current || !room?.id) return;

    try {
      await clientRef.current.updateGameState(state as Record<string, unknown>);
      setGameState(state as GameState);
    } catch (err) {
      console.error('[useMultiplayer] Update game state error:', err);
      setError((err as Error).message);
    }
  }, [room?.id]);

  // Surrender
  const surrender = useCallback(async () => {
    if (!room?.id || !user?.id) return;

    try {
      await fetch(`/api/multiplayer/rooms/${room.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          actionType: 'surrender',
          actionData: {},
        }),
      });
    } catch (err) {
      console.error('[useMultiplayer] Surrender error:', err);
      setError((err as Error).message);
    }
  }, [room?.id, user?.id]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (room?.id && user?.id) {
      try {
        await fetch(`/api/multiplayer/rooms/${room.id}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (err) {
        console.error('[useMultiplayer] Leave room error:', err);
      }
    }

    // Cleanup
    clientRef.current?.disconnect();
    setRoom(null);
    setPlayers([]);
    setGameState(null);
    setStatus('idle');
    setMyPlayerNumber(null);
    setIsConnected(false);
    setError(null);
  }, [room?.id, user?.id]);

  // Cancel search
  const cancelSearch = useCallback(() => {
    searchAbortRef.current?.abort();
    setStatus('idle');
  }, []);

  return {
    // State
    room,
    players,
    gameState,
    status,
    myPlayerNumber,
    isMyTurn,
    error,
    isSearching,
    isConnected,

    // Player info
    myStats,
    opponentStats,
    opponent,

    // Actions
    findMatch,
    createPrivateRoom,
    joinByCode,
    setReady,
    sendAction,
    updateGameState,
    surrender,
    leaveRoom,
    cancelSearch,
  };
}

export default useMultiplayer;
