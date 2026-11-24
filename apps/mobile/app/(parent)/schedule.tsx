import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/ui/theme-provider';
import { useAuthStore } from '../../src/features/family/stores/auth-store';
import {
  useSessionsQuery,
  useConfirmSession,
  useCancelSession,
} from '../../src/features/activities/hooks/use-activities';
import type { SessionRow, ActivityRow } from '../../src/features/activities/hooks/use-activities';
import { WeeklyStrip } from '../../src/features/activities/components/weekly-strip';
import { SessionConfirmSheet } from '../../src/features/activities/components/session-confirm-sheet';
import { ParentTabBar } from '../../src/features/family/components/parent-tab-bar';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function ScheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { children } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [confirmSession, setConfirmSession] = useState<SessionRow | null>(null);

  const weekStart = getWeekStart(selectedDate);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);

  const childIds = children.map((c) => c.id);
  const firstChildId = childIds[0] ?? null;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return theme.colors.success;
      case 'missed': return theme.colors.error;
      case 'cancelled': return theme.colors.disabled;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return '✓';
      case 'missed': return '✕';
      case 'cancelled': return '—';
      default: return '○';
    }
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
        <Text style={{
          fontSize: theme.textStyles.title.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
        }} accessibilityRole="header">
          {t('parent.schedule')}
        </Text>
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.primary,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.chip,
          }}
          onPress={() => router.push('/(parent)/activities/create')}
          accessibilityRole="button"
          accessibilityLabel={t('activities.create')}
        >
          <Text style={{ fontSize: 24, color: theme.colors.onFill, fontWeight: '300' }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Weekly strip */}
      <WeeklyStrip
        weekStart={weekStart}
        sessions={allSessions}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Sessions list */}
      {sessionsQuery.isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : daySessions.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: theme.spacing[3] }}>📅</Text>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.textSecondary,
          }}>
            {t('activities.noActivitiesToday')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingBottom: 120 }}>
          {daySessions.map((session) => {
            const activity = session.activity as ActivityRow | undefined;
            return (
              <View
                key={session.id}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.card,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  marginBottom: theme.spacing[3],
                  overflow: 'hidden',
                  ...theme.shadows.card,
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  {/* Color accent */}
                  <View style={{
                    width: 6,
                    alignSelf: 'stretch',
                    backgroundColor: activity?.color ?? theme.colors.primary,
                  }} />

                  {/* Content */}
                  <View style={{ flex: 1, padding: theme.spacing[4] }}>
                    <Text style={{
                      fontSize: theme.textStyles.body.fontSize,
                      fontWeight: '700',
                      color: theme.colors.ink,
                    }}>
                      {activity?.title}
                    </Text>
                    <Text style={{
                      fontSize: theme.textStyles.caption.fontSize,
                      color: theme.colors.textSecondary,
                      marginTop: 2,
                    }}>
                      {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
                      {activity?.place ? ` · ${activity.place}` : ''}
                    </Text>
                  </View>

                  {/* Status & Actions */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingRight: theme.spacing[3],
                    gap: theme.spacing[2],
                  }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: getStatusColor(session.status),
                    }}>
                      {getStatusIcon(session.status)}
                    </Text>

                    {session.status === 'planned' && (
                      <>
                        <TouchableOpacity
                          onPress={() => setConfirmSession(session)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: theme.tints.violet,
                            borderWidth: theme.borderWidth.thin,
                            borderColor: theme.colors.ink,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={t('activities.confirmDone')}
                        >
                          <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.ink }}>?</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => cancelMut.mutate(session.id)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: theme.tints.coral,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={t('activities.cancelSession')}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.ink }}>✕</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
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

      <ParentTabBar />
    </View>
  );
}
