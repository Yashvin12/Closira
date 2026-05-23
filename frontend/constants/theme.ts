/**
 * Closira Design System Tokens
 *
 * ALL design tokens live here — no raw hex values in components.
 * Follows the UI/UX Pro Max skill file guidelines:
 * - Semantic color tokens (primary, secondary, error, surface, on-surface)
 * - Strict 4pt spacing grid (4, 8, 12, 16, 24, 32dp only)
 * - Consistent icon sizing tokens
 * - Font scale system with Inter from @expo-google-fonts/inter
 * - Border radius scale
 * - Z-index management layers
 */

/** Semantic color palette — dark theme */
export const colors = {
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
  /** Tertiary / disabled text — Slate 500 (improved WCAG contrast) */
  textTertiary: '#64748B',

  /** Divider / border — Slate 700 */
  border: '#334155',
  /** Subtle border for nested elements */
  borderLight: '#1E293B',

  /** Always-white — for text on solid colored badges */
  white: '#FFFFFF',

  /** Slightly elevated inner surface — for info boxes, nested cards */
  surfaceL2: '#263044',

  // ─── Channel brand colours (badge backgrounds) ───────────────────────────
  /** WhatsApp brand green */
  whatsapp: '#25D366',
  /** Email blue */
  email: '#3B82F6',
  /** Call amber */
  call: '#F59E0B',
} as const;

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
  /** Small rounding */
  sm: 4,
  /** Default card rounding */
  md: 8,
  /** Pronounced rounding */
  lg: 12,
  /** Large rounding for modals */
  xl: 16,
  /** Full rounding for badges / pills */
  full: 9999,
} as const;

/** Icon size tokens — consistent sizing across the app */
export const iconSize = {
  /** 16dp — inline icons */
  sm: 16,
  /** 20dp — standard UI icons */
  md: 20,
  /** 24dp — navigation icons */
  lg: 24,
  /** 28dp — prominent icons */
  xl: 28,
  /** 32dp — feature/stat icons */
  '2xl': 32,
  /** 48dp — empty state icons */
  '3xl': 48,
} as const;

/** Font size scale */
export const fontSize = {
  /** 12dp — captions, badges */
  xs: 12,
  /** 14dp — secondary labels */
  sm: 14,
  /** 16dp — body text */
  base: 16,
  /** 18dp — section headers */
  lg: 18,
  /** 20dp — card titles */
  xl: 20,
  /** 24dp — screen headers */
  '2xl': 24,
  /** 32dp — hero numbers */
  '3xl': 32,
} as const;

/**
 * Font weight tokens.
 * Inter ships discrete weights: 400, 600, 700.
 * Use fontFamily tokens below for proper loading via useFonts.
 */
export const fontWeight = {
  /** Regular body text */
  regular: '400' as const,
  /** Semi-bold labels */
  semibold: '600' as const,
  /** Bold headings */
  bold: '700' as const,
};

/**
 * Inter font family tokens.
 * Must match the loaded font names from @expo-google-fonts/inter.
 * Load these in the root _layout.tsx via useFonts().
 */
export const fontFamily = {
  /** Body text */
  regular: 'Inter_400Regular',
  /** Labels and semi-bold UI text */
  semibold: 'Inter_600SemiBold',
  /** Headings */
  bold: 'Inter_700Bold',
} as const;

/**
 * Letter spacing tokens — for badges, labels, and large numbers.
 */
export const letterSpacing = {
  /** Small-caps badge / pill text */
  badge: 0.8,
  /** Section label */
  label: 0.4,
  /** Large tabular numbers (negative for tighter appearance) */
  tight: -0.5,
} as const;

/** Z-index layers for elevation management */
export const zIndex = {
  base: 0,
  card: 10,
  sticky: 20,
  dropdown: 40,
  modal: 100,
  toast: 1000,
} as const;

/** Shadow presets for dark-mode elevation (subtle glows) */
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
  /** Elevated shadow for focused elements */
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  /** Accent glow — use with shadowColor matching iconColor */
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

/**
 * Channel badge metadata.
 * bgColor = solid brand colour, color = white (always).
 * label is UPPERCASE via textTransform in the component.
 */
export const channelConfig = {
  whatsapp: {
    label: 'WhatsApp',
    /** White text on coloured bg */
    color: colors.white,
    bgColor: colors.whatsapp,
    icon: 'logo-whatsapp' as const,
  },
  email: {
    label: 'Email',
    color: colors.white,
    bgColor: colors.email,
    icon: 'mail' as const,
  },
  call: {
    label: 'Call',
    color: colors.white,
    bgColor: colors.call,
    icon: 'call' as const,
  },
} as const;

/**
 * Status pill metadata.
 * New → blue (#6366F1), Qualified → green (#22C55E), Escalated → red (#EF4444).
 * Text is white on all solid backgrounds.
 */
export const statusConfig = {
  new: {
    label: 'New',
    color: colors.white,
    bgColor: colors.primary,
  },
  qualified: {
    label: 'Qualified',
    color: colors.white,
    bgColor: colors.success,
  },
  escalated: {
    label: 'Escalated',
    color: colors.white,
    bgColor: colors.danger,
  },
  followed_up: {
    label: 'Followed Up',
    color: colors.white,
    bgColor: colors.warning,
  },
  resolved: {
    label: 'Resolved',
    color: colors.textSecondary,
    bgColor: colors.borderLight,
  },
} as const;
