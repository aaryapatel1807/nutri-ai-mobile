import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii } from '@/theme/tokens';

export interface DayBar {
  day: string;
  pct: number;
}

interface WeekBarChartProps {
  data: DayBar[];
  height?: number;
}

/**
 * Weekly calorie bar chart from the Statistics reference:
 * percentage label above each rounded bar, peak day highlighted.
 */
export function WeekBarChart({ data, height = 150 }: WeekBarChartProps) {
  const max = Math.max(...data.map((d) => d.pct));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      {data.map((d) => {
        const peak = d.pct === max;
        return (
          <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <AppText variant="caption" color={peak ? colors.primaryDark : colors.muted}>
              {d.pct}%
            </AppText>
            <View
              style={{
                width: '100%',
                height: Math.max((d.pct / 120) * height, 14),
                backgroundColor: peak ? colors.primary : '#CBE3AC',
                borderRadius: radii.sm,
              }}
            />
            <AppText variant="caption">{d.day}</AppText>
          </View>
        );
      })}
    </View>
  );
}
