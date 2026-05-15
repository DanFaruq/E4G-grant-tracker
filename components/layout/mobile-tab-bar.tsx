"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Columns3, Inbox, Bell } from "lucide-react"

const TABS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/grants", icon: FileText, label: "Grants" },
  { href: "/grants/kanban", icon: Columns3, label: "Board" },
  { href: "/opportunities", icon: Inbox, label: "Discover" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
] as const

interface MobileTabBarProps {
  unreadCount?: number
}

export function MobileTabBar({ unreadCount = 0 }: MobileTabBarProps) {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Floating pill container */}
      <div className="mx-3 mb-3 rounded-2xl border border-border/60 bg-card/95 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-around px-1 py-2">
          {TABS.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href)
            const showBadge = href === "/notifications" && unreadCount > 0

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 active:scale-90 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {/* Active pill background */}
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-primary/10" />
                )}

                {/* Icon + badge */}
                <span className="relative">
                  <Icon
                    className="size-[22px] relative z-10"
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none z-20">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>

                <span className={`text-[10px] font-semibold relative z-10 tracking-tight ${isActive ? "text-primary" : ""}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
