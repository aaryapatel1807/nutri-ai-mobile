import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScenicBackground } from '@/components/ui/ScenicBackground';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

const MODES = [
  { id: 'light' as const, label: 'Light', icon: 'sunny-outline' as const },
  { id: 'dark' as const, label: 'Dark', icon: 'moon-outline' as const },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, mode, setMode } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <ScenicBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12),
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
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
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText variant="title">Profile</AppText>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radii.pill,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText variant="title" color="#fff">
                {(user?.name ?? 'N').charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="title">{user?.name ?? 'NutriAI user'}</AppText>
              <AppText variant="caption">{user?.email ?? ''}</AppText>
            </View>
          </View>
        </GlassCard>

        <GlassCard>
          <AppText variant="title" style={{ marginBottom: spacing.md }}>
            Appearance
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setMode(m.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${m.label} theme`}
                  accessibilityState={{ selected: active }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: spacing.md,
                    borderRadius: radii.md,
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.inputBorder,
                  }}
                >
                  <Ionicons
                    name={m.icon}
                    size={20}
                    color={active ? '#fff' : colors.muted}
                  />
                  <AppText variant="bodyStrong" color={active ? '#fff' : colors.ink}>
                    {m.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <AppText variant="caption" style={{ marginTop: spacing.sm }}>
            Your choice is remembered on this device.
          </AppText>
        </GlassCard>

        <AppButton
          title="Sign out"
          tone="outline"
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
        />
      </ScrollView>
    </ScenicBackground>
  );
}
