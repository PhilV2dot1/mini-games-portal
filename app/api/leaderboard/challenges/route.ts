import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * GET /api/leaderboard/challenges?limit=50
 * Returns top players ranked by number of daily challenges completed.
 */
export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Aggregate in SQL: count completed challenges per user, join users, return top N
    const { data, error } = await supabaseAdmin.rpc('get_challenge_leaderboard', {
      p_limit: limit,
    } as never);

    if (error) {
      // Fallback: manual query if RPC not yet deployed
      const { data: rows, error: fallbackError } = await supabaseAdmin
        .from('user_daily_progress')
        .select('user_id, users!inner(username, display_name, avatar_type, avatar_url)')
        .eq('completed', true)
        .limit(limit * 20);

      if (fallbackError) {
        console.error('[ChallengeLeaderboard] Error:', fallbackError);
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      const counts: Record<string, { userId: string; username: string; displayName?: string; avatar_type?: string; avatar_url?: string; completed: number }> = {};
      for (const row of rows ?? []) {
        const u = (row as never as { users: { username: string; display_name?: string; avatar_type?: string; avatar_url?: string } }).users;
        if (!counts[row.user_id]) {
          counts[row.user_id] = { userId: row.user_id, username: u?.username ?? row.user_id.slice(0, 8), displayName: u?.display_name, avatar_type: u?.avatar_type ?? 'default', avatar_url: u?.avatar_url, completed: 0 };
        }
        counts[row.user_id].completed++;
      }
      const sorted = Object.values(counts).sort((a, b) => b.completed - a.completed).slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));
      return NextResponse.json({ leaderboard: sorted });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leaderboard = (data as any[]).map((row: any, i: number) => ({
      rank: i + 1,
      userId: row.user_id,
      username: row.username ?? row.user_id.slice(0, 8),
      displayName: row.display_name,
      avatar_type: row.avatar_type ?? 'default',
      avatar_url: row.avatar_url,
      completed: row.completed,
    }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error('[ChallengeLeaderboard] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
