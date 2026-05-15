import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { MobileSidebarToggle } from "./mobile-sidebar-toggle"

export async function Header({ title }: { title?: string }) {
  let count: number | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const result = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
      count = result.count
    }
  } catch {
    // Non-fatal — badge just won't show an unread count
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4">
      <MobileSidebarToggle />
      <h1 className="flex-1 text-base font-semibold tracking-tight text-foreground truncate">{title}</h1>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="relative size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
        >
          <Link href="/notifications">
            <Bell className="size-4" />
            {(count ?? 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold leading-none">
                {count! > 9 ? "9+" : count}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
