import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../ui/theme-provider';

const TABS = [
  { id: 'goals', icon: '🚩', label: 'Цели', route: '/(parent)/goals' },
  { id: 'rewards', icon: '🎁', label: 'Награды', route: '/(parent)/rewards' },
];

interface ParentTabBarProps {
  activeTab?: 'goals' | 'rewards';
}

export function ParentTabBar({ activeTab }: ParentTabBarProps) {
  const router = useRouter();
  const theme = useTheme();

  const handleTabPress = (tabId: string, route: string) => {
    if (tabId !== activeTab) {
      router.replace(route as never);
    }
  };

  const handleHomePress = () => {
    router.replace('/(parent)' as never);
  };

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderTopWidth: theme.borderWidth.regular,
      borderTopColor: theme.colors.ink,
      paddingBottom: 20,
      paddingTop: 10,
    }}>
      {/* Home button */}
      <TouchableOpacity
        style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
        onPress={handleHomePress}
      >
        {!activeTab ? (
          <View style={{
            backgroundColor: theme.colors.secondary,
            borderRadius: theme.borderRadius.full,
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            ...theme.shadows.chip,
          }}>
            <Text style={{ fontSize: 18 }}>🏠</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.ink }}>Дети</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 22 }}>🏠</Text>
            <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Дети</Text>
          </View>
        )}
      </TouchableOpacity>

      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
            onPress={() => handleTabPress(tab.id, tab.route)}
          >
            {isActive ? (
              <View style={{
                backgroundColor: theme.colors.secondary,
                borderRadius: theme.borderRadius.full,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                ...theme.shadows.chip,
              }}>
                <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.ink }}>{tab.label}</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: 22 }}>{tab.icon}</Text>
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>{tab.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
