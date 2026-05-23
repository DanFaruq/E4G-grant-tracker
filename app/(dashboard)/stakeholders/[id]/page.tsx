import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Edit, Mail, Phone, ExternalLink, Building2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArchetypeBadge } from "@/components/stakeholders/archetype-badge"
import { StakeholderActivityList } from "@/components/stakeholders/stakeholder-activity-list"
import {
  addStakeholderActivity,
  deleteStakeholderActivity,
  deleteStakeholder,
} from "@/lib/actions/stakeholders"
import type { Database } from "@/types/database"

type StakeholderRow = Database["public"]["Tables"]["stakeholders"]["Row"]
type ActivityRow = Database["public"]["Tables"]["stakeholder_activities"]["Row"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type GrantRow = Database["public"]["Tables"]["grants"]["Row"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

export default async function StakeholderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { id } = await params

  const { data: stakeholder } = await (supabase.from("stakeholders") as AnyTable)
    .select("*")
    .eq("id", id)
    .single() as { data: StakeholderRow | null }

  if (!stakeholder) notFound()

  const { data: profile } = await (supabase.from("profiles") as AnyTable)
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null }

  const isAdmin = profile?.role === "admin"

  const { data: activities } = await (supabase.from("stakeholder_activities") as AnyTable)
    .select("*, profile:profiles(full_name)")
    .eq("stakeholder_id", id)
    .order("occurred_at", { ascending: false }) as {
      data: (ActivityRow & { profile: Pick<ProfileRow, "full_name"> | null })[] | null
    }

  const { data: grantLinks } = await (supabase.from("grant_stakeholders") as AnyTable)
    .select("grant:grants(id, name, stage, funder)")
    .eq("stakeholder_id", id) as {
      data: { grant: Pick<GrantRow, "id" | "name" | "stage" | "funder"> }[] | null
    }

  const grants = (grantLinks ?? []).map((l) => l.grant).filter(Boolean)

  const addActivity = addStakeholderActivity.bind(null, id)
  const handleDelete = deleteStakeholder.bind(null, id)

  return (
    <div className="p-6 pb-tab-bar max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href="/stakeholders">
            <ChevronLeft className="mr-1 size-4" /> Stakeholders
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <form action={handleDelete}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-1.5 size-3.5" /> Delete
              </Button>
            </form>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={`/stakeholders/${id}/edit`}>
              <Edit className="mr-1.5 size-3.5" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                {stakeholder.name.trim().split(/\s+/).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-bold">{stakeholder.name}</h1>
                {stakeholder.title && (
                  <p className="text-sm text-muted-foreground">{stakeholder.title}</p>
                )}
                <div className="mt-2">
                  <ArchetypeBadge archetype={stakeholder.archetype} />
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2.5">
              {stakeholder.organization && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-muted-foreground shrink-0" />
                  <span>{stakeholder.organization}</span>
                </div>
              )}
              {stakeholder.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${stakeholder.email}`} className="hover:text-primary truncate">
                    {stakeholder.email}
                  </a>
                </div>
              )}
              {stakeholder.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${stakeholder.phone}`} className="hover:text-primary">
                    {stakeholder.phone}
                  </a>
                </div>
              )}
              {stakeholder.linkedin_url && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="size-4 text-muted-foreground shrink-0" />
                  <a
                    href={stakeholder.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary truncate"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>

            {stakeholder.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Notes</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{stakeholder.notes}</p>
                </div>
              </>
            )}
          </Card>

          {grants.length > 0 && (
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Associated Grants ({grants.length})
              </p>
              <ul className="space-y-2">
                {grants.map((g) => (
                  <li key={g.id}>
                    <Link
                      href={`/grants/${g.id}`}
                      className="text-sm font-medium hover:text-primary transition-colors block truncate"
                    >
                      {g.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{g.funder}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <Card className="lg:col-span-2 p-6">
          <StakeholderActivityList
            activities={activities ?? []}
            onAdd={addActivity}
            onDelete={async (activityId) => {
              "use server"
              await deleteStakeholderActivity(activityId, id)
            }}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />
        </Card>
      </div>
    </div>
  )
}
