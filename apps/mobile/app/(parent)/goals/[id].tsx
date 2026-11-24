import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
import {
  useGoalDetailQuery,
  useConfirmMilestone,
  useSkillMasteryMap,
  usePendingEvidenceQuery,
  useApproveEvidence,
} from '../../../src/features/goals/hooks/use-goals';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';

export default function GoalDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const goalQuery = useGoalDetailQuery(id ?? null);
  const masteryQuery = useSkillMasteryMap(goalQuery.data?.child_id ?? null);
  const confirmMut = useConfirmMilestone();
  const approveMut = useApproveEvidence();

  const goal = goalQuery.data;
  const milestones = goal?.milestones ?? [];
  const milestoneIds = milestones.map((m) => m.id);
  const pendingQuery = usePendingEvidenceQuery(milestoneIds);
  const pendingEvidence = pendingQuery.data ?? [];
  const pendingMap = new Map(pendingEvidence.map((e) => [e.milestone_id, e]));

  const handleConfirm = (milestoneId: string) => {
    const evidence = pendingMap.get(milestoneId);

    if (evidence) {
      Alert.alert(
        t('goals.confirmChildMilestone'),
        t('goals.confirmChildMilestoneDesc'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: () => approveMut.mutate({
              evidenceId: evidence.id,
              milestoneId,
              userId: user?.id ?? '',
            }),
          },
        ],
      );
    } else {
      Alert.alert(
        t('goals.confirmMilestone'),
        t('goals.confirmMilestoneDesc'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: () => confirmMut.mutate({ milestoneId }),
          },
        ],
      );
    }
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
        <Text style={{ fontSize: 48, marginBottom: theme.spacing[3] }}>🎯</Text>
        <Text style={{ fontSize: theme.textStyles.body.fontSize, color: theme.colors.textSecondary }}>
          {t('goals.notFound')}
        </Text>
      </View>
    );
  }

  const isCompleted = goal.status === 'completed';
  const sortedMilestones = [...milestones].sort((a, b) => a.position - b.position);

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
        >
          <Text style={{ fontSize: 20, color: theme.colors.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          fontSize: theme.textStyles.title.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
        }} numberOfLines={1}>
          {goal.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing[5] }}>
        {/* Meta */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
          <View style={{
            backgroundColor: theme.tints.violet,
            borderRadius: theme.borderRadius.full,
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[1],
          }}>
            <Text style={{
              fontSize: theme.textStyles.caption.fontSize,
              fontWeight: '700',
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
            }}>
              <Text style={{
                fontSize: theme.textStyles.caption.fontSize,
                fontWeight: '700',
                color: theme.colors.surface,
                textTransform: 'uppercase',
              }}>
                {t('goals.completed')}
              </Text>
            </View>
          )}
        </View>

        {/* Pending verification banner */}
        {pendingEvidence.length > 0 && (
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
              textAlign: 'center',
            }}>
              ⏳ {t('goals.pendingVerificationCount', { count: pendingEvidence.length })}
            </Text>
          </View>
        )}

        {/* Milestones */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '700',
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: theme.spacing[3],
        }}>
          {t('goals.milestonesLabel')}
        </Text>

        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.card,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          padding: theme.spacing[4],
          ...theme.shadows.card,
        }}>
          {sortedMilestones.map((m, idx) => {
            const isAchieved = !!m.achieved_at;
            const isPending = pendingMap.has(m.id);
            const isLast = idx === sortedMilestones.length - 1;

            return (
              <View key={m.id} style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: theme.spacing[3],
                gap: theme.spacing[3],
                borderBottomWidth: isLast ? 0 : theme.borderWidth.thin,
                borderBottomColor: theme.colors.disabled,
              }}>
                {/* Checkbox */}
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: isAchieved ? theme.colors.success : isPending ? theme.tints.sun : theme.colors.disabled,
                  backgroundColor: isAchieved ? theme.colors.success : isPending ? theme.tints.sun : theme.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {isAchieved ? (
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.surface }}>✓</Text>
                  ) : isPending ? (
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.ink }}>!</Text>
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary }}>{idx + 1}</Text>
                  )}
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '600',
                    color: isAchieved ? theme.colors.success : theme.colors.ink,
                    textDecorationLine: isAchieved ? 'line-through' : 'none',
                  }}>
                    {m.title}
                  </Text>
                  {isPending && (
                    <Text style={{
                      fontSize: theme.textStyles.caption.fontSize,
                      color: theme.colors.ink,
                      marginTop: 2,
                    }}>
                      {t('goals.childRequestedVerification')}
                    </Text>
                  )}
                </View>

                {/* Confirm button */}
                {!isAchieved && !m.skill_code && (
                  <TouchableOpacity
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: isPending ? theme.tints.sun : theme.tints.teal,
                      borderWidth: theme.borderWidth.thin,
                      borderColor: theme.colors.ink,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => handleConfirm(m.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('goals.confirmMilestone')}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.ink }}>✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Proposal note */}
        {goal.proposed_by === 'child' && goal.status === 'draft' && (
          <View style={{
            backgroundColor: theme.tints.sun,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            marginTop: theme.spacing[4],
          }}>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
              textAlign: 'center',
            }}>
              {t('goals.proposedByChild')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
