BEGIN;

SELECT plan(20);

-- ── Setup ────────────────────────────────────────────────────────────────────

-- Family A
INSERT INTO auth.users (id, email) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'parent_a@test.com'),
  ('a1000000-0000-0000-0000-000000000002', 'parent_b@test.com');

INSERT INTO families (id, name) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'Family A'),
  ('f1000000-0000-0000-0000-000000000002', 'Family B');

INSERT INTO members (user_id, family_id, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'owner'),
  ('a1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002', 'owner');

INSERT INTO children (id, family_id, display_name, birth_year, age_band) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Ali', 2015, '7-9'),
  ('c1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002', 'Zara', 2014, '10-13');

-- ── Test 1-4: Family isolation ────────────────────────────────────────────────

-- Parent A cannot see Family B rows
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "a1000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT is(
  (SELECT count(*)::INT FROM families WHERE id = 'f1000000-0000-0000-0000-000000000002'),
  0,
  'parent A cannot see family B'
);

SELECT is(
  (SELECT count(*)::INT FROM children WHERE family_id = 'f1000000-0000-0000-0000-000000000002'),
  0,
  'parent A cannot see family B children'
);

SELECT is(
  (SELECT count(*)::INT FROM families WHERE id = 'f1000000-0000-0000-0000-000000000001'),
  1,
  'parent A can see own family'
);

SELECT is(
  (SELECT count(*)::INT FROM children WHERE family_id = 'f1000000-0000-0000-0000-000000000001'),
  1,
  'parent A can see own family children'
);

-- ── Test 5-7: Child JWT isolation ────────────────────────────────────────────

-- Child A JWT: role=child, child_id=c1
SET LOCAL request.jwt.claims TO '{
  "sub": "child-user-a",
  "role": "authenticated",
  "app_metadata": {"role": "child", "child_id": "c1000000-0000-0000-0000-000000000001"}
}';

SELECT is(
  (SELECT count(*)::INT FROM children WHERE id = 'c1000000-0000-0000-0000-000000000002'),
  0,
  'child A JWT cannot see child B'
);

SELECT is(
  (SELECT count(*)::INT FROM children WHERE id = 'c1000000-0000-0000-0000-000000000001'),
  1,
  'child A JWT can see own child row'
);

-- Child A JWT cannot insert into ledger_entries
SELECT throws_ok(
  $$INSERT INTO ledger_entries (child_id, currency, amount, reason, source_event_id)
    VALUES ('c1000000-0000-0000-0000-000000000001', 'xp', 10, 'test', gen_random_uuid())$$,
  'new row violates row-level security policy for table "ledger_entries"',
  'child JWT cannot insert ledger entries'
);

-- ── Test 8-10: attempts replay prevention ─────────────────────────────────────

SET LOCAL request.jwt.claims TO '{
  "sub": "child-user-a",
  "role": "authenticated",
  "app_metadata": {"role": "child", "child_id": "c1000000-0000-0000-0000-000000000001"}
}';

-- Insert a skill and exercise for the attempt test
SET LOCAL role TO postgres;
INSERT INTO skills (id, subject, code) VALUES
  ('s1000000-0000-0000-0000-000000000001', 'math', 'math.add');
INSERT INTO exercises (id, skill_id, type, difficulty) VALUES
  ('e1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 'fill_blank', 1);

SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{
  "sub": "child-user-a",
  "role": "authenticated",
  "app_metadata": {"role": "child", "child_id": "c1000000-0000-0000-0000-000000000001"}
}';

-- First insert with specific client_id
SELECT lives_ok(
  $$INSERT INTO attempts (child_id, exercise_id, correct, client_id)
    VALUES (
      'c1000000-0000-0000-0000-000000000001',
      'e1000000-0000-0000-0000-000000000001',
      true,
      'deadbeef-0000-0000-0000-000000000001'
    )$$,
  'child can insert an attempt'
);

-- Duplicate client_id should fail (UNIQUE constraint)
SELECT throws_ok(
  $$INSERT INTO attempts (child_id, exercise_id, correct, client_id)
    VALUES (
      'c1000000-0000-0000-0000-000000000001',
      'e1000000-0000-0000-0000-000000000001',
      true,
      'deadbeef-0000-0000-0000-000000000001'
    )$$,
  'duplicate key value violates unique constraint "attempts_client_id_key"',
  'duplicate client_id is rejected'
);

-- Another child JWT cannot insert on behalf of child A
SET LOCAL request.jwt.claims TO '{
  "sub": "child-user-b",
  "role": "authenticated",
  "app_metadata": {"role": "child", "child_id": "c1000000-0000-0000-0000-000000000002"}
}';

