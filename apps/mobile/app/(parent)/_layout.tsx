import { Stack } from 'expo-router';

export default function ParentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="children" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="rewards" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="activities" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
