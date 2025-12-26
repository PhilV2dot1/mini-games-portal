/**
 * GET /api/user/stats
 *
 * Get user statistics for charts and analytics
 * Returns win rates, points progress, and activity timeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    // Get user ID from query params
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch win rate by game
    const { data: winRates, error: winRatesError } = await (supabase
      .rpc('get_user_win_rate_by_game', {
        p_user_id: userId,
      } as never) as unknown as Promise<{ data: unknown; error: unknown }>);

    if (winRatesError) {
      console.error('Error fetching win rates:', winRatesError);
    }

    // Fetch points progress
    const { data: pointsProgress, error: pointsError } = await (supabase
      .rpc('get_user_points_progress', {
        p_user_id: userId,
        p_days: days,
      } as never) as unknown as Promise<{ data: unknown; error: unknown }>);

    if (pointsError) {
      console.error('Error fetching points progress:', pointsError);
    }

    // Fetch activity timeline
    const { data: activityTimeline, error: activityError } = await (supabase
      .rpc('get_user_activity_timeline', {
        p_user_id: userId,
        p_limit: 20,
      } as never) as unknown as Promise<{ data: unknown; error: unknown }>);

    if (activityError) {
      console.error('Error fetching activity timeline:', activityError);
    }

    return NextResponse.json({
      winRates: winRates || [],
      pointsProgress: pointsProgress || [],
      activityTimeline: activityTimeline || [],
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
