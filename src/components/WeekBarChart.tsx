import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';
import { radii } from '@/theme/tokens';

export interface DayBar {
  /** short day label, e.g. "Mon" */
  day: string;
  /** calories logged that day */
  cal: number;
  /** calorie goal for that day */
  goal: number;
}

interface WeekBarChartProps {
  data: DayBar[];
  height?: number;
}

/**
 * Weekly calorie bar chart: each bar's fill is the day's % of its goal.
 * Goal met → primary, over goal → warn. The parent owns the
 * all-zero empty state.
 */
export function WeekBarChart({ data, height = 150 }: WeekBarChartProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      {data.map((d) => {
        const pct = d.goal > 0 ? Math.round((d.cal / d.goal) * 100) : 0;
        const over = pct > 100;
        const color = over ? colors.warn : pct > 0 ? colors.primary : colors.ringTrack;
        return (
          <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <AppText variant="caption" color={over ? colors.warn : colors.muted}>
              {pct}%
            </AppText>
            <View
              style={{
                width: '100%',
                height: Math.max((Math.min(pct, 120) / 120) * height, 10),
                backgroundColor: color,
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
