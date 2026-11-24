-- Stage 5: Add skill_code and mastery_threshold to goals and milestones
-- for auto-completion of learning milestones

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS skill_code TEXT;

ALTER TABLE milestones
  ADD COLUMN IF NOT EXISTS skill_code TEXT,
  ADD COLUMN IF NOT EXISTS mastery_threshold NUMERIC(3,2) DEFAULT 0.8;

COMMENT ON COLUMN goals.skill_code IS 'Links the entire goal to a skill (optional)';
COMMENT ON COLUMN milestones.skill_code IS 'Links milestone to a skill for auto-completion';
COMMENT ON COLUMN milestones.mastery_threshold IS 'Mastery level (0-1) required for auto-completion';
