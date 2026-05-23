-- ============================================================
-- 0005_team_tasks_events.sql
-- Team Tasks, Task Assignments, Task Comments, Team Events, Event Attendees
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

create type task_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type event_type as enum ('meeting', 'deadline', 'review', 'call', 'workshop', 'other');
create type recurrence_type as enum ('none', 'daily', 'weekly', 'monthly');

-- ── team_tasks ───────────────────────────────────────────────

create table team_tasks (
  id             uuid primary key default gen_random_uuid(),
  number         serial unique,
  title          text not null,
  body           text,
  status         task_status not null default 'open',
  priority       task_priority not null default 'medium',
  due_date       date,
  created_by     uuid references profiles(id) not null,
  grant_id       uuid references grants(id) on delete set null,
  stakeholder_id uuid references stakeholders(id) on delete set null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index team_tasks_status_idx  on team_tasks(status);
create index team_tasks_created_by  on team_tasks(created_by);
create index team_tasks_updated_at  on team_tasks(updated_at desc);

-- ── task_assignments ─────────────────────────────────────────

create table task_assignments (
  task_id    uuid references team_tasks(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (task_id, profile_id)
);

-- ── task_comments ────────────────────────────────────────────

create table task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references team_tasks(id) on delete cascade,
  author_id  uuid references profiles(id) not null,
  body       text not null,
  created_at timestamptz default now()
);

create index task_comments_task_id on task_comments(task_id);

-- ── team_events ──────────────────────────────────────────────

create table team_events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  event_type      event_type not null default 'meeting',
  start_at        timestamptz not null,
  end_at          timestamptz,
  all_day         boolean default false,
  recurrence      recurrence_type not null default 'none',
  recurrence_end  date,
  created_by      uuid references profiles(id) not null,
  grant_id        uuid references grants(id) on delete set null,
  stakeholder_id  uuid references stakeholders(id) on delete set null,
  created_at      timestamptz default now()
);

create index team_events_start_at   on team_events(start_at);
create index team_events_created_by on team_events(created_by);

-- ── event_attendees ──────────────────────────────────────────

create table event_attendees (
  event_id   uuid references team_events(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (event_id, profile_id)
);

-- ── updated_at trigger ───────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger team_tasks_updated_at
  before update on team_tasks
  for each row execute function set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────

alter table team_tasks       enable row level security;
alter table task_assignments enable row level security;
alter table task_comments    enable row level security;
alter table team_events      enable row level security;
alter table event_attendees  enable row level security;

-- team_tasks: all authenticated users can read; creator or admin can write
create policy "team_tasks_read"   on team_tasks for select to authenticated using (true);
create policy "team_tasks_insert" on team_tasks for insert to authenticated with check (created_by = auth.uid());
create policy "team_tasks_update" on team_tasks for update to authenticated using (created_by = auth.uid());
create policy "team_tasks_delete" on team_tasks for delete to authenticated using (created_by = auth.uid());

-- task_assignments: all authenticated users can read/write
create policy "task_assignments_read"   on task_assignments for select to authenticated using (true);
create policy "task_assignments_insert" on task_assignments for insert to authenticated with check (true);
create policy "task_assignments_delete" on task_assignments for delete to authenticated using (true);

-- task_comments: all authenticated users can read; author can delete
create policy "task_comments_read"   on task_comments for select to authenticated using (true);
create policy "task_comments_insert" on task_comments for insert to authenticated with check (author_id = auth.uid());
create policy "task_comments_delete" on task_comments for delete to authenticated using (author_id = auth.uid());

-- team_events: all authenticated users can read; creator can write
create policy "team_events_read"   on team_events for select to authenticated using (true);
create policy "team_events_insert" on team_events for insert to authenticated with check (created_by = auth.uid());
create policy "team_events_update" on team_events for update to authenticated using (created_by = auth.uid());
create policy "team_events_delete" on team_events for delete to authenticated using (created_by = auth.uid());

-- event_attendees: all authenticated users can read/write
create policy "event_attendees_read"   on event_attendees for select to authenticated using (true);
create policy "event_attendees_insert" on event_attendees for insert to authenticated with check (true);
create policy "event_attendees_delete" on event_attendees for delete to authenticated using (true);
