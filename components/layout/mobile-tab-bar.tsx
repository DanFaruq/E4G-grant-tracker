"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Users2, Bell, MoreHorizontal } from "lucide-react"

const TABS = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Home"     },
  { href: "/grants",        icon: FileText,         label: "Grants"   },
  { href: "/stakeholders",  icon: Users2,           label: "Contacts" },
  { href: "/notifications", icon: Bell,             label: "Alerts"   },
  { href: "/settings",      icon: MoreHorizontal,   label: "More"     },
] as const

interface MobileTabBarProps {
  unreadCount?: number
}

export function MobileTabBar({ unreadCount = 0 }: MobileTabBarProps) {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
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
              className={`relative flex flex-col items-center gap-1 flex-1 py-2 transition-all duration-150 active:scale-90 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="relative">
                <Icon
                  className="size-[22px]"
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold tracking-tight">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
