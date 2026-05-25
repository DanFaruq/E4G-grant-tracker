import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { EventForm } from "@/components/activity/event-form"

export default async function NewEventPage() {
  const supabase = await createClient()

  const [profilesResult, grantsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("grants").select("id, name").eq("archived", false).order("name"),
  ])

  return (
    <div className="flex flex-col min-h-full">
      <Header title="New Event" />
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-6 animate-fade-up">
        <EventForm
          profiles={profilesResult.data ?? []}
          grants={grantsResult.data ?? []}
        />
      </div>
    </div>
  )
}
