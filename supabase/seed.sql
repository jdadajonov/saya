-- Seed data for local development
-- Run after migrations: supabase db reset

-- ══════════════════════════════════════════════════════════════════════════════
-- Dev user: created via Auth API after db reset
-- Run this after `supabase db reset`:
--
-- curl -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
--   -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
--   -H "Content-Type: application/json" \
--   -d '{"email":"dev@saya.test","password":"devpass123","email_confirm":true}'
--
-- Or use the Dev Login button in the app which will auto-create the user.
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- Feature flags (global defaults)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO feature_flags (family_id, key, enabled) VALUES
  (NULL, 'multiplication_table', true),
  (NULL, 'english_a1', true),
  (NULL, 'activities', false),
  (NULL, 'goals', false),
  (NULL, 'rewards', false),
  (NULL, 'ai_tutor', false);
