-- Stage 1 RLS policies and helper functions

-- ── Helper functions ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_family_parent(p_family_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE user_id  = auth.uid()
      AND family_id = p_family_id
      AND role IN ('owner', 'parent')
  );
$$;

CREATE OR REPLACE FUNCTION get_my_family_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT family_id FROM members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_child_jwt()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'child',
    false
  );
$$;

CREATE OR REPLACE FUNCTION get_child_id_from_jwt()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'child_id')::UUID;
$$;

-- ── families ─────────────────────────────────────────────────────────────────

CREATE POLICY "families: member read"
  ON families FOR SELECT
  USING (id IN (SELECT get_my_family_ids()));

CREATE POLICY "families: owner update"
  ON families FOR UPDATE
  USING (is_family_parent(id));

CREATE POLICY "families: owner insert"
  ON families FOR INSERT
  WITH CHECK (true);

-- ── members ──────────────────────────────────────────────────────────────────

CREATE POLICY "members: same family read"
  ON members FOR SELECT
  USING (family_id IN (SELECT get_my_family_ids()));

CREATE POLICY "members: owner insert"
  ON members FOR INSERT
  WITH CHECK (family_id IN (SELECT get_my_family_ids()));

CREATE POLICY "members: owner delete"
  ON members FOR DELETE
  USING (family_id IN (SELECT get_my_family_ids()));

-- ── children ─────────────────────────────────────────────────────────────────

CREATE POLICY "children: family member read"
  ON children FOR SELECT
  USING (family_id IN (SELECT get_my_family_ids())
      OR id = get_child_id_from_jwt());

CREATE POLICY "children: parent insert"
  ON children FOR INSERT
  WITH CHECK (is_family_parent(family_id));

CREATE POLICY "children: parent update"
  ON children FOR UPDATE
  USING (is_family_parent(family_id));

CREATE POLICY "children: parent delete"
  ON children FOR DELETE
  USING (is_family_parent(family_id));

-- ── child_devices ────────────────────────────────────────────────────────────

CREATE POLICY "child_devices: parent read"
  ON child_devices FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children
      WHERE family_id IN (SELECT get_my_family_ids())
    )
  );

CREATE POLICY "child_devices: service only insert"
  ON child_devices FOR INSERT
  WITH CHECK (false); -- inserted via service-role Edge Function only

CREATE POLICY "child_devices: parent delete"
  ON child_devices FOR DELETE
  USING (
    child_id IN (
      SELECT id FROM children
      WHERE family_id IN (SELECT get_my_family_ids())
    )
  );

-- ── skills ───────────────────────────────────────────────────────────────────

CREATE POLICY "skills: authenticated read"
  ON skills FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── exercises ────────────────────────────────────────────────────────────────

CREATE POLICY "exercises: authenticated read"
  ON exercises FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── skill_states ─────────────────────────────────────────────────────────────

CREATE POLICY "skill_states: child read own"
  ON skill_states FOR SELECT
  USING (child_id = get_child_id_from_jwt()
      OR child_id IN (
           SELECT id FROM children
           WHERE family_id IN (SELECT get_my_family_ids())
         ));

CREATE POLICY "skill_states: child upsert own"
  ON skill_states FOR INSERT
  WITH CHECK (child_id = get_child_id_from_jwt());

CREATE POLICY "skill_states: child update own"
  ON skill_states FOR UPDATE
  USING (child_id = get_child_id_from_jwt());

-- ── attempts ─────────────────────────────────────────────────────────────────

CREATE POLICY "attempts: child read own"
  ON attempts FOR SELECT
  USING (child_id = get_child_id_from_jwt()
      OR child_id IN (
           SELECT id FROM children
           WHERE family_id IN (SELECT get_my_family_ids())
         ));

CREATE POLICY "attempts: child insert own"
  ON attempts FOR INSERT
  WITH CHECK (child_id = get_child_id_from_jwt()
           AND is_child_jwt());

-- ── activities ───────────────────────────────────────────────────────────────

