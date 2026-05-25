import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { OrgSettingsForm } from "@/components/settings/org-settings-form"
import { TeamTable } from "@/components/settings/team-table"
import { SourcesTable } from "@/components/settings/sources-table"
import { ProfileForm } from "@/components/settings/profile-form"
import { PushSubscribeButton } from "@/components/push-subscribe-button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/database"

type SourceRow = {
  id: string; name: string; type: string; url: string | null
  enabled: boolean; last_fetched_at: string | null
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user?.id ?? "")
    .single() as { data: { role: UserRole; full_name: string | null } | null }

  const isAdmin = profile?.role === "admin"

  // Tabs available by role
  const allTabs = [
    { value: "profile",  label: "Profile"      },
    { value: "org",      label: "Organization", adminOnly: true },
    { value: "team",     label: "Team",         adminOnly: true },
    { value: "sources",  label: "Sources"       },
  ]
  const visibleTabs = allTabs.filter((t) => !t.adminOnly || isAdmin)

  // Default/validate tab
  const validValues = visibleTabs.map((t) => t.value)
  const tab = validValues.includes(tabParam ?? "") ? tabParam! : "profile"

  // Fetch data only for the active tab
  let orgSettings = null
  let team: { id: string; full_name: string | null; role: UserRole; email: string | null; created_at: string }[] = []
  let sources: SourceRow[] = []

  if (tab === "org" && isAdmin) {
    const { data } = await supabase.from("organization_settings").select("*").single()
    orgSettings = data
  }

  if (tab === "team" && isAdmin) {
    const service = await createServiceClient()
    const [profilesRes, authRes] = await Promise.allSettled([
      supabase.from("profiles").select("id, full_name, role, created_at").order("full_name"),
      service.auth.admin.listUsers({ perPage: 200 }),
    ])
    const profiles = profilesRes.status === "fulfilled" ? profilesRes.value.data : []
    const authUsers = authRes.status === "fulfilled" ? (authRes.value.data?.users ?? []) : []
    const emailMap = Object.fromEntries(authUsers.map((u) => [u.id, u.email ?? null]))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    team = ((profiles ?? []) as any[]).map((p) => ({ ...p, email: emailMap[p.id] ?? null }))
  }

  if (tab === "sources") {
    const { data } = await supabase
      .from("opportunity_sources")
      .select("id, name, type, url, enabled, last_fetched_at")
      .order("name")
    sources = (data ?? []) as SourceRow[]
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Settings" />
      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full animate-fade-up">

        {/* Page heading */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your profile, organisation, and team.</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-border mb-6">
          {visibleTabs.map((t) => (
            <Link
              key={t.value}
              href={`/settings?tab=${t.value}`}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t.value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Tab content */}
        {tab === "profile" && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-1">Your details</h3>
              <p className="text-xs text-muted-foreground mb-4">This is how you appear to the team.</p>
              <ProfileForm
                currentName={profile?.full_name ?? null}
                email={user?.email ?? null}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">Notifications</h3>
              <p className="text-xs text-muted-foreground mb-3">Get notified on this device when you&apos;re assigned to a task or event.</p>
              <PushSubscribeButton />
            </div>
          </div>
        )}

        {tab === "org" && isAdmin && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold mb-4">Organisation</h3>
            <OrgSettingsForm settings={orgSettings} />
          </div>
        )}

        {tab === "team" && isAdmin && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold mb-4">Team members</h3>
            <TeamTable team={team} />
          </div>
        )}

        {tab === "sources" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold mb-1">Discovery sources</h3>
            <p className="text-xs text-muted-foreground mb-4">
              RSS feeds and email inboxes that surface grant opportunities automatically.
            </p>
            <SourcesTable sources={sources} />
          </div>
        )}
      </div>
    </div>
  )
}
