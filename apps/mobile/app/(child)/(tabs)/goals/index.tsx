import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/ui/theme-provider';
import { useAuthStore } from '../../../../src/features/family/stores/auth-store';
import { useGoalsQuery, useSkillMasteryMap } from '../../../../src/features/goals/hooks/use-goals';
import Svg, { Path, Circle, Rect, Line, Defs, Pattern } from 'react-native-svg';

interface Goal {
  id: string;
  title: string;
  domain: string;
  targetMastery?: number;
  status: string;
  milestones?: { id: string; title: string; completed: boolean }[];
}

function MilestoneMap({ goal, theme }: { goal: Goal; theme: ReturnType<typeof useTheme> }) {
  const milestones = goal.milestones ?? [];
  const completedCount = milestones.filter((m) => m.completed).length;
  const currentIndex = completedCount;
  const total = milestones.length || 4;

  const positions: { x: number; y: number }[] = [
    { x: 80, y: 240 },
    { x: 180, y: 180 },
    { x: 100, y: 110 },
    { x: 200, y: 50 },
  ];
  const p0 = positions[0]!;
  const p1 = positions[1]!;
  const p2 = positions[2]!;
  const p3 = positions[3]!;

  return (
    <View style={{
      backgroundColor: theme.tints.teal,
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
          fontSize: theme.textStyles.heading.fontSize,
          fontWeight: '800',
          color: theme.colors.ink,
          flex: 1,
        }}>
          {goal.title}
        </Text>
        <View style={{
          backgroundColor: theme.colors.surface,
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
            {completedCount} из {total}
          </Text>
        </View>
      </View>

      {/* Visual path */}
      <View style={{
        height: 280,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: theme.borderWidth.thin,
        borderColor: theme.colors.ink,
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <View style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.tints.teal,
          opacity: 0.5,
        }} />
        <View style={{
          position: 'absolute',
          bottom: 40,
          left: 30,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: theme.tints.teal,
          opacity: 0.3,
        }} />

        {/* SVG Path */}
        <Svg height="280" width="100%" style={{ position: 'absolute' }}>
          <Defs>
            <Pattern id="dots" patternUnits="userSpaceOnUse" width="8" height="8">
              <Circle cx="2" cy="2" r="1.5" fill={theme.colors.ink} />
            </Pattern>
          </Defs>

          {/* Dotted path connecting nodes */}
          <Path
            d={`M ${p0.x} ${p0.y}
                Q ${p0.x + 60} ${p0.y - 30} ${p1.x} ${p1.y}
                Q ${p1.x - 50} ${p1.y - 40} ${p2.x} ${p2.y}
                Q ${p2.x + 60} ${p2.y - 30} ${p3.x} ${p3.y}`}
            stroke={theme.colors.ink}
            strokeWidth="3"
            strokeDasharray="8 8"
            fill="none"
          />
        </Svg>

        {/* Milestone nodes */}
        {positions.slice(0, Math.min(total, 4)).map((pos, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isLocked = idx > currentIndex;

          return (
            <View key={idx} style={{
              position: 'absolute',
              left: pos.x - 24,
              top: pos.y - 24,
              alignItems: 'center',
            }}>
              {/* Current position tooltip */}
              {isCurrent && (
                <View style={{
                  position: 'absolute',
                  top: -40,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: theme.borderWidth.thin,
                  borderColor: theme.colors.ink,
                  paddingHorizontal: theme.spacing[2],
                  paddingVertical: theme.spacing[1],
                  ...theme.shadows.chip,
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: theme.colors.ink,
                  }}>
                    Ты здесь: {milestones[idx]?.title ?? `Этап ${idx + 1}`}
                  </Text>
                </View>
              )}

              {/* Node circle */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isCompleted ? theme.colors.success : isCurrent ? theme.tints.sun : theme.colors.surface,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                alignItems: 'center',
                justifyContent: 'center',
                ...theme.shadows.chip,
              }}>
                {isCompleted && (
                  <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>✓</Text>
                )}
                {isCurrent && (
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: theme.colors.secondary,
                    borderWidth: 2,
                    borderColor: theme.colors.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 14 }}>😊</Text>
                  </View>
                )}
                {isLocked && (
                  <Text style={{ fontSize: 20 }}>🔒</Text>
                )}
              </View>

              {/* Milestone label */}
              {!isCurrent && (
                <Text style={{
                  marginTop: 4,
                  fontSize: 10,
                  fontWeight: '600',
                  color: theme.colors.ink,
                  textAlign: 'center',
                  maxWidth: 70,
                }}>
                  {milestones[idx]?.title ?? `Этап ${idx + 1}`}
                </Text>
              )}
            </View>
          );
        })}

        {/* Flag at end */}
        <View style={{
          position: 'absolute',
          right: 30,
          top: 20,
        }}>
          <Text style={{ fontSize: 24 }}>🚩</Text>
        </View>
      </View>

      {/* Helper text */}
      <Text style={{
        fontSize: theme.textStyles.caption.fontSize,
        color: theme.colors.ink,
        marginTop: theme.spacing[3],
        textAlign: 'center',
        opacity: 0.7,
      }}>
        Этапы открываются сами, когда ты всё освоишь
      </Text>
    </View>
  );
}

