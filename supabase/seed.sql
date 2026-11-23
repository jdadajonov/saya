-- Seed data for local development
-- Run after migrations: supabase db reset

-- Feature flags (global defaults)
INSERT INTO feature_flags (family_id, key, enabled) VALUES
  (NULL, 'multiplication_table', true),
  (NULL, 'english_a1', true),
  (NULL, 'activities', false),
  (NULL, 'goals', false),
  (NULL, 'rewards', false),
  (NULL, 'ai_tutor', false);
