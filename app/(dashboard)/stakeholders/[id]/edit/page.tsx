import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StakeholderForm } from "@/components/stakeholders/stakeholder-form"
import { updateStakeholder } from "@/lib/actions/stakeholders"
import type { Database } from "@/types/database"

type StakeholderRow = Database["public"]["Tables"]["stakeholders"]["Row"]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any

export default async function EditStakeholderPage({
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

  const updateWithId = updateStakeholder.bind(null, id)

  return (
    <div className="p-6 pb-tab-bar max-w-2xl mx-auto space-y-6 animate-fade-up">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground">
          <Link href={`/stakeholders/${id}`}>
            <ChevronLeft className="mr-1 size-4" /> Back to Profile
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Stakeholder</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{stakeholder.name}</p>
      </div>

      <Card className="p-6">
        <StakeholderForm
          action={updateWithId}
          defaultValues={{
            name:              stakeholder.name,
            title:             stakeholder.title             ?? "",
            email:             stakeholder.email             ?? "",
            phone:             stakeholder.phone             ?? "",
            organization:      stakeholder.organization      ?? "",
            archetype:         stakeholder.archetype,
            organization_type: stakeholder.organization_type ?? "other",
            linkedin_url:      stakeholder.linkedin_url      ?? "",
            notes:             stakeholder.notes             ?? "",
          }}
          submitLabel="Save Changes"
        />
      </Card>
    </div>
  )
}
