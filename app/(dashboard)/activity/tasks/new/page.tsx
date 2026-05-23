import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { TaskForm } from "@/components/activity/task-form"

export default async function NewTaskPage() {
  const supabase = await createClient()

  const [profilesResult, grantsResult, stakeholdersResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("grants").select("id, name").eq("archived", false).order("name"),
    supabase.from("stakeholders").select("id, name").order("name"),
  ])

  return (
    <div className="flex flex-col min-h-full">
      <Header title="New Task" />
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-6 animate-fade-up">
        <TaskForm
          profiles={profilesResult.data ?? []}
          grants={grantsResult.data ?? []}
          stakeholders={stakeholdersResult.data ?? []}
        />
      </div>
    </div>
  )
}
