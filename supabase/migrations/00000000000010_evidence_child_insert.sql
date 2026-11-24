-- Allow children to insert evidence for their own goal milestones
-- (for milestone verification requests)

CREATE POLICY "evidence: child insert own milestone"
  ON evidence FOR INSERT
  WITH CHECK (
    is_child_jwt()
    AND milestone_id IS NOT NULL
    AND milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN goals g ON g.id = m.goal_id
      WHERE g.child_id = get_child_id_from_jwt()
    )
  );

-- Allow parents to update evidence (to confirm milestone completion)
CREATE POLICY "evidence: parent update"
  ON evidence FOR UPDATE
  USING (
    NOT is_child_jwt()
    AND milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN goals g ON g.id = m.goal_id
      JOIN children c ON c.id = g.child_id
      WHERE c.family_id IN (SELECT get_my_family_ids())
    )
  );
