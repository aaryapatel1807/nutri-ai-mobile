import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AuthInput } from '@/components/AuthInput';
import { AuthShell } from '@/components/AuthShell';
import { AppText } from '@/components/ui/AppText';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/theme/ThemeContext';
import { spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const { colors } = useTheme();
  const login = useAuthStore((s) => s.login);
  const params = useLocalSearchParams<{ notice?: string; email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up your nutrition journey."
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <AppText variant="body" color={colors.muted}>
            New to NutriAI?
          </AppText>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <AppText variant="bodyStrong" color={colors.primaryStrong}>
                Create an account
              </AppText>
            </Pressable>
          </Link>
        </View>
      }
    >
      <AuthInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        error={!!error}
        returnKeyType="next"
      />
      <AuthInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={!!error}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {params.notice === 'exists' ? (
        <AppText variant="body" color={colors.primaryStrong}>
          That email already has an account — and the password didn&apos;t match. Try signing in again.
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="body" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
      {busy ? (
        <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <AppButton title="Sign in" onPress={submit} />
      )}
    </AuthShell>
  );
}
