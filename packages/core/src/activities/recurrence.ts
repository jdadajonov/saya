import type { RecurrenceRule, DateRange, SessionSlot, Conflict } from './types';

const WEEKDAY_TO_JS: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

export function expandSessions(
  rule: RecurrenceRule,
  from: Date,
  weeks = 12,
): DateRange[] {
  const [hStr, mStr] = rule.time.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  const until = new Date(from.getTime() + weeks * 7 * 86_400_000);
  const results: DateRange[] = [];

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < until) {
    const dow = cursor.getDay();
    const matches =
      rule.freq === 'daily' ||
      (rule.freq === 'weekly' &&
        (rule.days ?? []).some((d) => WEEKDAY_TO_JS[d] === dow));

    if (matches) {
      const startsAt = new Date(cursor);
      startsAt.setHours(h, m, 0, 0);
      if (startsAt >= from) {
        const endsAt = new Date(startsAt.getTime() + rule.durationMin * 60_000);
        results.push({ startsAt, endsAt });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

export function detectConflicts(slots: SessionSlot[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const slotA = slots[i] as SessionSlot;
      const slotB = slots[j] as SessionSlot;
      if (slotA.activityId === slotB.activityId) continue;
      if (slotA.startsAt < slotB.endsAt && slotB.startsAt < slotA.endsAt) {
        conflicts.push({ slotA, slotB });
      }
    }
  }

  return conflicts;
}
