import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import { useChildrenQuery } from '../../../src/features/family/hooks/use-family';

export default function ChildrenListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const family = useAuthStore((s) => s.family);
  const { data: children = [], isLoading } = useChildrenQuery(family?.id ?? null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">
          {t('parent.children')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(parent)/children/add')}
          accessibilityRole="button"
          accessibilityLabel={t('parent.addChild')}
        >
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {isLoading && <ActivityIndicator color="#4F46E5" style={{ marginTop: 32 }} />}

        {children.map((child) => (
          <View key={child.id} style={styles.childRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {child.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{child.displayName}</Text>
              <Text style={styles.meta}>
                {child.birthYear} · {child.ageBand}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
  backButton: { padding: 4 },
  backText: { fontSize: 28, color: '#4F46E5', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  addText: { fontSize: 28, color: '#4F46E5', fontWeight: '300' },
  list: { padding: 20, gap: 10 },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  meta: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
});
