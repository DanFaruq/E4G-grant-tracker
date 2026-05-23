import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import {
  ArrowLeft, Circle, CheckCircle2, Pencil, Clock,
  FileText, Users2,
} from "lucide-react"
import { TaskActions } from "@/components/activity/task-actions"
import { CommentSection } from "@/components/activity/comment-section"
import type { TaskStatus, TaskPriority } from "@/types/database"

const STATUS_PILL: Record<TaskStatus, string> = {
  open:        "bg-primary/10 text-primary border border-primary/20",
  in_progress: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  done:        "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  cancelled:   "bg-muted text-muted-foreground border border-border",
}

const PRIORITY_PILL: Record<TaskPriority, string> = {
  urgent: "bg-destructive/10 text-destructive border border-destructive/30",
  high:   "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
  medium: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  low:    "bg-muted text-muted-foreground border border-border",
}

function avatarColor(id: string) {
  const colors = ["oklch(0.55 0.175 38)", "oklch(0.55 0.18 270)", "oklch(0.55 0.18 160)", "oklch(0.55 0.18 330)", "oklch(0.55 0.18 200)"]
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [taskResult, commentsResult, profileResult] = await Promise.all([
    db
      .from("team_tasks")
      .select(`
        id, number, title, body, status, priority, due_date, created_at, updated_at, created_by,
        creator:profiles!created_by(id, full_name),
        assignees:task_assignments(profile:profiles(id, full_name)),
        grant:grants(id, name),
        stakeholder:stakeholders(id, name)
      `)
      .eq("id", id)
      .single(),
    db
      .from("task_comments")
      .select("id, body, created_at, author:profiles!author_id(id, full_name)")
      .eq("task_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("role").eq("id", user?.id ?? "").single(),
  ])

  if (!taskResult.data) notFound()

  const task = taskResult.data as {
    id: string
    number: number
    title: string
    body: string | null
    status: TaskStatus
    priority: TaskPriority
    due_date: string | null
    created_at: string
    updated_at: string
    created_by: string
    creator: { id: string; full_name: string } | null
    assignees: { profile: { id: string; full_name: string } | null }[]
    grant: { id: string; name: string } | null
    stakeholder: { id: string; name: string } | null
  }

  const comments = (commentsResult.data ?? []) as {
    id: string
    body: string
    created_at: string
    author: { id: string; full_name: string } | null
  }[]

  const userRole = (profileResult.data as { role?: string } | null)?.role
  const isAdmin = userRole === "admin"
  const isCreator = task.created_by === user?.id
  const isDone = task.status === "done" || task.status === "cancelled"
  const assignees = task.assignees.flatMap((a) => a.profile ? [a.profile] : [])

  return (
    <div className="flex flex-col min-h-full">
      <Header title={`#${task.number} ${task.title}`} />
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full animate-fade-up">

        {/* Back + actions row */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <Link href="/activity">
              <ArrowLeft className="size-4" />
              Back to tasks
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {(isCreator || isAdmin) && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={`/activity/tasks/${id}/edit`}>
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              </Button>
            )}
            <TaskActions
              taskId={id}
              status={task.status}
              isCreator={isCreator}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_224px] gap-6">

          {/* ── Main content ── */}
          <div className="space-y-6 min-w-0">
            {/* Title + status */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isDone
                  ? <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                  : <Circle className="size-5 text-primary shrink-0" />
                }
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_PILL[task.status]}`}>
                  {task.status.replace("_", " ")}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_PILL[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              <h1 className="text-xl font-bold">{task.title}</h1>
              <p className="text-xs text-muted-foreground mt-1.5">
                #{task.number} · opened by{" "}
                <span className="font-medium">{(task.creator as { full_name?: string } | null)?.full_name ?? "Unknown"}</span>
                {" · "}{formatDate(task.created_at)}
              </p>
            </div>

            {/* Body */}
            {task.body ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{task.body}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <p className="text-sm text-muted-foreground">No description provided.</p>
              </div>
            )}

            {/* Comments */}
            <CommentSection
              taskId={id}
              comments={comments}
              currentUserId={user?.id ?? ""}
              isAdmin={isAdmin}
            />
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4 lg:shrink-0">
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">

              {/* Assignees */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Assignees
                </p>
                {assignees.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No assignees</p>
                ) : (
                  <div className="space-y-1.5">
                    {assignees.map((a) => {
                      const initials = a.full_name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                      return (
                        <div key={a.id} className="flex items-center gap-2">
                          <div
                            className="flex size-6 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold"
                            style={{ backgroundColor: avatarColor(a.id) }}
                          >
                            {initials}
                          </div>
                          <span className="text-xs font-medium">{a.full_name}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Due date */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Due date
                </p>
                <p className="text-xs flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  {task.due_date ? formatDate(task.due_date) : "No due date"}
                </p>
              </div>

              {/* Priority */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Priority
                </p>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_PILL[task.priority]}`}>
                  {task.priority}
                </span>
              </div>

              {/* Linked grant */}
              {task.grant && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Grant
                  </p>
                  <Link
                    href={`/grants/${(task.grant as { id: string }).id}`}
                    className="text-xs flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <FileText className="size-3.5" />
                    {(task.grant as { name: string }).name}
                  </Link>
                </div>
              )}

              {/* Linked stakeholder */}
              {task.stakeholder && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Stakeholder
                  </p>
                  <Link
                    href={`/stakeholders/${(task.stakeholder as { id: string }).id}`}
                    className="text-xs flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Users2 className="size-3.5" />
                    {(task.stakeholder as { name: string }).name}
                  </Link>
                </div>
              )}

              {/* Created by */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Created by
                </p>
                <p className="text-xs">{(task.creator as { full_name?: string } | null)?.full_name ?? "Unknown"}</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
