/**
 * Closira Design System Tokens
 *
 * ALL design tokens live here — no raw hex values in components.
 * Supports dark (default), light, and system themes via ThemeContext.
 */

/** Semantic color palette — dark theme (original, unchanged) */
export const darkColors = {
  /** App background — Slate 900 */
  background: '#0F172A',
  /** Card / surface background — Slate 800 */
  surface: '#1E293B',

  /** Primary brand — Indigo 500 */
  primary: '#6366F1',
  /** Primary pressed state */
  primaryDark: '#4F46E5',
  /** Primary tinted surface (dark-safe) */
  primaryLight: 'rgba(99,102,241,0.15)',

  /** Secondary accent — Violet 500 */
  secondary: '#8B5CF6',
  /** Secondary tinted surface */
  secondaryLight: 'rgba(139,92,246,0.15)',

  /** Semantic: success — Green 500 */
  success: '#22C55E',
  /** Success tinted surface */
  successLight: 'rgba(34,197,94,0.15)',

  /** Semantic: warning — Amber 500 */
  warning: '#F59E0B',
  /** Warning tinted surface */
  warningLight: 'rgba(245,158,11,0.15)',

  /** Semantic: danger/error — Red 500 */
  danger: '#EF4444',
  /** Danger tinted surface */
  dangerLight: 'rgba(239,68,68,0.15)',

  /** Primary text — near white */
  textPrimary: '#F8FAFC',
  /** Secondary text — Slate 400 */
  textSecondary: '#94A3B8',
  /** Tertiary / disabled text — Slate 500 */
  textTertiary: '#64748B',

  /** Divider / border — Slate 700 */
  border: '#334155',
  /** Subtle border for nested elements */
  borderLight: '#1E293B',

  /** Always-white — for text on solid colored badges */
  white: '#FFFFFF',

  /** Slightly elevated inner surface */
  surfaceL2: '#263044',

  // ─── Channel brand colours ───────────────────────────────────────────────
  whatsapp: '#25D366',
  email: '#3B82F6',
  call: '#F59E0B',
} as const;

/** Semantic color palette — light theme */
export const lightColors = {
  /** App background — white */
  background: '#F8FAFC',
  /** Card / surface background — Slate 50 */
  surface: '#FFFFFF',

  /** Primary brand — Indigo 600 (slightly darker for legibility on white) */
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: 'rgba(79,70,229,0.10)',

  secondary: '#7C3AED',
  secondaryLight: 'rgba(124,58,237,0.10)',

  success: '#16A34A',
  successLight: 'rgba(22,163,74,0.10)',

  warning: '#D97706',
  warningLight: 'rgba(217,119,6,0.10)',

  danger: '#DC2626',
  dangerLight: 'rgba(220,38,38,0.10)',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  white: '#FFFFFF',
  surfaceL2: '#F1F5F9',

  // ─── Channel brand colours ───────────────────────────────────────────────
  whatsapp: '#25D366',
  email: '#3B82F6',
  call: '#F59E0B',
} as const;

/** Union type of a resolved color palette */
export type ColorPalette = typeof darkColors | typeof lightColors;

/**
 * Legacy export — components that haven't migrated to useTheme()
 * still import `colors` and get the dark palette.
 * Migrate components to useTheme() as you touch them.
 */
export const colors = darkColors;

/**
 * Strict 4pt spacing grid.
 * Allowed values: 4, 8, 12, 16, 24, 32dp.
 */
export const spacing = {
  /** 4dp — micro spacing */
  xs: 4,
  /** 8dp — tight spacing */
  sm: 8,
  /** 12dp — compact spacing */
  md: 12,
  /** 16dp — standard spacing */
  lg: 16,
  /** 24dp — section gap */
  '2xl': 24,
  /** 32dp — major section gap */
  '3xl': 32,
} as const;

/** Consistent border radius scale */
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/** Icon size tokens */
export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 48,
} as const;

/** Font size scale */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const fontWeight = {
  regular: '400' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const fontFamily = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const letterSpacing = {
  badge: 0.8,
  label: 0.4,
  tight: -0.5,
} as const;

export const zIndex = {
  base: 0,
  card: 10,
  sticky: 20,
  dropdown: 40,
  modal: 100,
  toast: 1000,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  accent: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Badge / Pill metadata
// ─────────────────────────────────────────────────────────────────────────────

export const channelConfig = {
  whatsapp: {
    label: 'WhatsApp',
    color: '#FFFFFF',
    bgColor: '#25D366',
    icon: 'logo-whatsapp' as const,
  },
  email: {
    label: 'Email',
    color: '#FFFFFF',
    bgColor: '#3B82F6',
    icon: 'mail' as const,
  },
  call: {
    label: 'Call',
    color: '#FFFFFF',
    bgColor: '#F59E0B',
    icon: 'call' as const,
  },
} as const;

export const statusConfig = {
  new: {
    label: 'New',
    color: '#FFFFFF',
    bgColor: '#6366F1',
  },
  qualified: {
    label: 'Qualified',
    color: '#FFFFFF',
    bgColor: '#22C55E',
  },
  escalated: {
    label: 'Escalated',
    color: '#FFFFFF',
    bgColor: '#EF4444',
  },
  followed_up: {
    label: 'Followed Up',
    color: '#FFFFFF',
    bgColor: '#F59E0B',
  },
  resolved: {
    label: 'Resolved',
    color: '#94A3B8',
    bgColor: '#1E293B',
  },
} as const;
