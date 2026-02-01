/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createMatchmaker } from '@/lib/multiplayer/matchmaking';
import type { RoomMode } from '@/lib/multiplayer/types';

export const runtime = 'edge';


interface CreateRoomRequest {
  userId: string;
  gameId: string;
  mode: RoomMode;
  isPrivate?: boolean;
}

/**
 * POST /api/multiplayer/rooms
 * Create a new multiplayer room
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateRoomRequest = await request.json();
    const { userId, gameId, mode, isPrivate = false } = body;

    // Validate required fields
    if (!userId || !gameId || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, gameId, mode' },
        { status: 400 }
      );
    }

    // Validate mode
    const validModes: RoomMode[] = ['1v1-ranked', '1v1-casual', 'collaborative'];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be: 1v1-ranked, 1v1-casual, or collaborative' },
        { status: 400 }
      );
    }

    // Get or create user from auth ID
    let user = await (supabase
      .from('users') as any)
      .select('id, auth_user_id')
      .eq('auth_user_id', userId)
      .single()
      .then((res: any) => res.data);

    // If user doesn't exist, create them
    if (!user) {
      const { data: newUser } = await (supabase
        .from('users') as any)
        .insert({
          auth_user_id: userId,
          username: `Player_${userId.substring(0, 8)}`,
          auth_provider: 'oauth',
          is_anonymous: false,
          claimed_at: new Date().toISOString(),
          total_points: 0,
          avatar_type: 'default',
        })
        .select('id, auth_user_id')
        .single();

      user = newUser;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user profile.' },
        { status: 500 }
      );
    }

    // Use the users table ID for multiplayer operations
    const internalUserId = (user as any).id;

    // Create room using matchmaker
    const matchmaker = createMatchmaker(internalUserId);
    const room = await matchmaker.createRoom(gameId, mode, isPrivate);

    console.log('[Multiplayer API] Room created:', {
      roomId: room.id,
      gameId,
      mode,
      isPrivate,
      roomCode: room.room_code,
    });

    return NextResponse.json({
      success: true,
      room,
      roomCode: room.room_code,
    });
  } catch (error) {
    console.error('[Multiplayer API] Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room', details: String(error) },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ListRoomsQuery {
  gameId?: string;
  mode?: RoomMode;
  limit?: string;
}

/**
 * GET /api/multiplayer/rooms
 * List rooms for a game. Supports ?status=waiting (default) or ?status=playing (for spectating).
 * gameId is optional when status=playing (list all active games for spectating).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const mode = searchParams.get('mode') as RoomMode | null;
    const status = searchParams.get('status') || 'waiting';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // gameId is required for waiting rooms, optional for playing (spectate)
    if (status === 'waiting' && !gameId) {
      return NextResponse.json(
        { error: 'gameId query parameter is required for waiting rooms' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('multiplayer_rooms')
      .select(`
        *,
        multiplayer_room_players (
          user_id,
          player_number,
          ready,
          users (
            username,
            display_name,
            avatar_url,
            theme_color
          )
        )
      `)
      .eq('status', status)
      .is('room_code', null) // Only public rooms
      .order('created_at', { ascending: false })
      .limit(limit);

    if (gameId) {
      query = query.eq('game_id', gameId);
    }

    if (mode) {
      query = query.eq('mode', mode);
    }

    const { data: rooms, error } = await query;

    if (error) {
      console.error('[Multiplayer API] Error fetching rooms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rooms', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rooms: rooms || [],
      count: rooms?.length || 0,
    });
  } catch (error) {
    console.error('[Multiplayer API] Error listing rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
