import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Test 1: Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey,
          hasServiceKey: !!supabaseServiceKey,
        },
      }, { status: 500 });
    }

    // Test 2: Create client with anon key
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Test 3: Try a simple query
    const { data, error } = await supabaseClient
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Supabase query failed',
        details: {
          message: error.message,
          code: error.code,
          hint: error.hint,
        },
      }, { status: 500 });
    }

    // Test 4: Test service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (adminError) {
      return NextResponse.json({
        success: false,
        error: 'Service role key failed',
        details: {
          message: adminError.message,
          code: adminError.code,
        },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful! ✅',
      tests: {
        environmentVariables: '✅ All variables present',
        anonKeyConnection: '✅ Anon key works',
        serviceRoleConnection: '✅ Service role key works',
        databaseQuery: '✅ Database query successful',
      },
      config: {
        url: supabaseUrl,
        anonKeyPrefix: supabaseAnonKey.substring(0, 20) + '...',
        serviceKeyPrefix: supabaseServiceKey.substring(0, 20) + '...',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: {
        message: error.message,
        stack: error.stack,
      },
    }, { status: 500 });
  }
}
