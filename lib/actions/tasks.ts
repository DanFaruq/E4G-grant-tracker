"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { taskSchema, commentSchema } from "@/lib/validators/tasks"

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

  await (service.from("task_assignments") as AnyTable).delete().eq("task_id", id)
  if (assignee_ids.length > 0) {
    await (service.from("task_assignments") as AnyTable)
      .insert(assignee_ids.map((profile_id: string) => ({ task_id: id, profile_id })))
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
