import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * POST /api/admin/cleanup-users
 *
 * Clean up users with inconsistent data (points but no game sessions)
 * Optionally delete or reset these users
 *
 * Body params:
 * - dryRun: boolean (default true) - if true, only returns what would be deleted
 * - resetPoints: boolean (default false) - if true, reset points to 0 instead of deleting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dryRun = true, resetPoints = false } = body;

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

    // Find users with points but no game sessions
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('id, username, wallet_address, total_points, created_at')
      .gt('total_points', 0);

    if (!allUsers) {
      return NextResponse.json({ message: 'No users found' });
    }

    const inconsistentUsers = [];

    for (const user of allUsers) {
      const { data: sessions } = await supabaseAdmin
        .from('game_sessions')
        .select('id')
        .eq('user_id', user.id);

      // User has points but no game sessions = inconsistent
      if (!sessions || sessions.length === 0) {
        inconsistentUsers.push(user);
      }
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        message: `Found ${inconsistentUsers.length} users with points but no game sessions`,
        users: inconsistentUsers,
        action: resetPoints ? 'Would reset points to 0' : 'Would delete users',
      });
    }

    // Perform cleanup
    if (resetPoints) {
      // Reset points to 0 for inconsistent users
      const userIds = inconsistentUsers.map(u => u.id);

      if (userIds.length > 0) {
        const { error } = await supabaseAdmin
          .from('users')
          .update({ total_points: 0 })
          .in('id', userIds);

        if (error) {
          return NextResponse.json(
            { error: 'Failed to reset points', details: error },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: `Reset points to 0 for ${userIds.length} users`,
        users: inconsistentUsers,
      });
    } else {
      // Delete inconsistent users
      const userIds = inconsistentUsers.map(u => u.id);

      if (userIds.length > 0) {
        const { error } = await supabaseAdmin
          .from('users')
          .delete()
          .in('id', userIds);

        if (error) {
          return NextResponse.json(
            { error: 'Failed to delete users', details: error },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${userIds.length} inconsistent users`,
        users: inconsistentUsers,
      });
    }
  } catch (error) {
    console.error('Error cleaning up users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
