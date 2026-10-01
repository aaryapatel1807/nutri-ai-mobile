/**
 * NutriAI design tokens — drawn from the approved reference screens.
 * Warm cream background, fresh green accent, ink text, soft rounded cards.
 */

export const colors = {
  /** App background */
  bg: '#F6F4EE',
  /** Card surface */
  surface: '#FFFFFF',
  /** Primary text */
  ink: '#1B1E23',
  /** Secondary text */
  muted: '#8B8F98',
  /** Faint text / placeholders */
  faint: '#B9BDC4',

  /** Fresh green accent (active tab, + buttons, ring) */
  primary: '#7CB342',
  primaryDark: '#5B8F2B',
  primarySoft: '#E9F4D8',

  /** Macro colors */
  protein: '#8BC34A',
  carbs: '#FFB300',
  fat: '#FF8A65',

  /** Calorie ring */
  ringTrack: '#E7E4D9',

  /** Hero card tint */
  heroTint: '#DDEBC4',

  /** Tab bar */
  tabInactive: '#9AA0A8',

  /** Semantic */
  danger: '#E5484D',
  warn: '#F5A623',
} as const;

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
} as const;
