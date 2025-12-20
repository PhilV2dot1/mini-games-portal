import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/auth/callback
 *
 * Handles OAuth callback from Supabase Auth (Google, Twitter, etc.)
 * Redirects user back to app after authentication
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to home or specified page
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
