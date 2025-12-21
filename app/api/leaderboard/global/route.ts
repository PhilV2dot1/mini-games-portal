import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch from materialized view
    const { data: leaderboard, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .range(offset, offset + limit - 1);

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
      fid: entry.fid,
      totalPoints: entry.total_points,
      gamesPlayed: entry.games_played,
      wins: entry.wins,
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
