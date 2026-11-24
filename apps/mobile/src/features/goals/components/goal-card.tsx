import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { GoalWithMilestones } from '../hooks/use-goals';
import { getGoalProgress } from '@saya/core';
import type { Milestone, SkillMasteryMap } from '@saya/core';

interface Props {
  goal: GoalWithMilestones;
  masteryMap: SkillMasteryMap;
  onPress: () => void;
}

function ProgressBar({ percent }: { percent: number }) {
  const color = percent >= 100 ? '#10B981' : '#4F46E5';
  return (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
      <Text style={styles.progressText}>{percent}%</Text>
    </View>
  );
}

export function GoalCard({ goal, masteryMap, onPress }: Props) {
  const { t } = useTranslation();

  const milestones: Milestone[] = goal.milestones.map((m) => ({
    id: m.id,
    goalId: m.goal_id,
    title: m.title,
    position: m.position,
    achievedAt: m.achieved_at ? new Date(m.achieved_at) : undefined,
    skillCode: m.skill_code ?? undefined,
    masteryThreshold: m.mastery_threshold ?? 0.8,
  }));

  const progress = getGoalProgress(milestones, masteryMap);
  const isCompleted = goal.status === 'completed' || progress.percent === 100;
  const isDraft = goal.status === 'draft';

  return (
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.cardCompleted, isDraft && styles.cardDraft]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${goal.title}, ${progress.percent}%`}
    >
      <View style={styles.left}>
        <Text style={styles.domain}>
          {t(`goals.domains.${goal.domain}`)}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {goal.title}
        </Text>
        <Text style={styles.milestonesText}>
          {progress.achieved}/{progress.total} {t('goals.milestones')}
        </Text>
      </View>

      <View style={styles.right}>
        {isCompleted ? (
          <View style={styles.completedBadge}>
            <Text style={styles.completedCheck}>✓</Text>
          </View>
        ) : (
          <ProgressBar percent={progress.percent} />
        )}
      </View>

      {isDraft && (
        <View style={styles.draftBadge}>
          <Text style={styles.draftText}>{t('goals.pending')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  cardDraft: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  left: { flex: 1, gap: 4 },
  domain: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  milestonesText: {
    fontSize: 13,
    color: '#6B7280',
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    width: 56,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  completedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheck: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  draftBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FDE68A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  draftText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
});
