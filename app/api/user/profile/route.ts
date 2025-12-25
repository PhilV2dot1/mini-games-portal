import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import {
  validateUsername,
  validateSocialLinks,
  validateBio,
  validateDisplayName,
} from '@/lib/validations/profile';
import { isValidThemeColor } from '@/lib/constants/themes';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    const userId = searchParams.get('id');

    // Normalize wallet address to lowercase for consistent querying
    const walletAddress = searchParams.get('wallet')?.toLowerCase();

    console.log('[Profile API] Query params:', { fid, walletAddress, userId });

    if (!fid && !walletAddress && !userId) {
      return NextResponse.json(
        { error: 'Either fid, wallet, or id is required' },
        { status: 400 }
      );
    }

    // Build query based on identifier
    let query = supabase.from('users').select('*');

    if (userId) {
      // Try auth_user_id first (for OAuth users), then fall back to id
      query = query.or(`auth_user_id.eq.${userId},id.eq.${userId}`);
    } else if (fid) {
      query = query.eq('fid', parseInt(fid));
    } else if (walletAddress) {
      console.log('[Profile API] Searching by wallet:', walletAddress);
      query = query.eq('wallet_address', walletAddress);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: user, error: userError } = await query.maybeSingle<any>();

    // If OAuth user not found, try to get their auth info and create profile
    if ((!user || userError) && userId) {
      console.log('[Profile API] User not found by ID, checking Supabase Auth:', userId);

      try {
        // Create admin client for auth operations
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

        // Get auth user info
        const { data: { user: authUser }, error: authFetchError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (authFetchError || !authUser) {
          console.error('[Profile API] Error fetching auth user:', authFetchError);
          return NextResponse.json(
            {
              error: 'Utilisateur non trouvé dans Supabase Auth',
              details: authFetchError?.message || 'No auth user found'
            },
            { status: 404 }
          );
        }

        if (authUser) {
        console.log('[Profile API] Auth user found, creating profile:', authUser.email);

        // Create user profile from auth data
        let username = authUser.email
          ? authUser.email.split('@')[0]
          : `Player_${userId.slice(0, 8)}`;

        // Check if username already exists and make it unique
        const { data: existingUsername } = await supabaseAdmin
          .from('users')
          .select('username')
          .eq('username', username)
          .maybeSingle();

        if (existingUsername) {
          // Add random suffix to make it unique
          const randomSuffix = Math.random().toString(36).substring(2, 6);
          username = `${username}_${randomSuffix}`;
          console.log('[Profile API] Username exists, using unique name:', username);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newUser, error: createError } = (await supabaseAdmin
          .from('users')
          .insert({
            auth_user_id: authUser.id,
            email: authUser.email,
            username,
            auth_provider: authUser.app_metadata?.provider || 'email',
            is_anonymous: false,
            total_points: 0,
            avatar_type: 'default',
            avatar_url: '/avatars/predefined/default-player.svg',
          })
          .select()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .single()) as { data: any; error: any };

        if (createError) {
          console.error('[Profile API] Error creating user profile:', {
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
          });

          // Check if user already exists (unique constraint violation)
          if (createError.code === '23505') {
            console.log('[Profile API] User already exists, fetching existing profile');
            // Try to fetch the existing user
            const { data: existingUser } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('auth_user_id', authUser.id)
              .maybeSingle();

            if (existingUser) {
              user = existingUser;
              userError = null;
              console.log('[Profile API] Existing profile found:', user.id);
            } else {
              return NextResponse.json(
                {
                  error: 'Échec de la création du profil',
                  details: createError.message
                },
                { status: 500 }
              );
            }
          } else {
            return NextResponse.json(
              {
                error: 'Échec de la création du profil',
                details: createError.message,
                code: createError.code
              },
              { status: 500 }
            );
          }
        } else {
          user = newUser;
          userError = null;
          console.log('[Profile API] Profile created successfully:', user.id);
        }
      }
      } catch (err) {
        console.error('[Profile API] Unexpected error creating OAuth profile:', err);
        return NextResponse.json(
          {
            error: 'Erreur lors de la création du profil',
            details: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined
          },
          { status: 500 }
        );
      }
    }

    if (userError || !user) {
      console.log('[Profile API] User not found:', { userError, hasUser: !!user });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[Profile API] User found:', user.id);

    // Fetch recent game sessions (last 50)
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*, games(name, icon)')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .limit(50) as { data: any[] | null; error: any };

    // Fetch earned badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', user.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .order('earned_at', { ascending: false }) as { data: any[] | null; error: any };

    // Fetch user rank from leaderboard
    const { data: leaderboardEntry } = await supabase
      .from('leaderboard')
      .select('rank')
      .eq('user_id', user.id)
      .maybeSingle<{ rank: number }>();

    // Calculate per-game stats
    interface GameStat {
      played: number;
      wins: number;
      points: number;
    }
    const gameStats: Record<string, GameStat> = {};
    if (sessions && !sessionsError) {
      sessions.forEach(session => {
        if (!gameStats[session.game_id]) {
          gameStats[session.game_id] = {
            played: 0,
            wins: 0,
            points: 0,
          };
        }
        gameStats[session.game_id].played++;
        if (session.result === 'win') {
          gameStats[session.game_id].wins++;
        }
        gameStats[session.game_id].points += session.points_earned;
      });
    }

    // Calculate overall stats
    const gamesPlayed = sessions?.length || 0;
    const wins = sessions?.filter(s => s.result === 'win').length || 0;
    const losses = sessions?.filter(s => s.result === 'lose').length || 0;
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        fid: user.fid,
        username: user.username || `Player ${user.id.slice(0, 8)}`,
        display_name: user.display_name || user.username || `Player ${user.id.slice(0, 8)}`,
        wallet_address: user.wallet_address,
        total_points: user.total_points,
        created_at: user.created_at,
        // Profile fields
        theme_color: user.theme_color || 'yellow',
        avatar_type: user.avatar_type || 'default',
        avatar_url: user.avatar_url || '/avatars/predefined/default-player.svg',
        avatar_unlocked: user.avatar_unlocked || false,
        bio: user.bio || '',
        social_links: user.social_links || {},
        email: user.email,
        is_anonymous: user.is_anonymous,
        // Privacy settings
        profile_visibility: user.profile_visibility || 'public',
        show_stats: user.show_stats !== false, // Default true
        show_badges: user.show_badges !== false, // Default true
        show_game_history: user.show_game_history !== false, // Default true
      },
      stats: {
        gamesPlayed,
        wins,
        losses,
        winRate,
      },
      recentSessions: sessions || [],
      badges: badges || [],
      gameStats,
      rank: leaderboardEntry?.rank || null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 *
 * Update authenticated user's profile
 * Supports lookup by userId or walletAddress
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { display_name, username, bio, theme_color, avatar_type, avatar_url, social_links, profile_visibility, show_stats, show_badges, show_game_history, walletAddress } = body;

    // Get authenticated user from header or session
    // For now, we'll require a userId or walletAddress in the body
    const userId = body.userId || request.headers.get('x-user-id');

    if (!userId && !walletAddress) {
      return NextResponse.json(
        { error: 'Authentification requise - userId ou walletAddress nécessaire' },
        { status: 401 }
      );
    }

    // Initialize Supabase with service role for querying user
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

    // Find the user by userId (try auth_user_id first, then id) or walletAddress
    let query = supabaseAdmin.from('users').select('id');
    if (userId) {
      // Try auth_user_id first (for OAuth users), then fall back to id
      query = query.or(`auth_user_id.eq.${userId},id.eq.${userId}`);
    } else if (walletAddress) {
      query = query.eq('wallet_address', walletAddress.toLowerCase());
    }

    const { data: userData, error: userError } = await query.maybeSingle();

    console.log('[Profile PUT] Looking for user:', { userId, walletAddress, found: !!userData, error: userError });

    let actualUserId: string;

    // If user not found and wallet address provided, create new user
    if (!userData && walletAddress) {
      console.log('Creating new user with wallet address:', walletAddress);

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          username: username || `Player_${walletAddress.slice(2, 10)}`,
          is_anonymous: false,
          total_points: 0,
          avatar_type: avatar_type || 'default',
          avatar_url: avatar_url || '/avatars/predefined/default-player.svg',
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Échec de la création de l\'utilisateur' },
          { status: 500 }
        );
      }

      actualUserId = newUser.id;
      console.log('New user created, will now apply full profile data:', actualUserId);

      // Don't return early - let the profile data be applied through the normal update flow below
    } else if (userError || !userData) {
      console.error('User not found:', { userId, walletAddress, error: userError });
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    } else {
      actualUserId = userData.id;
    }

    // Validate display name
    if (display_name) {
      const displayNameResult = validateDisplayName(display_name);
      if (!displayNameResult.valid) {
        return NextResponse.json(
          { error: displayNameResult.error },
          { status: 400 }
        );
      }
    }

    // Validate username
    if (username) {
      const usernameResult = await validateUsername(username, actualUserId);
      if (!usernameResult.valid) {
        return NextResponse.json(
          { error: usernameResult.error },
          { status: 400 }
        );
      }
    }

    // Validate bio
    if (bio) {
      const bioResult = validateBio(bio);
      if (!bioResult.valid) {
        return NextResponse.json(
          { error: bioResult.error },
          { status: 400 }
        );
      }
    }

    // Validate social links
    if (social_links) {
      const socialResult = validateSocialLinks(social_links);
      if (!socialResult.valid) {
        return NextResponse.json(
          { error: 'Liens sociaux invalides', details: socialResult.errors },
          { status: 400 }
        );
      }
    }

    // Validate theme color
    if (theme_color && !isValidThemeColor(theme_color)) {
      return NextResponse.json(
        { error: 'Couleur de thème invalide' },
        { status: 400 }
      );
    }

    // Validate profile visibility
    if (profile_visibility && !['public', 'private'].includes(profile_visibility)) {
      return NextResponse.json(
        { error: 'Visibilité de profil invalide' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (display_name !== undefined) updateData.display_name = display_name;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (theme_color !== undefined) updateData.theme_color = theme_color;
    if (avatar_type !== undefined) updateData.avatar_type = avatar_type;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (social_links !== undefined) updateData.social_links = social_links;
    if (profile_visibility !== undefined) updateData.profile_visibility = profile_visibility;
    if (show_stats !== undefined) updateData.show_stats = show_stats;
    if (show_badges !== undefined) updateData.show_badges = show_badges;
    if (show_game_history !== undefined) updateData.show_game_history = show_game_history;
    updateData.updated_at = new Date().toISOString();

    // Update user
    const { data: updatedUser, error: updateError } = (await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', actualUserId)
      .select()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single()) as { data: any; error: any };

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Échec de la mise à jour du profil' },
        { status: 500 }
      );
    }

    // Refresh leaderboard if username changed
    if (username) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabaseAdmin.rpc('refresh_leaderboard' as any);
      } catch (refreshError) {
        console.error('Error refreshing leaderboard:', refreshError);
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profil mis à jour avec succès',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