SELECT throws_ok(
  $$INSERT INTO attempts (child_id, exercise_id, correct, client_id)
    VALUES (
      'c1000000-0000-0000-0000-000000000001',
      'e1000000-0000-0000-0000-000000000001',
      false,
      'deadbeef-0000-0000-0000-000000000002'
    )$$,
  'new row violates row-level security policy for table "attempts"',
  'child B cannot insert attempts for child A'
);

-- ── Test 11-14: Parent delete / insert child ──────────────────────────────────

SET LOCAL request.jwt.claims TO '{"sub": "a1000000-0000-0000-0000-000000000001", "role": "authenticated"}';
SET LOCAL role TO authenticated;

SELECT lives_ok(
  $$INSERT INTO children (family_id, display_name, birth_year, age_band)
    VALUES ('f1000000-0000-0000-0000-000000000001', 'Kamol', 2016, '7-9')$$,
  'parent can add child to own family'
);

SELECT throws_ok(
  $$INSERT INTO children (family_id, display_name, birth_year, age_band)
    VALUES ('f1000000-0000-0000-0000-000000000002', 'Hacker', 2016, '7-9')$$,
  'new row violates row-level security policy for table "children"',
  'parent cannot add child to another family'
);

-- ── Test 15-17: settings_child ────────────────────────────────────────────────

-- Parent can read own child settings
SET LOCAL request.jwt.claims TO '{"sub": "a1000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT lives_ok(
  $$INSERT INTO settings_child (child_id) VALUES ('c1000000-0000-0000-0000-000000000001')$$,
  'parent can create settings for own child'
);

SELECT throws_ok(
  $$INSERT INTO settings_child (child_id) VALUES ('c1000000-0000-0000-0000-000000000002')$$,
  'new row violates row-level security policy for table "settings_child"',
  'parent cannot create settings for another family child'
);

-- Child JWT can read own settings
SET LOCAL request.jwt.claims TO '{
  "sub": "child-user-a",
  "role": "authenticated",
  "app_metadata": {"role": "child", "child_id": "c1000000-0000-0000-0000-000000000001"}
}';

SELECT is(
  (SELECT count(*)::INT FROM settings_child WHERE child_id = 'c1000000-0000-0000-0000-000000000001'),
  1,
  'child JWT can read own settings'
);

-- ── Test 18-20: feature_flags ─────────────────────────────────────────────────

SET LOCAL role TO postgres;
INSERT INTO feature_flags (family_id, key, enabled) VALUES (NULL, 'global_flag', true);

SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "a1000000-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT is(
  (SELECT count(*)::INT FROM feature_flags WHERE key = 'global_flag'),
  1,
  'authenticated user can read global feature flags'
);

SELECT throws_ok(
  $$INSERT INTO feature_flags (family_id, key, enabled)
    VALUES ('f1000000-0000-0000-0000-000000000002', 'other_flag', true)$$,
  'new row violates row-level security policy for table "feature_flags"',
  'parent cannot insert flags for another family'
);

SELECT lives_ok(
  $$INSERT INTO feature_flags (family_id, key, enabled)
    VALUES ('f1000000-0000-0000-0000-000000000001', 'my_flag', true)$$,
  'parent can insert flags for own family'
);

SELECT * FROM finish();

ROLLBACK;
