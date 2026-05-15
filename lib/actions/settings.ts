"use server"

import { revalidatePath } from "next/cache"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { UserRole } from "@/types/database"

type ProfileRoleRow = { role: UserRole }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: ProfileRoleRow | null }
  if (profile?.role !== "admin") throw new Error("Admin only")
  return { user, supabase }
}

export async function updateOrgSettings(formData: FormData) {
  const { user } = await requireAdmin()
  const service = await createServiceClient()

  const focusAreasRaw = formData.get("focus_areas") as string
  const focusAreas = focusAreasRaw
    ? focusAreasRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  await (service.from("organization_settings") as AnyTable).update({
    org_name: formData.get("org_name") as string,
    mission_statement: (formData.get("mission_statement") as string) || null,
    focus_areas: focusAreas,
    ai_threshold: Number(formData.get("ai_threshold") ?? 70),
    grants_gov_query: (formData.get("grants_gov_query") as string) || null,
    slack_webhook_url: (formData.get("slack_webhook_url") as string) || null,
    updated_by: user.id,
  }).eq("id", 1)

  await (service.from("activity_history") as AnyTable).insert({
    actor_id: user.id,
    action: "settings.updated",
    metadata: { org_name: formData.get("org_name") },
  })

  revalidatePath("/settings")
}

export async function inviteUser(formData: FormData) {
  await requireAdmin()
  const service = await createServiceClient()

  const email = formData.get("email") as string
  const role = formData.get("role") as string

  const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
    data: { role },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/signup`,
  })

  if (error) throw new Error(error.message)

  // Pre-set role and use email as display name until the user signs up
  if (data.user?.id) {
    await (service.from("profiles") as AnyTable).upsert({
      id: data.user.id,
      full_name: email,   // shown as placeholder; overwritten when user sets their name
      role: role as "admin" | "team_member" | "viewer",
    })
  }

  revalidatePath("/settings")
}

export async function addOpportunitySource(formData: FormData) {
  await requireAdmin()
  const service = await createServiceClient()

  await (service.from("opportunity_sources") as AnyTable).insert({
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    url: (formData.get("url") as string) || null,
    enabled: true,
  })
  revalidatePath("/settings")
}

export async function toggleOpportunitySource(sourceId: string, enabled: boolean) {
  await requireAdmin()
  const service = await createServiceClient()
  await (service.from("opportunity_sources") as AnyTable).update({ enabled }).eq("id", sourceId)
  revalidatePath("/settings")
}

export async function deleteOpportunitySource(sourceId: string) {
  await requireAdmin()
  const service = await createServiceClient()
  await service.from("opportunity_sources").delete().eq("id", sourceId)
  revalidatePath("/settings")
}

export async function updateUserRole(userId: string, role: string) {
  const { user } = await requireAdmin()
  const service = await createServiceClient()

  await (service.from("profiles") as AnyTable).update({ role }).eq("id", userId)
  await (service.from("activity_history") as AnyTable).insert({
    actor_id: user.id,
    action: "user.role_changed",
    metadata: { user_id: userId, new_role: role },
  })
  revalidatePath("/settings")
}
