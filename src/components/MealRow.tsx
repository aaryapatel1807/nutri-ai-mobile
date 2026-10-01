import { Pressable, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';
import type { MealEntry } from '@/store/useAppStore';
import { colors, radii, shadows, spacing } from '@/theme/tokens';

interface MealRowProps {
  meal: MealEntry;
  onAdd: (meal: MealEntry) => void;
}

/**
 * Meal timeline row from the Home reference: thumbnail tile, name/kcal/time,
 * and the green circular + button.
 */
export function MealRow({ meal, onAdd }: MealRowProps) {
  const logged = meal.items > 0;

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
          backgroundColor: meal.tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name={logged ? 'food-apple' : 'silverware-fork-knife'}
          size={28}
          color={logged ? colors.primaryDark : colors.faint}
        />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="title">{meal.name}</AppText>
        {logged ? (
          <>
            <AppText variant="bodyStrong">{meal.kcal} kcal</AppText>
            <AppText variant="caption">
              {meal.time} · {meal.items} items
            </AppText>
          </>
        ) : (
          <AppText variant="caption">{meal.time}</AppText>
        )}
      </View>

      <Pressable
        onPress={() => onAdd(meal)}
        accessibilityRole="button"
        accessibilityLabel={`Log ${meal.name}`}
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
