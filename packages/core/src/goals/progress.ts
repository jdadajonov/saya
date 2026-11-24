import type { Milestone, MilestoneProgress } from './types';

const DEFAULT_MASTERY_THRESHOLD = 0.8;

export interface SkillMasteryMap {
  [skillCode: string]: number; // mastery 0–1
}

export interface ActivitySessionCount {
  [activityId: string]: number; // number of 'done' sessions
}

export function checkMilestoneProgress(
  milestone: Milestone,
  masteryMap: SkillMasteryMap,
  _sessionCounts?: ActivitySessionCount,
): MilestoneProgress {
  // If already achieved, return achieved
  if (milestone.achievedAt) {
    return { milestoneId: milestone.id, achieved: true };
  }

  // Skill-based milestone (learning)
  if (milestone.skillCode) {
    const currentMastery = masteryMap[milestone.skillCode] ?? 0;
    const targetMastery = milestone.masteryThreshold ?? DEFAULT_MASTERY_THRESHOLD;
    const achieved = currentMastery >= targetMastery;
    return {
      milestoneId: milestone.id,
      achieved,
      currentMastery,
      targetMastery,
    };
  }

  // Manual milestone (no auto-check criteria)
  return { milestoneId: milestone.id, achieved: false };
}

export function checkGoalCompleted(
  milestones: Milestone[],
  masteryMap: SkillMasteryMap,
): boolean {
  if (milestones.length === 0) return false;
  return milestones.every((m) => {
    const progress = checkMilestoneProgress(m, masteryMap);
    return progress.achieved;
  });
}

export function countAchievedMilestones(
  milestones: Milestone[],
  masteryMap: SkillMasteryMap,
): number {
  return milestones.filter((m) => checkMilestoneProgress(m, masteryMap).achieved).length;
}

export function getGoalProgress(
  milestones: Milestone[],
  masteryMap: SkillMasteryMap,
): { achieved: number; total: number; percent: number } {
  const total = milestones.length;
  const achieved = countAchievedMilestones(milestones, masteryMap);
  const percent = total > 0 ? Math.round((achieved / total) * 100) : 0;
  return { achieved, total, percent };
}
