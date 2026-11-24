import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
import { Mascot } from '../../../src/ui/brand';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import { ParentalGateModal } from '../../../src/features/family/components/parental-gate-modal';
import { useTodaySessionsQuery, useRecordMood } from '../../../src/features/activities/hooks/use-activities';
import type { SessionRow, ActivityRow } from '../../../src/features/activities/hooks/use-activities';
import { MoodPicker } from '../../../src/features/activities/components/mood-picker';
import type { MoodValue } from '../../../src/features/activities/components/mood-picker';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatDate(): string {
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

function WeekStreak({ theme }: { theme: ReturnType<typeof useTheme> }) {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  // Mock data - in real app would come from API
  const completedDays = [true, true, true, true, false, false, false];
  const completedCount = completedDays.filter(Boolean).length;

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.regular,
      borderColor: theme.colors.ink,
      padding: theme.spacing[4],
      ...theme.shadows.card,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[3] }}>
        <Text style={{ fontSize: theme.textStyles.body.fontSize, fontWeight: '700', color: theme.colors.ink }}>
          Моя неделя
        </Text>
        <View style={{
          backgroundColor: theme.tints.sun,
          borderRadius: theme.borderRadius.full,
          borderWidth: theme.borderWidth.thin,
          borderColor: theme.colors.ink,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[1],
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.ink }}>
            {completedCount} из 7 дней — супер!
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map((day, idx) => {
          const isCompleted = completedDays[idx];
          const isToday = idx === todayIdx;

          return (
            <View key={day} style={{ alignItems: 'center', gap: 4 }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: isCompleted ? theme.colors.success : 'transparent',
                borderWidth: isToday ? 3 : (isCompleted ? 0 : 2),
                borderColor: isToday ? theme.colors.ink : theme.colors.disabled,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {isCompleted && <Text style={{ color: theme.colors.surface, fontSize: 14 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary }}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function LevelCard({ theme }: { theme: ReturnType<typeof useTheme> }) {
  // Mock data - in real app would come from API
  const level = 5;
  const currentXp = 340;
  const nextLevelXp = 500;
  const progress = currentXp / nextLevelXp;

  return (
    <View style={{
      backgroundColor: theme.tints.sun,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.regular,
      borderColor: theme.colors.ink,
      padding: theme.spacing[4],
      ...theme.shadows.card,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
        <View style={{
          width: 56,
          height: 56,
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.surface,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 32 }}>⭐</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: theme.textStyles.heading.fontSize, fontWeight: '900', color: theme.colors.ink }}>
              Уровень {level}
            </Text>
            <Text style={{ fontSize: theme.textStyles.caption.fontSize, fontWeight: '700', color: theme.colors.ink }}>
              {currentXp} / {nextLevelXp} XP
            </Text>
          </View>
          <View style={{
            height: 12,
            backgroundColor: theme.colors.surface,
            borderRadius: 6,
            borderWidth: theme.borderWidth.thin,
            borderColor: theme.colors.ink,
            marginTop: theme.spacing[2],
            overflow: 'hidden',
          }}>
            <View style={{
              width: `${progress * 100}%`,
              height: '100%',
              backgroundColor: theme.colors.xp,
              borderRadius: 4,
            }} />
          </View>
        </View>
      </View>
    </View>
  );
}

function MissionCard({
  icon,
  title,
  subtitle,
  color,
  theme,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: color,
        borderRadius: theme.borderRadius.card,
        borderWidth: theme.borderWidth.regular,
        borderColor: theme.colors.ink,
        padding: theme.spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        ...theme.shadows.card,
      }}
      onPress={onPress}
    >
      <View style={{
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: theme.borderWidth.regular,
        borderColor: theme.colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.ink }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: theme.textStyles.heading.fontSize, fontWeight: '800', color: theme.colors.ink }}>
          {title}
        </Text>
        <Text style={{ fontSize: theme.textStyles.caption.fontSize, color: theme.colors.ink, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.tints.sun,
        borderWidth: theme.borderWidth.regular,
        borderColor: theme.colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 20, color: theme.colors.ink }}>▶</Text>
      </View>
    </TouchableOpacity>
  );
}

function ActivityCard({
  activity,
  session,
  theme,
  onMoodPress,
  showMoodPicker,
  onMoodSelect,
}: {
  activity: ActivityRow;
  session: SessionRow;
  theme: ReturnType<typeof useTheme>;
  onMoodPress: () => void;
  showMoodPicker: boolean;
  onMoodSelect: (mood: MoodValue) => void;
}) {
  const isDone = session.status === 'done';
  const needsMood = isDone && !session.mood;

  return (
    <View style={{
      backgroundColor: theme.tints.violet,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.regular,
      borderColor: theme.colors.ink,
      padding: theme.spacing[4],
      ...theme.shadows.card,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.surface,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 24 }}>🏔️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: theme.textStyles.body.fontSize, fontWeight: '800', color: theme.colors.ink }}>
            {activity.title}
          </Text>
          <Text style={{ fontSize: theme.textStyles.caption.fontSize, color: theme.colors.ink, marginTop: 2 }}>
            Сегодня в {formatTime(session.starts_at)} · {activity.place || 'Место не указано'}
          </Text>
        </View>
        {isDone && session.mood && (
          <Text style={{ fontSize: 32 }}>
            {({ great: '😄', good: '🙂', ok: '😐', bad: '😕', awful: '😩' } as Record<string, string>)[session.mood] ?? '😊'}
          </Text>
        )}
        {needsMood && (
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.tints.sun,
              borderWidth: theme.borderWidth.thin,
              borderColor: theme.colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={onMoodPress}
          >
            <Text style={{ fontSize: 24 }}>😊</Text>
          </TouchableOpacity>
        )}
      </View>

      {showMoodPicker && (
        <View style={{ marginTop: theme.spacing[3] }}>
          <MoodPicker value={session.mood as MoodValue | null} onSelect={onMoodSelect} />
        </View>
      )}
    </View>
  );
}

