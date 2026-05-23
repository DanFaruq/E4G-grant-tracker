# E4G Team Management — Redesign Spec
**Date:** 2026-05-23
**Status:** Approved

## Overview

Three interconnected changes to transform E4G Grant Tracker into a full team management platform:

1. **App rebrand** — rename to "E4G Team Management" throughout
2. **Dashboard redesign** — three-pillar overview (Grants / Stakeholders / Team Tasks) with colorful gradient cards, GitHub-style urgency bars, and a live activity feed
3. **Team Tasks + Events** — GitHub Issues-inspired task tracker with assignees, comments, status tracking, and a separate event system supporting one-time and recurring events

The existing design system (shadcn/ui, Tailwind CSS v4, existing color tokens) is preserved. The GitHub aesthetic is achieved through layout and density patterns — compact list rows, tab bars with counts, status pills, avatar stacks, sidebar filters — not by changing the color palette.

---

## 1. App Rebrand

**Scope:** Text strings and metadata only. No structural changes.

- `components/layout/sidebar.tsx` — "E4G Grants" → "E4G Team Management", subtitle "Evidence for Good" stays
- `components/layout/mobile-tab-bar.tsx` — no label change needed
- `app/layout.tsx` — `<title>` and `<meta name="description">`
- `public/manifest.json` (if present) — `name` and `short_name`
- `next.config.ts` — any hardcoded app name

---

## 2. Dashboard Redesign

### Stat cards (top row)

Three equal-weight gradient cards replacing the current plain pipeline section:

| Card | Gradient | Metric | Sub-text |
|------|----------|--------|----------|
| Grants | amber `#f59e0b → #d97706` | Active grant count | "N deadlines this month" |
| Stakeholders | indigo `#6366f1 → #4f46e5` | Total stakeholder count | Archetype breakdown (gov · foundation · corp) |
| Team Tasks | green `#10b981 → #059669` | Open task count | "N urgent · N events" |

Each card has a white mini progress bar at the bottom (fill = percentage of capacity or pipeline progress).

Cards are clickable — navigate to `/grants`, `/stakeholders`, `/activity` respectively.

### Deadline section (bottom left)

Replaces plain list. Each deadline row has a left color bar:
- Red (`bg-destructive`) — ≤ 7 days
- Amber (`bg-amber-400`) — 8–30 days

Row shows: grant name, funder, days remaining (coloured to match bar).

### Recent Team Activity feed (bottom right)

