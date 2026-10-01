import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { MacroRing } from '@/components/MacroRing';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, shadows, spacing } from '@/theme/tokens';

const NUTRITION_ROWS = [
  { label: 'Calories', value: '540 kcal' },
  { label: 'Protein', value: '42 g' },
  { label: 'Carbohydrates', value: '38 g' },
  { label: 'Fat', value: '18 g' },
  { label: 'Fiber', value: '6 g' },
  { label: 'Sugar', value: '4 g' },
];

export default function FoodDetailScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
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
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.card,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText variant="title">Food Detail</AppText>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Food photo placeholder */}
        <View
          style={{
            height: 240,
            borderRadius: radii.lg,
            backgroundColor: '#E5D9BE',
            alignItems: 'center',
            justifyContent: 'center',
            ...shadows.card,
          }}
        >
          <MaterialCommunityIcons name="food-apple" size={72} color="#B99B5F" />
          <AppText variant="caption" color="#8A7A52" style={{ marginTop: 8 }}>
            Grilled Chicken Bowl photo
          </AppText>
        </View>

        {/* Title row */}
        <View style={{ gap: 4 }}>
          <AppText variant="headline">Grilled Chicken Bowl</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: colors.primarySoft, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
              <AppText variant="label" color={colors.primaryDark}>BOWL</AppText>
            </View>
            <AppText variant="caption">540 G</AppText>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <AppText variant="number">540</AppText>
          <AppText variant="body">kcal total</AppText>
        </View>

        {/* Macro rings */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <MacroRing label="Protein" grams={42} goal={60} color={colors.protein} />
          <MacroRing label="Fat" grams={18} goal={30} color={colors.fat} />
          <MacroRing label="Carbs" grams={38} goal={60} color={colors.carbs} />
        </View>

        {/* Nutrition facts */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, ...shadows.card }}>
          <AppText variant="title" style={{ marginBottom: spacing.sm }}>Nutrition facts</AppText>
          {NUTRITION_ROWS.map((row, i) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: spacing.sm,
                borderBottomWidth: i === NUTRITION_ROWS.length - 1 ? 0 : 1,
                borderBottomColor: colors.bg,
              }}
            >
              <AppText variant="body">{row.label}</AppText>
              <AppText variant="bodyStrong">{row.value}</AppText>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={{ gap: spacing.md }}>
          <AppButton title="Log Meal" onPress={() => router.back()} />
          <AppButton title="Update Details" tone="outline" onPress={() => {}} />
        </View>
      </ScrollView>
    </View>
  );
}
