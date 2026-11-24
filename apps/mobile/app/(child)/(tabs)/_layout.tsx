import { Tabs, usePathname, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../src/ui/theme-provider';

function CustomTabBar() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { route: '/(child)/(tabs)', icon: '🏠', label: 'Сегодня' },
    { route: '/(child)/(tabs)/goals', icon: '🚩', label: 'Цели' },
    { route: '/(child)/(tabs)/rewards', icon: '🎁', label: 'Награды' },
  ];

  const getIsActive = (route: string) => {
    if (route === '/(child)/(tabs)') {
      return pathname === '/' || pathname === '/(child)' || pathname === '/(child)/(tabs)';
    }
    return pathname.includes(route.replace('/(child)/(tabs)', ''));
  };

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: theme.colors.ink,
      paddingTop: 12,
      paddingBottom: 28,
      paddingHorizontal: 16,
      gap: 8,
    }}>
      {tabs.map((tab) => {
        const isFocused = getIsActive(tab.route);

        return (
          <TouchableOpacity
            key={tab.route}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => router.replace(tab.route as any)}
            style={{
              flex: 1,
              height: 56,
              backgroundColor: isFocused ? theme.tints.sun : theme.colors.surface,
              borderRadius: 28,
              borderWidth: 2,
              borderColor: theme.colors.ink,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
            <Text style={{
              fontSize: 15,
              fontWeight: '700',
              color: theme.colors.ink,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ChildTabsLayout() {
  return (
    <Tabs
      tabBar={() => <CustomTabBar />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="rewards" />
    </Tabs>
  );
}
