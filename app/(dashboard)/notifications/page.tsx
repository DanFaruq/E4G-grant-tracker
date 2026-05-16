import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { markNotificationsRead } from "@/lib/actions/grants"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Bell } from "lucide-react"
import type { NotificationType } from "@/types/database"

type NotificationRow = {
  id: string; user_id: string; type: NotificationType; title: string
  body: string | null; link: string | null; read: boolean; read_at: string | null
  grant_id: string | null; opportunity_id: string | null; created_at: string
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ""

  const result = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)
  const notifications = result.data as NotificationRow[] | null

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Notifications" />
      <div className="flex-1 p-6 space-y-4">
        {unreadCount > 0 && (
          <div className="flex justify-end">
            <form action={markNotificationsRead}>
              <Button variant="outline" size="sm" type="submit">
                Mark all as read
              </Button>
            </form>
          </div>
        )}

        {!notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="size-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card divide-y">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 flex items-start gap-3 ${!n.read ? "bg-primary/5" : ""}`}
              >
                {!n.read && (
                  <span className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
                )}
                <div className={`flex-1 ${n.read ? "pl-5" : ""}`}>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{formatDate(n.created_at)}</span>
                    {n.link && (
                      <Link href={n.link} className="text-xs text-primary hover:underline">
                        View â†’
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
