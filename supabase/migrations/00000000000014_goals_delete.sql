-- Allow parents to delete goals

CREATE POLICY "goals: parent delete"
  ON goals FOR DELETE
  USING (child_id IN (
    SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
  ) AND NOT is_child_jwt());

-- Also need to allow deleting milestones when goal is deleted
CREATE POLICY "milestones: parent delete"
  ON milestones FOR DELETE
  USING (goal_id IN (
    SELECT id FROM goals WHERE child_id IN (
      SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
    )
  ) AND NOT is_child_jwt());
