import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ChildLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('child.today') }} />
      <Tabs.Screen name="missions" options={{ title: t('child.missions') }} />
      <Tabs.Screen name="goals" options={{ title: t('child.goals') }} />
      <Tabs.Screen name="rewards" options={{ title: t('child.rewards') }} />
    </Tabs>
  );
}
