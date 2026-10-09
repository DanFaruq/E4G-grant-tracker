"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, ChevronDown } from "lucide-react"
import { cn, daysUntil, formatCurrency, formatDate } from "@/lib/utils"
import { StageBadge } from "@/components/grants/stage-badge"
import { categorySlug, categoryTone, grantAmount, type CategorizableGrant, type CategoryGroup } from "@/lib/grant-categories"

export type CategoryGrantRow = CategorizableGrant & { name: string; funder: string }

function amountLabel(g: CategoryGrantRow): string {
  if (g.amount_exact) return formatCurrency(g.amount_exact)
  if (g.amount_min || g.amount_max) return `${formatCurrency(g.amount_min)} - ${formatCurrency(g.amount_max)}`
  return "-"
}

function compactCurrency(amount: number): string {
  if (amount <= 0) return "$0"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount)
}

export function GrantsByCategory({
  groups,
  openAll,
}: {
  groups: CategoryGroup<CategoryGrantRow>[]
  /** Open every group initially (used when a search or stage filter is active). */
  openAll: boolean
}) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(groups.filter((_, i) => openAll || i < 2).map((g) => g.name))
  )

  const allOpen = open.size === groups.length

  function toggle(name: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function jumpTo(name: string) {
    setOpen((prev) => new Set(prev).add(name))
    // Wait a frame so the group has expanded before scrolling to it.
    requestAnimationFrame(() => {
      document.getElementById(categorySlug(name))?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {groups.map((group) => {
          const tone = categoryTone(group.name)
          return (
            <button
              key={group.name}
              type="button"
              onClick={() => jumpTo(group.name)}
              className="flex min-h-[72px] items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg text-base font-bold", tone.chip)}>
                {group.grants.length}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{group.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {compactCurrency(group.total)}
                  {group.nextDeadline ? ` · next ${formatDate(group.nextDeadline)}` : ""}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {groups.length} {groups.length === 1 ? "category" : "categories"}
        </p>
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(groups.map((g) => g.name)))}
          className="min-h-[44px] px-2 text-sm font-medium text-primary hover:underline"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const tone = categoryTone(group.name)
          const isOpen = open.has(group.name)
          const panelId = `${categorySlug(group.name)}-panel`
          return (
            <section
              key={group.name}
              id={categorySlug(group.name)}
              className={cn("scroll-mt-20 overflow-hidden rounded-xl border border-l-4 bg-card shadow-sm", tone.bar)}
            >
              <h2>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(group.name)}
                  className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
                >
                  <span className="flex-1 min-w-0">
                    <span className="text-sm font-bold">{group.name}</span>
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {group.grants.length} · {compactCurrency(group.total)}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>
              </h2>

              {isOpen && (
                <ul id={panelId} className="divide-y border-t">
                  {group.grants.map((grant) => {
                    const days = daysUntil(grant.deadline)
                    const urgent = days !== null && days <= 7 && days >= 0
                    return (
                      <li key={grant.id}>
                        <Link
                          href={`/grants/${grant.id}`}
                          className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 hover:bg-muted/30"
                        >
                          <span className="min-w-0 flex-1 basis-48">
                            <span className="block truncate text-sm font-medium text-primary">{grant.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{grant.funder}</span>
                          </span>
                          <StageBadge stage={grant.stage} />
                          <span className="text-xs text-muted-foreground sm:w-32 sm:text-right">
                            {grantAmount(grant) > 0 ? amountLabel(grant) : "-"}
                          </span>
                          <span
                            className={cn(
                              "flex items-center gap-1 text-xs sm:w-28 sm:justify-end",
                              urgent ? "font-medium text-destructive" : "text-muted-foreground"
                            )}
                          >
                            {urgent && <AlertCircle className="size-3" />}
                            {grant.deadline ? formatDate(grant.deadline) : "No deadline"}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
