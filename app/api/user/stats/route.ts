/**
 * GET /api/user/stats
 *
 * Get user statistics for charts and analytics
 * Returns win rates, points progress, activity timeline, streaks, and summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAny = supabase as any;

    const [
      { data: winRates, error: winRatesError },
      { data: pointsProgress, error: pointsError },
      { data: activityTimeline, error: activityError },
      { data: streaks, error: streaksError },
      { data: summaryRows, error: summaryError },
    ] = await Promise.all([
      supabaseAny.rpc('get_user_win_rate_by_game', { p_user_id: userId }),
      supabaseAny.rpc('get_user_points_progress', { p_user_id: userId, p_days: days }),
      supabaseAny.rpc('get_user_activity_timeline', { p_user_id: userId, p_limit: 20 }),
      supabaseAny.rpc('get_user_streaks', { p_user_id: userId }),
      supabaseAny.rpc('get_user_stats_summary', { p_user_id: userId }),
    ]);

    if (winRatesError) console.error('Error fetching win rates:', winRatesError);
    if (pointsError) console.error('Error fetching points progress:', pointsError);
    if (activityError) console.error('Error fetching activity timeline:', activityError);
    if (streaksError) console.error('Error fetching streaks:', streaksError);
    if (summaryError) console.error('Error fetching stats summary:', summaryError);

    const summary = Array.isArray(summaryRows) && summaryRows.length > 0
      ? summaryRows[0]
      : null;

    return NextResponse.json({
      winRates: winRates || [],
      pointsProgress: pointsProgress || [],
      activityTimeline: activityTimeline || [],
      streaks: streaks || [],
      summary,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
