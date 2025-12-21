import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * POST /api/leaderboard/refresh
 *
 * Manually refresh the leaderboard materialized view
 * Useful when data seems out of sync
 */
export async function POST() {
  try {
    // Use service role to refresh materialized view
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

    // Call the refresh_leaderboard RPC function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabaseAdmin.rpc('refresh_leaderboard' as any);

    if (error) {
      console.error('Error refreshing leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to refresh leaderboard', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Leaderboard materialized view refreshed successfully',
    });
  } catch (error) {
    console.error('Error refreshing leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
