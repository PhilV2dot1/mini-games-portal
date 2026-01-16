'use client';

/**
 * Theme Context Provider
 * Manages theme state (light/dark/system) with localStorage persistence
 * Pattern: Similar to LanguageContext.tsx
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// ========================================
// TYPES
// ========================================

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const STORAGE_KEY = 'celo_games_theme';

// ========================================
// CONTEXT
// ========================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ========================================
// PROVIDER
// ========================================

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Get system preference
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }, []);

  // Resolve theme to actual light/dark
  const resolveTheme = useCallback(
    (t: Theme): ResolvedTheme => {
      if (t === 'system') {
        return getSystemTheme();
      }
      return t;
    },
    [getSystemTheme]
  );

  // Apply theme to document
  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Also set a data attribute for potential CSS selectors
    root.setAttribute('data-theme', resolved);
  }, []);

  // Load theme from localStorage and apply on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initialTheme = savedTheme || 'system';

    setThemeState(initialTheme);
    const resolved = resolveTheme(initialTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, [resolveTheme, applyTheme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, getSystemTheme, applyTheme]);

  // Set theme
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem(STORAGE_KEY, newTheme);

      const resolved = resolveTheme(newTheme);
      setResolvedTheme(resolved);
      applyTheme(resolved);
    },
    [resolveTheme, applyTheme]
  );

  // Toggle between light and dark (skipping system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        isDark: resolvedTheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ========================================
// HOOKS
// ========================================

/**
 * Main theme hook
 * Usage: const { isDark, toggleTheme, setTheme } = useTheme();
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Optional theme hook that doesn't throw if used outside provider
 * Useful for components that might be used with or without theme
 */
export function useOptionalTheme() {
  return useContext(ThemeContext);
}
