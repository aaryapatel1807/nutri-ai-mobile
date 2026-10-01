import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, shadows, spacing } from '@/theme/tokens';

interface MacroCardProps {
  label: 'Protein' | 'Carbs' | 'Fat';
  grams: number;
  goal: number;
}

const meta: Record<MacroCardProps['label'], { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; soft: string }> = {
  Protein: { icon: 'food-drumstick', color: colors.protein, soft: '#EFF6DF' },
  Carbs: { icon: 'food-croissant', color: colors.carbs, soft: '#FFF4D9' },
  Fat: { icon: 'water', color: colors.fat, soft: '#FFE9E0' },
};

/**
 * Small macro card from the Home reference: tinted icon, grams, thin progress bar.
 */
export function MacroCard({ label, grams, goal }: MacroCardProps) {
  const { icon, color, soft } = meta[label];
  const pct = Math.min(grams / goal, 1);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        padding: spacing.md,
        alignItems: 'center',
        gap: 6,
        ...shadows.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ backgroundColor: soft, borderRadius: radii.pill, padding: 5 }}>
          <MaterialCommunityIcons name={icon} size={15} color={color} />
        </View>
        <AppText variant="caption">{label}</AppText>
      </View>
      <AppText variant="numberSm">{grams}g</AppText>
      <View style={{ height: 6, width: '100%', backgroundColor: soft, borderRadius: radii.pill }}>
        <View style={{ height: 6, width: `${pct * 100}%`, backgroundColor: color, borderRadius: radii.pill }} />
      </View>
    </View>
  );
}
