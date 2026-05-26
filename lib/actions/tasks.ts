"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { taskSchema, commentSchema } from "@/lib/validators/tasks"
import { notifyUser } from "@/lib/actions/notifications"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return { user, supabase }
}

function parseAssignees(formData: FormData): string[] {
  const raw = formData.get("assignee_ids")
  if (!raw || typeof raw !== "string") return []
  try { return JSON.parse(raw) } catch { return [] }
}

export async function createTask(formData: FormData) {
  const { user } = await requireAuth()
  const service = await createServiceClient()

  const parsed = taskSchema.safeParse({
    title:          formData.get("title"),
    body:           formData.get("body") || undefined,
    priority:       formData.get("priority") || "medium",
    due_date:       formData.get("due_date") || null,
    assignee_ids:   parseAssignees(formData),
    grant_id:       formData.get("grant_id") || null,
    stakeholder_id: formData.get("stakeholder_id") || null,
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { assignee_ids, ...taskData } = parsed.data

  const { data: task, error } = await (service.from("team_tasks") as AnyTable)
    .insert({ ...taskData, created_by: user.id })
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
  redirect(`/activity/tasks/${task.id}`)
}

export async function updateTask(id: string, formData: FormData) {
  await requireAuth()
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
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { assignee_ids, ...taskData } = parsed.data

  const { error } = await (service.from("team_tasks") as AnyTable)
    .update({ ...taskData, updated_at: new Date().toISOString() })
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
  const { user } = await requireAuth()
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
  revalidatePath(`/activity/tasks/${id}`)
  redirect(`/activity/tasks/${id}`)
}

export async function closeTask(id: string) {
  await requireAuth()
  const service = await createServiceClient()
  const { error } = await (service.from("team_tasks") as AnyTable)
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/activity")
  revalidatePath(`/activity/tasks/${id}`)
}

export async function reopenTask(id: string) {
  await requireAuth()
  const service = await createServiceClient()
  const { error } = await (service.from("team_tasks") as AnyTable)
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/activity")
  revalidatePath(`/activity/tasks/${id}`)
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
  redirect("/activity")
}

export async function addComment(taskId: string, formData: FormData) {
  const { user } = await requireAuth()
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
