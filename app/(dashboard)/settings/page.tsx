import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { redirect } from "next/navigation"
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

  if (profile?.role !== "admin") redirect("/dashboard")

  const [{ data: settings }, { data: team }, { data: sources }] = await Promise.all([
    supabase.from("organization_settings").select("*").single(),
    supabase.from("profiles").select("id, full_name, role, created_at").order("full_name"),
    supabase.from("opportunity_sources").select("id, name, type, url, enabled, last_fetched_at").order("name"),
  ])

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
