import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';

export default function ScanScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <AppText variant="headline">Food Scanner</AppText>
      <AppText variant="caption">Coming up next — viewfinder with Scan / Barcode / Label / Library.</AppText>
    </View>
  );
}
