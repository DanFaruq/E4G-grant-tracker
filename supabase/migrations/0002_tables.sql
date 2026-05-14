-- Core tables for E4G Grant Tracker

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles: extends auth.users
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL DEFAULT '',
  avatar_url  text,
  role        user_role NOT NULL DEFAULT 'viewer',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- grants: core grant records
CREATE TABLE grants (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                       text NOT NULL,
  funder                     text NOT NULL,
  amount_min                 numeric,
  amount_max                 numeric,
  amount_exact               numeric,
  deadline                   date,
  stage                      grant_stage NOT NULL DEFAULT 'discovered',
  category                   text,
  description                text,
  funder_website             text,
  application_url            text,
  created_by                 uuid REFERENCES profiles(id) ON DELETE SET NULL,
  promoted_from_opportunity  uuid,  -- FK added after opportunities table
  archived                   boolean NOT NULL DEFAULT false,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX grants_stage_idx      ON grants (stage);
CREATE INDEX grants_deadline_idx   ON grants (deadline);
CREATE INDEX grants_funder_idx     ON grants (funder);
CREATE INDEX grants_created_at_idx ON grants (created_at DESC);

CREATE TRIGGER grants_updated_at
  BEFORE UPDATE ON grants
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- stakeholders: funder contacts
CREATE TABLE stakeholders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  title        text,
  email        text,
  phone        text,
  organization text,
  notes        text,
  created_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER stakeholders_updated_at
  BEFORE UPDATE ON stakeholders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- grant_assignees: grants <-> profiles
CREATE TABLE grant_assignees (
  grant_id    uuid REFERENCES grants(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grant_id, user_id)
);

-- grant_stakeholders: grants <-> stakeholders
CREATE TABLE grant_stakeholders (
  grant_id       uuid REFERENCES grants(id) ON DELETE CASCADE,
  stakeholder_id uuid REFERENCES stakeholders(id) ON DELETE CASCADE,
  PRIMARY KEY (grant_id, stakeholder_id)
);

-- milestones: per-grant deadlines
CREATE TABLE milestones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id     uuid NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  title        text NOT NULL,
  due_date     date NOT NULL,
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX milestones_grant_id_idx ON milestones (grant_id);
CREATE INDEX milestones_due_date_idx ON milestones (due_date);

CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- progress_notes: comments on grants
CREATE TABLE progress_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id   uuid NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  author_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  body       text NOT NULL,
  pinned     boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX progress_notes_grant_id_idx ON progress_notes (grant_id);

CREATE TRIGGER progress_notes_updated_at
  BEFORE UPDATE ON progress_notes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- documents: file attachment metadata
CREATE TABLE documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id     uuid NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  uploader_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  file_name    text NOT NULL,
  storage_path text NOT NULL,
  mime_type    text NOT NULL,
  size_bytes   bigint NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX documents_grant_id_idx ON documents (grant_id);

-- activity_history: append-only audit log
CREATE TABLE activity_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id   uuid REFERENCES grants(id) ON DELETE SET NULL,
  actor_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action     text NOT NULL,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activity_history_grant_id_idx   ON activity_history (grant_id);
CREATE INDEX activity_history_created_at_idx ON activity_history (created_at DESC);

-- opportunities: automated discovery queue
CREATE TABLE opportunities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source           text NOT NULL,
  external_id      text NOT NULL,
  title            text NOT NULL,
  funder           text,
  description      text,
  amount_text      text,
  deadline_text    text,
  deadline         date,
  url              text,
  raw_data         jsonb,
  status           opportunity_status NOT NULL DEFAULT 'pending_review',
  ai_score         smallint CHECK (ai_score BETWEEN 0 AND 100),
  ai_rationale     text,
  ai_scored_at     timestamptz,
  reviewed_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at      timestamptz,
  promoted_grant_id uuid REFERENCES grants(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX opportunities_status_idx     ON opportunities (status);
CREATE INDEX opportunities_ai_score_idx   ON opportunities (ai_score DESC);
CREATE INDEX opportunities_created_at_idx ON opportunities (created_at DESC);

-- Add FK from grants -> opportunities (circular, safe because both exist now)
ALTER TABLE grants
  ADD CONSTRAINT grants_promoted_from_opportunity_fkey
  FOREIGN KEY (promoted_from_opportunity) REFERENCES opportunities(id) ON DELETE SET NULL;

-- opportunity_sources: configurable discovery sources
CREATE TABLE opportunity_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  type            text NOT NULL,
  url             text,
  config          jsonb,
  enabled         boolean NOT NULL DEFAULT true,
  last_fetched_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER opportunity_sources_updated_at
  BEFORE UPDATE ON opportunity_sources
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- notifications: per-user in-app notifications
CREATE TABLE notifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type           notification_type NOT NULL,
  title          text NOT NULL,
  body           text,
  link           text,
  read           boolean NOT NULL DEFAULT false,
  read_at        timestamptz,
  grant_id       uuid REFERENCES grants(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_id_idx    ON notifications (user_id);
CREATE INDEX notifications_read_idx       ON notifications (user_id, read) WHERE read = false;

-- notification_preferences: per-user settings
CREATE TABLE notification_preferences (
  user_id                   uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_mode                email_mode NOT NULL DEFAULT 'digest',
  email_digest_hour         smallint NOT NULL DEFAULT 8 CHECK (email_digest_hour BETWEEN 0 AND 23),
  push_enabled              boolean NOT NULL DEFAULT false,
  slack_enabled             boolean NOT NULL DEFAULT false,
  deadline_reminders        boolean NOT NULL DEFAULT true,
  new_opportunity_threshold smallint NOT NULL DEFAULT 70 CHECK (new_opportunity_threshold BETWEEN 0 AND 100),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- push_subscriptions: FCM tokens per device
CREATE TABLE push_subscriptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fcm_token      text NOT NULL,
  device_info    jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now()
);

-- organization_settings: single-row config
CREATE TABLE organization_settings (
  id                 integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  org_name           text NOT NULL DEFAULT 'E4G',
  mission_statement  text,
  focus_areas        text[] NOT NULL DEFAULT '{}',
  ai_threshold       smallint NOT NULL DEFAULT 70 CHECK (ai_threshold BETWEEN 0 AND 100),
  slack_webhook_url  text,
  grants_gov_query   text,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Seed the single org settings row
INSERT INTO organization_settings (id) VALUES (1);
