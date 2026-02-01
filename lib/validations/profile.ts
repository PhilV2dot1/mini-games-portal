/**
 * Profile Validation Utilities
 *
 * This module provides validation functions for user profile fields including:
 * - Username validation (length, characters, uniqueness)
 * - Bio validation (length)
 * - Social links validation (Twitter, Farcaster, Discord)
 * - Avatar type validation
 */

import { supabase as defaultSupabase } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Constants
// ============================================================================

// Username must be 3-20 characters, alphanumeric + underscore
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// Reserved usernames that cannot be used
export const RESERVED_USERNAMES = [
  'admin',
  'system',
  'guest',
  'player',
  'moderator',
  'support',
  'root',
  'bot',
  'api',
];

// Social link patterns
export const SOCIAL_PATTERNS = {
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]{1,15}\/?$/,
  farcaster: /^https?:\/\/(www\.)?warpcast\.com\/[a-zA-Z0-9_-]+\/?$/,
  discord: /^.{2,32}#[0-9]{4}$/, // Discord username#1234 format
};

// Bio maximum length
export const BIO_MAX_LENGTH = 500; // Increased from 200 to 500 for richer bios

// Display name maximum length
export const DISPLAY_NAME_MAX_LENGTH = 50;

// Valid avatar types
export const VALID_AVATAR_TYPES = ['default', 'predefined', 'custom'] as const;
export type AvatarType = typeof VALID_AVATAR_TYPES[number];

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface SocialLinks {
  twitter?: string;
  farcaster?: string;
  discord?: string;
}

// ============================================================================
// Username Validation
// ============================================================================

/**
 * Validates username format (length and characters)
 * @param username The username to validate
 * @returns Validation result
 */
export function validateUsernameFormat(username: string): ValidationResult {
  if (!username || username.trim().length === 0) {
    return {
      valid: false,
      error: 'Le nom d\'utilisateur est requis',
    };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      error: 'Le nom doit contenir 3-20 caractères (lettres, chiffres, underscore)',
    };
  }

  return { valid: true };
}

/**
 * Checks if username is reserved
 * @param username The username to check
 * @returns Validation result
 */
export function checkReservedUsername(username: string): ValidationResult {
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return {
      valid: false,
      error: 'Ce nom est réservé',
    };
  }

  return { valid: true };
}

/**
 * Checks if username is unique in the database
 * @param username The username to check
 * @param currentUserId The current user's ID (to exclude from check)
 * @param supabaseClient Optional Supabase client (uses default client if not provided)
 * @returns Validation result
 */
export async function checkUsernameUniqueness(
  username: string,
  currentUserId?: string,
  supabaseClient?: SupabaseClient
): Promise<ValidationResult> {
  try {
    const client = supabaseClient || defaultSupabase;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client
      .from('users') as any)
      .select('id, auth_user_id')
      .eq('username', username)
      .maybeSingle() as { data: { id: string; auth_user_id: string } | null; error: unknown };

    if (error) {
      console.error('Error checking username uniqueness:', error);
      return {
        valid: false,
        error: 'Erreur lors de la vérification du nom d\'utilisateur',
      };
    }

    // If no user found with this username, it's available
    if (!data) {
      return { valid: true };
    }

    // If currentUserId provided, check if this is the same user
    // (compare against both id and auth_user_id for OAuth users)
    if (currentUserId && (data.id === currentUserId || data.auth_user_id === currentUserId)) {
      return { valid: true }; // Same user, username is valid
    }

    // Different user has this username
    return {
      valid: false,
      error: 'Ce nom est déjà pris',
    };
  } catch (error) {
    console.error('Error checking username uniqueness:', error);
    return {
      valid: false,
      error: 'Erreur lors de la vérification du nom d\'utilisateur',
    };
  }
}

/**
 * Validates username (format, reserved, uniqueness)
 * @param username The username to validate
 * @param currentUserId The current user's ID (optional)
 * @param supabaseClient Optional Supabase client (uses default client if not provided)
 * @returns Validation result
 */
export async function validateUsername(
  username: string,
  currentUserId?: string,
  supabaseClient?: SupabaseClient
): Promise<ValidationResult> {
  // Check format
  const formatResult = validateUsernameFormat(username);
  if (!formatResult.valid) {
    return formatResult;
  }

  // Check reserved
  const reservedResult = checkReservedUsername(username);
  if (!reservedResult.valid) {
    return reservedResult;
  }

  // Check uniqueness
  const uniquenessResult = await checkUsernameUniqueness(username, currentUserId, supabaseClient);
  if (!uniquenessResult.valid) {
    return uniquenessResult;
  }

  return { valid: true };
}

// ============================================================================
// Bio Validation
// ============================================================================

/**
 * Validates bio text
 * @param bio The bio text to validate
 * @returns Validation result
 */
export function validateBio(bio?: string): ValidationResult {
  if (!bio) {
    return { valid: true }; // Bio is optional
  }

  if (bio.length > BIO_MAX_LENGTH) {
    return {
      valid: false,
      error: `La bio ne peut pas dépasser ${BIO_MAX_LENGTH} caractères`,
    };
  }

  return { valid: true };
}

// ============================================================================
// Display Name Validation
// ============================================================================

/**
 * Validates a display name
 * Display names can contain spaces, unicode characters, and emojis
 * @param displayName The display name to validate
 * @returns Validation result
 */