function ActivityGoalCard({ goal, theme }: { goal: Goal; theme: ReturnType<typeof useTheme> }) {
  const milestones = goal.milestones ?? [];
  const completedCount = milestones.filter((m) => m.completed).length;
  const total = milestones.length || 3;

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.regular,
      borderColor: theme.colors.ink,
      padding: theme.spacing[4],
      marginBottom: theme.spacing[3],
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[3],
      ...theme.shadows.card,
    }}>
      {/* Icon */}
      <View style={{
        width: 56,
        height: 56,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.tints.violet,
        borderWidth: theme.borderWidth.regular,
        borderColor: theme.colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 28 }}>🏔️</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing[2],
        }}>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            fontWeight: '800',
            color: theme.colors.ink,
            flex: 1,
          }}>
            {goal.title}
          </Text>
          <Text style={{
            fontSize: theme.textStyles.caption.fontSize,
            fontWeight: '600',
            color: theme.colors.textSecondary,
          }}>
            {completedCount} из {total}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={{
          flexDirection: 'row',
          gap: theme.spacing[1],
        }}>
          {Array.from({ length: total }).map((_, idx) => (
            <View
              key={idx}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                backgroundColor: idx < completedCount ? theme.colors.primary : theme.colors.disabled,
              }}
            />
          ))}
        </View>

        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          color: theme.colors.textSecondary,
          marginTop: theme.spacing[2],
        }}>
          Следующий этап подтвердит тренер или родитель
        </Text>
      </View>
    </View>
  );
}

export default function ChildGoalsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { children, activeChildId } = useAuthStore();

  const child = children.find((c) => c.id === activeChildId);
  const childId = child?.id ?? null;
  const goalsQuery = useGoalsQuery(childId);
  const masteryQuery = useSkillMasteryMap(childId);

  const allGoals = (goalsQuery.data ?? []).filter((g) => g.status !== 'cancelled') as unknown as Goal[];
  const activeGoals = allGoals.filter((g) => g.status === 'active');
  const draftGoals = allGoals.filter((g) => g.status === 'draft');

  const currentYear = new Date().getFullYear();
  const birthYear = child?.birthYear ?? currentYear - 10;
  const age = currentYear - birthYear;
  const canPropose = age >= 10;

  if (goalsQuery.isLoading || masteryQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const learningGoals = activeGoals.filter((g) => g.domain === 'learning');
  const activityGoals = activeGoals.filter((g) => g.domain === 'activity');

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: 60, paddingBottom: 120 }}>
        {/* Title */}
        <Text style={{
          fontSize: 28,
          fontWeight: '900',
          color: theme.colors.ink,
          marginBottom: theme.spacing[4],
        }} accessibilityRole="header">
          {t('goals.myGoals')}
        </Text>

        {/* Draft proposals waiting */}
        {draftGoals.length > 0 && (
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
            }}>
              ⏳ {t('goals.awaitingApproval')}: {draftGoals.length}
            </Text>
          </View>
        )}

        {/* Learning goals with visual maps */}
        {learningGoals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            onPress={() => {
              console.log('Navigating to goal:', goal.id);
              router.push({ pathname: '/(child)/goals/[id]', params: { id: goal.id } });
            }}
            activeOpacity={0.8}
          >
            <MilestoneMap goal={goal} theme={theme} />
          </TouchableOpacity>
        ))}

        {/* Activity goals */}
        {activityGoals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            onPress={() => {
              console.log('Navigating to goal:', goal.id);
              router.push({ pathname: '/(child)/goals/[id]', params: { id: goal.id } });
            }}
            activeOpacity={0.8}
          >
            <ActivityGoalCard goal={goal} theme={theme} />
          </TouchableOpacity>
        ))}

        {/* Empty state */}
        {allGoals.length === 0 && (
          <View style={{
            alignItems: 'center',
            paddingVertical: theme.spacing[8],
            gap: theme.spacing[4],
          }}>
            <Text style={{ fontSize: 48 }}>🎯</Text>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}>
              {t('goals.noGoalsYet')}
            </Text>
            {canPropose && (
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
                onPress={() => router.push('/(child)/goals/propose' as never)}
              >
                <Text style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: '700',
                  color: theme.colors.onFill,
                }}>
                  {t('goals.proposeGoal')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Propose button for older kids */}
        {canPropose && allGoals.length > 0 && (
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.secondary,
              borderRadius: theme.borderRadius.button,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[4],
              alignItems: 'center',
              marginTop: theme.spacing[4],
              ...theme.shadows.button,
            }}
            onPress={() => router.push('/(child)/goals/propose' as never)}
          >
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '800',
              color: theme.colors.ink,
            }}>
              + {t('goals.proposeGoal')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
