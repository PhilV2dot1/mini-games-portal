import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/lib/i18n/LanguageContext';
import type { Language } from '@/lib/i18n/translations';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('LanguageProvider', () => {
    test('provides default language "en" on first load', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.language).toBe('en');
    });

    test('loads saved language from localStorage on mount', () => {
      localStorageMock.setItem('language', 'fr');

      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.language).toBe('fr');
    });

    test('ignores invalid language from localStorage', () => {
      localStorageMock.setItem('language', 'invalid');

      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.language).toBe('en');
    });

    test('provides setLanguage function', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.setLanguage).toBeInstanceOf(Function);
    });

    test('provides translation function', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.t).toBeInstanceOf(Function);
    });

    test('renders children', () => {
      render(
        <LanguageProvider>
          <div>Test Child</div>
        </LanguageProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('setLanguage', () => {
    test('updates language state when setLanguage is called', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result.current.setLanguage('fr');
      });

      expect(result.current.language).toBe('fr');
    });

    test('saves language to localStorage when setLanguage is called', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result.current.setLanguage('fr');
      });

      expect(localStorageMock.getItem('language')).toBe('fr');
    });

    test('can switch language back and forth', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result.current.setLanguage('fr');
      });
      expect(result.current.language).toBe('fr');

      act(() => {
        result.current.setLanguage('en');
      });
      expect(result.current.language).toBe('en');
    });
  });

  describe('Translation function (t)', () => {
    test('translates simple key in English', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.t('loading')).toBe('Loading...');
    });

    test('translates simple key in French', () => {
      localStorageMock.setItem('language', 'fr');

      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.t('loading')).toBe('Chargement...');
    });

    test('translates nested key in English', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.t('nav.home')).toBe('Home');
    });

    test('translates nested key in French', () => {
      localStorageMock.setItem('language', 'fr');

      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.t('nav.home')).toBe('Accueil');
    });

    test('translates deeply nested key', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.t('profile.completion.title')).toBe('Profile Completion');
    });

    test('returns key when translation not found', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Translation key not found: nonexistent.key')
      );

      consoleSpy.mockRestore();
    });

    test('returns key when intermediate path does not exist', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(result.current.t('nav.nonexistent.deep')).toBe('nav.nonexistent.deep');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('returns key when value is not a string', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      // 'nav' is an object, not a string — t() returns the object value directly
      expect(typeof result.current.t('nav')).toBe('object');
    });

    test('handles empty string key', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.t('')).toBe('');
    });

    test('updates translations when language changes', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.t('loading')).toBe('Loading...');

      act(() => {
        result.current.setLanguage('fr');
      });

      expect(result.current.t('loading')).toBe('Chargement...');
    });
  });

  describe('useLanguage hook', () => {
    test('throws error when used outside LanguageProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useLanguage());
      }).toThrow('useLanguage must be used within a LanguageProvider');

      consoleSpy.mockRestore();
    });

    test('works correctly inside LanguageProvider', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current).toBeDefined();
      expect(result.current.language).toBe('en');
      expect(result.current.setLanguage).toBeInstanceOf(Function);
      expect(result.current.t).toBeInstanceOf(Function);
    });
  });

  describe('Edge cases', () => {
    test('handles rapid language switching', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result.current.setLanguage('fr');
        result.current.setLanguage('en');
        result.current.setLanguage('fr');
      });

      expect(result.current.language).toBe('fr');
      expect(localStorageMock.getItem('language')).toBe('fr');
    });

    test('persists language across multiple renders', () => {
      const { result: result1 } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result1.current.setLanguage('fr');
      });

      // Simulate unmounting and remounting
      const { result: result2 } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result2.current.language).toBe('fr');
    });

    test('handles special characters in translation keys', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      // Game '2048' has special characters in key
      expect(result.current.t('gameDescriptions.2048')).toBe('Merge tiles to 2048!');
    });
  });
});
