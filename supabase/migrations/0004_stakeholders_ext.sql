-- supabase/migrations/0004_stakeholders_ext.sql
-- Extends stakeholders with archetype + linkedin, adds stakeholder_activities

-- ─── New enum types ───────────────────────────────────────────────────────────
CREATE TYPE stakeholder_archetype AS ENUM (
  'government', 'foundation', 'corporate', 'individual', 'other'
);

CREATE TYPE stakeholder_activity_type AS ENUM (
  'meeting', 'email', 'call', 'follow_up', 'note'
);

-- ─── Extend stakeholders table ───────────────────────────────────────────────
ALTER TABLE stakeholders
  ADD COLUMN archetype     stakeholder_archetype NOT NULL DEFAULT 'individual',
  ADD COLUMN linkedin_url  text;

-- ─── stakeholder_activities: per-stakeholder interaction log ─────────────────
CREATE TABLE stakeholder_activities (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_id uuid NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  activity_type  stakeholder_activity_type NOT NULL,
  notes          text,
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stakeholder_activities_stakeholder_idx
  ON stakeholder_activities(stakeholder_id);

CREATE INDEX stakeholder_activities_occurred_at_idx
  ON stakeholder_activities(occurred_at DESC);

-- ─── RLS for stakeholder_activities ─────────────────────────────────────────
ALTER TABLE stakeholder_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stakeholder_activities: authenticated can read"
  ON stakeholder_activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "stakeholder_activities: team and admin can insert"
  ON stakeholder_activities FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "stakeholder_activities: owner or admin can delete"
  ON stakeholder_activities FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin');
