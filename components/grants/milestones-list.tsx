"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate, daysUntil } from "@/lib/utils"
import { addMilestone, toggleMilestone } from "@/lib/actions/grants"
import { toast } from "sonner"
import { CheckCircle2, Circle, AlertCircle } from "lucide-react"

interface Milestone {
  id: string
  title: string
  due_date: string
  completed: boolean
  completed_at: string | null
}

export function MilestonesList({
  grantId,
  milestones,
  canEdit,
}: {
  grantId: string
  milestones: Milestone[]
  canEdit: boolean
}) {
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [isPending, startTransition] = useTransition()

  const sorted = [...milestones].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )

  function handleAdd() {
    if (!title.trim() || !dueDate) return
    startTransition(async () => {
      try {
        await addMilestone(grantId, title.trim(), dueDate)
        setTitle("")
        setDueDate("")
        toast.success("Milestone added")
      } catch {
        toast.error("Failed to add milestone")
      }
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      try {
        await toggleMilestone(id, grantId, !current)
      } catch {
        toast.error("Failed to update milestone")
      }
    })
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex gap-2">
          <Input
            placeholder="Milestone title (e.g. Letter of Intent)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
          />
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-40"
          />
          <Button size="sm" onClick={handleAdd} disabled={isPending || !title.trim() || !dueDate}>
            Add
          </Button>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No milestones yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((m) => {
            const days = daysUntil(m.due_date)
            const overdue = !m.completed && days !== null && days < 0
            const urgent = !m.completed && days !== null && days <= 7 && days >= 0
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  m.completed ? "opacity-60" : overdue ? "border-destructive/50" : ""
                }`}
              >
                {canEdit ? (
                  <button
                    onClick={() => handleToggle(m.id, m.completed)}
                    disabled={isPending}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {m.completed
                      ? <CheckCircle2 className="size-5 text-green-500" />
                      : <Circle className="size-5" />}
                  </button>
                ) : (
                  <span className="shrink-0">
                    {m.completed
                      ? <CheckCircle2 className="size-5 text-green-500" />
                      : <Circle className="size-5 text-muted-foreground" />}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.completed ? "line-through" : ""}`}>
                    {m.title}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs">
                  {overdue && <AlertCircle className="size-3 text-destructive" />}
                  <span className={overdue ? "text-destructive" : urgent ? "text-amber-600" : "text-muted-foreground"}>
                    {formatDate(m.due_date)}
                    {!m.completed && days !== null && (
                      <span className="ml-1">
                        ({days === 0 ? "today" : days > 0 ? `${days}d` : `${Math.abs(days)}d overdue`})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
