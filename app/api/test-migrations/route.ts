import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if new columns exist in users table
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (tableError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query users table',
        details: tableError,
      }, { status: 500 });
    }

    // If we got here, the table exists. Check for new columns
    const sampleRow = tableInfo && tableInfo.length > 0 ? tableInfo[0] : null;

    // Required columns from migration 003
    const requiredColumns = [
      'email',
      'auth_provider',
      'is_anonymous',
      'claimed_at',
      'avatar_type',
      'avatar_url',
      'avatar_unlocked',
      'bio',
      'social_links',
    ];

    const existingColumns = sampleRow ? Object.keys(sampleRow) : [];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    // Check for functions
    const { data: functionData, error: functionError } = await supabase
      .rpc('can_unlock_custom_avatar', { p_user_id: '00000000-0000-0000-0000-000000000000' })
      .then(() => ({ data: true, error: null }))
      .catch((err) => ({ data: false, error: err }));

    return NextResponse.json({
      success: missingColumns.length === 0,
      message: missingColumns.length === 0
        ? '✅ Migration 003 has been applied!'
        : '⚠️ Migration 003 NOT applied - missing columns',
      details: {
        tableExists: !!tableInfo,
        requiredColumns,
        existingColumns: existingColumns.slice(0, 20), // Limit output
        missingColumns,
        functionExists: functionData === true,
      },
      nextSteps: missingColumns.length > 0 ? [
        '1. Go to Supabase Dashboard → SQL Editor',
        '2. Open supabase/migrations/003_user_profiles_and_auth.sql',
        '3. Copy the entire SQL content',
        '4. Paste and run it in the SQL Editor',
      ] : [
        '✅ Database is ready!',
        'Next: Configure Storage bucket "user-avatars"',
        'Next: Wrap app with <AuthProvider> in app/layout.tsx',
      ],
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: {
        message: error.message,
      },
    }, { status: 500 });
  }
}
