import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { MealRow } from '@/components/MealRow';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScenicBackground } from '@/components/ui/ScenicBackground';
import { useTheme } from '@/theme/ThemeContext';
import { radii, shadows, spacing, type ThemeColors } from '@/theme/tokens';
import { greetingFor, useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';

/* ------------------------------------------------------------------ */
/* Themed hero calorie ring (animated arc, tabular centre number)      */
/* ------------------------------------------------------------------ */

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function HeroRing({ consumed, goal }: { consumed: number; goal: number }) {
  const { colors } = useTheme();
  const size = 150;
  const strokeWidth = 13;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(consumed / Math.max(goal, 1), 1), {
      duration: 900,
    });
  }, [consumed, goal, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.ringTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <AppText variant="number" style={{ fontSize: 30, lineHeight: 34 }}>
        {Math.round(consumed).toLocaleString('en-GB')}
      </AppText>
      <AppText variant="caption">of {Math.round(goal).toLocaleString('en-GB')} kcal</AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Macro card — icon, grams, slim progress bar, "128/170g" caption     */
/* ------------------------------------------------------------------ */

const MACRO_META = [
  { key: 'protein', label: 'Protein', icon: 'food-drumstick', colorKey: 'protein' },
  { key: 'carbs', label: 'Carbs', icon: 'food-croissant', colorKey: 'carbs' },
  { key: 'fat', label: 'Fat', icon: 'water', colorKey: 'fat' },
] as const;

function MacroTile({
  label,
  grams,
  goal,
  icon,
  color,
}: {
  label: string;
  grams: number;
  goal: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}) {
  const { colors } = useTheme();
  const pct = Math.min(grams / Math.max(goal, 1), 1);
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
        <View style={{ backgroundColor: `${color}1A`, borderRadius: radii.pill, padding: 5 }}>
          <MaterialCommunityIcons name={icon} size={15} color={color} />
        </View>
        <AppText variant="caption">{label}</AppText>
      </View>
      <AppText variant="numberSm">{Math.round(grams)}g</AppText>
      <View
        style={{
          height: 6,
          width: '100%',
          backgroundColor: `${color}26`,
          borderRadius: radii.pill,
        }}
      >
        <View
          style={{
            height: 6,
            width: `${pct * 100}%`,
            backgroundColor: color,
            borderRadius: radii.pill,
          }}
        />
      </View>
      <AppText variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
        {Math.round(grams)}/{Math.round(goal)}g
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function SkeletonBlock({ height, radius = radii.md }: { height: number; radius?: number }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 850 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          height,
          borderRadius: radius,
          backgroundColor: colors.input,
          width: '100%',
        },
        style,
      ]}
    />
  );
}

function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: Math.max(insets.top, 12),
        paddingHorizontal: spacing.lg,
        gap: spacing.lg,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <SkeletonBlock height={48} radius={radii.pill} />
      </View>
      <SkeletonBlock height={36} radius={radii.sm} />
      <SkeletonBlock height={190} radius={radii.lg} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <SkeletonBlock height={140} radius={radii.md} />
        <SkeletonBlock height={140} radius={radii.md} />
        <SkeletonBlock height={140} radius={radii.md} />
      </View>
      <SkeletonBlock height={96} radius={radii.lg} />
      <SkeletonBlock height={96} radius={radii.lg} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');

function macroColor(colors: ThemeColors, key: 'protein' | 'carbs' | 'fat'): string {
  return colors[key];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const status = useAppStore((s) => s.status);
  const today = useAppStore((s) => s.today);
  const error = useAppStore((s) => s.error);
  const refresh = useAppStore((s) => s.refresh);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'there';
  const initial = (firstName.charAt(0) || 'N').toUpperCase();

  return (
    <ScenicBackground>
      {status === 'loading' && !today ? (
        <HomeSkeleton />
      ) : status === 'error' && !today ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: radii.pill,
              backgroundColor: colors.input,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="cloud-offline-outline" size={32} color={colors.muted} />
          </View>
          <AppText variant="headline" style={{ textAlign: 'center' }}>
            Could not load your day
          </AppText>
          <AppText variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
            {error ?? 'Please check your connection and try again.'}
          </AppText>
          <View style={{ width: '100%' }}>
            <AppButton title="Try again" onPress={refresh} />
          </View>
        </View>
      ) : today ? (
        <ScrollView
          contentContainerStyle={{
            paddingTop: Math.max(insets.top, 12),
            paddingHorizontal: spacing.lg,
            paddingBottom: 120,
            gap: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Greeting header */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Pressable
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radii.pill,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText variant="title" color={colors.primaryStrong}>
                  {initial}
                </AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body">{greetingFor()},</AppText>
                <AppText variant="headline">{firstName}</AppText>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(400)}>
            <AppText variant="display">Let&apos;s Track Your{'\n'}Progress</AppText>
          </Animated.View>

          {/* Hero calorie card */}
          <Animated.View entering={FadeInDown.delay(120).duration(450)}>
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="fire" size={18} color={colors.primaryStrong} />
                    <AppText variant="bodyStrong">Calories Today</AppText>
                  </View>
                  <AppText variant="body">{fmt(today.totalCalories)} kcal consumed</AppText>
                  <AppText variant="bodyStrong" color={colors.primaryStrong}>
                    {today.goalCalories - today.totalCalories >= 0
                      ? `${fmt(today.goalCalories - today.totalCalories)} kcal remaining to goal`
                      : `${fmt(today.totalCalories - today.goalCalories)} kcal over goal`}
                  </AppText>
                </View>
                <HeroRing consumed={today.totalCalories} goal={today.goalCalories} />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Macro cards */}
          <Animated.View entering={FadeInDown.delay(180).duration(450)}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <MacroTile
                label="Protein"
                grams={today.protein}
                goal={today.proteinGoal}
                icon={MACRO_META[0].icon}
                color={macroColor(colors, 'protein')}
              />
              <MacroTile
                label="Carbs"
                grams={today.carbs}
                goal={today.carbGoal}
                icon={MACRO_META[1].icon}
                color={macroColor(colors, 'carbs')}
              />
              <MacroTile
                label="Fat"
                grams={today.fat}
                goal={today.fatGoal}
                icon={MACRO_META[2].icon}
                color={macroColor(colors, 'fat')}
              />
            </View>
          </Animated.View>

          {/* Daily meals */}
          <Animated.View entering={FadeInDown.delay(240).duration(450)}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <AppText variant="headline">Daily meals</AppText>
              <Pressable onPress={() => router.push('/statistics')}>
                <AppText variant="bodyStrong" color={colors.primaryStrong}>
                  See all
                </AppText>
              </Pressable>
            </View>
          </Animated.View>

          {today.groups.map((group, i) => (
            <Animated.View key={group.type} entering={FadeInDown.delay(280 + i * 60).duration(450)}>
              <MealRow
                group={group}
                onAdd={(type) =>
                  router.push({ pathname: '/food-detail', params: { mealType: type } })
                }
              />
            </Animated.View>
          ))}
        </ScrollView>
      ) : (
        <HomeSkeleton />
      )}
    </ScenicBackground>
  );
}
