"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2, Circle, Calendar, FileText, ListTodo,
  ChevronDown, Clock, Plus, Timer, Eye,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { updateTaskStatus } from "@/lib/actions/tasks"
import { formatDate, daysUntil, cn } from "@/lib/utils"
import type { TaskStatus, TaskPriority, GrantStage } from "@/types/database"
import type { MyWorkTask, MyWorkEvent, MyWorkGrant, ProfileOption } from "./page"

type Tab = "active" | "completed"
type TypeFilter = "all" | "tasks" | "events" | "grants"
type GroupBy = "none" | "status" | "priority" | "grant"

const ACTIVE_STAGES: GrantStage[] = ["discovered", "researching", "applying", "submitted"]
const COMPLETED_STAGES: GrantStage[] = ["awarded", "rejected"]

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "To do",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
}

const STATUS_PILL: Record<TaskStatus, string> = {
  open: "bg-muted text-foreground border border-border",
  in_progress: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  done: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  cancelled: "bg-muted text-muted-foreground border border-border",
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
}

const PRIORITY_PILL: Record<TaskPriority, string> = {
  urgent: "bg-destructive/10 text-destructive border border-destructive/30",
  high: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
  medium: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  low: "bg-muted text-muted-foreground border border-border",
}

const STAGE_LABELS: Record<GrantStage, string> = {
  discovered: "Discovered",
  researching: "Researching",
  applying: "Applying",
  submitted: "Submitted",
  awarded: "Awarded",
  rejected: "Rejected",
}

const STAGE_PILL: Record<GrantStage, string> = {
  discovered: "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800",
  researching: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  applying: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  submitted: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800",
  awarded: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  rejected: "bg-destructive/10 text-destructive border border-destructive/20",
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: "Meeting",
  deadline: "Deadline",
  review: "Review",
  call: "Call",
  workshop: "Workshop",
  other: "Other",
}

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

