import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StakeholderCard } from "@/components/stakeholders/stakeholder-card"
import type { Database, StakeholderArchetype } from "@/types/database"

type StakeholderRow = Database["public"]["Tables"]["stakeholders"]["Row"]

const ARCHETYPES: { value: StakeholderArchetype | "all"; label: string }[] = [
  { value: "all",        label: "All Types"  },
  { value: "government", label: "Government" },
  { value: "foundation", label: "Foundation" },
  { value: "corporate",  label: "Corporate"  },
  { value: "individual", label: "Individual" },
  { value: "other",      label: "Other"      },
]

interface SearchParams {
  q?: string
  archetype?: string
}

export default async function StakeholdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { q, archetype } = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("stakeholders") as any)
    .select("*")
    .order("name", { ascending: true })

  if (archetype && archetype !== "all") {
    query = query.eq("archetype", archetype)
  }

  const { data: stakeholders } = await query as { data: StakeholderRow[] | null }

  const filtered = (stakeholders ?? []).filter((s) => {
    if (!q) return true
    const term = q.toLowerCase()
    return (
      s.name.toLowerCase().includes(term) ||
      (s.organization ?? "").toLowerCase().includes(term) ||
      (s.email ?? "").toLowerCase().includes(term)
    )
  })

  return (
    <div className="p-6 pb-tab-bar space-y-6 animate-fade-up">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stakeholders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/stakeholders/new">
            <Plus className="mr-1.5 size-4" /> Add Stakeholder
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by name, org, or email..."
            className="pl-9"
          />
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {ARCHETYPES.map(({ value, label }) => {
            const isActive = (!archetype && value === "all") || archetype === value
            const href = value === "all"
              ? `/stakeholders${q ? `?q=${q}` : ""}`
              : `/stakeholders?archetype=${value}${q ? `&q=${q}` : ""}`
            return (
              <Link key={value} href={href}>
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                >
                  {label}
                </Button>
              </Link>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No stakeholders found</p>
          <p className="text-sm mt-1">
            {q || archetype ? "Try a different search or filter." : "Add your first stakeholder to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StakeholderCard key={s.id} stakeholder={s} href={`/stakeholders/${s.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}
