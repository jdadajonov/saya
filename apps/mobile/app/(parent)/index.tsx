import { useState, useEffect } from 'react';
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
  useFamilyQuery,
  useChildrenQuery,
} from '../../src/features/family/hooks/use-family';
import { useRedemptionsQuery } from '../../src/features/rewards/hooks/use-rewards';
import { useConfirmSession } from '../../src/features/activities/hooks/use-activities';
import { ParentTabBar } from '../../src/features/family/components/parent-tab-bar';

const AVATAR_COLORS = ['#5DD4C8', '#FFB6C1', '#B4A7FF', '#FFD93D', '#FF8C42'];

interface DayStats {
  day: string;
  minutes: number;
  missions: number;
}

function WeeklyChart({
  data,
  theme,
}: {
  data: DayStats[];
  theme: ReturnType<typeof useTheme>;
}) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 30);
  const barHeight = 100;

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.regular,
      borderColor: theme.colors.ink,
      padding: theme.spacing[4],
      marginBottom: theme.spacing[4],
      ...theme.shadows.card,
    }}>
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
          Время на учёбу
        </Text>
        <View style={{
          backgroundColor: theme.tints.sun,
          borderRadius: theme.borderRadius.full,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[1],
        }}>
          <Text style={{
            fontSize: theme.textStyles.caption.fontSize,
            fontWeight: '700',
            color: theme.colors.ink,
          }}>
            Эта неделя
          </Text>
        </View>
      </View>

      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: barHeight + 30,
      }}>
        {data.map((day, idx) => {
          const height = maxMinutes > 0 ? (day.minutes / maxMinutes) * barHeight : 0;
          const isToday = idx === new Date().getDay() - 1 || (new Date().getDay() === 0 && idx === 6);

          return (
            <View key={day.day} style={{ alignItems: 'center', flex: 1 }}>
              {day.minutes > 0 && (
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: theme.colors.ink,
                  marginBottom: 4,
                }}>
                  {day.minutes}
                </Text>
              )}
              <View style={{
                width: 24,
                height: Math.max(height, 4),
                backgroundColor: isToday ? theme.colors.secondary : theme.tints.sun,
                borderRadius: 6,
                borderWidth: theme.borderWidth.thin,
                borderColor: theme.colors.ink,
              }} />
              <Text style={{
                fontSize: theme.textStyles.caption.fontSize,
                fontWeight: isToday ? '700' : '500',
                color: isToday ? theme.colors.ink : theme.colors.textSecondary,
                marginTop: theme.spacing[2],
              }}>
                {day.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function formatDate(): string {
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function ParentHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { family, children, setFamily, setChildren, switchToChild } = useAuthStore();

  const familyQuery = useFamilyQuery();
  const familyId = family?.id ?? familyQuery.data?.id ?? null;
  const childrenQuery = useChildrenQuery(familyId);

  const [showSessionConfirm, setShowSessionConfirm] = useState(true);

  const displayFamily = family ?? familyQuery.data;
  const displayChildren = childrenQuery.data ?? children;

  // Get pending reward requests
  const pendingRewardsQuery = useRedemptionsQuery(null, 'pending');
  const pendingCount = pendingRewardsQuery.data?.length ?? 0;

  // Session confirmation
  const confirmSessionMut = useConfirmSession();

  const handleConfirmSession = (status: 'done' | 'missed') => {
    // For now, hide the card. In production, would call:
    // confirmSessionMut.mutate({ sessionId: pendingSession.id, status });
    setShowSessionConfirm(false);
  };

  useEffect(() => {
    if (familyQuery.data && !family) {
      setFamily(familyQuery.data);
    }
  }, [familyQuery.data, family, setFamily]);

  useEffect(() => {
    if (childrenQuery.data) {
      setChildren(childrenQuery.data);
    }
  }, [childrenQuery.data, setChildren]);

  const handleSwitchToChild = (childId: string) => {
    switchToChild(childId);
    router.replace('/(child)' as never);
  };


  if (familyQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!displayFamily) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ fontSize: theme.textStyles.heading.fontSize, fontWeight: '700', color: theme.colors.ink }}>
          {t('onboarding.createFamily')}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.button,
            paddingHorizontal: theme.spacing[6],
            paddingVertical: theme.spacing[3],
            marginTop: theme.spacing[4],
          }}
          onPress={() => router.push('/(auth)/onboarding' as never)}
        >
          <Text style={{ color: theme.colors.onFill, fontWeight: '600' }}>{t('common.continue')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: 60, paddingBottom: 100 }}>
        {/* Date */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[1],
        }}>
          {formatDate()}
        </Text>

        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing[4],
        }}>
          <Text style={{
            fontSize: 26,
            fontWeight: '900',
            color: theme.colors.ink,
          }} accessibilityRole="header">
            {displayFamily?.name}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(parent)/settings' as never)}
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
            accessibilityLabel={t('parent.settings')}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Pending rewards banner */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={{
              backgroundColor: theme.tints.sun,
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              padding: theme.spacing[4],
              marginBottom: theme.spacing[4],
              flexDirection: 'row',
              alignItems: 'center',
              ...theme.shadows.card,
            }}
            onPress={() => router.push('/(parent)/rewards' as never)}
          >
            <Text style={{ fontSize: 24, marginRight: theme.spacing[3] }}>🎁</Text>
            <Text style={{
              flex: 1,
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '700',
              color: theme.colors.ink,
            }}>
              {pendingCount} запроса наград ждут решения
            </Text>
            <Text style={{ fontSize: 20, color: theme.colors.ink }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Activity confirmation (mock) */}
        {showSessionConfirm && (
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
            ...theme.shadows.card,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[3] }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.tints.violet,
                borderWidth: theme.borderWidth.thin,
                borderColor: theme.colors.ink,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing[3],
              }}>
                <Text style={{ fontSize: 20 }}>🏔️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: '700',
                  color: theme.colors.ink,
                }}>
                  Тренировка состоялась?
                </Text>
                <Text style={{
                  fontSize: theme.textStyles.caption.fontSize,
                  color: theme.colors.textSecondary,
                }}>
                  {displayChildren[0]?.displayName ?? 'Ребёнок'} · Скалолазание · вчера 17:00
                </Text>
              </View>
            </View>
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
                  ...theme.shadows.chip,
                }}
                onPress={() => handleConfirmSession('done')}
              >
                <Text style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: '700',
                  color: theme.colors.ink,
                }}>
                  Да, была
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
                onPress={() => handleConfirmSession('missed')}
              >
                <Text style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: '600',
                  color: theme.colors.ink,
                }}>
                  Пропуск
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Weekly summary chart */}
        <WeeklyChart
          data={[
            { day: 'Пн', minutes: 25, missions: 2 },
            { day: 'Вт', minutes: 18, missions: 1 },
            { day: 'Ср', minutes: 32, missions: 3 },
            { day: 'Чт', minutes: 0, missions: 0 },
            { day: 'Пт', minutes: 22, missions: 2 },
            { day: 'Сб', minutes: 15, missions: 1 },
            { day: 'Вс', minutes: 0, missions: 0 },
          ]}
          theme={theme}
        />

        {/* Children section */}
        <Text style={{
          fontSize: theme.textStyles.heading.fontSize,
          fontWeight: '800',
          color: theme.colors.ink,
          marginBottom: theme.spacing[3],
        }}>
          Войти как ребёнок
        </Text>

        {childrenQuery.isLoading && <ActivityIndicator color={theme.colors.primary} />}

        {displayChildren.map((child, idx) => {
          const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          const currentYear = new Date().getFullYear();
          const age = currentYear - (child.birthYear ?? currentYear - 10);
          const level = 5 + idx * 2;
          const coins = 24 + idx * 17;
          const streakDays = 4 + idx;

          return (
            <TouchableOpacity
              key={child.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.card,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                padding: theme.spacing[4],
                marginBottom: theme.spacing[3],
                ...theme.shadows.card,
              }}
              onPress={() => handleSwitchToChild(child.id)}
              accessibilityRole="button"
              accessibilityLabel={`${child.displayName}, ${age} лет`}
            >
              {/* Top row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[3] }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: avatarColor,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: theme.spacing[3],
                }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: '800',
                    color: theme.colors.ink,
                  }}>
                    {child.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '800',
                    color: theme.colors.ink,
                  }}>
                    {child.displayName}, {age} лет
                  </Text>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    color: theme.colors.textSecondary,
                  }}>
                    Уровень {level} · {coins} монеты
                  </Text>
                </View>
                <View style={{
                  backgroundColor: theme.tints.sun,
                  borderRadius: theme.borderRadius.full,
                  borderWidth: theme.borderWidth.thin,
                  borderColor: theme.colors.ink,
                  paddingHorizontal: theme.spacing[3],
                  paddingVertical: theme.spacing[1],
                }}>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    fontWeight: '700',
                    color: theme.colors.ink,
                  }}>
                    {streakDays} из 7 дней
                  </Text>
                </View>
              </View>

              {/* Stats row */}
              <View style={{
                flexDirection: 'row',
                borderTopWidth: theme.borderWidth.thin,
                borderTopColor: theme.colors.disabled,
                paddingTop: theme.spacing[3],
              }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '800',
                    color: theme.colors.ink,
                  }}>
                    {18 - idx * 18} мин
                  </Text>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    color: theme.colors.textSecondary,
                  }}>
                    сегодня
                  </Text>
                </View>
                <View style={{
                  width: 1,
                  backgroundColor: theme.colors.disabled,
                  marginHorizontal: theme.spacing[2],
                }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '800',
                    color: theme.colors.ink,
                  }}>
                    {2 - idx} / {2 - idx}
                  </Text>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    color: theme.colors.textSecondary,
                  }}>
                    миссии
                  </Text>
                </View>
                <View style={{
                  width: 1,
                  backgroundColor: theme.colors.disabled,
                  marginHorizontal: theme.spacing[2],
                }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '800',
                    color: theme.colors.ink,
                  }}>
                    {2 + idx} цели
                  </Text>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    color: theme.colors.textSecondary,
                  }}>
                    в работе
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Add child button */}
        <TouchableOpacity
          style={{
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: theme.colors.ink,
            borderRadius: theme.borderRadius.card,
            paddingVertical: theme.spacing[4],
            alignItems: 'center',
          }}
          onPress={() => router.push('/(parent)/children/add' as never)}
          accessibilityLabel={t('parent.addChild')}
        >
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            fontWeight: '600',
            color: theme.colors.textSecondary,
          }}>
            + {t('parent.addChild')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab bar */}
      <ParentTabBar />
    </View>
  );
}
