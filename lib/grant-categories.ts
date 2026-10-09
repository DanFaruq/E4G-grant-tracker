import type { GrantStage } from "@/types/database"

export const UNCATEGORIZED = "Uncategorized"

export type CategorizableGrant = {
  id: string
  stage: GrantStage
  category: string | null
  deadline: string | null
  amount_min: number | null
  amount_max: number | null
  amount_exact: number | null
}

export type CategoryGroup<T extends CategorizableGrant> = {
  name: string
  grants: T[]
  total: number
  nextDeadline: string | null
}

export type GrantKpis = {
  pipelineValue: number
  activeCount: number
  dueSoonCount: number
  awardedValue: number
}

const CLOSED_STAGES: GrantStage[] = ["awarded", "rejected"]

export function categoryLabel(category: string | null | undefined): string {
  const trimmed = category?.trim()
  return trimmed ? trimmed : UNCATEGORIZED
}

/** Best single amount for a grant: exact, else top of range, else bottom. */
export function grantAmount(g: Pick<CategorizableGrant, "amount_exact" | "amount_max" | "amount_min">): number {
  return g.amount_exact ?? g.amount_max ?? g.amount_min ?? 0
}

function isUpcoming(deadline: string | null, now: number): boolean {
  return !!deadline && new Date(deadline).getTime() >= now - 24 * 60 * 60 * 1000
}

/**
 * Group grants by category. Matching is case-insensitive so "Health" and
 * "health" share a group; the first spelling seen is used as the label.
 * Largest groups first, "Uncategorized" always last.
 */
export function groupGrantsByCategory<T extends CategorizableGrant>(
  grants: T[],
  now: number = Date.now()
): CategoryGroup<T>[] {
  const map = new Map<string, CategoryGroup<T>>()

  for (const grant of grants) {
    const name = categoryLabel(grant.category)
    const key = name.toLowerCase()
    let group = map.get(key)
    if (!group) {
      group = { name, grants: [], total: 0, nextDeadline: null }
      map.set(key, group)
    }
    group.grants.push(grant)
    group.total += grantAmount(grant)
    if (
      !CLOSED_STAGES.includes(grant.stage) &&
      isUpcoming(grant.deadline, now) &&
      (!group.nextDeadline || new Date(grant.deadline!) < new Date(group.nextDeadline))
    ) {
      group.nextDeadline = grant.deadline
    }
  }

  return [...map.values()].sort((a, b) => {
    const aU = a.name === UNCATEGORIZED
    const bU = b.name === UNCATEGORIZED
    if (aU !== bU) return aU ? 1 : -1
    return b.grants.length - a.grants.length || a.name.localeCompare(b.name)
  })
}

/** Distinct, trimmed category names (case-insensitive), alphabetised, for form suggestions. */
export function distinctCategories(rows: { category: string | null }[]): string[] {
  const seen = new Map<string, string>()
  for (const { category } of rows) {
    const name = category?.trim()
    if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name)
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b))
}

export function computeGrantKpis(grants: CategorizableGrant[], now: number = Date.now()): GrantKpis {
  const horizon = now + 30 * 24 * 60 * 60 * 1000
  const kpis: GrantKpis = { pipelineValue: 0, activeCount: 0, dueSoonCount: 0, awardedValue: 0 }

  for (const g of grants) {
    if (g.stage === "awarded") {
      kpis.awardedValue += grantAmount(g)
    }
    if (CLOSED_STAGES.includes(g.stage)) continue
    kpis.activeCount += 1
    kpis.pipelineValue += grantAmount(g)
    if (isUpcoming(g.deadline, now) && new Date(g.deadline!).getTime() <= horizon) {
      kpis.dueSoonCount += 1
    }
  }
  return kpis
}

const TONES = [
  { chip: "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300", bar: "border-l-blue-500" },
  { chip: "bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300", bar: "border-l-teal-500" },
  { chip: "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300", bar: "border-l-amber-500" },
  { chip: "bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300", bar: "border-l-violet-500" },
  { chip: "bg-orange-50 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300", bar: "border-l-orange-500" },
  { chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300", bar: "border-l-emerald-500" },
] as const

const NEUTRAL_TONE = {
  chip: "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
  bar: "border-l-slate-400",
}

/** Stable colour per category name so it never shifts between renders. */
export function categoryTone(name: string): { chip: string; bar: string } {
  if (name === UNCATEGORIZED) return NEUTRAL_TONE
  let hash = 0
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length]
}

export function categorySlug(name: string): string {
  return "cat-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
