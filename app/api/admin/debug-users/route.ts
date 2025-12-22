import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * GET /api/admin/debug-users
 *
 * Debug endpoint to inspect user data and diagnose leaderboard issues
 * Returns detailed information about users and their stats
 */
export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get all users with their stats
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, username, wallet_address, total_points, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError },
        { status: 500 }
      );
    }

    // For each user, get their game sessions count
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { data: sessions } = await supabaseAdmin
          .from('game_sessions')
          .select('id, game_id, mode, result, points_earned, played_at')
          .eq('user_id', user.id);

        const { data: badges } = await supabaseAdmin
          .from('user_badges')
          .select('badge_id, earned_at')
          .eq('user_id', user.id);

        return {
          ...user,
          sessions_count: sessions?.length || 0,
          badges_count: badges?.length || 0,
          recent_sessions: sessions?.slice(0, 3) || [],
        };
      })
    );

    // Get leaderboard materialized view data for comparison
    const { data: leaderboard } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(10);

    return NextResponse.json({
      users: usersWithStats,
      leaderboard_view: leaderboard,
      summary: {
        total_users: users?.length || 0,
        users_with_990_points: usersWithStats.filter(u => u.total_points === 990).length,
        users_with_sessions: usersWithStats.filter(u => u.sessions_count > 0).length,
        users_with_no_sessions: usersWithStats.filter(u => u.sessions_count === 0).length,
      },
    });
  } catch (error) {
    console.error('Error debugging users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
