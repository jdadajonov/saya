-- Function to add a child to a family
-- Uses SECURITY DEFINER to bypass RLS while still checking permissions

CREATE OR REPLACE FUNCTION add_child_to_family(
  p_family_id UUID,
  p_display_name TEXT,
  p_birth_year INTEGER,
  p_age_band TEXT,
  p_avatar_key TEXT DEFAULT 'avatar_1'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_child_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is a parent/owner of the family
  IF NOT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = v_user_id
      AND family_id = p_family_id
      AND role IN ('owner', 'parent')
  ) THEN
    RAISE EXCEPTION 'Not authorized to add children to this family';
  END IF;

  -- Insert the child
  INSERT INTO children (family_id, display_name, birth_year, age_band, avatar_key)
  VALUES (p_family_id, p_display_name, p_birth_year, p_age_band, p_avatar_key)
  RETURNING id INTO v_child_id;

  RETURN v_child_id;
END;
$$;

GRANT EXECUTE ON FUNCTION add_child_to_family TO authenticated;
