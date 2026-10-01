import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScenicBackground } from '@/components/ui/ScenicBackground';
import { WeekBarChart, type DayBar } from '@/components/WeekBarChart';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';
import { apiFetch, AuthExpiredError } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

/* ---------- API shapes (see hidden_files/CONTRACTS.md) ---------- */

interface WeeklyDay {
  day: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  goal: number;
}

interface WorkoutStats {
  totalWorkouts: number;
  thisWeek: number;
  totalCaloriesBurned: number;
}

interface WeightLog {
  id: string;
  userId: string;
  weight: number;
  date: string;
}

interface WaterSummary {
  totalMl: number;
  totalL: string;
}

interface SleepLog {
  id: string;
  hours: number;
  quality: number;
}

async function handleAuthExpired(): Promise<void> {
  await useAuthStore.getState().logout().catch(() => {});
  router.replace('/(auth)/login');
}

/* ---------- small building blocks ---------- */

function SkeletonBlock({
  width,
  height,
  style,
}: {
  width: DimensionValue;
  height: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radii.sm,
          backgroundColor: colors.ringTrack,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

function StatCard({
  label,
  icon,
  accent,
  value,
  sub,
  delay,
  children,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
  value: string;
  sub: string;
  delay: number;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(delay)}
      style={{ width: '48%', flexGrow: 1 }}
    >
      <GlassCard style={{ gap: spacing.sm, minHeight: 168 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              backgroundColor: colors.primarySoft,
              borderRadius: radii.pill,
              padding: spacing.sm,
            }}
          >
            <MaterialCommunityIcons name={icon} size={18} color={accent} />
          </View>
          <AppText variant="bodyStrong">{label}</AppText>
        </View>
        <AppText variant="numberSm">{value}</AppText>
        <AppText variant="caption">{sub}</AppText>
        {children}
      </GlassCard>
    </Animated.View>
  );
}

/* ---------- screen ---------- */

export default function StatisticsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [weight, setWeight] = useState<WeightLog | null>(null);
  const [water, setWater] = useState<WaterSummary | null>(null);
  const [sleepAvg, setSleepAvg] = useState<number | null>(null);

  const [weightInput, setWeightInput] = useState('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [savingWeight, setSavingWeight] = useState(false);
  const [waterError, setWaterError] = useState<string | null>(null);
  const [savingWater, setSavingWater] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [weeklyRes, workoutRes, weightRes, waterRes, sleepRes] = await Promise.all([
        apiFetch<WeeklyDay[]>('/api/meals/weekly'),
        apiFetch<WorkoutStats>('/api/workouts/stats'),
        apiFetch<WeightLog | null>('/api/weight/latest'),
        apiFetch<WaterSummary>('/api/water'),
        apiFetch<SleepLog[]>('/api/sleep?days=7'),
      ]);
      if (!mounted.current) return;
      setWeekly(Array.isArray(weeklyRes) ? weeklyRes : []);
      setWorkoutStats(workoutRes);
      setWeight(weightRes);
      setWater(waterRes);
      const hours = (Array.isArray(sleepRes) ? sleepRes : [])
        .map((s) => s.hours)
        .filter((h) => typeof h === 'number' && h > 0);
      setSleepAvg(hours.length > 0 ? hours.reduce((a, b) => a + b, 0) / hours.length : null);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        await handleAuthExpired();
        return;
      }
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'Could not load statistics');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Reload every time the screen regains focus (e.g. after logging a meal
  // from another screen).
  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    void loadData(true);
  }, [loadData]);

  const logWater = useCallback(async () => {
    if (savingWater) return;
    setSavingWater(true);
    setWaterError(null);
    try {
      await apiFetch('/api/water', { method: 'POST', body: { amountMl: 250 } });
      const fresh = await apiFetch<WaterSummary>('/api/water');
      if (mounted.current) setWater(fresh);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        await handleAuthExpired();
        return;
      }
      if (mounted.current) setWaterError('Could not log water — please try again.');
    } finally {
      if (mounted.current) setSavingWater(false);
    }
  }, [savingWater]);

  const saveWeight = useCallback(async () => {
    if (savingWeight) return;
    const parsed = Number(weightInput.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setWeightError('Enter a weight in kg, e.g. 68.5');
      return;
    }
    setSavingWeight(true);
    setWeightError(null);
    try {
      await apiFetch('/api/weight', { method: 'POST', body: { weight: parsed } });
      const fresh = await apiFetch<WeightLog | null>('/api/weight/latest');
      if (mounted.current) {
        setWeight(fresh);
        setWeightInput('');
      }
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        await handleAuthExpired();
        return;
      }
      if (mounted.current) setWeightError('Could not save weight — please try again.');
    } finally {
      if (mounted.current) setSavingWeight(false);
    }
  }, [savingWeight, weightInput]);

  /* ---------- derived display values ---------- */

  const totalCal = weekly.reduce((sum, d) => sum + (d.cal || 0), 0);
  const totalGoal = weekly.reduce((sum, d) => sum + (d.goal || 0), 0);
  const hasWeeklyData = weekly.some((d) => (d.cal || 0) > 0);
  const bars: DayBar[] = weekly.map((d) => ({ day: d.day, cal: d.cal || 0, goal: d.goal || 0 }));

  const waterTotalMl = water?.totalMl ?? 0;
  const waterDisplay =
    waterTotalMl >= 1000 ? `${(waterTotalMl / 1000).toFixed(1)} L` : `${Math.round(waterTotalMl)} ml`;

  const hasData = workoutStats !== null || weight !== null || water !== null || weekly.length > 0;

  const renderBody = () => {
    if (loading && !hasData) {
      return (
        <>
          <GlassCard>
            <SkeletonBlock width="45%" height={20} style={{ marginBottom: spacing.md }} />
            <SkeletonBlock width="60%" height={44} style={{ marginBottom: spacing.lg }} />
            <SkeletonBlock width="100%" height={150} />
          </GlassCard>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ width: '48%', flexGrow: 1 }}>
                <GlassCard style={{ gap: spacing.sm, minHeight: 168 }}>
                  <SkeletonBlock width="70%" height={36} />
                  <SkeletonBlock width="45%" height={28} />
                  <SkeletonBlock width="85%" height={16} />
                </GlassCard>
              </View>
            ))}
          </View>
        </>
      );
    }

    if (error && !hasData) {
      return (
        <GlassCard style={{ alignItems: 'center', gap: spacing.md }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <AppText variant="title">Could not load statistics</AppText>
          <AppText variant="caption" style={{ textAlign: 'center' }}>
            {error}
          </AppText>
          <Pressable
            onPress={() => void loadData()}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={{
              backgroundColor: colors.primarySoft,
              borderRadius: radii.pill,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
            }}
          >
            <AppText variant="label" color={colors.primaryStrong}>
              Try again
            </AppText>
          </Pressable>
        </GlassCard>
      );
    }

    return (
      <>
        {/* Calories card */}
        <Animated.View entering={FadeInDown.duration(450)}>
          <GlassCard>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: spacing.md,
              }}
            >
              <AppText variant="bodyStrong">Calories</AppText>
              <AppText variant="caption">
                Target: {Math.round(totalGoal).toLocaleString('en-GB')} kcal this week
              </AppText>
            </View>
            <AppText variant="number" style={{ marginBottom: spacing.lg }}>
              {Math.round(totalCal).toLocaleString('en-GB')} kcal
            </AppText>
            {hasWeeklyData ? (
              <WeekBarChart data={bars} />
            ) : (
              <AppText variant="caption">
                Nothing logged this week yet — your chart will fill in as you log meals.
              </AppText>
            )}
          </GlassCard>
        </Animated.View>

        {/* 2x2 live stat cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <StatCard
            label="Exercise"
            icon="run"
            accent={colors.primaryStrong}
            value={workoutStats ? String(workoutStats.thisWeek) : '–'}
            sub={
              workoutStats
                ? `workouts this week · ${Math.round(workoutStats.totalCaloriesBurned).toLocaleString('en-GB')} kcal burned`
                : 'No workout data yet'
            }
            delay={60}
          />

          <StatCard
            label="Sleep"
            icon="sleep"
            accent={colors.carbs}
            value={sleepAvg !== null ? `${sleepAvg.toFixed(1)} h` : '–'}
            sub={sleepAvg !== null ? 'average · last 7 days' : 'No sleep logs yet'}
            delay={120}
          />

          <StatCard
            label="Weight"
            icon="scale-bathroom"
            accent={colors.fat}
            value={weight ? `${weight.weight.toFixed(1)} kg` : '–'}
            sub={weight ? 'latest reading' : 'Not logged yet'}
            delay={180}
          >
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <TextInput
                value={weightInput}
                onChangeText={(v) => setWeightInput(v.replace(/[^0-9.,]/g, ''))}
                placeholder="kg"
                placeholderTextColor={colors.faint}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={() => void saveWeight()}
                accessibilityLabel="Weight in kilograms"
                style={{
                  flex: 1,
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  borderRadius: radii.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  color: colors.ink,
                  fontSize: 15,
                }}
              />
              <Pressable
                onPress={() => void saveWeight()}
                disabled={savingWeight}
                accessibilityRole="button"
                accessibilityLabel="Save weight"
                style={{
                  backgroundColor: colors.primarySoft,
                  borderRadius: radii.pill,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  opacity: savingWeight ? 0.6 : 1,
                }}
              >
                {savingWeight ? (
                  <ActivityIndicator size="small" color={colors.primaryStrong} />
                ) : (
                  <AppText variant="label" color={colors.primaryStrong}>
                    Save
                  </AppText>
                )}
              </Pressable>
            </View>
            {weightError && (
              <AppText variant="caption" color={colors.danger}>
                {weightError}
              </AppText>
            )}
          </StatCard>

          <StatCard
            label="Water"
            icon="water"
            accent={colors.primaryStrong}
            value={waterDisplay}
            sub="today"
            delay={240}
          >
            <Pressable
              onPress={() => void logWater()}
              disabled={savingWater}
              accessibilityRole="button"
              accessibilityLabel="Log 250 millilitres of water"
              style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.primarySoft,
                borderRadius: radii.pill,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                opacity: savingWater ? 0.6 : 1,
              }}
            >
              {savingWater ? (
                <ActivityIndicator size="small" color={colors.primaryStrong} />
              ) : (
                <AppText variant="label" color={colors.primaryStrong}>
                  +250 ml
                </AppText>
              )}
            </Pressable>
            {waterError && (
              <AppText variant="caption" color={colors.danger}>
                {waterError}
              </AppText>
            )}
          </StatCard>
        </View>
      </>
    );
  };

  return (
    <ScenicBackground>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryStrong}
            colors={[colors.primaryStrong]}
          />
        }
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12),
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.pill,
              backgroundColor: colors.glass,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText variant="title">Statistics</AppText>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {renderBody()}
      </ScrollView>
    </ScenicBackground>
  );
}
