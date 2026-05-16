import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StageBadge, STAGE_LABELS } from "@/components/grants/stage-badge"
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils"
import Link from "next/link"
import { Plus, AlertCircle } from "lucide-react"
import type { GrantStage } from "@/types/database"
import { GrantViewSwitcher } from "@/components/grants/view-switcher"

type GrantListRow = {
  id: string; name: string; funder: string; deadline: string | null; stage: GrantStage
  amount_min: number | null; amount_max: number | null; amount_exact: number | null; category: string | null
  grant_assignees: { user_id: string; profiles: { full_name: string } | null }[]
}

const STAGES: GrantStage[] = ["discovered","researching","applying","submitted","awarded","rejected"]

export default async function GrantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>
}) {
  const { q, stage } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("grants")
    .select(`
      id, name, funder, deadline, stage, amount_min, amount_max, amount_exact, category,
      grant_assignees(user_id, profiles(full_name))
    `)
    .eq("archived", false)
    .order("deadline", { ascending: true, nullsFirst: false })

  if (q) {
    query = query.or(`name.ilike.%${q}%,funder.ilike.%${q}%`)
  }
  if (stage && STAGES.includes(stage as GrantStage)) {
    query = query.eq("stage", stage as GrantStage)
  }

  const result = await query
  const grants = result.data as GrantListRow[] | null

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Grants" />
      <div className="flex-1 p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full">
        <GrantViewSwitcher active="list" />

        {/* Toolbar */}
        <div className="space-y-2">
          {/* Row 1: search + New Grant always on same line */}
          <div className="flex items-center gap-2">
            <form method="GET" className="flex-1 min-w-0 flex gap-2">
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search grants..."
                className="flex-1 min-w-0"
              />
              {stage && <input type="hidden" name="stage" value={stage} />}
            </form>
            <Button asChild size="sm" className="shrink-0 gap-1.5">
              <Link href="/grants/new">
                <Plus className="size-4" />
                <span className="hidden sm:inline">New grant</span>
                <span className="sm:hidden">New</span>
              </Link>
            </Button>
          </div>
          {/* Row 2: stage filter (collapsible feel on mobile) */}
          <form method="GET" className="flex flex-wrap items-center gap-2">
            {q && <input type="hidden" name="q" value={q} />}
            <select
              name="stage"
              defaultValue={stage ?? ""}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary" size="sm">Filter</Button>
            {(q || stage) && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/grants">Clear</Link>
              </Button>
            )}
          </form>
        </div>

        {/* Table */}
        {grants && grants.length > 0 ? (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Grant name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Funder</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stage</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {grants.map((grant) => {
                  const days = daysUntil(grant.deadline)
                  const urgent = days !== null && days <= 7 && days >= 0
                  return (
                    <tr
                      key={grant.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/grants/${grant.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {grant.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{grant.funder}</td>
                      <td className="px-4 py-3">
                        <StageBadge stage={grant.stage} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {grant.amount_exact
                          ? formatCurrency(grant.amount_exact)
                          : grant.amount_min || grant.amount_max
                          ? `${formatCurrency(grant.amount_min)} - ${formatCurrency(grant.amount_max)}`
                          : “-”}
                      </td>
                      <td className="px-4 py-3">
                        {grant.deadline ? (
                          <span className={urgent ? "text-destructive font-medium flex items-center gap-1" : "text-muted-foreground"}>
                            {urgent && <AlertCircle className="size-3" />}
                            {formatDate(grant.deadline)}
                            {days !== null && (
                              <span className="text-xs ml-1">
                                ({days === 0 ? "today" : days > 0 ? `${days}d` : "past"})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className=”text-muted-foreground”>-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <p className="text-muted-foreground mb-4">
              {q || stage ? "No grants match your filters." : "No grants yet."}
            </p>
            <Button asChild size="sm">
              <Link href="/grants/new">
                <Plus className="size-4" />
                Add your first grant
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
