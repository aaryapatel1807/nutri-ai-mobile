import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, shadows, spacing } from '@/theme/tokens';

interface MacroRingProps {
  label: string;
  grams: number;
  goal: number;
  color: string;
}

/**
 * Small macro progress ring from the Food Detail reference:
 * grams in the middle, label underneath.
 */
export function MacroRing({ label, grams, goal, color }: MacroRingProps) {
  const size = 92;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(grams / goal, 1);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
        gap: 6,
        ...shadows.card,
      }}
    >
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.ringTrack}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <AppText variant="bodyStrong">{grams}g</AppText>
      </View>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}
