/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'edge';

/**
 * GET /api/tournaments?gameId=X&status=registration
 * List tournaments with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query = supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (gameId) {
      query = query.eq('game_id', gameId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: tournaments, error } = await query;

    if (error) {
      console.error('[Tournaments API] Error fetching tournaments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tournaments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tournaments: tournaments || [],
      count: tournaments?.length || 0,
    });
  } catch (error) {
    console.error('[Tournaments API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tournaments
 * Create a new tournament
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gameId, name, maxPlayers, startsAt, prizePoints = 100 } = body;

    if (!userId || !gameId || !name || !maxPlayers) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, gameId, name, maxPlayers' },
        { status: 400 }
      );
    }

    if (![8, 16].includes(maxPlayers)) {
      return NextResponse.json(
        { error: 'maxPlayers must be 8 or 16' },
        { status: 400 }
      );
    }

    // Get internal user ID
    let user = await supabase
      .from('users')
      .select('id, auth_user_id')
      .eq('auth_user_id', userId)
      .single()
      .then((res) => res.data);

    if (!user) {
      const { data: newUser } = await supabase
        .from('users')
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
        { error: 'Failed to get/create user' },
        { status: 500 }
      );
    }

    const internalUserId = user.id;

    // Create tournament
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .insert({
        game_id: gameId,
        name,
        status: 'registration',
        format: 'single_elimination',
        max_players: maxPlayers,
        current_players: 1,
        created_by: internalUserId,
        starts_at: startsAt || null,
        prize_points: prizePoints,
      })
      .select('id, name, game_id, status, max_players, current_players, prize_points, created_at')
      .single();

    if (tError || !tournament) {
      console.error('[Tournaments API] Error creating tournament:', tError);
      return NextResponse.json(
        { error: 'Failed to create tournament', details: String(tError) },
        { status: 500 }
      );
    }

    // Auto-join creator as participant with seed 1
    const { error: pError } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournament.id,
        user_id: internalUserId,
        seed: 1,
      });

    if (pError) {
      console.error('[Tournaments API] Error joining creator:', pError);
    }

    console.log('[Tournaments API] Tournament created:', {
      id: tournament.id,
      name,
      gameId,
      maxPlayers,
    });

    return NextResponse.json({
      success: true,
      tournament,
    });
  } catch (error) {
    console.error('[Tournaments API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
