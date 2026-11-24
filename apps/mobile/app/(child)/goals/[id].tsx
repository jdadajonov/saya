import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
import {
  useGoalDetailQuery,
  useSkillMasteryMap,
  usePendingEvidenceQuery,
  useRequestMilestoneVerification,
} from '../../../src/features/goals/hooks/use-goals';

export default function ChildGoalDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const goalQuery = useGoalDetailQuery(id ?? null);
  const masteryQuery = useSkillMasteryMap(goalQuery.data?.child_id ?? null);
  const requestVerification = useRequestMilestoneVerification();

  const goal = goalQuery.data;
  const milestones = goal?.milestones ?? [];
  const milestoneIds = milestones.map((m) => m.id);
  const pendingQuery = usePendingEvidenceQuery(milestoneIds);
  const pendingMilestoneIds = new Set((pendingQuery.data ?? []).map((e) => e.milestone_id));

  const sortedMilestones = [...milestones].sort((a, b) => a.position - b.position);
  const currentMilestoneIndex = sortedMilestones.findIndex((m) => !m.achieved_at);
  const currentMilestone = currentMilestoneIndex >= 0 ? sortedMilestones[currentMilestoneIndex] : null;

  const handleRequestVerification = () => {
    if (!currentMilestone) return;

    Alert.alert(
      t('goals.confirmSubmit'),
      t('goals.confirmSubmitDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('goals.submit'),
          onPress: () => {
            requestVerification.mutate(
              { milestoneId: currentMilestone.id },
              {
                onSuccess: () => {
                  Alert.alert(t('goals.submitted'), t('goals.submittedDesc'));
                },
                onError: () => {
                  Alert.alert(t('common.error'), t('common.retry'));
                },
              }
            );
          },
        },
      ]
    );
  };

  if (goalQuery.isLoading || masteryQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ fontSize: theme.textStyles.body.fontSize, color: theme.colors.textSecondary }}>
          {t('goals.notFound')}
        </Text>
      </View>
    );
  }

  const isCompleted = goal.status === 'completed';
  const isDraft = goal.status === 'draft';
  const completedCount = sortedMilestones.filter((m) => m.achieved_at).length;
  const totalCount = sortedMilestones.length;

  const currentIsPending = currentMilestone && pendingMilestoneIds.has(currentMilestone.id);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[4],
        paddingTop: 60,
        paddingBottom: theme.spacing[4],
        backgroundColor: theme.colors.surface,
        borderBottomWidth: theme.borderWidth.thin,
        borderBottomColor: theme.colors.ink,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 28, color: theme.colors.primary, fontWeight: '300' }}>‹</Text>
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: theme.textStyles.heading.fontSize,
            fontWeight: '700',
            color: theme.colors.ink,
          }}
          numberOfLines={1}
        >
          {goal.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingBottom: 140 }}>
        {/* Status badges */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
          <View style={{
            backgroundColor: theme.tints.violet,
            borderRadius: theme.borderRadius.full,
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[1],
            borderWidth: theme.borderWidth.thin,
            borderColor: theme.colors.ink,
          }}>
            <Text style={{
              fontSize: theme.textStyles.caption.fontSize,
              fontWeight: '600',
              color: theme.colors.ink,
              textTransform: 'uppercase',
            }}>
              {t(`goals.domains.${goal.domain}`)}
            </Text>
          </View>

          {isCompleted && (
            <View style={{
              backgroundColor: theme.colors.success,
              borderRadius: theme.borderRadius.full,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[1],
              borderWidth: theme.borderWidth.thin,
              borderColor: theme.colors.ink,
            }}>
              <Text style={{
                fontSize: theme.textStyles.caption.fontSize,
                fontWeight: '700',
                color: '#fff',
                textTransform: 'uppercase',
              }}>
                {t('goals.completed')}
              </Text>
            </View>
          )}

          {isDraft && (
            <View style={{
              backgroundColor: theme.tints.sun,
              borderRadius: theme.borderRadius.full,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[1],
              borderWidth: theme.borderWidth.thin,
              borderColor: theme.colors.ink,
            }}>
              <Text style={{
                fontSize: theme.textStyles.caption.fontSize,
                fontWeight: '700',
                color: theme.colors.ink,
                textTransform: 'uppercase',
              }}>
                {t('goals.pending')}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }} />

          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            fontWeight: '700',
            color: theme.colors.ink,
          }}>
            {completedCount} / {totalCount}
          </Text>
        </View>

        {/* Pending approval notice for draft goals */}
        {isDraft && (
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
              color: theme.colors.ink,
              textAlign: 'center',
            }}>
              ⏳ {t('goals.waitingForParentApproval')}
            </Text>
          </View>
        )}

        {/* Progress card */}
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
            fontSize: theme.textStyles.caption.fontSize,
            fontWeight: '600',
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            marginBottom: theme.spacing[3],
          }}>
            {t('goals.milestonesLabel')}
          </Text>

          {sortedMilestones.map((m, idx) => {
            const isAchieved = !!m.achieved_at;
            const isCurrent = idx === currentMilestoneIndex;
            const isPending = pendingMilestoneIds.has(m.id);
            const isLast = idx === sortedMilestones.length - 1;

            return (
              <View key={m.id} style={{ marginBottom: isLast ? 0 : theme.spacing[3] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                  {/* Status indicator */}
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isAchieved
                      ? theme.colors.success
                      : isPending
                        ? theme.tints.sun
                        : isCurrent
                          ? theme.colors.primary
                          : theme.colors.disabled,
                    borderWidth: theme.borderWidth.regular,
                    borderColor: theme.colors.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...theme.shadows.chip,
                  }}>
                    {isAchieved ? (
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>✓</Text>
                    ) : isPending ? (
                      <Text style={{ fontSize: 16 }}>⏳</Text>
                    ) : (
                      <Text style={{
                        fontSize: theme.textStyles.body.fontSize,
                        fontWeight: '700',
                        color: isCurrent ? '#fff' : theme.colors.textSecondary,
                      }}>
                        {idx + 1}
                      </Text>
                    )}
                  </View>

                  {/* Milestone content */}
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: theme.textStyles.body.fontSize,
                      fontWeight: isCurrent ? '700' : '600',
                      color: isAchieved ? theme.colors.success : theme.colors.ink,
                      textDecorationLine: isAchieved ? 'line-through' : 'none',
                    }}>
                      {m.title}
                    </Text>
                    {isPending && (
                      <Text style={{
                        fontSize: theme.textStyles.caption.fontSize,
                        color: theme.colors.textSecondary,
                        marginTop: 2,
                      }}>
                        {t('goals.awaitingParentConfirm')}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Connector line */}
                {!isLast && (
                  <View style={{
                    marginLeft: 19,
                    width: 2,
                    height: 16,
                    backgroundColor: idx < currentMilestoneIndex ? theme.colors.success : theme.colors.disabled,
                    marginTop: theme.spacing[1],
                    marginBottom: theme.spacing[1],
                  }} />
                )}
              </View>
            );
          })}
        </View>

        {/* Current milestone highlight */}
        {currentMilestone && !isDraft && (
          <View style={{
            backgroundColor: currentIsPending ? theme.tints.sun : theme.tints.teal,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            ...theme.shadows.card,
          }}>
            <Text style={{
              fontSize: theme.textStyles.caption.fontSize,
              fontWeight: '600',
              color: theme.colors.ink,
              textTransform: 'uppercase',
              marginBottom: theme.spacing[2],
            }}>
              {currentIsPending ? t('goals.pendingVerification') : t('goals.currentStep')}
            </Text>
            <Text style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '800',
              color: theme.colors.ink,
            }}>
              {currentMilestone.title}
            </Text>
            {currentIsPending && (
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.ink,
                marginTop: theme.spacing[2],
                opacity: 0.7,
              }}>
                {t('goals.waitingForParentToConfirm')}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom button */}
      {currentMilestone && !isDraft && !currentIsPending && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: theme.spacing[5],
          paddingBottom: 40,
          backgroundColor: theme.colors.background,
          borderTopWidth: theme.borderWidth.thin,
          borderTopColor: theme.colors.ink,
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.success,
              borderRadius: theme.borderRadius.button,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[4],
              alignItems: 'center',
              ...theme.shadows.button,
            }}
            onPress={handleRequestVerification}
            disabled={requestVerification.isPending}
          >
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '800',
              color: '#fff',
            }}>
              {requestVerification.isPending ? t('common.loading') : `✓ ${t('goals.markAsDone')}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
