-- Function to upsert skill_state, bypassing RLS
-- Parents can update skill states for children in their family

CREATE OR REPLACE FUNCTION upsert_skill_state(
  p_child_id UUID,
  p_skill_id UUID,
  p_mastery DOUBLE PRECISION,
  p_stability DOUBLE PRECISION DEFAULT 1,
  p_due_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_state_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is a parent/owner of the child's family
  IF NOT EXISTS (
    SELECT 1 FROM members m
    JOIN children c ON c.family_id = m.family_id
    WHERE m.user_id = v_user_id
      AND c.id = p_child_id
      AND m.role IN ('owner', 'parent')
  ) THEN
    RAISE EXCEPTION 'Not authorized to update skill states for this child';
  END IF;

  -- Upsert the skill state
  INSERT INTO skill_states (child_id, skill_id, mastery, stability, due_at)
  VALUES (p_child_id, p_skill_id, p_mastery, p_stability, p_due_at)
  ON CONFLICT (child_id, skill_id)
  DO UPDATE SET
    mastery = EXCLUDED.mastery,
    stability = EXCLUDED.stability,
    due_at = EXCLUDED.due_at,
    updated_at = NOW()
  RETURNING id INTO v_state_id;

  RETURN v_state_id;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_skill_state TO authenticated;
