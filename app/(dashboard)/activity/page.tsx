import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Circle, CheckCircle2, XCircle, Clock, Calendar, Users2, FileText, CalendarPlus } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { TaskStatus, TaskPriority, EventType, RecurrenceType } from "@/types/database"
import { TaskFilterBar } from "@/components/activity/task-filter-bar"

type TaskRow = {
  id: string
  number: number
  title: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
  grant_id: string | null
  stakeholder_id: string | null
  created_by: string
  creator: { full_name: string } | null
  assignees: { profile: { id: string; full_name: string } | null }[]
  grant: { name: string } | null
  stakeholder: { name: string } | null
}

type EventRow = {
  id: string
  title: string
  description: string | null
  event_type: EventType
  start_at: string
  end_at: string | null
  all_day: boolean
  recurrence: RecurrenceType
  attendees: { profile: { id: string; full_name: string } | null }[]
  grant: { name: string } | null
  stakeholder: { name: string } | null
}

type ProfileRow = { id: string; full_name: string }

const STATUS_DOT: Record<TaskStatus, string> = {
  open:        "text-primary",
  in_progress: "text-amber-500",
  done:        "text-emerald-500",
  cancelled:   "text-muted-foreground",
}

const STATUS_PILL: Record<TaskStatus, string> = {
  open:        "bg-primary/10 text-primary border border-primary/20",
  in_progress: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  done:        "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  cancelled:   "bg-muted text-muted-foreground border border-border line-through",
}

const PRIORITY_PILL: Record<TaskPriority, string> = {
  urgent: "bg-destructive/10 text-destructive border border-destructive/30",
  high:   "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
  medium: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  low:    "bg-muted text-muted-foreground border border-border",
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: "Meeting",
  deadline: "Deadline",
  review: "Review",
  call: "Call",
  workshop: "Workshop",
  other: "Other",
}

const RECURRENCE_LABELS: Record<RecurrenceType, string | null> = {
  none: null,
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
}

