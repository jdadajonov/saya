-- Grant permissions to authenticated and anon roles

-- Authenticated users can read/write most tables (RLS controls row access)
GRANT SELECT, INSERT, UPDATE, DELETE ON families TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON children TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON child_devices TO authenticated;
GRANT SELECT ON skills TO authenticated;
GRANT SELECT ON exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE ON skill_states TO authenticated;
GRANT SELECT, INSERT ON attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON activity_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON goals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON milestones TO authenticated;
GRANT SELECT, INSERT ON evidence TO authenticated;
GRANT SELECT ON ledger_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON redemptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON settings_child TO authenticated;
GRANT SELECT, INSERT ON events TO authenticated;
GRANT SELECT ON feature_flags TO authenticated;

-- For Stage 6 rewards tables
GRANT SELECT, INSERT ON activity_days TO authenticated;
GRANT SELECT, INSERT ON streak_bonuses TO authenticated;

-- Anon role needs minimal access (only for pre-auth operations)
GRANT SELECT ON skills TO anon;
GRANT SELECT ON exercises TO anon;
