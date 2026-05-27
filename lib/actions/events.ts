"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { eventSchema } from "@/lib/validators/events"
import { notifyUser } from "@/lib/actions/notifications"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return { user, supabase }
}

function parseAttendees(formData: FormData): string[] {
  const raw = formData.get("attendee_ids")
  if (!raw || typeof raw !== "string") return []
  try { return JSON.parse(raw) } catch { return [] }
}

export async function createEvent(formData: FormData) {
  const { user } = await requireAuth()
  const service = await createServiceClient()

  const parsed = eventSchema.safeParse({
    title:          formData.get("title"),
    description:    formData.get("description") || undefined,
    event_type:     formData.get("event_type") || "meeting",
    start_at:       formData.get("start_at"),
    end_at:         formData.get("end_at") || null,
    all_day:        formData.get("all_day") === "true",
    recurrence:     formData.get("recurrence") || "none",
    recurrence_end: formData.get("recurrence_end") || null,
    attendee_ids:   parseAttendees(formData),
    grant_id:       formData.get("grant_id") || null,
    stakeholder_id: formData.get("stakeholder_id") || null,
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { attendee_ids, ...eventData } = parsed.data

  const { data: event, error } = await (service.from("team_events") as AnyTable)
    .insert({ ...eventData, created_by: user.id })
    .select("id")
    .single()
  if (error) throw new Error(error.message)

  if (attendee_ids.length > 0) {
    await (service.from("event_attendees") as AnyTable)
      .insert(attendee_ids.map((profile_id: string) => ({ event_id: event.id, profile_id })))

    const others = attendee_ids.filter((id: string) => id !== user.id)
    await Promise.allSettled(
      others.map((userId: string) =>
        notifyUser({
          userId,
          type:    "event_invited",
          title:   "You've been added to an event",
          body:    parsed.data.title,
          link:    `/activity?tab=events`,
          eventId: event.id,
        })
      )
    )
  }

  revalidatePath("/activity")
  revalidatePath("/activity/recent")
  revalidatePath("/deadlines")
  revalidatePath("/dashboard")
  redirect("/activity?tab=events")
}

export async function updateEvent(id: string, formData: FormData) {
  const { user, supabase } = await requireAuth()

  const { data: event } = await (supabase.from("team_events") as AnyTable)
    .select("created_by")
    .eq("id", id)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if ((event as { created_by?: string } | null)?.created_by !== user.id && (profile as { role?: string } | null)?.role !== "admin") {
    throw new Error("Insufficient permissions")
  }

  const service = await createServiceClient()

  const parsed = eventSchema.safeParse({
    title:          formData.get("title"),
    description:    formData.get("description") || undefined,
    event_type:     formData.get("event_type") || "meeting",
    start_at:       formData.get("start_at"),
    end_at:         formData.get("end_at") || null,
    all_day:        formData.get("all_day") === "true",
    recurrence:     formData.get("recurrence") || "none",
    recurrence_end: formData.get("recurrence_end") || null,
    attendee_ids:   parseAttendees(formData),
    grant_id:       formData.get("grant_id") || null,
    stakeholder_id: formData.get("stakeholder_id") || null,
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { attendee_ids, ...eventData } = parsed.data

  const { error } = await (service.from("team_events") as AnyTable)
    .update(eventData)
    .eq("id", id)
  if (error) throw new Error(error.message)

  await (service.from("event_attendees") as AnyTable).delete().eq("event_id", id)
  if (attendee_ids.length > 0) {
    await (service.from("event_attendees") as AnyTable)
      .insert(attendee_ids.map((profile_id: string) => ({ event_id: id, profile_id })))
  }

  revalidatePath("/activity")
  revalidatePath("/activity/recent")
  revalidatePath("/deadlines")
  revalidatePath("/dashboard")
  redirect("/activity?tab=events")
}

export async function deleteEvent(id: string) {
  const { user, supabase } = await requireAuth()

  const { data: event } = await (supabase.from("team_events") as AnyTable)
    .select("created_by")
    .eq("id", id)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if ((event as { created_by?: string } | null)?.created_by !== user.id && (profile as { role?: string } | null)?.role !== "admin") {
    throw new Error("Insufficient permissions")
  }

  const service = await createServiceClient()
  await (service.from("team_events") as AnyTable).delete().eq("id", id)
  revalidatePath("/activity")
  revalidatePath("/activity/recent")
  revalidatePath("/deadlines")
  revalidatePath("/dashboard")
}
