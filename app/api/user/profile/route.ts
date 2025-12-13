import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    const userId = searchParams.get('id');

    // Normalize wallet address to lowercase for consistent querying
    const walletAddress = searchParams.get('wallet')?.toLowerCase();

    console.log('[Profile API] Query params:', { fid, walletAddress, userId });

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
      console.log('[Profile API] Searching by wallet:', walletAddress);
      query = query.eq('wallet_address', walletAddress);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: userError } = await query.maybeSingle<any>();

    if (userError || !user) {
      console.log('[Profile API] User not found:', { userError, hasUser: !!user });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[Profile API] User found:', user.id);

    // Fetch recent game sessions (last 50)
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*, games(name, icon)')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .limit(50) as { data: any[] | null; error: any };

    // Fetch earned badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', user.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .order('earned_at', { ascending: false }) as { data: any[] | null; error: any };

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

    // Calculate overall stats
    const gamesPlayed = sessions?.length || 0;
    const wins = sessions?.filter(s => s.result === 'win').length || 0;
    const losses = sessions?.filter(s => s.result === 'lose').length || 0;
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        fid: user.fid,
        username: user.username || `Player ${user.id.slice(0, 8)}`,
        wallet_address: user.wallet_address,
        total_points: user.total_points,
        created_at: user.created_at,
      },
      stats: {
        gamesPlayed,
        wins,
        losses,
        winRate,
      },
      recentSessions: sessions || [],
      badges: badges || [],
      gameStats,
      rank: leaderboardEntry?.rank || null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
