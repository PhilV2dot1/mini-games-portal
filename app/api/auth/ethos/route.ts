import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Must use Node.js runtime — Supabase Admin requires it
export const runtime = 'nodejs';

/**
 * POST /api/auth/ethos
 *
 * Exchange an Ethos auth result (verified wallet address) for a Supabase session.
 * Creates or finds the Supabase Auth user, then signs in and returns a live session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, ethosUsername, ethosScore, ethosPicture } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const syntheticEmail = `${normalizedAddress}@ethos.wallet`;
    // Deterministic password derived from address + secret — never changes for same wallet
    const password = `ethos_${normalizedAddress}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16)}`;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find or create Supabase Auth user
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingAuthUser = listData?.users?.find(u => u.email === syntheticEmail);

    if (!existingAuthUser) {
      const { data: newAuthUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: syntheticEmail,
          password,
          email_confirm: true,
          user_metadata: {
            wallet_address: normalizedAddress,
            ethos_username: ethosUsername,
            ethos_score: ethosScore,
            ethos_picture: ethosPicture,
            provider: 'ethos',
          },
        });

      if (createError || !newAuthUser.user) {
        console.error('Error creating Supabase auth user:', createError);
        return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
      }
    } else {
      // Update password and refresh ethos metadata on each login
      await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
        password,
        user_metadata: {
          ...existingAuthUser.user_metadata,
          ethos_username: ethosUsername,
          ethos_score: ethosScore,
          ethos_picture: ethosPicture,
        },
      });
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

    // Sign in server-side to get a live session — no expiry race condition
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: signInData, error: signInError } =
      await supabaseClient.auth.signInWithPassword({ email: syntheticEmail, password });

    if (signInError || !signInData?.session) {
      console.error('Error signing in:', signInError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    });
  } catch (error) {
    console.error('Ethos auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
