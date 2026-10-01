/**
 * NutriAI design tokens — drawn from the approved reference screens.
 * Warm cream/green in light mode; deep warm charcoal + amber-green in dark.
 * Never just inverted: the dark palette is hand-tuned like the web night theme.
 */

export interface ThemeColors {
  /** App background */
  bg: string;
  /** Card surface (solid) */
  surface: string;
  /** Primary text */
  ink: string;
  /** Secondary text */
  muted: string;
  /** Faint text / placeholders */
  faint: string;

  /** Fresh green accent (active tab, + buttons, ring) */
  primary: string;
  /** Accent for text on background */
  primaryStrong: string;
  /** Soft accent tint fill */
  primarySoft: string;

  /** Macro colors */
  protein: string;
  carbs: string;
  fat: string;

  /** Calorie ring */
  ringTrack: string;

  /** Hero card tint */
  heroTint: string;

  /** Tab bar */
  tabInactive: string;

  /** Semantic */
  danger: string;
  warn: string;

  /** Glass Office — frosted card fill, border, top highlight */
  glass: string;
  glassBorder: string;
  glassHighlight: string;

  /** Inputs */
  input: string;
  inputBorder: string;

  /** Scenic background wash orbs */
  orb1: string;
  orb2: string;
  orb3: string;
}

export const lightTheme: ThemeColors = {
  bg: '#F6F4EE',
  surface: '#FFFFFF',
  ink: '#1B1E23',
  muted: '#8B8F98',
  faint: '#B9BDC4',

  primary: '#7CB342',
  primaryStrong: '#5B8F2B',
  primarySoft: '#E9F4D8',

  protein: '#8BC34A',
  carbs: '#FFB300',
  fat: '#FF8A65',

  ringTrack: '#E7E4D9',
  heroTint: '#DDEBC4',
  tabInactive: '#9AA0A8',

  danger: '#E5484D',
  warn: '#F5A623',

  glass: 'rgba(255, 255, 255, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.75)',
  glassHighlight: 'rgba(255, 255, 255, 0.9)',

  input: '#FFFFFF',
  inputBorder: '#E7E4D9',

  orb1: 'rgba(124, 179, 66, 0.16)',
  orb2: 'rgba(245, 166, 35, 0.10)',
  orb3: 'rgba(21, 178, 207, 0.08)',
};

export const darkTheme: ThemeColors = {
  bg: '#141210',
  surface: '#1E1B17',
  ink: '#F4F1EA',
  muted: '#A8A29A',
  faint: '#6B655C',

  primary: '#8FCB4E',
  primaryStrong: '#A9DE6E',
  primarySoft: 'rgba(143, 203, 78, 0.14)',

  protein: '#9CCC65',
  carbs: '#FFC233',
  fat: '#FF9E7A',

  ringTrack: '#2E2A25',
  heroTint: 'rgba(143, 203, 78, 0.10)',
  tabInactive: '#8A8478',

  danger: '#F26D6D',
  warn: '#F5B04C',

  glass: 'rgba(48, 42, 36, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassHighlight: 'rgba(255, 255, 255, 0.08)',

  input: '#221E1A',
  inputBorder: '#35302A',

  orb1: 'rgba(143, 203, 78, 0.10)',
  orb2: 'rgba(245, 166, 35, 0.07)',
  orb3: 'rgba(21, 178, 207, 0.06)',
};

export type ThemeMode = 'light' | 'dark';

/**
 * Backwards-compatible alias: the original light palette, so older
 * components keep compiling while they migrate to useTheme().
 */
export const colors = lightTheme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#1B1E23',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  glass: {
    shadowColor: '#1B1E23',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
} as const;
