import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../../src/ui/theme-provider';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import { useGoalsQuery, usePendingProposalsQuery, useSkillMasteryMap, useApproveGoal, usePendingVerificationsForChild, useApproveEvidence } from '../../../src/features/goals/hooks/use-goals';
import { ParentTabBar } from '../../../src/features/family/components/parent-tab-bar';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

async function scheduleActivityNotifications(activities: WeeklyActivity[]): Promise<void> {
  // Cancel all existing activity notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier.startsWith('activity-')) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Schedule new notifications for each activity (1 hour before)
  for (const activity of activities) {
    const timeParts = activity.time.split(':').map(Number);
    const hours = timeParts[0] ?? 12;
    const minutes = timeParts[1] ?? 0;

    // Calculate notification time (1 hour before)
    let notifyHour = hours - 1;
    let notifyDay = activity.dayOfWeek;

    if (notifyHour < 0) {
      notifyHour = 23;
      notifyDay = notifyDay === 0 ? 6 : notifyDay - 1;
    }

    // Notifications weekday: 1 = Sunday, 2 = Monday, etc.
    const notificationWeekday = notifyDay === 0 ? 1 : notifyDay + 1;

    await Notifications.scheduleNotificationAsync({
      identifier: `activity-${activity.id}`,
      content: {
        title: `${activity.icon} ${activity.name} через час`,
        body: `Не забудьте про занятие в ${activity.time}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: notificationWeekday,
        hour: notifyHour,
        minute: minutes,
      },
    });
  }
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  mastery?: number;
}

interface Goal {
  id: string;
  title: string;
  domain: string;
  status: string;
  milestones: Milestone[];
}

interface WeeklyActivity {
  id: string;
  name: string;
  icon: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  time: string;
  childId?: string;
}

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAY_NAMES_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const ACTIVITY_PRESETS = [
  { name: 'Музыка', icon: '🎵' },
  { name: 'Конный спорт', icon: '🐴' },
  { name: 'Рисование', icon: '🎨' },
  { name: 'Настольный теннис', icon: '🏓' },
  { name: 'Скалолазание', icon: '🧗' },
  { name: 'Плавание', icon: '🏊' },
  { name: 'Футбол', icon: '⚽' },
  { name: 'Танцы', icon: '💃' },
  { name: 'Шахматы', icon: '♟️' },
  { name: 'Гимнастика', icon: '🤸' },
  { name: 'Программирование', icon: '💻' },
];

function formatDate(date: string): string {
  const d = new Date(date);
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function GoalProgressCard({
  goal,
  theme,
  onConfirmMilestone,
}: {
  goal: Goal;
  theme: ReturnType<typeof useTheme>;
  onConfirmMilestone?: (milestoneId: string) => void;
}) {
  const completedCount = goal.milestones.filter((m) => m.completed).length;
  const total = goal.milestones.length;
  const isLearning = goal.domain === 'learning';

  const needsConfirmation = goal.milestones.find(
    (m) => !m.completed && (m.mastery ?? 0) >= 0.5
  );

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.regular,
      borderColor: theme.colors.ink,
      padding: theme.spacing[4],
      marginBottom: theme.spacing[3],
      ...theme.shadows.card,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing[3],
      }}>
        <Text style={{
          fontSize: theme.textStyles.body.fontSize,
          fontWeight: '800',
          color: theme.colors.ink,
        }}>
          {goal.title}
        </Text>
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          color: theme.colors.textSecondary,
        }}>
          {isLearning ? 'Учёба' : 'Спорт'} · {completedCount} из {total}
        </Text>
      </View>

      {/* Milestones */}
      {goal.milestones.map((m, idx) => {
        const isComplete = m.completed;
        const mastery = m.mastery ?? 0;
        const isInProgress = !isComplete && mastery > 0;

        return (
          <View
            key={m.id || idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: theme.spacing[2],
            }}
          >
            {/* Status dot */}
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: isComplete ? theme.colors.success : isInProgress ? theme.tints.sun : theme.colors.disabled,
              borderWidth: theme.borderWidth.thin,
              borderColor: theme.colors.ink,
              marginRight: theme.spacing[3],
            }} />

            {/* Title */}
            <Text style={{
              flex: 1,
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
            }}>
              {m.title}
            </Text>

            {/* Status */}
            {isComplete && m.completedAt && (
              <Text style={{
                fontSize: theme.textStyles.caption.fontSize,
                color: theme.colors.textSecondary,
              }}>
                освоено {formatDate(m.completedAt)}
              </Text>
            )}
            {isInProgress && (
              <Text style={{
                fontSize: theme.textStyles.caption.fontSize,
                fontWeight: '700',
                color: theme.colors.ink,
              }}>
                {Math.round(mastery * 100)}%
              </Text>
            )}
          </View>
        );
      })}

      {/* Progress bar for current milestone */}
      {goal.milestones.some((m) => !m.completed && (m.mastery ?? 0) > 0) && (
        <View style={{
          height: 8,
          backgroundColor: theme.colors.disabled,
          borderRadius: 4,
          marginTop: theme.spacing[2],
          overflow: 'hidden',
        }}>
          <View style={{
            width: `${(goal.milestones.find((m) => !m.completed)?.mastery ?? 0) * 100}%`,
            height: '100%',
            backgroundColor: theme.colors.success,
            borderRadius: 4,
          }} />
        </View>
      )}

      {/* Helper text */}
      <Text style={{
        fontSize: theme.textStyles.caption.fontSize,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing[3],
      }}>
        {isLearning
          ? 'Этап закроется сам, когда освоение дойдёт до 100%'
          : 'Этапы подтверждает тренер или родитель'}
      </Text>

      {/* Confirmation prompt for activity goals */}
      {!isLearning && needsConfirmation && onConfirmMilestone && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.tints.sun,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing[3],
          marginTop: theme.spacing[3],
          gap: theme.spacing[3],
        }}>
          <Text style={{
            flex: 1,
            fontSize: theme.textStyles.caption.fontSize,
            color: theme.colors.ink,
          }}>
            Ребёнок прошёл {needsConfirmation.title}? Подтвердите этап
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.secondary,
              borderRadius: theme.borderRadius.button,
              borderWidth: theme.borderWidth.thin,
              borderColor: theme.colors.ink,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
            }}
            onPress={() => onConfirmMilestone(needsConfirmation.id)}
          >
            <Text style={{
              fontSize: theme.textStyles.caption.fontSize,
              fontWeight: '700',
              color: theme.colors.ink,
            }}>
              Подтвердить
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function AddActivityModal({
  visible,
  onClose,
  onAdd,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (activity: Omit<WeeklyActivity, 'id'>) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday
  const [selectedHour, setSelectedHour] = useState(15);
  const [selectedMinute, setSelectedMinute] = useState(0);

  const handleAdd = () => {
    if (selectedPreset === null) return;
    const preset = ACTIVITY_PRESETS[selectedPreset]!;
    onAdd({
      name: preset.name,
      icon: preset.icon,
      dayOfWeek: selectedDay,
      time: `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`,
    });
    setSelectedPreset(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
            <View style={{ padding: theme.spacing[5] }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[4] }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.colors.ink }}>
                  Добавить занятие
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={{ fontSize: 24, color: theme.colors.ink }}>✕</Text>
                </TouchableOpacity>
              </View>

            {/* Activity selection */}
            <Text style={{ fontSize: theme.textStyles.caption.fontSize, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: theme.spacing[2] }}>
              Выберите занятие
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing[4] }}>
              <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                {ACTIVITY_PRESETS.map((preset, idx) => (
                  <TouchableOpacity
                    key={preset.name}
                    style={{
                      backgroundColor: selectedPreset === idx ? theme.tints.sun : theme.colors.surface,
                      borderRadius: theme.borderRadius.card,
                      borderWidth: theme.borderWidth.regular,
                      borderColor: selectedPreset === idx ? theme.colors.ink : theme.colors.disabled,
                      padding: theme.spacing[3],
                      alignItems: 'center',
                      minWidth: 80,
                    }}
                    onPress={() => setSelectedPreset(idx)}
                  >
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>{preset.icon}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.ink, textAlign: 'center' }}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Day selection */}
            <Text style={{ fontSize: theme.textStyles.caption.fontSize, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: theme.spacing[2] }}>
              День недели
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={{
                    flex: 1,
                    backgroundColor: selectedDay === day ? theme.colors.secondary : theme.colors.surface,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: theme.borderWidth.thin,
                    borderColor: theme.colors.ink,
                    paddingVertical: theme.spacing[2],
                    alignItems: 'center',
                  }}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: selectedDay === day ? '700' : '500',
                    color: theme.colors.ink,
                  }}>
                    {DAY_NAMES[day]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time selection */}
            <Text style={{ fontSize: theme.textStyles.caption.fontSize, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: theme.spacing[2] }}>
              Время
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[5] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: theme.borderWidth.thin, borderColor: theme.colors.ink }}>
                <TouchableOpacity
                  style={{ padding: theme.spacing[3] }}
                  onPress={() => setSelectedHour((h) => (h > 0 ? h - 1 : 23))}
                >
                  <Text style={{ fontSize: 20, color: theme.colors.ink }}>−</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.colors.ink, minWidth: 40, textAlign: 'center' }}>
                  {selectedHour.toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={{ padding: theme.spacing[3] }}
                  onPress={() => setSelectedHour((h) => (h < 23 ? h + 1 : 0))}
                >
                  <Text style={{ fontSize: 20, color: theme.colors.ink }}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '700', color: theme.colors.ink }}>:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: theme.borderWidth.thin, borderColor: theme.colors.ink }}>
                <TouchableOpacity
                  style={{ padding: theme.spacing[3] }}
                  onPress={() => setSelectedMinute((m) => (m >= 15 ? m - 15 : 45))}
                >
                  <Text style={{ fontSize: 20, color: theme.colors.ink }}>−</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.colors.ink, minWidth: 40, textAlign: 'center' }}>
                  {selectedMinute.toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={{ padding: theme.spacing[3] }}
                  onPress={() => setSelectedMinute((m) => (m < 45 ? m + 15 : 0))}
                >
                  <Text style={{ fontSize: 20, color: theme.colors.ink }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

              {/* Add button */}
              <TouchableOpacity
                style={{
                  backgroundColor: selectedPreset !== null ? theme.colors.primary : theme.colors.disabled,
                  borderRadius: theme.borderRadius.button,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  paddingVertical: theme.spacing[4],
                  alignItems: 'center',
                  ...theme.shadows.button,
                }}
                onPress={handleAdd}
                disabled={selectedPreset === null}
              >
                <Text style={{ fontSize: theme.textStyles.body.fontSize, fontWeight: '700', color: theme.colors.onFill }}>
                  Добавить
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function WeeklyActivitiesSection({
  activities,
  onAdd,
  onRemove,
  theme,
}: {
  activities: WeeklyActivity[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  // Group by day
  const byDay = activities.reduce((acc, act) => {
    if (!acc[act.dayOfWeek]) acc[act.dayOfWeek] = [];
    acc[act.dayOfWeek]!.push(act);
    return acc;
  }, {} as Record<number, WeeklyActivity[]>);

  // Sort each day's activities by time
  Object.values(byDay).forEach((dayActivities) => {
    dayActivities.sort((a, b) => a.time.localeCompare(b.time));
  });

  const daysOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun

  return (
    <View style={{ marginBottom: theme.spacing[4] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[3] }}>
        <Text style={{ fontSize: theme.textStyles.heading.fontSize, fontWeight: '800', color: theme.colors.ink }}>
          Расписание занятий
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.secondary,
            borderRadius: theme.borderRadius.full,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[2],
          }}
          onPress={onAdd}
        >
          <Text style={{ fontSize: theme.textStyles.caption.fontSize, fontWeight: '700', color: theme.colors.ink }}>
            + Добавить
          </Text>
        </TouchableOpacity>
      </View>

      {activities.length === 0 ? (
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.card,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          borderStyle: 'dashed',
          padding: theme.spacing[5],
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 32, marginBottom: theme.spacing[2] }}>📅</Text>
          <Text style={{ fontSize: theme.textStyles.body.fontSize, color: theme.colors.textSecondary, textAlign: 'center' }}>
            Добавьте еженедельные занятия ребёнка
          </Text>
        </View>
      ) : (
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.card,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          overflow: 'hidden',
          ...theme.shadows.card,
        }}>
          {daysOrder.map((day, dayIdx) => {
            const dayActivities = byDay[day];
            if (!dayActivities?.length) return null;

            return (
              <View key={day}>
                {dayIdx > 0 && Object.keys(byDay).filter((d) => daysOrder.indexOf(Number(d)) < dayIdx && byDay[Number(d)]?.length).length > 0 && (
                  <View style={{ height: 1, backgroundColor: theme.colors.disabled }} />
                )}
                <View style={{ padding: theme.spacing[3] }}>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    fontWeight: '700',
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing[2],
                  }}>
                    {DAY_NAMES_FULL[day]}
                  </Text>
                  {dayActivities.map((activity, actIdx) => (
                    <View
                      key={activity.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: theme.spacing[2],
                        gap: theme.spacing[3],
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{activity.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: theme.textStyles.body.fontSize, fontWeight: '600', color: theme.colors.ink }}>
                          {activity.name}
                        </Text>
                        <Text style={{ fontSize: theme.textStyles.caption.fontSize, color: theme.colors.textSecondary }}>
                          {activity.time}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{ padding: theme.spacing[2] }}
                        onPress={() => onRemove(activity.id)}
                      >
                        <Text style={{ fontSize: 16, color: theme.colors.error }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text style={{
        fontSize: theme.textStyles.caption.fontSize,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing[2],
        textAlign: 'center',
      }}>
        Занятия повторяются каждую неделю
      </Text>
    </View>
  );
}

export default function ParentGoalsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { children } = useAuthStore();

  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const selectedChild = children[selectedChildIdx];
  const childId = selectedChild?.id ?? null;

  const [showAddActivity, setShowAddActivity] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [weeklyActivities, setWeeklyActivities] = useState<WeeklyActivity[]>([
    // Mock data - would come from database in production
    { id: '1', name: 'Скалолазание', icon: '🧗', dayOfWeek: 2, time: '17:00' },
    { id: '2', name: 'Музыка', icon: '🎵', dayOfWeek: 4, time: '15:30' },
    { id: '3', name: 'Плавание', icon: '🏊', dayOfWeek: 6, time: '10:00' },
  ]);

  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermissions().then((granted) => {
      setNotificationsEnabled(granted);
      if (!granted) {
        Alert.alert(
          'Уведомления отключены',
          'Включите уведомления в настройках, чтобы получать напоминания о занятиях',
        );
      }
    });
  }, []);

  // Schedule notifications when activities change
  useEffect(() => {
    if (notificationsEnabled && weeklyActivities.length > 0) {
      scheduleActivityNotifications(weeklyActivities).catch(console.error);
    }
  }, [weeklyActivities, notificationsEnabled]);

  const { user } = useAuthStore();
  const goalsQuery = useGoalsQuery(childId);
  const pendingQuery = usePendingProposalsQuery(childId);
  const masteryQuery = useSkillMasteryMap(childId);
  const pendingVerificationsQuery = usePendingVerificationsForChild(childId);
  const approveMut = useApproveGoal();
  const approveEvidenceMut = useApproveEvidence();

  const allGoals = (goalsQuery.data ?? []) as unknown as Goal[];
  const pendingProposals = pendingQuery.data ?? [];
  const pendingVerifications = pendingVerificationsQuery.data ?? [];
  const activeGoals = allGoals.filter((g) => g.status === 'active');

  const handleApprove = (goalId: string, approve: boolean) => {
    approveMut.mutate({ goalId, approve });
  };

  const handleApproveVerification = (evidenceId: string, milestoneId: string) => {
    Alert.alert(
      'Подтвердить выполнение?',
      'Ребёнок отметил этот этап как выполненный',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          onPress: () => {
            approveEvidenceMut.mutate({
              evidenceId,
              milestoneId,
              userId: user?.id ?? '',
            });
          },
        },
      ],
    );
  };

  const handleAddActivity = (activity: Omit<WeeklyActivity, 'id'>) => {
    setWeeklyActivities((prev) => [
      ...prev,
      { ...activity, id: Date.now().toString() },
    ]);
  };

  const handleRemoveActivity = (id: string) => {
    setWeeklyActivities((prev) => prev.filter((a) => a.id !== id));
  };

  if (goalsQuery.isLoading || masteryQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: 60, paddingBottom: 100 }}>
        {/* Header */}
        <Text style={{
          fontSize: 28,
          fontWeight: '900',
          color: theme.colors.ink,
          marginBottom: theme.spacing[4],
        }} accessibilityRole="header">
          Занятия и цели
        </Text>

        {/* Child selector */}
        {children.length > 1 && (
          <View style={{
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.full,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            marginBottom: theme.spacing[4],
            overflow: 'hidden',
          }}>
            {children.map((child, idx) => (
              <TouchableOpacity
                key={child.id}
                style={{
                  flex: 1,
                  paddingVertical: theme.spacing[3],
                  alignItems: 'center',
                  backgroundColor: idx === selectedChildIdx ? theme.colors.secondary : 'transparent',
                }}
                onPress={() => setSelectedChildIdx(idx)}
              >
                <Text style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: idx === selectedChildIdx ? '700' : '500',
                  color: theme.colors.ink,
                }}>
                  {child.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pending verification requests from child */}
        {pendingVerifications.length > 0 && (
          <>
            <Text style={{
              fontSize: theme.textStyles.caption.fontSize,
              fontWeight: '600',
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing[2],
              textTransform: 'uppercase',
            }}>
              Ожидают подтверждения
            </Text>
            {pendingVerifications.map((item) => (
              <View
                key={item.evidence.id}
                style={{
                  backgroundColor: theme.tints.sun,
                  borderRadius: theme.borderRadius.card,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  padding: theme.spacing[4],
                  marginBottom: theme.spacing[3],
                  ...theme.shadows.card,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[2] }}>
                  <Text style={{ fontSize: 24, marginRight: theme.spacing[2] }}>✅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: theme.textStyles.caption.fontSize,
                      color: theme.colors.textSecondary,
                    }}>
                      {item.goal.title}
                    </Text>
                    <Text style={{
                      fontSize: theme.textStyles.body.fontSize,
                      fontWeight: '700',
                      color: theme.colors.ink,
                    }}>
                      {item.milestone.title}
                    </Text>
                  </View>
                </View>
                <Text style={{
                  fontSize: theme.textStyles.caption.fontSize,
                  color: theme.colors.ink,
                  marginBottom: theme.spacing[3],
                }}>
                  Ребёнок отметил этап выполненным
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.success,
                    borderRadius: theme.borderRadius.button,
                    borderWidth: theme.borderWidth.regular,
                    borderColor: theme.colors.ink,
                    paddingVertical: theme.spacing[3],
                    alignItems: 'center',
                  }}
                  onPress={() => handleApproveVerification(item.evidence.id, item.milestone.id)}
                >
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '700',
                    color: '#fff',
                  }}>
                    ✓ Подтвердить
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Pending proposals from child */}
        {pendingProposals.length > 0 && (
          <>
            <Text style={{
              fontSize: theme.textStyles.caption.fontSize,
              fontWeight: '600',
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing[2],
              textTransform: 'uppercase',
            }}>
              {t('goals.pendingApproval')}
            </Text>
            {pendingProposals.map((goal) => (
              <View
                key={goal.id}
                style={{
                  backgroundColor: theme.tints.sun,
                  borderRadius: theme.borderRadius.card,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  padding: theme.spacing[4],
                  marginBottom: theme.spacing[3],
                  ...theme.shadows.card,
                }}
              >
                <Text style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: '700',
                  color: theme.colors.ink,
                  marginBottom: theme.spacing[2],
                }}>
                  {goal.title}
                </Text>
                <Text style={{
                  fontSize: theme.textStyles.caption.fontSize,
                  color: theme.colors.ink,
                  marginBottom: theme.spacing[3],
                }}>
                  {goal.milestones.length} этапов · предложено ребёнком
                </Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: theme.colors.secondary,
                      borderRadius: theme.borderRadius.button,
                      borderWidth: theme.borderWidth.regular,
                      borderColor: theme.colors.ink,
                      paddingVertical: theme.spacing[3],
                      alignItems: 'center',
                    }}
                    onPress={() => handleApprove(goal.id, true)}
                  >
                    <Text style={{
                      fontSize: theme.textStyles.body.fontSize,
                      fontWeight: '700',
                      color: theme.colors.ink,
                    }}>
                      {t('goals.approve')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius.button,
                      borderWidth: theme.borderWidth.regular,
                      borderColor: theme.colors.ink,
                      paddingVertical: theme.spacing[3],
                      alignItems: 'center',
                    }}
                    onPress={() => handleApprove(goal.id, false)}
                  >
                    <Text style={{
                      fontSize: theme.textStyles.body.fontSize,
                      fontWeight: '600',
                      color: theme.colors.ink,
                    }}>
                      {t('goals.decline')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Weekly activities */}
        <WeeklyActivitiesSection
          activities={weeklyActivities}
          onAdd={() => setShowAddActivity(true)}
          onRemove={handleRemoveActivity}
          theme={theme}
        />

        {/* Active goals */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing[3],
        }}>
          <Text style={{
            fontSize: theme.textStyles.heading.fontSize,
            fontWeight: '800',
            color: theme.colors.ink,
          }}>
            Цели
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.secondary,
              borderRadius: theme.borderRadius.full,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
            }}
            onPress={() => router.push('/(parent)/goals/create' as never)}
          >
            <Text style={{ fontSize: theme.textStyles.caption.fontSize, fontWeight: '700', color: theme.colors.ink }}>
              + Добавить
            </Text>
          </TouchableOpacity>
        </View>

        {activeGoals.map((goal) => (
          <GoalProgressCard
            key={goal.id}
            goal={goal}
            theme={theme}
          />
        ))}

        {/* Empty state */}
        {activeGoals.length === 0 && pendingProposals.length === 0 && (
          <View style={{
            alignItems: 'center',
            paddingVertical: theme.spacing[8],
          }}>
            <Text style={{ fontSize: 48, marginBottom: theme.spacing[3] }}>🎯</Text>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginBottom: theme.spacing[4],
            }}>
              {t('goals.noGoalsYet')}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.button,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                paddingHorizontal: theme.spacing[6],
                paddingVertical: theme.spacing[3],
                ...theme.shadows.button,
              }}
              onPress={() => router.push('/(parent)/goals/create' as never)}
            >
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '700',
                color: theme.colors.onFill,
              }}>
                {t('goals.create')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ParentTabBar activeTab="goals" />

      {/* Add activity modal */}
      <AddActivityModal
        visible={showAddActivity}
        onClose={() => setShowAddActivity(false)}
        onAdd={handleAddActivity}
        theme={theme}
      />
    </View>
  );
}
