# Stage 4: Activities

## Goal
Parent creates recurring activities (football, music, swimming). The app generates sessions from a recurrence rule, detects schedule conflicts, sends a push notification to confirm each session, and the child records a mood emoji after completing one.

## Schema (already exists)
`activities(id, child_id, kind, title, place, color, rrule TEXT, …)` — rrule stored as JSON, not iCal.
`activity_sessions(id, activity_id, starts_at, ends_at, status, mood, …)` — pre-materialized instances.

We store rrule as:
```json
{ "freq": "weekly", "days": ["MON", "WED"], "time": "16:00", "durationMin": 60 }
```

No new migrations needed; existing schema + RLS cover everything.

## Recurrence rule format
Supported: `freq=weekly` (days+time+durationMin) and `freq=daily` (time+durationMin).  
On activity creation, the mobile app expands the next **12 weeks** of sessions and batch-inserts them.

## Open questions
- Exceptions (cancel one occurrence): store as `status='cancelled'` on the session — no separate exceptions table needed.
- Timezone: sessions stored in UTC; display converts via device timezone (Intl.DateTimeFormat).

---

## Files

### packages/core/src/activities/ (new)
| File | Contents |
|---|---|
| `types.ts` | `RecurrenceRule`, `ActivityRow`, `SessionRow` interfaces |
| `recurrence.ts` | `expandSessions(rule, startDate, weeks)→DateRange[]`; `detectConflicts(sessions[])→Conflict[]` |
| `index.ts` | re-export |

Tests: `recurrence.test.ts` — weekly/daily expansion, conflict detection, edge cases (DST, zero sessions).

### apps/mobile/app/(parent)/activities/
| File | Screen |
|---|---|
| `index.tsx` | Weekly strip calendar — all children, tap day to see sessions |
| `create.tsx` | Form: child picker, title, kind, color, days checkboxes, time + duration, preview next 3 sessions |
| `[id].tsx` | Activity detail: list of upcoming sessions, cancel one, delete activity |

### apps/mobile/app/(child)/
- `index.tsx` update — add "Today" activity strip (already has quick-access cards)

### apps/mobile/src/features/activities/
| File | Contents |
|---|---|
| `hooks/use-activities.ts` | `useActivitiesQuery`, `useCreateActivity`, `useConfirmSession`, `useRecordMood` |
| `components/session-confirm-sheet.tsx` | Bottom sheet: "Soccer today?" → Done / Missed |
| `components/mood-picker.tsx` | Row of 5 emojis (😄 🙂 😐 😕 😩); accessible |
| `components/weekly-strip.tsx` | 7-day horizontal scroll, dot per session, today highlighted |
| `components/activity-form.tsx` | Reusable form used by create screen |

### Push notifications
- After creating an activity, schedule local `expo-notifications` for each session end time (up to 12 weeks).
- Notification: "{{title}} закончился. Как прошло?" → taps open `/(parent)/activities/[id]` confirm sheet.
- Quiet hours: skip scheduling if session ends between 22:00–08:00.
- Cancel all notifications for an activity when it's deleted.

### i18n additions (ru / uz / en)
`activities.title`, `activities.create`, `activities.kind.*` (sport/music/language/other),
`activities.confirmDone`, `activities.confirmMissed`, `activities.moodPrompt`,
`activities.days.*` (MON–SUN abbr), `activities.noActivitiesToday`, `activities.conflict`.

---

## Definition of Done
- [ ] TypeScript strict + lint clean, CI green
- [ ] `packages/core` coverage ≥ 90% (recurrence logic fully tested)
- [ ] Parent can create a weekly activity and see sessions in the calendar
- [ ] Parent can mark session done/missed from notification or list
- [ ] Child sees today's activities on home screen
- [ ] Child can record a mood emoji after a done session
- [ ] Conflict detected and shown if two sessions overlap for the same child
- [ ] Zero hardcoded strings
- [ ] VoiceOver labels on all interactive elements
