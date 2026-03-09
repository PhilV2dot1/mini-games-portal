import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@mini-games-portal.vercel.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface NotifyRequest {
  userId: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url, icon }: NotifyRequest = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'userId, title and body are required' },
        { status: 400 }
      );
    }

    // Get all subscriptions for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subs, error } = await (supabase as any)
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (error || !subs?.length) {
      // User has no push subscription — not an error
      return NextResponse.json({ success: true, sent: 0 });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-192.png',
      badge: '/favicon-32.png',
      url: url || '/',
      timestamp: Date.now(),
    });

    const results = await Promise.allSettled(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subs.map((sub: any) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    // Clean up expired/invalid subscriptions (410 Gone)
    const expired = results
      .map((r, i) => ({ r, sub: subs[i] }))
      .filter(({ r }) => r.status === 'rejected' && (r.reason as { statusCode?: number })?.statusCode === 410);

    if (expired.length > 0) {
      await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expired.map(({ sub }: { sub: any }) =>
          supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        )
      );
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error('[Push Notify] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
