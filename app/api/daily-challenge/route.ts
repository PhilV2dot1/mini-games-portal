import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/**
 * GET /api/daily-challenge?userId=<uuid>
 * Returns today's challenge + user's progress (if userId provided).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const userId = request.nextUrl.searchParams.get('userId');

    if (userId) {
      // Return challenge + progress for this user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_user_daily_progress', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[DailyChallenge GET] RPC error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const row = data?.[0] ?? null;
      return NextResponse.json({ challenge: row });
    } else {
      // Return today's challenge without user progress
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_or_create_daily_challenge');

      if (error) {
        console.error('[DailyChallenge GET] RPC error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const row = data?.[0] ?? null;
      return NextResponse.json({ challenge: row });
    }
  } catch (err) {
    console.error('[DailyChallenge GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
