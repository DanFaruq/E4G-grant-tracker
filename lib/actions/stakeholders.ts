"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { stakeholderSchema, activitySchema } from "@/lib/validators/stakeholders"
import type { UserRole } from "@/types/database"

type ProfileRoleRow = { role: UserRole }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

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
  return { user, profile }
}

export async function createStakeholder(formData: FormData) {
  const { user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const raw = {
    name: formData.get("name") as string,
    title: (formData.get("title") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    organization: (formData.get("organization") as string) || undefined,
    archetype: formData.get("archetype") as string,
    linkedin_url: (formData.get("linkedin_url") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  }

  const parsed = stakeholderSchema.safeParse(raw)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { data: stakeholder, error } = await (service.from("stakeholders") as AnyTable)
    .insert({ ...parsed.data, created_by: user.id })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/stakeholders")
  redirect(`/stakeholders/${(stakeholder as { id: string }).id}`)
}

export async function updateStakeholder(stakeholderId: string, formData: FormData) {
  await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const raw = {
    name: formData.get("name") as string,
    title: (formData.get("title") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    organization: (formData.get("organization") as string) || undefined,
    archetype: formData.get("archetype") as string,
    linkedin_url: (formData.get("linkedin_url") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  }

  const parsed = stakeholderSchema.safeParse(raw)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { error } = await (service.from("stakeholders") as AnyTable)
    .update(parsed.data)
    .eq("id", stakeholderId)

  if (error) throw new Error(error.message)

  revalidatePath("/stakeholders")
  revalidatePath(`/stakeholders/${stakeholderId}`)
  redirect(`/stakeholders/${stakeholderId}`)
}

export async function deleteStakeholder(stakeholderId: string) {
  await requireRole("admin")
  const service = await createServiceClient()

  const { error } = await (service.from("stakeholders") as AnyTable)
    .delete()
    .eq("id", stakeholderId)

  if (error) throw new Error(error.message)

  revalidatePath("/stakeholders")
  redirect("/stakeholders")
}

export async function addStakeholderActivity(stakeholderId: string, formData: FormData) {
  const { user } = await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const raw = {
    activity_type: formData.get("activity_type") as string,
    notes: formData.get("notes") as string,
    occurred_at: (formData.get("occurred_at") as string) || undefined,
  }

  const parsed = activitySchema.safeParse(raw)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { error } = await (service.from("stakeholder_activities") as AnyTable).insert({
    stakeholder_id: stakeholderId,
    user_id: user.id,
    activity_type: parsed.data.activity_type,
    notes: parsed.data.notes,
    occurred_at: parsed.data.occurred_at ?? new Date().toISOString(),
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/stakeholders/${stakeholderId}`)
}

export async function deleteStakeholderActivity(activityId: string, stakeholderId: string) {
  await requireRole("admin", "team_member")
  const service = await createServiceClient()

  const { error } = await (service.from("stakeholder_activities") as AnyTable)
    .delete()
    .eq("id", activityId)

  if (error) throw new Error(error.message)

  revalidatePath(`/stakeholders/${stakeholderId}`)
}
