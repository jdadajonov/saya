# Stage 2: Learning Engine + Multiplication Table (Game Edition)

## Goal
A child opens the multiplication table, sees a mission map (9 rows = 9 levels), starts a 10-question battle, earns combo bonuses for streaks, sees animated feedback, gets stars (1–3) and XP on the results screen. Everything is a game — no "exercise", no "task" — only battles, bosses, stars, combos.

## Game mechanics
| Mechanic | Rule |
|---|---|
| **Combo** | 3 correct in a row → ×2 XP, 5 in a row → ×3 XP; shown as a live badge ("🔥 ×3") |
| **Speed bonus** | Answer < 3 s → "+Молниеносно!" badge, +1 XP (not punishing — slow is fine) |
| **Stars** | 3 ★ ≥ 90% accuracy; 2 ★ ≥ 70%; 1 ★ completed |
| **Self-correction** | Wrong then immediately right → "Нашёл!" badge, XP not deducted |
| **Mission map** | 9 rows of ×N (1–9), each shows best stars; unlocked sequentially |
| **Boss battle** | After completing any row → 5-question mix from all unlocked rows |
| **Haptics** | Correct → light impact; Wrong → medium impact; Combo → heavy impact |
| **Animations** | Correct → card bounces green; Wrong → card shakes red; Combo → fire burst (Lottie); Mission complete → star explosion (Lottie) |

## Files

### packages/core
- `src/learning/srs.ts` — already done
- `src/learning/exercise-registry.ts` — already done
- `src/learning/mission.ts` — `buildMission(skillStates, config) → MissionPlan`; `calculateStars(accuracy) → 1|2|3`; `calculateComboBonus(streak, config) → number`
- `src/subjects/multiplication/generator.ts` — `MultiplicationPlugin`: `checkAnswer`, `generateVariants`; payload `{a, b, answer}`, difficulty by factor size
- `src/subjects/multiplication/index.ts` — registers plugin
- `src/learning/offline-queue.ts` — `OfflineQueue`: enqueue/dequeue `AttemptEvent`, idempotent by `clientId`
- `src/learning/session-sim.ts` — `simulateSession(cards, targetAccuracy, count)` for deterministic test fixtures
- Tests for all new files (keep ≥ 90% coverage)

### supabase
- `migrations/00000000000002_multiplication_seed.sql` — skills (`math.multiplication`, `math.mul.1`…`math.mul.9`) + exercises (1×1–9×9, difficulty 1–3 by factor size)
- `functions/grant-reward/index.ts` — receives `DomainEvent` JSON, calls `evaluate()`, inserts `ledger_entries` via service role, idempotent on `source_event_id`

### apps/mobile
- `src/features/learning/stores/learning-store.ts` — Zustand: currentMission, attemptBuffer, comboStreak, offlineQueue
- `src/features/learning/hooks/use-mission.ts` — TanStack Query: load skill states, build mission, submit attempt, sync queue
- `src/features/learning/components/exercise-card.tsx` — animated card: bounces/shakes via Reanimated
- `src/features/learning/components/combo-badge.tsx` — fire badge that appears at streak ≥ 3
- `src/features/learning/components/mission-progress.tsx` — XP bar filling up with each correct answer
- `src/features/learning/components/mission-complete.tsx` — star burst (Lottie), XP/coins summary, "Играть ещё"
- `src/features/learning/components/mission-map.tsx` — 9 level cells, each shows ★★★ or locked
- `app/(child)/learn/index.tsx` — subject list (one card: "Таблица умножения")
- `app/(child)/learn/[subject]/index.tsx` — mission map for the subject
- `app/(child)/learn/[subject]/mission.tsx` — active mission: exercise → animated feedback → next

### assets
- `assets/lottie/combo-fire.json` — small (< 15 KB) fire burst loop
- `assets/lottie/stars-complete.json` — star explosion (< 20 KB) for mission complete

### i18n additions
- `learning.missionMap`, `learning.battle`, `learning.combo`, `learning.speedBonus`, `learning.selfCorrected`, `learning.stars`, `learning.missionComplete`, `learning.playAgain`, `learning.boss`

## Reward config additions (packages/core/config/rewards.ts)
```ts
combo: { streak3Multiplier: 2, streak5Multiplier: 3 }
speedBonusXp: 1          // answer < 3 s
```

## Tests (packages/core)
- `mission.test.ts` — `buildMission` ≤ 10, low-mastery first; `calculateStars`; `calculateComboBonus`
- `multiplication/generator.test.ts` — `checkAnswer`, `generateVariants`, difficulty by factor
- `offline-queue.test.ts` — enqueue, dequeue, duplicate rejection
- `session-sim.test.ts` — `simulateSession` produces expected accuracy distribution

## Open questions
1. Lottie files: placeholder JSONs in Stage 2, real artwork in Stage 6/8.
2. Boss battle unlock: after any row is 1-starred (not 3-starred) to keep it fun.
3. Sound: expo-av (short .mp3) or just Haptics for Stage 2; full audio in Stage 3 (TTS).
4. Daily coin cap still applies: combo bonuses are XP-only, not coin-multiplied.

## Definition of Done
- [ ] TypeScript strict + lint clean, packages/core coverage ≥ 90%
- [ ] `simulateSession` used as fixture in ≥ 1 mission test
- [ ] `grant-reward` Edge Function: same event twice → 1 ledger entry
- [ ] Child completes a 10-question multiplication mission on iOS simulator
- [ ] Combo badge appears at streak 3+
- [ ] Mission-complete shows correct stars + XP (optimistic)
- [ ] Mission map shows locked / starred levels
- [ ] All i18n ru/uz/en
