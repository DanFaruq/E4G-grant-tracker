"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { createEvent, updateEvent } from "@/lib/actions/events"
import Link from "next/link"

type Profile = { id: string; full_name: string }
type Grant = { id: string; name: string }

type EventFormProps = {
  profiles: Profile[]
  grants: Grant[]
  defaultValues?: {
    id: string
    title: string
    description: string | null
    event_type: string
    start_at: string
    end_at: string | null
    all_day: boolean
    recurrence: string
    attendee_ids: string[]
    grant_id: string | null
  }
}

export function EventForm({ profiles, grants, defaultValues }: EventFormProps) {
  const isEdit = !!defaultValues
  const [loading, setLoading] = useState(false)
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>(
    defaultValues?.attendee_ids ?? []
  )
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData(formRef.current!)
      fd.set("attendee_ids", JSON.stringify(selectedAttendees))
      if (isEdit) {
        await updateEvent(defaultValues.id, fd)
      } else {
        await createEvent(fd)
      }
    } catch (err) {
      if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err
      toast.error(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  function toggleAttendee(id: string) {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const backHref = isEdit ? `/activity/events/${defaultValues?.id}` : "/activity?tab=events"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">{isEdit ? "Edit event" : "New event"}</h2>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="ev-title">Title *</Label>
          <Input
            id="ev-title"
            name="title"
            required
            placeholder="Team sync, Review call…"
            defaultValue={defaultValues?.title}
            className="h-10 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-type">Event type</Label>
            <select
              id="ev-type"
              name="event_type"
              defaultValue={defaultValues?.event_type ?? "meeting"}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="review">Review</option>
              <option value="call">Call</option>
              <option value="workshop">Workshop</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-recurrence">Recurrence</Label>
            <select
              id="ev-recurrence"
              name="recurrence"
              defaultValue={defaultValues?.recurrence ?? "none"}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-start">Start *</Label>
            <Input
              id="ev-start"
              name="start_at"
              type="datetime-local"
              required
              defaultValue={defaultValues?.start_at ? defaultValues.start_at.slice(0, 16) : ""}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-end">End (optional)</Label>
            <Input
              id="ev-end"
              name="end_at"
              type="datetime-local"
              defaultValue={defaultValues?.end_at ? defaultValues.end_at.slice(0, 16) : ""}
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ev-desc">Description</Label>
          <Textarea
            id="ev-desc"
            name="description"
            rows={4}
            placeholder="What's this event about?"
            defaultValue={defaultValues?.description ?? ""}
          />
        </div>

        {profiles.length > 0 && (
          <div className="space-y-1.5">
            <Label>Attendees</Label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border p-2 min-h-[44px]">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleAttendee(p.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedAttendees.includes(p.id)
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

        {grants.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="ev-grant">Linked grant (optional)</Label>
            <select
              id="ev-grant"
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

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="gap-2" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create event"}
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href={backHref}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
