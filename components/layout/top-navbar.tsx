"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useState, useRef, useEffect } from "react"
import { Bell, Settings, ChevronDown, LogOut, User, LayoutDashboard, FileText, Users2, Activity, Inbox, ListTodo } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/types/database"

const NAV_LINKS = [
  { href: "/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { href: "/grants",        label: "Grants",       icon: FileText        },
  { href: "/stakeholders",  label: "Stakeholders", icon: Users2          },
  { href: "/activity",      label: "Team Tasks",   icon: Activity        },
  { href: "/my-work",       label: "My Work",      icon: ListTodo        },
  { href: "/opportunities", label: "Opportunities",icon: Inbox           },
]

type Props = {
  userName?: string | null
  userEmail?: string | null
  userRole?: UserRole | null
  unreadCount?: number
}

export function TopNavbar({ userName, userEmail, userRole, unreadCount = 0 }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

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
    <header className="hidden md:flex h-14 shrink-0 items-center border-b border-sidebar-border bg-sidebar text-sidebar-foreground px-4 gap-2 z-40">
      <div className="flex items-center gap-2 w-full max-w-screen-xl mx-auto">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 mr-3">
        <img src="/e4g-logo.jpeg" alt="E4G" width={32} height={32} className="size-8 rounded-lg object-contain" />
        <div className="hidden lg:block">
          <p className="text-sm font-bold leading-none text-sidebar-foreground">E4G Team</p>
          <p className="text-[10px] text-sidebar-foreground/40 mt-0.5">Evidence for Good</p>
        </div>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap",
                "transition-all duration-200 ease-out",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-0.5 hover:-translate-y-0.5"
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0 transition-transform duration-200",
                  isActive ? "opacity-100" : "opacity-60 group-hover:scale-110 group-hover:opacity-100"
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Bell */}
        <Link
          href="/notifications"
          className="relative flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex size-[14px] items-center justify-center rounded-full bg-destructive text-white text-[8px] font-bold leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all"
        >
          <Settings className="size-4" />
        </Link>

        {/* User menu */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-sidebar-accent/60 transition-all"
          >
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-transform duration-150 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.175 38) 0%, oklch(0.50 0.185 30) 100%)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              {initials}
            </div>
            <div className="hidden lg:flex flex-col items-start">
              <span className="text-xs font-semibold text-sidebar-foreground leading-none truncate max-w-[120px]">
                {userName ?? "User"}
              </span>
              <span className="text-[10px] text-sidebar-foreground/40 mt-0.5">{roleLabel}</span>
            </div>
            <ChevronDown
              className={cn(
                "size-3 text-sidebar-foreground/40 transition-transform duration-150",
                menuOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl z-50 overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.65 0.175 38) 0%, oklch(0.50 0.185 30) 100%)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                  }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                  {userEmail && (
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  )}
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/settings?tab=profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User className="size-4 text-muted-foreground" />
                  Your profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  Settings
                </Link>
              </div>

              {/* Theme */}
              <div className="px-4 py-3 border-t border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Theme
                </p>
                <div className="flex items-center rounded-lg bg-muted p-0.5 gap-0.5">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                        theme === t
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sign out */}
              <div className="border-t border-border py-1">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  )
}
