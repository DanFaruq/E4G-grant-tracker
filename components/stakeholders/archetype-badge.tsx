import { cn } from "@/lib/utils"
import type { StakeholderArchetype } from "@/types/database"

const CONFIG: Record<StakeholderArchetype, { label: string; className: string }> = {
  government:  { label: "Government",  className: "bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300"   },
  foundation:  { label: "Foundation",  className: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
  corporate:   { label: "Corporate",   className: "bg-amber-100  text-amber-800  dark:bg-amber-900/40  dark:text-amber-300"  },
  individual:  { label: "Individual",  className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  other:       { label: "Other",       className: "bg-slate-100  text-slate-700  dark:bg-slate-800      dark:text-slate-400"  },
}

interface ArchetypeBadgeProps {
  archetype: StakeholderArchetype
  size?: "sm" | "md"
  className?: string
}

export function ArchetypeBadge({ archetype, size = "md", className }: ArchetypeBadgeProps) {
  const { label, className: colorClass } = CONFIG[archetype]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
