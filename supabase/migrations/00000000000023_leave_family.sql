-- Leave family function for non-owner members
CREATE OR REPLACE FUNCTION leave_family(p_family_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Owner cannot leave, must delete family
  IF EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND family_id = p_family_id
    AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Owner cannot leave family, delete it instead';
  END IF;

  -- Delete membership
  DELETE FROM members
  WHERE user_id = auth.uid()
  AND family_id = p_family_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not a member of this family';
  END IF;
END;
$$;
