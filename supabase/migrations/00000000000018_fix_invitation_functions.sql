-- Fix ambiguous column references and missing extensions in invitation functions

-- Drop and recreate functions with fixed references

-- Function to create parent invitation (fixed ambiguous 'code' reference)
CREATE OR REPLACE FUNCTION create_parent_invitation(p_family_id UUID, p_email TEXT DEFAULT NULL)
RETURNS TABLE(id UUID, code TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code TEXT;
  v_id UUID;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Verify caller is owner/parent of family
  IF NOT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND family_id = p_family_id
    AND role IN ('owner', 'parent')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Generate unique code
  LOOP
    v_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM invitations inv WHERE inv.code = v_code);
  END LOOP;

  v_expires := now() + interval '7 days';

  INSERT INTO invitations (family_id, code, email, created_by, expires_at)
  VALUES (p_family_id, v_code, p_email, auth.uid(), v_expires)
  RETURNING invitations.id INTO v_id;

  RETURN QUERY SELECT v_id, v_code, v_expires;
END;
$$;

-- Function to create child device PIN (fixed ambiguous 'expires_at' reference)
CREATE OR REPLACE FUNCTION create_child_device_pin(p_child_id UUID)
RETURNS TABLE(pin TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pin TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Verify caller is owner/parent of child's family
  IF NOT EXISTS (
    SELECT 1 FROM children c
    JOIN members m ON m.family_id = c.family_id
    WHERE c.id = p_child_id
    AND m.user_id = auth.uid()
    AND m.role IN ('owner', 'parent')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Delete expired PINs for this child
  DELETE FROM child_device_pins cdp
  WHERE cdp.child_id = p_child_id AND cdp.expires_at < now();

  -- Generate unique PIN
  LOOP
    v_pin := generate_device_pin();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM child_device_pins cdp
      WHERE cdp.child_id = p_child_id AND cdp.pin = v_pin
    );
  END LOOP;

  v_expires := now() + interval '15 minutes';

  INSERT INTO child_device_pins (child_id, pin, created_by, expires_at)
  VALUES (p_child_id, v_pin, auth.uid(), v_expires);

  RETURN QUERY SELECT v_pin, v_expires;
END;
$$;

-- Function to link child device using PIN (fixed digest function - use pgcrypto)
CREATE OR REPLACE FUNCTION link_child_device(p_pin TEXT, p_device_token TEXT)
RETURNS TABLE(child_id UUID, child_name TEXT, family_id UUID)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pin_record child_device_pins%ROWTYPE;
  v_child children%ROWTYPE;
  v_token_hash TEXT;
BEGIN
  -- Find valid PIN
  SELECT * INTO v_pin_record FROM child_device_pins cdp
  WHERE cdp.pin = p_pin
  AND cdp.used_at IS NULL
  AND cdp.expires_at > now();

  IF v_pin_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired PIN';
  END IF;

  -- Hash the device token using pgcrypto
  v_token_hash := encode(extensions.digest(p_device_token::bytea, 'sha256'), 'hex');

  -- Mark PIN as used
  UPDATE child_device_pins SET used_at = now() WHERE id = v_pin_record.id;

  -- Create device record
  INSERT INTO child_devices (child_id, device_token_hash, linked_by)
  VALUES (v_pin_record.child_id, v_token_hash, v_pin_record.created_by)
  ON CONFLICT (device_token_hash) DO UPDATE SET
    child_id = v_pin_record.child_id,
    revoked_at = NULL,
    updated_at = now();

  -- Get child info
  SELECT * INTO v_child FROM children WHERE children.id = v_pin_record.child_id;

  RETURN QUERY SELECT v_child.id, v_child.display_name, v_child.family_id;
END;
$$;

-- Fix generate_invite_code to avoid shadowed variable warning
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  idx INTEGER;
BEGIN
  FOR idx IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;
