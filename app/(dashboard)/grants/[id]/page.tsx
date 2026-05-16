import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { StageBadge } from "@/components/grants/stage-badge"
import { NotesList } from "@/components/grants/notes-list"
import { MilestonesList } from "@/components/grants/milestones-list"
import { DocumentsList } from "@/components/grants/documents-list"
import { ActivityFeed } from "@/components/grants/activity-feed"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { archiveGrant } from "@/lib/actions/grants"
import Link from "next/link"
import { Pencil, Archive, ExternalLink } from "lucide-react"
import type { GrantStage, UserRole } from "@/types/database"

type GrantDetail = {
  id: string; name: string; funder: string; stage: GrantStage; category: string | null
  description: string | null; deadline: string | null; amount_min: number | null
  amount_max: number | null; amount_exact: number | null; funder_website: string | null
  application_url: string | null
  grant_assignees: { user_id: string; profiles: { id: string; full_name: string; avatar_url: string | null } | null }[]
  milestones: { id: string; title: string; due_date: string; completed: boolean; completed_at: string | null }[]
  progress_notes: { id: string; body: string; pinned: boolean; created_at: string; profiles: { id: string; full_name: string } | null }[]
  documents: { id: string; file_name: string; mime_type: string; size_bytes: number; created_at: string; storage_path: string }[]
  activity_history: { id: string; action: string; metadata: Record<string, unknown> | null; created_at: string; profiles: { id: string; full_name: string } | null }[]
}

export default async function GrantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const grantResult = await supabase
    .from("grants")
    .select(`
      id, name, funder, stage, category, description, deadline,
      amount_min, amount_max, amount_exact, funder_website, application_url,
      grant_assignees(user_id, profiles(id, full_name, avatar_url)),
      milestones(id, title, due_date, completed, completed_at),
      progress_notes(id, body, pinned, created_at, profiles(id, full_name)),
      documents(id, file_name, mime_type, size_bytes, created_at, storage_path),
      activity_history(id, action, metadata, created_at, profiles(id, full_name))
    `)
    .eq("id", id)
    .single()

  const grant = grantResult.data as GrantDetail | null
  if (!grant) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const profileResult = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single()
  const profile = profileResult.data as { role: UserRole } | null

  const canEdit = profile?.role === "admin" || profile?.role === "team_member"

  const archiveWithId = archiveGrant.bind(null, id)

  return (
    <div className="flex flex-col min-h-full">
      <Header title={grant.name} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">

        {/* Title block */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold">{grant.name}</h2>
              <StageBadge stage={grant.stage} />
              {grant.category && (
                <Badge variant="secondary">{grant.category}</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">{grant.funder}</p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/grants/${id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              <form action={archiveWithId}>
                <Button type="submit" variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Archive className="size-4" />
                  Archive
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Key details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Amount</p>
            <p className="font-semibold">
              {grant.amount_exact
                ? formatCurrency(grant.amount_exact)
                : grant.amount_min || grant.amount_max
                ? `${formatCurrency(grant.amount_min)} – ${formatCurrency(grant.amount_max)}`
                : "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Deadline</p>
            <p className="font-semibold">{formatDate(grant.deadline)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Assignees</p>
            <p className="font-semibold">
              {grant.grant_assignees?.length
                ? grant.grant_assignees
                    .map((a: { profiles: { full_name: string } | null }) =>
                      a.profiles?.full_name?.trim() || "Pending"
                    )
                    .join(", ")
                : "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Links</p>
            <div className="flex gap-2">
              {grant.funder_website && (
                <a href={grant.funder_website} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-1">
                  <ExternalLink className="size-3" /> Funder
                </a>
              )}
              {grant.application_url && (
                <a href={grant.application_url} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-1">
                  <ExternalLink className="size-3" /> Apply
                </a>
              )}
              {!grant.funder_website && !grant.application_url && <span className="text-muted-foreground text-sm">—</span>}
            </div>
          </div>
        </div>

        {grant.description && (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium mb-2">Description</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{grant.description}</p>
          </div>
        )}

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="notes">
          <TabsList>
            <TabsTrigger value="notes">
              Notes ({grant.progress_notes?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="milestones">
              Milestones ({grant.milestones?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documents ({grant.documents?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-4">
            <NotesList
              grantId={id}
              notes={grant.progress_notes ?? []}
              canEdit={canEdit}
              currentUserId={user?.id ?? ""}
            />
          </TabsContent>

          <TabsContent value="milestones" className="mt-4">
            <MilestonesList
              grantId={id}
              milestones={grant.milestones ?? []}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <DocumentsList
              grantId={id}
              documents={grant.documents ?? []}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ActivityFeed activities={grant.activity_history ?? []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
