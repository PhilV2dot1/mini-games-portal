import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/signup
 *
 * Create new account and migrate anonymous profile if applicable.
 *
 * This endpoint handles:
 * 1. Creating/linking Supabase Auth user
 * 2. Finding existing anonymous user by wallet/FID
 * 3. Claiming that user (set is_anonymous: false) or creating new user
 * 4. Migrating localStorage stats if provided
 * 5. Returning session info
 */

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      authUserId, // Supabase Auth user ID (if already authenticated via OAuth)
      email,
      password,
      provider = 'email',
      localStats,
      walletAddress,
      fid,
    } = body;

    // Initialize Supabase with service role for admin operations
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

    let supabaseUserId = authUserId;

    // If no authUserId provided, create Supabase Auth user
    if (!supabaseUserId && email && password) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for simplicity
      });

      if (authError) {
        return NextResponse.json(
          { error: `Échec de la création du compte: ${authError.message}` },
          { status: 400 }
        );
      }

      supabaseUserId = authData.user.id;
    }

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Normalize wallet address if provided
    const normalizedWallet = walletAddress?.toLowerCase();

    // Step 1: Check if anonymous user exists with this wallet/FID
    let existingUser = null;
    let claimedUser = false;

    if (normalizedWallet || fid) {
      const query = supabase
        .from('users')
        .select('*')
        .eq('is_anonymous', true);

      if (normalizedWallet) {
        query.eq('wallet_address', normalizedWallet);
      } else if (fid) {
        query.eq('fid', fid);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: anonymousUsers } = (await query.maybeSingle()) as { data: any };

      if (anonymousUsers) {
        existingUser = anonymousUsers;
        claimedUser = true;
      }
    }

    let userId: string;
    let pointsPreserved = 0;

    if (existingUser) {
      // Claim existing anonymous user
      const { data: updatedUser, error: updateError } = (await supabase
        .from('users')
        .update({
          email,
          auth_provider: provider,
          is_anonymous: false,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select('id, total_points')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .single()) as { data: any; error: any };

      if (updateError) {
        return NextResponse.json(
          { error: 'Échec de la réclamation du profil' },
          { status: 500 }
        );
      }

      userId = updatedUser.id;
      pointsPreserved = updatedUser.total_points || 0;
    } else {
      // Create new user record
      const { data: newUser, error: insertError } = (await supabase
        .from('users')
        .insert({
          email,
          wallet_address: normalizedWallet,
          fid,
          auth_provider: provider,
          is_anonymous: false,
          claimed_at: new Date().toISOString(),
          username: email ? email.split('@')[0] : `Player_${Date.now()}`,
        })
        .select('id')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .single()) as { data: any; error: any };

      if (insertError) {
        return NextResponse.json(
          { error: 'Échec de la création du profil utilisateur' },
          { status: 500 }
        );
      }

      userId = newUser.id;
    }

    // Step 2: Migrate localStorage stats if provided
    let sessionsMigrated = 0;
    if (localStats && localStats.games) {
      try {
        // Create synthetic game sessions from localStorage data
        const sessions = [];
        const now = new Date();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const [gameId, gameStats] of Object.entries(localStats.games as Record<string, any>)) {
          if (gameStats.played > 0) {
            // Create sessions for wins
            for (let i = 0; i < (gameStats.wins || 0); i++) {
              sessions.push({
                user_id: userId,
                game_id: gameId,
                result: 'win',
                mode: 'free',
                points_earned: gameStats.totalPoints ? Math.floor(gameStats.totalPoints / gameStats.played) : 10,
                played_at: new Date(now.getTime() - (i * 3600000)).toISOString(), // Spread over hours
              });
            }

            // Create sessions for losses
            for (let i = 0; i < (gameStats.losses || 0); i++) {
              sessions.push({
                user_id: userId,
                game_id: gameId,
                result: 'loss',
                mode: 'free',
                points_earned: 5,
                played_at: new Date(now.getTime() - ((gameStats.wins + i) * 3600000)).toISOString(),
              });
            }
          }
        }

        if (sessions.length > 0) {
          const { error: sessionsError } = await supabase
            .from('game_sessions')
            .insert(sessions);

          if (!sessionsError) {
            sessionsMigrated = sessions.length;
          }
        }

        // Update total points if we have localStorage points
        if (localStats.totalPoints && !claimedUser) {
          await supabase
            .from('users')
            .update({ total_points: localStats.totalPoints })
            .eq('id', userId);

          pointsPreserved = localStats.totalPoints;
        }
      } catch (migrateError) {
        console.error('Error migrating localStorage stats:', migrateError);
        // Don't fail the signup if migration fails
      }
    }

    // Step 3: Check for badges
    try {
      await fetch(`${request.nextUrl.origin}/api/badges/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (badgeError) {
      console.error('Error checking badges:', badgeError);
      // Don't fail signup if badge check fails
    }

    return NextResponse.json({
      success: true,
      userId,
      supabaseUserId,
      migrated: claimedUser,
      pointsPreserved,
      sessionsMigrated,
      message: claimedUser
        ? `Profil réclamé avec succès! ${pointsPreserved} points préservés.`
        : 'Compte créé avec succès!',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte' },
      { status: 500 }
    );
  }
}
