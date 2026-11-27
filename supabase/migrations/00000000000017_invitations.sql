-- Family invitations for second parent and child device linking

-- Invitations for adding second parent
CREATE TABLE invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'coach')),
  email       TEXT,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Child device PINs for linking
CREATE TABLE child_device_pins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  pin         TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, pin)
);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_device_pins ENABLE ROW LEVEL SECURITY;

-- Generate random 6-char uppercase code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Generate random 6-digit PIN
CREATE OR REPLACE FUNCTION generate_device_pin()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN lpad(floor(random() * 1000000)::text, 6, '0');
END;
$$;

-- RLS policies for invitations
-- Family members can view their family's invitations
CREATE POLICY "invitations: family read"
  ON invitations FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Only owner/parent can create invitations
CREATE POLICY "invitations: parent create"
  ON invitations FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'parent')
    )
    AND created_by = auth.uid()
  );

-- Anyone can read invitation by code (for accepting)
CREATE POLICY "invitations: read by code"
  ON invitations FOR SELECT
  USING (true);

-- User can accept invitation (update accepted_by)
CREATE POLICY "invitations: accept"
  ON invitations FOR UPDATE
  USING (
    accepted_by IS NULL
    AND expires_at > now()
  )
  WITH CHECK (
    accepted_by = auth.uid()
    AND accepted_at IS NOT NULL
  );

-- RLS policies for child device PINs
-- Family members can view/create PINs for their family's children
CREATE POLICY "child_device_pins: family read"
  ON child_device_pins FOR SELECT
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN members m ON m.family_id = c.family_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "child_device_pins: parent create"
  ON child_device_pins FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN members m ON m.family_id = c.family_id
      WHERE m.user_id = auth.uid()
      AND m.role IN ('owner', 'parent')
    )
    AND created_by = auth.uid()
  );

-- Function to create parent invitation
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
    EXIT WHEN NOT EXISTS (SELECT 1 FROM invitations WHERE code = v_code);
  END LOOP;

  v_expires := now() + interval '7 days';

  INSERT INTO invitations (family_id, code, email, created_by, expires_at)
  VALUES (p_family_id, v_code, p_email, auth.uid(), v_expires)
  RETURNING invitations.id INTO v_id;

  RETURN QUERY SELECT v_id, v_code, v_expires;
END;
$$;

-- Function to accept parent invitation
CREATE OR REPLACE FUNCTION accept_invitation(p_code TEXT)
RETURNS TABLE(family_id UUID, family_name TEXT, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invite invitations%ROWTYPE;
  v_family families%ROWTYPE;
BEGIN
  -- Find valid invitation
  SELECT * INTO v_invite FROM invitations
  WHERE code = upper(p_code)
  AND accepted_by IS NULL
  AND expires_at > now();

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND members.family_id = v_invite.family_id
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
  SELECT * INTO v_family FROM families WHERE id = v_invite.family_id;

  RETURN QUERY SELECT v_family.id, v_family.name, v_invite.role;
END;
$$;

-- Function to create child device PIN
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
  DELETE FROM child_device_pins
  WHERE child_id = p_child_id AND expires_at < now();

  -- Generate unique PIN
  LOOP
    v_pin := generate_device_pin();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM child_device_pins
      WHERE child_id = p_child_id AND pin = v_pin
    );
  END LOOP;

  v_expires := now() + interval '15 minutes';

  INSERT INTO child_device_pins (child_id, pin, created_by, expires_at)
  VALUES (p_child_id, v_pin, auth.uid(), v_expires);

  RETURN QUERY SELECT v_pin, v_expires;
END;
$$;

-- Function to link child device using PIN (called from child device)
CREATE OR REPLACE FUNCTION link_child_device(p_pin TEXT, p_device_token TEXT)
RETURNS TABLE(child_id UUID, child_name TEXT, family_id UUID)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pin_record child_device_pins%ROWTYPE;
  v_child children%ROWTYPE;
  v_token_hash TEXT;
BEGIN
  -- Find valid PIN
  SELECT * INTO v_pin_record FROM child_device_pins
  WHERE pin = p_pin
  AND used_at IS NULL
  AND expires_at > now();

  IF v_pin_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired PIN';
  END IF;

  -- Hash the device token
  v_token_hash := encode(digest(p_device_token, 'sha256'), 'hex');

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
  SELECT * INTO v_child FROM children WHERE id = v_pin_record.child_id;

  RETURN QUERY SELECT v_child.id, v_child.display_name, v_child.family_id;
END;
$$;

-- Indexes
CREATE INDEX idx_invitations_code ON invitations(code);
CREATE INDEX idx_invitations_family ON invitations(family_id);
CREATE INDEX idx_child_device_pins_child ON child_device_pins(child_id);
CREATE INDEX idx_child_device_pins_pin ON child_device_pins(pin);

-- Add updated_at trigger for invitations
CREATE TRIGGER invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
