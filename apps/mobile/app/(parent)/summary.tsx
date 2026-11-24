import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/ui/theme-provider';
import { useAuthStore } from '../../src/features/family/stores/auth-store';
import { ParentTabBar } from '../../src/features/family/components/parent-tab-bar';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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
  const barHeight = 120;

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
      <Text style={{
        fontSize: theme.textStyles.body.fontSize,
        fontWeight: '800',
        color: theme.colors.ink,
        marginBottom: theme.spacing[4],
      }}>
        Время на учёбу
      </Text>

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
                width: 28,
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

function StatCard({
  icon,
  value,
  label,
  theme,
}: {
  icon: string;
  value: string | number;
  label: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.regular,
      borderColor: theme.colors.ink,
      padding: theme.spacing[3],
      alignItems: 'center',
      ...theme.shadows.chip,
    }}>
      <Text style={{ fontSize: 24, marginBottom: theme.spacing[1] }}>{icon}</Text>
      <Text style={{
        fontSize: 20,
        fontWeight: '900',
        color: theme.colors.ink,
      }}>
        {value}
      </Text>
      <Text style={{
        fontSize: theme.textStyles.caption.fontSize,
        color: theme.colors.textSecondary,
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function WeeklySummaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { children } = useAuthStore();

  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const selectedChild = children[selectedChildIdx];

  // Mock weekly data - would come from a hook in production
  const weeklyData: DayStats[] = [
    { day: 'Пн', minutes: 25, missions: 2 },
    { day: 'Вт', minutes: 18, missions: 1 },
    { day: 'Ср', minutes: 32, missions: 3 },
    { day: 'Чт', minutes: 0, missions: 0 },
    { day: 'Пт', minutes: 22, missions: 2 },
    { day: 'Сб', minutes: 15, missions: 1 },
    { day: 'Вс', minutes: 0, missions: 0 },
  ];

  const totalMinutes = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const totalMissions = weeklyData.reduce((sum, d) => sum + d.missions, 0);
  const activeDays = weeklyData.filter((d) => d.minutes > 0).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: 60, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing[4],
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadows.chip,
            }}
          >
            <Text style={{ fontSize: 20, color: theme.colors.ink }}>‹</Text>
          </TouchableOpacity>
          <Text style={{
            flex: 1,
            fontSize: 24,
            fontWeight: '900',
            color: theme.colors.ink,
            marginLeft: theme.spacing[3],
          }} accessibilityRole="header">
            Сводка за неделю
          </Text>
        </View>

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

        {/* Weekly chart */}
        <WeeklyChart data={weeklyData} theme={theme} />

        {/* Stats row */}
        <View style={{
          flexDirection: 'row',
          gap: theme.spacing[3],
          marginBottom: theme.spacing[4],
        }}>
          <StatCard
            icon="⏱"
            value={`${totalMinutes} мин`}
            label="всего"
            theme={theme}
          />
          <StatCard
            icon="✓"
            value={totalMissions}
            label="миссий"
            theme={theme}
          />
          <StatCard
            icon="🔥"
            value={`${activeDays}/7`}
            label="дней"
            theme={theme}
          />
        </View>

        {/* Insights card */}
        <View style={{
          backgroundColor: theme.tints.sun,
          borderRadius: theme.borderRadius.card,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          padding: theme.spacing[4],
          marginBottom: theme.spacing[4],
          ...theme.shadows.card,
        }}>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            fontWeight: '700',
            color: theme.colors.ink,
            marginBottom: theme.spacing[2],
          }}>
            💡 Выводы
          </Text>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.ink,
            lineHeight: 22,
          }}>
            {selectedChild?.displayName ?? 'Ребёнок'} занимался {activeDays} дней из 7.{' '}
            {activeDays >= 4
              ? 'Отличный результат! Стабильность — ключ к успеху.'
              : 'Попробуйте заниматься чаще — даже 10 минут в день дают результат.'}
          </Text>
        </View>

        {/* Subject breakdown */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '600',
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[2],
          textTransform: 'uppercase',
        }}>
          По предметам
        </Text>
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.card,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          padding: theme.spacing[4],
          ...theme.shadows.card,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: theme.spacing[2],
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
              <Text style={{ fontSize: 20 }}>🧮</Text>
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.ink,
              }}>
                Математика
              </Text>
            </View>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '700',
              color: theme.colors.ink,
            }}>
              65 мин
            </Text>
          </View>
          <View style={{
            height: 1,
            backgroundColor: theme.colors.disabled,
            marginVertical: theme.spacing[2],
          }} />
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: theme.spacing[2],
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
              <Text style={{ fontSize: 20 }}>🇬🇧</Text>
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.ink,
              }}>
                Английский
              </Text>
            </View>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '700',
              color: theme.colors.ink,
            }}>
              47 мин
            </Text>
          </View>
        </View>
      </ScrollView>

      <ParentTabBar />
    </View>
  );
}
