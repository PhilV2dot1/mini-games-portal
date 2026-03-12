import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * POST /api/login-streak
 * Body: { userId }
 *
 * Records a daily login, updates the streak, and awards bonus points.
 * Safe to call multiple times per day — the SQL function returns early if already recorded today.
 *
 * Response: { currentStreak, bestStreak, bonusPoints, isNewDay }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin.rpc as any)('record_daily_login', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[LoginStreak] RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = data?.[0];
    if (!row) {
      return NextResponse.json({ error: 'No data returned' }, { status: 500 });
    }

    return NextResponse.json({
      currentStreak: row.current_streak,
      bestStreak: row.best_streak,
      bonusPoints: row.bonus_points,
      isNewDay: row.is_new_day,
    });
  } catch (err) {
    console.error('[LoginStreak] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/login-streak?userId=<uuid>
 * Returns current streak state without recording a new login.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data } = await supabaseAdmin
      .from('login_streaks')
      .select('current_streak, best_streak, last_login_date, total_login_days')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ currentStreak: 0, bestStreak: 0, totalLoginDays: 0 });
    }

    const today = new Date().toISOString().split('T')[0];
    const isActiveToday = data.last_login_date === today;

    return NextResponse.json({
      currentStreak: data.current_streak,
      bestStreak: data.best_streak,
      totalLoginDays: data.total_login_days,
      isActiveToday,
    });
  } catch (err) {
    console.error('[LoginStreak GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
