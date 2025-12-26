/**
 * POST /api/user/banner/upload
 *
 * Upload custom profile banner to Supabase Storage
 * Requires authentication and 100+ games played
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Type for user data response
type UserData = {
  id: string;
  avatar_unlocked: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez JPG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 5MB.' },
        { status: 400 }
      );
    }

    // Check if user has unlocked custom banner (100+ games played)
    const { data: userData, error: userError } = (await supabase
      .from('users')
      .select('id, avatar_unlocked')
      .eq('auth_user_id', user.id)
      .maybeSingle()) as { data: UserData | null; error: unknown };

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Use same unlock condition as custom avatar
    if (!userData.avatar_unlocked) {
      return NextResponse.json(
        {
          error: 'Bannière personnalisée débloquée après 100 jeux',
          unlocked: false,
        },
        { status: 403 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userData.id}-${timestamp}.${fileExt}`;
    const filePath = `${userData.id}/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage (user-banners bucket)
    const { error: uploadError } = await supabase.storage
      .from('user-banners')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Banner upload error:', uploadError);
      return NextResponse.json(
        { error: 'Échec du téléchargement de la bannière' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('user-banners').getPublicUrl(filePath);

    // Update user's banner in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        banner_url: publicUrl,
        banner_type: 'custom',
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Banner update error:', updateError);
      // Try to clean up uploaded file
      await supabase.storage.from('user-banners').remove([filePath]);

      return NextResponse.json(
        { error: 'Échec de la mise à jour du profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bannerUrl: publicUrl,
      bannerType: 'custom',
    });
  } catch (error) {
    console.error('Banner upload route error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error },
      { status: 500 }
    );
  }
}
