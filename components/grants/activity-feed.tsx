import { formatDate } from "@/lib/utils"

interface Activity {
  id: string
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
  profiles: { id: string; full_name: string } | null
}

const ACTION_LABELS: Record<string, string> = {
  "grant.created":        "created this grant",
  "grant.updated":        "updated this grant",
  "grant.archived":       "archived this grant",
  "stage.changed":        "changed the stage",
  "note.added":           "added a note",
  "note.deleted":         "deleted a note",
  "document.uploaded":    "uploaded a document",
  "document.deleted":     "deleted a document",
  "milestone.completed":  "completed a milestone",
  "opportunity.promoted": "promoted from opportunities",
}

function stageLabel(action: Activity) {
  if (action.action !== "stage.changed" || !action.metadata) return ACTION_LABELS[action.action] ?? action.action
  const m = action.metadata as { from?: string; to?: string }
  return `changed stage from ${m.from ?? "?"} → ${m.to ?? "?"}`
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>
  }

  return (
    <div className="space-y-3">
      {sorted.map((a) => (
        <div key={a.id} className="flex items-start gap-3 text-sm">
          <div className="mt-1 size-2 rounded-full bg-primary shrink-0" />
          <div>
            <span className="font-medium">{a.profiles?.full_name ?? "System"}</span>{" "}
            <span className="text-muted-foreground">{stageLabel(a)}</span>
            <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
