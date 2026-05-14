-- Row Level Security policies for E4G Grant Tracker

-- Helper: check caller's role from profiles table
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── profiles ────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: authenticated can read all"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles: users update own row"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "profiles: admin updates any row"
  ON profiles FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

-- ─── grants ──────────────────────────────────────────────────────────────────
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grants: authenticated can read non-archived"
  ON grants FOR SELECT TO authenticated
  USING (archived = false OR get_user_role() = 'admin');

CREATE POLICY "grants: team and admin can insert"
  ON grants FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "grants: team and admin can update"
  ON grants FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "grants: admin can delete"
  ON grants FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ─── grant_assignees ─────────────────────────────────────────────────────────
ALTER TABLE grant_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grant_assignees: authenticated can read"
  ON grant_assignees FOR SELECT TO authenticated USING (true);

CREATE POLICY "grant_assignees: team and admin can insert"
  ON grant_assignees FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "grant_assignees: team and admin can delete"
  ON grant_assignees FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'team_member'));

-- ─── stakeholders ────────────────────────────────────────────────────────────
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stakeholders: authenticated can read"
  ON stakeholders FOR SELECT TO authenticated USING (true);

CREATE POLICY "stakeholders: team and admin can write"
  ON stakeholders FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "stakeholders: team and admin can update"
  ON stakeholders FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "stakeholders: admin can delete"
  ON stakeholders FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ─── grant_stakeholders ──────────────────────────────────────────────────────
ALTER TABLE grant_stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grant_stakeholders: authenticated can read"
  ON grant_stakeholders FOR SELECT TO authenticated USING (true);

CREATE POLICY "grant_stakeholders: team and admin can write"
  ON grant_stakeholders FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "grant_stakeholders: team and admin can delete"
  ON grant_stakeholders FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'team_member'));

-- ─── milestones ──────────────────────────────────────────────────────────────
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones: authenticated can read"
  ON milestones FOR SELECT TO authenticated USING (true);

CREATE POLICY "milestones: team and admin can insert"
  ON milestones FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "milestones: team and admin can update"
  ON milestones FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "milestones: admin can delete"
  ON milestones FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ─── progress_notes ──────────────────────────────────────────────────────────
ALTER TABLE progress_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_notes: authenticated can read"
  ON progress_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "progress_notes: team and admin can insert"
  ON progress_notes FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "progress_notes: author or admin can update"
  ON progress_notes FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "progress_notes: author or admin can delete"
  ON progress_notes FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR get_user_role() = 'admin');

-- ─── documents ───────────────────────────────────────────────────────────────
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents: authenticated can read"
  ON documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "documents: team and admin can upload"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "documents: admin can delete"
  ON documents FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ─── activity_history ────────────────────────────────────────────────────────
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_history: authenticated can read"
  ON activity_history FOR SELECT TO authenticated USING (true);

-- Only service_role can insert (enforced by no INSERT policy for authenticated)

-- ─── opportunities ───────────────────────────────────────────────────────────
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opportunities: team and admin can read"
  ON opportunities FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "opportunities: admin can update (promote/dismiss)"
  ON opportunities FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "opportunities: admin can delete"
  ON opportunities FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ─── opportunity_sources ─────────────────────────────────────────────────────
ALTER TABLE opportunity_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opportunity_sources: authenticated can read"
  ON opportunity_sources FOR SELECT TO authenticated USING (true);

CREATE POLICY "opportunity_sources: admin can write"
  ON opportunity_sources FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "opportunity_sources: admin can update"
  ON opportunity_sources FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "opportunity_sources: admin can delete"
  ON opportunity_sources FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ─── notifications ───────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: users see own"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications: users can mark own as read"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── notification_preferences ────────────────────────────────────────────────
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences: users see own"
  ON notification_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notification_preferences: users upsert own"
  ON notification_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_preferences: users update own"
  ON notification_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ─── push_subscriptions ──────────────────────────────────────────────────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions: users see own"
  ON push_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions: users insert own"
  ON push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions: users delete own"
  ON push_subscriptions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ─── organization_settings ───────────────────────────────────────────────────
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organization_settings: authenticated can read"
  ON organization_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "organization_settings: admin can update"
  ON organization_settings FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');
