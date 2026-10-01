import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroCard } from '@/components/MacroCard';
import { MealRow } from '@/components/MealRow';
import { useAppStore } from '@/store/useAppStore';
import { colors, radii, shadows, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { day } = useAppStore();
  const remaining = day.kcalGoal - day.kcalConsumed;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 12),
        paddingHorizontal: spacing.lg,
        paddingBottom: 120,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
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
          <AppText variant="title" color={colors.primaryDark}>
            {day.userName.charAt(0)}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="body">{day.greeting}</AppText>
          <AppText variant="headline">{day.userName}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Calendar"
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
          <Ionicons name="calendar-outline" size={20} color={colors.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
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
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <AppText variant="display">Let&apos;s Track Your{'\n'}Progress</AppText>

      {/* Hero calorie card */}
      <View
        style={{
          backgroundColor: colors.heroTint,
          borderRadius: radii.lg,
          padding: spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          ...shadows.card,
        }}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="fire" size={18} color={colors.primaryDark} />
            <AppText variant="bodyStrong">Calories Today</AppText>
          </View>
          <AppText variant="body">{day.kcalConsumed.toLocaleString('en-IN')} kcal consumed</AppText>
          <AppText variant="bodyStrong" color={colors.primaryDark}>
            {remaining.toLocaleString('en-IN')} kcal remaining to goal
          </AppText>
        </View>
        <CalorieRing consumed={day.kcalConsumed} goal={day.kcalGoal} />
      </View>

      {/* Macro cards */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <MacroCard label="Protein" grams={day.protein} goal={day.proteinGoal} />
        <MacroCard label="Carbs" grams={day.carbs} goal={day.carbsGoal} />
        <MacroCard label="Fat" grams={day.fat} goal={day.fatGoal} />
      </View>

      {/* Daily meals */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <AppText variant="headline">Daily meals</AppText>
        <AppText variant="bodyStrong" color={colors.primaryDark}>
          See all
        </AppText>
      </View>

      {day.meals.map((meal) => (
        <MealRow key={meal.id} meal={meal} onAdd={() => {}} />
      ))}
    </ScrollView>
  );
}
