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
