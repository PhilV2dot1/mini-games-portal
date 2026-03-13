import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { XP_REWARDS } from '@/lib/levels/levels';

export const runtime = 'edge';

/**
 * GET /api/user/onboarding?userId=<uuid>
 * Returns whether the user has completed onboarding.
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
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ onboardingCompleted: false });
    }

    return NextResponse.json({ onboardingCompleted: data.onboarding_completed ?? false });
  } catch (err) {
    console.error('[Onboarding GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/onboarding
 * Body: { userId }
 *
 * Marks onboarding as completed and awards 50 XP (idempotent).
 * Returns { alreadyCompleted, xpAwarded }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json() as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if already completed
    const { data: user } = await supabase
      .from('users')
      .select('onboarding_completed, xp')
      .eq('id', userId)
      .maybeSingle();

    if (user?.onboarding_completed) {
      return NextResponse.json({ alreadyCompleted: true, xpAwarded: 0 });
    }

    const xpAmount = XP_REWARDS.onboarding;

    // Mark completed + award XP atomically
    const [, xpResult] = await Promise.all([
      supabase
        .from('users')
        .update({ onboarding_completed: true, xp: (user?.xp ?? 0) + xpAmount })
        .eq('id', userId),
      supabase
        .from('xp_log')
        .insert({ user_id: userId, amount: xpAmount, reason: 'onboarding' }),
    ]);

    if (xpResult.error) {
      console.error('[Onboarding POST] XP log error:', xpResult.error);
    }

    return NextResponse.json({ alreadyCompleted: false, xpAwarded: xpAmount });
  } catch (err) {
    console.error('[Onboarding POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
