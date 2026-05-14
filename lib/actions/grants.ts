"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import type { GrantStage, UserRole } from "@/types/database"

type ProfileRoleRow = { role: UserRole }
type GrantIdRow = { id: string }
type GrantStageRow = { stage: GrantStage }

async function requireRole(...roles: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: ProfileRoleRow | null }
  if (!profile || !roles.includes(profile.role)) {
    throw new Error("Insufficient permissions")
  }
  return { supabase, user, profile }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

async function logActivity(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  action: string,
  grantId: string | null,
  actorId: string | null,
  metadata?: Record<string, unknown>
) {
  await (supabase.from("activity_history") as AnyTable).insert({
    action,
    grant_id: grantId,
    actor_id: actorId,
    metadata: metadata ?? null,
  })
}

export async function createGrant(formData: FormData) {
  const { supabase: _supabase, user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const payload = {
    name: formData.get("name") as string,
    funder: formData.get("funder") as string,
    stage: (formData.get("stage") as GrantStage) ?? "discovered",
    deadline: (formData.get("deadline") as string) || null,
    amount_min: formData.get("amount_min") ? Number(formData.get("amount_min")) : null,
    amount_max: formData.get("amount_max") ? Number(formData.get("amount_max")) : null,
    amount_exact: formData.get("amount_exact") ? Number(formData.get("amount_exact")) : null,
    category: (formData.get("category") as string) || null,
    description: (formData.get("description") as string) || null,
    funder_website: (formData.get("funder_website") as string) || null,
    application_url: (formData.get("application_url") as string) || null,
    created_by: user.id,
  }

  const { data: grant, error } = await (service.from("grants") as AnyTable)
    .insert(payload)
    .select("id")
    .single() as { data: GrantIdRow | null; error: { message: string } | null }

  if (error) throw new Error(error.message)

  const assignees = formData.getAll("assignees") as string[]
  if (assignees.length > 0) {
    await (service.from("grant_assignees") as AnyTable).insert(
      assignees.map((uid) => ({ grant_id: (grant as GrantIdRow).id, user_id: uid }))
    )
  }

  await logActivity(service, "grant.created", (grant as GrantIdRow).id, user.id, { name: payload.name })
  revalidatePath("/grants")
  redirect(`/grants/${(grant as GrantIdRow).id}`)
}

export async function updateGrant(grantId: string, formData: FormData) {
  const { user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const { data: prev } = await (service.from("grants") as AnyTable)
    .select("stage")
    .eq("id", grantId)
    .single() as { data: GrantStageRow | null }

  const updates = {
    name: formData.get("name") as string,
    funder: formData.get("funder") as string,
    stage: formData.get("stage") as GrantStage,
    deadline: (formData.get("deadline") as string) || null,
    amount_min: formData.get("amount_min") ? Number(formData.get("amount_min")) : null,
    amount_max: formData.get("amount_max") ? Number(formData.get("amount_max")) : null,
    amount_exact: formData.get("amount_exact") ? Number(formData.get("amount_exact")) : null,
    category: (formData.get("category") as string) || null,
    description: (formData.get("description") as string) || null,
    funder_website: (formData.get("funder_website") as string) || null,
    application_url: (formData.get("application_url") as string) || null,
  }

  const { error } = await (service.from("grants") as AnyTable).update(updates).eq("id", grantId)
  if (error) throw new Error(error.message)

  const action = prev?.stage !== updates.stage ? "stage.changed" : "grant.updated"
  const metadata = prev?.stage !== updates.stage
    ? { from: prev?.stage, to: updates.stage }
    : { name: updates.name }

  await logActivity(service, action, grantId, user.id, metadata)
  revalidatePath(`/grants/${grantId}`)
  revalidatePath("/grants")
  redirect(`/grants/${grantId}`)
}

export async function archiveGrant(grantId: string) {
  const { user } = await requireRole("admin")
  const service = await createServiceClient()

  await (service.from("grants") as AnyTable).update({ archived: true }).eq("id", grantId)
  await logActivity(service, "grant.archived", grantId, user.id)
  revalidatePath("/grants")
  redirect("/grants")
}

export async function addNote(grantId: string, body: string) {
  const { user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  await (service.from("progress_notes") as AnyTable).insert({
    grant_id: grantId,
    author_id: user.id,
    body,
  })
  await logActivity(service, "note.added", grantId, user.id)
  revalidatePath(`/grants/${grantId}`)
}

export async function deleteNote(noteId: string, grantId: string) {
  const { user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  await service.from("progress_notes").delete().eq("id", noteId)
  await logActivity(service, "note.deleted", grantId, user.id)
  revalidatePath(`/grants/${grantId}`)
}

export async function addMilestone(grantId: string, title: string, dueDate: string) {
  const { user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  await (service.from("milestones") as AnyTable).insert({
    grant_id: grantId,
    title,
    due_date: dueDate,
    created_by: user.id,
  })
  revalidatePath(`/grants/${grantId}`)
}

export async function toggleMilestone(milestoneId: string, grantId: string, completed: boolean) {
  const { user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  await (service.from("milestones") as AnyTable).update({
    completed,
    completed_at: completed ? new Date().toISOString() : null,
    completed_by: completed ? user.id : null,
  }).eq("id", milestoneId)

  if (completed) {
    await logActivity(service, "milestone.completed", grantId, user.id)
  }
  revalidatePath(`/grants/${grantId}`)
}

export async function updateGrantStage(grantId: string, stage: GrantStage) {
  const { user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const { data: prev } = await (service.from("grants") as AnyTable)
    .select("stage")
    .eq("id", grantId)
    .single() as { data: GrantStageRow | null }

  const { error } = await (service.from("grants") as AnyTable)
    .update({ stage })
    .eq("id", grantId)
  if (error) throw new Error(error.message)

  await logActivity(service, "stage.changed", grantId, user.id, {
    from: prev?.stage,
    to: stage,
  })
  revalidatePath("/grants/kanban")
  revalidatePath(`/grants/${grantId}`)
}

export async function markNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const service = await createServiceClient()
  await (service.from("notifications") as AnyTable)
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("read", false)
  revalidatePath("/notifications")
  revalidatePath("/dashboard")
}
