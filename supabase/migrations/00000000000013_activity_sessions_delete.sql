-- Allow parents to delete activity sessions

CREATE POLICY "activity_sessions: parent delete"
  ON activity_sessions FOR DELETE
  USING (activity_id IN (
    SELECT id FROM activities WHERE child_id IN (
      SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
    )
  ) AND NOT is_child_jwt());
