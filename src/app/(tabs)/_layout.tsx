import { Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

const TABS = [
  { name: 'index', label: 'Home', icon: 'home' as const, activeIcon: 'home' as const },
  { name: 'coach', label: 'Coach', icon: 'chatbubble-outline' as const, activeIcon: 'chatbubble' as const },
  { name: 'scan', label: 'Scan', icon: 'scan-outline' as const, activeIcon: 'scan' as const },
  { name: 'workout', label: 'Workout', icon: 'barbell-outline' as const, activeIcon: 'barbell' as const },
];

function NutriTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: spacing.lg,
        right: spacing.lg,
        bottom: Math.max(insets.bottom, 12),
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radii.pill,
        paddingVertical: 10,
        paddingHorizontal: 6,
        shadowColor: '#1B1E23',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 3,
              backgroundColor: focused ? colors.primary : 'transparent',
              borderRadius: radii.pill,
              paddingVertical: 8,
            }}
          >
            <Ionicons
              name={focused ? tab.activeIcon : tab.icon}
              size={22}
              color={focused ? '#fff' : colors.tabInactive}
            />
            <AppText variant="caption" color={focused ? '#fff' : colors.tabInactive}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <NutriTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="coach" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="workout" />
    </Tabs>
  );
}
