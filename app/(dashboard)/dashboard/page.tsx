import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { StageBadge } from "@/components/grants/stage-badge"
import { Button } from "@/components/ui/button"
import { formatDate, daysUntil } from "@/lib/utils"
import Link from "next/link"
import { AlertCircle, Plus, Inbox, Trophy, TrendingUp } from "lucide-react"
import type { GrantStage } from "@/types/database"

type GrantRow = { id: string; name: string; funder: string; stage: GrantStage; deadline: string | null }
type ProfileRow = { full_name: string }

const STAGE_ORDER: GrantStage[] = ["discovered","researching","applying","submitted","awarded","rejected"]

const ACTIVE_STAGES: GrantStage[] = ["discovered","researching","applying","submitted"]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [grantsResult, profileResult, { count: pendingOpps }] = await Promise.all([
    supabase
      .from("grants")
      .select("id, name, funder, stage, deadline")
      .eq("archived", false)
      .order("deadline", { ascending: true, nullsFirst: false }),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user?.id ?? "")
      .single(),
    supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
  ])

  const grants = grantsResult.data as GrantRow[] | null
  const profile = profileResult.data as ProfileRow | null

  const stageCounts = STAGE_ORDER.reduce<Record<GrantStage, number>>(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<GrantStage, number>
  )
  grants?.forEach((g) => { stageCounts[g.stage] = (stageCounts[g.stage] ?? 0) + 1 })

  const activeTotal = ACTIVE_STAGES.reduce((sum, s) => sum + stageCounts[s], 0)
  const totalGrants = grants?.length ?? 0

  const upcoming = (grants ?? []).filter((g) => {
    if (g.stage === "awarded" || g.stage === "rejected") return false
    const d = daysUntil(g.deadline)
    return d !== null && d >= 0 && d <= 30
  })

  const hasGrants = totalGrants > 0

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <div className="flex-1 p-6 space-y-7 animate-fade-up max-w-5xl">

        {/* Welcome + quick actions */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {hasGrants
                ? `${activeTotal} active grant${activeTotal !== 1 ? "s" : ""} in your pipeline.`
                : "Your grant pipeline is empty. Add your first grant to get started."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(pendingOpps ?? 0) > 0 && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/opportunities">
                  <Inbox className="size-3.5" />
                  {pendingOpps} pending review
                </Link>
              </Button>
            )}
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/grants/new">
                <Plus className="size-3.5" />
                New grant
              </Link>
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {!hasGrants && (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center animate-fade-in stagger-1">
            <div
              className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "oklch(0.55 0.175 38 / 10%)" }}
            >
              <TrendingUp className="size-6" style={{ color: "oklch(0.55 0.175 38)" }} />
            </div>
            <p className="font-semibold mb-1">No grants yet</p>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
              Add your first grant manually, or let the discovery pipeline surface opportunities for you.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/grants/new"><Plus className="size-3.5" /> Add grant</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/opportunities"><Inbox className="size-3.5" /> View opportunities</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Pipeline: stage counts */}
        {hasGrants && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Pipeline
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {STAGE_ORDER.map((stage, i) => (
                <Link
                  key={stage}
                  href={`/grants?stage=${stage}`}
                  className={`animate-fade-up stagger-${Math.min(i + 1, 6)} rounded-xl border bg-card p-4 hover:border-primary/25 hover:shadow-sm transition-all duration-150 group`}
                >
                  <p className="text-2xl font-bold tabular-nums group-hover:text-primary transition-colors">
                    {stageCounts[stage]}
                  </p>
                  <div className="mt-2">
                    <StageBadge stage={stage} />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pipeline progress bar */}
            {activeTotal > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden flex">
                  {ACTIVE_STAGES.map((stage) => {
                    const pct = activeTotal > 0 ? (stageCounts[stage] / activeTotal) * 100 : 0
                    const colors: Record<string, string> = {
                      discovered: "bg-slate-300 dark:bg-slate-600",
                      researching: "bg-blue-400",
                      applying: "bg-amber-400",
                      submitted: "bg-violet-400",
                    }
                    if (pct === 0) return null
                    return (
                      <div
                        key={stage}
                        className={`${colors[stage]} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    )
                  })}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {stageCounts.awarded} awarded · {stageCounts.rejected} rejected
                </span>
              </div>
            )}
          </div>
        )}

        {/* Upcoming deadlines */}
        {hasGrants && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Upcoming deadlines — next 30 days
            </h3>
            {upcoming.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                <Trophy className="size-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">No deadlines in the next 30 days. You're on track.</p>
              </div>
            ) : (
              <div className="rounded-xl border bg-card divide-y overflow-hidden">
                {upcoming.map((g) => {
                  const days = daysUntil(g.deadline)!
                  const urgent = days <= 7
                  return (
                    <Link
                      key={g.id}
                      href={`/grants/${g.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                          {g.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{g.funder}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ml-4 ${urgent ? "text-destructive" : "text-muted-foreground"}`}>
                        {urgent && <AlertCircle className="size-3 shrink-0" />}
                        {formatDate(g.deadline)}
                        <span className="text-[11px] opacity-70">
                          ({days === 0 ? "today" : `${days}d`})
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
