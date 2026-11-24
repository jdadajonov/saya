export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface RecurrenceRule {
  freq: 'daily' | 'weekly';
  days?: WeekDay[];
  time: string;       // "HH:MM" in device local time
  durationMin: number;
}

export interface DateRange {
  startsAt: Date;
  endsAt: Date;
}

export interface SessionSlot extends DateRange {
  activityId: string;
}

export interface Conflict {
  slotA: SessionSlot;
  slotB: SessionSlot;
}
