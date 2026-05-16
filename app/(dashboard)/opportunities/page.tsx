import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Inbox, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { promoteOpportunity, dismissOpportunity } from "@/lib/actions/opportunities"
import { formatDate } from "@/lib/utils"
import type { OpportunityStatus } from "@/types/database"

type OppRow = {
  id: string
  source: string
  title: string
  funder: string | null
  description: string | null
  amount_text: string | null
  deadline_text: string | null
  deadline: string | null
  url: string | null
  status: OpportunityStatus
  ai_score: number | null
  ai_rationale: string | null
  created_at: string
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="outline" className="text-muted-foreground">Unscored</Badge>
  if (score >= 70) return <Badge variant="outline" className="border-green-400 text-green-700 bg-green-50">{score}/100</Badge>
  if (score >= 40) return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">{score}/100</Badge>
  return <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50">{score}/100</Badge>
}

const SOURCE_LABELS: Record<string, string> = {
  grants_gov: "Grants.gov",
  rss: "RSS Feed",
  imap: "Email Alert",
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  const statusFilter = (status === "dismissed" || status === "promoted") ? status : "pending_review"

  const result = await supabase
    .from("opportunities")
    .select("id, source, title, funder, description, amount_text, deadline_text, deadline, url, status, ai_score, ai_rationale, created_at")
    .eq("status", statusFilter)
    .order("ai_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100)

  const opportunities = result.data as OppRow[] | null

  const tabs = [
    { label: "Pending", value: "pending_review", href: "/opportunities" },
    { label: "Promoted", value: "promoted", href: "/opportunities?status=promoted" },
    { label: "Dismissed", value: "dismissed", href: "/opportunities?status=dismissed" },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Opportunities" />
      <div className="flex-1 p-4 md:p-6 space-y-4 max-w-5xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {tabs.map((tab) => (
            <a
              key={tab.value}
              href={tab.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                statusFilter === tab.value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {!opportunities || opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
            <Inbox className="size-10 text-muted-foreground mb-4" />
            <p className="font-medium">
              {statusFilter === "pending_review" ? "No pending opportunities" : `No ${statusFilter} opportunities`}
            </p>
            {statusFilter === "pending_review" && (
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Set a Grants.gov search query in Settings, then trigger the discovery cron or wait for the daily run at 06:00 UTC.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <div key={opp.id} className="rounded-lg border bg-card p-4 space-y-3">
                {/* Title + badges */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-sm">{opp.title}</p>
                    <ScoreBadge score={opp.ai_score} />
                    <Badge variant="secondary" className="text-xs">
                      {SOURCE_LABELS[opp.source] ?? opp.source}
                    </Badge>
                  </div>
                  {opp.funder && (
                    <p className="text-sm text-muted-foreground">{opp.funder}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {opp.amount_text && <span>Amount: {opp.amount_text}</span>}
                    {opp.deadline && <span>Deadline: {formatDate(opp.deadline)}</span>}
                    {opp.url && (
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" /> View source
                      </a>
                    )}
                    <span className="text-muted-foreground/60">Found {formatDate(opp.created_at)}</span>
                  </div>
                </div>

                {opp.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>
                )}

                {opp.ai_rationale && (
                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">AI analysis: </span>
                      {opp.ai_rationale}
                    </p>
                  </div>
                )}

                {/* Action buttons â€” always at the bottom of the card */}
                {statusFilter === "pending_review" && (
                  <div className="flex gap-2 pt-1 border-t border-border/50">
                    <form action={promoteOpportunity.bind(null, opp.id)}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50">
                        <CheckCircle className="size-3.5" /> Promote
                      </Button>
                    </form>
                    <form action={dismissOpportunity.bind(null, opp.id)}>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-destructive">
                        <XCircle className="size-3.5" /> Dismiss
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
