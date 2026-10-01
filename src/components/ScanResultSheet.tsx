import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export interface DetectedFood {
  name: string;
  calories: number;
  confidence: number;
}

interface Props {
  foods: DetectedFood[];
  totalCalories: number;
  /** when true, show a spinner instead of the log button */
  logging: boolean;
  logged: boolean;
  onSelect: (food: DetectedFood) => void;
  onLog: () => void;
  onClose: () => void;
}

/**
 * Bottom sheet shown after a successful food detection (Scan / Library modes).
 * Lists each detected food with calories + confidence; tapping a food opens
 * its detail screen, and "Log meal" logs everything at once.
 */
export function ScanResultSheet({
  foods,
  totalCalories,
  logging,
  logged,
  onSelect,
  onLog,
  onClose,
}: Props) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '62%',
        backgroundColor: '#2C3B28',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
      }}
    >
      <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#5A6B55', marginBottom: spacing.md }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppText variant="title" color="#fff">Detected foods</AppText>
          <AppText variant="caption" color="#C9D4C2">
            {foods.length} {foods.length === 1 ? 'item' : 'items'} · {Math.round(totalCalories)} kcal total
          </AppText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss results"
          hitSlop={12}
        >
          <Ionicons name="close-circle" size={30} color="#8FA084" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {foods.map((food, i) => (
          <Pressable
            key={`${food.name}-${i}`}
            onPress={() => onSelect(food)}
            accessibilityRole="button"
            accessibilityLabel={`View ${food.name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#22301F',
              borderRadius: radii.md,
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radii.md,
                backgroundColor: '#1A241A',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="fast-food-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" color="#fff" numberOfLines={1}>{food.name}</AppText>
              <AppText variant="caption" color="#C9D4C2">
                {Math.round(food.confidence * 100)}% confidence
              </AppText>
            </View>
            <AppText variant="numberSm" color="#fff">{Math.round(food.calories)}</AppText>
            <AppText variant="caption" color="#8FA084" style={{ marginLeft: -spacing.sm }}>kcal</AppText>
            <Ionicons name="chevron-forward" size={20} color="#8FA084" />
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        onPress={onLog}
        disabled={logging || logged}
        accessibilityRole="button"
        accessibilityLabel="Log detected foods as a meal"
        style={{
          marginTop: spacing.md,
          backgroundColor: logged ? '#3E4F3A' : colors.primary,
          borderRadius: radii.md,
          paddingVertical: spacing.md,
          alignItems: 'center',
          opacity: logging || logged ? 0.85 : 1,
        }}
      >
        <AppText variant="bodyStrong" color="#fff">
          {logging ? 'Logging…' : logged ? 'Logged to your diary' : 'Log meal'}
        </AppText>
      </Pressable>
    </View>
  );
}
