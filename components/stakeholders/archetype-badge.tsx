import { cn } from "@/lib/utils"
import type { StakeholderArchetype, OrganizationType } from "@/types/database"

const ARCHETYPE_CONFIG: Record<StakeholderArchetype, { label: string; className: string }> = {
  partnership:           { label: "Partnership",          className: "bg-violet-100  text-violet-800  dark:bg-violet-900/40  dark:text-violet-300"  },
  funding:               { label: "Funding",              className: "bg-blue-100    text-blue-800    dark:bg-blue-900/40    dark:text-blue-300"    },
  technical_partner:     { label: "Technical Partner",    className: "bg-amber-100   text-amber-800   dark:bg-amber-900/40   dark:text-amber-300"   },
  implementing_partner:  { label: "Implementing Partner", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  government_partner:    { label: "Government Partner",   className: "bg-red-100     text-red-800     dark:bg-red-900/40     dark:text-red-300"     },
}

const ORG_TYPE_CONFIG: Record<OrganizationType, { label: string; className: string }> = {
  government:  { label: "Government",  className: "bg-sky-100    text-sky-800    dark:bg-sky-900/40    dark:text-sky-300"    },
  foundation:  { label: "Foundation",  className: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  corporate:   { label: "Corporate",   className: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  individual:  { label: "Individual",  className: "bg-teal-100   text-teal-800   dark:bg-teal-900/40   dark:text-teal-300"   },
  other:       { label: "Other",       className: "bg-slate-100  text-slate-700  dark:bg-slate-800      dark:text-slate-400"  },
}

interface ArchetypeBadgeProps {
  archetype: StakeholderArchetype
  size?: "sm" | "md"
  className?: string
}

interface OrgTypeBadgeProps {
  organizationType: OrganizationType
  size?: "sm" | "md"
  className?: string
}

export function ArchetypeBadge({ archetype, size = "md", className }: ArchetypeBadgeProps) {
  const { label, className: colorClass } = ARCHETYPE_CONFIG[archetype] ?? { label: archetype, className: "bg-slate-100 text-slate-700" }
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

export function OrgTypeBadge({ organizationType, size = "md", className }: OrgTypeBadgeProps) {
  const { label, className: colorClass } = ORG_TYPE_CONFIG[organizationType] ?? { label: organizationType, className: "bg-slate-100 text-slate-700" }
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
