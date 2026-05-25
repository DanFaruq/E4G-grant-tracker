# Stakeholder Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full Stakeholder Management section with CRUD, archetype categories, contact profiles, and per-stakeholder activity logs.

**Architecture:** New migration extends the existing `stakeholders` table (adding `archetype` + `linkedin_url`) and creates a `stakeholder_activities` table. Server actions in `lib/actions/stakeholders.ts` use the existing `requireRole` / `createServiceClient` pattern. Three new page routes under `app/(dashboard)/stakeholders/` with matching components in `components/stakeholders/`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (Postgres + RLS), shadcn/ui, React Hook Form, Zod, Framer Motion, Lucide icons, Jest + React Testing Library.

---

## File Map

| Status | File | Purpose |
|--------|------|---------|
| CREATE | `supabase/migrations/0004_stakeholders_ext.sql` | Adds archetype enum, linkedin_url column, stakeholder_activities table + RLS |
| MODIFY | `types/database.ts` | Add StakeholderArchetype, StakeholderActivityType enums; extend stakeholders Row/Insert/Update; add stakeholder_activities table types |
| CREATE | `lib/validators/stakeholders.ts` | Zod schemas (testable, no "use server" dependency) |
| CREATE | `lib/actions/stakeholders.ts` | Server actions: createStakeholder, updateStakeholder, deleteStakeholder, addStakeholderActivity, deleteStakeholderActivity |
| CREATE | `components/stakeholders/archetype-badge.tsx` | Colored badge for stakeholder archetype |
| CREATE | `components/stakeholders/stakeholder-card.tsx` | Summary card for list view |
| CREATE | `components/stakeholders/stakeholder-form.tsx` | React Hook Form + Zod create/edit form ("use client") |
| CREATE | `components/stakeholders/stakeholder-activity-form.tsx` | Dialog form to log a new activity ("use client") |
| CREATE | `components/stakeholders/stakeholder-activity-list.tsx` | Timeline of activities for a stakeholder ("use client") |
| CREATE | `app/(dashboard)/stakeholders/page.tsx` | Server Component — list/search/filter |
| CREATE | `app/(dashboard)/stakeholders/new/page.tsx` | Server Component — wraps StakeholderForm for creation |
| CREATE | `app/(dashboard)/stakeholders/[id]/page.tsx` | Server Component — full profile + grants + activity |
| CREATE | `app/(dashboard)/stakeholders/[id]/edit/page.tsx` | Server Component — wraps StakeholderForm for editing |
| MODIFY | `components/layout/sidebar.tsx` | Add Stakeholders nav item (Users2 icon) |
| MODIFY | `components/layout/mobile-tab-bar.tsx` | Replace Settings tab with Stakeholders; move Settings under More |
| CREATE | `__tests__/validators/stakeholders.test.ts` | Unit tests for Zod schemas |
| CREATE | `__tests__/components/archetype-badge.test.tsx` | Component test |
| CREATE | `__tests__/components/stakeholder-card.test.tsx` | Component test |

---

## Task 0: Test Infrastructure

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json` (add test script + devDependencies)

- [ ] **Step 0.1: Install test dependencies**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

Expected: packages installed, no peer dependency errors.

- [ ] **Step 0.2: Create jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({ dir: './' })

const customConfig: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathPattern: ['<rootDir>/__tests__/'],
}

export default createJestConfig(customConfig)
```

- [ ] **Step 0.3: Create jest.setup.ts**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 0.4: Add test script to package.json**

In `package.json`, under `"scripts"`, add:
```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

- [ ] **Step 0.5: Create __tests__ directory structure**

```bash
mkdir -p __tests__/validators __tests__/components
```

- [ ] **Step 0.6: Run jest to confirm zero tests pass**

```bash
npm test -- --passWithNoTests
```

Expected: output shows "Test Suites: 0 passed" with exit code 0.

- [ ] **Step 0.7: Commit**

```bash
git add jest.config.ts jest.setup.ts package.json package-lock.json
git commit -m "test: add Jest + React Testing Library infrastructure"
```

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/0004_stakeholders_ext.sql`

- [ ] **Step 1.1: Write the migration**

```sql
-- supabase/migrations/0004_stakeholders_ext.sql
-- Extends stakeholders with archetype + linkedin, adds stakeholder_activities

-- ─── New enum types ───────────────────────────────────────────────────────────
CREATE TYPE stakeholder_archetype AS ENUM (
  'government', 'foundation', 'corporate', 'individual', 'other'
);

CREATE TYPE stakeholder_activity_type AS ENUM (
  'meeting', 'email', 'call', 'follow_up', 'note'
);

-- ─── Extend stakeholders table ───────────────────────────────────────────────
ALTER TABLE stakeholders
  ADD COLUMN archetype     stakeholder_archetype NOT NULL DEFAULT 'individual',
  ADD COLUMN linkedin_url  text;

-- ─── stakeholder_activities: per-stakeholder interaction log ─────────────────
CREATE TABLE stakeholder_activities (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_id uuid NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  activity_type  stakeholder_activity_type NOT NULL,
  notes          text,
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stakeholder_activities_stakeholder_idx
  ON stakeholder_activities(stakeholder_id);

CREATE INDEX stakeholder_activities_occurred_at_idx
  ON stakeholder_activities(occurred_at DESC);

-- ─── RLS for stakeholder_activities ─────────────────────────────────────────
ALTER TABLE stakeholder_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stakeholder_activities: authenticated can read"
  ON stakeholder_activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "stakeholder_activities: team and admin can insert"
  ON stakeholder_activities FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'team_member'));

CREATE POLICY "stakeholder_activities: owner or admin can delete"
  ON stakeholder_activities FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin');
```

