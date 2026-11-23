# Stage 0: Scaffold

## Goal
Bootstrap the monorepo so every future stage has a stable foundation: typed code, local backend, CI, design tokens, and i18n — before any feature work.

## Files / directories

### Root
- `package.json` — workspace root scripts (typecheck, lint, test via turbo)
- `pnpm-workspace.yaml` — apps/*, packages/*, services/*
- `turbo.json` — task pipeline
- `tsconfig.base.json` — strict TS base
- `eslint.config.js` — flat-config ESLint
- `.prettierrc`
- `.npmrc` — shamefully-hoist for Metro/Expo compatibility
- `.gitignore`

### packages/core
Pure TS, no React Native, no network. Contains:
- `src/events/types.ts` — domain event types
- `src/config/rewards.ts` — configurable reward rules
- `src/learning/srs.ts` — SRS types and pure functions (SM-2 variant)
- `src/learning/exercise-registry.ts` — exercise type plugin interface
- `src/rewards/evaluate.ts` — `evaluate(event, history, config) → LedgerEntry[]`
- `src/interfaces/ai.ts` — TutorProvider, ScheduleParser, ContentGenerator, SummaryWriter

### packages/api
Typed Supabase client + zod schemas for every table.

### packages/content
Skill graph (JSON) + exercise bank + validator script.

### packages/i18n
i18next initialiser + translation files ru/uz/en.

### apps/mobile
Expo SDK 58, iOS only, Expo Router:
- `app/_layout.tsx` — root layout with QueryClient, i18n, ThemeProvider
- `app/(auth)/`, `app/(parent)/`, `app/(child)/` — route groups (shells only)
- `src/ui/tokens/` — colors, spacing, typography
- `src/ui/themes/theme-7-9.ts`, `theme-10-13.ts`
- `src/platform/index.ts` — platform wrapper exports (empty stubs)
- `metro.config.js` — monorepo watchFolders

### supabase
- `config.toml`
- `migrations/00000000000000_init.sql` — full schema, RLS enabled (no policies yet — added in Stage 1)
- `seed.sql` — empty placeholder

### services/ai-gateway
FastAPI stub (`main.py`) — empty, Stage 2.

### .github/workflows/ci.yml
Runs: typecheck → lint → test. EAS build on `main` push (requires EAS_TOKEN secret).

### docs/stack.md
Pinned library versions.

## Migrations
`00000000000000_init.sql` — creates all 19 tables from spec + `update_updated_at()` trigger + `ALTER TABLE … ENABLE ROW LEVEL SECURITY` on every table.

## Tests
Stage 0 has no functional tests. CI must pass: `pnpm typecheck` and `pnpm lint`.

## Open questions
1. App Store bundle identifier — using `uz.saya.app` as placeholder.
2. EAS project slug — requires `eas init` after repo is created on GitHub.
3. Supabase project region — pending legal review (see CLAUDE.md security section).
4. Photo upload bucket configuration deferred to Stage 4.

## Definition of Done
- [ ] `pnpm install` succeeds with no errors
- [ ] `pnpm typecheck` clean across all packages
- [ ] `pnpm lint` clean
- [ ] `supabase start` starts local instance
- [ ] i18n renders in all 3 locales in a placeholder screen
- [ ] `docs/stack.md` lists pinned versions
