-- Add new notification types for task/event assignments
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'event_invited';

-- Link notifications to tasks and events
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS task_id  uuid REFERENCES team_tasks(id)  ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES team_events(id) ON DELETE CASCADE;

-- Web push subscriptions (VAPID-based, one per browser/device)
CREATE TABLE IF NOT EXISTS web_push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE web_push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subs"
  ON web_push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
