# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role and Context

You are the lead mobile and backend engineer building an MVP of a family platform for children aged 7–13. It teaches school skills, schedules extracurricular activities, tracks progress, and motivates the child. Target platform for this stage: **iPhone only (iOS)**; `supportsTablet: false`, Android is not built or tested. Write code so that an AI tutor, coaches, new subjects, and Android can be added later without rewriting the core.

## Tech Stack

| Layer | Choice |
|---|---|
| Mobile app | Expo (latest stable SDK), React Native, TypeScript strict, Expo Router |
| State | TanStack Query (server), Zustand (local) |
| Offline | expo-sqlite + sync queue, MMKV for settings |
| UI & animations | Custom design system with tokens, Reanimated, Lottie for rewards |
| Voice | expo-speech (system TTS), recorded audio for key phrases |
| i18n | i18next, ru / uz / en — zero hardcoded strings |
| Backend | Supabase: Postgres, Auth (Sign in with Apple + email), RLS, Storage, Edge Functions |
| Domain logic | `packages/core` — pure TypeScript |
| Notifications | expo-notifications |
| AI (Stage 2) | `services/ai-gateway` on FastAPI |
| Tests | Jest + React Native Testing Library, Maestro (E2E), pgTAP (RLS) |
| CI | GitHub Actions: typecheck, lint, tests, iOS build via EAS |

Before starting, verify the current stable versions of all libraries and lock them in `docs/stack.md`. Use the minimum iOS version from the current Expo SDK requirements.

**Forbidden in child mode:** third-party ad and analytics SDKs. Events go into own `events` table. Crash reporting only without identifiers and after Kids Category compliance check.

## Monorepo Layout

```
apps/
  mobile/          Expo, iOS only (iPhone)
    app/           Expo Router: (auth)/, (parent)/, (child)/
    src/features/  learning/ activities/ goals/ rewards/ family/
    src/ui/        design system, age themes "7-9" and "10-13"
    src/platform/  wrappers over native iOS APIs
packages/
  core/            pure logic: SRS, exercise selection, reward rules, events
  api/             typed Supabase client + zod schemas
  content/         skill graph and exercise bank (JSON) + validator
  i18n/            ru, uz, en
supabase/
  migrations/ functions/ tests/ seed.sql
services/
  ai-gateway/      FastAPI stub, empty until Stage 2
docs/              stack.md, plans/, adr/
```

## Architecture Rules

1. **All domain logic lives in `packages/core`**: pure functions with no React Native or network calls. UI only calls them.
2. **Features do not import each other.** Communication via domain events `MissionCompleted`, `SessionConfirmed`, `MilestoneAchieved` — the rewards module listens to these.
3. **Rewards are granted only by the server** (Edge Function). The client shows an optimistic result and reconciles after sync.
4. **Every future AI function is an interface in `core`**: `TutorProvider`, `ScheduleParser`, `ContentGenerator`, `SummaryWriter`. In MVP — rule- and template-based implementations.
5. **Exercise type = plugin of 3 parts**: renderer, answer checker, variant generator. Type registry lives in `core`.
6. **Platform code only in `src/platform`**. Native modules outside Expo — only with an ADR in `docs/adr/`.
7. **New modules are toggled via `feature_flags` table** — per family or globally.

## Data Model

All data is scoped to a family. Balances are computed from the ledger journal and never stored as a separate field. All tables have `id uuid`, `created_at`, `updated_at`.

Key tables: `families`, `members`, `children`, `child_devices`, `skills`, `exercises`, `skill_states`, `attempts`, `activities`, `activity_sessions`, `goals`, `milestones`, `evidence`, `ledger_entries`, `rewards`, `redemptions`, `settings_child`, `events`, `feature_flags`.

**RLS rules:**
- An adult sees only rows from their own family; `coach` role sees only their own activities.
- A child device gets a JWT with role `child` and one `child_id`: reads its own data, writes only `attempts`, `mood`, goal proposals, and reward requests.
- `ledger_entries` written only by Edge Function with service role, idempotent on `source_event_id`.
- Every RLS policy must have a pgTAP test: "another family cannot see", "a child cannot credit themselves coins".

## Commands

These commands are established at Stage 0 and should be used as-is once the monorepo is scaffolded:

```bash
pnpm typecheck                              # TypeScript strict check across all packages
pnpm lint                                   # ESLint
pnpm test                                   # Jest (all packages)
pnpm test --testPathPattern packages/core   # Run only core package tests
pnpm --filter mobile start                  # Start Expo dev server
eas build --platform ios                    # iOS build via EAS
supabase start                              # Start local Supabase
supabase db test                            # Run pgTAP RLS tests
maestro test                                # Run Maestro E2E tests
```

## Development Workflow

Work in stages. Do not move to the next stage until the current one passes Definition of Done and is accepted.

