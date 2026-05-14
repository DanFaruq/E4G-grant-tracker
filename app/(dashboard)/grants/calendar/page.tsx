import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { DeadlineCalendar, type CalendarGrant } from "@/components/grants/deadline-calendar"
import { GrantViewSwitcher } from "@/components/grants/view-switcher"

export default async function CalendarPage() {
  const supabase = await createClient()

  const result = await supabase
    .from("grants")
    .select("id, name, funder, stage, deadline")
    .eq("archived", false)
    .not("deadline", "is", null)
    .order("deadline", { ascending: true })

  const grants = (result.data ?? []) as CalendarGrant[]

  return (
    <div className="flex flex-col h-full">
      <Header title="Grants" />
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="flex items-center justify-between mb-4">
          <GrantViewSwitcher active="calendar" />
        </div>
        <div className="flex-1 overflow-auto">
          <DeadlineCalendar grants={grants} />
        </div>
      </div>
    </div>
  )
}
