import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/claim-profile
 *
 * Link existing Supabase Auth account to wallet address or Farcaster ID.
 *
 * This endpoint allows authenticated users to:
 * 1. Link their wallet address to their account
 * 2. Link their Farcaster ID to their account
 * 3. Merge data from anonymous account if one exists
 */

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authUserId, walletAddress, fid } = body;

    if (!authUserId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    if (!walletAddress && !fid) {
      return NextResponse.json(
        { error: 'Adresse wallet ou FID requis' },
        { status: 400 }
      );
    }

    // Initialize Supabase with service role
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

    // Normalize wallet address
    const normalizedWallet = walletAddress?.toLowerCase();

    // Step 1: Find user's current record by auth_user_id
    const { data: currentUser, error: currentUserError } = (await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .maybeSingle()) as { data: any; error: any };

    if (currentUserError) {
      console.error('[Claim Profile] Error fetching user:', currentUserError);
      return NextResponse.json(
        { error: 'Utilisateur non trouvé', details: currentUserError.message },
        { status: 404 }
      );
    }

    if (!currentUser) {
      console.error('[Claim Profile] User not found with auth_user_id:', authUserId);
      return NextResponse.json(
        { error: 'Aucun profil trouvé pour cet utilisateur authentifié' },
        { status: 404 }
      );
    }

    // Step 2: Check if there's an existing user with this wallet/FID
    let existingUser = null;
    if (normalizedWallet || fid) {
      const query = supabase
        .from('users')
        .select('*');

      if (normalizedWallet) {
        query.eq('wallet_address', normalizedWallet);
      }
      if (fid) {
        query.eq('fid', fid);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = (await query.maybeSingle()) as { data: any };
      existingUser = data;
    }

    const linked: 'wallet' | 'fid' | 'both' = walletAddress && fid ? 'both' : walletAddress ? 'wallet' : 'fid';
    let merged = false;

    if (existingUser && existingUser.id !== currentUser?.id) {
      // There's a different user with this wallet/FID - merge data
      try {
        // Merge points
        const mergedPoints = (currentUser?.total_points || 0) + (existingUser.total_points || 0);

        // Update game sessions to point to the current user
        await supabase
          .from('game_sessions')
          .update({ user_id: currentUser?.id })
          .eq('user_id', existingUser.id);

        // Transfer badges
        const { data: existingBadges } = (await supabase
          .from('user_badges')
          .select('badge_id')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('user_id', existingUser.id)) as { data: any };

        if (existingBadges && existingBadges.length > 0) {
          // Get current user's badges
          const { data: currentBadges } = (await supabase
            .from('user_badges')
            .select('badge_id')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .eq('user_id', currentUser?.id)) as { data: any };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentBadgeIds = new Set(currentBadges?.map((b: any) => b.badge_id) || []);

          // Transfer badges that current user doesn't have
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const badgesToTransfer = existingBadges
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((b: any) => !currentBadgeIds.has(b.badge_id))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((b: any) => ({
              user_id: currentUser?.id,
              badge_id: b.badge_id,
            }));

          if (badgesToTransfer.length > 0) {
            await supabase.from('user_badges').insert(badgesToTransfer);
          }

          // Delete old badge records
          await supabase
            .from('user_badges')
            .delete()
            .eq('user_id', existingUser.id);
        }

        // Update current user with merged data and new wallet/FID
        await supabase
          .from('users')
          .update({
            wallet_address: normalizedWallet || currentUser?.wallet_address,
            fid: fid || currentUser?.fid,
            total_points: mergedPoints,
          })
          .eq('id', currentUser?.id);

        // Delete the old anonymous user
        await supabase
          .from('users')
          .delete()
          .eq('id', existingUser.id);

        merged = true;
      } catch (mergeError) {
        console.error('Error merging user data:', mergeError);
        return NextResponse.json(
          { error: 'Erreur lors de la fusion des données' },
          { status: 500 }
        );
      }
    } else {
      // No existing user or it's the same user - just update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};
      if (normalizedWallet) updateData.wallet_address = normalizedWallet;
      if (fid) updateData.fid = fid;

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', currentUser?.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Échec de la mise à jour du profil' },
          { status: 500 }
        );
      }
    }

    // Refresh leaderboard
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.rpc('refresh_leaderboard' as any);
    } catch (refreshError) {
      console.error('Error refreshing leaderboard:', refreshError);
    }

    return NextResponse.json({
      success: true,
      userId: currentUser?.id,
      linked,
      merged,
      message: merged
        ? 'Profils fusionnés avec succès!'
        : `${linked === 'wallet' ? 'Wallet' : linked === 'fid' ? 'Farcaster' : 'Wallet et Farcaster'} lié avec succès!`,
    });
  } catch (error) {
    console.error('Claim profile error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors du lien du profil' },
      { status: 500 }
    );
  }
}
