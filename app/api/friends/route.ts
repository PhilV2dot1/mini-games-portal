/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'edge';

/**
 * GET /api/friends?userId=X
 * List friends (accepted), pending received, and pending sent
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Get internal user ID from auth_user_id
    const { data: user } = await (supabase
      .from('users') as any)
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const internalId = user.id;

    // Get all friendships where user is requester or addressee
    const { data: friendships, error } = await (supabase
      .from('friendships') as any)
      .select('*')
      .or(`requester_id.eq.${internalId},addressee_id.eq.${internalId}`);

    if (error) {
      console.error('[Friends API] Error fetching friendships:', error);
      return NextResponse.json(
        { error: 'Failed to fetch friendships' },
        { status: 500 }
      );
    }

    // Collect all friend user IDs
    const friendUserIds = new Set<string>();
    for (const f of (friendships || [])) {
      friendUserIds.add(f.requester_id === internalId ? f.addressee_id : f.requester_id);
    }

    // Fetch user profiles for all friends
    const userProfiles: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (friendUserIds.size > 0) {
      const { data: profiles } = await (supabase
        .from('users') as any)
        .select('id, username, display_name, avatar_url, total_points')
        .in('id', Array.from(friendUserIds));

      if (profiles) {
        for (const p of profiles) {
          userProfiles[p.id] = p;
        }
      }
    }

    // Build categorized lists
    const friends = [];
    const pendingReceived = [];
    const pendingSent = [];

    for (const f of (friendships || [])) {
      const isRequester = f.requester_id === internalId;
      const friendId = isRequester ? f.addressee_id : f.requester_id;
      const profile = userProfiles[friendId] || {};

      const friendData = {
        friendship_id: f.id,
        user_id: friendId,
        username: profile.username || null,
        display_name: profile.display_name || null,
        avatar_url: profile.avatar_url || null,
        total_points: profile.total_points || 0,
        status: f.status,
        is_requester: isRequester,
      };

      if (f.status === 'accepted') {
        friends.push(friendData);
      } else if (f.status === 'pending') {
        if (isRequester) {
          pendingSent.push(friendData);
        } else {
          pendingReceived.push(friendData);
        }
      }
    }

    return NextResponse.json({
      success: true,
      friends,
      pendingReceived,
      pendingSent,
    });
  } catch (error) {
    console.error('[Friends API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/friends
 * Send a friend request by username
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, friendUsername } = body;

    if (!userId || !friendUsername) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, friendUsername' },
        { status: 400 }
      );
    }

    // Get requester internal ID
    const { data: requester } = await (supabase
      .from('users') as any)
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!requester) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find addressee by username
    const { data: addressee } = await (supabase
      .from('users') as any)
      .select('id, username')
      .ilike('username', friendUsername)
      .single();

    if (!addressee) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (requester.id === addressee.id) {
      return NextResponse.json(
        { error: 'Cannot add yourself as a friend' },
        { status: 400 }
      );
    }

    // Check if friendship already exists (in either direction)
    const { data: existing } = await (supabase
      .from('friendships') as any)
      .select('id, status')
      .or(`and(requester_id.eq.${requester.id},addressee_id.eq.${addressee.id}),and(requester_id.eq.${addressee.id},addressee_id.eq.${requester.id})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already friends' },
          { status: 409 }
        );
      }
      if (existing.status === 'pending') {
        return NextResponse.json(
          { error: 'Friend request already pending' },
          { status: 409 }
        );
      }
      if (existing.status === 'blocked') {
        return NextResponse.json(
          { error: 'Cannot send request' },
          { status: 403 }
        );
      }
    }

    // Create friendship
    const { data: friendship, error } = await (supabase
      .from('friendships') as any)
      .insert({
        requester_id: requester.id,
        addressee_id: addressee.id,
        status: 'pending',
      })
      .select('id, status')
      .single();

    if (error) {
      console.error('[Friends API] Error creating friendship:', error);
      return NextResponse.json(
        { error: 'Failed to send friend request', details: String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      friendship,
    });
  } catch (error) {
    console.error('[Friends API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
