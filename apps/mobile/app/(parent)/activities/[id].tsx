import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  useActivitiesQuery,
  useSessionsQuery,
  useConfirmSession,
  useRecordMood,
  useCancelSession,
} from '../../../src/features/activities/hooks/use-activities';
import type { SessionRow, ActivityRow } from '../../../src/features/activities/hooks/use-activities';
import { SessionConfirmSheet } from '../../../src/features/activities/components/session-confirm-sheet';
import { MoodPicker } from '../../../src/features/activities/components/mood-picker';
import type { MoodValue } from '../../../src/features/activities/components/mood-picker';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${days[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1} ${h}:${m}`;
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 86_400_000);

  // Get activity by id from query cache
  const activitiesQuery = useActivitiesQuery(null); // just to find from cache
  const activity = activitiesQuery.data?.find((a) => a.id === id) as ActivityRow | undefined;

  const sessionsQuery = useSessionsQuery(activity?.child_id ?? null, now, twoWeeksOut);
  const sessions = (sessionsQuery.data ?? []).filter((s) => s.activity_id === id);

  const confirmMut = useConfirmSession();
  const moodMut = useRecordMood();
  const cancelMut = useCancelSession();

  const [confirmSheet, setConfirmSheet] = useState<SessionRow | null>(null);
  const [moodSession, setMoodSession] = useState<string | null>(null);

  const handleConfirm = (status: 'done' | 'missed') => {
    if (!confirmSheet) return;
    confirmMut.mutate({ sessionId: confirmSheet.id, status });
    setConfirmSheet(null);
  };

  const handleMood = (sessionId: string, mood: MoodValue) => {
    moodMut.mutate({ sessionId, mood });
    setMoodSession(null);
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
        {activity && (
          <View style={[styles.colorDot, { backgroundColor: activity.color }]} />
        )}
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {activity?.title ?? '…'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {sessionsQuery.isLoading ? (
        <View style={styles.center}><ActivityIndicator color="#4F46E5" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {sessions.length === 0 && (
            <Text style={styles.empty}>{t('activities.noUpcomingSessions')}</Text>
          )}
          {sessions.map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardDate}>{formatDateTime(s.starts_at)}</Text>
                <Text style={[styles.cardStatus, { color: s.status === 'done' ? '#10B981' : s.status === 'missed' ? '#EF4444' : '#6B7280' }]}>
                  {t(`activities.status.${s.status}`)}
                </Text>
              </View>

              <View style={styles.cardActions}>
                {s.status === 'planned' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setConfirmSheet(s)}
                    accessibilityRole="button"
                    accessibilityLabel={t('activities.confirmDone')}
                  >
                    <Text style={styles.actionBtnText}>✓</Text>
                  </TouchableOpacity>
                )}

                {s.status === 'done' && !s.mood && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnMood]}
                    onPress={() => setMoodSession(s.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('activities.moodPrompt')}
                  >
                    <Text style={styles.actionBtnText}>😊</Text>
                  </TouchableOpacity>
                )}

                {s.mood && (
                  <Text style={styles.moodEmoji}>
                    {{ great: '😄', good: '🙂', ok: '😐', bad: '😕', awful: '😩' }[s.mood] ?? '😊'}
                  </Text>
                )}

                {s.status === 'planned' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnCancel]}
                    onPress={() => cancelMut.mutate(s.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('activities.cancelSession')}
                  >
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {moodSession === s.id && (
                <View style={styles.moodPickerWrapper}>
                  <MoodPicker
                    value={s.mood as MoodValue | null}
                    onSelect={(mood) => handleMood(s.id, mood)}
                  />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <SessionConfirmSheet
        session={confirmSheet}
        onConfirm={handleConfirm}
        onDismiss={() => setConfirmSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: '#4F46E5', fontWeight: '300' },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1F2937' },
  empty: { textAlign: 'center', color: '#9CA3AF', fontSize: 15, marginTop: 40 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardLeft: { flex: 1, gap: 2 },
  cardDate: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  cardStatus: { fontSize: 13, fontWeight: '500' },
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnMood: { backgroundColor: '#EEF2FF' },
  actionBtnCancel: { backgroundColor: '#FEE2E2' },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  moodEmoji: { fontSize: 24 },
  moodPickerWrapper: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
});
