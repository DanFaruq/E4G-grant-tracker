import { cn } from "@/lib/utils"
import type { GrantStage } from "@/types/database"

const STAGE_LABELS: Record<GrantStage, string> = {
  discovered:  "Discovered",
  researching: "Researching",
  applying:    "Applying",
  submitted:   "Submitted",
  awarded:     "Awarded",
  rejected:    "Rejected",
}

const STAGE_CLASSES: Record<GrantStage, string> = {
  discovered:  "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
  researching: "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300",
  applying:    "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
  submitted:   "bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300",
  awarded:     "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
  rejected:    "bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-300",
}

const STAGE_DOTS: Record<GrantStage, string> = {
  discovered:  "bg-slate-400 dark:bg-slate-500",
  researching: "bg-blue-500",
  applying:    "bg-amber-500",
  submitted:   "bg-violet-500",
  awarded:     "bg-emerald-500",
  rejected:    "bg-red-500",
}

export function StageBadge({ stage }: { stage: GrantStage }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        STAGE_CLASSES[stage]
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", STAGE_DOTS[stage])} />
      {STAGE_LABELS[stage]}
    </span>
  )
}

export { STAGE_LABELS }
