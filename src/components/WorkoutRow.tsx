import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/tokens';
import { radii, spacing } from '@/theme/tokens';

export interface Workout {
  id: string;
  name: string;
  duration?: number | null;
  calories?: number | null;
  category?: string | null;
  difficulty?: string | null;
  completedAt: string;
}

interface WorkoutRowProps {
  workout: Workout;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function categoryTint(category: string | null | undefined, c: ThemeColors): { bg: string; fg: string } {
  const key = (category ?? '').toLowerCase();
  if (key.includes('cardio')) return { bg: 'rgba(255, 138, 101, 0.18)', fg: c.fat };
  if (key.includes('flex')) return { bg: 'rgba(255, 179, 0, 0.18)', fg: c.carbs };
  if (key.includes('sport')) return { bg: c.heroTint, fg: c.primaryStrong };
  return { bg: c.primarySoft, fg: c.primaryStrong };
}

/**
 * A single logged workout: icon tile, name + category chip + date,
 * duration/calories, and a delete button with a confirm dialog.
 */
export function WorkoutRow({ workout, onDelete }: WorkoutRowProps) {
  const { colors } = useTheme();
  const tint = categoryTint(workout.category, colors);

  const confirmDelete = () => {
    Alert.alert('Delete workout', `Remove "${workout.name}" from your log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(workout.id),
      },
    ]);
  };

  const meta: string[] = [];
  if (workout.duration != null) meta.push(`${workout.duration} min`);
  if (workout.calories != null) meta.push(`${Number(workout.calories).toLocaleString('en-IN')} kcal`);
  const date = formatDate(workout.completedAt);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
        borderWidth: 1,
        borderRadius: radii.lg,
        padding: spacing.md,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: radii.md,
          backgroundColor: tint.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="barbell-outline" size={24} color={tint.fg} />
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="title" numberOfLines={1}>
          {workout.name || 'Workout'}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
          {workout.category ? (
            <View
              style={{
                backgroundColor: tint.bg,
                borderRadius: radii.pill,
                paddingVertical: 3,
                paddingHorizontal: 10,
              }}
            >
              <AppText variant="label" color={tint.fg}>
                {workout.category}
              </AppText>
            </View>
          ) : null}
          {date ? <AppText variant="caption">{date}</AppText> : null}
        </View>
        {meta.length > 0 ? (
          <AppText variant="bodyStrong">{meta.join(' · ')}</AppText>
        ) : null}
      </View>

      <Pressable
        onPress={confirmDelete}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${workout.name}`}
        hitSlop={10}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
      >
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
    </View>
  );
}
