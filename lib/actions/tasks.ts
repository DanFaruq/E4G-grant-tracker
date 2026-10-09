"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { taskSchema, commentSchema } from "@/lib/validators/tasks"
import { notifyUser } from "@/lib/notifications/notify"
import { isTaskPrivileged, type Viewer } from "@/lib/job-levels"
import type { JobLevel, TaskStatus, TaskVisibility, UserRole } from "@/types/database"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return { user, supabase }
}

async function requireTeamRole() {
  const { user, supabase } = await requireAuth()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, job_level")
    .eq("id", user.id)
    .single() as { data: { role: UserRole; job_level: JobLevel | null } | null }
  if (!profile || !["admin", "team_member"].includes(profile.role)) {
    throw new Error("Insufficient permissions")
  }
  const viewer: Viewer = { id: user.id, role: profile.role, job_level: profile.job_level }
  return { user, supabase, role: profile.role, viewer }
}

/**
 * Writes here use the service client, which bypasses RLS, so check access
 * explicitly: a read through the user's own client only returns tasks they may see.
 */
async function assertCanAccessTask(supabase: Awaited<ReturnType<typeof createClient>>, taskId: string) {
  const { data } = await (supabase.from("team_tasks") as AnyTable).select("id").eq("id", taskId).maybeSingle()
  if (!data) throw new Error("Task not found")
}

type VisibilityInput = {
  visibility: TaskVisibility
  min_level?: JobLevel | null
  allowed_levels: JobLevel[]
  allowed_profile_ids: string[]
}

/** Columns to write for a task's visibility, with unused fields cleared. */
function visibilityColumns(v: VisibilityInput) {
  return {
    visibility: v.visibility,
    min_level: v.visibility === "min_level" ? v.min_level ?? null : null,
    allowed_levels: v.visibility === "custom" ? v.allowed_levels : [],
    allowed_profile_ids: v.visibility === "custom" ? v.allowed_profile_ids : [],
  }
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "reopened",
  in_progress: "marked in progress",
  done: "marked done",
  cancelled: "cancelled",
}

/** Tell everyone tagged on a task (creator + assignees, except the actor) that its status changed. */
async function notifyStatusChange(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  taskId: string,
  actorId: string,
  status: TaskStatus
) {
  try {
    const [taskResult, assigneesResult, actorResult] = await Promise.all([
      (service.from("team_tasks") as AnyTable).select("title, created_by").eq("id", taskId).single(),
      (service.from("task_assignments") as AnyTable).select("profile_id").eq("task_id", taskId),
      service.from("profiles").select("full_name").eq("id", actorId).single(),
    ])
    const task = taskResult.data as { title: string; created_by: string } | null
    if (!task) return
    const assigneeIds = ((assigneesResult.data ?? []) as { profile_id: string }[]).map((a) => a.profile_id)
    const actorName = (actorResult.data as { full_name?: string } | null)?.full_name || "Someone"

    const recipients = [...new Set([task.created_by, ...assigneeIds])].filter((id) => id !== actorId)
    await Promise.allSettled(
      recipients.map((userId) =>
        notifyUser({
          userId,
          type:   "task_updated",
          title:  `Task ${STATUS_LABELS[status]}`,
          body:   `${actorName} ${STATUS_LABELS[status]} "${task.title}"`,
          link:   `/activity/tasks/${taskId}`,
          taskId,
        })
      )
    )
  } catch (err) {
    console.error("[notifyStatusChange] failed:", err)
  }
}

function parseJson<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback
  try { return JSON.parse(raw) } catch { return fallback }
}

function parseAssignees(formData: FormData): string[] {
  const raw = formData.get("assignee_ids")
  if (!raw || typeof raw !== "string") return []
  try { return JSON.parse(raw) } catch { return [] }
}

