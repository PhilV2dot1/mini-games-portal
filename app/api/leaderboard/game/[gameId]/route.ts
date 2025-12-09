import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { GameId } from '@/lib/types';

export const runtime = 'edge';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  fid: number | null;
  game_points: number;
  games_played: number;
  wins: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: GameId } }
) {
  try {
    const gameId = params.gameId;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');

    // Call the get_game_leaderboard function
    const { data: leaderboard, error } = await supabase
      .rpc('get_game_leaderboard', {
        p_game_id: gameId,
        p_limit: limit,
      });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch game leaderboard', details: error },
        { status: 500 }
      );
    }

    // Format response
    const formattedLeaderboard = (leaderboard as LeaderboardEntry[]).map((entry) => ({
      rank: entry.rank,
      userId: entry.user_id,
      username: entry.username || `Player ${entry.fid || 'Unknown'}`,
      fid: entry.fid,
      gamePoints: entry.game_points,
      gamesPlayed: entry.games_played,
      wins: entry.wins,
    }));

    return NextResponse.json({
      gameId,
      leaderboard: formattedLeaderboard,
      count: formattedLeaderboard.length,
    });
  } catch (error) {
    console.error('Error fetching game leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
