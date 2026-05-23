"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { closeTask, reopenTask, deleteTask } from "@/lib/actions/tasks"
import type { TaskStatus } from "@/types/database"

export function TaskActions({
  taskId,
  status,
  isCreator,
  isAdmin,
}: {
  taskId: string
  status: TaskStatus
  isCreator: boolean
  isAdmin: boolean
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const isDone = status === "done" || status === "cancelled"

  async function handle(action: "close" | "reopen" | "delete") {
    setLoading(action)
    try {
      if (action === "close") {
        await closeTask(taskId)
        toast.success("Task closed")
      } else if (action === "reopen") {
        await reopenTask(taskId)
        toast.success("Task reopened")
      } else {
        await deleteTask(taskId)
        toast.success("Task deleted")
        router.push("/activity")
        return
      }
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!isDone && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
          onClick={() => handle("close")}
          disabled={!!loading}
        >
          {loading === "close"
            ? <Loader2 className="size-3.5 animate-spin" />
            : <CheckCircle2 className="size-3.5" />
          }
          Close task
        </Button>
      )}
      {isDone && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => handle("reopen")}
          disabled={!!loading}
        >
          {loading === "reopen"
            ? <Loader2 className="size-3.5 animate-spin" />
            : <RotateCcw className="size-3.5" />
          }
          Reopen
        </Button>
      )}
      {(isCreator || isAdmin) && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => handle("delete")}
          disabled={!!loading}
        >
          {loading === "delete"
            ? <Loader2 className="size-3.5 animate-spin" />
            : <Trash2 className="size-3.5" />
          }
          Delete
        </Button>
      )}
    </div>
  )
}
