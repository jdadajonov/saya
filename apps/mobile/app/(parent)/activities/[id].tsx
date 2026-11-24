import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
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
  const theme = useTheme();

  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 86_400_000);

  const activitiesQuery = useActivitiesQuery(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return theme.colors.success;
      case 'missed': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[5],
        paddingTop: 60,
        paddingBottom: theme.spacing[4],
        gap: theme.spacing[3],
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
        {activity && (
          <View style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: activity.color,
            borderWidth: theme.borderWidth.thin,
            borderColor: theme.colors.ink,
          }} />
        )}
        <Text style={{
          flex: 1,
          fontSize: theme.textStyles.title.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
        }} accessibilityRole="header" numberOfLines={1}>
          {activity?.title ?? '…'}
        </Text>
      </View>

      {sessionsQuery.isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing[5] }}>
          {sessions.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: theme.spacing[8] }}>
              <Text style={{ fontSize: 48, marginBottom: theme.spacing[3] }}>📅</Text>
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.textSecondary,
              }}>
                {t('activities.noUpcomingSessions')}
              </Text>
            </View>
          )}

          {sessions.map((s) => (
            <View
              key={s.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.card,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                padding: theme.spacing[4],
                marginBottom: theme.spacing[3],
                ...theme.shadows.card,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '700',
                    color: theme.colors.ink,
                  }}>
                    {formatDateTime(s.starts_at)}
                  </Text>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    fontWeight: '600',
                    color: getStatusColor(s.status),
                    marginTop: 2,
                  }}>
                    {t(`activities.status.${s.status}`)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
                  {s.status === 'planned' && (
                    <TouchableOpacity
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.tints.teal,
                        borderWidth: theme.borderWidth.thin,
                        borderColor: theme.colors.ink,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => setConfirmSheet(s)}
                      accessibilityRole="button"
                      accessibilityLabel={t('activities.confirmDone')}
                    >
                      <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.ink }}>✓</Text>
                    </TouchableOpacity>
                  )}

                  {s.status === 'done' && !s.mood && (
                    <TouchableOpacity
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.tints.violet,
                        borderWidth: theme.borderWidth.thin,
                        borderColor: theme.colors.ink,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => setMoodSession(s.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t('activities.moodPrompt')}
                    >
                      <Text style={{ fontSize: 20 }}>😊</Text>
                    </TouchableOpacity>
                  )}

                  {s.mood && (
                    <Text style={{ fontSize: 28 }}>
                      {{ great: '😄', good: '🙂', ok: '😐', bad: '😕', awful: '😩' }[s.mood] ?? '😊'}
                    </Text>
                  )}

                  {s.status === 'planned' && (
                    <TouchableOpacity
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: theme.tints.coral,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => cancelMut.mutate(s.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t('activities.cancelSession')}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.ink }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {moodSession === s.id && (
                <View style={{
                  paddingTop: theme.spacing[3],
                  marginTop: theme.spacing[3],
                  borderTopWidth: theme.borderWidth.thin,
                  borderTopColor: theme.colors.disabled,
                }}>
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
