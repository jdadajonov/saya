-- Allow 'used' status for redemptions and let children mark their rewards as used

-- Update check constraint to allow 'used' status
ALTER TABLE redemptions DROP CONSTRAINT IF EXISTS redemptions_status_check;
ALTER TABLE redemptions ADD CONSTRAINT redemptions_status_check
  CHECK (status IN ('pending', 'approved', 'declined', 'used'));

-- Allow child to mark their own approved redemption as used
CREATE POLICY "redemptions: child use"
  ON redemptions FOR UPDATE
  USING (
    child_id = get_child_id_from_jwt()
    AND is_child_jwt()
    AND status = 'approved'
  )
  WITH CHECK (
    status = 'used'
  );
