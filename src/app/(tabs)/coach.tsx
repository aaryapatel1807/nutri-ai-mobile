import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';

export default function CoachScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <AppText variant="headline">AI Coach</AppText>
      <AppText variant="caption">Coming up next — chat with dish-card answers.</AppText>
    </View>
  );
}
