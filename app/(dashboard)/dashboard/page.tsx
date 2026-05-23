import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { formatDate, daysUntil } from "@/lib/utils"
import Link from "next/link"
import {
  Plus, Inbox, FileText, Users2, CheckSquare,
  Calendar, ArrowRight, Clock,
} from "lucide-react"
import type { GrantStage, StakeholderArchetype, TaskStatus } from "@/types/database"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

type GrantRow = { id: string; name: string; funder: string; stage: GrantStage; deadline: string | null }
type StakeholderRow = { archetype: StakeholderArchetype }
type TaskRow = { id: string; status: TaskStatus; priority: string }
type ActivityRow = {
  id: string
  stakeholder_id: string
  activity_type: string
  occurred_at: string
  notes: string | null
  stakeholder: { name: string } | null
  profile: { full_name: string } | null
}
type TaskFeedRow = {
  id: string
  number: number
  title: string
  status: TaskStatus
  updated_at: string
}

const ACTIVE_STAGES: GrantStage[] = ["discovered", "researching", "applying", "submitted"]

function avatarColor(str: string) {
  const colors = [
    "oklch(0.55 0.175 38)",   // amber
    "oklch(0.55 0.18 270)",   // indigo
    "oklch(0.55 0.18 160)",   // green
    "oklch(0.55 0.18 330)",   // pink
    "oklch(0.55 0.18 200)",   // teal
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return "Yesterday"
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    grantsResult,
    profileResult,
    { count: pendingOpps },
    stakeholdersResult,
    tasksResult,
    eventsResult,
    activityFeedResult,
    taskFeedResult,
  ] = await Promise.all([
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
    supabase
      .from("stakeholders")
      .select("archetype"),
    (supabase.from("team_tasks") as AnyTable)
      .select("id, status, priority")
      .in("status", ["open", "in_progress"]),
    (supabase.from("team_events") as AnyTable)
      .select("id", { count: "exact", head: true })
      .gte("start_at", new Date().toISOString()),
    supabase
      .from("stakeholder_activities")
      .select("id, stakeholder_id, activity_type, occurred_at, notes, stakeholder:stakeholders(name), profile:profiles(full_name)")
      .order("occurred_at", { ascending: false })
      .limit(3),
    (supabase.from("team_tasks") as AnyTable)
      .select("id, number, title, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(3),
  ])

  const grants = (grantsResult.data ?? []) as GrantRow[]
  const profile = profileResult.data as { full_name: string } | null
  const stakeholders = (stakeholdersResult.data ?? []) as StakeholderRow[]
  const tasks = (tasksResult.data ?? []) as TaskRow[]
  const eventsCount = eventsResult.count ?? 0
  const activityFeed = (activityFeedResult.data ?? []) as ActivityRow[]
  const taskFeed = (taskFeedResult.data ?? []) as TaskFeedRow[]

  const activeGrants = grants.filter((g) => ACTIVE_STAGES.includes(g.stage)).length
  const deadlinesThisMonth = grants.filter((g) => {
    const d = daysUntil(g.deadline)
    return d !== null && d >= 0 && d <= 30
  }).length

  const stakeholderTotal = stakeholders.length
  const archetypeCounts = stakeholders.reduce<Record<string, number>>((acc, s) => {
    acc[s.archetype] = (acc[s.archetype] ?? 0) + 1
    return acc
  }, {})

  const openTasks = tasks.length
  const urgentTasks = tasks.filter((t) => t.priority === "urgent").length

  const upcoming30 = grants.filter((g) => {
    if (g.stage === "awarded" || g.stage === "rejected") return false
    const d = daysUntil(g.deadline)
    return d !== null && d >= 0 && d <= 30
  })

  const firstName = profile?.full_name?.split(" ")[0] ?? null

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Dashboard" />

      <div className="flex-1 p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">

        {/* Welcome row */}
        <div className="flex items-center justify-between gap-4 flex-wrap animate-fade-up">
          <div>
            <h2 className="text-lg font-semibold">
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeGrants > 0
                ? `${activeGrants} active grant${activeGrants !== 1 ? "s" : ""} in pipeline.`
                : "Your grant pipeline is empty."}
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

        {/* ── Three pillar stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up stagger-1">

          {/* Grants card — amber gradient */}
          <Link
            href="/grants"
            className="relative rounded-2xl overflow-hidden text-white group transition-transform duration-200 hover:scale-[1.015] hover:shadow-xl active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, oklch(0.72 0.17 55) 0%, oklch(0.55 0.175 38) 100%)" }}
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
            <div className="relative p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <FileText className="size-5" />
                </div>
                <ArrowRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-4xl font-bold tabular-nums">{activeGrants}</p>
              <p className="text-sm font-medium opacity-90 mt-1">Active Grants</p>
              <p className="text-xs opacity-65 mt-0.5">
                {deadlinesThisMonth} deadline{deadlinesThisMonth !== 1 ? "s" : ""} this month
              </p>
            </div>
            <div className="px-5 pb-4">
              <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/70 transition-all"
                  style={{ width: grants.length ? `${Math.min((activeGrants / grants.length) * 100, 100)}%` : "0%" }}
                />
              </div>
            </div>
          </Link>

          {/* Stakeholders card — indigo gradient */}
          <Link
            href="/stakeholders"
            className="relative rounded-2xl overflow-hidden text-white group transition-transform duration-200 hover:scale-[1.015] hover:shadow-xl active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.20 280) 0%, oklch(0.50 0.18 260) 100%)" }}
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
            <div className="relative p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Users2 className="size-5" />
                </div>
                <ArrowRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-4xl font-bold tabular-nums">{stakeholderTotal}</p>
              <p className="text-sm font-medium opacity-90 mt-1">Stakeholders</p>
              <p className="text-xs opacity-65 mt-0.5">
                {[
                  archetypeCounts["government"] && `${archetypeCounts["government"]} gov`,
                  archetypeCounts["foundation"] && `${archetypeCounts["foundation"]} found.`,
                  archetypeCounts["corporate"] && `${archetypeCounts["corporate"]} corp`,
                ].filter(Boolean).join(" · ") || "None added yet"}
              </p>
            </div>
            <div className="px-5 pb-4">
              <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/70 transition-all"
                  style={{ width: stakeholderTotal > 0 ? `${Math.min((stakeholderTotal / 20) * 100, 100)}%` : "0%" }}
                />
              </div>
            </div>
          </Link>

          {/* Team Tasks card — green gradient */}
          <Link
            href="/activity"
            className="relative rounded-2xl overflow-hidden text-white group transition-transform duration-200 hover:scale-[1.015] hover:shadow-xl active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, oklch(0.68 0.18 160) 0%, oklch(0.52 0.16 150) 100%)" }}
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
            <div className="relative p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <CheckSquare className="size-5" />
                </div>
                <ArrowRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-4xl font-bold tabular-nums">{openTasks}</p>
              <p className="text-sm font-medium opacity-90 mt-1">Open Tasks</p>
              <p className="text-xs opacity-65 mt-0.5">
                {urgentTasks > 0 ? `${urgentTasks} urgent · ` : ""}{eventsCount} upcoming event{eventsCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="px-5 pb-4">
              <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/70 transition-all"
                  style={{ width: openTasks > 0 ? `${Math.min((urgentTasks / Math.max(openTasks, 1)) * 100, 100)}%` : "0%" }}
                />
              </div>
            </div>
          </Link>
        </div>

        {/* ── Bottom two-column section ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up stagger-2">

          {/* Upcoming deadlines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Upcoming deadlines
              </h3>
              <Link href="/grants" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all
              </Link>
            </div>

            {upcoming30.length === 0 ? (
              <div className="rounded-xl border bg-card px-4 py-8 text-center">
                <Calendar className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No deadlines in the next 30 days.</p>
              </div>
            ) : (
              <div className="rounded-xl border bg-card overflow-hidden divide-y">
                {upcoming30.map((g) => {
                  const days = daysUntil(g.deadline)!
                  const urgent = days <= 7
                  return (
                    <Link
                      key={g.id}
                      href={`/grants/${g.id}`}
                      className="flex items-stretch hover:bg-muted/30 transition-colors group"
                    >
                      {/* Urgency bar */}
                      <div className={`w-1 shrink-0 ${urgent ? "bg-destructive" : "bg-amber-400"}`} />
                      <div className="flex items-center justify-between flex-1 px-4 py-3 min-w-0">
                        <div className="min-w-0">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                            {g.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{g.funder}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-semibold shrink-0 ml-4 ${urgent ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
                          <Clock className="size-3 shrink-0" />
                          {days === 0 ? "Today" : `${days}d`}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Team Activity feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent activity
              </h3>
              <Link href="/activity" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all
              </Link>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              {activityFeed.length === 0 && taskFeed.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <CheckSquare className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {/* Recent tasks */}
                  {taskFeed.map((t) => {
                    const color = avatarColor(t.id)
                    const actionMap: Record<TaskStatus, string> = {
                      open: "Opened",
                      in_progress: "Started",
                      done: "Closed",
                      cancelled: "Cancelled",
                    }
                    return (
                      <Link
                        key={`task-${t.id}`}
                        href={`/activity/tasks/${t.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold"
                          style={{ backgroundColor: color }}
                        >
                          #
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            <span className="text-muted-foreground">{actionMap[t.status]} task</span>{" "}
                            <span className="font-medium">#{t.number} {t.title}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(t.updated_at)}</p>
                        </div>
                      </Link>
                    )
                  })}

                  {/* Recent stakeholder activities */}
                  {activityFeed.map((a) => {
                    const name = (a.profile as { full_name?: string } | null)?.full_name ?? "Team member"
                    const color = avatarColor(a.stakeholder_id)
                    const initials = name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                    const typeLabel: Record<string, string> = {
                      meeting: "Meeting with",
                      email: "Emailed",
                      call: "Call with",
                      follow_up: "Follow-up with",
                      note: "Note on",
                    }
                    const stakeholderName = (a.stakeholder as { name?: string } | null)?.name ?? "a stakeholder"
                    return (
                      <div key={`sa-${a.id}`} className="flex items-center gap-3 px-4 py-3">
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            <span className="text-muted-foreground">{typeLabel[a.activity_type] ?? "Activity with"}</span>{" "}
                            <span className="font-medium">{stakeholderName}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(a.occurred_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
