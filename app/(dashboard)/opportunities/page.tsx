import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Inbox, ExternalLink, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { promoteOpportunity, dismissOpportunity, snoozeOpportunity } from "@/lib/actions/opportunities"
import type { OpportunityStatus } from "@/types/database"

type OppRow = {
  id: string; source: string; title: string; funder: string | null
  amount_text: string | null; deadline_text: string | null; deadline: string | null
  url: string | null; status: OpportunityStatus; ai_score: number | null
  created_at: string
}

const PAGE_SIZE = 30

const SOURCE_LABELS: Record<string, string> = {
  grants_gov: "Grants.gov RSS",
  rss:        "RSS Feed",
  imap:       "Email Alert",
  manual:     "Manual",
}

function daysLabel(deadline: string | null): { text: string; urgent: boolean } | null {
  if (!deadline) return null
  const diff = Math.round((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { text: "Overdue", urgent: true }
  if (diff === 0) return { text: "Today", urgent: true }
  return { text: `${diff}d`, urgent: diff <= 14 }
}

function MatchBadge({ score }: { score: number | null }) {
  if (score === null) return null
  const pct = score
  const { bg, text } =
    pct >= 90 ? { bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" } :
    pct >= 80 ? { bg: "bg-orange-100 dark:bg-orange-950/40",  text: "text-orange-700 dark:text-orange-400"  } :
    pct >= 70 ? { bg: "bg-blue-100 dark:bg-blue-950/40",      text: "text-blue-700 dark:text-blue-400"      } :
               { bg: "bg-muted",                               text: "text-muted-foreground"                  }
  return (
    <div className={`flex flex-col items-center justify-center size-14 rounded-xl shrink-0 ${bg}`}>
      <span className={`text-lg font-bold leading-none ${text}`}>{pct}%</span>
      <span className={`text-[10px] font-medium mt-0.5 ${text}`}>match</span>
    </div>
  )
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: pageParam } = await searchParams
  const supabase = await createClient()

  const statusFilter =
    status === "dismissed" || status === "promoted" ? status : "pending_review"
  const page = Math.max(1, parseInt(pageParam ?? "1", 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, count } = await supabase
    .from("opportunities")
    .select("id, source, title, funder, amount_text, deadline_text, deadline, url, status, ai_score, created_at", { count: "exact" })
    .eq("status", statusFilter)
    .order("ai_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to)

  const opportunities = (data ?? []) as OppRow[]
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  const tabs = [
    { label: "Pending",   value: "pending_review", href: "/opportunities" },
    { label: "Promoted",  value: "promoted",        href: "/opportunities?status=promoted" },
    { label: "Dismissed", value: "dismissed",       href: "/opportunities?status=dismissed" },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Opportunities" />
      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-5">

        {/* Header row */}
        <div className="flex items-center justify-between gap-4 flex-wrap animate-fade-up">
          <div>
            <h2 className="text-lg font-semibold">Opportunities</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {count ?? 0} {statusFilter.replace("_", " ")} {count === 1 ? "match" : "matches"}
              {statusFilter === "pending_review" ? " pending review" : ""}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b animate-fade-up">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                statusFilter === tab.value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center animate-fade-up">
            <Inbox className="size-10 text-muted-foreground mb-4" />
            <p className="font-medium text-muted-foreground">
              {statusFilter === "pending_review"
                ? "No pending opportunities"
                : `No ${statusFilter} opportunities`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up stagger-1">
            {opportunities.map((opp) => {
              const dl = daysLabel(opp.deadline)
              return (
                <div key={opp.id} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  {/* Top row: title + match badge */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-snug">{opp.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {opp.funder ?? "Unknown funder"}
                        {" · via "}
                        {SOURCE_LABELS[opp.source] ?? opp.source}
                      </p>
                    </div>
                    <MatchBadge score={opp.ai_score} />
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {opp.amount_text && (
                      <span className="font-medium text-foreground">{opp.amount_text}</span>
                    )}
                    {dl && (
                      <span className={`flex items-center gap-1 font-medium ${dl.urgent ? "text-destructive" : ""}`}>
                        <Clock className="size-3" />
                        {opp.deadline_text ?? opp.deadline}
                        {" "}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${dl.urgent ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
                          {dl.text}
                        </span>
                      </span>
                    )}
                    {opp.url && (
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-primary hover:underline ml-auto"
                      >
                        <ExternalLink className="size-3" /> View
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  {statusFilter === "pending_review" && (
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <form action={promoteOpportunity.bind(null, opp.id)} className="flex-1">
                        <Button size="sm" className="w-full gap-1.5 font-semibold">
                          Accept
                        </Button>
                      </form>
                      <form action={snoozeOpportunity.bind(null, opp.id)} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full font-medium">
                          Snooze
                        </Button>
                      </form>
                      <form action={dismissOpportunity.bind(null, opp.id)}>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                          Dismiss
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2 animate-fade-up">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link href={`/opportunities?status=${statusFilter === "pending_review" ? "" : status}&page=${page - 1}`}>
                  <ChevronLeft className="size-4" /> Prev
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="gap-1" disabled>
                <ChevronLeft className="size-4" /> Prev
              </Button>
            )}
            <span className="text-sm text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link href={`/opportunities?status=${status ?? ""}&page=${page + 1}`}>
                  Next <ChevronRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="gap-1" disabled>
                Next <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
