# Stage 1: Family

## Goal
Parent can register, create a family and children, switch to child mode, and delete the account.
Every table gets an RLS policy verified by pgTAP.

## Files

### packages/core
- `src/auth/parental-gate.ts` — `generateGateChallenge` / `checkGateChallenge`
- `src/auth/parental-gate.test.ts` — 90 %+ coverage

### supabase
- `migrations/00000000000001_rls_policies.sql` — helper functions + all 19 RLS policies
- `tests/00_rls.test.sql` — pgTAP: family isolation, child-write limits, ledger append-only
- `functions/delete-family/index.ts` — service-role cascade delete
- `functions/link-child-device/index.ts` — creates child Supabase user, sets app_metadata

### apps/mobile
- `src/platform/supabase.ts` — client with SecureStore adapter
- `.env.example` — EXPO_PUBLIC_SUPABASE_URL / ANON_KEY
- `src/features/family/stores/auth-store.ts` — Zustand: session, family, children, mode
- `src/features/family/hooks/use-family.ts` — TanStack Query hooks
- `src/features/family/components/parental-gate-modal.tsx` — cognitive gate
- `app/_layout.tsx` — auth redirect logic
- `app/(auth)/login.tsx` — Apple + email sign in
- `app/(auth)/onboarding/index.tsx` — create family
- `app/(auth)/onboarding/add-child.tsx` — add first child
- `app/(parent)/index.tsx` — family dashboard (children cards)
- `app/(parent)/children/index.tsx` — full children list
- `app/(parent)/children/add.tsx` — add child form
- `app/(parent)/settings.tsx` — delete account
- `app/(child)/index.tsx` — today screen with gate exit button
- i18n additions: onboarding, parental gate keys
- `e2e/stage-1-family.yaml` — Maestro: login → onboarding → parent home

## Migrations
`00000000000001_rls_policies.sql`:
- Helper: `is_family_parent(uuid)`, `get_my_family_ids()`, `is_child_jwt()`, `get_child_id_from_jwt()`
- Policies on all 19 tables

## Tests
`supabase/tests/00_rls.test.sql` (pgTAP):
1. family A member cannot see family B rows
2. child JWT cannot insert into ledger_entries
3. child JWT cannot see another child's data
4. `attempts.client_id` UNIQUE prevents replay

`packages/core/src/auth/parental-gate.test.ts` (Jest):
- generates 3-digit challenge
- correct input passes, wrong fails
- all locales produce a word string

## Open questions
1. Apple developer team ID needed in app.json before TestFlight — left as placeholder.
2. Email OTP vs password — using OTP (magic link) for simpler flow.
3. Supabase project region — still pending legal review.
4. Child device linking via QR scan deferred; parent can enable child mode on own phone.

## Definition of Done
- [x] TypeScript strict + lint clean
- [x] packages/core test coverage ≥ 90 % (100% stmts/funcs/lines, 96.5% branches — 62 tests)
- [x] RLS policy on every table + pgTAP test (20 tests)
- [x] Maestro E2E: login → onboarding → child list
- [x] All i18n: ru / uz / en
- [x] VoiceOver labels on all interactive elements
- [x] No hardcoded strings
