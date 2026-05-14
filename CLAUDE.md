# E4G Grant Tracker — Codebase Guide

## Stack
- **Next.js 16** App Router, TypeScript, Tailwind CSS v4, shadcn/ui (Radix)
- **Supabase** — Postgres + RLS + Realtime + Auth + Storage
- **Vercel** — hosting + cron jobs (vercel.json)

## Key conventions
- Server Components fetch data directly with `createClient()` from `lib/supabase/server.ts`
- Mutations go through **Server Actions** in `lib/actions/`
- The service role client (`createServiceClient`) is used only in Server Actions and API routes — never in client components
- All auth is cookie-based (Supabase SSR); middleware handles session refresh
- RLS is the security layer — never rely solely on UI role checks
- Activity history is INSERT-only and written via `createServiceClient` (service role)

## Environment variables
See `.env.example`. Copy to `.env.local` and fill in values. Never commit `.env.local`.

## Database
Migrations live in `supabase/migrations/`. Apply in order:
1. `0001_enums.sql`
2. `0002_tables.sql`
3. `0003_rls.sql`

Apply via Supabase SQL Editor or `supabase db push` (requires Supabase CLI + local link).

## Running locally
```bash
npm run dev        # Start dev server at http://localhost:3000
```

## Folder map
- `app/(auth)/`         — Login + signup pages (no dashboard nav)
- `app/(dashboard)/`    — All protected pages (layout checks auth)
- `app/api/cron/`       — Daily cron jobs (protected by CRON_SECRET)
- `app/api/documents/`  — File upload with MIME validation
- `components/grants/`  — Grant-specific UI components
- `components/layout/`  — Sidebar, header
- `components/settings/`— Settings page components
- `components/ui/`      — shadcn/ui primitives (do not hand-edit)
- `lib/actions/`        — Server Actions (grants, settings)
- `lib/supabase/`       — Supabase client factories
- `lib/utils.ts`        — cn(), formatCurrency(), formatDate(), daysUntil()
- `supabase/migrations/`— SQL migration files
- `types/database.ts`   — Hand-maintained DB types (regenerate after schema changes)

## Phase roadmap
- **Phase 1** (current): Auth + grant CRUD + realtime + files + notes + activity
- **Phase 2**: Kanban, calendar, milestones, in-app notifications, reminder cron, PWA
- **Phase 3**: Discovery pipeline (Grants.gov, RSS, IMAP), email notifications
- **Phase 4**: AI scoring (Claude Haiku), push (FCM), Slack webhook