export function validateDisplayName(displayName: string): ValidationResult {
  if (!displayName || displayName.trim().length === 0) {
    return {
      valid: false,
      error: 'Le nom affiché est requis',
    };
  }

  if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Le nom affiché ne peut pas dépasser ${DISPLAY_NAME_MAX_LENGTH} caractères`,
    };
  }

  // Check for excessive whitespace
  if (displayName.trim() !== displayName || /\s{2,}/.test(displayName)) {
    return {
      valid: false,
      error: 'Le nom affiché ne peut pas contenir d\'espaces au début/fin ou multiples espaces consécutifs',
    };
  }

  return { valid: true };
}

// ============================================================================
// Social Links Validation
// ============================================================================

/**
 * Validates a social link URL
 * @param platform The social platform (twitter, farcaster, discord)
 * @param url The URL or username to validate
 * @returns Validation result
 */
export function validateSocialLink(
  platform: keyof typeof SOCIAL_PATTERNS,
  url: string
): ValidationResult {
  if (!url || url.trim().length === 0) {
    return { valid: true }; // Empty is valid (optional)
  }

  const pattern = SOCIAL_PATTERNS[platform];
  if (!pattern) {
    return {
      valid: false,
      error: 'Plateforme non supportée',
    };
  }

  if (!pattern.test(url)) {
    const examples = {
      twitter: 'https://twitter.com/username ou https://x.com/username',
      farcaster: 'https://warpcast.com/username',
      discord: 'username#1234',
    };

    return {
      valid: false,
      error: `Format invalide. Exemple: ${examples[platform]}`,
    };
  }

  return { valid: true };
}

/**
 * Validates all social links
 * @param socialLinks The social links object to validate
 * @returns Validation result with field-specific errors
 */
export function validateSocialLinks(socialLinks: SocialLinks): {
  valid: boolean;
  errors: Partial<Record<keyof SocialLinks, string>>;
} {
  const errors: Partial<Record<keyof SocialLinks, string>> = {};

  if (socialLinks.twitter) {
    const result = validateSocialLink('twitter', socialLinks.twitter);
    if (!result.valid && result.error) {
      errors.twitter = result.error;
    }
  }

  if (socialLinks.farcaster) {
    const result = validateSocialLink('farcaster', socialLinks.farcaster);
    if (!result.valid && result.error) {
      errors.farcaster = result.error;
    }
  }

  if (socialLinks.discord) {
    const result = validateSocialLink('discord', socialLinks.discord);
    if (!result.valid && result.error) {
      errors.discord = result.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================================================
// Avatar Validation
// ============================================================================

/**
 * Validates avatar type
 * @param avatarType The avatar type to validate
 * @returns Validation result
 */
export function validateAvatarType(avatarType: string): ValidationResult {
  if (!VALID_AVATAR_TYPES.includes(avatarType as AvatarType)) {
    return {
      valid: false,
      error: 'Type d\'avatar invalide',
    };
  }

  return { valid: true };
}

/**
 * Validates avatar URL format
 * @param url The avatar URL to validate
 * @returns Validation result
 */
export function validateAvatarUrl(url?: string): ValidationResult {
  if (!url) {
    return { valid: true }; // Optional for default type
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'URL d\'avatar invalide',
    };
  }
}

// ============================================================================
// Complete Profile Validation
// ============================================================================

/**
 * Validates complete profile update data
 * @param data The profile data to validate
 * @param currentUserId The current user's ID
 * @param supabaseClient Optional Supabase client (uses default client if not provided)
 * @returns Validation results for all fields
 */
export async function validateProfileUpdate(
  data: {
    username?: string;
    bio?: string;
    avatarType?: string;
    avatarUrl?: string;
    socialLinks?: SocialLinks;
  },
  currentUserId: string,
  supabaseClient?: SupabaseClient
): Promise<{
  valid: boolean;
  errors: {
    username?: string;
    bio?: string;
    avatarType?: string;
    avatarUrl?: string;
    socialLinks?: Partial<Record<keyof SocialLinks, string>>;
  };
}> {
  const errors: {
    username?: string;
    bio?: string;
    avatarType?: string;
    avatarUrl?: string;
    socialLinks?: Partial<Record<keyof SocialLinks, string>>;
  } = {};

  // Validate username if provided
  if (data.username) {
    const usernameResult = await validateUsername(data.username, currentUserId, supabaseClient);
    if (!usernameResult.valid && usernameResult.error) {
      errors.username = usernameResult.error;
    }
  }

  // Validate bio if provided
  if (data.bio !== undefined) {
    const bioResult = validateBio(data.bio);
    if (!bioResult.valid && bioResult.error) {
      errors.bio = bioResult.error;
    }
  }

  // Validate avatar type if provided
  if (data.avatarType) {
    const avatarTypeResult = validateAvatarType(data.avatarType);
    if (!avatarTypeResult.valid && avatarTypeResult.error) {
      errors.avatarType = avatarTypeResult.error;
    }
  }

  // Validate avatar URL if provided
  if (data.avatarUrl !== undefined) {
    const avatarUrlResult = validateAvatarUrl(data.avatarUrl);
    if (!avatarUrlResult.valid && avatarUrlResult.error) {
      errors.avatarUrl = avatarUrlResult.error;
    }
  }

  // Validate social links if provided
  if (data.socialLinks) {
    const socialLinksResult = validateSocialLinks(data.socialLinks);
    if (!socialLinksResult.valid) {
      errors.socialLinks = socialLinksResult.errors;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
