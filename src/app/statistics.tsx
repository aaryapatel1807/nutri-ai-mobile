import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { WeekBarChart, type DayBar } from '@/components/WeekBarChart';
import { colors, radii, shadows, spacing } from '@/theme/tokens';

const WEEK: DayBar[] = [
  { day: 'Mon', pct: 44 },
  { day: 'Tue', pct: 34 },
  { day: 'Wed', pct: 110 },
  { day: 'Thu', pct: 47 },
  { day: 'Fri', pct: 32 },
  { day: 'Sat', pct: 79 },
  { day: 'Sun', pct: 24 },
];

const STATS = [
  { label: 'Exercise', value: '2.0 hours', icon: 'run' as const, tint: '#E4F2DA', color: colors.primaryDark, extra: 'bars' as const },
  { label: 'BPM', value: '86 bpm', icon: 'heart' as const, tint: '#FBE3E3', color: colors.danger, extra: 'pulse' as const },
  { label: 'Weight', value: '68.4 kg', icon: 'scale-bathroom' as const, tint: '#FDEBDD', color: '#E8823C', extra: 'trend' as const },
  { label: 'Water', value: '6 / 8 glasses', icon: 'water' as const, tint: '#DFEAFB', color: '#3B82F6', extra: 'drops' as const },
];

export default function StatisticsScreen() {
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
            <AppText variant="title">Statistic</AppText>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <AppText variant="caption">NutriAI statistics</AppText>

        {/* Calories card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, ...shadows.card }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md }}>
            <AppText variant="body">Calories</AppText>
            <AppText variant="caption">Target: 1920 Kcal</AppText>
          </View>
          <AppText variant="number" style={{ marginBottom: spacing.lg }}>1250 Kcal</AppText>
          <WeekBarChart data={WEEK} />
        </View>

        {/* Stat cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {STATS.map((s) => (
            <View
              key={s.label}
              style={{
                width: '48%',
                flexGrow: 1,
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing.lg,
                gap: 8,
                ...shadows.card,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: s.tint, borderRadius: radii.pill, padding: 8 }}>
                  <MaterialCommunityIcons name={s.icon} size={18} color={s.color} />
                </View>
                <AppText variant="bodyStrong">{s.label}</AppText>
              </View>
              <AppText variant="title">{s.value}</AppText>
              {s.extra === 'drops' && (
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <MaterialCommunityIcons
                      key={i}
                      name={i < 6 ? 'water' : 'water-outline'}
                      size={14}
                      color="#3B82F6"
                    />
                  ))}
                </View>
              )}
              {s.extra === 'bars' && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 24 }}>
                  {[8, 14, 10, 18, 12, 20, 16].map((h, i) => (
                    <View key={i} style={{ width: 8, height: h, backgroundColor: colors.primary, borderRadius: 3 }} />
                  ))}
                </View>
              )}
              {s.extra === 'pulse' && (
                <MaterialCommunityIcons name="heart-pulse" size={22} color={colors.danger} />
              )}
              {s.extra === 'trend' && (
                <MaterialCommunityIcons name="trending-up" size={22} color="#E8823C" />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
