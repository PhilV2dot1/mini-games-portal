import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * POST /api/daily-challenge/complete
 *
 * Two modes:
 *
 * A) Game-event mode (called automatically from useLocalStats after each game):
 *    Body: { userId, gameId, result: 'win'|'lose'|'draw', pointsEarned? }
 *    → Looks up today's challenge, increments progress if game matches, awards bonus.
 *
 * B) Explicit mode (called from useDailyChallenge hook with full details):
 *    Body: { userId, challengeId, progress, completed }
 *    → Directly upserts the given progress.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const today = new Date().toISOString().split('T')[0];

    // ── Mode A: game-event (gameId + result provided) ────────────
    if (body.gameId !== undefined) {
      const { gameId, result, pointsEarned = 0 } = body;

      // Get today's scheduled challenge
      const { data: scheduleData } = await supabaseAdmin
        .from('daily_challenge_schedule')
        .select('challenge_id, daily_challenges(id, game_id, metric, target, bonus_points)')
        .eq('challenge_date', today)
        .maybeSingle();

      if (!scheduleData) {
        // No challenge scheduled today (shouldn't happen after migration runs)
        return NextResponse.json({ success: true, pointsAwarded: 0, newlyCompleted: false });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const challengeDef = (scheduleData as any).daily_challenges;
      if (!challengeDef || challengeDef.game_id !== gameId) {
        // Today's challenge is for a different game — no progress
        return NextResponse.json({ success: true, pointsAwarded: 0, newlyCompleted: false });
      }

      const challengeId: string = challengeDef.id;
      const metric: string = challengeDef.metric;
      const target: number = challengeDef.target;
      const bonusPoints: number = challengeDef.bonus_points;

      // Determine how much this game contributes
      let increment = 0;
      if (metric === 'wins' && result === 'win') increment = 1;
      else if (metric === 'games_played') increment = 1;
      else if (metric === 'points') increment = pointsEarned;

      if (increment === 0) {
        return NextResponse.json({ success: true, pointsAwarded: 0, newlyCompleted: false });
      }

      // Fetch existing progress
      const { data: existing } = await supabaseAdmin
        .from('user_daily_progress')
        .select('progress, completed, rewarded')
        .eq('user_id', userId)
        .eq('challenge_date', today)
        .maybeSingle();

      if (existing?.rewarded) {
        return NextResponse.json({ success: true, pointsAwarded: 0, newlyCompleted: false });
      }

      const currentProgress = existing?.progress ?? 0;
      const wasCompleted = existing?.completed ?? false;
      const newProgress = Math.min(currentProgress + increment, target);
      const nowCompleted = newProgress >= target;
      const newlyCompleted = nowCompleted && !wasCompleted;

      await supabaseAdmin
        .from('user_daily_progress')
        .upsert({
          user_id: userId,
          challenge_date: today,
          challenge_id: challengeId,
          progress: newProgress,
          completed: nowCompleted,
          completed_at: newlyCompleted ? new Date().toISOString() : (existing?.completed ? (existing as Record<string, unknown>).completed_at as string | null : null),
          rewarded: false,
        } as never, { onConflict: 'user_id,challenge_date' });

      if (newlyCompleted) {
        // Award bonus points — direct increment
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('total_points')
          .eq('id', userId)
          .single<{ total_points: number }>();

        if (userData) {
          await supabaseAdmin
            .from('users')
            .update({ total_points: (userData.total_points || 0) + bonusPoints })
            .eq('id', userId);
        }

        await supabaseAdmin
          .from('user_daily_progress')
          .update({ rewarded: true })
          .eq('user_id', userId)
          .eq('challenge_date', today);

        return NextResponse.json({ success: true, pointsAwarded: bonusPoints, newlyCompleted: true, progress: newProgress, target });
      }

      return NextResponse.json({ success: true, pointsAwarded: 0, newlyCompleted: false, progress: newProgress, target });
    }

    // ── Mode B: explicit (challengeId + progress provided) ──────
    const { challengeId, progress, completed } = body;

    if (!challengeId || progress === undefined) {
      return NextResponse.json({ error: 'challengeId and progress required' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('user_daily_progress')
      .select('completed, rewarded')
      .eq('user_id', userId)
      .eq('challenge_date', today)
      .eq('challenge_id', challengeId)
      .maybeSingle();

    const alreadyRewarded = existing?.rewarded ?? false;
    const wasCompleted = existing?.completed ?? false;
    const newlyCompleted = completed && !wasCompleted;

    await supabaseAdmin
      .from('user_daily_progress')
      .upsert({
        user_id: userId,
        challenge_date: today,
        challenge_id: challengeId,
        progress,
        completed: completed || wasCompleted,
        completed_at: newlyCompleted ? new Date().toISOString() : undefined,
        rewarded: alreadyRewarded,
      }, { onConflict: 'user_id,challenge_date' });

    if (newlyCompleted && !alreadyRewarded) {
      const { data: challengeData } = await supabaseAdmin
        .from('daily_challenges')
        .select('bonus_points')
        .eq('id', challengeId)
        .single();

      const bonusPoints = challengeData?.bonus_points ?? 100;

      // Award bonus points — direct increment
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('total_points')
        .eq('id', userId)
        .single<{ total_points: number }>();

      if (userData) {
        await supabaseAdmin
          .from('users')
          .update({ total_points: (userData.total_points || 0) + bonusPoints })
          .eq('id', userId);
      }

      await supabaseAdmin
        .from('user_daily_progress')
        .update({ rewarded: true })
        .eq('user_id', userId)
        .eq('challenge_date', today);

      return NextResponse.json({ success: true, pointsAwarded: bonusPoints, newlyCompleted: true });
    }

    return NextResponse.json({ success: true, pointsAwarded: 0, newlyCompleted: false });
  } catch (err) {
    console.error('[DailyChallenge complete] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
