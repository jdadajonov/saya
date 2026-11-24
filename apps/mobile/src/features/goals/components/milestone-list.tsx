import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { checkMilestoneProgress } from '@saya/core';
import type { Milestone, SkillMasteryMap } from '@saya/core';
import type { MilestoneRow } from '../hooks/use-goals';

interface Props {
  milestones: MilestoneRow[];
  masteryMap: SkillMasteryMap;
  onConfirm?: (milestoneId: string) => void;
  showConfirmButton?: boolean;
}

export function MilestoneList({ milestones, masteryMap, onConfirm, showConfirmButton = true }: Props) {
  const { t } = useTranslation();

  const sorted = [...milestones].sort((a, b) => a.position - b.position);

  return (
    <View style={styles.container}>
      {sorted.map((m, idx) => {
        const milestone: Milestone = {
          id: m.id,
          goalId: m.goal_id,
          title: m.title,
          position: m.position,
          achievedAt: m.achieved_at ? new Date(m.achieved_at) : undefined,
          skillCode: m.skill_code ?? undefined,
          masteryThreshold: m.mastery_threshold ?? 0.8,
        };

        const progress = checkMilestoneProgress(milestone, masteryMap);
        const isAchieved = progress.achieved;
        const isLast = idx === sorted.length - 1;

        return (
          <View key={m.id} style={styles.row}>
            {/* Connector line */}
            {!isLast && <View style={styles.connector} />}

            {/* Checkbox/status indicator */}
            <View style={[styles.checkbox, isAchieved && styles.checkboxDone]}>
              {isAchieved ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={styles.stepNum}>{idx + 1}</Text>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.title, isAchieved && styles.titleDone]}>
                {m.title}
              </Text>
              {progress.targetMastery !== undefined && !isAchieved && (
                <Text style={styles.hint}>
                  {t('goals.masteryProgress', {
                    current: Math.round((progress.currentMastery ?? 0) * 100),
                    target: Math.round(progress.targetMastery * 100),
                  })}
                </Text>
              )}
            </View>

            {/* Confirm button (parent only) */}
            {showConfirmButton && !isAchieved && onConfirm && !m.skill_code && (
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => onConfirm(m.id)}
                accessibilityRole="button"
                accessibilityLabel={t('goals.confirmMilestone')}
              >
                <Text style={styles.confirmBtnText}>✓</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  row: {
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
  content: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  titleDone: {
    color: '#10B981',
    textDecorationLine: 'line-through',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  confirmBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
});
