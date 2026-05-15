"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Bell,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import type { UserRole } from "@/types/database"
import { useSidebar } from "./sidebar-context"

function E4GLogoMark() {
  return (
    <img
      src="/e4g-logo.jpeg"
      alt="Evidence for Good"
      width={36}
      height={36}
      className="shrink-0 size-9 object-contain rounded-lg"
    />
  )
}

const nav = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard, badge: false },
  { href: "/grants",        label: "Grants",        icon: FileText,         badge: false },
  { href: "/opportunities", label: "Opportunities", icon: Inbox,            badge: false },
  { href: "/notifications", label: "Notifications", icon: Bell,             badge: true  },
  { href: "/settings",      label: "Settings",      icon: Settings,         badge: false },
]

type SidebarProps = {
  userName?: string | null
  userRole?: UserRole | null
  unreadCount?: number
}

export function Sidebar({ userName, userRole, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { open, close } = useSidebar()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = userName
    ? userName.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U"

  const roleLabel =
    userRole === "admin"
      ? "Admin"
      : userRole === "team_member"
      ? "Team Member"
      : "Viewer"

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        "w-[240px] shrink-0",
        // Mobile: fixed overlay with slide animation
        "fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-in-out",
        // Desktop: static in normal flex flow, no animation
        "md:static md:z-auto md:h-full md:transition-none",
        // Visibility
        open ? "translate-x-0" : "-translate-x-full md:hidden"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-sidebar-border">
        <Link
          href="/dashboard"
          onClick={close}
          className="flex items-center gap-2.5 min-w-0"
        >
          <E4GLogoMark />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold leading-none tracking-tight text-sidebar-foreground">
              E4G Grants
            </span>
            <span className="text-[11px] text-sidebar-foreground/45 leading-tight mt-0.5 font-normal">
              Evidence for Good
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, badge }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href))
          const count = badge ? unreadCount : 0

          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 inset-y-2.5 w-0.5 rounded-r-full bg-sidebar-primary" />
              )}
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isActive ? "text-sidebar-primary" : ""
                )}
              />
              <span className="flex-1 truncate">{label}</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1 leading-none">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary text-[11px] font-semibold leading-none ring-1 ring-primary/20">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-none text-sidebar-foreground truncate">
              {userName ?? "User"}
            </p>
            <p className="text-[11px] text-sidebar-foreground/45 mt-0.5">{roleLabel}</p>
          </div>
          <ThemeToggle />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 h-8 text-sm font-medium text-sidebar-foreground/55 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground rounded-lg px-2.5"
          onClick={handleSignOut}
        >
          <LogOut className="size-3.5 shrink-0" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
