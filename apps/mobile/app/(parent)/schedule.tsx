import { useState } from 'react';
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
import { useAuthStore } from '../../src/features/family/stores/auth-store';
import {
  useSessionsQuery,
  useConfirmSession,
  useCancelSession,
} from '../../src/features/activities/hooks/use-activities';
import type { SessionRow, ActivityRow } from '../../src/features/activities/hooks/use-activities';
import { WeeklyStrip } from '../../src/features/activities/components/weekly-strip';
import { SessionConfirmSheet } from '../../src/features/activities/components/session-confirm-sheet';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const STATUS_ICONS: Record<string, string> = {
  planned: '○',
  done: '✓',
  missed: '✕',
  cancelled: '—',
};

const STATUS_COLORS: Record<string, string> = {
  planned: '#6B7280',
  done: '#10B981',
  missed: '#EF4444',
  cancelled: '#D1D5DB',
};

export default function ScheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { children } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [confirmSession, setConfirmSession] = useState<SessionRow | null>(null);

  const weekStart = getWeekStart(selectedDate);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);

  // Collect sessions for all children
  const childIds = children.map((c) => c.id);
  const firstChildId = childIds[0] ?? null;

  // We query per child. For MVP, fetch for first child or all children in sequence.
  // A cleaner solution would be a combined query; for now we show for the selected child.
  const sessionsQuery = useSessionsQuery(firstChildId, weekStart, weekEnd);
  const confirmMut = useConfirmSession();
  const cancelMut = useCancelSession();

  const allSessions = sessionsQuery.data ?? [];
  const daySessions = allSessions.filter((s) => {
    const d = new Date(s.starts_at);
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate() &&
      s.status !== 'cancelled'
    );
  });

  const handleConfirm = (status: 'done' | 'missed') => {
    if (!confirmSession) return;
    confirmMut.mutate({ sessionId: confirmSession.id, status });
    setConfirmSession(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('parent.schedule')}
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(parent)/activities/create')}
          accessibilityRole="button"
          accessibilityLabel={t('activities.create')}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Weekly strip */}
      <WeeklyStrip
        weekStart={weekStart}
        sessions={allSessions}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <View style={styles.divider} />

      {/* Sessions list */}
      {sessionsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4F46E5" />
        </View>
      ) : daySessions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{t('activities.noActivitiesToday')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {daySessions.map((session) => {
            const activity = session.activity as ActivityRow | undefined;
            return (
              <View key={session.id} style={styles.sessionCard}>
                <View style={[styles.sessionAccent, { backgroundColor: activity?.color ?? '#4F46E5' }]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{activity?.title}</Text>
                  <Text style={styles.sessionTime}>
                    {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
                    {activity?.place ? ` · ${activity.place}` : ''}
                  </Text>
                </View>
                <View style={styles.sessionActions}>
                  <Text style={[styles.statusIcon, { color: STATUS_COLORS[session.status] ?? '#6B7280' }]}>
                    {STATUS_ICONS[session.status] ?? '○'}
                  </Text>
                  {session.status === 'planned' && (
                    <TouchableOpacity
                      onPress={() => setConfirmSession(session)}
                      style={styles.confirmBtn}
                      accessibilityRole="button"
                      accessibilityLabel={t('activities.confirmDone')}
                    >
                      <Text style={styles.confirmBtnText}>?</Text>
                    </TouchableOpacity>
                  )}
                  {session.status === 'planned' && (
                    <TouchableOpacity
                      onPress={() => cancelMut.mutate(session.id)}
                      style={styles.cancelBtn}
                      accessibilityRole="button"
                      accessibilityLabel={t('activities.cancelSession')}
                    >
                      <Text style={styles.cancelBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <SessionConfirmSheet
        session={confirmSession}
        onConfirm={handleConfirm}
        onDismiss={() => setConfirmSession(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 22, color: '#FFFFFF', fontWeight: '300' },
  divider: { height: 1, backgroundColor: '#E5E7EB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 15, color: '#9CA3AF' },
  list: { padding: 16, gap: 10 },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sessionAccent: { width: 5, alignSelf: 'stretch' },
  sessionInfo: { flex: 1, padding: 14, gap: 2 },
  sessionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  sessionTime: { fontSize: 13, color: '#6B7280' },
  sessionActions: { flexDirection: 'row', alignItems: 'center', paddingRight: 10, gap: 6 },
  statusIcon: { fontSize: 18, fontWeight: '700', width: 24, textAlign: 'center' },
  confirmBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#4F46E5' },
  cancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
});
