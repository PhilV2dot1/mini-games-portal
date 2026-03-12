import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const chainParam = searchParams.get('chain');
    const chainId = chainParam ? parseInt(chainParam) : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let leaderboard: any[] | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let error: any = null;

    if (chainId !== null) {
      // Chain-filtered: use the RPC function
      const result = await supabase.rpc('get_global_leaderboard_by_chain', {
        p_chain_id: chainId,
        p_limit: limit,
        p_offset: offset,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      leaderboard = result.data;
      error = result.error;
    } else {
      // All chains: use the materialized view
      const result = await supabase
        .from('leaderboard')
        .select('*')
        .order('rank', { ascending: true })
        .range(offset, offset + limit - 1);
      leaderboard = result.data;
      error = result.error;
    }

    if (error || !leaderboard) {
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard', details: error },
        { status: 500 }
      );
    }

    // Format response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedLeaderboard = (leaderboard as any[]).map((entry: any) => ({
      rank: entry.rank,
      userId: entry.user_id,
      username: entry.username || `Player ${entry.fid || 'Unknown'}`,
      displayName: entry.display_name || entry.username || `Player ${entry.fid || 'Unknown'}`,
      fid: entry.fid,
      totalPoints: entry.total_points,
      xp: entry.xp ?? 0,
      gamesPlayed: entry.games_played,
      wins: entry.wins,
      theme_color: entry.theme_color || 'yellow',
      avatar_type: entry.avatar_type,
      avatar_url: entry.avatar_url,
    }));

    return NextResponse.json({
      leaderboard: formattedLeaderboard,
      count: leaderboard.length,
    });
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