function avatarColor(id: string) {
  const colors = ["oklch(0.55 0.175 38)", "oklch(0.55 0.18 270)", "oklch(0.55 0.18 160)", "oklch(0.55 0.18 330)", "oklch(0.55 0.18 200)"]
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

function AvatarStack({ assignees }: { assignees: { profile: { id: string; full_name: string } | null }[] }) {
  const valid = assignees.flatMap((a) => a.profile ? [a.profile] : []).slice(0, 4)
  if (!valid.length) return null
  return (
    <div className="flex items-center">
      {valid.map((p, i) => {
        const initials = p.full_name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
        return (
          <div
            key={p.id}
            title={p.full_name}
            className={`flex size-6 items-center justify-center rounded-full border-2 border-card text-white text-[10px] font-bold ${i > 0 ? "-ml-1.5" : ""}`}
            style={{ backgroundColor: avatarColor(p.id) }}
          >
            {initials}
          </div>
        )
      })}
    </div>
  )
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; priority?: string; grant?: string; assignee?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab === "closed" ? "closed" : params.tab === "events" ? "events" : "open"
  const filterPriority = params.priority || ""
  const filterGrant = params.grant || ""
  const filterAssignee = params.assignee || ""

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const taskSelect = `
    id, number, title, status, priority, due_date, created_at, grant_id, stakeholder_id, created_by,
    creator:profiles!created_by(full_name),
    assignees:task_assignments(profile:profiles(id, full_name)),
    grant:grants(name),
    stakeholder:stakeholders(name)
  `

  const [openResult, closedResult, eventsResult, profilesResult] = await Promise.all([
    db
      .from("team_tasks")
      .select(taskSelect)
      .in("status", ["open", "in_progress"])
      .order("updated_at", { ascending: false }),
    db
      .from("team_tasks")
      .select(taskSelect)
      .in("status", ["done", "cancelled"])
      .order("updated_at", { ascending: false })
      .limit(50),
    db
      .from("team_events")
      .select(`
        id, title, description, event_type, start_at, end_at, all_day, recurrence,
        attendees:event_attendees(profile:profiles(id, full_name)),
        grant:grants(name),
        stakeholder:stakeholders(name)
      `)
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ])

  let openTasks = (openResult.data ?? []) as TaskRow[]
  let closedTasks = (closedResult.data ?? []) as TaskRow[]
  const events = (eventsResult.data ?? []) as EventRow[]
  const profiles = (profilesResult.data ?? []) as ProfileRow[]

  // Client-side-style filters applied server-side
  if (filterPriority) {
    openTasks = openTasks.filter((t) => t.priority === filterPriority)
    closedTasks = closedTasks.filter((t) => t.priority === filterPriority)
  }
  if (filterGrant) {
    openTasks = openTasks.filter((t) => t.grant_id === filterGrant)
    closedTasks = closedTasks.filter((t) => t.grant_id === filterGrant)
  }
  if (filterAssignee) {
    openTasks = openTasks.filter((t) =>
      t.assignees.some((a) => a.profile?.id === filterAssignee)
    )
    closedTasks = closedTasks.filter((t) =>
      t.assignees.some((a) => a.profile?.id === filterAssignee)
    )
  }

  const buildUrl = (overrides: Record<string, string>) => {
    const p = new URLSearchParams({
      ...(activeTab !== "open" ? { tab: activeTab } : {}),
      ...(filterPriority ? { priority: filterPriority } : {}),
      ...(filterGrant ? { grant: filterGrant } : {}),
      ...(filterAssignee ? { assignee: filterAssignee } : {}),
      ...overrides,
    })
    const s = p.toString()
    return `/activity${s ? `?${s}` : ""}`
  }

  const tabUrl = (tab: string) => buildUrl(tab === "open" ? { tab: "" } : { tab })

  const displayTasks = activeTab === "open" ? openTasks : closedTasks

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Team Tasks" />
      <div className="flex-1 max-w-5xl mx-auto w-full animate-fade-up">

        {/* ── Tab bar + action buttons ── */}
        {/* ── Tab bar ── */}
        <div className="flex items-center border-b border-border px-4 md:px-6 gap-0">
          <div className="flex items-center flex-1 min-w-0 overflow-x-auto">
            {(["open", "closed", "events"] as const).map((tab) => {
              const count = tab === "open" ? openTasks.length : tab === "closed" ? closedTasks.length : events.length
              const isActive = activeTab === tab
              return (
                <Link
                  key={tab}
                  href={tabUrl(tab)}
                  className={`flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "open" && <Circle className="size-3.5" />}
                  {tab === "closed" && <CheckCircle2 className="size-3.5" />}
                  {tab === "events" && <Calendar className="size-3.5" />}
                  <span className="capitalize">{tab}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                </Link>
              )
            })}
          </div>
          <div className="flex items-center gap-2 py-2 pl-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-1.5 h-8">
              <Link href="/activity/events/new">
                <CalendarPlus className="size-3.5" />
                <span className="hidden sm:inline">New Event</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5 h-8">
              <Link href="/activity/tasks/new">
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">New Task</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Filter bar ── */}
        {activeTab !== "events" && (
          <TaskFilterBar
            profiles={profiles}
            filterPriority={filterPriority}
            filterAssignee={filterAssignee}
            activeTab={activeTab}
          />
        )}

        {/* ── Task list ── */}
        {activeTab !== "events" && (
          <div>
            {displayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                {activeTab === "open" ? (
                  <>
                    <CheckCircle2 className="size-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No open tasks</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Create a task to get started.</p>
                    <Button asChild size="sm" className="mt-4 gap-1.5">
                      <Link href="/activity/tasks/new"><Plus className="size-3.5" /> New Task</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <XCircle className="size-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No closed tasks yet</p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {displayTasks.map((task) => {
                  const isDone = task.status === "done" || task.status === "cancelled"
                  return (
                    <Link
                      key={task.id}
                      href={`/activity/tasks/${task.id}`}
                      className="flex items-start gap-3 px-4 md:px-6 py-4 hover:bg-muted/40 transition-colors group"
                    >
                      {/* Status dot */}
                      <div className="mt-0.5 shrink-0">
                        {isDone
                          ? <CheckCircle2 className={`size-4 ${STATUS_DOT[task.status]}`} />
                          : <Circle className={`size-4 ${STATUS_DOT[task.status]}`} />
                        }
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                            {task.title}
                          </span>
                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_PILL[task.status]}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${PRIORITY_PILL[task.priority]}`}>
                            {task.priority}
                          </span>
                          {task.grant && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <FileText className="size-3" />{task.grant.name}
                            </span>
                          )}
                          {task.stakeholder && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Users2 className="size-3" />{task.stakeholder.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span>#{task.number}</span>
                          <span>·</span>
                          <span>by {(task.creator as { full_name?: string } | null)?.full_name ?? "Unknown"}</span>
                          {task.due_date && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                due {formatDate(task.due_date)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Avatar stack */}
                      <div className="shrink-0 mt-0.5">
                        <AvatarStack assignees={task.assignees} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Events list ── */}
        {activeTab === "events" && (
          <div>
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Calendar className="size-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No upcoming events</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Schedule an event to coordinate with your team.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {events.map((event) => {
                  const recurrenceLabel = RECURRENCE_LABELS[event.recurrence]
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 px-4 md:px-6 py-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                        <Calendar className="size-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{event.title}</span>
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                            {EVENT_TYPE_LABELS[event.event_type]}
                          </span>
                          {recurrenceLabel && (
                            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {recurrenceLabel}
                            </span>
                          )}
                          {event.grant && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <FileText className="size-3" />{event.grant.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {event.all_day
                              ? formatDate(event.start_at)
                              : new Date(event.start_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
                            }
                          </span>
                          {event.description && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-xs">{event.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 mt-0.5">
                        <AvatarStack assignees={event.attendees} />
                      </div>
                    </div>
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
