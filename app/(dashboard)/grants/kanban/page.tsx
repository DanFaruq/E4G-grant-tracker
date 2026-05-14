import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { KanbanBoard, type KanbanGrant } from "@/components/grants/kanban-board"
import { GrantViewSwitcher } from "@/components/grants/view-switcher"

export default async function KanbanPage() {
  const supabase = await createClient()

  const result = await supabase
    .from("grants")
    .select("id, name, funder, stage, deadline, amount_min, amount_max, amount_exact")
    .eq("archived", false)
    .order("created_at", { ascending: false })

  const grants = (result.data ?? []) as KanbanGrant[]

  return (
    <div className="flex flex-col h-full">
      <Header title="Grants" />
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="flex items-center justify-between mb-4">
          <GrantViewSwitcher active="kanban" />
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanBoard initialGrants={grants} />
        </div>
      </div>
    </div>
  )
}
