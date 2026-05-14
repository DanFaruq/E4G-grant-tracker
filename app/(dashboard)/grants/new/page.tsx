import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { GrantForm } from "@/components/grants/grant-form"
import { createGrant } from "@/lib/actions/grants"

export default async function NewGrantPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name")

  return (
    <div className="flex flex-col h-full">
      <Header title="New grant" />
      <div className="p-6 max-w-2xl">
        <GrantForm profiles={profiles ?? []} action={createGrant} />
      </div>
    </div>
  )
}
