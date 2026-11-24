import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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

  const masteryMap = masteryQuery.data ?? {};

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
      <View style={styles.center}>
        <ActivityIndicator color="#4F46E5" size="large" />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('goals.notFound')}</Text>
      </View>
    );
  }

  const isCompleted = goal.status === 'completed';
  const sortedMilestones = [...milestones].sort((a, b) => a.position - b.position);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {goal.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.meta}>
          <Text style={styles.domain}>{t(`goals.domains.${goal.domain}`)}</Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>{t('goals.completed')}</Text>
            </View>
          )}
        </View>

        {/* Pending verification requests banner */}
        {pendingEvidence.length > 0 && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingBannerText}>
              ⏳ {t('goals.pendingVerificationCount', { count: pendingEvidence.length })}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('goals.milestonesLabel')}</Text>
        <View style={styles.milestonesCard}>
          {sortedMilestones.map((m, idx) => {
            const isAchieved = !!m.achieved_at;
            const isPending = pendingMap.has(m.id);
            const isLast = idx === sortedMilestones.length - 1;

            return (
              <View key={m.id} style={styles.milestoneRow}>
                {!isLast && <View style={styles.connector} />}

                <View style={[
                  styles.checkbox,
                  isAchieved && styles.checkboxDone,
                  isPending && styles.checkboxPending,
                ]}>
                  {isAchieved ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : isPending ? (
                    <Text style={styles.pendingIcon}>!</Text>
                  ) : (
                    <Text style={styles.stepNum}>{idx + 1}</Text>
                  )}
                </View>

                <View style={styles.milestoneContent}>
                  <Text style={[styles.milestoneTitle, isAchieved && styles.milestoneTitleDone]}>
                    {m.title}
                  </Text>
                  {isPending && (
                    <Text style={styles.pendingHint}>{t('goals.childRequestedVerification')}</Text>
                  )}
                </View>

                {!isAchieved && !m.skill_code && (
                  <TouchableOpacity
                    style={[styles.confirmBtn, isPending && styles.confirmBtnPending]}
                    onPress={() => handleConfirm(m.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('goals.confirmMilestone')}
                  >
                    <Text style={[styles.confirmBtnText, isPending && styles.confirmBtnTextPending]}>✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {goal.proposed_by === 'child' && goal.status === 'draft' && (
          <View style={styles.proposalNote}>
            <Text style={styles.proposalNoteText}>
              {t('goals.proposedByChild')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: '#6B7280' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: '#4F46E5', fontWeight: '300' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1F2937' },
  content: { padding: 20, gap: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  domain: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
  },
  pendingBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 14,
  },
  pendingBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  milestonesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 15,
    top: 42,
    bottom: -10,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkboxDone: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  checkboxPending: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  stepNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pendingIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  milestoneContent: { flex: 1 },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  milestoneTitleDone: {
    color: '#10B981',
    textDecorationLine: 'line-through',
  },
  pendingHint: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
    fontWeight: '500',
  },
  confirmBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnPending: {
    backgroundColor: '#F59E0B',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  confirmBtnTextPending: {
    color: '#FFFFFF',
  },
  proposalNote: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
  },
  proposalNoteText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
});