export async function createTask(formData: FormData) {
  const { user, viewer } = await requireTeamRole()
  const service = await createServiceClient()

  const parsed = taskSchema.safeParse({
    title:          formData.get("title"),
    body:           formData.get("body") || undefined,
    priority:       formData.get("priority") || "medium",
    due_date:       formData.get("due_date") || null,
    assignee_ids:   parseAssignees(formData),
    grant_id:       formData.get("grant_id") || null,
    stakeholder_id: formData.get("stakeholder_id") || null,
    visibility:          formData.get("visibility") || "team",
    min_level:           formData.get("min_level") || null,
    allowed_levels:      parseJson(formData.get("allowed_levels"), []),
    allowed_profile_ids: parseJson(formData.get("allowed_profile_ids"), []),
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  if (parsed.data.visibility !== "team" && !isTaskPrivileged(viewer)) {
    throw new Error("Only admins and directors can restrict who sees a task")
  }

  const { assignee_ids, visibility, min_level, allowed_levels, allowed_profile_ids, ...taskData } = parsed.data

  const { data: task, error } = await (service.from("team_tasks") as AnyTable)
    .insert({
      ...taskData,
      ...visibilityColumns({ visibility, min_level, allowed_levels, allowed_profile_ids }),
      created_by: user.id,
    })
    .select("id")
    .single()
  if (error) throw new Error(error.message)

  if (assignee_ids.length > 0) {
    await (service.from("task_assignments") as AnyTable)
      .insert(assignee_ids.map((profile_id: string) => ({ task_id: task.id, profile_id })))

    // Notify each assignee (skip the creator)
    const others = assignee_ids.filter((id: string) => id !== user.id)
    for (const userId of others) {
      try {
        await notifyUser({
          userId,
          type:   "task_assigned",
          title:  "You've been assigned a task",
          body:   parsed.data.title,
          link:   `/activity/tasks/${task.id}`,
          taskId: task.id,
        })
      } catch (err) {
        console.error("[createTask] notifyUser failed:", err)
      }
    }
  }

  revalidatePath("/activity")
  revalidatePath("/activity/recent")
  revalidatePath("/dashboard")
  redirect(`/activity/tasks/${task.id}`)
}

export async function updateTask(id: string, formData: FormData) {
  const { user, supabase, viewer } = await requireTeamRole()
  await assertCanAccessTask(supabase, id)
  const service = await createServiceClient()

  const parsed = taskSchema.safeParse({
    title:          formData.get("title"),
    body:           formData.get("body") || undefined,
    status:         formData.get("status") || "open",
    priority:       formData.get("priority") || "medium",
    due_date:       formData.get("due_date") || null,
    assignee_ids:   parseAssignees(formData),
    grant_id:       formData.get("grant_id") || null,
    stakeholder_id: formData.get("stakeholder_id") || null,
    visibility:          formData.get("visibility") || "team",
    min_level:           formData.get("min_level") || null,
    allowed_levels:      parseJson(formData.get("allowed_levels"), []),
    allowed_profile_ids: parseJson(formData.get("allowed_profile_ids"), []),
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { assignee_ids, visibility, min_level, allowed_levels, allowed_profile_ids, ...taskData } = parsed.data

  // Only admins and directors can change who sees a task; for everyone else the
  // existing setting is left exactly as it is.
  const visibilityPatch = isTaskPrivileged(viewer)
    ? visibilityColumns({ visibility, min_level, allowed_levels, allowed_profile_ids })
    : {}

  const { error } = await (service.from("team_tasks") as AnyTable)
    .update({ ...taskData, ...visibilityPatch, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)

  // Get previous assignees to only notify newly added ones
  const { data: prevAssignees } = await (service.from("task_assignments") as AnyTable)
    .select("profile_id")
    .eq("task_id", id)
  const prevIds = (prevAssignees ?? []).map((a: { profile_id: string }) => a.profile_id)

  await (service.from("task_assignments") as AnyTable).delete().eq("task_id", id)
  if (assignee_ids.length > 0) {
    await (service.from("task_assignments") as AnyTable)
      .insert(assignee_ids.map((profile_id: string) => ({ task_id: id, profile_id })))
  }

  // Notify only newly added assignees
  const newAssignees = assignee_ids.filter(
    (uid: string) => !prevIds.includes(uid) && uid !== user.id
  )
  for (const userId of newAssignees) {
    try {
      await notifyUser({
        userId,
        type:   "task_assigned",
        title:  "You've been assigned a task",
        body:   parsed.data.title,
        link:   `/activity/tasks/${id}`,
        taskId: id,
      })
    } catch (err) {
      console.error("[updateTask] notifyUser failed:", err)
    }
  }

  revalidatePath("/activity")
  revalidatePath("/activity/recent")
  revalidatePath(`/activity/tasks/${id}`)
  revalidatePath("/dashboard")
  redirect(`/activity/tasks/${id}`)
}

export async function closeTask(id: string) {
  const { user, supabase } = await requireTeamRole()
  await assertCanAccessTask(supabase, id)
  const service = await createServiceClient()
  const { error } = await (service.from("team_tasks") as AnyTable)
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  await notifyStatusChange(service, id, user.id, "done")
  revalidatePath("/activity")
  revalidatePath("/activity/recent")
  revalidatePath(`/activity/tasks/${id}`)
  revalidatePath("/dashboard")
}

export async function reopenTask(id: string) {
  const { user, supabase } = await requireTeamRole()
  await assertCanAccessTask(supabase, id)
  const service = await createServiceClient()
  const { error } = await (service.from("team_tasks") as AnyTable)
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  await notifyStatusChange(service, id, user.id, "open")
  revalidatePath("/activity")
  revalidatePath("/activity/recent")
  revalidatePath(`/activity/tasks/${id}`)
  revalidatePath("/dashboard")
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const { user, supabase } = await requireTeamRole()
  await assertCanAccessTask(supabase, id)
  const service = await createServiceClient()
  const { error } = await (service.from("team_tasks") as AnyTable)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  await notifyStatusChange(service, id, user.id, status)
  revalidatePath("/my-work")
  revalidatePath("/activity")
  revalidatePath("/activity/recent")
  revalidatePath(`/activity/tasks/${id}`)
  revalidatePath("/dashboard")
}

export async function deleteTask(id: string) {
  const { user, supabase } = await requireAuth()

  const { data: task } = await (supabase.from("team_tasks") as AnyTable)
    .select("created_by")
    .eq("id", id)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if ((task as { created_by?: string } | null)?.created_by !== user.id && (profile as { role?: string } | null)?.role !== "admin") {
    throw new Error("Insufficient permissions")
  }

  const service = await createServiceClient()
  const { error } = await (service.from("team_tasks") as AnyTable).delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/activity")
  revalidatePath("/activity/recent")
  revalidatePath("/dashboard")
  redirect("/activity")
}

export async function addComment(taskId: string, formData: FormData) {
  const { user, supabase } = await requireAuth()
  await assertCanAccessTask(supabase, taskId)
  const service = await createServiceClient()

  const parsed = commentSchema.safeParse({ body: formData.get("body") })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { error } = await (service.from("task_comments") as AnyTable)
    .insert({ task_id: taskId, author_id: user.id, body: parsed.data.body })
  if (error) throw new Error(error.message)

  // Notify task creator + all assignees except the commenter
  try {
    const [taskResult, assigneesResult, commenterResult] = await Promise.all([
      (service.from("team_tasks") as AnyTable).select("title, created_by").eq("id", taskId).single(),
      (service.from("task_assignments") as AnyTable).select("profile_id").eq("task_id", taskId),
      service.from("profiles").select("full_name").eq("id", user.id).single(),
    ])
    const task = taskResult.data as { title: string; created_by: string } | null
    const assigneeIds = ((assigneesResult.data ?? []) as { profile_id: string }[]).map((a) => a.profile_id)
    const commenterName = (commenterResult.data as { full_name?: string } | null)?.full_name ?? "Someone"
    const snippet = parsed.data.body.length > 80 ? `${parsed.data.body.slice(0, 80)}…` : parsed.data.body

    const recipients = [...new Set([task?.created_by, ...assigneeIds].filter(Boolean))] as string[]
    for (const userId of recipients.filter((id) => id !== user.id)) {
      await notifyUser({
        userId,
        type:   "comment_added",
        title:  `New comment on "${task?.title ?? "a task"}"`,
        body:   `${commenterName}: ${snippet}`,
        link:   `/activity/tasks/${taskId}`,
        taskId,
      }).catch((err) => console.error("[addComment] notify failed:", err))
    }
  } catch (err) {
    console.error("[addComment] notify lookup failed:", err)
  }

  revalidatePath(`/activity/tasks/${taskId}`)
}

export async function deleteComment(commentId: string, taskId: string) {
  const { user, supabase } = await requireAuth()

  const { data: comment } = await (supabase.from("task_comments") as AnyTable)
    .select("author_id")
    .eq("id", commentId)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if ((comment as { author_id?: string } | null)?.author_id !== user.id && (profile as { role?: string } | null)?.role !== "admin") {
    throw new Error("Insufficient permissions")
  }

  const service = await createServiceClient()
  await (service.from("task_comments") as AnyTable).delete().eq("id", commentId)
  revalidatePath(`/activity/tasks/${taskId}`)
}
