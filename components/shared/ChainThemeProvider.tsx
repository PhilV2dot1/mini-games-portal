'use client';

import { useEffect } from 'react';
import { useChainTheme } from '@/hooks/useChainTheme';
import { useTheme } from '@/lib/theme/ThemeContext';

/**
 * Updates CSS custom properties on <html> based on the active chain.
 * Also applies chain-specific background colors and font overrides.
 *
 * Place this component inside the wagmi/wallet providers.
 */
export function ChainThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useChainTheme();
  const { isDark } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--chain-primary', theme.primary);
    root.style.setProperty('--chain-hover', theme.hover);
    root.style.setProperty('--chain-light', theme.light);
    root.style.setProperty('--chain-dark', theme.dark);
    root.style.setProperty('--chain-contrast', theme.contrastText);

    // Chain-specific background override
    if (theme.bgDay && theme.bgNight) {
      const bg = isDark ? theme.bgNight : theme.bgDay;
      root.style.setProperty('--background', bg);
    } else {
      // Reset to default
      root.style.setProperty('--background', isDark ? '#0f0f0f' : '#ffffff');
    }

    // Chain-specific font override
    if (theme.fontFamily) {
      root.style.setProperty('--chain-font', theme.fontFamily);
      document.body.style.fontFamily = theme.fontFamily;
    } else {
      root.style.removeProperty('--chain-font');
      document.body.style.fontFamily = '';
    }
  }, [theme, isDark]);

  return <>{children}</>;
}
