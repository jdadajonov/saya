import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ParentLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('parent.home') }} />
      <Tabs.Screen name="children" options={{ title: t('parent.children') }} />
      <Tabs.Screen name="schedule" options={{ title: t('parent.schedule') }} />
      <Tabs.Screen name="rewards" options={{ title: t('parent.rewards') }} />
    </Tabs>
  );
}
