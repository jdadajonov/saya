import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/features/family/stores/auth-store';
import { useDeleteFamily } from '../../src/features/family/hooks/use-family';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const deleteFamily = useDeleteFamily();
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('parent.deleteAccount'),
      t('parent.confirmDeleteAccount'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteFamily.mutateAsync();
            } catch (err: unknown) {
              setDeleting(false);
              Alert.alert(t('common.error'), (err as Error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">
          {t('parent.settings')}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.row}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel={t('auth.signOut')}
        >
          <Text style={styles.rowText}>{t('auth.signOut')}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.dangerRow}
          onPress={handleDeleteAccount}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel={t('parent.deleteAccount')}
        >
          {deleting ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={styles.dangerText}>{t('parent.deleteAccount')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backText: { fontSize: 28, color: '#4F46E5', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  content: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rowText: { fontSize: 16, color: '#1F2937' },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 20 },
  dangerRow: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  dangerText: { fontSize: 16, color: '#EF4444', fontWeight: '500' },
});
