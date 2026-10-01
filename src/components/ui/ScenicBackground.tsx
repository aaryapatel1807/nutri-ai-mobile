import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';

/**
 * Soft scenic background wash — the mobile echo of the web's scenic
 * backdrop. Three large, low-opacity orbs drift behind the content so
 * frosted-glass cards have something to blur. Pure decoration:
 * pointer events are disabled and it never intercepts touches.
 */
export function ScenicBackground({ children }: { children: ReactNode }) {
  const { colors, mode } = useTheme();

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.orb,
            {
              width: 340,
              height: 340,
              borderRadius: 170,
              backgroundColor: colors.orb1,
              top: -90,
              right: -80,
            },
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              width: 280,
              height: 280,
              borderRadius: 140,
              backgroundColor: colors.orb2,
              top: 180,
              left: -100,
            },
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: colors.orb3,
              bottom: -70,
              right: -60,
            },
          ]}
        />
        {/* faint warm veil so the wash never fights the content */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: mode === 'dark' ? 'rgba(20,18,16,0.35)' : 'rgba(246,244,238,0.45)' },
          ]}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  orb: { position: 'absolute' },
});
