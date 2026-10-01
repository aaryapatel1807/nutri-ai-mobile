import { forwardRef } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

interface AuthInputProps extends TextInputProps {
  error?: boolean;
}

/**
 * Theme-aware text field used on the auth screens.
 */
export const AuthInput = forwardRef<TextInput, AuthInputProps>(function AuthInput(
  { error, style, ...rest },
  ref,
) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderRadius: radii.md,
        backgroundColor: colors.input,
        borderWidth: 1.5,
        borderColor: error ? colors.danger : colors.inputBorder,
      }}
    >
      <TextInput
        ref={ref}
        placeholderTextColor={colors.faint}
        selectionColor={colors.primary}
        style={[
          {
            paddingHorizontal: spacing.lg,
            paddingVertical: 15,
            fontSize: 16,
            fontFamily: 'Inter_400Regular',
            color: colors.ink,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
});
