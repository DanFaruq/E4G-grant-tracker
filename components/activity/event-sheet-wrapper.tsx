"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createEvent } from "@/lib/actions/events"

type Profile = { id: string; full_name: string }
type Grant = { id: string; name: string }

export function EventSheetWrapper({ profiles, grants }: { profiles: Profile[]; grants: Grant[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData(formRef.current!)
      fd.set("attendee_ids", JSON.stringify(selectedAttendees))
      await createEvent(fd)
      toast.success("Event created")
      setOpen(false)
      setSelectedAttendees([])
      formRef.current?.reset()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event")
    } finally {
      setLoading(false)
    }
  }

  function toggleAttendee(id: string) {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8"
        onClick={() => setOpen(true)}
      >
        <CalendarPlus className="size-3.5" />
        New Event
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Create event</SheetTitle>
            <SheetDescription>Schedule a one-time or recurring event for your team.</SheetDescription>
          </SheetHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ev-title">Title *</Label>
              <Input id="ev-title" name="title" required placeholder="Team sync, Review call…" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ev-type">Event type</Label>
                <select id="ev-type" name="event_type" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
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
                <select id="ev-recurrence" name="recurrence" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="none">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-start">Start *</Label>
              <Input id="ev-start" name="start_at" type="datetime-local" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-end">End (optional)</Label>
              <Input id="ev-end" name="end_at" type="datetime-local" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-desc">Description</Label>
              <Textarea id="ev-desc" name="description" rows={3} placeholder="What's this event about?" />
            </div>

            {profiles.length > 0 && (
              <div className="space-y-1.5">
                <Label>Attendees</Label>
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-border p-2">
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
                <select id="ev-grant" name="grant_id" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
                  <option value="">None</option>
                  {grants.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                Create event
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