CREATE POLICY "activities: family read"
  ON activities FOR SELECT
  USING (child_id IN (
    SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
  ) OR child_id = get_child_id_from_jwt());

CREATE POLICY "activities: parent write"
  ON activities FOR INSERT
  WITH CHECK (child_id IN (
    SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
  ) AND NOT is_child_jwt());

CREATE POLICY "activities: parent update"
  ON activities FOR UPDATE
  USING (child_id IN (
    SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
  ) AND NOT is_child_jwt());

CREATE POLICY "activities: parent delete"
  ON activities FOR DELETE
  USING (child_id IN (
    SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
  ) AND NOT is_child_jwt());

-- ── activity_sessions ────────────────────────────────────────────────────────

CREATE POLICY "activity_sessions: family read"
  ON activity_sessions FOR SELECT
  USING (activity_id IN (
    SELECT id FROM activities WHERE child_id IN (
      SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
    )
  ) OR activity_id IN (
    SELECT id FROM activities WHERE child_id = get_child_id_from_jwt()
  ));

CREATE POLICY "activity_sessions: parent write"
  ON activity_sessions FOR INSERT
  WITH CHECK (activity_id IN (
    SELECT id FROM activities WHERE child_id IN (
      SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
    )
  ) AND NOT is_child_jwt());

CREATE POLICY "activity_sessions: parent update"
  ON activity_sessions FOR UPDATE
  USING (activity_id IN (
    SELECT id FROM activities WHERE child_id IN (
      SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
    )
  ) AND NOT is_child_jwt());

-- ── goals ────────────────────────────────────────────────────────────────────

CREATE POLICY "goals: family read"
  ON goals FOR SELECT
  USING (child_id IN (
    SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
  ) OR child_id = get_child_id_from_jwt());

CREATE POLICY "goals: parent insert"
  ON goals FOR INSERT
  WITH CHECK (
    (is_child_jwt() AND child_id = get_child_id_from_jwt())
    OR (NOT is_child_jwt() AND child_id IN (
      SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
    ))
  );

CREATE POLICY "goals: parent update"
  ON goals FOR UPDATE
  USING (child_id IN (
    SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
  ) AND NOT is_child_jwt());

-- ── milestones ───────────────────────────────────────────────────────────────

CREATE POLICY "milestones: family read"
  ON milestones FOR SELECT
  USING (goal_id IN (
    SELECT id FROM goals WHERE child_id IN (
      SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
    )
  ) OR goal_id IN (
    SELECT id FROM goals WHERE child_id = get_child_id_from_jwt()
  ));

CREATE POLICY "milestones: parent write"
  ON milestones FOR INSERT
  WITH CHECK (goal_id IN (
    SELECT id FROM goals WHERE child_id IN (
      SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
    )
  ) AND NOT is_child_jwt());

CREATE POLICY "milestones: parent update"
  ON milestones FOR UPDATE
  USING (goal_id IN (
    SELECT id FROM goals WHERE child_id IN (
      SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
    )
  ) AND NOT is_child_jwt());

-- ── evidence ─────────────────────────────────────────────────────────────────

CREATE POLICY "evidence: family read"
  ON evidence FOR SELECT
  USING (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN goals g ON g.id = m.goal_id
      JOIN children c ON c.id = g.child_id
      WHERE c.family_id IN (SELECT get_my_family_ids())
         OR c.id = get_child_id_from_jwt()
    )
    OR
    session_id IN (
      SELECT s.id FROM activity_sessions s
      JOIN activities a ON a.id = s.activity_id
      JOIN children c ON c.id = a.child_id
      WHERE c.family_id IN (SELECT get_my_family_ids())
         OR c.id = get_child_id_from_jwt()
    )
  );

CREATE POLICY "evidence: parent insert"
  ON evidence FOR INSERT
  WITH CHECK (NOT is_child_jwt());

-- ── ledger_entries ───────────────────────────────────────────────────────────
-- Append-only for child: child can read own, never delete/update.
-- Parent can read own family's.

