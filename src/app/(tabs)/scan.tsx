import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

const MODES = [
  { id: 'scan', label: 'Scan', icon: 'scan' as const },
  { id: 'barcode', label: 'Barcode', icon: 'barcode-outline' as const },
  { id: 'label', label: 'Label', icon: 'document-text-outline' as const },
  { id: 'library', label: 'Library', icon: 'images-outline' as const },
];

const DARK = '#22301F';
const DARK_CARD = '#2C3B28';

function Corner({ style }: { style: object }) {
  return <View style={[{ width: 34, height: 34, borderColor: colors.primary, position: 'absolute' }, style]} />;
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const scanY = useSharedValue(0);

  useEffect(() => {
    scanY.value = withRepeat(withTiming(1, { duration: 2200 }), -1, true);
  }, [scanY]);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value * 190 }],
    opacity: 0.9,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: DARK, paddingTop: Math.max(insets.top, 12), paddingHorizontal: spacing.lg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ width: 44, height: 44, borderRadius: radii.pill, backgroundColor: DARK_CARD, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="title" color="#fff">Food Scanner</AppText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <AppText variant="body" color="#C9D4C2" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
        Point your camera at food
      </AppText>

      {/* Viewfinder */}
      <View
        style={{
          height: 300,
          borderRadius: radii.lg,
          backgroundColor: '#1A241A',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Corner style={{ top: 18, left: 18, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 }} />
        <Corner style={{ top: 18, right: 18, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 }} />
        <Corner style={{ bottom: 18, left: 18, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 }} />
        <Corner style={{ bottom: 18, right: 18, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 }} />
        <Animated.View style={[{ width: '70%', height: 3, backgroundColor: colors.primary, borderRadius: 2 }, scanStyle]} />
        <MaterialCommunityIcons name="food-apple" size={40} color="#3E4F3A" style={{ position: 'absolute' }} />
        <AppText variant="caption" color="#5A6B55" style={{ position: 'absolute', bottom: 34 }}>
          Live camera connects with a dev build
        </AppText>
      </View>

      {/* Mode buttons */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={m.label}
            style={{
              flex: 1,
              backgroundColor: m.id === 'scan' ? colors.primary : DARK_CARD,
              borderRadius: radii.md,
              paddingVertical: spacing.md,
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name={m.icon} size={22} color="#fff" />
            <AppText variant="caption" color="#fff">{m.label}</AppText>
          </Pressable>
        ))}
      </View>

      {/* Tip card */}
      <View style={{ backgroundColor: DARK_CARD, borderRadius: radii.lg, padding: spacing.lg, marginTop: spacing.xl, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <AppText variant="bodyStrong" color="#fff">Tip</AppText>
        </View>
        <AppText variant="body" color="#C9D4C2">
          Hold steady for 2 seconds. Good lighting gives the most accurate detection.
        </AppText>
      </View>
    </View>
  );
}
