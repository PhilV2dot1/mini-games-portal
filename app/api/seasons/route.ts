import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * GET /api/seasons
 * Returns the current active season with days remaining.
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_current_season');

    if (error) {
      console.error('[Seasons GET] RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const season = data?.[0] ?? null;
    return NextResponse.json({ season });
  } catch (err) {
    console.error('[Seasons GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
