import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import { useCreateActivity } from '../../../src/features/activities/hooks/use-activities';
import { ActivityForm } from '../../../src/features/activities/components/activity-form';
import type { CreateActivityInput } from '../../../src/features/activities/hooks/use-activities';

export default function CreateActivityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { children } = useAuthStore();
  const createMut = useCreateActivity();

  const childId = children[0]?.id ?? '';

  const handleSubmit = (input: CreateActivityInput) => {
    createMut.mutate(input, {
      onSuccess: () => router.back(),
      onError: () => Alert.alert(t('common.error'), t('common.retry')),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[5],
        paddingTop: 60,
        paddingBottom: theme.spacing[4],
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.surface,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.chip,
          }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={{ fontSize: 20, color: theme.colors.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: theme.textStyles.title.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
        }} accessibilityRole="header">
          {t('activities.create')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ActivityForm
        childId={childId}
        onSubmit={handleSubmit}
        submitting={createMut.isPending}
      />
    </View>
  );
}
