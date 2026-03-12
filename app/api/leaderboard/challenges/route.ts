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

    // Count completed challenges per user, join with users table
    const { data, error } = await supabaseAdmin
      .from('user_daily_progress')
      .select(`
        user_id,
        users!inner(username, display_name, avatar_type, avatar_url)
      `)
      .eq('completed', true)
      .limit(500); // fetch a lot, we'll aggregate in JS

    if (error) {
      console.error('[ChallengeLeaderboard] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate: count completed challenges per user
    const counts: Record<string, { userId: string; username: string; displayName?: string; avatar_type?: string; avatar_url?: string; completed: number }> = {};

    for (const row of data ?? []) {
      const userId = row.user_id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (row as any).users;
      if (!counts[userId]) {
        counts[userId] = {
          userId,
          username: user?.username ?? userId.slice(0, 8),
          displayName: user?.display_name ?? undefined,
          avatar_type: user?.avatar_type ?? 'default',
          avatar_url: user?.avatar_url ?? undefined,
          completed: 0,
        };
      }
      counts[userId].completed++;
    }

    const sorted = Object.values(counts)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, limit)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    return NextResponse.json({ leaderboard: sorted });
  } catch (err) {
    console.error('[ChallengeLeaderboard] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
