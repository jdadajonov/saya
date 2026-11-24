# Changelog

## Stage 0 — Scaffold (2026-11-23)

### Added
- pnpm monorepo with Turborepo (`apps/`, `packages/`, `services/`)
- `packages/core` — pure TypeScript domain logic: SRS, exercise registry, `evaluate()` reward engine, AI interfaces (stubs)
- `packages/api` — typed Supabase client + Zod/Database schemas
- `packages/content` — skill graph JSON (multiplication, English A1)
- `packages/i18n` — i18next initialiser + translation files ru/uz/en
- `apps/mobile` — Expo SDK 58, iOS only, Expo Router route groups `(auth)/(parent)/(child)`
- Design system tokens (colors, spacing, typography) + age themes `theme-7-9` / `theme-10-13`
- `src/platform/` — native iOS wrappers (expo-speech, expo-secure-store, expo-notifications)
- `supabase/` — full DB schema (19 tables) with indexes, `updated_at` trigger, RLS enabled
- `.github/workflows/ci.yml` — typecheck → lint → test → EAS iOS build on `main`
- `services/ai-gateway/` — FastAPI stub (empty until Stage 2)
- `docs/stack.md` — pinned versions

### How to verify (5 min)
1. `pnpm typecheck` — should print `5 successful, 5 total`
2. `pnpm lint` — should print `5 successful, 5 total`
3. `supabase start` — local Postgres starts on port 54322
4. `pnpm --filter @saya/mobile start` — Expo dev server opens; iOS simulator shows login screen in Russian

## Stage 1 — Family (2026-11-23)

### Added
- `packages/core/src/auth/parental-gate.ts` — `generateGateChallenge` / `checkGateChallenge` (3-digit cognitive gate, ru/uz/en)
- Full test suite for all `packages/core` modules — 62 tests, 100% statement/function/line coverage, 96.5% branch
- `supabase/migrations/00000000000001_rls_policies.sql` — 4 helper functions + RLS policies for all 19 tables
- `supabase/tests/00_rls.test.sql` — 20 pgTAP tests: family isolation, child JWT isolation, ledger append-only, `attempts.client_id` replay prevention
- `supabase/functions/delete-family/index.ts` — service-role Edge Function for cascade family delete
- `supabase/functions/link-child-device/index.ts` — creates child Supabase auth user with `app_metadata.role=child`, stores hashed device token
- `supabase/functions/_shared/cors.ts` — shared CORS headers
- `apps/mobile/src/platform/supabase.ts` — Supabase client with SecureStore session adapter
- `apps/mobile/.env.example` — `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `apps/mobile/src/features/family/stores/auth-store.ts` — Zustand: session, family, children list, mode (parent/child), active child
- `apps/mobile/src/features/family/hooks/use-family.ts` — TanStack Query: family, children, createFamily, addChild, deleteFamily
- `apps/mobile/src/features/family/components/parental-gate-modal.tsx` — cognitive gate modal with VoiceOver labels
- `apps/mobile/app/_layout.tsx` — auth redirect logic (unauthenticated → login, authenticated → parent home)
- `apps/mobile/app/(auth)/login.tsx` — Apple Sign In + email OTP flow
- `apps/mobile/app/(auth)/onboarding/index.tsx` — create family (name + locale)
- `apps/mobile/app/(auth)/onboarding/add-child.tsx` — add first child (name, birth year, age band)
- `apps/mobile/app/(parent)/index.tsx` — family dashboard with children cards + parental gate to switch mode
- `apps/mobile/app/(parent)/children/index.tsx` — full children list
- `apps/mobile/app/(parent)/children/add.tsx` — add child form
- `apps/mobile/app/(parent)/settings.tsx` — sign out + delete account (triggers delete-family Edge Function)
- `apps/mobile/app/(child)/index.tsx` — today screen with parental gate exit button
- i18n additions: `onboarding.*`, `parentalGate.*`, `auth.signOut/otpSent*`, `parent.settings`, `child.exitChildMode` in ru/uz/en
- `apps/mobile/e2e/stage-1-family.yaml` — Maestro: login → onboarding → parent home → child list → parental gate → sign out

### How to verify (10 min)
1. `pnpm --filter @saya/core test -- --coverage` — 62 tests pass, all thresholds met
2. `supabase start && supabase db push` — apply both migrations
3. `supabase test db` — 20 pgTAP tests pass
4. `pnpm --filter @saya/mobile start` — iOS simulator: login → onboarding → family dashboard

## Stage 2 — Learning Engine + Multiplication Table (Game Edition) (2026-11-23)

### Added
- **packages/core** — `mission.ts`: `buildMission`, `calculateStars`, `calculateComboBonus`, `calculateMissionXp`; combo multipliers (×2 at streak 3, ×3 at streak 5), speed bonus XP (< 3 s), self-correction bonus, star rating (1–3)
- **packages/core** — `subjects/multiplication/generator.ts`: `MultiplicationPlugin` for `multiplication.fill_blank`; `allMultiplicationExercises()` generates all 81 exercises; difficulty by factor size
- **packages/core** — `subjects/multiplication/index.ts`: `registerMultiplicationPlugin()` (idempotent)
- **packages/core** — `learning/offline-queue.ts`: `OfflineQueue` — idempotent enqueue by `clientId`, `dequeue`, `dequeueAll`
- **packages/core** — `learning/session-sim.ts`: `simulateSession()` — deterministic student fixture for tests
- **packages/core** — `config/rewards.ts`: added `xp.speedBonus` and `combo.streak3/5Multiplier` to `RewardConfig`
- 118 passing tests, 100% stmts/funcs/lines, 95.9% branches
- `supabase/migrations/00000000000002_multiplication_seed.sql` — skills `math.multiplication` + `math.mul.1–9`, 81 exercises (difficulty 1–3 by factor size)
- `supabase/functions/grant-reward/index.ts` — receives `DomainEvent`, calls `evaluate()`, upserts `ledger_entries` idempotently, writes to `events` table
- **Mobile game UI**: `ExerciseCard` (Reanimated bounce/shake + haptics), `ComboBadge` (animated fire/lightning badge at streak ≥ 3), `MissionProgress` (animated XP bar, color changes with combo), `MissionComplete` (star burst animation + XP summary), `MissionMap` (9 levels, locked/starred)
- Routes: `(child)/learn/index.tsx` → `(child)/learn/[subject]/index.tsx` (mission map) → `(child)/learn/[subject]/mission.tsx` (active battle)
- Child today screen now shows "⚔ Start Battle" quick-access card
- i18n additions: `learning.missionComplete`, `learning.playAgain`, `learning.startBattle`, `learning.accuracy`, `learning.bestCombo`, `learning.speedBonus`, `learning.starsLabel`, `learning.levelLocked`, `learning.levelLabel`, `child.greetingName` in ru/uz/en

### How to verify (10 min)
1. `pnpm --filter @saya/core test -- --coverage` — 118 tests, all thresholds met
2. `supabase db push` — 3 migrations applied
3. iOS Simulator: switch to child mode → today screen → tap "⚔ Начать бой" → mission map → start → answer 10 questions → see combo badge at streak 3+ → see star explosion on complete
