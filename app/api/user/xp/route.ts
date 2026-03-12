import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { XP_REWARDS, XpReason, getPlayerLevel } from '@/lib/levels/levels';

export const runtime = 'edge';

/**
 * POST /api/user/xp
 * Body: { userId, reason: XpReason, gameId? }
 *
 * Awards XP to a user, logs it, and returns new XP total + level.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, reason, gameId } = await request.json() as {
      userId: string;
      reason: XpReason;
      gameId?: string;
    };

    if (!userId || !reason) {
      return NextResponse.json({ error: 'userId and reason are required' }, { status: 400 });
    }

    if (!(reason in XP_REWARDS)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    const amount = XP_REWARDS[reason];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Increment XP on user row
    const { data: user, error: updateError } = await supabase
      .rpc('increment_user_xp', { p_user_id: userId, p_amount: amount });

    if (updateError) {
      console.error('[XP] RPC error:', updateError);
      // Fallback: manual increment
      const { data: currentUser } = await supabase
        .from('users')
        .select('xp')
        .eq('id', userId)
        .maybeSingle();

      const newXp = (currentUser?.xp ?? 0) + amount;
      const { error: manualError } = await supabase
        .from('users')
        .update({ xp: newXp })
        .eq('id', userId);

      if (manualError) {
        return NextResponse.json({ error: manualError.message }, { status: 500 });
      }

      // Log XP
      await supabase.from('xp_log').insert({ user_id: userId, amount, reason, game_id: gameId ?? null });

      const level = getPlayerLevel(newXp);
      return NextResponse.json({ xp: newXp, amount, level: level.level, levelName: level.name });
    }

    // Log XP
    await supabase.from('xp_log').insert({ user_id: userId, amount, reason, game_id: gameId ?? null });

    const newXp = typeof user === 'number' ? user : (user as { xp: number })?.xp ?? 0;
    const level = getPlayerLevel(newXp);

    return NextResponse.json({ xp: newXp, amount, level: level.level, levelName: level.name });
  } catch (err) {
    console.error('[XP] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/user/xp?userId=<uuid>
 * Returns current XP and level.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'User not found' }, { status: 404 });
    }

    const xp = data.xp ?? 0;
    const level = getPlayerLevel(xp);

    return NextResponse.json({ xp, level: level.level, levelName: level.name });
  } catch (err) {
    console.error('[XP GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
