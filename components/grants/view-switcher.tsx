"use client"

import Link from "next/link"
import { List, Columns3, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

type View = "list" | "kanban" | "calendar"

const views: { value: View; href: string; label: string; icon: React.ElementType }[] = [
  { value: "list",     href: "/grants",          label: "List",     icon: List },
  { value: "kanban",   href: "/grants/kanban",   label: "Kanban",   icon: Columns3 },
  { value: "calendar", href: "/grants/calendar", label: "Calendar", icon: CalendarDays },
]

export function GrantViewSwitcher({ active }: { active: View }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-1 gap-0.5">
      {views.map(({ value, href, label, icon: Icon }) => (
        <Link
          key={value}
          href={href}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
            active === value
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          )}
        >
          <Icon className="size-3.5 shrink-0" />
          {label}
        </Link>
      ))}
    </div>
  )
}
