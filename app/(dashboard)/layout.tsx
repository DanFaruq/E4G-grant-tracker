import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { RealtimeToasts } from "@/components/notifications/realtime-toasts"
import { InstallBanner } from "@/components/install-banner"
import type { UserRole } from "@/types/database"

type ProfileRow = { full_name: string; role: UserRole }

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single() as unknown as Promise<{ data: ProfileRow | null }>,
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
  ])

  return (
    <>
      <DashboardShell
        userName={profile?.full_name}
        userEmail={user.email}
        userRole={profile?.role}
        unreadCount={unreadCount ?? 0}
      >
        {/* pb-tab-bar: clears tab bar (4rem) + safe-area; resets to 0 at md+ */}
        <main className="flex-1 overflow-y-auto pb-tab-bar">
          <InstallBanner />
          {children}
        </main>
      </DashboardShell>
      <RealtimeToasts userId={user.id} />
    </>
  )
}
