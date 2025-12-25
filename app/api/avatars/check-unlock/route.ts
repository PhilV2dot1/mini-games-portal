import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/avatars/check-unlock
 *
 * Check if user can upload custom avatar
 * Requires: 100 games played OR Veteran badge
 */

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or headers
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if avatar is already unlocked
    // Try auth_user_id first (for OAuth users), then fall back to id
    const { data: user, error: userError } = (await supabase
      .from('users')
      .select('id, avatar_unlocked')
      .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .maybeSingle()) as { data: any; error: any };

    if (userError || !user) {
      console.error('[Avatar Check] User not found:', { userId, error: userError });
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Use the actual database ID for subsequent queries
    const actualUserId = user.id;

    // If already unlocked, return true
    if (user.avatar_unlocked) {
      return NextResponse.json({
        unlocked: true,
        reason: 'already_unlocked',
        message: 'Avatar personnalisé déjà débloqué',
      });
    }

    // Check via database function
    const { data: canUnlock, error: checkError } = (await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .rpc('can_unlock_custom_avatar', { p_user_id: actualUserId })) as { data: boolean; error: any };

    if (checkError) {
      console.error('Error checking avatar unlock:', checkError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification' },
        { status: 500 }
      );
    }

    // If can unlock, auto-unlock it
    if (canUnlock) {
      await supabase
        .from('users')
        .update({ avatar_unlocked: true })
        .eq('id', actualUserId);
    }

    // Get progress info
    const { data: gamesCount } = (await supabase
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('user_id', actualUserId)) as { data: any; count: number | null };

    const { data: badges } = (await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', actualUserId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('badge_id', 'veteran')) as { data: any[] | null; error: any };

    const hasVeteranBadge = badges && badges.length > 0;

    return NextResponse.json({
      unlocked: canUnlock || false,
      reason: canUnlock
        ? hasVeteranBadge
          ? 'veteran_badge'
          : '100_games'
        : 'not_eligible',
      message: canUnlock
        ? 'Avatar personnalisé débloqué !'
        : `Jouez ${100 - (gamesCount || 0)} partie(s) de plus pour débloquer`,
      progress: {
        gamesPlayed: gamesCount || 0,
        gamesRequired: 100,
        hasVeteranBadge,
      },
    });
  } catch (error) {
    console.error('Error checking avatar unlock:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
