-- Allow parents to create redemptions for surprise rewards
CREATE POLICY "redemptions: parent surprise"
  ON redemptions FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
    )
    AND NOT is_child_jwt()
    AND status = 'approved'
  );
