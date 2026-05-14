import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { RealtimeToasts } from "@/components/notifications/realtime-toasts"
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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        userName={profile?.full_name}
        userRole={profile?.role}
        unreadCount={unreadCount ?? 0}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <RealtimeToasts userId={user.id} />
    </div>
  )
}
