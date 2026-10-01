import { Pressable, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';
import { radii, shadows, spacing } from '@/theme/tokens';
import type { MealGroup, MealType } from '@/store/useAppStore';

interface MealRowProps {
  group: MealGroup;
  onAdd: (type: MealType) => void;
}

const MEAL_META: Record<
  MealType,
  { icon: keyof typeof MaterialCommunityIcons.glyphMap; accent: 'protein' | 'carbs' | 'fat' | 'primary' }
> = {
  Breakfast: { icon: 'bread-slice', accent: 'carbs' },
  Lunch: { icon: 'food-apple', accent: 'protein' },
  Dinner: { icon: 'silverware-fork-knife', accent: 'fat' },
  Snack: { icon: 'cookie', accent: 'primary' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  const hh = h % 12 || 12;
  return `${hh}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

/**
 * Daily-meal timeline row: thumbnail tile, name/kcal/items/time,
 * and the circular + button. Empty groups show "Not logged yet".
 * All colours resolve from the active theme.
 */
export function MealRow({ group, onAdd }: MealRowProps) {
  const { colors } = useTheme();
  const meta = MEAL_META[group.type];
  const accent =
    meta.accent === 'primary' ? colors.primary : colors[meta.accent];
  const logged = group.items.length > 0;
  const tint = `${accent}1A`;
  const latest = group.items[group.items.length - 1];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        gap: spacing.md,
        ...shadows.card,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radii.md,
          backgroundColor: logged ? tint : colors.input,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name={meta.icon}
          size={28}
          color={logged ? accent : colors.faint}
        />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="title">{group.type}</AppText>
        {logged ? (
          <>
            <AppText variant="bodyStrong">
              {Math.round(group.totalKcal).toLocaleString('en-GB')} kcal
            </AppText>
            <AppText variant="caption">
              {formatTime(latest.date)}
              {formatTime(latest.date) ? ' · ' : ''}
              {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
            </AppText>
          </>
        ) : (
          <AppText variant="caption">Not logged yet</AppText>
        )}
      </View>

      <Pressable
        onPress={() => onAdd(group.type)}
        accessibilityRole="button"
        accessibilityLabel={logged ? `Log more ${group.type}` : `Log ${group.type}`}
        style={({ pressed }) => ({
          width: 52,
          height: 52,
          borderRadius: radii.pill,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}
