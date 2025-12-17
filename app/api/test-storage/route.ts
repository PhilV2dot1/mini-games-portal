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

    // Check if storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to list storage buckets',
        details: bucketsError,
      }, { status: 500 });
    }

    const userAvatarsBucket = buckets?.find(b => b.name === 'user-avatars');

    return NextResponse.json({
      success: !!userAvatarsBucket,
      message: userAvatarsBucket
        ? '✅ Storage bucket "user-avatars" exists!'
        : '⚠️ Storage bucket "user-avatars" NOT found',
      details: {
        bucketExists: !!userAvatarsBucket,
        allBuckets: buckets?.map(b => b.name) || [],
        bucketInfo: userAvatarsBucket || null,
      },
      nextSteps: !userAvatarsBucket ? [
        '1. Go to Supabase Dashboard → Storage',
        '2. Click "New bucket"',
        '3. Name: user-avatars',
        '4. Public bucket: YES (check the box)',
        '5. File size limit: 2MB',
        '6. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif',
        '7. Click "Create bucket"',
      ] : [
        '✅ Storage is ready!',
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
