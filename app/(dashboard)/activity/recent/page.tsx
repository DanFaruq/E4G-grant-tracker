import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckSquare, ArrowLeft } from "lucide-react"
import type { GrantStage, TaskStatus } from "@/types/database"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

const STAGE_COLOR: Record<string, string> = {
  discovered:  "rgba(99,102,241,0.85)",
  researching: "rgba(59,130,246,0.85)",
  applying:    "rgba(245,158,11,0.85)",
  submitted:   "rgba(20,184,166,0.85)",
  awarded:     "rgba(34,197,94,0.85)",
  rejected:    "rgba(239,68,68,0.85)",
}

function avatarColor(str: string) {
  const colors = [
    "oklch(0.55 0.175 38)",
    "oklch(0.55 0.18 270)",
    "oklch(0.55 0.18 160)",
    "oklch(0.55 0.18 330)",
    "oklch(0.55 0.18 200)",
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) {
    const abs = -diff
    const mins = Math.floor(abs / 60000)
    if (mins < 60) return `In ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `In ${hrs}h`
    return `In ${Math.floor(hrs / 24)}d`
  }
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return "Yesterday"
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" })
}

export default async function RecentActivityPage() {
  const supabase = await createClient()

  const [grantsResult, tasksResult, activitiesResult] = await Promise.all([
    supabase
      .from("grants")
      .select("id, name, stage, updated_at")
      .eq("archived", false)
      .order("updated_at", { ascending: false })
      .limit(50),
    (supabase.from("team_tasks") as AnyTable)
      .select("id, number, title, status, updated_at, assignees:task_assignments(profile:profiles(id, full_name))")
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("stakeholder_activities")
      .select("id, stakeholder_id, activity_type, occurred_at, notes, stakeholder:stakeholders(name), profile:profiles(full_name)")
      .order("occurred_at", { ascending: false })
      .limit(50),
  ])

  type GrantRow  = { id: string; name: string; stage: GrantStage; updated_at: string }
  type TaskRow   = { id: string; number: number; title: string; status: TaskStatus; updated_at: string; assignees: { profile: { id: string; full_name: string } | null }[] }
  type ActivityRow = { id: string; stakeholder_id: string; activity_type: string; occurred_at: string; notes: string | null; stakeholder: { name: string } | null; profile: { full_name: string } | null }

  type FeedItem =
    | { kind: "grant";    id: string; name: string; stage: GrantStage; timestamp: string }
    | { kind: "task";     id: string; number: number; title: string; status: TaskStatus; assignees: TaskRow["assignees"]; timestamp: string }
    | { kind: "activity"; id: string; activityType: string; stakeholderName: string; profileName: string; stakeholderId: string; notes: string | null; timestamp: string }

  const grants     = (grantsResult.data     ?? []) as GrantRow[]
  const tasks      = (tasksResult.data      ?? []) as TaskRow[]
  const activities = (activitiesResult.data ?? []) as ActivityRow[]

  const feed: FeedItem[] = [
    ...grants.map((g) => ({ kind: "grant" as const, id: g.id, name: g.name, stage: g.stage, timestamp: g.updated_at })),
    ...tasks.map((t) => ({ kind: "task" as const, id: t.id, number: t.number, title: t.title, status: t.status, assignees: t.assignees, timestamp: t.updated_at })),
    ...activities.map((a) => ({
      kind: "activity" as const,
      id: a.id,
      activityType: a.activity_type,
      stakeholderName: (a.stakeholder as { name?: string } | null)?.name ?? "a stakeholder",
      profileName: (a.profile as { full_name?: string } | null)?.full_name ?? "Team member",
      stakeholderId: a.stakeholder_id,
      notes: a.notes,
      timestamp: a.occurred_at,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const stageLabel: Record<GrantStage, string> = {
    discovered: "Discovered", researching: "Researching", applying: "Applying",
    submitted: "Submitted", awarded: "Awarded", rejected: "Rejected",
  }
  const actionMap: Record<TaskStatus, string> = {
    open: "Opened", in_progress: "Started", done: "Closed", cancelled: "Cancelled",
  }
  const typeLabel: Record<string, string> = {
    meeting: "Meeting with", email: "Emailed", call: "Call with",
    follow_up: "Follow-up with", note: "Note on",
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Recent Activity" />
      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full animate-fade-up">

        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-5">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </Button>

        {feed.length === 0 ? (
          <div className="rounded-xl border bg-card px-4 py-16 text-center">
            <CheckSquare className="size-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No activity logged yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden divide-y">
            {feed.map((item) => {
              if (item.kind === "grant") {
                return (
                  <Link
                    key={`grant-${item.id}`}
                    href={`/grants/${item.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold"
                      style={{ backgroundColor: STAGE_COLOR[item.stage] ?? "rgba(99,102,241,0.85)" }}
                    >
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        <span className="text-muted-foreground">Grant updated</span>{" "}
                        <span className="font-medium">{item.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stageLabel[item.stage]} · {relativeTime(item.timestamp)}
                      </p>
                    </div>
                  </Link>
                )
              }

              if (item.kind === "task") {
                const assigneeProfiles = item.assignees?.flatMap((a) => a.profile ? [a.profile] : []) ?? []
                const firstAssignee = assigneeProfiles[0]
                const assigneeName = firstAssignee?.full_name ?? ""
                const initials = assigneeName
                  ? assigneeName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                  : item.title.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "T"
                const color = firstAssignee ? avatarColor(firstAssignee.id) : avatarColor(item.id)
                return (
                  <Link
                    key={`task-${item.id}`}
                    href={`/activity/tasks/${item.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        <span className="text-muted-foreground">{actionMap[item.status]} task</span>{" "}
                        <span className="font-medium">#{item.number} {item.title}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(item.timestamp)}</p>
                    </div>
                    {assigneeProfiles.length > 0 && (
                      <div className="flex items-center shrink-0">
                        {assigneeProfiles.slice(0, 3).map((p, i) => {
                          const ini = p.full_name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                          return (
                            <div
                              key={p.id}
                              title={p.full_name}
                              className={`flex size-6 items-center justify-center rounded-full border-2 border-card text-white text-[10px] font-bold ${i > 0 ? "-ml-1.5" : ""}`}
                              style={{ backgroundColor: avatarColor(p.id) }}
                            >
                              {ini}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Link>
                )
              }

              // stakeholder activity
              const initials = item.profileName.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
              const color = avatarColor(item.stakeholderId)
              return (
                <Link
                  key={`sa-${item.id}`}
                  href={`/stakeholders/${item.stakeholderId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      <span className="text-muted-foreground">{typeLabel[item.activityType] ?? "Activity with"}</span>{" "}
                      <span className="font-medium">{item.stakeholderName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.notes ? `${item.notes.slice(0, 60)}${item.notes.length > 60 ? "…" : ""}` : null}
                      {item.notes ? " · " : null}
                      {relativeTime(item.timestamp)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
