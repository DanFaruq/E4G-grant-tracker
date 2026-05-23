import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StakeholderForm } from "@/components/stakeholders/stakeholder-form"
import { createStakeholder } from "@/lib/actions/stakeholders"

export default async function NewStakeholderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="p-6 pb-tab-bar max-w-2xl mx-auto space-y-6 animate-fade-up">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground">
          <Link href="/stakeholders">
            <ChevronLeft className="mr-1 size-4" /> Back to Stakeholders
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add Stakeholder</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add a new funder or contact to your stakeholder database.
        </p>
      </div>

      <Card className="p-6">
        <StakeholderForm action={createStakeholder} submitLabel="Create Stakeholder" />
      </Card>
    </div>
  )
}
