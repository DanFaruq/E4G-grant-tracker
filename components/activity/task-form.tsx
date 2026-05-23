"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { createTask, updateTask } from "@/lib/actions/tasks"
import Link from "next/link"
import type { TaskStatus, TaskPriority } from "@/types/database"

type Profile = { id: string; full_name: string }
type Grant = { id: string; name: string }
type Stakeholder = { id: string; name: string }

type TaskFormProps = {
  profiles: Profile[]
  grants: Grant[]
  stakeholders: Stakeholder[]
  defaultValues?: {
    id: string
    title: string
    body: string | null
    status: TaskStatus
    priority: TaskPriority
    due_date: string | null
    grant_id: string | null
    stakeholder_id: string | null
    assignee_ids: string[]
  }
}

export function TaskForm({ profiles, grants, stakeholders, defaultValues }: TaskFormProps) {
  const isEdit = !!defaultValues
  const [loading, setLoading] = useState(false)
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    defaultValues?.assignee_ids ?? []
  )
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData(formRef.current!)
      fd.set("assignee_ids", JSON.stringify(selectedAssignees))
      if (isEdit) {
        await updateTask(defaultValues.id, fd)
      } else {
        await createTask(fd)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  function toggleAssignee(id: string) {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href={isEdit ? `/activity/tasks/${defaultValues?.id}` : "/activity"}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">{isEdit ? "Edit task" : "New task"}</h2>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="task-title">Title *</Label>
          <Input
            id="task-title"
            name="title"
            required
            placeholder="What needs to be done?"
            defaultValue={defaultValues?.title}
            className="h-10 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-body">Description</Label>
          <Textarea
            id="task-body"
            name="body"
            rows={5}
            placeholder="Add more context, steps, or notes…"
            defaultValue={defaultValues?.body ?? ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-priority">Priority</Label>
            <select
              id="task-priority"
              name="priority"
              defaultValue={defaultValues?.priority ?? "medium"}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="task-status">Status</Label>
              <select
                id="task-status"
                name="status"
                defaultValue={defaultValues?.status ?? "open"}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="task-due">Due date</Label>
            <Input
              id="task-due"
              name="due_date"
              type="date"
              defaultValue={defaultValues?.due_date ?? ""}
              className="h-9"
            />
          </div>
        </div>

        {profiles.length > 0 && (
          <div className="space-y-1.5">
            <Label>Assignees</Label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border p-2 min-h-[44px]">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleAssignee(p.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedAssignees.includes(p.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {p.full_name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {grants.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="task-grant">Linked grant</Label>
              <select
                id="task-grant"
                name="grant_id"
                defaultValue={defaultValues?.grant_id ?? ""}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
              >
                <option value="">None</option>
                {grants.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          {stakeholders.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="task-stakeholder">Linked stakeholder</Label>
              <select
                id="task-stakeholder"
                name="stakeholder_id"
                defaultValue={defaultValues?.stakeholder_id ?? ""}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
              >
                <option value="">None</option>
                {stakeholders.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="gap-2" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create task"}
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href={isEdit ? `/activity/tasks/${defaultValues?.id}` : "/activity"}>
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
