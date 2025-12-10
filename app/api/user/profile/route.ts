import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    const walletAddress = searchParams.get('wallet');
    const userId = searchParams.get('id');

    if (!fid && !walletAddress && !userId) {
      return NextResponse.json(
        { error: 'Either fid, wallet, or id is required' },
        { status: 400 }
      );
    }

    // Build query based on identifier
    let query = supabase.from('users').select('*');

    if (userId) {
      query = query.eq('id', userId);
    } else if (fid) {
      query = query.eq('fid', parseInt(fid));
    } else if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: userError } = await query.maybeSingle<any>();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch recent game sessions (last 50)
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*, games(name, icon)')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(50);

    // Fetch earned badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    // Fetch user rank from leaderboard
    const { data: leaderboardEntry } = await supabase
      .from('leaderboard')
      .select('rank')
      .eq('user_id', user.id)
      .maybeSingle<{ rank: number }>();

    // Calculate per-game stats
    interface GameStat {
      played: number;
      wins: number;
      points: number;
    }
    const gameStats: Record<string, GameStat> = {};
    if (sessions && !sessionsError) {
      sessions.forEach(session => {
        if (!gameStats[session.game_id]) {
          gameStats[session.game_id] = {
            played: 0,
            wins: 0,
            points: 0,
          };
        }
        gameStats[session.game_id].played++;
        if (session.result === 'win') {
          gameStats[session.game_id].wins++;
        }
        gameStats[session.game_id].points += session.points_earned;
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        fid: user.fid,
        username: user.username,
        walletAddress: user.wallet_address,
        totalPoints: user.total_points,
        rank: leaderboardEntry?.rank || null,
        createdAt: user.created_at,
      },
      sessions: sessions || [],
      badges: badges || [],
      gameStats,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
