'use client';

/**
 * Theme Toggle Component
 * Allows switching between light/dark/system themes
 */

import { motion } from 'framer-motion';
import { useTheme, Theme } from '@/lib/theme/ThemeContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useShouldAnimate } from '@/lib/utils/motion';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'icon' | 'dropdown';
}

// Icons as SVG components for better control
const SunIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MoonIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const SystemIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export function ThemeToggle({
  size = 'md',
  showLabel = false,
  variant = 'icon',
}: ThemeToggleProps) {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const shouldAnimate = useShouldAnimate();

  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-base',
    lg: 'p-2.5 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Simple toggle button (light <-> dark)
  if (variant === 'icon') {
    return (
      <motion.button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          rounded-lg
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          text-gray-700 dark:text-gray-200
          transition-colors duration-200
          flex items-center gap-2
          border border-gray-200 dark:border-gray-600
        `}
        whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
        aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
        title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      >
        <motion.div
          initial={false}
          animate={shouldAnimate ? { rotate: isDark ? 180 : 0 } : undefined}
          transition={{ duration: 0.3 }}
        >
          {isDark ? (
            <MoonIcon className={iconSizes[size]} />
          ) : (
            <SunIcon className={iconSizes[size]} />
          )}
        </motion.div>
        {showLabel && (
          <span className="font-medium">
            {isDark ? t('theme.dark') : t('theme.light')}
          </span>
        )}
      </motion.button>
    );
  }

  // Dropdown variant with all three options
  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t('theme.light'), icon: <SunIcon className={iconSizes[size]} /> },
    { value: 'dark', label: t('theme.dark'), icon: <MoonIcon className={iconSizes[size]} /> },
    { value: 'system', label: t('theme.system'), icon: <SystemIcon className={iconSizes[size]} /> },
  ];

  return (
    <div className="relative inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-600">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`
            ${sizeClasses[size]}
            rounded-md
            flex items-center gap-1.5
            transition-all duration-200
            ${
              theme === t.value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }
          `}
          aria-label={t.label}
          title={t.label}
        >
          {t.icon}
          {showLabel && <span className="font-medium text-xs">{t.label}</span>}
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle;
