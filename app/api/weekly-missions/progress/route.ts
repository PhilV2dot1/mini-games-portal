import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * POST /api/weekly-missions/progress
 * Body: { userId, missionId, newProgress }
 *
 * Updates progress for a specific mission.
 * Awards XP automatically if newly completed (via SQL function).
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, missionId, newProgress } = await request.json() as {
      userId: string;
      missionId: string;
      newProgress: number;
    };

    if (!userId || !missionId || newProgress == null) {
      return NextResponse.json({ error: 'userId, missionId, newProgress required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('update_weekly_mission_progress', {
      p_user_id: userId,
      p_mission_id: missionId,
      p_new_progress: newProgress,
    });

    if (error) {
      console.error('[WeeklyMissions POST] RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = data?.[0];
    return NextResponse.json({
      newlyCompleted: row?.newly_completed ?? false,
      xpAwarded: row?.xp_reward ?? 0,
    });
  } catch (err) {
    console.error('[WeeklyMissions POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