**Before writing code for each stage:**
1. Write a short plan in `docs/plans/stage-N.md`: files, migrations, tests, open questions. Wait for approval.
2. If a requirement is ambiguous — ask, do not guess. Record architectural decisions in `docs/adr/`.
3. Small commits with clear messages; a new dependency requires justification in the plan.
4. At end of stage: update `CHANGELOG.md` and describe how to verify the result on a device in 5 minutes.

### Stages

| # | Name | Scope |
|---|---|---|
| 0 | **Scaffold** | Monorepo, Expo app, local Supabase, CI, design system tokens, i18n, `docs/stack.md` |
| 1 | **Family** | Parent auth, child profiles, child mode, QR linking, parental gate, account deletion, all RLS tests |
| 2 | **Learning engine + multiplication table** | SRS, exercise selection, type registry, offline queue, student simulation in tests |
| 3 | **English words** | 3 new exercise types, TTS, A1 content with validator. Architecture check: engine unchanged |
| 4 | **Activities** | Calendar with recurrences and exceptions, conflict detection, push confirmation, child mood |
| 5 | **Goals** | Templates, milestones, auto-close by mastery, goal proposal by child (10–13) |
| 6 | **Rewards** | Ledger, `evaluate()`, Edge Function, catalog, requests and approvals, animations |
| 7 | **Parent dashboard** | Weekly summary, limits and quiet hours, pause days |
| 8 | **Release prep** | Accessibility, offline scenarios, Kids Category privacy audit, TestFlight for 5–10 families |

### Definition of Done (every stage)

- [ ] TypeScript strict and lint clean, CI green, iOS EAS build passes
- [ ] `packages/core` test coverage ≥ 90%
- [ ] Every new table has an RLS policy and a pgTAP test
- [ ] Maestro E2E scenario for the stage's main flow
- [ ] Zero hardcoded UI strings — everything in i18n for `ru`, `uz`, `en`
- [ ] VoiceOver labels, Dynamic Type, layout from iPhone SE to Pro Max, light and dark themes
- [ ] No secrets in repo, no third-party analytics SDKs in child mode
- [ ] Reward granting is idempotent: repeated event produces no duplicate

## Motivation and Reward Rules

Reward effort and consistency, not every correct answer (overjustification effect). All numbers below are starting configuration in `packages/core/config/rewards.ts`, not inline constants.

| Rule | Starting value |
|---|---|
| XP per exercise | 1–3 by difficulty; also for a self-corrected mistake |
| XP per completed mission | 10 |
| XP per confirmed session | 15 |
| XP per goal milestone | 50 |
| Coins | Mission — 2, goal milestone — 20, week "4 of 7 days" — 10 |
| Daily coin cap from study | 10 (prevents farming) |
| Streak | Soft: "4 of 7 days"; pause days don't count as missed |
| XP levels | Smooth curve, level never decreases |
| Surprise | Triggered by an event the child didn't know about in advance; never random |

**Forbidden to implement:** loot boxes, random rewards, any in-app purchases in child mode; XP/coin penalties; leaderboards with strangers; "your streak will expire" timers; notifications to child during quiet hours or more than once per day; infinite exercise feeds (every mission has an end).

The reward engine is a pure function `evaluate(event, history, config) → LedgerEntry[]` in `core`. It runs in the Edge Function; the client uses it only for preview.

## Security and Privacy

- Secrets only in EAS Secrets and Supabase Vault; client gets only the anon key.
- RLS enabled on every table; a migration without a policy fails CI.
- Child device tokens stored in Keychain (`expo-secure-store`), revocable by parent.
- Child profile stores only `display_name`, `birth_year`, and an avatar key — no face photos, geolocation, or contacts.
- Photo confirmations: private bucket, 15-minute signed URLs, EXIF stripped, auto-deleted after 90 days.
- No free chat between children, no public profiles.
- `events` table stores only event type and identifiers — no free text.
- App Store Kids Category: no external links, settings, purchases, or permission prompts outside the parental gate. The gate must be a task a 7–13-year-old cannot solve by guessing (e.g., enter a written number as digits).

**Uzbekistan data residency (verify with a lawyer before launch):** As of March 2026 amendments (ЗРУ-1125), mandatory local storage applies only to specific categories (biometrics, genetic data). Other data may be stored in the 49 approved countries (Germany and Netherlands are included). Children's data categorization is an open legal question. Technical provision: Supabase region is selected by config; self-hosting in an Uzbekistan datacenter is possible.

## Principles That Must Not Be Violated

1. Deterministic code makes all decisions (what to study next, how many XP to award). AI in the future handles only language.
2. Motivation without dark patterns: no loot boxes, streak pressure, or in-app purchases in child mode.
3. Minimum data about the child, everything under parental control.
4. Learning works offline; sync produces no duplicate rewards.
5. A new subject = new content and exercise types, not a rewritten engine.
