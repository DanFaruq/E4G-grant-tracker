import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { markNotificationsRead } from "@/lib/actions/grants"
import Link from "next/link"
import { Bell } from "lucide-react"
import type { NotificationType } from "@/types/database"

type NotificationRow = {
  id: string; user_id: string; type: NotificationType; title: string
  body: string | null; link: string | null; read: boolean
  grant_id: string | null; created_at: string
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  if (hrs < 48)  return "Yesterday"
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ""

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)

  const notifications = (data ?? []) as NotificationRow[]
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Notifications" />
      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full space-y-4 animate-fade-up">

        {/* Heading row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <form action={markNotificationsRead}>
              <Button variant="outline" size="sm" type="submit">
                Mark all read
              </Button>
            </form>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
            <Bell className="size-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/60">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-4 py-3.5 transition-colors ${
                  !n.read ? "bg-primary/[0.03]" : ""
                } ${n.link ? "hover:bg-muted/40 cursor-pointer" : ""}`}
              >
                {/* Unread dot */}
                <div className="mt-1.5 shrink-0 w-2 flex justify-center">
                  {!n.read && (
                    <span className="size-2 rounded-full bg-primary block" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {n.link ? (
                    <Link href={n.link} className="block hover:underline">
                      <p className="text-sm font-semibold leading-snug">{n.title}</p>
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold leading-snug">{n.title}</p>
                  )}
                  {n.body && (
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                  )}
                </div>

                {/* Time */}
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  {relativeTime(n.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
