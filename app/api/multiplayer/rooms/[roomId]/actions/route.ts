/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'edge';

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

/**
 * GET /api/multiplayer/rooms/[roomId]/actions
 * Get all actions for a room (for replay system)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { roomId } = await params;

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Verify room exists
    const { data: room, error: roomError } = await supabase
      .from('multiplayer_rooms')
      .select('id, status, game_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Fetch all actions, ordered chronologically
    const { data: actions, error: actionsError } = await supabase
      .from('multiplayer_actions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (actionsError) {
      console.error('[Multiplayer API] Error fetching actions:', actionsError);
      return NextResponse.json(
        { error: 'Failed to fetch actions', details: actionsError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      actions: actions || [],
      count: actions?.length || 0,
      roomStatus: room.status,
    });
  } catch (error) {
    console.error('[Multiplayer API] Error fetching actions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
