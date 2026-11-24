export type GoalDomain = 'learning' | 'activity';
export type GoalStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type ProposedBy = 'parent' | 'child';

export interface MilestoneTemplate {
  title: string;
  skillCode?: string;      // for auto-completion on mastery
  masteryThreshold?: number; // default 0.8
  sessionCount?: number;   // for activity milestones: "attend N sessions"
}

export interface GoalTemplate {
  id: string;
  domain: GoalDomain;
  titleKey: string;        // i18n key
  descriptionKey?: string;
  milestones: MilestoneTemplate[];
}

export interface Goal {
  id: string;
  childId: string;
  domain: GoalDomain;
  title: string;
  status: GoalStatus;
  proposedBy: ProposedBy;
  approvedBy?: string;
  skillCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  position: number;
  achievedAt?: Date;
  skillCode?: string;
  masteryThreshold?: number;
}

export interface MilestoneProgress {
  milestoneId: string;
  achieved: boolean;
  currentMastery?: number;
  targetMastery?: number;
  currentSessions?: number;
  targetSessions?: number;
}
