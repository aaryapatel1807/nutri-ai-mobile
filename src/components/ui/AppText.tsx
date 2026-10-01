import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors } from '@/theme/tokens';

/**
 * NutriAI text system — one component for every string in the app.
 *
 * Display / headlines use Poppins (rounded geometric, matches the references);
 * body and UI text use Inter. Fonts are loaded in the root layout; each
 * variant falls back gracefully if a font hasn't loaded yet.
 */

type Variant =
  | 'display' // big greeting headline — Poppins 700
  | 'headline' // section titles — Poppins 600
  | 'title' // card titles — Poppins 600
  | 'body' // default reading text — Inter 400
  | 'bodyStrong' // emphasized body — Inter 600
  | 'caption' // small muted text — Inter 400
  | 'label' // small strong labels — Inter 600
  | 'number' // big kcal numbers — Poppins 700, tabular
  | 'numberSm'; // macro grams — Poppins 600

const variantStyles: Record<Variant, TextStyle> = {
  display: { fontFamily: 'Poppins_700Bold', fontSize: 34, lineHeight: 40, color: colors.ink, letterSpacing: -0.5 },
  headline: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, lineHeight: 28, color: colors.ink },
  title: { fontFamily: 'Poppins_600SemiBold', fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21, color: colors.ink },
  bodyStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 21, color: colors.ink },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 17, color: colors.muted },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 17, color: colors.ink },
  number: { fontFamily: 'Poppins_700Bold', fontSize: 44, lineHeight: 48, color: colors.ink, fontVariant: ['tabular-nums'] },
  numberSm: { fontFamily: 'Poppins_600SemiBold', fontSize: 24, lineHeight: 28, color: colors.ink, fontVariant: ['tabular-nums'] },
};

export interface AppTextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  return (
    <RNText
      style={[variantStyles[variant], color ? { color } : null, style]}
      {...rest}
    />
  );
}