CREATE POLICY "ledger_entries: child read own"
  ON ledger_entries FOR SELECT
  USING (child_id = get_child_id_from_jwt()
      OR child_id IN (
           SELECT id FROM children
           WHERE family_id IN (SELECT get_my_family_ids())
         ));

CREATE POLICY "ledger_entries: service only insert"
  ON ledger_entries FOR INSERT
  WITH CHECK (false); -- inserted via Edge Function with service role only

-- ── rewards ──────────────────────────────────────────────────────────────────

CREATE POLICY "rewards: family member read"
  ON rewards FOR SELECT
  USING (family_id IN (SELECT get_my_family_ids())
      OR family_id IN (
           SELECT family_id FROM children
           WHERE id = get_child_id_from_jwt()
         ));

CREATE POLICY "rewards: parent write"
  ON rewards FOR INSERT
  WITH CHECK (family_id IN (SELECT get_my_family_ids()) AND NOT is_child_jwt());

CREATE POLICY "rewards: parent update"
  ON rewards FOR UPDATE
  USING (family_id IN (SELECT get_my_family_ids()) AND NOT is_child_jwt());

CREATE POLICY "rewards: parent delete"
  ON rewards FOR DELETE
  USING (family_id IN (SELECT get_my_family_ids()) AND NOT is_child_jwt());

-- ── redemptions ──────────────────────────────────────────────────────────────

CREATE POLICY "redemptions: family read"
  ON redemptions FOR SELECT
  USING (child_id = get_child_id_from_jwt()
      OR child_id IN (
           SELECT id FROM children
           WHERE family_id IN (SELECT get_my_family_ids())
         ));

CREATE POLICY "redemptions: child request"
  ON redemptions FOR INSERT
  WITH CHECK (child_id = get_child_id_from_jwt() AND is_child_jwt());

CREATE POLICY "redemptions: parent update status"
  ON redemptions FOR UPDATE
  USING (child_id IN (
    SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
  ) AND NOT is_child_jwt());

-- ── settings_child ───────────────────────────────────────────────────────────

CREATE POLICY "settings_child: family read"
  ON settings_child FOR SELECT
  USING (child_id = get_child_id_from_jwt()
      OR child_id IN (
           SELECT id FROM children
           WHERE family_id IN (SELECT get_my_family_ids())
         ));

CREATE POLICY "settings_child: parent write"
  ON settings_child FOR INSERT
  WITH CHECK (child_id IN (
    SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
  ) AND NOT is_child_jwt());

CREATE POLICY "settings_child: parent update"
  ON settings_child FOR UPDATE
  USING (child_id IN (
    SELECT id FROM children WHERE family_id IN (SELECT get_my_family_ids())
  ) AND NOT is_child_jwt());

-- ── events ───────────────────────────────────────────────────────────────────

CREATE POLICY "events: family read"
  ON events FOR SELECT
  USING (family_id IN (SELECT get_my_family_ids())
      OR (child_id = get_child_id_from_jwt()
          AND family_id IN (
            SELECT family_id FROM children WHERE id = get_child_id_from_jwt()
          )));

CREATE POLICY "events: service only insert"
  ON events FOR INSERT
  WITH CHECK (false); -- inserted via Edge Functions with service role only

-- ── feature_flags ────────────────────────────────────────────────────────────

CREATE POLICY "feature_flags: family read"
  ON feature_flags FOR SELECT
  USING (family_id IN (SELECT get_my_family_ids())
      OR family_id IN (
           SELECT family_id FROM children
           WHERE id = get_child_id_from_jwt()
         )
      OR family_id IS NULL);

CREATE POLICY "feature_flags: parent write"
  ON feature_flags FOR INSERT
  WITH CHECK (family_id IN (SELECT get_my_family_ids()) AND NOT is_child_jwt());

CREATE POLICY "feature_flags: parent update"
  ON feature_flags FOR UPDATE
  USING (family_id IN (SELECT get_my_family_ids()) AND NOT is_child_jwt());
