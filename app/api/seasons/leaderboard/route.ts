import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * GET /api/seasons/leaderboard?seasonId=<uuid>&limit=50
 * Returns top players for the given season (defaults to current active season).
 */
export async function GET(request: NextRequest) {
  try {
    const seasonId = request.nextUrl.searchParams.get('seasonId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // If no seasonId, fetch current active season first
    let resolvedSeasonId = seasonId;
    if (!resolvedSeasonId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: seasonData } = await (supabase.rpc as any)('get_current_season');
      resolvedSeasonId = seasonData?.[0]?.season_id ?? null;
    }

    if (!resolvedSeasonId) {
      return NextResponse.json({ leaderboard: [], season: null });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_season_leaderboard', {
      p_season_id: resolvedSeasonId,
      p_limit: limit,
    });

    if (error) {
      console.error('[SeasonLeaderboard GET] RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      leaderboard: data ?? [],
      seasonId: resolvedSeasonId,
    });
  } catch (err) {
    console.error('[SeasonLeaderboard GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
