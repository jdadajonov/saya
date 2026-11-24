# Stage 5: Goals

## Goal
Parent sets goals with milestones for a child. Goals can be linked to learning skills (auto-close when mastery reached) or activities. Children aged 10–13 can propose their own goals, which go to `draft` status until a parent approves.

## Schema (already exists)
- `goals(id, child_id, domain, title, status, proposed_by, approved_by, …)`
- `milestones(id, goal_id, title, position, achieved_at, …)`
- `evidence(id, milestone_id, session_id, kind, confirmed_by, payload, …)`

New optional column (migration):
- `goals.skill_code TEXT` — links learning goals to a skill (e.g., `math.mul.5`) for auto-close

## Concepts

### Goal templates (packages/core)
Pre-built goals with milestones. Examples:
| Template | Domain | Milestones |
|---|---|---|
| Multiplication mastery | learning | 1–9 tables (9 milestones) |
| Sports consistency | activity | Attend 5 / 10 / 20 sessions |
| Reading challenge | learning | Read 3 / 5 / 10 books |

### Auto-close by mastery
Learning goals link to a `skill_code`. When `skill_states.mastery >= 0.8` for that skill, the milestone is achieved automatically. We check on each `MissionCompleted` event in the grant-reward Edge Function.

### Child proposal (10–13)
Child creates goal with `status='draft'`, `proposed_by='child'`. Parent sees pending proposals and can approve (→ `status='active'`) or decline (→ `status='cancelled'`).

---

## Files

### packages/core/src/goals/
| File | Contents |
|---|---|
| `types.ts` | `Goal`, `Milestone`, `GoalTemplate`, `MilestoneProgress` interfaces |
| `templates.ts` | `GOAL_TEMPLATES` array with pre-built templates |
| `progress.ts` | `checkMilestoneAchieved(milestone, masteryMap)` — returns true if skill mastery threshold met |
| `index.ts` | re-export |

Tests: `goals.test.ts` — template validation, progress checks.

### supabase/migrations/
`00000000000004_goals_skill_code.sql` — adds `skill_code` column to `goals` table.

### supabase/functions/grant-reward/
Update to check milestone auto-completion on `MissionCompleted`.

### apps/mobile/app/(parent)/goals/
| File | Screen |
|---|---|
| `index.tsx` | List of goals per child, grouped by status (active / completed) |
| `create.tsx` | Pick template or custom, set milestones, optionally link to skill |
| `[id].tsx` | Goal detail: milestone list, manual confirm, delete |

### apps/mobile/app/(child)/goals/
| File | Screen |
|---|---|
| `index.tsx` | Child's goals view with progress |
| `propose.tsx` | Child proposes a goal (10–13 only); creates draft |

### apps/mobile/src/features/goals/
| File | Contents |
|---|---|
| `hooks/use-goals.ts` | `useGoalsQuery`, `useCreateGoal`, `useConfirmMilestone`, `useApproveGoal`, `useProposeGoal` |
| `components/goal-card.tsx` | Card with title + progress ring |
| `components/milestone-list.tsx` | Checklist UI with achieved/pending states |
| `components/template-picker.tsx` | Grid of template cards |

### i18n additions (ru / uz / en)
`goals.title`, `goals.create`, `goals.propose`, `goals.approve`, `goals.decline`,
`goals.milestoneAchieved`, `goals.completed`, `goals.pending`,
`goals.templates.*`, `goals.domains.*`, `goals.status.*`

---

## Definition of Done
- [ ] TypeScript strict + lint clean, CI green
- [ ] `packages/core` coverage ≥ 90%
- [ ] Parent can create a goal from template or custom with milestones
- [ ] Parent can manually confirm a milestone
- [ ] Child (10–13) can propose a goal → parent approves/declines
- [ ] Learning goal auto-completes milestone when skill mastery ≥ 0.8
- [ ] Reward granted on milestone achievement and goal completion
- [ ] Zero hardcoded strings
- [ ] VoiceOver labels on all interactive elements
