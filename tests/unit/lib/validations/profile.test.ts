import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  validateUsernameFormat,
  checkReservedUsername,
  checkUsernameUniqueness,
  validateUsername,
  validateBio,
  validateDisplayName,
  validateSocialLink,
  validateSocialLinks,
  validateAvatarType,
  validateAvatarUrl,
  USERNAME_REGEX,
  RESERVED_USERNAMES,
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
} from '@/lib/validations/profile';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Profile Validation', () => {
  describe('validateUsernameFormat', () => {
    test('accepts valid username with letters and numbers', () => {
      const result = validateUsernameFormat('player123');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('accepts valid username with underscores', () => {
      const result = validateUsernameFormat('cool_player');
      expect(result.valid).toBe(true);
    });

    test('accepts username with exactly 3 characters (minimum)', () => {
      const result = validateUsernameFormat('abc');
      expect(result.valid).toBe(true);
    });

    test('accepts username with exactly 20 characters (maximum)', () => {
      const result = validateUsernameFormat('a'.repeat(20));
      expect(result.valid).toBe(true);
    });

    test('rejects empty username', () => {
      const result = validateUsernameFormat('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('rejects username with only whitespace', () => {
      const result = validateUsernameFormat('   ');
      expect(result.valid).toBe(false);
    });

    test('rejects username with less than 3 characters', () => {
      const result = validateUsernameFormat('ab');
      expect(result.valid).toBe(false);
    });

    test('rejects username with more than 20 characters', () => {
      const result = validateUsernameFormat('a'.repeat(21));
      expect(result.valid).toBe(false);
    });

    test('rejects username with spaces', () => {
      const result = validateUsernameFormat('cool player');
      expect(result.valid).toBe(false);
    });

    test('rejects username with special characters', () => {
      expect(validateUsernameFormat('player@123').valid).toBe(false);
      expect(validateUsernameFormat('player#123').valid).toBe(false);
      expect(validateUsernameFormat('player-123').valid).toBe(false);
      expect(validateUsernameFormat('player.123').valid).toBe(false);
    });

    test('rejects username with emoji', () => {
      const result = validateUsernameFormat('player😀');
      expect(result.valid).toBe(false);
    });
  });

  describe('checkReservedUsername', () => {
    test('rejects reserved username "admin"', () => {
      const result = checkReservedUsername('admin');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('rejects reserved username "system"', () => {
      const result = checkReservedUsername('system');
      expect(result.valid).toBe(false);
    });

    test('rejects reserved username in uppercase "ADMIN"', () => {
      const result = checkReservedUsername('ADMIN');
      expect(result.valid).toBe(false);
    });

    test('rejects reserved username in mixed case "Admin"', () => {
      const result = checkReservedUsername('Admin');
      expect(result.valid).toBe(false);
    });

    test('accepts non-reserved username', () => {
      const result = checkReservedUsername('player123');
      expect(result.valid).toBe(true);
    });

    test('rejects all reserved usernames', () => {
      RESERVED_USERNAMES.forEach(username => {
        const result = checkReservedUsername(username);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('checkUsernameUniqueness', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('returns valid when username is not taken', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await checkUsernameUniqueness('newuser');
      expect(result.valid).toBe(true);
    });

    test('returns invalid when username is taken by another user', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'other-user-id', auth_user_id: 'other-auth-id' },
              error: null,
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await checkUsernameUniqueness('takenuser', 'current-user-id');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('returns valid when username belongs to current user (by id)', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const currentUserId = 'current-user-id';
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: currentUserId, auth_user_id: 'auth-id' },
              error: null,
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await checkUsernameUniqueness('myusername', currentUserId);
      expect(result.valid).toBe(true);
    });

    test('returns valid when username belongs to current user (by auth_user_id)', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const currentUserId = 'auth-user-id';
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'db-id', auth_user_id: currentUserId },
              error: null,
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await checkUsernameUniqueness('myusername', currentUserId);
      expect(result.valid).toBe(true);
    });

    test('handles database errors gracefully', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await checkUsernameUniqueness('username');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('validateBio', () => {
    test('accepts empty bio (optional field)', () => {
      const result = validateBio();
      expect(result.valid).toBe(true);
    });

    test('accepts bio with valid length', () => {
      const result = validateBio('This is my bio');
      expect(result.valid).toBe(true);
    });

    test('accepts bio at maximum length', () => {
      const result = validateBio('a'.repeat(BIO_MAX_LENGTH));
      expect(result.valid).toBe(true);
    });

    test('rejects bio exceeding maximum length', () => {
      const result = validateBio('a'.repeat(BIO_MAX_LENGTH + 1));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('500');
    });

    test('accepts bio with emojis and unicode', () => {
      const result = validateBio('Hello 👋 こんにちは');
      expect(result.valid).toBe(true);
    });

    test('accepts bio with newlines', () => {
      const result = validateBio('Line 1\nLine 2\nLine 3');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateDisplayName', () => {
    test('accepts valid display name', () => {
      const result = validateDisplayName('John Doe');
      expect(result.valid).toBe(true);
    });

    test('accepts display name with emojis', () => {
      const result = validateDisplayName('Player 🎮');
      expect(result.valid).toBe(true);
    });

    test('accepts display name at maximum length', () => {
      const result = validateDisplayName('a'.repeat(DISPLAY_NAME_MAX_LENGTH));
      expect(result.valid).toBe(true);
    });

    test('rejects empty display name', () => {
      const result = validateDisplayName('');
      expect(result.valid).toBe(false);
    });

    test('rejects display name with only whitespace', () => {
      const result = validateDisplayName('   ');
      expect(result.valid).toBe(false);
    });

    test('rejects display name exceeding maximum length', () => {
      const result = validateDisplayName('a'.repeat(DISPLAY_NAME_MAX_LENGTH + 1));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50');
    });

    test('rejects display name with leading whitespace', () => {
      const result = validateDisplayName('  John');
      expect(result.valid).toBe(false);
    });

    test('rejects display name with trailing whitespace', () => {
      const result = validateDisplayName('John  ');
      expect(result.valid).toBe(false);
    });

    test('rejects display name with multiple consecutive spaces', () => {
      const result = validateDisplayName('John  Doe');
      expect(result.valid).toBe(false);
    });

    test('accepts display name with single spaces between words', () => {
      const result = validateDisplayName('John Paul Doe');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateSocialLink', () => {
    describe('Twitter validation', () => {
      test('accepts valid twitter.com URL', () => {
        const result = validateSocialLink('twitter', 'https://twitter.com/username');
        expect(result.valid).toBe(true);
      });

      test('accepts valid x.com URL', () => {
        const result = validateSocialLink('twitter', 'https://x.com/username');
        expect(result.valid).toBe(true);
      });

      test('accepts twitter URL without www', () => {
        const result = validateSocialLink('twitter', 'https://twitter.com/username');
        expect(result.valid).toBe(true);
      });

      test('accepts twitter URL with www', () => {
        const result = validateSocialLink('twitter', 'https://www.twitter.com/username');
        expect(result.valid).toBe(true);
      });

      test('accepts twitter URL with http', () => {
        const result = validateSocialLink('twitter', 'http://twitter.com/username');
        expect(result.valid).toBe(true);
      });

      test('accepts empty twitter link (optional)', () => {
        const result = validateSocialLink('twitter', '');
        expect(result.valid).toBe(true);
      });

      test('rejects invalid twitter URL format', () => {
        const result = validateSocialLink('twitter', 'twitter.com/username');
        expect(result.valid).toBe(false);
      });

      test('rejects twitter URL with spaces', () => {
        const result = validateSocialLink('twitter', 'https://twitter.com/user name');
        expect(result.valid).toBe(false);
      });
    });

    describe('Farcaster validation', () => {
      test('accepts valid warpcast URL', () => {
        const result = validateSocialLink('farcaster', 'https://warpcast.com/username');
        expect(result.valid).toBe(true);
      });

      test('accepts warpcast URL with www', () => {
        const result = validateSocialLink('farcaster', 'https://www.warpcast.com/username');
        expect(result.valid).toBe(true);
      });

      test('accepts warpcast URL with http', () => {
        const result = validateSocialLink('farcaster', 'http://warpcast.com/username');
        expect(result.valid).toBe(true);
      });

      test('accepts empty farcaster link (optional)', () => {
        const result = validateSocialLink('farcaster', '');
        expect(result.valid).toBe(true);
      });

      test('rejects invalid farcaster URL', () => {
        const result = validateSocialLink('farcaster', 'warpcast.com/username');
        expect(result.valid).toBe(false);
      });
    });

    describe('Discord validation', () => {
      test('accepts valid Discord username#1234 format', () => {
        const result = validateSocialLink('discord', 'username#1234');
        expect(result.valid).toBe(true);
      });

      test('accepts Discord username with minimum length', () => {
        const result = validateSocialLink('discord', 'ab#1234');
        expect(result.valid).toBe(true);
      });

      test('accepts Discord username with maximum length', () => {
        const result = validateSocialLink('discord', 'a'.repeat(32) + '#1234');
        expect(result.valid).toBe(true);
      });

      test('accepts empty discord link (optional)', () => {
        const result = validateSocialLink('discord', '');
        expect(result.valid).toBe(true);
      });

      test('rejects Discord username without discriminator', () => {
        const result = validateSocialLink('discord', 'username');
        expect(result.valid).toBe(false);
      });

      test('rejects Discord username with invalid discriminator', () => {
        const result = validateSocialLink('discord', 'username#123');
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('validateSocialLinks', () => {
    test('accepts all valid social links', () => {
      const result = validateSocialLinks({
        twitter: 'https://twitter.com/user',
        farcaster: 'https://warpcast.com/user',
        discord: 'user#1234',
      });
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    test('accepts empty social links object', () => {
      const result = validateSocialLinks({});
      expect(result.valid).toBe(true);
    });

    test('returns errors for invalid twitter link', () => {
      const result = validateSocialLinks({
        twitter: 'invalid-url',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.twitter).toBeTruthy();
    });

    test('returns errors for multiple invalid links', () => {
      const result = validateSocialLinks({
        twitter: 'invalid',
        discord: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.twitter).toBeTruthy();
      expect(result.errors.discord).toBeTruthy();
    });

    test('accepts some valid and ignores empty fields', () => {
      const result = validateSocialLinks({
        twitter: 'https://twitter.com/user',
        farcaster: undefined,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAvatarType', () => {
    test('accepts "default" avatar type', () => {
      const result = validateAvatarType('default');
      expect(result.valid).toBe(true);
    });

    test('accepts "predefined" avatar type', () => {
      const result = validateAvatarType('predefined');
      expect(result.valid).toBe(true);
    });

    test('accepts "custom" avatar type', () => {
      const result = validateAvatarType('custom');
      expect(result.valid).toBe(true);
    });

    test('rejects invalid avatar type', () => {
      const result = validateAvatarType('invalid');
      expect(result.valid).toBe(false);
    });

    test('rejects empty string', () => {
      const result = validateAvatarType('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAvatarUrl', () => {
    test('accepts valid HTTP URL', () => {
      const result = validateAvatarUrl('http://example.com/avatar.png');
      expect(result.valid).toBe(true);
    });

    test('accepts valid HTTPS URL', () => {
      const result = validateAvatarUrl('https://example.com/avatar.png');
      expect(result.valid).toBe(true);
    });

    test('accepts empty/undefined URL (optional)', () => {
      expect(validateAvatarUrl().valid).toBe(true);
      expect(validateAvatarUrl('').valid).toBe(true);
    });

    test('rejects invalid URL format', () => {
      const result = validateAvatarUrl('not-a-url');
      expect(result.valid).toBe(false);
    });

    test('rejects URL without protocol', () => {
      const result = validateAvatarUrl('example.com/avatar.png');
      expect(result.valid).toBe(false);
    });
  });
});
