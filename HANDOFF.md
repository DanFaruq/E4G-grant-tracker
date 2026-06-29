# HANDOFF — E4G Grant Tracker

> Session handoff so a fresh session (possibly a different Claude account) can continue
> without losing context. Last updated: 2026-06-29.

## What this project is

A full-stack grant management platform for the **Evidence for Good (E4G)** NGO team.
Tracks the grant lifecycle (Discovered → Researching → Applying → Submitted →
Awarded/Rejected) plus team tasks, events, a stakeholder CRM, a per-user "My Work"
dashboard, in-app + web-push notifications, and a discovery/opportunities feed.

Live: **https://e4g-grant-tracker.vercel.app**
Repo: **https://github.com/DanFaruq/E4G-grant-tracker** (remote `origin`, default branch `main`)

---

## Stack & how to run

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5, React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Database | Supabase (Postgres + RLS + Realtime + Storage + Auth) |
| Auth | Supabase SSR — cookie-based, session refreshed in middleware (`proxy.ts`) |
| Mutations | Next.js Server Actions (`lib/actions/`) — no API routes for writes |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Drag & drop | dnd-kit (Kanban) |
| Push | Web Push (VAPID) + Service Worker (`public/sw.js`) |
| Email | Resend |
| AI | Anthropic Claude SDK (`@anthropic-ai/sdk`) — grant scoring (not fully wired yet) |
| Hosting | Vercel (cron jobs in `vercel.json`); `netlify.toml` also present (see gotchas) |
| Tests | Jest + React Testing Library |

### Commands
```bash
npm install            # install deps
npm run dev            # dev server (Turbopack) → http://localhost:3000
npm run build          # production build
npm run start          # serve production build
npm run test           # Jest suite (runInBand)
npm run test:coverage  # coverage report
npx tsc --noEmit       # typecheck (used as the verification gate this session)
```

### Environment
Copy `.env.example` → `.env.local` and fill in:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`CRON_SECRET`, `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.
Never commit `.env.local`.

### Database
Migrations in `supabase/migrations/`, applied **in order** via Supabase SQL Editor or
`supabase db push`. NOTE: there are **7** files (README says 6 — stale). Two share the
`0004_` prefix, so order them deliberately:
1. `0001_enums.sql`
2. `0002_tables.sql`
3. `0003_rls.sql`
4. `0004_notifications_push.sql`
5. `0004_stakeholders_ext.sql`
6. `0005_team_tasks_events.sql`
7. `0006_stakeholder_archetype_v2.sql`

---

## Structure (quick map)

```
app/(auth)/            login, signup (no dashboard shell)
app/(dashboard)/       protected pages (layout checks auth)
  dashboard/           overview + merged activity feed; renders <InstallBanner/>
  grants/              list, [id], [id]/edit, new, kanban, calendar
  activity/            tasks/ + events/ (+ recent/), each with [id], [id]/edit, new
  my-work/             per-user personal dashboard (server + client split)
  deadlines/           grant deadlines page
  stakeholders/        CRM: [id], [id]/edit, new
  opportunities/       discovery feed
  notifications/       in-app notification centre
  settings/
app/api/cron/discover/   daily RSS discovery (06:00 UTC)
app/api/cron/reminders/  daily deadline digest email (07:00 UTC)
app/api/documents/upload/ file upload w/ MIME validation
app/api/unsubscribe/     push/email unsubscribe
lib/actions/           events, grants, notifications, opportunities, settings,
                       stakeholders, tasks  (all mutations live here)
