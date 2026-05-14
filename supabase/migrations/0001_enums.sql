-- Enum types for E4G Grant Tracker

CREATE TYPE user_role AS ENUM ('admin', 'team_member', 'viewer');

CREATE TYPE grant_stage AS ENUM (
  'discovered',
  'researching',
  'applying',
  'submitted',
  'awarded',
  'rejected'
);

CREATE TYPE opportunity_status AS ENUM ('pending_review', 'promoted', 'dismissed');

CREATE TYPE notification_type AS ENUM (
  'new_opportunity',
  'deadline_reminder',
  'grant_updated',
  'comment_added',
  'milestone_due'
);

CREATE TYPE email_mode AS ENUM ('off', 'digest', 'urgent');
