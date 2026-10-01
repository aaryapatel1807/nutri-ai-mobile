import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/theme/ThemeContext';
import { radii, shadows } from '@/theme/tokens';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Blur strength — matches the web Glass Office's blur(26px) */
  intensity?: number;
  radius?: number;
  padded?: boolean;
}

/**
 * Glass Office card for mobile: frosted-glass fill, soft white border,
 * inset top highlight, gentle drop shadow. Falls back to a translucent
 * fill on Android versions without native blur.
 */
export function GlassCard({ children, style, intensity = 26, radius = radii.lg, padded = true }: GlassCardProps) {
  const { colors, mode } = useTheme();

  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          ...shadows.glass,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={mode === 'dark' ? 'dark' : 'light'}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      {/* inset top highlight, like the web's glass-highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: radius / 2,
          right: radius / 2,
          height: 1,
          backgroundColor: colors.glassHighlight,
          opacity: 0.8,
        }}
      />
      <View style={padded ? { padding: 20 } : undefined}>{children}</View>
    </View>
  );
}
