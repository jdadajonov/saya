import { expandSessions, detectConflicts } from './recurrence';
import type { RecurrenceRule, SessionSlot } from './types';

const MON_WED_FRI: RecurrenceRule = {
  freq: 'weekly',
  days: ['MON', 'WED', 'FRI'],
  time: '16:00',
  durationMin: 60,
};

const DAILY: RecurrenceRule = {
  freq: 'daily',
  time: '08:00',
  durationMin: 30,
};

// Monday 2024-01-01 00:00:00 local
const BASE = new Date('2024-01-01T00:00:00');

describe('expandSessions – weekly', () => {
  it('generates correct number of sessions for MWF over 1 week', () => {
    const sessions = expandSessions(MON_WED_FRI, BASE, 1);
    // Week of Jan 1 (Mon): Jan 1, 3, 5 = 3 sessions
    expect(sessions.length).toBe(3);
  });

  it('generates sessions over 2 weeks', () => {
    const sessions = expandSessions(MON_WED_FRI, BASE, 2);
    expect(sessions.length).toBe(6);
  });

  it('sessions have correct start hour and minute', () => {
    const sessions = expandSessions(MON_WED_FRI, BASE, 1);
    for (const s of sessions) {
      expect(s.startsAt.getHours()).toBe(16);
      expect(s.startsAt.getMinutes()).toBe(0);
    }
  });

  it('endsAt = startsAt + durationMin', () => {
    const sessions = expandSessions(MON_WED_FRI, BASE, 1);
    for (const s of sessions) {
      expect(s.endsAt.getTime() - s.startsAt.getTime()).toBe(60 * 60_000);
    }
  });

  it('returns empty array when days is empty', () => {
    const rule: RecurrenceRule = { freq: 'weekly', days: [], time: '10:00', durationMin: 60 };
    expect(expandSessions(rule, BASE, 4)).toHaveLength(0);
  });

  it('returns empty array when weeks=0', () => {
    expect(expandSessions(MON_WED_FRI, BASE, 0)).toHaveLength(0);
  });

  it('excludes sessions before from time on start day', () => {
    // Start at 17:00 on a Monday — the 16:00 session that day should be excluded.
    // Window of 1 week: Jan 1 17:00 → Jan 8 17:00, so Jan 8 Mon 16:00 IS included.
    const lateStart = new Date('2024-01-01T17:00:00');
    const sessions = expandSessions(MON_WED_FRI, lateStart, 1);
    // Jan 1 (Mon 16:00) excluded; Jan 3 (Wed), Jan 5 (Fri), Jan 8 (Mon) included
    expect(sessions.length).toBe(3);
    expect(sessions[0]!.startsAt.getDate()).toBe(3); // first session is Wednesday
  });

  it('sessions fall on the correct weekdays', () => {
    const sessions = expandSessions({ freq: 'weekly', days: ['TUE', 'THU'], time: '09:00', durationMin: 45 }, BASE, 1);
    const days = sessions.map((s) => s.startsAt.getDay());
    expect(days).toEqual([2, 4]); // Tue=2, Thu=4
  });
});

describe('expandSessions – daily', () => {
  it('generates one session per day', () => {
    const sessions = expandSessions(DAILY, BASE, 1);
    expect(sessions.length).toBe(7);
  });

  it('sessions are at correct time', () => {
    const sessions = expandSessions(DAILY, BASE, 1);
    for (const s of sessions) {
      expect(s.startsAt.getHours()).toBe(8);
      expect(s.startsAt.getMinutes()).toBe(0);
    }
  });

  it('daily rule does not need days field', () => {
    const rule: RecurrenceRule = { freq: 'daily', time: '12:00', durationMin: 20 };
    expect(() => expandSessions(rule, BASE, 2)).not.toThrow();
  });
});

describe('detectConflicts', () => {
  const makeSlot = (activityId: string, startH: number, endH: number): SessionSlot => {
    const d = new Date('2024-01-01T00:00:00');
    const startsAt = new Date(d);
    startsAt.setHours(startH, 0, 0, 0);
    const endsAt = new Date(d);
    endsAt.setHours(endH, 0, 0, 0);
    return { activityId, startsAt, endsAt };
  };

  it('detects overlapping sessions from different activities', () => {
    const slots: SessionSlot[] = [
      makeSlot('A', 10, 11),
      makeSlot('B', 10, 11), // exact overlap
    ];
    expect(detectConflicts(slots)).toHaveLength(1);
  });

  it('detects partial overlap', () => {
    const slots: SessionSlot[] = [
      makeSlot('A', 10, 12),
      makeSlot('B', 11, 13),
    ];
    expect(detectConflicts(slots)).toHaveLength(1);
  });

  it('no conflict for adjacent sessions (end == start)', () => {
    const slots: SessionSlot[] = [
      makeSlot('A', 10, 11),
      makeSlot('B', 11, 12), // starts exactly when A ends — not a conflict
    ];
    expect(detectConflicts(slots)).toHaveLength(0);
  });

  it('no conflict for sessions on different days', () => {
    const a = { activityId: 'A', startsAt: new Date('2024-01-01T10:00:00'), endsAt: new Date('2024-01-01T11:00:00') };
    const b = { activityId: 'B', startsAt: new Date('2024-01-02T10:00:00'), endsAt: new Date('2024-01-02T11:00:00') };
    expect(detectConflicts([a, b])).toHaveLength(0);
  });

  it('ignores overlap between sessions of the same activity', () => {
    const slots: SessionSlot[] = [
      makeSlot('A', 10, 12),
      makeSlot('A', 11, 13),
    ];
    expect(detectConflicts(slots)).toHaveLength(0);
  });

  it('returns multiple conflicts', () => {
    const slots: SessionSlot[] = [
      makeSlot('A', 10, 12),
      makeSlot('B', 10, 12),
      makeSlot('C', 10, 12),
    ];
    expect(detectConflicts(slots)).toHaveLength(3); // A-B, A-C, B-C
  });

  it('returns empty for empty input', () => {
    expect(detectConflicts([])).toHaveLength(0);
  });

  it('returns empty for single slot', () => {
    expect(detectConflicts([makeSlot('A', 10, 11)])).toHaveLength(0);
  });

  it('conflict result contains the correct slots', () => {
    const a = makeSlot('A', 10, 11);
    const b = makeSlot('B', 10, 11);
    const conflicts = detectConflicts([a, b]);
    expect(conflicts[0]!.slotA).toBe(a);
    expect(conflicts[0]!.slotB).toBe(b);
  });
});