export default function ChildTodayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { children, activeChildId, switchToParent } = useAuthStore();
  const [gateVisible, setGateVisible] = useState(false);
  const [moodSession, setMoodSession] = useState<string | null>(null);

  const child = children.find((c) => c.id === activeChildId);

  const todaySessions = useTodaySessionsQuery(activeChildId ?? null);
  const sessions = (todaySessions.data ?? []).filter((s) => s.status !== 'cancelled');
  const moodMut = useRecordMood();

  const handleGateSuccess = () => {
    setGateVisible(false);
    setTimeout(() => {
      switchToParent();
      setTimeout(() => {
        router.replace('/(parent)' as never);
      }, 100);
    }, 400);
  };

  const handleMood = (sessionId: string, mood: MoodValue) => {
    moodMut.mutate({ sessionId, mood });
    setMoodSession(null);
  };

  // Mock coins - in real app would come from API
  const coins = 24;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: theme.spacing[5],
        paddingTop: 60,
        paddingBottom: theme.spacing[4],
      }}>
        {/* Mascot */}
        <View style={{
          width: 64,
          height: 64,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Mascot mood="idle" size={64} />
        </View>

        {/* Greeting */}
        <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
          <Text style={{ fontSize: theme.textStyles.caption.fontSize, color: theme.colors.textSecondary }}>
            {formatDate()}
          </Text>
          <Text style={{ fontSize: theme.textStyles.title.fontSize, fontWeight: '900', color: theme.colors.ink }}>
            Привет,{'\n'}{child?.displayName || 'друг'}!
          </Text>
        </View>

        {/* Coins */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.full,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[2],
          gap: theme.spacing[1],
          ...theme.shadows.chip,
        }}>
          <Text style={{ fontSize: 18 }}>🪙</Text>
          <Text style={{ fontSize: theme.textStyles.body.fontSize, fontWeight: '800', color: theme.colors.ink }}>
            {coins}
          </Text>
        </View>
      </View>

      {/* Exit button */}
      <TouchableOpacity
        onPress={() => setGateVisible(true)}
        style={{
          position: 'absolute',
          top: 60,
          right: theme.spacing[5],
          marginTop: 50,
        }}
      >
        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
          {t('child.exitChildMode')} →
        </Text>
      </TouchableOpacity>

      {/* Level Card */}
      <View style={{ paddingHorizontal: theme.spacing[5], marginBottom: theme.spacing[4] }}>
        <LevelCard theme={theme} />
      </View>

      {/* Week Streak */}
      <View style={{ paddingHorizontal: theme.spacing[5], marginBottom: theme.spacing[5] }}>
        <WeekStreak theme={theme} />
      </View>

      {/* Missions section */}
      <Text style={{
        fontSize: theme.textStyles.heading.fontSize,
        fontWeight: '900',
        color: theme.colors.ink,
        paddingHorizontal: theme.spacing[5],
        marginBottom: theme.spacing[3],
      }}>
        Миссии на сегодня
      </Text>

      <View style={{ paddingHorizontal: theme.spacing[5], gap: theme.spacing[3] }}>
        <MissionCard
          icon="7×8"
          title="Таблица на 7"
          subtitle="10 заданий · ~10 минут"
          color={theme.tints.coral}
          theme={theme}
          onPress={() => router.push('/(child)/learn/math.mul')}
        />

        <MissionCard
          icon="ABC"
          title="Английский: животные"
          subtitle="8 слов · ~8 минут"
          color={theme.tints.teal}
          theme={theme}
          onPress={() => router.push('/(child)/learn/en.a1')}
        />
      </View>

      {/* Activities */}
      {sessions.length > 0 && (
        <>
          <Text style={{
            fontSize: theme.textStyles.heading.fontSize,
            fontWeight: '900',
            color: theme.colors.ink,
            paddingHorizontal: theme.spacing[5],
            marginTop: theme.spacing[5],
            marginBottom: theme.spacing[3],
          }}>
            {t('activities.todayTitle')}
          </Text>

          <View style={{ paddingHorizontal: theme.spacing[5], gap: theme.spacing[3] }}>
            {sessions.map((session) => {
              const activity = session.activity as ActivityRow | undefined;
              if (!activity) return null;

              return (
                <ActivityCard
                  key={session.id}
                  activity={activity}
                  session={session as SessionRow}
                  theme={theme}
                  onMoodPress={() => setMoodSession(moodSession === session.id ? null : session.id)}
                  showMoodPicker={moodSession === session.id}
                  onMoodSelect={(mood) => handleMood(session.id, mood)}
                />
              );
            })}
          </View>
        </>
      )}

      {todaySessions.isLoading && (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing[5] }} />
      )}

      <ParentalGateModal
        visible={gateVisible}
        onSuccess={handleGateSuccess}
        onDismiss={() => setGateVisible(false)}
      />
    </ScrollView>
  );
}
