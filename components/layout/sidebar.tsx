"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutDashboard, FileText, Inbox,
  Bell, Settings, LogOut, Users2, Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
  { href: "/stakeholders",  label: "Stakeholders",  icon: Users2,           badge: false },
  { href: "/activity",      label: "Team Tasks",    icon: Activity,         badge: false },
  { href: "/opportunities", label: "Opportunities", icon: Inbox,            badge: false },
  { href: "/notifications", label: "Notifications", icon: Bell,             badge: true  },
  { href: "/settings",      label: "Settings",      icon: Settings,         badge: false },
]

type SidebarProps = {
  userName?: string | null
  userRole?: UserRole | null
  unreadCount?: number
}

function ThemePills() {
  const { theme, setTheme } = useTheme()
  const options = [
    { value: "light", label: "Light" },
    { value: "dark",  label: "Dark"  },
    { value: "system",label: "System"},
  ]
  return (
    <div className="flex items-center rounded-xl bg-sidebar-accent/50 p-1 gap-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setTheme(o.value)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition-all duration-150",
            theme === o.value
              ? "bg-card text-foreground shadow-sm"
              : "text-sidebar-foreground/45 hover:text-sidebar-foreground/70"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
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
    userRole === "admin" ? "Admin"
    : userRole === "team_member" ? "Team Member"
    : "Viewer"

  return (
    <>
      {/* Backdrop — mobile only, closes drawer on tap */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-[54] bg-black/50 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        "w-[240px] shrink-0",
        "md:hidden fixed inset-y-0 left-0 z-[55] transition-transform duration-200 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-sidebar-border">
        <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5 min-w-0">
          <E4GLogoMark />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold leading-none tracking-tight text-sidebar-foreground">
              E4G Team
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
                className={cn("size-4 shrink-0", isActive ? "text-sidebar-primary" : "")}
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

      {/* Bottom section — theme + user; safe-area padding clears device gesture bar */}
      <div
        className="border-t border-sidebar-border p-3 space-y-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Pill theme toggle */}
        <ThemePills />

        {/* User row */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold leading-none">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-none text-sidebar-foreground truncate">
              {userName ?? "User"}
            </p>
            <p className="text-[11px] text-sidebar-foreground/45 mt-0.5">{roleLabel}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </aside>
    </>
  )
}
