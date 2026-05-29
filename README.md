# E4G Grant Tracker

A full-stack grant management platform built for the **Evidence for Good (E4G)** NGO team. Tracks the full grant lifecycle — from discovery through award — alongside team tasks, events, stakeholder relationships, and a personal work dashboard for every team member.

Live: **[e4g-grant-tracker.vercel.app](https://e4g-grant-tracker.vercel.app)**

---

## Features

### Grant Management
- Full grant lifecycle tracking: Discovered → Researching → Applying → Submitted → Awarded / Rejected
- Kanban board and calendar views alongside the default list
- File attachments with MIME validation, notes, and a full activity history feed
- Deadline tracking with overdue alerts and a dedicated deadlines page

### Team Collaboration
- Shared task board (Team Tasks) with assignees, priority, status, due dates, and linked grants
- Team Events with recurrence, attendees, and calendar integration
- Real-time updates via Supabase Realtime across all clients

### My Work Dashboard
- Per-user personal view: every task, event, and grant assigned to that user
- KPI strip — Overdue / Due Today / In Progress / Completed counts at a glance
- Active / Completed tabs, type filter chips (Tasks / Events / Grants), group-by (Status / Priority / Grant)
- Inline status changes without leaving the page
- Admin "View as" — admins can switch between any team member's view

### Stakeholder CRM
- Contact profiles with archetype classification, linked grants, and interaction history
- Archive workflow to keep the active list clean

### Notifications & Push
- In-app notification centre with read/unread state
- Web Push (VAPID) notifications via Service Worker — works on mobile home screen
- Daily digest cron job (Vercel cron) that emails upcoming deadlines

### Discovery Pipeline
- Opportunities feed pulling from external grant sources (RSS)
- Filterable by relevance and status

### Settings & Auth
- Cookie-based Supabase SSR authentication (no JWT leakage to client)
- Role-based access control: Admin / Team Member / Viewer
- Profile management and theme switching (Light / Dark / System)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Database | Supabase (Postgres + RLS + Realtime + Storage) |
| Auth | Supabase SSR — cookie-based, middleware-refreshed |
| Server Actions | Next.js Server Actions for all mutations |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion + CSS spring transitions |
| Drag & Drop | dnd-kit (Kanban board) |
| Push | Web Push API (VAPID) + Service Worker |
| Email | Resend |
| AI | Anthropic Claude SDK (grant scoring pipeline) |
| Hosting | Vercel (with cron jobs) |
| Testing | Jest + React Testing Library |

---

## Architecture

```
app/
├── (auth)/          # Login + signup — no dashboard shell
├── (dashboard)/     # Protected pages — layout checks auth
│   ├── dashboard/   # Overview + activity feed
│   ├── grants/      # List, Kanban, calendar, detail, edit
│   ├── my-work/     # Personal dashboard (server + client split)
│   ├── activity/    # Team tasks + events
│   ├── stakeholders/
│   ├── opportunities/
│   ├── notifications/
│   └── settings/
├── api/
│   ├── cron/        # Daily deadline digest (CRON_SECRET protected)
│   └── documents/   # File upload with MIME validation
lib/
├── actions/         # Server Actions — grants, tasks, events, stakeholders…
├── supabase/        # createClient (browser) + createClient (server) + service role
└── utils.ts         # cn(), formatCurrency(), formatDate(), daysUntil()
supabase/
└── migrations/      # 7 ordered SQL migrations (enums → tables → RLS → extensions)
```

**Key decisions:**
- Server Components fetch data directly; Client Components are islands for interactivity only
- Mutations go exclusively through Server Actions — no API routes for writes
- `createServiceClient` (service role) is used only in Server Actions and cron routes, never in the browser
- RLS is the real security layer — UI role checks are UX, not guards
- Activity history is INSERT-only, written via service role to bypass RLS on the history table

---

## Database Schema (abridged)

```
grants           — core grant records (stage, deadline, funder, budget, archived)
grant_assignees  — M:M junction
grant_files      — Storage references + metadata
grant_notes      — append-only notes
activity_history — INSERT-only audit log

team_tasks       — tasks with priority, status, due date
task_assignments — M:M junction (task ↔ profile)

team_events      — meetings, deadlines, reviews with recurrence
event_attendees  — M:M junction

stakeholders     — contacts with archetype classification
stakeholder_grants — M:M junction

notifications    — in-app + push payloads
push_subscriptions — VAPID endpoint + keys per device

profiles         — extends auth.users (full_name, role, avatar)
```

Row-Level Security policies ensure users can only read/write rows they own or are assigned to. Admins get broader SELECT policies.

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/DanFaruq/E4G-grant-tracker.git
cd E4G-grant-tracker

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, RESEND_API_KEY,
#          VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

# 4. Database — apply migrations in order via Supabase SQL Editor
#    supabase/migrations/0001_enums.sql → 0002_tables.sql → … → 0006_…

# 5. Run
npm run dev   # http://localhost:3000
```

---

## Scripts

```bash
npm run dev           # Dev server (Turbopack)
npm run build         # Production build
npm run test          # Jest test suite
npm run test:coverage # Coverage report
```

---

## Project Status

Actively developed. Current phase focuses on the core grant + team workflow. Upcoming:
- AI grant scoring using Claude Haiku
- FCM / iOS push via dedicated service
- Slack webhook integration
- Full discovery pipeline (Grants.gov, IMAP)

---

Built by [Dan Faruq](https://github.com/DanFaruq)
