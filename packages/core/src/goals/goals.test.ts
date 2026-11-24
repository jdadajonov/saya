import { GOAL_TEMPLATES, getTemplateById } from './templates';
import {
  checkMilestoneProgress,
  checkGoalCompleted,
  countAchievedMilestones,
  getGoalProgress,
} from './progress';
import type { Milestone } from './types';

describe('GOAL_TEMPLATES', () => {
  it('has at least 3 templates', () => {
    expect(GOAL_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it('each template has required fields', () => {
    for (const t of GOAL_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.domain).toMatch(/^(learning|activity)$/);
      expect(t.titleKey).toBeTruthy();
      expect(t.milestones.length).toBeGreaterThan(0);
    }
  });

  it('multiplication-mastery template has 9 milestones', () => {
    const t = GOAL_TEMPLATES.find((x) => x.id === 'multiplication-mastery');
    expect(t?.milestones.length).toBe(9);
  });

  it('learning milestones have skillCode', () => {
    const t = GOAL_TEMPLATES.find((x) => x.id === 'multiplication-mastery');
    for (const m of t?.milestones ?? []) {
      expect(m.skillCode).toMatch(/^math\.mul\.\d+$/);
    }
  });

  it('activity milestones have sessionCount', () => {
    const t = GOAL_TEMPLATES.find((x) => x.id === 'sports-consistency');
    for (const m of t?.milestones ?? []) {
      expect(typeof m.sessionCount).toBe('number');
    }
  });
});

describe('getTemplateById', () => {
  it('returns template by id', () => {
    const t = getTemplateById('multiplication-mastery');
    expect(t?.id).toBe('multiplication-mastery');
  });

  it('returns undefined for unknown id', () => {
    expect(getTemplateById('nonexistent')).toBeUndefined();
  });
});

describe('checkMilestoneProgress', () => {
  const baseMilestone = (overrides?: Partial<Milestone>): Milestone => ({
    id: 'ms-1',
    goalId: 'goal-1',
    title: 'Test milestone',
    position: 0,
    ...overrides,
  });

  it('returns achieved=true if already achieved', () => {
    const ms = baseMilestone({ achievedAt: new Date() });
    const result = checkMilestoneProgress(ms, {});
    expect(result.achieved).toBe(true);
  });

  it('checks skill mastery >= threshold', () => {
    const ms = baseMilestone({ skillCode: 'math.mul.5', masteryThreshold: 0.8 });
    const result = checkMilestoneProgress(ms, { 'math.mul.5': 0.85 });
    expect(result.achieved).toBe(true);
    expect(result.currentMastery).toBe(0.85);
    expect(result.targetMastery).toBe(0.8);
  });

  it('returns achieved=false if mastery below threshold', () => {
    const ms = baseMilestone({ skillCode: 'math.mul.5', masteryThreshold: 0.8 });
    const result = checkMilestoneProgress(ms, { 'math.mul.5': 0.5 });
    expect(result.achieved).toBe(false);
  });

  it('uses default threshold 0.8 if not specified', () => {
    const ms = baseMilestone({ skillCode: 'math.mul.5' });
    expect(checkMilestoneProgress(ms, { 'math.mul.5': 0.79 }).achieved).toBe(false);
    expect(checkMilestoneProgress(ms, { 'math.mul.5': 0.8 }).achieved).toBe(true);
  });

  it('returns achieved=false for skill not in masteryMap', () => {
    const ms = baseMilestone({ skillCode: 'math.mul.5', masteryThreshold: 0.8 });
    const result = checkMilestoneProgress(ms, {});
    expect(result.achieved).toBe(false);
    expect(result.currentMastery).toBe(0);
  });

  it('manual milestone (no skillCode) returns achieved=false', () => {
    const ms = baseMilestone();
    const result = checkMilestoneProgress(ms, {});
    expect(result.achieved).toBe(false);
  });
});

describe('checkGoalCompleted', () => {
  const ms = (id: string, skillCode: string, achievedAt?: Date): Milestone => ({
    id,
    goalId: 'goal-1',
    title: id,
    position: 0,
    skillCode,
    masteryThreshold: 0.8,
    achievedAt,
  });

  it('returns true if all milestones achieved', () => {
    const milestones = [
      ms('ms-1', 'skill.a', new Date()),
      ms('ms-2', 'skill.b', new Date()),
    ];
    expect(checkGoalCompleted(milestones, {})).toBe(true);
  });

  it('returns true if all skill-based milestones meet threshold', () => {
    const milestones = [
      ms('ms-1', 'skill.a'),
      ms('ms-2', 'skill.b'),
    ];
    expect(checkGoalCompleted(milestones, { 'skill.a': 0.9, 'skill.b': 0.85 })).toBe(true);
  });

  it('returns false if any milestone not achieved', () => {
    const milestones = [
      ms('ms-1', 'skill.a'),
      ms('ms-2', 'skill.b'),
    ];
    expect(checkGoalCompleted(milestones, { 'skill.a': 0.9, 'skill.b': 0.5 })).toBe(false);
  });

  it('returns false for empty milestones array', () => {
    expect(checkGoalCompleted([], {})).toBe(false);
  });
});

describe('countAchievedMilestones', () => {
  const ms = (id: string, skillCode: string, achievedAt?: Date): Milestone => ({
    id,
    goalId: 'goal-1',
    title: id,
    position: 0,
    skillCode,
    masteryThreshold: 0.8,
    achievedAt,
  });

  it('counts already-achieved milestones', () => {
    const milestones = [
      ms('ms-1', 'skill.a', new Date()),
      ms('ms-2', 'skill.b'),
    ];
    expect(countAchievedMilestones(milestones, {})).toBe(1);
  });

  it('counts skill-based milestones meeting threshold', () => {
    const milestones = [
      ms('ms-1', 'skill.a'),
      ms('ms-2', 'skill.b'),
      ms('ms-3', 'skill.c'),
    ];
    expect(countAchievedMilestones(milestones, { 'skill.a': 0.9, 'skill.b': 0.9 })).toBe(2);
  });
});

describe('getGoalProgress', () => {
  const ms = (id: string, skillCode: string, achievedAt?: Date): Milestone => ({
    id,
    goalId: 'goal-1',
    title: id,
    position: 0,
    skillCode,
    masteryThreshold: 0.8,
    achievedAt,
  });

  it('calculates correct progress', () => {
    const milestones = [
      ms('ms-1', 'skill.a', new Date()),
      ms('ms-2', 'skill.b'),
      ms('ms-3', 'skill.c'),
      ms('ms-4', 'skill.d'),
    ];
    const result = getGoalProgress(milestones, { 'skill.b': 0.9 });
    expect(result.achieved).toBe(2); // ms-1 (already achieved) + ms-2 (mastery)
    expect(result.total).toBe(4);
    expect(result.percent).toBe(50);
  });

  it('returns 0% for empty milestones', () => {
    const result = getGoalProgress([], {});
    expect(result.percent).toBe(0);
  });

  it('returns 100% when all achieved', () => {
    const milestones = [
      ms('ms-1', 'skill.a', new Date()),
      ms('ms-2', 'skill.b', new Date()),
    ];
    const result = getGoalProgress(milestones, {});
    expect(result.percent).toBe(100);
  });
});
