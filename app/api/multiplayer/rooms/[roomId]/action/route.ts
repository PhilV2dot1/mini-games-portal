/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { ActionType } from '@/lib/multiplayer/types';

export const runtime = 'edge';


interface RouteParams {
  params: Promise<{ roomId: string }>;
}

interface ActionRequest {
  userId: string;
  actionType: ActionType;
  actionData: Record<string, unknown>;
}

// Valid action types
const VALID_ACTION_TYPES: ActionType[] = [
  'move',
  'chat',
  'ready',
  'surrender',
  'offer_draw',
  'accept_draw',
  'decline_draw',
  'timeout',
];

/**
 * POST /api/multiplayer/rooms/[roomId]/action
 * Send a game action
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { roomId } = await params;
    const body: ActionRequest = await request.json();
    const { userId, actionType, actionData } = body;

    // Validate required fields
    if (!roomId || !userId || !actionType) {
      return NextResponse.json(
        { error: 'roomId, userId, and actionType are required' },
        { status: 400 }
      );
    }

    // Validate action type
    if (!VALID_ACTION_TYPES.includes(actionType)) {
      return NextResponse.json(
        { error: `Invalid actionType. Must be one of: ${VALID_ACTION_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Get internal user ID from auth ID
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    const internalUserId = userRecord.id;

    // Get room
    const { data: room, error: roomError } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Verify user is in the room
    const { data: player, error: playerError } = await supabase
      .from('multiplayer_room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', internalUserId)
      .eq('disconnected', false)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'You are not in this room' },
        { status: 403 }
      );
    }

    // Validate action based on room status
    if (actionType === 'ready' && room.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Cannot set ready status after game has started' },
        { status: 400 }
      );
    }

    if (['move', 'surrender', 'offer_draw', 'accept_draw', 'decline_draw'].includes(actionType)) {
      if (room.status !== 'playing') {
        return NextResponse.json(
          { error: 'Game is not in progress' },
          { status: 400 }
        );
      }
    }

    // Handle ready action
    let gameStarted = false;
    if (actionType === 'ready') {
      const { error: readyError } = await supabase
        .from('multiplayer_room_players')
        .update({ ready: actionData?.ready ?? true })
        .eq('room_id', roomId)
        .eq('user_id', internalUserId);

      if (readyError) {
        return NextResponse.json(
          { error: 'Failed to update ready status', details: readyError },
          { status: 500 }
        );
      }

      // Check if all players are ready -> start the game automatically
      if (actionData?.ready !== false) {
        const { data: allPlayers } = await supabase
          .from('multiplayer_room_players')
          .select('ready')
          .eq('room_id', roomId)
          .eq('disconnected', false);

        const maxPlayers = room.max_players || 2;
        const allReady = allPlayers
          && allPlayers.length >= maxPlayers
          && allPlayers.every((p: any) => p.ready);

        if (allReady) {
          console.log('[Multiplayer API] All players ready, starting game:', roomId);

          const initialGameState = {
            currentTurn: 1,
            startedAt: new Date().toISOString(),
          };

          await supabase
            .from('multiplayer_rooms')
            .update({
              status: 'playing',
              game_state: initialGameState,
              started_at: new Date().toISOString(),
            })
            .eq('id', roomId);

          gameStarted = true;
        }
      }
    }

    // Insert action
    const { data: action, error: actionError } = await supabase
      .from('multiplayer_actions')
      .insert({
        room_id: roomId,
        user_id: internalUserId,
        action_type: actionType,
        action_data: actionData || {},
      })
      .select()
      .single();

    if (actionError) {
      console.error('[Multiplayer API] Error creating action:', actionError);
      return NextResponse.json(
        { error: 'Failed to send action', details: actionError },
        { status: 500 }
      );
    }

    // Handle special actions
    if (actionType === 'surrender') {
      // Get opponent
      const { data: opponent } = await supabase
        .from('multiplayer_room_players')
        .select('user_id')
        .eq('room_id', roomId)
        .neq('user_id', userId)
        .eq('disconnected', false)
        .single();

      // End game with opponent as winner
      await supabase
        .from('multiplayer_rooms')
        .update({
          status: 'finished',
          finished_at: new Date().toISOString(),
          winner_id: opponent?.user_id || null,
        })
        .eq('id', roomId);
    }

    console.log('[Multiplayer API] Action recorded:', {
      roomId,
      actionId: action.id,
      actionType,
      userId,
    });

    return NextResponse.json({
      success: true,
      action,
      gameStarted,
    });
  } catch (error) {
    console.error('[Multiplayer API] Error sending action:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/multiplayer/rooms/[roomId]/action
 * Get actions for a room
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // ISO timestamp
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('multiplayer_actions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (since) {
      query = query.gt('created_at', since);
    }

    const { data: actions, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch actions', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      actions: actions || [],
    });
  } catch (error) {
    console.error('[Multiplayer API] Error fetching actions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
