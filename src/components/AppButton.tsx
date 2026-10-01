import { Pressable, type PressableProps } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

interface AppButtonProps extends Pick<PressableProps, 'onPress' | 'accessibilityLabel'> {
  title: string;
  tone?: 'primary' | 'dark' | 'outline';
}

/**
 * Full-width rounded button used across the app.
 */
export function AppButton({ title, tone = 'primary', onPress, accessibilityLabel }: AppButtonProps) {
  const styles = {
    primary: { bg: colors.primary, fg: '#fff', border: 'transparent' },
    dark: { bg: colors.ink, fg: '#fff', border: 'transparent' },
    outline: { bg: 'transparent', fg: colors.ink, border: colors.ink },
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => ({
        backgroundColor: styles.bg,
        borderColor: styles.border,
        borderWidth: tone === 'outline' ? 1.5 : 0,
        borderRadius: radii.pill,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <AppText variant="bodyStrong" color={styles.fg}>
        {title}
      </AppText>
    </Pressable>
  );
}
