import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Link, router } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AuthInput } from '@/components/AuthInput';
import { AuthShell } from '@/components/AuthShell';
import { AppText } from '@/components/ui/AppText';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/theme/ThemeContext';
import { spacing } from '@/theme/tokens';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Fill in your name, email and password.');
      return;
    }
    if (password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const signedIn = await register(name.trim(), email.trim().toLowerCase(), password);
      if (signedIn) {
        router.replace('/(tabs)');
      } else {
        // Email exists but the password didn't match: send them to login
        // with the email prefilled so they can just fix the password.
        router.replace({
          pathname: '/(auth)/login',
          params: { notice: 'exists', email: email.trim().toLowerCase() },
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever. Your data stays yours."
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <AppText variant="body" color={colors.muted}>
            Already have an account?
          </AppText>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <AppText variant="bodyStrong" color={colors.primaryStrong}>
                Sign in
              </AppText>
            </Pressable>
          </Link>
        </View>
      }
    >
      <AuthInput
        placeholder="Your name"
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
        error={!!error}
        returnKeyType="next"
      />
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
        placeholder="Password (10+ characters)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={!!error}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
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
        <AppButton title="Create account" onPress={submit} />
      )}
    </AuthShell>
  );
}
