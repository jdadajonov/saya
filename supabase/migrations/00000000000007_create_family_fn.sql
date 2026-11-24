-- Function to create a family and add the creator as owner atomically
-- Uses SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION create_family_with_owner(
  p_name TEXT,
  p_locale TEXT DEFAULT 'ru'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_family_id UUID;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the family
  INSERT INTO families (name, locale)
  VALUES (p_name, p_locale)
  RETURNING id INTO v_family_id;

  -- Add creator as owner
  INSERT INTO members (user_id, family_id, role)
  VALUES (v_user_id, v_family_id, 'owner');

  RETURN v_family_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_family_with_owner TO authenticated;
