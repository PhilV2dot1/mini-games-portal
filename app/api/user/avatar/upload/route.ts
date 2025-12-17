import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/user/avatar/upload
 *
 * Upload custom avatar image to Supabase Storage
 *
 * Requirements:
 * - User must have avatar_unlocked = true
 * - File must be image (JPEG, PNG, WebP, GIF)
 * - Max file size: 2MB
 */

export const runtime = 'edge';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Fichier et ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou GIF.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Taille maximale: 2MB.' },
        { status: 400 }
      );
    }

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

    // Check if user can upload custom avatar
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('avatar_unlocked')
      .eq('id', userId)
      .single() as { data: any; error: any };

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (!user.avatar_unlocked) {
      return NextResponse.json(
        { error: 'Upload d\'avatar personnalisé non débloqué. Jouez 100 parties ou obtenez le badge Veteran.' },
        { status: 403 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Échec de l\'upload du fichier' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    // Update user's avatar in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_type: 'custom',
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Try to delete the uploaded file
      await supabase.storage.from('user-avatars').remove([filePath]);
      return NextResponse.json(
        { error: 'Échec de la mise à jour du profil' },
        { status: 500 }
      );
    }

    // Delete old custom avatar if it exists (optional cleanup)
    // This could be done in a background job instead

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: 'Avatar uploadé avec succès!',
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'upload' },
      { status: 500 }
    );
  }
}
