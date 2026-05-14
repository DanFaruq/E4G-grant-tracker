"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

type OppRow = {
  title: string
  funder: string | null
  description: string | null
  deadline: string | null
  url: string | null
}

async function requireTeamMember() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return { user, supabase }
}

export async function promoteOpportunity(oppId: string) {
  const { user } = await requireTeamMember()
  const service = await createServiceClient()

  const { data: opp } = await service
    .from("opportunities")
    .select("title, funder, description, deadline, url")
    .eq("id", oppId)
    .single() as { data: OppRow | null }

  if (!opp) throw new Error("Opportunity not found")

  const { data: grant, error } = await (service.from("grants") as AnyTable)
    .insert({
      name: opp.title,
      funder: opp.funder ?? "Unknown",
      stage: "discovered",
      deadline: opp.deadline,
      description: opp.description,
      application_url: opp.url,
      created_by: user.id,
      promoted_from_opportunity: oppId,
    })
    .select("id")
    .single() as { data: { id: string } | null; error: { message: string } | null }

  if (error) throw new Error(error.message)

  await (service.from("opportunities") as AnyTable).update({
    status: "promoted",
    promoted_grant_id: grant!.id,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", oppId)

  await (service.from("activity_history") as AnyTable).insert({
    grant_id: grant!.id,
    actor_id: user.id,
    action: "opportunity.promoted",
    metadata: { opportunity_id: oppId, title: opp.title },
  })

  revalidatePath("/opportunities")
  redirect(`/grants/${grant!.id}/edit`)
}

export async function dismissOpportunity(oppId: string) {
  const { user } = await requireTeamMember()
  const service = await createServiceClient()

  await (service.from("opportunities") as AnyTable).update({
    status: "dismissed",
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", oppId)

  revalidatePath("/opportunities")
}
