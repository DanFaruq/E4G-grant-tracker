"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, ListTodo, Users2, MoreHorizontal } from "lucide-react"

const TABS = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Home"     },
  { href: "/grants",       icon: FileText,         label: "Grants"   },
  { href: "/my-work",      icon: ListTodo,         label: "My Work"  },
  { href: "/stakeholders", icon: Users2,           label: "Contacts" },
  { href: "/settings",     icon: MoreHorizontal,   label: "More"     },
] as const

export function MobileTabBar() {
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

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 flex-1 py-2 transition-all duration-150 active:scale-90 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon
                className="size-[22px]"
                strokeWidth={isActive ? 2.5 : 1.75}
              />
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
