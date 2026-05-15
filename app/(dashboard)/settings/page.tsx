import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { OrgSettingsForm } from "@/components/settings/org-settings-form"
import { TeamTable } from "@/components/settings/team-table"
import { SourcesTable } from "@/components/settings/sources-table"
import type { UserRole } from "@/types/database"

type SourceRow = {
  id: string
  name: string
  type: string
  url: string | null
  enabled: boolean
  last_fetched_at: string | null
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single() as { data: { role: UserRole } | null }

  if (profile?.role !== "admin") {
    return (
      <div className="flex flex-col h-full">
        <Header title="Settings" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <p className="text-lg font-semibold mb-2">Access restricted</p>
            <p className="text-sm text-muted-foreground">
              Only admins can access settings. Contact your team admin to change your role.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const service = await createServiceClient()
  const [{ data: settings }, { data: profiles }, { data: sources }, authUsersResult] = await Promise.all([
    supabase.from("organization_settings").select("*").single(),
    supabase.from("profiles").select("id, full_name, role, created_at").order("full_name"),
    supabase.from("opportunity_sources").select("id, name, type, url, enabled, last_fetched_at").order("name"),
    service.auth.admin.listUsers({ perPage: 200 }),
  ])

  const emailMap = Object.fromEntries(
    (authUsersResult.data?.users ?? []).map((u) => [u.id, u.email ?? null])
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const team = ((profiles ?? []) as any[]).map((p) => ({ ...p, email: emailMap[p.id] ?? null }))

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-base font-semibold mb-4">Organisation</h2>
          <OrgSettingsForm settings={settings} />
        </div>
        <div>
          <h2 className="text-base font-semibold mb-4">Discovery Sources</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Add RSS feeds to discover grant opportunities automatically. Grants.gov is always active when a search query is set above.
          </p>
          <SourcesTable sources={(sources ?? []) as SourceRow[]} />
        </div>
        <div>
          <h2 className="text-base font-semibold mb-4">Team</h2>
          <TeamTable team={team ?? []} />
        </div>
      </div>
    </div>
  )
}
