import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { calculateGamePoints } from '@/lib/utils/points';
import type { GameMode, GameId } from '@/lib/types';

export const runtime = 'edge';

interface SessionRequest {
  fid?: number;
  walletAddress?: string;
  gameId: GameId;
  mode: GameMode;
  result: 'win' | 'lose' | 'draw' | 'push';
  txHash?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SessionRequest = await request.json();
    const { fid, walletAddress, gameId, mode, result, txHash } = body;

    // Validate required fields
    if (!gameId || !mode || !result) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, mode, result' },
        { status: 400 }
      );
    }

    // Need either FID or wallet address to identify user
    if (!fid && !walletAddress) {
      return NextResponse.json(
        { error: 'Either fid or walletAddress is required' },
        { status: 400 }
      );
    }

    // Get or create user
    let userId: string;

    if (fid) {
      // Try to find user by FID
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('fid', fid)
        .maybeSingle<{ id: string }>();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user with FID
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            fid,
            wallet_address: walletAddress,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)
          .select('id')
          .single<{ id: string }>();

        if (createError || !newUser) {
          return NextResponse.json(
            { error: 'Failed to create user', details: createError },
            { status: 500 }
          );
        }

        userId = newUser.id;
      }
    } else {
      // Try to find user by wallet address
      // walletAddress is guaranteed to exist here due to validation at top
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress!)
        .maybeSingle<{ id: string }>();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user with wallet
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            wallet_address: walletAddress!,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)
          .select('id')
          .single<{ id: string }>();

        if (createError || !newUser) {
          return NextResponse.json(
            { error: 'Failed to create user', details: createError },
            { status: 500 }
          );
        }

        userId = newUser.id;
      }
    }

    // Calculate points earned
    const pointsEarned = calculateGamePoints(mode, result);

    // Insert game session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        game_id: gameId,
        mode,
        result,
        points_earned: pointsEarned,
        tx_hash: txHash,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select('*')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single<any>();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Failed to create game session', details: sessionError },
        { status: 500 }
      );
    }

    // Update user total points
    const { error: updateError } = await supabase.rpc('increment_user_points', {
      p_user_id: userId,
      p_points: pointsEarned,
    });

    // If the RPC doesn't exist yet, do manual update
    if (updateError) {
      const { data: userData } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', userId)
        .single();

      if (userData) {
        await supabase
          .from('users')
          .update({ total_points: userData.total_points + pointsEarned })
          .eq('id', userId);
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      pointsEarned,
      userId,
    });
  } catch (error) {
    console.error('Error recording game session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
