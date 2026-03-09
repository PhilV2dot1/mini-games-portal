/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createMatchmaker } from '@/lib/multiplayer/matchmaking';

export const runtime = 'edge';


interface RouteParams {
  params: Promise<{ roomId: string }>;
}

interface JoinRequest {
  userId: string;
}

/**
 * POST /api/multiplayer/rooms/[roomId]/join
 * Join an existing room
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { roomId } = await params;
    const body: JoinRequest = await request.json();
    const { userId } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'roomId and userId are required' },
        { status: 400 }
      );
    }

    // Verify user exists (userId is the Supabase Auth ID)
    const { data: user } = await supabase
      .from('users')
      .select('id, auth_user_id')
      .eq('auth_user_id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please make sure you have a profile created.' },
        { status: 404 }
      );
    }

    // Use the users table ID for multiplayer operations
    const internalUserId = user.id;

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

    // Check room status
    if (room.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Room is not available for joining' },
        { status: 400 }
      );
    }

    // Check if room is full
    if (room.current_players >= room.max_players) {
      return NextResponse.json(
        { error: 'Room is full' },
        { status: 400 }
      );
    }

    // Check if user is already in the room
    const { data: existingPlayer } = await supabase
      .from('multiplayer_room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', internalUserId)
      .single();

    if (existingPlayer) {
      // User is already in the room
      if (existingPlayer.disconnected) {
        // Reconnect
        const { data: reconnected } = await supabase
          .from('multiplayer_room_players')
          .update({ disconnected: false, disconnected_at: null })
          .eq('room_id', roomId)
          .eq('user_id', internalUserId)
          .select()
          .single();

        return NextResponse.json({
          success: true,
          player: reconnected,
          playerNumber: reconnected?.player_number,
          reconnected: true,
        });
      }

      return NextResponse.json(
        { error: 'You are already in this room' },
        { status: 400 }
      );
    }

    // Join room
    const matchmaker = createMatchmaker(internalUserId);
    const player = await matchmaker.joinRoom(roomId);

    console.log('[Multiplayer API] Player joined room:', {
      roomId,
      userId: internalUserId,
      playerNumber: player.player_number,
    });

    // Notify the room host that a player joined (non-blocking)
    try {
      const hostUserId = room.created_by;
      if (hostUserId && hostUserId !== internalUserId) {
        const { data: joiningUser } = await supabase
          .from('users')
          .select('display_name, username')
          .eq('id', internalUserId)
          .single();

        const playerName =
          joiningUser?.display_name || joiningUser?.username || 'A player';
        const gameLabel = (room.game_id as string)
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());

        await fetch(`${process.env.NEXT_PUBLIC_URL}/api/push/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: hostUserId,
            title: `${playerName} joined your game!`,
            body: `${gameLabel} · Room ${(roomId as string).slice(0, 6).toUpperCase()}`,
            url: `/games/${room.game_id}?room=${roomId}`,
            icon: `/icons/${room.game_id}.png`,
          }),
        });
      }
    } catch (notifyErr) {
      console.warn('[Multiplayer API] Push notify failed:', notifyErr);
    }

    return NextResponse.json({
      success: true,
      player,
      playerNumber: player.player_number,
      reconnected: false,
    });
  } catch (error) {
    console.error('[Multiplayer API] Error joining room:', error);
    return NextResponse.json(
      { error: 'Failed to join room', details: String(error) },
      { status: 500 }
    );
  }
}
