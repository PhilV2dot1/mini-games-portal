import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Resolve auth user ID to internal users.id
async function resolveUserId(authUserId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single() as { data: { id: string } | null };
  return data?.id ?? null;
}

// Store push subscription for a user
export async function POST(request: NextRequest) {
  try {
    const { userId: authUserId, subscription } = await request.json();

    if (!authUserId || !subscription?.endpoint) {
      return NextResponse.json(
        { error: 'userId and subscription are required' },
        { status: 400 }
      );
    }

    const internalUserId = await resolveUserId(authUserId);
    if (!internalUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert subscription (one per endpoint)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any;
    const { error } = await supabaseAny
      .from('push_subscriptions')
      .upsert(
        {
          user_id: internalUserId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('[Push Subscribe] DB error:', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Push Subscribe] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Remove push subscription
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('push_subscriptions').delete().eq('endpoint', endpoint);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Push Unsubscribe] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
