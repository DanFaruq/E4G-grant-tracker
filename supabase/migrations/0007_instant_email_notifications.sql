-- ============================================================
-- 0007_instant_email_notifications.sql
-- Instant email for "you were tagged" notifications.
-- ============================================================

-- New notification type for grant assignments (task/event types exist from 0004)
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'grant_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_updated';

-- When an instant email went out for a notification. The daily digest skips
-- rows where this is set so nobody gets the same update twice.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS emailed_at timestamptz;
