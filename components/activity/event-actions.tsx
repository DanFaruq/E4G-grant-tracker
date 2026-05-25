"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { deleteEvent } from "@/lib/actions/events"

export function EventActions({
  eventId,
  isCreator,
  isAdmin,
}: {
  eventId: string
  isCreator: boolean
  isAdmin: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!isCreator && !isAdmin) return null

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteEvent(eventId)
      toast.success("Event deleted")
      router.push("/activity?tab=events")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      Delete
    </Button>
  )
}