- [ ] **Step 1.2: Apply migration in Supabase dashboard**

Open Supabase SQL Editor → paste the migration → Run.
Expected: no errors, `stakeholder_archetype` and `stakeholder_activity_type` appear in Enums, `stakeholder_activities` appears in Tables, `stakeholders` table has `archetype` and `linkedin_url` columns.

- [ ] **Step 1.3: Commit migration file**

```bash
git add supabase/migrations/0004_stakeholders_ext.sql
git commit -m "feat(db): extend stakeholders with archetype + linkedin; add stakeholder_activities table"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `types/database.ts`

- [ ] **Step 2.1: Add new enum types after line 13 (after `EmailMode`)**

Insert after `export type EmailMode = "off" | "digest" | "urgent"`:

```typescript
export type StakeholderArchetype = "government" | "foundation" | "corporate" | "individual" | "other"
export type StakeholderActivityType = "meeting" | "email" | "call" | "follow_up" | "note"
```

- [ ] **Step 2.2: Update `stakeholders` table entry (around line 110)**

Replace the existing `stakeholders` block with:

```typescript
      stakeholders: {
        Row: {
          id: string
          name: string
          title: string | null
          email: string | null
          phone: string | null
          organization: string | null
          notes: string | null
          archetype: StakeholderArchetype
          linkedin_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          title?: string | null
          email?: string | null
          phone?: string | null
          organization?: string | null
          notes?: string | null
          archetype?: StakeholderArchetype
          linkedin_url?: string | null
          created_by?: string | null
        }
        Update: {
          name?: string
          title?: string | null
          email?: string | null
          phone?: string | null
          organization?: string | null
          notes?: string | null
          archetype?: StakeholderArchetype
          linkedin_url?: string | null
        }
      }
```

- [ ] **Step 2.3: Add `stakeholder_activities` table after `grant_stakeholders` block**

After the closing brace of `grant_stakeholders`, add:

```typescript
      stakeholder_activities: {
        Row: {
          id: string
          stakeholder_id: string
          user_id: string
          activity_type: StakeholderActivityType
          notes: string | null
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          stakeholder_id: string
          user_id: string
          activity_type: StakeholderActivityType
          notes?: string | null
          occurred_at?: string
        }
        Update: {
          notes?: string | null
          occurred_at?: string
        }
      }
```

- [ ] **Step 2.4: Add new enums to the `Enums` block (near line 439)**

In the `Enums` object, add:

```typescript
      stakeholder_archetype: StakeholderArchetype
      stakeholder_activity_type: StakeholderActivityType
```

- [ ] **Step 2.5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.6: Commit**

```bash
git add types/database.ts
git commit -m "feat(types): add StakeholderArchetype, StakeholderActivityType, stakeholder_activities"
```

---

## Task 3: Zod Validators (test-first)

**Files:**
- Create: `lib/validators/stakeholders.ts`
- Create: `__tests__/validators/stakeholders.test.ts`

- [ ] **Step 3.1: Write failing tests**

```typescript
// __tests__/validators/stakeholders.test.ts
import {
  stakeholderSchema,
  activitySchema,
  type StakeholderFormValues,
  type ActivityFormValues,
} from '@/lib/validators/stakeholders'

