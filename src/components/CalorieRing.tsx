import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * The hero calorie progress ring from the Home reference:
 * big number in the middle, "of X kcal" underneath, animated arc.
 */
export function CalorieRing({ consumed, goal, size = 148, strokeWidth = 13 }: CalorieRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(consumed / goal, 1), { duration: 900 });
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
      <AppText variant="number" style={{ fontSize: 34, lineHeight: 36 }}>
        {consumed.toLocaleString('en-IN')}
      </AppText>
      <AppText variant="caption">of {goal.toLocaleString('en-IN')} kcal</AppText>
    </View>
  );
}
