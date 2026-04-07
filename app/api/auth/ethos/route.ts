import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Must use Node.js runtime — Supabase Admin (listUsers, generateLink) requires it
export const runtime = 'nodejs';

/**
 * POST /api/auth/ethos
 *
 * Exchange an Ethos auth result (verified wallet address) for a Supabase session.
 * Creates or finds the Supabase Auth user, then returns a session token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, ethosUsername, ethosScore } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const syntheticEmail = `${normalizedAddress}@ethos.wallet`;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Try to find existing Supabase Auth user by listing with email filter
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingAuthUser = listData?.users?.find(u => u.email === syntheticEmail);

    if (!existingAuthUser) {
      // Create new Supabase Auth user
      const { data: newAuthUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: syntheticEmail,
          email_confirm: true,
          user_metadata: {
            wallet_address: normalizedAddress,
            ethos_username: ethosUsername,
            ethos_score: ethosScore,
            provider: 'ethos',
          },
        });

      if (createError || !newAuthUser.user) {
        console.error('Error creating Supabase auth user:', createError);
        return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
      }
    }

    // Ensure users table record exists
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', normalizedAddress)
      .maybeSingle();

    if (!existingProfile) {
      const username = ethosUsername || `Player_${normalizedAddress.slice(2, 10)}`;
      await supabaseAdmin.from('users').insert({
        wallet_address: normalizedAddress,
        username,
        is_anonymous: false,
        auth_provider: 'ethos',
        total_points: 0,
        avatar_type: 'default',
        avatar_url: '/avatars/predefined/default-player.svg',
      });
    }

    // Find the auth user to get their ID for session creation
    const { data: listData2 } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const authUser = listData2?.users?.find(u => u.email === syntheticEmail);

    if (!authUser) {
      return NextResponse.json({ error: 'Auth user not found after creation' }, { status: 500 });
    }

    // Create a session directly — no magic link expiry issues
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.createSession({ userId: authUser.id });

    if (sessionError || !sessionData?.session) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    });
  } catch (error) {
    console.error('Ethos auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
