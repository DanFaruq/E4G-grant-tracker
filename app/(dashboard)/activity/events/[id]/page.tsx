import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, Pencil, Clock, Calendar, FileText, Users2, RefreshCw,
} from "lucide-react"
import type { EventType, RecurrenceType } from "@/types/database"
import { EventActions } from "@/components/activity/event-actions"

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting:  "Meeting",
  deadline: "Deadline",
  review:   "Review",
  call:     "Call",
  workshop: "Workshop",
  other:    "Other",
}

const RECURRENCE_LABELS: Record<RecurrenceType, string | null> = {
  none:    null,
  daily:   "Daily",
  weekly:  "Weekly",
  monthly: "Monthly",
}

function avatarColor(id: string) {
  const colors = ["oklch(0.55 0.175 38)", "oklch(0.55 0.18 270)", "oklch(0.55 0.18 160)", "oklch(0.55 0.18 330)", "oklch(0.55 0.18 200)"]
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

function formatEventTime(startAt: string, endAt: string | null, allDay: boolean) {
  if (allDay) {
    const d = new Date(startAt).toLocaleDateString("en-GB", { dateStyle: "long" })
    return endAt ? `${d} — ${new Date(endAt).toLocaleDateString("en-GB", { dateStyle: "long" })}` : d
  }
  const start = new Date(startAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
  if (!endAt) return start
  const end = new Date(endAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
  return `${start} → ${end}`
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [eventResult, profileResult] = await Promise.all([
    db
      .from("team_events")
      .select(`
        id, title, description, event_type, start_at, end_at, all_day, recurrence, created_by,
        attendees:event_attendees(profile:profiles(id, full_name)),
        grant:grants(id, name),
        stakeholder:stakeholders(id, name)
      `)
      .eq("id", id)
      .single(),
    supabase.from("profiles").select("role").eq("id", user?.id ?? "").single(),
  ])

  if (!eventResult.data) notFound()

  const ev = eventResult.data as {
    id: string
    title: string
    description: string | null
    event_type: EventType
    start_at: string
    end_at: string | null
    all_day: boolean
    recurrence: RecurrenceType
    created_by: string
    attendees: { profile: { id: string; full_name: string } | null }[]
    grant: { id: string; name: string } | null
    stakeholder: { id: string; name: string } | null
  }

  const userRole = (profileResult.data as { role?: string } | null)?.role
  const isAdmin = userRole === "admin"
  const isCreator = ev.created_by === user?.id
  const attendees = ev.attendees.flatMap((a) => a.profile ? [a.profile] : [])
  const recurrenceLabel = RECURRENCE_LABELS[ev.recurrence]

  return (
    <div className="flex flex-col min-h-full">
      <Header title={ev.title} />
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full animate-fade-up">

        {/* Back + actions row */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <Link href="/activity?tab=events">
              <ArrowLeft className="size-4" />
              Back to events
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {(isCreator || isAdmin) && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={`/activity/events/${id}/edit`}>
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              </Button>
            )}
            <EventActions eventId={id} isCreator={isCreator} isAdmin={isAdmin} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_224px] gap-6">

          {/* ── Main content ── */}
          <div className="space-y-6 min-w-0">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Calendar className="size-5 text-primary shrink-0" />
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {EVENT_TYPE_LABELS[ev.event_type]}
                </span>
                {recurrenceLabel && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {recurrenceLabel}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold">{ev.title}</h1>
            </div>

            {/* Description */}
            {ev.description ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{ev.description}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <p className="text-sm text-muted-foreground">No description provided.</p>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4 lg:shrink-0">
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">

              {/* Attendees */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Attendees
                </p>
                {attendees.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No attendees</p>
                ) : (
                  <div className="space-y-1.5">
                    {attendees.map((a) => {
                      const initials = a.full_name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                      return (
                        <div key={a.id} className="flex items-center gap-2">
                          <div
                            className="flex size-6 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold"
                            style={{ backgroundColor: avatarColor(a.id) }}
                          >
                            {initials}
                          </div>
                          <span className="text-xs font-medium">{a.full_name}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Time */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {ev.all_day ? "Date" : "Time"}
                </p>
                <p className="text-xs flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground shrink-0" />
                  {formatEventTime(ev.start_at, ev.end_at, ev.all_day)}
                </p>
              </div>

              {/* Recurrence */}
              {recurrenceLabel && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Recurrence
                  </p>
                  <p className="text-xs flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 text-muted-foreground" />
                    {recurrenceLabel}
                  </p>
                </div>
              )}

              {/* Linked grant */}
              {ev.grant && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Grant
                  </p>
                  <Link
                    href={`/grants/${(ev.grant as { id: string }).id}`}
                    className="text-xs flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <FileText className="size-3.5" />
                    {(ev.grant as { name: string }).name}
                  </Link>
                </div>
              )}

              {/* Linked stakeholder */}
              {ev.stakeholder && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Stakeholder
                  </p>
                  <Link
                    href={`/stakeholders/${(ev.stakeholder as { id: string }).id}`}
                    className="text-xs flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Users2 className="size-3.5" />
                    {(ev.stakeholder as { name: string }).name}
                  </Link>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
