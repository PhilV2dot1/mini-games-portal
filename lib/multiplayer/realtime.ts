/**
 * Multiplayer Realtime Client
 * Handles WebSocket subscriptions for real-time game updates
 */

import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
  RoomCallbacks,
  MultiplayerRoom,
  RoomPlayer,
  GameAction,
} from './types';

export class MultiplayerRealtimeClient {
  private channel: RealtimeChannel | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;
  private callbacks: Partial<RoomCallbacks> = {};
  private isConnected: boolean = false;

  /**
   * Subscribe to a room's real-time updates
   */
  async subscribeToRoom(
    roomId: string,
    userId: string,
    callbacks: RoomCallbacks
  ): Promise<void> {
    // Clean up existing subscription
    if (this.channel) {
      await this.disconnect();
    }

    this.roomId = roomId;
    this.userId = userId;
    this.callbacks = callbacks;

    try {
      this.channel = supabase
        .channel(`room:${roomId}`)
        // Listen for new players joining
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'multiplayer_room_players',
            filter: `room_id=eq.${roomId}`,
          },
          (payload: RealtimePostgresChangesPayload<RoomPlayer>) => {
            if (payload.new && typeof payload.new === 'object') {
              this.callbacks.onPlayerJoin?.(payload.new as RoomPlayer);
            }
          }
        )
        // Listen for player updates (ready status, disconnect)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'multiplayer_room_players',
            filter: `room_id=eq.${roomId}`,
          },
          (payload: RealtimePostgresChangesPayload<RoomPlayer>) => {
            if (payload.new && typeof payload.new === 'object') {
              const player = payload.new as RoomPlayer;
              const oldPlayer = payload.old as Partial<RoomPlayer>;

              // Check if ready status changed
              if (oldPlayer.ready !== player.ready) {
                this.callbacks.onPlayerReady?.(player.user_id, player.ready, player.player_number);
              }

              // Check if player disconnected
              if (!oldPlayer.disconnected && player.disconnected) {
                this.callbacks.onPlayerLeave?.(player.user_id);
              }
            }
          }
        )
        // Listen for player removal
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'multiplayer_room_players',
            filter: `room_id=eq.${roomId}`,
          },
          (payload: RealtimePostgresChangesPayload<RoomPlayer>) => {
            if (payload.old && typeof payload.old === 'object') {
              const oldPlayer = payload.old as RoomPlayer;
              this.callbacks.onPlayerLeave?.(oldPlayer.user_id);
            }
          }
        )
        // Listen for room updates (status changes, game state)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'multiplayer_rooms',
            filter: `id=eq.${roomId}`,
          },
          (payload: RealtimePostgresChangesPayload<MultiplayerRoom>) => {
            if (payload.new && typeof payload.new === 'object') {
              const room = payload.new as MultiplayerRoom;

              // Check if game started (don't rely on oldRoom.status - Supabase may not include it)
              if (room.status === 'playing') {
                this.callbacks.onGameStart?.();
              }

              // Check if game ended
              if (room.status === 'finished') {
                // Determine end reason based on game state
                const reason = room.winner_id ? 'win' : 'draw';
                this.callbacks.onGameEnd?.(room.winner_id, reason);
              }

              // Always update game state
              if (room.game_state) {
                this.callbacks.onGameStateUpdate?.(room.game_state);
              }
            }
          }
        )
        // Listen for game actions
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'multiplayer_actions',
            filter: `room_id=eq.${roomId}`,
          },
          (payload: RealtimePostgresChangesPayload<GameAction>) => {
            if (payload.new && typeof payload.new === 'object') {
              const action = payload.new as GameAction;
              // Don't notify about our own actions
              if (action.user_id !== this.userId) {
                this.callbacks.onAction?.(action);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            console.log(`[Multiplayer] Connected to room ${roomId}`);
          } else if (status === 'CHANNEL_ERROR') {
            this.isConnected = false;
            this.callbacks.onError?.(new Error('Failed to connect to room'));
          }
        });
    } catch (error) {
      console.error('[Multiplayer] Subscription error:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Send a game action
   */
  async sendAction(
    actionType: string,
    actionData: Record<string, unknown>
  ): Promise<void> {
    if (!this.roomId || !this.userId) {
      throw new Error('Not connected to a room');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('multiplayer_actions') as any).insert({
      room_id: this.roomId,
      user_id: this.userId,
      action_type: actionType,
      action_data: actionData,
    });

    if (error) {
      console.error('[Multiplayer] Failed to send action:', error);
      throw error;
    }
  }

  /**
   * Update game state (typically called by the player whose turn it is)
   */
  async updateGameState(gameState: Record<string, unknown>): Promise<void> {
    if (!this.roomId) {
      throw new Error('Not connected to a room');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('multiplayer_rooms') as any)
      .update({ game_state: gameState })
      .eq('id', this.roomId);

    if (error) {
      console.error('[Multiplayer] Failed to update game state:', error);
      throw error;
    }
  }

  /**
   * Set ready status
   */
  async setReady(ready: boolean): Promise<void> {
    if (!this.roomId || !this.userId) {
      throw new Error('Not connected to a room');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('multiplayer_room_players') as any)
      .update({ ready })
      .eq('room_id', this.roomId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('[Multiplayer] Failed to set ready status:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the room
   */
  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }

    this.roomId = null;
    this.userId = null;
    this.callbacks = {};
    this.isConnected = false;

    console.log('[Multiplayer] Disconnected');
  }

  /**
   * Check if connected to a room
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current room ID
   */
  get currentRoomId(): string | null {
    return this.roomId;
  }
}

// Singleton instance for global access
let realtimeClientInstance: MultiplayerRealtimeClient | null = null;

export function getRealtimeClient(): MultiplayerRealtimeClient {
  if (!realtimeClientInstance) {
    realtimeClientInstance = new MultiplayerRealtimeClient();
  }
  return realtimeClientInstance;
}

// Export default instance
export const realtimeClient = getRealtimeClient();
