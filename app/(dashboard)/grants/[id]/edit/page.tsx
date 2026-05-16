import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { GrantForm } from "@/components/grants/grant-form"
import { updateGrant } from "@/lib/actions/grants"
import type { GrantStage, UserRole } from "@/types/database"

type GrantRow = {
  id: string; name: string; funder: string; stage: GrantStage; deadline: string | null
  amount_min: number | null; amount_max: number | null; amount_exact: number | null
  category: string | null; description: string | null
  funder_website: string | null; application_url: string | null
}
type ProfileRow = { id: string; full_name: string }
type AssigneeRow = { user_id: string }

export default async function EditGrantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const profileResult = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single()
  const profile = profileResult.data as { role: UserRole } | null

  if (!profile || !["admin", "team_member"].includes(profile.role)) {
    redirect(`/grants/${id}`)
  }

  const [grantResult, profilesResult, assigneesResult] = await Promise.all([
    supabase.from("grants")
      .select("id, name, funder, stage, deadline, amount_min, amount_max, amount_exact, category, description, funder_website, application_url")
      .eq("id", id).single(),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("grant_assignees").select("user_id").eq("grant_id", id),
  ])

  const grant = grantResult.data as GrantRow | null
  const profiles = profilesResult.data as ProfileRow[] | null
  const assignees = assigneesResult.data as AssigneeRow[] | null

  if (!grant) notFound()

  const updateWithId = updateGrant.bind(null, id)

  return (
    <div className="flex flex-col min-h-full">
      <Header title={`Edit — ${grant.name}`} />
      <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
        <GrantForm
          profiles={profiles ?? []}
          action={updateWithId}
          defaultValues={{
            name: grant.name,
            funder: grant.funder,
            stage: grant.stage,
            deadline: grant.deadline ?? undefined,
            amount_min: grant.amount_min,
            amount_max: grant.amount_max,
            amount_exact: grant.amount_exact,
            category: grant.category,
            description: grant.description,
            funder_website: grant.funder_website,
            application_url: grant.application_url,
            assignee_ids: assignees?.map((a) => a.user_id) ?? [],
          }}
          submitLabel="Save changes"
        />
      </div>
    </div>
  )
}
