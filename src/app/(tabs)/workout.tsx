import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScenicBackground } from '@/components/ui/ScenicBackground';
import { WorkoutRow, type Workout } from '@/components/WorkoutRow';
import { apiFetch, AuthExpiredError } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

interface WorkoutStats {
  totalWorkouts: number;
  thisWeek: number;
  totalCaloriesBurned: number;
}

const CATEGORIES = ['Strength', 'Cardio', 'Flexibility', 'Sports'] as const;
const DIFFICULTIES = ['Easy', 'Moderate', 'Hard'] as const;

function forceLogout() {
  void useAuthStore.getState().logout();
  router.replace('/(auth)/login');
}

function StatTile({ value, label, icon }: { value: number | null; label: string; icon: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
        borderWidth: 1,
        borderRadius: radii.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Ionicons name={icon as never} size={16} color={colors.primaryStrong} />
      <AppText variant="numberSm" color={value != null ? colors.ink : colors.faint}>
        {value != null ? Number(value).toLocaleString('en-IN') : '—'}
      </AppText>
      <AppText variant="caption" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radii.pill,
        backgroundColor: selected ? colors.primary : 'transparent',
        borderWidth: 1,
        borderColor: selected ? 'transparent' : colors.inputBorder,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppText variant="label" color={selected ? '#fff' : colors.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline log-workout form.
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Strength');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('Moderate');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        apiFetch<Workout[]>('/api/workouts'),
        apiFetch<WorkoutStats>('/api/workouts/stats'),
      ]);
      setWorkouts(Array.isArray(list) ? list : []);
      setStats(s);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        forceLogout();
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load workouts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload every time the tab regains focus (e.g. after logging a workout
  // from another screen).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await apiFetch(`/api/workouts/${id}`, { method: 'DELETE' });
        await load(true);
      } catch (err) {
        if (err instanceof AuthExpiredError) forceLogout();
      }
    },
    [load],
  );

  const resetForm = () => {
    setName('');
    setDuration('');
    setCalories('');
    setCategory('Strength');
    setDifficulty('Moderate');
    setFormError(null);
  };

  const submit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Give the workout a name.');
      return;
    }
    const durationNum = duration.trim() ? Number(duration) : undefined;
    const caloriesNum = calories.trim() ? Number(calories) : undefined;
    if (durationNum !== undefined && (!Number.isFinite(durationNum) || durationNum <= 0)) {
      setFormError('Duration must be a positive number of minutes.');
      return;
    }
    if (caloriesNum !== undefined && (!Number.isFinite(caloriesNum) || caloriesNum <= 0)) {
      setFormError('Calories must be a positive number.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch('/api/workouts', {
        method: 'POST',
        body: {
          name: trimmed,
          ...(durationNum !== undefined ? { duration: durationNum } : {}),
          ...(caloriesNum !== undefined ? { calories: caloriesNum } : {}),
          category,
          difficulty,
        },
      });
      resetForm();
      setFormOpen(false);
      await load(true);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        forceLogout();
        return;
      }
      setFormError(err instanceof Error ? err.message : 'Could not log workout');
    } finally {
      setSubmitting(false);
    }
  }, [name, duration, calories, category, difficulty, load]);

  const renderHeader = () => (
    <View style={{ gap: spacing.lg }}>
      {/* Title + log button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <AppText variant="headline">Workouts</AppText>
          <AppText variant="caption">Move a little, log a lot.</AppText>
        </View>
        <Pressable
          onPress={() => {
            setFormError(null);
            setFormOpen((v) => !v);
          }}
          accessibilityRole="button"
          accessibilityLabel={formOpen ? 'Close workout form' : 'Log workout'}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.primary,
            borderRadius: radii.pill,
            paddingVertical: 10,
            paddingHorizontal: spacing.lg,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name={formOpen ? 'close' : 'add'} size={18} color="#fff" />
          <AppText variant="label" color="#fff">
            {formOpen ? 'Close' : 'Log workout'}
          </AppText>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatTile value={stats?.totalWorkouts ?? null} label="Workouts" icon="barbell-outline" />
        <StatTile value={stats?.thisWeek ?? null} label="This week" icon="calendar-outline" />
        <StatTile
          value={stats?.totalCaloriesBurned ?? null}
          label="Calories burnt"
          icon="flame-outline"
        />
      </View>

      {/* Inline form */}
      {formOpen ? (
        <GlassCard>
          <View style={{ gap: spacing.md }}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Workout name, e.g. Morning run"
              placeholderTextColor={colors.faint}
              style={{
                backgroundColor: colors.input,
                borderColor: colors.inputBorder,
                borderWidth: 1,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                color: colors.ink,
              }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                placeholder="Duration (min)"
                placeholderTextColor={colors.faint}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                  borderWidth: 1,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 15,
                  color: colors.ink,
                }}
              />
              <TextInput
                value={calories}
                onChangeText={setCalories}
                placeholder="Calories"
                placeholderTextColor={colors.faint}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                  borderWidth: 1,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 15,
                  color: colors.ink,
                }}
              />
            </View>

            <View style={{ gap: spacing.sm }}>
              <AppText variant="label">Category</AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                {CATEGORIES.map((c) => (
                  <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
                ))}
              </View>
            </View>

            <View style={{ gap: spacing.sm }}>
              <AppText variant="label">Difficulty</AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                {DIFFICULTIES.map((d) => (
                  <Chip
                    key={d}
                    label={d}
                    selected={difficulty === d}
                    onPress={() => setDifficulty(d)}
                  />
                ))}
              </View>
            </View>

            {formError ? <AppText variant="caption" color={colors.danger}>{formError}</AppText> : null}

            <Pressable
              onPress={submit}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Save workout"
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                borderRadius: radii.pill,
                paddingVertical: spacing.md,
                alignItems: 'center',
                opacity: submitting ? 0.6 : pressed ? 0.88 : 1,
              })}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <AppText variant="bodyStrong" color="#fff">
                  Save workout
                </AppText>
              )}
            </Pressable>
          </View>
        </GlassCard>
      ) : null}

      <AppText variant="label">Recent sessions</AppText>
    </View>
  );

  return (
    <ScenicBackground>
      <FlatList
        data={workouts}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => <WorkoutRow workout={item} onDelete={handleDelete} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? null : error ? (
            <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl }}>
              <AppText variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
                {error}
              </AppText>
              <Pressable
                onPress={() => load()}
                accessibilityRole="button"
                accessibilityLabel="Retry loading workouts"
                style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.lg }}
              >
                <AppText variant="bodyStrong" color={colors.primaryStrong}>
                  Try again
                </AppText>
              </Pressable>
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: radii.pill,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="fitness-outline" size={30} color={colors.primaryStrong} />
              </View>
              <AppText variant="title">No workouts yet</AppText>
              <AppText variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
                Log your first session above and it will appear here.
              </AppText>
            </View>
          )
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: 130,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primaryStrong}
          />
        }
      />
      {loading && workouts.length === 0 ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: insets.top + 170,
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          <ActivityIndicator size="large" color={colors.primaryStrong} />
        </View>
      ) : null}
    </ScenicBackground>
  );
}
