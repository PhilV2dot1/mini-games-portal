import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

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

    // Try to find existing Supabase Auth user by synthetic email
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = listData?.users?.find(
      (u) => u.email === syntheticEmail
    );

    let supabaseUserId: string;

    if (existingAuthUser) {
      supabaseUserId = existingAuthUser.id;
    } else {
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

      supabaseUserId = newAuthUser.user.id;
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

    // Generate a magic link / OTP to get a real session
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: syntheticEmail,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Error generating link:', linkError);
      return NextResponse.json({ error: 'Failed to generate session link' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      email: syntheticEmail,
      token: linkData.properties.hashed_token,
    });
  } catch (error) {
    console.error('Ethos auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
