import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScenicBackground } from '@/components/ui/ScenicBackground';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared frame for login / register: scenic wash, centered glass card,
 * NutriAI wordmark, Poppins title.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <ScenicBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
            paddingHorizontal: spacing.xl,
            gap: spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: radii.pill,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="food-apple" size={38} color="#fff" />
            </View>
            <AppText variant="display" style={{ fontSize: 30 }}>
              NutriAI
            </AppText>
            <AppText variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
              Your AI nutrition companion
            </AppText>
          </View>

          <GlassCard>
            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              <AppText variant="headline">{title}</AppText>
              <AppText variant="body" color={colors.muted}>
                {subtitle}
              </AppText>
            </View>
            <View style={{ gap: spacing.md }}>{children}</View>
          </GlassCard>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScenicBackground>
  );
}
