import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { notFound } from "next/navigation"
import { EventForm } from "@/components/activity/event-form"

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [eventResult, profilesResult, grantsResult] = await Promise.all([
    db
      .from("team_events")
      .select(`
        id, title, description, event_type, start_at, end_at, all_day, recurrence, grant_id,
        attendees:event_attendees(profile_id)
      `)
      .eq("id", id)
      .single(),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("grants").select("id, name").eq("archived", false).order("name"),
  ])

  if (!eventResult.data) notFound()

  const ev = eventResult.data as {
    id: string
    title: string
    description: string | null
    event_type: string
    start_at: string
    end_at: string | null
    all_day: boolean
    recurrence: string
    grant_id: string | null
    attendees: { profile_id: string }[]
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Edit Event" />
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-6 animate-fade-up">
        <EventForm
          profiles={profilesResult.data ?? []}
          grants={grantsResult.data ?? []}
          defaultValues={{
            id: ev.id,
            title: ev.title,
            description: ev.description,
            event_type: ev.event_type,
            start_at: ev.start_at,
            end_at: ev.end_at,
            all_day: ev.all_day,
            recurrence: ev.recurrence,
            attendee_ids: ev.attendees.map((a) => a.profile_id),
            grant_id: ev.grant_id,
          }}
        />
      </div>
    </div>
  )
}