describe('stakeholderSchema', () => {
  it('accepts a valid full stakeholder', () => {
    const input: StakeholderFormValues = {
      name: 'Jane Smith',
      title: 'Program Director',
      email: 'jane@foundation.org',
      phone: '+1 555 0123',
      organization: 'Smith Foundation',
      archetype: 'foundation',
      linkedin_url: 'https://linkedin.com/in/janesmith',
      notes: 'Met at conference',
    }
    expect(() => stakeholderSchema.parse(input)).not.toThrow()
  })

  it('accepts a minimal stakeholder (name only)', () => {
    expect(() =>
      stakeholderSchema.parse({ name: 'Bob', archetype: 'individual' })
    ).not.toThrow()
  })

  it('rejects when name is empty', () => {
    const result = stakeholderSchema.safeParse({ name: '', archetype: 'individual' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('rejects an invalid email', () => {
    const result = stakeholderSchema.safeParse({
      name: 'Test',
      archetype: 'corporate',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  it('accepts an empty string email (optional field)', () => {
    expect(() =>
      stakeholderSchema.parse({ name: 'Test', archetype: 'government', email: '' })
    ).not.toThrow()
  })

  it('rejects an invalid linkedin_url', () => {
    const result = stakeholderSchema.safeParse({
      name: 'Test',
      archetype: 'individual',
      linkedin_url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('accepts an empty string linkedin_url', () => {
    expect(() =>
      stakeholderSchema.parse({ name: 'Test', archetype: 'foundation', linkedin_url: '' })
    ).not.toThrow()
  })

  it('rejects an invalid archetype', () => {
    const result = stakeholderSchema.safeParse({ name: 'Test', archetype: 'alien' })
    expect(result.success).toBe(false)
  })
})

describe('activitySchema', () => {
  it('accepts a valid activity', () => {
    const input: ActivityFormValues = {
      activity_type: 'meeting',
      notes: 'Discussed Q3 grant cycle',
      occurred_at: '2026-05-23T10:00:00Z',
    }
    expect(() => activitySchema.parse(input)).not.toThrow()
  })

  it('rejects when notes is empty', () => {
    const result = activitySchema.safeParse({ activity_type: 'call', notes: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('notes')
    }
  })

  it('rejects an invalid activity_type', () => {
    const result = activitySchema.safeParse({ activity_type: 'text', notes: 'hi' })
    expect(result.success).toBe(false)
  })

  it('defaults occurred_at to a valid ISO string when omitted', () => {
    const result = activitySchema.safeParse({ activity_type: 'email', notes: 'Sent intro' })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 3.2: Run tests to verify they fail**

```bash
npm test -- __tests__/validators/stakeholders.test.ts
```

Expected: `Cannot find module '@/lib/validators/stakeholders'`.

- [ ] **Step 3.3: Implement the validators**

```typescript
// lib/validators/stakeholders.ts
import { z } from 'zod'

export const STAKEHOLDER_ARCHETYPES = [
  'government', 'foundation', 'corporate', 'individual', 'other',
] as const

export const ACTIVITY_TYPES = [
  'meeting', 'email', 'call', 'follow_up', 'note',
] as const

export const stakeholderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  title: z.string().max(100).optional(),
  email: z
    .string()
    .refine((v) => v === '' || z.string().email().safeParse(v).success, {
      message: 'Must be a valid email address',
      path: ['email'],
    })
    .optional(),
  phone: z.string().max(30).optional(),
  organization: z.string().max(150).optional(),
  archetype: z.enum(STAKEHOLDER_ARCHETYPES),
  linkedin_url: z
    .string()
    .refine((v) => v === '' || z.string().url().safeParse(v).success, {
      message: 'Must be a valid URL',
      path: ['linkedin_url'],
    })
    .optional(),
  notes: z.string().optional(),
})

export const activitySchema = z.object({
  activity_type: z.enum(ACTIVITY_TYPES),
  notes: z.string().min(1, 'Notes are required'),
  occurred_at: z.string().optional(),
})

export type StakeholderFormValues = z.infer<typeof stakeholderSchema>
export type ActivityFormValues = z.infer<typeof activitySchema>
```

- [ ] **Step 3.4: Run tests to verify they pass**

```bash
npm test -- __tests__/validators/stakeholders.test.ts
```

Expected: all 11 tests pass.

- [ ] **Step 3.5: Commit**

```bash
git add lib/validators/stakeholders.ts __tests__/validators/stakeholders.test.ts
git commit -m "feat(validators): add stakeholder + activity Zod schemas with tests"
```

---

## Task 4: Server Actions

**Files:**
- Create: `lib/actions/stakeholders.ts`

- [ ] **Step 4.1: Write lib/actions/stakeholders.ts**

```typescript
// lib/actions/stakeholders.ts
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { stakeholderSchema, activitySchema } from "@/lib/validators/stakeholders"
import type { UserRole } from "@/types/database"

type ProfileRoleRow = { role: UserRole }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

async function requireRole(...roles: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: ProfileRoleRow | null }
  if (!profile || !roles.includes(profile.role)) {
    throw new Error("Insufficient permissions")
  }
  return { user, profile }
}

export async function createStakeholder(formData: FormData) {
  const { user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const raw = {
    name: formData.get("name") as string,
    title: (formData.get("title") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    organization: (formData.get("organization") as string) || undefined,
    archetype: formData.get("archetype") as string,
    linkedin_url: (formData.get("linkedin_url") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  }

  const parsed = stakeholderSchema.safeParse(raw)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { data: stakeholder, error } = await (service.from("stakeholders") as AnyTable)
    .insert({ ...parsed.data, created_by: user.id })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/stakeholders")
  redirect(`/stakeholders/${(stakeholder as { id: string }).id}`)
}

export async function updateStakeholder(stakeholderId: string, formData: FormData) {
  await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const raw = {
    name: formData.get("name") as string,
    title: (formData.get("title") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    organization: (formData.get("organization") as string) || undefined,
    archetype: formData.get("archetype") as string,
    linkedin_url: (formData.get("linkedin_url") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  }

  const parsed = stakeholderSchema.safeParse(raw)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { error } = await (service.from("stakeholders") as AnyTable)
    .update(parsed.data)
    .eq("id", stakeholderId)

  if (error) throw new Error(error.message)

  revalidatePath("/stakeholders")
  revalidatePath(`/stakeholders/${stakeholderId}`)
  redirect(`/stakeholders/${stakeholderId}`)
}

export async function deleteStakeholder(stakeholderId: string) {
  await requireRole("admin")
  const service = await createServiceClient()

  const { error } = await (service.from("stakeholders") as AnyTable)
    .delete()
    .eq("id", stakeholderId)

  if (error) throw new Error(error.message)

  revalidatePath("/stakeholders")
  redirect("/stakeholders")
}

export async function addStakeholderActivity(stakeholderId: string, formData: FormData) {
  const { user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const raw = {
    activity_type: formData.get("activity_type") as string,
    notes: formData.get("notes") as string,
    occurred_at: (formData.get("occurred_at") as string) || undefined,
  }

  const parsed = activitySchema.safeParse(raw)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { error } = await (service.from("stakeholder_activities") as AnyTable).insert({
    stakeholder_id: stakeholderId,
    user_id: user.id,
    activity_type: parsed.data.activity_type,
    notes: parsed.data.notes,
    occurred_at: parsed.data.occurred_at ?? new Date().toISOString(),
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/stakeholders/${stakeholderId}`)
}

export async function deleteStakeholderActivity(activityId: string, stakeholderId: string) {
  await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const { error } = await (service.from("stakeholder_activities") as AnyTable)
    .delete()
    .eq("id", activityId)

  if (error) throw new Error(error.message)

  revalidatePath(`/stakeholders/${stakeholderId}`)
}
```

- [ ] **Step 4.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.3: Commit**

```bash
git add lib/actions/stakeholders.ts
git commit -m "feat(actions): add stakeholder + activity CRUD server actions"
```

---

## Task 5: ArchetypeBadge Component (test-first)

**Files:**
- Create: `components/stakeholders/archetype-badge.tsx`
- Create: `__tests__/components/archetype-badge.test.tsx`

- [ ] **Step 5.1: Write failing test**

```typescript
// __tests__/components/archetype-badge.test.tsx
import { render, screen } from '@testing-library/react'
import { ArchetypeBadge } from '@/components/stakeholders/archetype-badge'

describe('ArchetypeBadge', () => {
  it('renders the label for government', () => {
    render(<ArchetypeBadge archetype="government" />)
    expect(screen.getByText('Government')).toBeInTheDocument()
  })

  it('renders the label for foundation', () => {
    render(<ArchetypeBadge archetype="foundation" />)
    expect(screen.getByText('Foundation')).toBeInTheDocument()
  })

  it('renders the label for corporate', () => {
    render(<ArchetypeBadge archetype="corporate" />)
    expect(screen.getByText('Corporate')).toBeInTheDocument()
  })

  it('renders the label for individual', () => {
    render(<ArchetypeBadge archetype="individual" />)
    expect(screen.getByText('Individual')).toBeInTheDocument()
  })

  it('renders the label for other', () => {
    render(<ArchetypeBadge archetype="other" />)
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('applies sm size class when size="sm"', () => {
    const { container } = render(<ArchetypeBadge archetype="foundation" size="sm" />)
    expect(container.firstChild).toHaveClass('text-xs')
  })
})
```

- [ ] **Step 5.2: Run test to verify it fails**

```bash
npm test -- __tests__/components/archetype-badge.test.tsx
```

Expected: `Cannot find module '@/components/stakeholders/archetype-badge'`.

- [ ] **Step 5.3: Implement the component**

```typescript
// components/stakeholders/archetype-badge.tsx
import { cn } from "@/lib/utils"
import type { StakeholderArchetype } from "@/types/database"

const CONFIG: Record<StakeholderArchetype, { label: string; className: string }> = {
  government:  { label: "Government",  className: "bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300"   },
  foundation:  { label: "Foundation",  className: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
  corporate:   { label: "Corporate",   className: "bg-amber-100  text-amber-800  dark:bg-amber-900/40  dark:text-amber-300"  },
  individual:  { label: "Individual",  className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  other:       { label: "Other",       className: "bg-slate-100  text-slate-700  dark:bg-slate-800      dark:text-slate-400"  },
}

interface ArchetypeBadgeProps {
  archetype: StakeholderArchetype
  size?: "sm" | "md"
  className?: string
}

export function ArchetypeBadge({ archetype, size = "md", className }: ArchetypeBadgeProps) {
  const { label, className: colorClass } = CONFIG[archetype]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
```

- [ ] **Step 5.4: Run test to verify it passes**

```bash
npm test -- __tests__/components/archetype-badge.test.tsx
```

Expected: all 6 tests pass.

- [ ] **Step 5.5: Commit**

```bash
git add components/stakeholders/archetype-badge.tsx __tests__/components/archetype-badge.test.tsx
git commit -m "feat(components): add ArchetypeBadge with tests"
```

---

## Task 6: StakeholderCard Component (test-first)

**Files:**
- Create: `components/stakeholders/stakeholder-card.tsx`
- Create: `__tests__/components/stakeholder-card.test.tsx`

- [ ] **Step 6.1: Write failing test**

```typescript
// __tests__/components/stakeholder-card.test.tsx
import { render, screen } from '@testing-library/react'
import { StakeholderCard } from '@/components/stakeholders/stakeholder-card'
import type { Database } from '@/types/database'

type StakeholderRow = Database['public']['Tables']['stakeholders']['Row']

const base: StakeholderRow = {
  id: 'abc-123',
  name: 'Jane Smith',
  title: 'Program Director',
  email: 'jane@foundation.org',
  phone: '+1 555 0123',
  organization: 'Smith Foundation',
  notes: null,
  archetype: 'foundation',
  linkedin_url: null,
  created_by: null,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
}

describe('StakeholderCard', () => {
  it('renders the stakeholder name', () => {
    render(<StakeholderCard stakeholder={base} href="/stakeholders/abc-123" />)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('renders the organization', () => {
    render(<StakeholderCard stakeholder={base} href="/stakeholders/abc-123" />)
    expect(screen.getByText('Smith Foundation')).toBeInTheDocument()
  })

  it('renders the archetype badge', () => {
    render(<StakeholderCard stakeholder={base} href="/stakeholders/abc-123" />)
    expect(screen.getByText('Foundation')).toBeInTheDocument()
  })

  it('renders the email when present', () => {
    render(<StakeholderCard stakeholder={base} href="/stakeholders/abc-123" />)
    expect(screen.getByText('jane@foundation.org')).toBeInTheDocument()
  })

  it('does not render email when null', () => {
    render(
      <StakeholderCard
        stakeholder={{ ...base, email: null }}
        href="/stakeholders/abc-123"
      />
    )
    expect(screen.queryByText('jane@foundation.org')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6.2: Run test to verify it fails**

```bash
npm test -- __tests__/components/stakeholder-card.test.tsx
```

Expected: module not found error.

- [ ] **Step 6.3: Implement the component**

```typescript
// components/stakeholders/stakeholder-card.tsx
import Link from "next/link"
import { Mail, Phone, Building2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ArchetypeBadge } from "./archetype-badge"
import type { Database } from "@/types/database"

type StakeholderRow = Database["public"]["Tables"]["stakeholders"]["Row"]

interface StakeholderCardProps {
  stakeholder: StakeholderRow
  href: string
}

export function StakeholderCard({ stakeholder, href }: StakeholderCardProps) {
  const { name, title, organization, email, phone, archetype } = stakeholder

  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <Link href={href}>
      <Card className="p-5 hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 cursor-pointer group">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {name}
              </h3>
              <ArchetypeBadge archetype={archetype} size="sm" />
            </div>

            {title && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{title}</p>
            )}

            <div className="mt-2 space-y-1">
              {organization && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3 shrink-0" />
                  <span className="truncate">{organization}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="size-3 shrink-0" />
                  <span className="truncate">{phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 6.4: Run test to verify it passes**

```bash
npm test -- __tests__/components/stakeholder-card.test.tsx
```

Expected: all 5 tests pass.

- [ ] **Step 6.5: Commit**

```bash
git add components/stakeholders/stakeholder-card.tsx __tests__/components/stakeholder-card.test.tsx
git commit -m "feat(components): add StakeholderCard with tests"
```

---

## Task 7: StakeholderForm Component

**Files:**
- Create: `components/stakeholders/stakeholder-form.tsx`

- [ ] **Step 7.1: Implement the form**

```typescript
// components/stakeholders/stakeholder-form.tsx
"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  stakeholderSchema,
  STAKEHOLDER_ARCHETYPES,
  type StakeholderFormValues,
} from "@/lib/validators/stakeholders"

const ARCHETYPE_LABELS: Record<string, string> = {
  government: "Government",
  foundation: "Foundation",
  corporate: "Corporate",
  individual: "Individual",
  other: "Other",
}

interface StakeholderFormProps {
  defaultValues?: Partial<StakeholderFormValues>
  action: (formData: FormData) => Promise<void>
  submitLabel?: string
}

export function StakeholderForm({
  defaultValues,
  action,
  submitLabel = "Save Stakeholder",
}: StakeholderFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<StakeholderFormValues>({
    resolver: zodResolver(stakeholderSchema),
    defaultValues: {
      name: "",
      title: "",
      email: "",
      phone: "",
      organization: "",
      archetype: "individual",
      linkedin_url: "",
      notes: "",
      ...defaultValues,
    },
  })

  function onSubmit(values: StakeholderFormValues) {
    const fd = new FormData()
    Object.entries(values).forEach(([k, v]) => {
      if (v != null) fd.set(k, v as string)
    })
    startTransition(() => action(fd))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Jane Smith" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="archetype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Archetype <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STAKEHOLDER_ARCHETYPES.map((a) => (
                      <SelectItem key={a} value={a}>{ARCHETYPE_LABELS[a]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl><Input placeholder="Program Director" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="organization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization</FormLabel>
                <FormControl><Input placeholder="Smith Foundation" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="jane@example.org" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input type="tel" placeholder="+1 555 0123" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="linkedin_url"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>LinkedIn URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://linkedin.com/in/username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Background, relationship context, preferences..."
                  className="min-h-[100px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

- [ ] **Step 7.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7.3: Commit**

```bash
git add components/stakeholders/stakeholder-form.tsx
git commit -m "feat(components): add StakeholderForm (React Hook Form + Zod)"
```

---

## Task 8: StakeholderActivityForm + StakeholderActivityList

**Files:**
- Create: `components/stakeholders/stakeholder-activity-form.tsx`
- Create: `components/stakeholders/stakeholder-activity-list.tsx`

- [ ] **Step 8.1: Implement StakeholderActivityForm**

```typescript
// components/stakeholders/stakeholder-activity-form.tsx
"use client"

import { useTransition, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { activitySchema, ACTIVITY_TYPES, type ActivityFormValues } from "@/lib/validators/stakeholders"

const ACTIVITY_LABELS: Record<string, string> = {
  meeting: "Meeting",
  email: "Email",
  call: "Phone Call",
  follow_up: "Follow-up",
  note: "Note",
}

interface StakeholderActivityFormProps {
  onAdd: (formData: FormData) => Promise<void>
}

export function StakeholderActivityForm({ onAdd }: StakeholderActivityFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activity_type: "meeting",
      notes: "",
      occurred_at: new Date().toISOString().slice(0, 16),
    },
  })

  function onSubmit(values: ActivityFormValues) {
    const fd = new FormData()
    fd.set("activity_type", values.activity_type)
    fd.set("notes", values.notes)
    if (values.occurred_at) fd.set("occurred_at", new Date(values.occurred_at).toISOString())

    startTransition(async () => {
      await onAdd(fd)
      form.reset()
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 size-3.5" /> Log Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{ACTIVITY_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="occurred_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What was discussed or accomplished..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 8.2: Implement StakeholderActivityList**

```typescript
// components/stakeholders/stakeholder-activity-list.tsx
"use client"

import { useTransition } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { Trash2, Phone, Mail, MessageSquare, CalendarDays, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StakeholderActivityForm } from "./stakeholder-activity-form"
import type { Database } from "@/types/database"

type ActivityRow = Database["public"]["Tables"]["stakeholder_activities"]["Row"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

type ActivityWithProfile = ActivityRow & { profile: Pick<ProfileRow, "full_name"> | null }

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  meeting: CalendarDays,
  email: Mail,
  call: Phone,
  follow_up: MessageSquare,
  note: FileText,
}

const ACTIVITY_LABELS: Record<string, string> = {
  meeting: "Meeting",
  email: "Email",
  call: "Phone Call",
  follow_up: "Follow-up",
  note: "Note",
}

interface StakeholderActivityListProps {
  activities: ActivityWithProfile[]
  onAdd: (formData: FormData) => Promise<void>
  onDelete: (activityId: string) => Promise<void>
  currentUserId: string
  isAdmin: boolean
}

export function StakeholderActivityList({
  activities,
  onAdd,
  onDelete,
  currentUserId,
  isAdmin,
}: StakeholderActivityListProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
        <StakeholderActivityForm onAdd={onAdd} />
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No activities logged yet. Log a meeting, call, or email to get started.
        </p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <ul className="space-y-4">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.activity_type] ?? FileText
              const canDelete = activity.user_id === currentUserId || isAdmin

              return (
                <li key={activity.id} className="flex gap-4 pl-0">
                  {/* Icon bubble */}
                  <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-card border border-border shadow-sm">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-foreground">
                          {ACTIVITY_LABELS[activity.activity_type]}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1.5">
                          by {activity.profile?.full_name ?? "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-[11px] text-muted-foreground"
                          title={format(new Date(activity.occurred_at), "PPpp")}
                        >
                          {formatDistanceToNow(new Date(activity.occurred_at), { addSuffix: true })}
                        </span>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 text-muted-foreground/40 hover:text-destructive"
                            onClick={() =>
                              startTransition(() => onDelete(activity.id))
                            }
                            disabled={isPending}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {activity.notes && (
                      <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8.3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8.4: Commit**

```bash
git add components/stakeholders/stakeholder-activity-form.tsx components/stakeholders/stakeholder-activity-list.tsx
git commit -m "feat(components): add StakeholderActivityForm and StakeholderActivityList"
```

---

## Task 9: Stakeholders List Page

**Files:**
- Create: `app/(dashboard)/stakeholders/page.tsx`

- [ ] **Step 9.1: Implement the page**

```typescript
// app/(dashboard)/stakeholders/page.tsx
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StakeholderCard } from "@/components/stakeholders/stakeholder-card"
import type { Database, StakeholderArchetype } from "@/types/database"

type StakeholderRow = Database["public"]["Tables"]["stakeholders"]["Row"]

const ARCHETYPES: { value: StakeholderArchetype | "all"; label: string }[] = [
  { value: "all",         label: "All Types"   },
  { value: "government",  label: "Government"  },
  { value: "foundation",  label: "Foundation"  },
  { value: "corporate",   label: "Corporate"   },
  { value: "individual",  label: "Individual"  },
  { value: "other",       label: "Other"       },
]

interface SearchParams {
  q?: string
  archetype?: string
}

export default async function StakeholdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { q, archetype } = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("stakeholders") as any)
    .select("*")
    .order("name", { ascending: true })

  if (archetype && archetype !== "all") {
    query = query.eq("archetype", archetype)
  }

  const { data: stakeholders } = await query as { data: StakeholderRow[] | null }

  const filtered = (stakeholders ?? []).filter((s) => {
    if (!q) return true
    const term = q.toLowerCase()
    return (
      s.name.toLowerCase().includes(term) ||
      (s.organization ?? "").toLowerCase().includes(term) ||
      (s.email ?? "").toLowerCase().includes(term)
    )
  })

  return (
    <div className="p-6 pb-tab-bar space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stakeholders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/stakeholders/new">
            <Plus className="mr-1.5 size-4" /> Add Stakeholder
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by name, org, or email..."
            className="pl-9"
          />
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {ARCHETYPES.map(({ value, label }) => (
            <Link
              key={value}
              href={`/stakeholders${value === "all" ? "" : `?archetype=${value}`}${q ? `${value === "all" ? "?" : "&"}q=${q}` : ""}`}
            >
              <Button
                variant={(!archetype && value === "all") || archetype === value ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
              >
                {label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No stakeholders found</p>
          <p className="text-sm mt-1">
            {q || archetype ? "Try a different search or filter." : "Add your first stakeholder to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <div key={s.id} className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}>
              <StakeholderCard stakeholder={s} href={`/stakeholders/${s.id}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 9.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9.3: Commit**

```bash
git add app/(dashboard)/stakeholders/page.tsx
git commit -m "feat(pages): add stakeholders list page with search + archetype filter"
```

---

## Task 10: New Stakeholder Page

**Files:**
- Create: `app/(dashboard)/stakeholders/new/page.tsx`

- [ ] **Step 10.1: Implement the page**

```typescript
// app/(dashboard)/stakeholders/new/page.tsx
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StakeholderForm } from "@/components/stakeholders/stakeholder-form"
import { createStakeholder } from "@/lib/actions/stakeholders"

export default async function NewStakeholderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="p-6 pb-tab-bar max-w-2xl mx-auto space-y-6 animate-fade-up">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground">
          <Link href="/stakeholders">
            <ChevronLeft className="mr-1 size-4" /> Back to Stakeholders
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add Stakeholder</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add a new funder or contact to your stakeholder database.
        </p>
      </div>

      <Card className="p-6">
        <StakeholderForm action={createStakeholder} submitLabel="Create Stakeholder" />
      </Card>
    </div>
  )
}
```

- [ ] **Step 10.2: Commit**

```bash
git add app/(dashboard)/stakeholders/new/page.tsx
git commit -m "feat(pages): add new stakeholder creation page"
```

---

## Task 11: Stakeholder Detail Page

**Files:**
- Create: `app/(dashboard)/stakeholders/[id]/page.tsx`

- [ ] **Step 11.1: Implement the page**

```typescript
// app/(dashboard)/stakeholders/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Edit, Mail, Phone, Globe, Linkedin, Building2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArchetypeBadge } from "@/components/stakeholders/archetype-badge"
import { StakeholderActivityList } from "@/components/stakeholders/stakeholder-activity-list"
import {
  addStakeholderActivity,
  deleteStakeholderActivity,
  deleteStakeholder,
} from "@/lib/actions/stakeholders"
import type { Database } from "@/types/database"

type StakeholderRow = Database["public"]["Tables"]["stakeholders"]["Row"]
type ActivityRow = Database["public"]["Tables"]["stakeholder_activities"]["Row"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type GrantRow = Database["public"]["Tables"]["grants"]["Row"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

export default async function StakeholderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { id } = await params

  // Fetch stakeholder
  const { data: stakeholder } = await (supabase.from("stakeholders") as AnyTable)
    .select("*")
    .eq("id", id)
    .single() as { data: StakeholderRow | null }

  if (!stakeholder) notFound()

  // Fetch user profile for role check
  const { data: profile } = await (supabase.from("profiles") as AnyTable)
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null }

  const isAdmin = profile?.role === "admin"

  // Fetch activities with author profiles
  const { data: activities } = await (supabase.from("stakeholder_activities") as AnyTable)
    .select("*, profile:profiles(full_name)")
    .eq("stakeholder_id", id)
    .order("occurred_at", { ascending: false }) as {
      data: (ActivityRow & { profile: Pick<ProfileRow, "full_name"> | null })[] | null
    }

  // Fetch associated grants via grant_stakeholders
  const { data: grantLinks } = await (supabase.from("grant_stakeholders") as AnyTable)
    .select("grant:grants(id, name, stage, funder)")
    .eq("stakeholder_id", id) as {
      data: { grant: Pick<GrantRow, "id" | "name" | "stage" | "funder"> }[] | null
    }

  const grants = (grantLinks ?? []).map((l) => l.grant).filter(Boolean)

  const addActivity = addStakeholderActivity.bind(null, id)
  const handleDelete = deleteStakeholder.bind(null, id)

  return (
    <div className="p-6 pb-tab-bar max-w-4xl mx-auto space-y-6 animate-fade-up">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href="/stakeholders">
            <ChevronLeft className="mr-1 size-4" /> Stakeholders
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <form action={handleDelete}>
              <Button variant="ghost" size="sm" type="submit"
                className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-1.5 size-3.5" /> Delete
              </Button>
            </form>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={`/stakeholders/${id}/edit`}>
              <Edit className="mr-1.5 size-3.5" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-6">
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                {stakeholder.name.trim().split(/\s+/).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-bold">{stakeholder.name}</h1>
                {stakeholder.title && (
                  <p className="text-sm text-muted-foreground">{stakeholder.title}</p>
                )}
                <div className="mt-2">
                  <ArchetypeBadge archetype={stakeholder.archetype} />
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Contact details */}
            <div className="space-y-2.5">
              {stakeholder.organization && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-muted-foreground shrink-0" />
                  <span>{stakeholder.organization}</span>
                </div>
              )}
              {stakeholder.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${stakeholder.email}`} className="hover:text-primary truncate">
                    {stakeholder.email}
                  </a>
                </div>
              )}
              {stakeholder.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${stakeholder.phone}`} className="hover:text-primary">
                    {stakeholder.phone}
                  </a>
                </div>
              )}
              {stakeholder.linkedin_url && (
                <div className="flex items-center gap-2 text-sm">
                  <Linkedin className="size-4 text-muted-foreground shrink-0" />
                  <a
                    href={stakeholder.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary truncate"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>

            {stakeholder.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Notes</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{stakeholder.notes}</p>
                </div>
              </>
            )}
          </Card>

          {/* Associated grants */}
          {grants.length > 0 && (
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Associated Grants ({grants.length})
              </p>
              <ul className="space-y-2">
                {grants.map((g) => (
                  <li key={g.id}>
                    <Link
                      href={`/grants/${g.id}`}
                      className="text-sm font-medium hover:text-primary transition-colors block truncate"
                    >
                      {g.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{g.funder}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Right: Activity timeline */}
        <Card className="lg:col-span-2 p-6">
          <StakeholderActivityList
            activities={activities ?? []}
            onAdd={addActivity}
            onDelete={async (activityId) => {
              "use server"
              await deleteStakeholderActivity(activityId, id)
            }}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 11.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 11.3: Commit**

```bash
git add "app/(dashboard)/stakeholders/[id]/page.tsx"
git commit -m "feat(pages): add stakeholder detail page with activity timeline"
```

---

## Task 12: Edit Stakeholder Page

**Files:**
- Create: `app/(dashboard)/stakeholders/[id]/edit/page.tsx`

- [ ] **Step 12.1: Implement the page**

```typescript
// app/(dashboard)/stakeholders/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StakeholderForm } from "@/components/stakeholders/stakeholder-form"
import { updateStakeholder } from "@/lib/actions/stakeholders"
import type { Database } from "@/types/database"

type StakeholderRow = Database["public"]["Tables"]["stakeholders"]["Row"]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

export default async function EditStakeholderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { id } = await params

  const { data: stakeholder } = await (supabase.from("stakeholders") as AnyTable)
    .select("*")
    .eq("id", id)
    .single() as { data: StakeholderRow | null }

  if (!stakeholder) notFound()

  const updateWithId = updateStakeholder.bind(null, id)

  return (
    <div className="p-6 pb-tab-bar max-w-2xl mx-auto space-y-6 animate-fade-up">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground">
          <Link href={`/stakeholders/${id}`}>
            <ChevronLeft className="mr-1 size-4" /> Back to Profile
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Stakeholder</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{stakeholder.name}</p>
      </div>

      <Card className="p-6">
        <StakeholderForm
          action={updateWithId}
          defaultValues={{
            name: stakeholder.name,
            title: stakeholder.title ?? "",
            email: stakeholder.email ?? "",
            phone: stakeholder.phone ?? "",
            organization: stakeholder.organization ?? "",
            archetype: stakeholder.archetype,
            linkedin_url: stakeholder.linkedin_url ?? "",
            notes: stakeholder.notes ?? "",
          }}
          submitLabel="Save Changes"
        />
      </Card>
    </div>
  )
}
```

- [ ] **Step 12.2: Commit**

```bash
git add "app/(dashboard)/stakeholders/[id]/edit/page.tsx"
git commit -m "feat(pages): add edit stakeholder page"
```

---

## Task 13: Update Navigation

**Files:**
- Modify: `components/layout/sidebar.tsx`
- Modify: `components/layout/mobile-tab-bar.tsx`

- [ ] **Step 13.1: Update sidebar nav array**

In `components/layout/sidebar.tsx`, change the `nav` array (lines 28–34) to:

```typescript
import {
  LayoutDashboard, FileText, Inbox,
  Bell, Settings, LogOut, Users2, Activity,
} from "lucide-react"

const nav = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard, badge: false },
  { href: "/grants",        label: "Grants",        icon: FileText,         badge: false },
  { href: "/stakeholders",  label: "Stakeholders",  icon: Users2,           badge: false },
  { href: "/activity",      label: "Team Activity", icon: Activity,         badge: false },
  { href: "/opportunities", label: "Opportunities", icon: Inbox,            badge: false },
  { href: "/notifications", label: "Notifications", icon: Bell,             badge: true  },
  { href: "/settings",      label: "Settings",      icon: Settings,         badge: false },
]
```

- [ ] **Step 13.2: Update mobile tab bar**

In `components/layout/mobile-tab-bar.tsx`, replace the `TABS` array with:

```typescript
import { LayoutDashboard, FileText, Users2, Bell, MoreHorizontal } from "lucide-react"

const TABS = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Home"        },
  { href: "/grants",       icon: FileText,         label: "Grants"      },
  { href: "/stakeholders", icon: Users2,           label: "Contacts"    },
  { href: "/notifications",icon: Bell,             label: "Alerts"      },
  { href: "/settings",     icon: MoreHorizontal,   label: "More"        },
] as const
```

- [ ] **Step 13.3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 13.4: Commit**

```bash
git add components/layout/sidebar.tsx components/layout/mobile-tab-bar.tsx
git commit -m "feat(nav): add Stakeholders and Team Activity links to sidebar + mobile tab bar"
```

---

## Task 14: Smoke Test in Browser

- [ ] **Step 14.1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 14.2: Verify these routes render without errors**
  - `/stakeholders` — grid/list appears (empty state or cards)
  - `/stakeholders/new` — form renders with all fields
  - `/stakeholders/[id]` — requires a created stakeholder
  - `/stakeholders/[id]/edit` — pre-filled form

- [ ] **Step 14.3: Create a stakeholder end-to-end**
  1. Go to `/stakeholders/new`
  2. Fill in: Name = "Test Funder", Archetype = "Foundation", Email = "test@fund.org"
  3. Submit → verify redirect to detail page
  4. Log an activity → verify it appears in the timeline
  5. Edit stakeholder → change organization → save → verify update

- [ ] **Step 14.4: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 14.5: Final commit**

```bash
git add .
git commit -m "feat: complete Stakeholder Management feature (CRUD + activity log + navigation)"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** name/role/email/phone/LinkedIn/notes ✓ | archetype categories ✓ | activity log (meetings, emails, calls, follow-ups) ✓ | add/edit/delete ✓
- [x] **Placeholder scan:** no TBDs or TODOs — all code is complete
- [x] **Type consistency:** `StakeholderArchetype` used in validator, types, badge, card, form consistently | `ActivityFormValues` used in activity form and action consistently
- [x] **No 21st.dev MCP available** — components built from scratch with shadcn/ui primitives