lib/supabase/          browser client, server client, service-role client
lib/utils.ts           cn(), formatCurrency(), formatDate(), daysUntil()
components/            grants/, layout/, settings/, ui/ (shadcn — don't hand-edit),
                       install-banner.tsx, sw-register.tsx, theme-provider.tsx
supabase/migrations/   ordered SQL
types/database.ts      hand-maintained DB types (regenerate after schema changes)
__tests__/             stakeholder card/badge + stakeholders validator
```

---

## Status

### DONE (this session — iOS PWA installability, commit `65f16a4`)
- iOS now has a working install path. iOS Safari never fires `beforeinstallprompt`,
  and the dashboard previously rendered an Android-only banner, so iPhone users had
  no way in. Fixed by:
  - Added `public/apple-touch-icon.png` (180×180 PNG, flattened on brand `#20232f`).
    **iOS does not support SVG home-screen icons** — the old `/icon.svg` apple icon
    was the root cause of the broken/missing icon.
  - `app/layout.tsx`: `metadata.icons.apple` now points at the PNG (kept SVG for
    `icon`, added a 192 PNG fallback).
  - `components/install-banner.tsx`: detects iOS Safari (incl. iPadOS-as-desktop via
    touch+MacIntel), shows "Share → Add to Home Screen" steps there, stays hidden in
    non-Safari iOS browsers (where Add-to-Home-Screen doesn't exist) and when already
    running standalone (`navigator.standalone`).
  - Dashboard switched from `PWAInstallBanner` → `InstallBanner`; the redundant
    Android-only `components/pwa-install-banner.tsx` was deleted.
  - Verified with `npx tsc --noEmit` (clean).

### Recently DONE (prior commits)
- "My Work" personal dashboard + nav motion polish (`49919b6`)
- README rewritten as technical portfolio (`f002909`)
- Removed duplicate `middleware.ts` — `proxy.ts` handles Supabase session refresh +
  auth redirects (`a0e671a`)
- Security audit: auth hardening, SW cache fix, timing-safe cron secret checks (`a107c8f`)
- Notification icon / push fixes across several commits

### IN PROGRESS / partially wired
- AI grant scoring — `@anthropic-ai/sdk` is a dependency but the scoring pipeline is
  not fully wired into the UI/flow yet.
- Discovery pipeline — `api/cron/discover` + `opportunities/` exist (RSS via
  `rss-parser`); broader sources (Grants.gov, IMAP) are roadmap, not built.

### NEXT (roadmap — from README "Project Status" + CLAUDE.md phases)
- AI grant scoring using Claude (Haiku) end-to-end
- Dedicated push service / FCM for more reliable mobile push
- Slack webhook integration
- Full discovery pipeline (Grants.gov API, IMAP email ingestion)

---

## Key decisions & conventions (live in conversation / CLAUDE.md, not obvious from code)

- **Server Components fetch directly** with `createClient()` from `lib/supabase/server.ts`.
  Client Components are interactivity islands only.
- **All writes go through Server Actions** in `lib/actions/` — there are intentionally
  no API routes for mutations (API routes exist only for cron, upload, unsubscribe).
- **Service-role client** (`createServiceClient`) is used **only** in Server Actions and
  API/cron routes — never in client components.
- **RLS is the real security boundary.** UI role checks (Admin / Team Member / Viewer)
  are UX only, not guards.
- **Activity history is INSERT-only**, written via service role to bypass RLS on that table.
- **Auth/session refresh lives in `proxy.ts`, not `middleware.ts`** — do not re-add a
  `middleware.ts`; it was deliberately removed as a duplicate.
- **Service worker + manifest must never be cached** — both `vercel.json` and
  `netlify.toml` set `Cache-Control: no-cache` on `/sw.js` and `/manifest.json`, or
  Chrome won't verify the PWA. Bump the SW cache version when changing `sw.js`.
- **`types/database.ts` is hand-maintained** — regenerate/update after any schema change.
- **`components/ui/`** are shadcn primitives — don't hand-edit.
- **Branch policy: always work on and push to `main`.** Never push to `master`.

---

## Known issues / gotchas

- **Commit `65f16a4` has a malformed subject line** — it reads `@ fix(pwa): make app
  installable on iOS` (a stray leading `@` from a PowerShell heredoc token leaking into
  a Bash command). **The code in it is correct and pushed.** The message was *not* fixed
  because amend + force-push to `main` is blocked by the environment's safety policy. It
  is cosmetic; leave it unless you deliberately force-push a reword.
- **Deploy target ambiguity:** README + live URL say **Vercel** (`vercel.json` has the
  cron jobs), but `netlify.toml` is also committed and saved memory says "Netlify deploys
  from `main`". Both configs exist. Treat `main` as the deploy branch regardless; confirm
  with the owner which platform is actually serving production before changing deploy
  config or cron schedules.
- **iOS push is limited** — Web Push works once the app is added to the home screen, but
  iOS is finicky; FCM / dedicated push service is on the roadmap for reliability.
- **Migration ordering** — two `0004_` files exist (see Database section); don't assume
  lexical order is safe without checking both.
- Windows dev environment: shell is PowerShell. **Do not paste Bash heredocs
  (`<<'EOF'`) into PowerShell** — use PowerShell single-quoted here-strings `@' ... '@`
  with the closing `'@` at column 0. (This is exactly what caused the `65f16a4` typo.)

---

## Where design references / specs live

- `docs/superpowers/specs/2026-05-30-portfolio-design.md` — design spec (untracked at
  handoff time; included in the handoff commit)
- `docs/superpowers/plans/2026-05-30-portfolio-website.md` — implementation plan
  (untracked at handoff time; included in the handoff commit)
- `CLAUDE.md` (repo root) — codebase guide + phase roadmap (Phase 1–4)
- `README.md` — full feature/architecture writeup (note: migration count is stale)
- `.env.example` — required environment variables

---

## Resuming checklist

1. `npm install`, set up `.env.local`, apply migrations in order, `npm run dev`.
2. `git log --oneline -5` and `git status` to re-orient.
3. Typecheck gate: `npx tsc --noEmit` should be clean before/after changes.
4. Confirm the actual production host (Vercel vs Netlify) before touching deploy/cron.
5. If continuing PWA/iOS work: physically test on an iPhone **in Safari** — banner
   should appear with "Add to Home Screen" steps and the E4G icon should render.
