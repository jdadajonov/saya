import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import { useCreateActivity } from '../../../src/features/activities/hooks/use-activities';
import { ActivityForm } from '../../../src/features/activities/components/activity-form';
import type { CreateActivityInput } from '../../../src/features/activities/hooks/use-activities';

export default function CreateActivityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">
          {t('activities.create')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ActivityForm
        childId={childId}
        onSubmit={handleSubmit}
        submitting={createMut.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: '#4F46E5', fontWeight: '300' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1F2937' },
});
