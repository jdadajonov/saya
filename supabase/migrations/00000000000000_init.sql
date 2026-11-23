-- Initial schema
-- RLS is enabled on all tables; policies are added in Stage 1.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Core entities ────────────────────────────────────────────────────────────

CREATE TABLE families (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  locale      TEXT NOT NULL DEFAULT 'ru' CHECK (locale IN ('ru', 'uz', 'en')),
  timezone    TEXT NOT NULL DEFAULT 'Asia/Tashkent',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'parent', 'coach')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, family_id)
);

CREATE TABLE children (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  birth_year    SMALLINT NOT NULL CHECK (birth_year > 2000),
  avatar_key    TEXT NOT NULL DEFAULT 'avatar_1',
  age_band      TEXT NOT NULL CHECK (age_band IN ('7-9', '10-13')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE child_devices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  device_token_hash TEXT NOT NULL UNIQUE,
  linked_by         UUID NOT NULL REFERENCES auth.users(id),
  revoked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Learning ─────────────────────────────────────────────────────────────────

CREATE TABLE skills (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject       TEXT NOT NULL,
  code          TEXT NOT NULL UNIQUE,
  parent_id     UUID REFERENCES skills(id),
  prerequisites TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  difficulty  SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  locale      TEXT NOT NULL DEFAULT 'ru',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skill_states (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  mastery     FLOAT NOT NULL DEFAULT 0 CHECK (mastery BETWEEN 0 AND 1),
  stability   FLOAT NOT NULL DEFAULT 1 CHECK (stability > 0),
  due_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, skill_id)
);

CREATE TABLE attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  exercise_id  UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  correct      BOOLEAN NOT NULL,
  response_ms  INTEGER CHECK (response_ms > 0),
  hints_used   SMALLINT NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  client_id    UUID NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Activities ───────────────────────────────────────────────────────────────

CREATE TABLE activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  title       TEXT NOT NULL,
  place       TEXT,
  color       TEXT NOT NULL DEFAULT '#4F46E5',
  rrule       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id  UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'planned'
                 CHECK (status IN ('planned', 'done', 'missed', 'cancelled')),
  mood         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- ── Goals ────────────────────────────────────────────────────────────────────

CREATE TABLE goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  domain       TEXT NOT NULL CHECK (domain IN ('learning', 'activity')),
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  proposed_by  TEXT NOT NULL CHECK (proposed_by IN ('parent', 'child')),
  approved_by  UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id      UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  position     SMALLINT NOT NULL DEFAULT 0,
  achieved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE evidence (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id  UUID REFERENCES milestones(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES activity_sessions(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('confirm', 'photo', 'note')),
  confirmed_by  UUID REFERENCES auth.users(id),
  payload       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (milestone_id IS NOT NULL OR session_id IS NOT NULL)
);

-- ── Rewards ──────────────────────────────────────────────────────────────────

CREATE TABLE ledger_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  currency         TEXT NOT NULL CHECK (currency IN ('xp', 'coins')),
  amount           INTEGER NOT NULL CHECK (amount > 0),
  reason           TEXT NOT NULL,
  source_event_id  UUID NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rewards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  cost_coins  INTEGER NOT NULL CHECK (cost_coins > 0),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id   UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'requested'
                CHECK (status IN ('requested', 'approved', 'declined', 'fulfilled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Settings & meta ──────────────────────────────────────────────────────────

CREATE TABLE settings_child (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id             UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE UNIQUE,
  daily_minutes_limit  INTEGER NOT NULL DEFAULT 30 CHECK (daily_minutes_limit > 0),
  quiet_hours          JSONB NOT NULL DEFAULT '{"start": "21:00", "end": "08:00"}',
  pause_days           DATE[] NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id    UUID REFERENCES children(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feature_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID REFERENCES families(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, key)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_children_family ON children(family_id);
CREATE INDEX idx_skill_states_child ON skill_states(child_id);
CREATE INDEX idx_skill_states_due ON skill_states(due_at) WHERE mastery < 0.9;
CREATE INDEX idx_attempts_child ON attempts(child_id);
CREATE INDEX idx_attempts_created ON attempts(created_at);
CREATE INDEX idx_ledger_child ON ledger_entries(child_id, currency);
CREATE INDEX idx_events_family ON events(family_id, created_at);
CREATE INDEX idx_activity_sessions_starts ON activity_sessions(starts_at);

-- ── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'families','members','children','child_devices',
    'skills','exercises','skill_states','attempts',
    'activities','activity_sessions',
    'goals','milestones','evidence',
    'rewards','redemptions','settings_child','feature_flags'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t || '_updated_at', t
    );
  END LOOP;
END;
$$;

-- ── RLS: enabled, no policies yet (added in Stage 1) ────────────────────────

ALTER TABLE families          ENABLE ROW LEVEL SECURITY;
ALTER TABLE members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE children          ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_devices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills            ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises         ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_states      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_child    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags     ENABLE ROW LEVEL SECURITY;
