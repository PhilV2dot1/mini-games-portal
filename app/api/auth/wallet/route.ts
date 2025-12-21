import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { verifyMessage } from 'viem';

export const runtime = 'edge';

/**
 * POST /api/auth/wallet
 *
 * Authenticate or create user with wallet signature
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, signature, message } = body;

    if (!address || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: address, signature, message' },
        { status: 400 }
      );
    }

    // Normalize wallet address to lowercase
    const normalizedAddress = address.toLowerCase();

    // Verify the signature
    const isValid = await verifyMessage({
      address: normalizedAddress as `0x${string}`,
      message,
      signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Use service role to check/create user
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

    // Check if user exists with this wallet address
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .maybeSingle();

    let userId: string;

    if (existingUser) {
      // User exists, update last login
      userId = existingUser.id;
      await supabaseAdmin
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId);
    } else {
      // Create new user with wallet
      const username = `Player_${normalizedAddress.slice(2, 10)}`;

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          wallet_address: normalizedAddress,
          username,
          is_anonymous: false,
          total_points: 0,
          avatar_type: 'default',
          avatar_url: '/avatars/predefined/default-player.svg',
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      userId = newUser.id;
    }

    // Fetch complete user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userProfile.id,
        wallet_address: userProfile.wallet_address,
        username: userProfile.username,
        total_points: userProfile.total_points,
        avatar_type: userProfile.avatar_type,
        avatar_url: userProfile.avatar_url,
        is_anonymous: userProfile.is_anonymous,
      },
      message: existingUser ? 'Logged in successfully' : 'Account created successfully',
    });
  } catch (error) {
    console.error('Error in wallet authentication:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
