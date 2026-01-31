/**
 * Design Tokens - Mini Games Portal
 * Centralized design values for consistent styling across the application
 */

// ========================================
// COLORS
// ========================================

export const colors = {
  // Brand Colors
  celo: '#FCFF52',
  celoHover: '#e5e600',
  celoLight: '#feff7a',
  celoDark: '#d4d600',

  // Semantic Colors
  success: '#10b981',
  successHover: '#059669',
  error: '#ef4444',
  errorHover: '#dc2626',
  warning: '#f97316',
  warningHover: '#ea580c',
  info: '#3b82f6',
  infoHover: '#2563eb',

  // Neutral Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Game-Specific Colors
  game: {
    blackjack: { from: '#ef4444', to: '#f97316' }, // red to orange
    rps: { from: '#9ca3af', to: '#4b5563' }, // gray
    tictactoe: { from: '#10b981', to: '#14b8a6' }, // green to teal
    jackpot: { from: '#eab308', to: '#f97316' }, // yellow to orange
    '2048': { from: '#ec4899', to: '#fb7185' }, // pink to rose
    mastermind: { from: '#6b7280', to: '#374151' }, // gray
    connectfive: { from: '#3b82f6', to: '#6366f1' }, // blue to indigo
    snake: { from: '#10b981', to: '#059669' }, // green to emerald
  },
} as const;

// ========================================
// SPACING
// ========================================

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
} as const;

// ========================================
// SHADOWS
// ========================================

export const shadows = {
  // Standard Shadows
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Celo-Specific Shadows (with yellow glow)
  celo: '0 0 0 3px #FCFF52, 0 10px 25px -5px rgba(0, 0, 0, 0.1)',
  celoXl: '0 0 0 6px #FCFF52, 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  celoSm: '0 0 0 2px #FCFF52, 0 4px 6px -1px rgba(0, 0, 0, 0.1)',

  // Inner Shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;

// ========================================
// BORDER RADIUS
// ========================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
} as const;

// ========================================
// TRANSITIONS
// ========================================

export const transitions = {
  fast: '150ms ease-out',
  normal: '200ms ease-out',
  slow: '300ms ease-out',
  all: 'all 200ms ease-out',
  colors: 'color, background-color, border-color 200ms ease-out',
  transform: 'transform 200ms ease-out',
  opacity: 'opacity 200ms ease-out',
} as const;

// ========================================
// TYPOGRAPHY
// ========================================

export const typography = {
  fontFamily: {
    sans: 'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: 'var(--font-geist-mono), ui-monospace, monospace',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// ========================================
// Z-INDEX
// ========================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ========================================
// BREAKPOINTS
// ========================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ========================================
// ANIMATION VARIANTS (Framer Motion)
// ========================================

export const animations = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // Slide animations
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },

  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  scaleOut: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 0, scale: 0.95 },
    exit: { opacity: 0, scale: 0.95 },
  },

  // Bounce animation
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
    exit: { opacity: 0, scale: 0.3 },
  },

  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  // Hover effects
  hoverScale: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2 },
  },

  hoverBounce: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },

  // Tap effects
  tapScale: {
    scale: 0.95,
  },
} as const;

// ========================================
// ANIMATION DURATIONS
// ========================================

export const durations = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

// ========================================
// EASING FUNCTIONS
// ========================================

export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// ========================================
// BUTTON SIZES
// ========================================

export const buttonSizes = {
  sm: {
    padding: '0.5rem 1rem',
    fontSize: typography.fontSize.sm,
    height: '2rem',
  },
  md: {
    padding: '0.75rem 1.5rem',
    fontSize: typography.fontSize.base,
    height: '2.5rem',
  },
  lg: {
    padding: '1rem 2rem',
    fontSize: typography.fontSize.lg,
    height: '3rem',
  },
} as const;

// ========================================
// EXPORT UTILITIES
// ========================================

/**
 * Get gradient string for a game
 */
export function getGameGradient(gameId: keyof typeof colors.game): string {
  const { from, to } = colors.game[gameId];
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

/**
 * Get Tailwind gradient classes for a game
 */
export function getGameGradientClass(gameId: keyof typeof colors.game): string {
  const gradientMap = {
    blackjack: 'from-red-500 to-orange-600',
    rps: 'from-gray-400 to-gray-600',
    tictactoe: 'from-green-500 to-teal-600',
    jackpot: 'from-yellow-500 to-orange-600',
    '2048': 'from-pink-500 to-rose-600',
    mastermind: 'from-gray-500 to-gray-700',
    connectfive: 'from-blue-500 to-indigo-600',
    snake: 'from-green-500 to-emerald-600',
  };
  return gradientMap[gameId];
}

/**
 * Get shadow with Celo glow
 */
export function getCeloShadow(size: 'sm' | 'md' | 'lg' | 'xl' = 'md'): string {
  const borderWidth = size === 'sm' ? 2 : size === 'xl' ? 6 : 3;
  const shadowSize = size === 'sm' ? '0 4px 6px' : size === 'xl' ? '0 20px 25px' : '0 10px 25px';
  return `0 0 0 ${borderWidth}px ${colors.celo}, ${shadowSize} -5px rgba(0, 0, 0, 0.1)`;
}
