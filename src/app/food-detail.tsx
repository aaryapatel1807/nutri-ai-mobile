import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScenicBackground } from '@/components/ui/ScenicBackground';
import { apiFetch, ApiError, AuthExpiredError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeContext';
import { radii, shadows, spacing } from '@/theme/tokens';
import { guessMealType, MEAL_TYPES, type MealType } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

const toNum = (v: string | undefined): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function isMealType(v: string | undefined): v is MealType {
  return (MEAL_TYPES as string[]).includes(v ?? '');
}

async function handleAuthExpired(): Promise<void> {
  await useAuthStore.getState().logout();
  router.replace('/(auth)/login');
}

interface GoalSet {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}

const FALLBACK_GOALS: GoalSet = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbGoal: 250,
  fatGoal: 65,
};

/* ------------------------------------------------------------------ */
/* Themed macro ring tile (2x2 grid)                                  */
/* ------------------------------------------------------------------ */

function RingTile({
  label,
  value,
  unit,
  goal,
  color,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  goal: number;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const { colors } = useTheme();
  const size = 88;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / Math.max(goal, 1), 1);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        gap: 6,
        ...shadows.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MaterialCommunityIcons name={icon} size={15} color={color} />
        <AppText variant="caption">{label}</AppText>
      </View>
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
        <AppText variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
          {Math.round(value)}
          {unit}
        </AppText>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Meal type chips                                                    */
/* ------------------------------------------------------------------ */

function MealTypeChips({
  selected,
  onSelect,
}: {
  selected: MealType;
  onSelect: (t: MealType) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
      {MEAL_TYPES.map((t) => {
        const active = t === selected;
        return (
          <Pressable
            key={t}
            onPress={() => onSelect(t)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Log as ${t}`}
            style={({ pressed }) => ({
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radii.pill,
              backgroundColor: active ? colors.primary : colors.input,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.inputBorder,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <AppText variant="bodyStrong" color={active ? '#fff' : colors.ink}>
              {t}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Form input                                                         */
/* ------------------------------------------------------------------ */

function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <AppText variant="label" color={colors.muted}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        returnKeyType="next"
        style={{
          backgroundColor: colors.input,
          borderWidth: 1,
          borderColor: colors.inputBorder,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontFamily: 'Inter_400Regular',
          fontSize: 15,
          color: colors.ink,
        }}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */

export default function FoodDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  const detectedName = first(params.name);
  const detected = !!detectedName && detectedName.trim().length > 0;

  const detectedFood = useMemo(
    () =>
      detected
        ? {
            name: detectedName!.trim(),
            calories: toNum(first(params.calories)),
            protein: toNum(first(params.protein)),
            carbs: toNum(first(params.carbs)),
            fat: toNum(first(params.fat)),
          }
        : null,
    // params is a stable-ish object from the router; stringify the fields we read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detected, detectedName, params.name, params.calories, params.protein, params.carbs, params.fat],
  );

  /* shared */
  const paramMealType = first(params.mealType);
  const [mealType, setMealType] = useState<MealType>(
    isMealType(paramMealType) ? paramMealType : guessMealType(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  /* manual-mode form state */
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  /* daily goals for the rings (detected mode) */
  const [goals, setGoals] = useState<GoalSet>(FALLBACK_GOALS);
  useEffect(() => {
    if (!detected) return;
    let alive = true;
    apiFetch<Partial<GoalSet>>('/api/stats')
      .then((s) => {
        if (!alive) return;
        setGoals({
          calorieGoal: s.calorieGoal && s.calorieGoal > 0 ? s.calorieGoal : FALLBACK_GOALS.calorieGoal,
          proteinGoal: s.proteinGoal && s.proteinGoal > 0 ? s.proteinGoal : FALLBACK_GOALS.proteinGoal,
          carbGoal: s.carbGoal && s.carbGoal > 0 ? s.carbGoal : FALLBACK_GOALS.carbGoal,
          fatGoal: s.fatGoal && s.fatGoal > 0 ? s.fatGoal : FALLBACK_GOALS.fatGoal,
        });
      })
      .catch((err) => {
        if (err instanceof AuthExpiredError) void handleAuthExpired();
      });
    return () => {
      alive = false;
    };
  }, [detected]);

  const logMeal = useCallback(
    async (payload: {
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      mealType: MealType;
    }) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      setError(null);
      try {
        await apiFetch('/api/meals', { method: 'POST', body: payload });
        router.back();
      } catch (err) {
        if (err instanceof AuthExpiredError) {
          await handleAuthExpired();
          return;
        }
        setError(
          err instanceof ApiError ? err.message : 'Could not log the meal. Please try again.',
        );
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [],
  );

  const logDetected = useCallback(() => {
    if (!detectedFood) return;
    void logMeal({ ...detectedFood, mealType });
  }, [detectedFood, logMeal, mealType]);

  const logManual = useCallback(() => {
    const trimmed = name.trim();
    const kcal = Number(calories);
    if (!trimmed) {
      setError('Please give the meal a name.');
      return;
    }
    if (!Number.isFinite(kcal) || kcal <= 0) {
      setError('Please enter the calories for this meal.');
      return;
    }
    void logMeal({
      name: trimmed,
      calories: kcal,
      protein: Math.max(0, Number(protein) || 0),
      carbs: Math.max(0, Number(carbs) || 0),
      fat: Math.max(0, Number(fat) || 0),
      mealType,
    });
  }, [name, calories, protein, carbs, fat, mealType, logMeal]);

  const nutritionRows = detectedFood
    ? [
        { label: 'Calories', value: `${Math.round(detectedFood.calories)} kcal` },
        { label: 'Protein', value: `${Math.round(detectedFood.protein)} g` },
        { label: 'Carbohydrates', value: `${Math.round(detectedFood.carbs)} g` },
        { label: 'Fat', value: `${Math.round(detectedFood.fat)} g` },
      ]
    : [];

  return (
    <ScenicBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12),
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(350)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{
                width: 44,
                height: 44,
                borderRadius: radii.pill,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadows.card,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.ink} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <AppText variant="title">{detected ? 'Food Detail' : 'Quick log'}</AppText>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </Animated.View>

        {detected && detectedFood ? (
          <>
            {/* Title */}
            <Animated.View entering={FadeInDown.delay(60).duration(400)}>
              <GlassCard>
                <View style={{ gap: 6 }}>
                  <AppText variant="headline">{detectedFood.name}</AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <AppText variant="number" style={{ fontSize: 38, lineHeight: 42 }}>
                      {Math.round(detectedFood.calories).toLocaleString('en-GB')}
                    </AppText>
                    <AppText variant="body" color={colors.muted}>
                      kcal total
                    </AppText>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>

            {/* 2x2 macro tiles with rings */}
            <Animated.View entering={FadeInDown.delay(120).duration(400)}>
              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <RingTile
                    label="Protein"
                    value={detectedFood.protein}
                    unit="g"
                    goal={goals.proteinGoal}
                    color={colors.protein}
                    icon="food-drumstick"
                  />
                  <RingTile
                    label="Carbs"
                    value={detectedFood.carbs}
                    unit="g"
                    goal={goals.carbGoal}
                    color={colors.carbs}
                    icon="food-croissant"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <RingTile
                    label="Fat"
                    value={detectedFood.fat}
                    unit="g"
                    goal={goals.fatGoal}
                    color={colors.fat}
                    icon="water"
                  />
                  <RingTile
                    label="Calories"
                    value={detectedFood.calories}
                    unit=" kcal"
                    goal={goals.calorieGoal}
                    color={colors.primary}
                    icon="fire"
                  />
                </View>
              </View>
            </Animated.View>

            {/* Nutrition facts */}
            <Animated.View entering={FadeInDown.delay(180).duration(400)}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  ...shadows.card,
                }}
              >
                <AppText variant="title" style={{ marginBottom: spacing.sm }}>
                  Nutrition facts
                </AppText>
                {nutritionRows.map((row, i) => (
                  <View
                    key={row.label}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: spacing.sm,
                      borderBottomWidth: i === nutritionRows.length - 1 ? 0 : 1,
                      borderBottomColor: colors.inputBorder,
                    }}
                  >
                    <AppText variant="body">{row.label}</AppText>
                    <AppText variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
                      {row.value}
                    </AppText>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Meal type */}
            <Animated.View entering={FadeInDown.delay(240).duration(400)}>
              <View style={{ gap: spacing.sm }}>
                <AppText variant="label" color={colors.muted}>
                  Log as
                </AppText>
                <MealTypeChips selected={mealType} onSelect={setMealType} />
              </View>
            </Animated.View>

            {error ? (
              <AppText variant="body" color={colors.danger}>
                {error}
              </AppText>
            ) : null}

            <AppButton
              title={saving ? 'Logging…' : 'Log meal'}
              onPress={logDetected}
              accessibilityLabel="Log meal"
            />
          </>
        ) : (
          <>
            {/* Manual quick-log form */}
            <Animated.View entering={FadeInDown.delay(60).duration(400)}>
              <GlassCard>
                <View style={{ gap: spacing.md }}>
                  <Field
                    label="Meal name"
                    value={name}
                    onChange={setName}
                    placeholder="e.g. Paneer tikka wrap"
                  />
                  <Field
                    label="Calories (kcal)"
                    value={calories}
                    onChange={setCalories}
                    placeholder="e.g. 420"
                    numeric
                  />
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <Field
                      label="Protein (g)"
                      value={protein}
                      onChange={setProtein}
                      placeholder="0"
                      numeric
                    />
                    <Field
                      label="Carbs (g)"
                      value={carbs}
                      onChange={setCarbs}
                      placeholder="0"
                      numeric
                    />
                    <Field label="Fat (g)" value={fat} onChange={setFat} placeholder="0" numeric />
                  </View>
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).duration(400)}>
              <View style={{ gap: spacing.sm }}>
                <AppText variant="label" color={colors.muted}>
                  Log as
                </AppText>
                <MealTypeChips selected={mealType} onSelect={setMealType} />
              </View>
            </Animated.View>

            {error ? (
              <AppText variant="body" color={colors.danger}>
                {error}
              </AppText>
            ) : null}

            <AppButton
              title={saving ? 'Logging…' : 'Log meal'}
              onPress={logManual}
              accessibilityLabel="Log meal"
            />
          </>
        )}
      </ScrollView>
    </ScenicBackground>
  );
}