Shows last 5 entries from `stakeholder_activities` + `team_tasks` state changes combined, ordered by `created_at` desc:
- Avatar initial circle (user's colour, derived from user id)
- Action text: "Closed task #N", "Meeting with [stakeholder]", "Opened task #N"
- Relative time ("2h ago", "Yesterday")

### Mobile layout

On `< md`: stat cards stack vertically (full width), deadline and activity sections stack below each other full width.

### Data fetching

Dashboard server component fetches in parallel:
```ts
Promise.all([
  supabase.from("grants").select(...),          // existing
  supabase.from("stakeholders").select("count"), // new count
  supabase.from("team_tasks")                   // new open count + urgent count
    .select("id, status, priority")
    .eq("status", "open").or("status.eq.in_progress"),
  supabase.from("team_events")                  // new upcoming event count
    .select("id").gte("start_at", new Date().toISOString()),
  supabase.from("stakeholder_activities")       // existing, reused for feed
    .select("*, profile:profiles(full_name)").order("occurred_at", { ascending: false }).limit(3),
  supabase.from("team_tasks")                   // recent task changes for feed
    .select("id, title, status, updated_at, assignees:task_assignments(profile:profiles(full_name))")
    .order("updated_at", { ascending: false }).limit(3),
])
```

---

## 3. Team Tasks

### Database — `team_tasks`

```sql
create type task_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');

create table team_tasks (
  id          uuid primary key default gen_random_uuid(),
  number      serial unique,           -- display as #N
  title       text not null,
  body        text,                    -- markdown description
  status      task_status not null default 'open',
  priority    task_priority not null default 'medium',
  due_date    date,
  created_by  uuid references profiles(id) not null,
  grant_id    uuid references grants(id) on delete set null,
  stakeholder_id uuid references stakeholders(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table task_assignments (
  task_id    uuid references team_tasks(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (task_id, profile_id)
);

create table task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references team_tasks(id) on delete cascade,
  author_id  uuid references profiles(id) not null,
  body       text not null,
  created_at timestamptz default now()
);
```

RLS: all authenticated users can read. `created_by = auth.uid()` or `role = admin` required for write/delete on tasks. Any authenticated user can comment.

### Pages

**`/activity`** — List page
- Tab bar: `Open (N)` | `Closed (N)` | `Events (N)` | `+ New Task` button | `+ New Event` button
- Filter bar: Assignee ▾ | Priority ▾ | Grant ▾ | Stakeholder ▾
- Task rows (GitHub issue style):
  - Status dot (colour-coded) + title + status pill + type label (Grant / Stakeholder tag)
  - Meta line: "Opened by [name] · due [date] · assigned to [names]"
  - Assignee avatar stack (right)
- Empty state per tab

**`/activity/tasks/new`** — Create task
- Fields: title (required), body (markdown textarea), priority select, due date, assignees (multi-select from profiles), linked grant (optional), linked stakeholder (optional)
- Server action: `createTask`

**`/activity/tasks/[id]`** — Task detail
- GitHub issue layout: main content (left 2/3) + sidebar (right 1/3)
- Main: status badge + title, body (rendered markdown via `remark` or plain `whitespace-pre-wrap`), comment thread
- Sidebar: Assignees, Due date, Priority, Linked grant, Linked stakeholder, Created by
- Actions: Close task / Reopen task (button), Delete (admin only)
- Comment form at bottom: textarea + submit

**`/activity/tasks/[id]/edit`** — Edit task (same form as new, pre-filled)

### Server actions (`lib/actions/tasks.ts`)

```ts
createTask(formData)        // inserts task + assignments
updateTask(id, formData)    // updates task fields + reassigns
closeTask(id)               // sets status = 'done'
reopenTask(id)              // sets status = 'open'
deleteTask(id)              // admin only
addComment(taskId, body)    // inserts task_comment
deleteComment(commentId)    // author or admin
```

### Status + priority colours

| Status | Dot colour | Pill |
|--------|-----------|------|
| open | `text-primary` (indigo) | `bg-primary/10 text-primary` |
| in_progress | `text-amber-500` | `bg-amber-50 text-amber-700 border-amber-200` |
| done | `text-emerald-500` | `bg-emerald-50 text-emerald-700` |
| cancelled | `text-muted-foreground` | `bg-muted text-muted-foreground line-through` |

| Priority | Pill |
|----------|------|
| urgent | `bg-destructive/10 text-destructive border-destructive/30` |
| high | `bg-orange-50 text-orange-700 border-orange-200` |
| medium | `bg-blue-50 text-blue-700 border-blue-200` |
| low | `bg-muted text-muted-foreground` |

---

## 4. Events

### Database — `team_events`

```sql
create type event_type as enum ('meeting', 'deadline', 'review', 'call', 'workshop', 'other');
create type recurrence_type as enum ('none', 'daily', 'weekly', 'monthly');

create table team_events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  event_type      event_type not null default 'meeting',
  start_at        timestamptz not null,
  end_at          timestamptz,
  all_day         boolean default false,
  recurrence      recurrence_type not null default 'none',
  recurrence_end  date,                  -- null = indefinite
  created_by      uuid references profiles(id) not null,
  grant_id        uuid references grants(id) on delete set null,
  stakeholder_id  uuid references stakeholders(id) on delete set null,
  created_at      timestamptz default now()
);

create table event_attendees (
  event_id   uuid references team_events(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (event_id, profile_id)
);
```

### Events tab on `/activity`

When the Events tab is active, shows upcoming events in chronological order:
- Event type icon (calendar/phone/video etc.) + title + date/time
- Attendee avatars, linked grant/stakeholder if set
- Recurrence badge ("Weekly", "Monthly") if applicable

**Create/edit event modal** (no separate page — sheet/dialog):
- Fields: title, event_type, start date+time, end time (optional), all_day toggle, recurrence select, recurrence_end (if recurring), attendees (multi-select profiles), linked grant, linked stakeholder, description

### Server actions (`lib/actions/events.ts`)

```ts
createEvent(formData)
updateEvent(id, formData)
deleteEvent(id)
```

---

## 5. GitHub-style UI Patterns

Applied consistently across Tasks, Events, and wherever applicable in existing pages:

### List rows
```
[status dot] [title] [status pill] [type label]
             [meta: opened by · due · assigned to]          [avatar stack]
```
Border-bottom dividers. `hover:bg-muted/40` row highlight. No card shadow.

### Tab bar
```
● Open (5) | ✓ Closed (12) | 📅 Events (3)          [+ New Task] [+ New Event]
```
Active tab: `border-b-2 border-primary text-primary`. Inactive: `text-muted-foreground`.

### Filter bar
Compact `<Select>` dropdowns with `▾` indicator. Clear button appears when any filter active.

### Sidebar (task detail)
Fixed-width right column (`w-56`) with labelled metadata rows. Labels in `text-xs font-semibold uppercase tracking-wide text-muted-foreground`.

### Avatar stack
Overlapping circles (`-ml-1.5` after first), `size-6`, `rounded-full`, user initial, `bg-primary` (varied by user hash).

### Status dots
`size-2.5 rounded-full` inline before title. Colours per status table above.

---

## 6. Navigation Updates

Sidebar `/activity` entry label: "Team Tasks" (was "Team Activity"), icon stays `Activity`.

Mobile tab bar: no change (Contacts tab stays, More tab → includes activity).

---

## Out of scope

- Real-time task updates (Supabase Realtime on tasks — Phase 2)
- Markdown rendering (body stored as plain text, displayed with `whitespace-pre-wrap`)
- File attachments on tasks
- Task labels/milestones (GitHub-style) — Phase 2
- In-app notifications for task assignments — Phase 3

---

## Migration

New migration file: `supabase/migrations/0005_team_tasks_events.sql`

Applies: `task_status`, `task_priority`, `event_type`, `recurrence_type` enums + `team_tasks`, `task_assignments`, `task_comments`, `team_events`, `event_attendees` tables + indexes + RLS policies.
