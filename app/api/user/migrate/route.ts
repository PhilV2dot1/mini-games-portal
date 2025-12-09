import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { GameId, GameMode } from '@/lib/types';

export const runtime = 'edge';

interface LocalGameStats {
  played: number;
  wins: number;
  losses: number;
  totalPoints: number;
}

interface LocalStats {
  [gameId: string]: LocalGameStats;
}

interface MigrateRequest {
  fid?: number;
  walletAddress?: string;
  localStats: LocalStats;
  totalPoints: number;
  gamesPlayed: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: MigrateRequest = await request.json();
    const { fid, walletAddress, localStats, totalPoints, gamesPlayed } = body;

    // Validate required fields
    if (!localStats || !totalPoints) {
      return NextResponse.json(
        { error: 'Missing required fields: localStats, totalPoints' },
        { status: 400 }
      );
    }

    if (!fid && !walletAddress) {
      return NextResponse.json(
        { error: 'Either fid or walletAddress is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let existingUser = null;
    if (fid) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('fid', fid)
        .single();
      existingUser = data;
    } else if (walletAddress) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single();
      existingUser = data;
    }

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User already exists in database. Migration not needed.',
          userId: existingUser.id
        },
        { status: 400 }
      );
    }

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        fid,
        wallet_address: walletAddress,
        total_points: totalPoints,
      })
      .select('id')
      .single();

    if (createError || !newUser) {
      return NextResponse.json(
        { error: 'Failed to create user', details: createError },
        { status: 500 }
      );
    }

    const userId = newUser.id;

    // Create synthetic game sessions for each game
    const sessions = [];
    for (const [gameId, stats] of Object.entries(localStats)) {
      // Create sessions for wins
      for (let i = 0; i < stats.wins; i++) {
        sessions.push({
          user_id: userId,
          game_id: gameId,
          mode: 'free' as GameMode,
          result: 'win' as const,
          points_earned: Math.floor(stats.totalPoints / stats.played), // Distribute points
        });
      }

      // Create sessions for losses
      for (let i = 0; i < stats.losses; i++) {
        sessions.push({
          user_id: userId,
          game_id: gameId,
          mode: 'free' as GameMode,
          result: 'lose' as const,
          points_earned: 0,
        });
      }
    }

    // Insert all sessions
    if (sessions.length > 0) {
      const { error: sessionsError } = await supabase
        .from('game_sessions')
        .insert(sessions);

      if (sessionsError) {
        console.error('Error creating game sessions:', sessionsError);
        // Don't fail the migration if session creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      userId,
      sessionsMigrated: sessions.length,
      totalPoints,
    });
  } catch (error) {
    console.error('Error migrating user data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
