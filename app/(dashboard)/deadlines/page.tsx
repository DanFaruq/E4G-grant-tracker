import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { daysUntil } from "@/lib/utils"
import Link from "next/link"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import type { GrantStage } from "@/types/database"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

export default async function DeadlinesPage() {
  const supabase = await createClient()

  const now   = new Date().toISOString()
  const in90  = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const [grantsResult, eventsResult, activitiesResult] = await Promise.all([
    supabase
      .from("grants")
      .select("id, name, funder, stage, deadline")
      .eq("archived", false)
      .not("deadline", "is", null)
      .gte("deadline", now)
      .lte("deadline", in90)
      .not("stage", "in", '("awarded","rejected")')
      .order("deadline", { ascending: true }),
    (supabase.from("team_events") as AnyTable)
      .select("id, title, event_type, start_at")
      .gte("start_at", now)
      .lte("start_at", in90)
      .order("start_at", { ascending: true }),
    supabase
      .from("stakeholder_activities")
      .select("id, stakeholder_id, activity_type, occurred_at, stakeholder:stakeholders(name)")
      .gte("occurred_at", now)
      .lte("occurred_at", in90)
      .order("occurred_at", { ascending: true }),
  ])

  type GrantRow    = { id: string; name: string; funder: string; stage: GrantStage; deadline: string }
  type EventRow    = { id: string; title: string; event_type: string; start_at: string }
  type ActivityRow = { id: string; stakeholder_id: string; activity_type: string; occurred_at: string; stakeholder: { name: string } | null }

  type DeadlineItem =
    | { kind: "grant";    id: string; label: string; sub: string; days: number; href: string }
    | { kind: "event";    id: string; label: string; days: number; href: string }
    | { kind: "activity"; id: string; label: string; days: number; href: string }

  const grants     = (grantsResult.data     ?? []) as GrantRow[]
  const events     = (eventsResult.data     ?? []) as EventRow[]
  const activities = (activitiesResult.data ?? []) as ActivityRow[]

  const activityTypeLabel: Record<string, string> = {
    meeting: "Meeting", email: "Email", call: "Call", follow_up: "Follow-up", note: "Note",
  }

  const items: DeadlineItem[] = [
    ...grants.map((g) => ({
      kind: "grant" as const,
      id: g.id,
      label: g.name,
      sub: g.funder,
      days: daysUntil(g.deadline)!,
      href: `/grants/${g.id}`,
    })),
    ...events.map((ev) => {
      const d = Math.max(0, Math.ceil((new Date(ev.start_at).getTime() - Date.now()) / 86400000))
      return { kind: "event" as const, id: ev.id, label: ev.title, days: d, href: `/activity/events/${ev.id}` }
    }),
    ...activities.map((a) => {
      const d = Math.max(0, Math.ceil((new Date(a.occurred_at).getTime() - Date.now()) / 86400000))
      const stakeName = (a.stakeholder as { name?: string } | null)?.name ?? "Stakeholder"
      return {
        kind: "activity" as const,
        id: a.id,
        label: `${activityTypeLabel[a.activity_type] ?? "Activity"} — ${stakeName}`,
        days: d,
        href: `/stakeholders/${a.stakeholder_id}`,
      }
    }),
  ].sort((a, b) => a.days - b.days)

  const kindColor  = { grant: "bg-amber-400", event: "bg-primary", activity: "bg-emerald-400" }
  const kindLabel  = { grant: "Grant deadline", event: "Event", activity: "Stakeholder activity" }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Upcoming Deadlines" />
      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full animate-fade-up">

        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-5">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </Button>

        {items.length === 0 ? (
          <div className="rounded-xl border bg-card px-4 py-16 text-center">
            <Calendar className="size-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No upcoming deadlines in the next 90 days.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden divide-y">
            {items.map((item) => {
              const urgent = item.days <= 7
              return (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={item.href}
                  className="flex items-stretch hover:bg-muted/30 transition-colors group"
                >
                  <div className={`w-1 shrink-0 ${urgent ? "bg-destructive" : kindColor[item.kind]}`} />
                  <div className="flex items-center justify-between flex-1 px-4 py-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {item.label}
                      </p>
                      {"sub" in item && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {kindLabel[item.kind]}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold shrink-0 ml-4 ${urgent ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
                      <Clock className="size-3 shrink-0" />
                      {item.days === 0 ? "Today" : `${item.days}d`}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
