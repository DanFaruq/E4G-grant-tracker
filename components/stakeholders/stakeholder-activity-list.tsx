"use client"

import { useTransition } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { Trash2, Phone, Mail, MessageSquare, CalendarDays, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StakeholderActivityForm } from "./stakeholder-activity-form"
import type { Database } from "@/types/database"

type ActivityRow = Database["public"]["Tables"]["stakeholder_activities"]["Row"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

type ActivityWithProfile = ActivityRow & { profile: Pick<ProfileRow, "full_name"> | null }

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  meeting:  CalendarDays,
  email:    Mail,
  call:     Phone,
  follow_up: MessageSquare,
  note:     FileText,
}

const ACTIVITY_LABELS: Record<string, string> = {
  meeting:  "Meeting",
  email:    "Email",
  call:     "Phone Call",
  follow_up: "Follow-up",
  note:     "Note",
}

interface StakeholderActivityListProps {
  activities: ActivityWithProfile[]
  onAdd: (formData: FormData) => Promise<void>
  onDelete: (activityId: string) => Promise<void>
  currentUserId: string
  isAdmin: boolean
}

export function StakeholderActivityList({
  activities,
  onAdd,
  onDelete,
  currentUserId,
  isAdmin,
}: StakeholderActivityListProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
        <StakeholderActivityForm onAdd={onAdd} />
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No activities logged yet. Log a meeting, call, or email to get started.
        </p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <ul className="space-y-4">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.activity_type] ?? FileText
              const canDelete = activity.user_id === currentUserId || isAdmin

              return (
                <li key={activity.id} className="flex gap-4 pl-0">
                  <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-card border border-border shadow-sm">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-foreground">
                          {ACTIVITY_LABELS[activity.activity_type]}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1.5">
                          by {activity.profile?.full_name ?? "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-[11px] text-muted-foreground"
                          title={format(new Date(activity.occurred_at), "PPpp")}
                        >
                          {formatDistanceToNow(new Date(activity.occurred_at), { addSuffix: true })}
                        </span>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 text-muted-foreground/40 hover:text-destructive"
                            onClick={() => startTransition(() => onDelete(activity.id))}
                            disabled={isPending}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {activity.notes && (
                      <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
