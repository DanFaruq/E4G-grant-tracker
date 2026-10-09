import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { GrantForm } from "@/components/grants/grant-form"
import { createGrant } from "@/lib/actions/grants"
import { distinctCategories } from "@/lib/grant-categories"

export default async function NewGrantPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name")

  const { data: categoryRows } = await supabase.from("grants").select("category").eq("archived", false)

  return (
    <div className="flex flex-col min-h-full">
      <Header title="New grant" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
        <GrantForm profiles={profiles ?? []} action={createGrant} categorySuggestions={distinctCategories(categoryRows ?? [])} />
      </div>
    </div>
  )
}
