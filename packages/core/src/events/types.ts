export type DomainEventType =
  | 'MissionCompleted'
  | 'SessionConfirmed'
  | 'MilestoneAchieved'
  | 'GoalCompleted'
  | 'WeekStreakAchieved'
  | 'SkillMastered'
  | 'ParentSurpriseGranted';

export interface DomainEvent {
  type: DomainEventType;
  childId: string;
  familyId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface MissionCompletedPayload {
  missionId: string;
  subjectCode: string;
  correctCount: number;
  totalCount: number;
  durationMs: number;
}

export interface SessionConfirmedPayload {
  activitySessionId: string;
  activityId: string;
  confirmedBy: string;
}

export interface MilestoneAchievedPayload {
  milestoneId: string;
  goalId: string;
  domain: 'learning' | 'activity';
}

export interface SkillMasteredPayload {
  skillCode: string;
  mastery: number;
}