function avatarColor(str: string): string {
  const colors = [
    "oklch(0.55 0.175 38)",
    "oklch(0.55 0.18 270)",
    "oklch(0.55 0.18 160)",
    "oklch(0.55 0.18 330)",
    "oklch(0.55 0.18 200)",
  ]
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

function AvatarStack({ people, max = 3 }: { people: { id: string; full_name: string }[]; max?: number }) {
  if (!people.length) return null
  const shown = people.slice(0, max)
  const extra = people.length - max
  return (
    <span className="inline-flex items-center">
      {shown.map((p, i) => {
        const initials = p.full_name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
        return (
          <span
            key={p.id}
            title={p.full_name}
            className={cn(
              "inline-flex size-5 items-center justify-center rounded-full border-2 border-card text-white text-[9px] font-bold",
              i > 0 && "-ml-1.5"
            )}
            style={{ backgroundColor: avatarColor(p.id) }}
          >
            {initials}
          </span>
        )
      })}
      {extra > 0 && (
        <span className="-ml-1.5 inline-flex size-5 items-center justify-center rounded-full border-2 border-card bg-muted text-muted-foreground text-[8px] font-bold">
          +{extra}
        </span>
      )}
    </span>
  )
}

function SectionHeader({
  icon: Icon,
  label,
  count,
  iconClass,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  iconClass?: string
}) {
  return (
    <div className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-muted/30 border-b border-border">
      <Icon className={cn("size-3.5", iconClass ?? "text-muted-foreground")} />
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground font-medium">{count}</span>
    </div>
  )
}

// ── Task row (matches inspo layout) ──────────────────────────────────────────

function TaskItem({
  task,
  targetUserId,
  onStatusChange,
  onComplete,
  pendingId,
  isPending,
}: {
  task: MyWorkTask
  targetUserId: string
  onStatusChange: (id: string, status: TaskStatus) => void
  onComplete: (id: string) => void
  pendingId: string | null
  isPending: boolean
}) {
  const isThisPending = isPending && pendingId === task.id
  const isActive = task.status === "open" || task.status === "in_progress"

  // Others assigned (minus the viewer)
  const withPeople = task.assignees
    .flatMap((a) => (a.profile ? [a.profile] : []))
    .filter((p) => p.id !== targetUserId)

  const days = daysUntil(task.due_date)
  const isOverdue = isActive && days !== null && days < 0
  const isDueToday = isActive && days === 0

  const creatorName = (task.creator as { full_name?: string } | null)?.full_name
    ? abbreviateName((task.creator as { full_name: string }).full_name)
    : null

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 md:px-6 py-3.5 border-b border-border hover:bg-muted/20 transition-colors group",
        isThisPending && "opacity-50 pointer-events-none"
      )}
    >
      {/* Status circle */}
      <div className="mt-0.5 shrink-0">
        {task.status === "done" ? (
          <CheckCircle2 className="size-4 text-emerald-500" />
        ) : task.status === "cancelled" ? (
          <CheckCircle2 className="size-4 text-muted-foreground/50" />
        ) : (
          <Circle
            className={cn(
              "size-4",
              task.status === "in_progress" ? "text-amber-500" : "text-muted-foreground/60"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title + badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={`/activity/tasks/${task.id}`}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            {task.title}
          </Link>

          {/* Status dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all hover:opacity-75 focus:outline-none",
                  STATUS_PILL[task.status]
                )}
                disabled={isThisPending}
              >
                {STATUS_LABELS[task.status]}
                <ChevronDown className="size-2.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              {(["open", "in_progress", "done", "cancelled"] as TaskStatus[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onStatusChange(task.id, s)}
                  className={cn(task.status === s && "bg-muted font-medium")}
                >
                  {STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority (skip low to reduce noise) */}
          {task.priority !== "low" && (
            <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", PRIORITY_PILL[task.priority])}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}

          {/* Grant link */}
          {task.grant && (
            <Link
              href={`/grants/${task.grant.id}`}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <FileText className="size-3 shrink-0" />
              <span className="max-w-[160px] truncate">{task.grant.name}</span>
            </Link>
          )}
        </div>

        {/* Meta row: #number · by Name · date · overdue · with avatars */}
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground flex-wrap">
          <span className="opacity-60">#{task.number}</span>

          {creatorName && (
            <>
              <span className="opacity-30">·</span>
              <span>by {creatorName}</span>
            </>
          )}

          {task.due_date && (
            <>
              <span className="opacity-30">·</span>
              <span className="flex items-center gap-0.5">
                <Clock className="size-3 shrink-0" />
                {formatDate(task.due_date)}
              </span>
              {days !== null && (
                <>
                  <span className="opacity-30">·</span>
                  <span
                    className={cn(
                      "font-semibold",
                      isOverdue
                        ? "text-destructive"
                        : isDueToday
                        ? "text-orange-600 dark:text-orange-400"
                        : ""
                    )}
                  >
                    {isOverdue
                      ? `${Math.abs(days)}d overdue`
                      : isDueToday
                      ? "Due today"
                      : `${days}d`}
                  </span>
                </>
              )}
            </>
          )}

          {withPeople.length > 0 && (
            <>
              <span className="opacity-30">·</span>
              <span>with</span>
              <AvatarStack people={withPeople} />
            </>
          )}
        </div>
      </div>

      {/* ✓ Complete quick action */}
      {isActive && (
        <button
          type="button"
          onClick={() => onComplete(task.id)}
          disabled={isThisPending}
          className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mt-0.5 whitespace-nowrap"
        >
          <CheckCircle2 className="size-3.5" />
          Complete
        </button>
      )}
    </div>
  )
}

// ── Event row ─────────────────────────────────────────────────────────────────

function EventItem({ event }: { event: MyWorkEvent }) {
  const startDate = new Date(event.start_at)
  const isPast = startDate < new Date()
  const attendees = event.attendees.flatMap((a) => (a.profile ? [a.profile] : []))
  const monthStr = startDate.toLocaleString("en-US", { month: "short" }).toUpperCase()
  const dayStr = startDate.getDate().toString()
  const timeStr = event.all_day
    ? "All day"
    : startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

  return (
    <Link
      href={`/activity/events/${event.id}`}
      className="flex items-center gap-3 px-4 md:px-6 py-3.5 border-b border-border hover:bg-muted/30 transition-colors group"
    >
      {/* Date badge */}
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border px-2.5 py-1.5 min-w-[44px] shrink-0",
          isPast ? "bg-muted border-border" : "bg-primary/10 border-primary/20"
        )}
      >
        <span className={cn("text-[8px] font-bold uppercase tracking-wider", isPast ? "text-muted-foreground" : "text-primary")}>
          {monthStr}
        </span>
        <span className={cn("text-base font-bold leading-none", isPast ? "text-muted-foreground" : "text-primary")}>
          {dayStr}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
            {event.title}
          </span>
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
          </span>
          {event.recurrence !== "none" && (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
              {event.recurrence}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="size-3 shrink-0" />
          <span>{timeStr}</span>
          {event.end_at && !event.all_day && (
            <span>
              {" – "}
              {new Date(event.end_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          {event.grant && (
            <>
              <span className="opacity-30">·</span>
              <span className="flex items-center gap-0.5">
                <FileText className="size-3 shrink-0" />
                <span className="truncate max-w-[120px]">{event.grant.name}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {attendees.length > 0 && (
        <div className="shrink-0">
          <AvatarStack people={attendees} />
        </div>
      )}
    </Link>
  )
}

// ── Grant row ─────────────────────────────────────────────────────────────────

function GrantItem({ grant }: { grant: MyWorkGrant }) {
  const days = daysUntil(grant.deadline)
  const isActive = ACTIVE_STAGES.includes(grant.stage)
  const isOverdue = isActive && days !== null && days < 0
  const isUrgent = isActive && days !== null && days >= 0 && days <= 14

  return (
    <Link
      href={`/grants/${grant.id}`}
      className="flex items-center gap-3 px-4 md:px-6 py-3.5 border-b border-border hover:bg-muted/30 transition-colors group"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
        <FileText className="size-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
            {grant.name}
          </span>
          <span className={cn("text-[11px] font-semibold px-1.5 py-0.5 rounded-full", STAGE_PILL[grant.stage])}>
            {STAGE_LABELS[grant.stage]}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <span className="truncate max-w-[180px]">{grant.funder}</span>
          {grant.deadline && (
            <>
              <span className="opacity-30">·</span>
              <span
                className={cn(
                  "flex items-center gap-0.5",
                  isOverdue ? "text-destructive font-semibold" : isUrgent ? "text-amber-600 dark:text-amber-400 font-semibold" : ""
                )}
              >
                <Clock className="size-3 shrink-0" />
                {isOverdue
                  ? `${Math.abs(days!)}d overdue`
                  : days === 0
                  ? "Due today"
                  : formatDate(grant.deadline)}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MyWorkClient({
  tasks,
  events,
  grants,
  currentUserId,
  isAdmin,
  allProfiles,
  targetUserId,
  viewingName,
}: {
  tasks: MyWorkTask[]
  events: MyWorkEvent[]
  grants: MyWorkGrant[]
  currentUserId: string
  isAdmin: boolean
  allProfiles: ProfileOption[]
  targetUserId: string
  viewingName: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("active")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [groupBy, setGroupBy] = useState<GroupBy>("status")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  // Header avatar initials
  const avatarInitials = viewingName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  // Split active / completed
  const activeTasks = tasks.filter((t) => t.status === "open" || t.status === "in_progress")
  const completedTasks = tasks.filter((t) => t.status === "done" || t.status === "cancelled")
  const activeEvents = events.filter((e) => new Date(e.start_at) >= now)
  const pastEvents = events.filter((e) => new Date(e.start_at) < now)
  const activeGrants = grants.filter((g) => ACTIVE_STAGES.includes(g.stage))
  const completedGrants = grants.filter((g) => COMPLETED_STAGES.includes(g.stage))

  // KPI (always from full task list)
  const overdueCount = activeTasks.filter((t) => {
    const d = daysUntil(t.due_date)
    return d !== null && d < 0
  }).length
  const dueTodayCount = activeTasks.filter((t) => t.due_date?.slice(0, 10) === todayStr).length
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length
  const completedKpiCount = tasks.filter((t) => t.status === "done").length

  // Current tab display sets
  const displayTasks = tab === "active" ? activeTasks : completedTasks
  const displayEvents = tab === "active" ? activeEvents : pastEvents
  const displayGrants = tab === "active" ? activeGrants : completedGrants

  const showTasks = typeFilter === "all" || typeFilter === "tasks"
  const showEvents = typeFilter === "all" || typeFilter === "events"
  const showGrants = typeFilter === "all" || typeFilter === "grants"

  const filteredTasks = showTasks ? displayTasks : []
  const filteredEvents = showEvents ? displayEvents : []
  const filteredGrants = showGrants ? displayGrants : []

  const activeCount = activeTasks.length + activeEvents.length + activeGrants.length
  const completedCount = completedTasks.length + pastEvents.length + completedGrants.length
  const isEmpty = filteredTasks.length === 0 && filteredEvents.length === 0 && filteredGrants.length === 0

  function handleStatusChange(id: string, status: TaskStatus) {
    setPendingId(id)
    startTransition(async () => {
      await updateTaskStatus(id, status)
      router.refresh()
      setPendingId(null)
    })
  }

  function handleViewAs(userId: string) {
    router.push(userId === currentUserId ? "/my-work" : `/my-work?userId=${userId}`)
  }

  // ── Shared sub-sections for events + grants ──
  function renderEventsSection() {
    if (!showEvents || !filteredEvents.length) return null
    return (
      <div>
        <SectionHeader
          icon={Calendar}
          label={tab === "active" ? "Upcoming events" : "Past events"}
          count={filteredEvents.length}
          iconClass="text-primary"
        />
        {filteredEvents.map((e) => <EventItem key={e.id} event={e} />)}
      </div>
    )
  }

  function renderGrantsSection() {
    if (!showGrants || !filteredGrants.length) return null
    return (
      <div>
        <SectionHeader icon={FileText} label="Grants" count={filteredGrants.length} iconClass="text-amber-500" />
        {filteredGrants.map((g) => <GrantItem key={g.id} grant={g} />)}
      </div>
    )
  }

  function renderTaskItem(task: MyWorkTask) {
    return (
      <TaskItem
        key={task.id}
        task={task}
        targetUserId={targetUserId}
        onStatusChange={handleStatusChange}
        onComplete={(id) => handleStatusChange(id, "done")}
        pendingId={pendingId}
        isPending={isPending}
      />
    )
  }

  // ── Group by logic ──
  function renderItems() {
    if (groupBy === "status") {
      const activeStatuses: TaskStatus[] = ["in_progress", "open"]
      const completedStatuses: TaskStatus[] = ["done", "cancelled"]
      const statuses = tab === "active" ? activeStatuses : completedStatuses

      const sectionMeta: Record<TaskStatus, { label: string; icon: React.ComponentType<{ className?: string }>; iconClass: string }> = {
        open: { label: "To do", icon: Circle, iconClass: "text-muted-foreground" },
        in_progress: { label: "In progress", icon: Timer, iconClass: "text-amber-500" },
        done: { label: "Done", icon: CheckCircle2, iconClass: "text-emerald-500" },
        cancelled: { label: "Cancelled", icon: Circle, iconClass: "text-muted-foreground/50" },
      }

      return (
        <>
          {showTasks && statuses.map((status) => {
            const group = filteredTasks.filter((t) => t.status === status)
            if (!group.length) return null
            const { label, icon, iconClass } = sectionMeta[status]
            return (
              <div key={status}>
                <SectionHeader icon={icon} label={label} count={group.length} iconClass={iconClass} />
                {group.map(renderTaskItem)}
              </div>
            )
          })}
          {renderEventsSection()}
          {renderGrantsSection()}
        </>
      )
    }

    if (groupBy === "priority") {
      const priorities: TaskPriority[] = ["urgent", "high", "medium", "low"]
      return (
        <>
          {showTasks && priorities.map((priority) => {
            const group = filteredTasks.filter((t) => t.priority === priority)
            if (!group.length) return null
            return (
              <div key={priority}>
                <SectionHeader icon={Circle} label={PRIORITY_LABELS[priority]} count={group.length} />
                {group.map(renderTaskItem)}
              </div>
            )
          })}
          {renderEventsSection()}
          {renderGrantsSection()}
        </>
      )
    }

    if (groupBy === "grant") {
      const buckets = new Map<string | null, { name: string; tasks: MyWorkTask[]; grants: MyWorkGrant[] }>()

      if (showTasks) {
        for (const task of filteredTasks) {
          const key = task.grant?.id ?? null
          if (!buckets.has(key)) buckets.set(key, { name: task.grant?.name ?? "No grant", tasks: [], grants: [] })
          buckets.get(key)!.tasks.push(task)
        }
      }
      if (showGrants) {
        for (const grant of filteredGrants) {
          if (!buckets.has(grant.id)) buckets.set(grant.id, { name: grant.name, tasks: [], grants: [] })
          buckets.get(grant.id)!.grants.push(grant)
        }
      }

      const entries = [...buckets.entries()].sort(([a], [b]) => {
        if (a === null) return 1
        if (b === null) return -1
        return 0
      })

      return (
        <>
          {entries.map(([key, bucket]) => (
            <div key={key ?? "no-grant"}>
              <SectionHeader
                icon={FileText}
                label={bucket.name}
                count={bucket.tasks.length + bucket.grants.length}
                iconClass="text-amber-500"
              />
              {bucket.tasks.map(renderTaskItem)}
              {bucket.grants.map((g) => <GrantItem key={g.id} grant={g} />)}
            </div>
          ))}
          {renderEventsSection()}
        </>
      )
    }

    // "none" — flat sections
    return (
      <>
        {filteredTasks.length > 0 && (
          <div>
            <SectionHeader icon={ListTodo} label="Tasks" count={filteredTasks.length} />
            {filteredTasks.map(renderTaskItem)}
          </div>
        )}
        {renderEventsSection()}
        {renderGrantsSection()}
      </>
    )
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full animate-fade-up pb-20 md:pb-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-5 pb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
            style={{ backgroundColor: avatarColor(viewingName) }}
          >
            {avatarInitials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-none truncate">{viewingName}</h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              Everything assigned to
              <span
                className="inline-flex size-4 items-center justify-center rounded-full text-white text-[9px] font-bold shrink-0"
                style={{ backgroundColor: avatarColor(viewingName) }}
              >
                {avatarInitials[0]}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Admin "View as" — visible on all screen sizes */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <Eye className="size-3.5 shrink-0" />
                  <span className="hidden sm:inline text-xs font-medium">
                    {viewingName}
                  </span>
                  <ChevronDown className="size-3 hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
                {allProfiles.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => handleViewAs(p.id)}
                    className={cn(p.id === targetUserId && "bg-muted font-medium")}
                  >
                    {p.full_name}
                    {p.id === currentUserId && (
                      <span className="ml-1 text-muted-foreground text-xs">(You)</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button asChild size="sm" className="gap-1.5 h-8">
            <Link href="/activity/tasks/new">
              <Plus className="size-4" />
              <span className="hidden sm:inline">New task</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 md:px-6 pb-5">
        {[
          {
            label: "OVERDUE",
            count: overdueCount,
            color: "text-destructive",
            bg: "bg-destructive/5 dark:bg-destructive/10",
            border: "border-destructive/15 dark:border-destructive/20",
          },
          {
            label: "DUE TODAY",
            count: dueTodayCount,
            color: "text-orange-600 dark:text-orange-400",
            bg: "bg-orange-50 dark:bg-orange-950/20",
            border: "border-orange-200 dark:border-orange-800/40",
          },
          {
            label: "IN PROGRESS",
            count: inProgressCount,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/20",
            border: "border-blue-200 dark:border-blue-800/40",
          },
          {
            label: "COMPLETED",
            count: completedKpiCount,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/20",
            border: "border-emerald-200 dark:border-emerald-800/40",
          },
        ].map(({ label, count, color, bg, border }) => (
          <div key={label} className={cn("rounded-xl border px-4 py-4", bg, border)}>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest", color)}>{label}</p>
            <p className={cn("text-4xl font-bold tabular-nums mt-1.5 leading-none", color)}>{count}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs + Filter chips + Group by (one row on md+) ── */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 px-4 md:px-6 pb-4 min-w-0">
        {/* Active / Completed tabs */}
        <div className="inline-flex items-center gap-0.5 bg-muted/60 border border-border rounded-lg p-0.5 shrink-0 self-start md:self-auto">
          {([
            { value: "active" as Tab, count: activeCount },
            { value: "completed" as Tab, count: completedCount },
          ]).map(({ value, count }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all capitalize",
                tab === value
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {value}
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-md font-bold leading-none",
                  tab === value
                    ? "bg-background/20 text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter chips + Group by — scrollable, constrained */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 flex-nowrap">
            {([
              { value: "all" as TypeFilter, label: "All", icon: null },
              { value: "tasks" as TypeFilter, label: "Tasks", icon: ListTodo },
              { value: "events" as TypeFilter, label: "Events", icon: Calendar },
              { value: "grants" as TypeFilter, label: "Grants", icon: FileText },
            ]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-all whitespace-nowrap",
                  typeFilter === value
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
                )}
              >
                {Icon && <Icon className="size-3.5" />}
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs whitespace-nowrap">
                  Group by:{" "}
                  {groupBy === "none"
                    ? "None"
                    : groupBy === "status"
                    ? "Status"
                    : groupBy === "priority"
                    ? "Priority"
                    : "Grant"}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {([
                  { value: "none" as GroupBy, label: "None" },
                  { value: "status" as GroupBy, label: "Status" },
                  { value: "priority" as GroupBy, label: "Priority" },
                  { value: "grant" as GroupBy, label: "Grant" },
                ]).map(({ value, label }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setGroupBy(value)}
                    className={cn(groupBy === value && "bg-muted font-medium")}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Items ── */}
      <div className="border-t border-border">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <CheckCircle2 className="size-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {tab === "active" ? "All caught up!" : "Nothing completed yet"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {tab === "active"
                ? typeFilter !== "all"
                  ? `No active ${typeFilter} assigned to you.`
                  : "No active work assigned to you."
                : "Completed tasks, past events, and closed grants appear here."}
            </p>
          </div>
        ) : (
          renderItems()
        )}
      </div>
    </div>
  )
}
