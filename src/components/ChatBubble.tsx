import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

export type ChatRole = 'user' | 'assistant';

interface ChatBubbleProps {
  role: ChatRole;
  content: string;
  /** Failed coach reply: shows a retry affordance. */
  failed?: boolean;
  onRetry?: () => void;
}

/**
 * Chat bubble — user messages go right on the green accent,
 * coach messages go left as frosted glass.
 */
export function ChatBubble({ role, content, failed, onRetry }: ChatBubbleProps) {
  const { colors } = useTheme();
  const isUser = role === 'user';

  const opacity = useSharedValue(0);
  const dy = useSharedValue(10);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 260 });
    dy.value = withTiming(0, { duration: 260 });
  }, [opacity, dy]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: dy.value }],
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '84%',
        },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.glass,
            borderColor: isUser ? 'transparent' : colors.glassBorder,
            borderBottomRightRadius: isUser ? 6 : radii.md,
            borderBottomLeftRadius: isUser ? radii.md : 6,
          },
        ]}
      >
        <AppText variant="body" color={isUser ? '#fff' : colors.ink}>
          {content}
        </AppText>
        {failed && onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry sending"
            style={({ pressed }) => [styles.retry, { opacity: pressed ? 0.7 : 1 }]}
          >
            <AppText variant="label" color={colors.primaryStrong}>
              Try again
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Bouncing three-dot "coach is thinking" indicator. */
export function TypingBubble() {
  const { colors } = useTheme();

  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);
  const d3 = useSharedValue(0);

  useEffect(() => {
    [d1, d2, d3].forEach((d, i) => {
      d.value = withDelay(
        i * 130,
        withRepeat(
          withSequence(
            withTiming(-4, { duration: 280 }),
            withTiming(0, { duration: 280 }),
          ),
          -1,
          true,
        ),
      );
    });
  }, [d1, d2, d3]);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: d1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: d2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: d3.value }] }));

  return (
    <View
      style={[
        styles.bubble,
        {
          alignSelf: 'flex-start',
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
          borderRadius: radii.md,
          borderBottomLeftRadius: 6,
        },
      ]}
    >
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { backgroundColor: colors.primaryStrong }, s1]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.primaryStrong }, s2]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.primaryStrong }, s3]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: '100%',
  },
  retry: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
