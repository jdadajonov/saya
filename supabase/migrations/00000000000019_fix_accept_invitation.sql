-- Fix accept_invitation function - ambiguous 'code' column reference

CREATE OR REPLACE FUNCTION accept_invitation(p_code TEXT)
RETURNS TABLE(family_id UUID, family_name TEXT, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invite invitations%ROWTYPE;
  v_family families%ROWTYPE;
BEGIN
  -- Find valid invitation (fixed: qualify code with table alias)
  SELECT * INTO v_invite FROM invitations inv
  WHERE inv.code = upper(p_code)
  AND inv.accepted_by IS NULL
  AND inv.expires_at > now();

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM members m
    WHERE m.user_id = auth.uid()
    AND m.family_id = v_invite.family_id
  ) THEN
    RAISE EXCEPTION 'Already a member of this family';
  END IF;

  -- Mark invitation as accepted
  UPDATE invitations SET
    accepted_by = auth.uid(),
    accepted_at = now()
  WHERE id = v_invite.id;

  -- Add user as member
  INSERT INTO members (user_id, family_id, role)
  VALUES (auth.uid(), v_invite.family_id, v_invite.role);

  -- Get family info
  SELECT * INTO v_family FROM families f WHERE f.id = v_invite.family_id;

  RETURN QUERY SELECT v_family.id, v_family.name, v_invite.role;
END;
$$;
